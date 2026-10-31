"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { alerts, businesses, listings, notifications, reservations, users } from "@/db/schema";
import { gte, isNull, lte, or } from "drizzle-orm";
import { code } from "@/lib/format";
import { BARRIO_COORDS } from "@/lib/constants";
import { SESSION_COOKIE, getCurrentUser } from "@/lib/session";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/reservas");
  revalidatePath("/comercio");
  revalidatePath("/impacto");
  revalidatePath("/alertas");
}

/**
 * Motor de matching: cuando se publica un rescate, se genera una notificación
 * por cada alerta activa que matchea barrio/categoría/precio/radio.
 * Se evita duplicar avisos para el mismo (usuario, rescate).
 */
export async function matchAlertsForListing(input: {
  listingId: number;
  title: string;
  category: string;
  priceCents: number;
  businessLat: number | null;
  businessLng: number | null;
  barrio: string;
}) {
  try {
    // 1. La alerta tiene que estar activa.
    const conditions = [eq(alerts.activa, true)];

    // 2. Coincidencia de rubro (si la alerta declaró uno).
    const categoryFilter = or(isNull(alerts.categoria), eq(alerts.categoria, input.category));
    if (categoryFilter) conditions.push(categoryFilter);

    // 3. Precio: la alerta acepta hasta su tope (o no declaró tope).
    const priceFilter = or(isNull(alerts.maxPriceCents), gte(alerts.maxPriceCents, input.priceCents));
    if (priceFilter) conditions.push(priceFilter);

    // 4. Si la alerta pide solo gratis, el rescate tiene que ser gratis.
    const gratisFilter = or(eq(alerts.soloGratis, false), eq(alerts.soloGratis, input.priceCents === 0));
    if (gratisFilter) conditions.push(gratisFilter);

    // 5. Ubicación: matchea el barrio declarado O la distancia real dentro del radio.
    if (input.businessLat !== null && input.businessLng !== null) {
      const distanciaKm = sql<number>`6371 * acos(least(1, greatest(-1,
        cos(radians(${users.lat})) * cos(radians(${input.businessLat})) * cos(radians(${input.businessLng}) - radians(${users.lng}))
        + sin(radians(${users.lat})) * sin(radians(${input.businessLat}))
      )))`;
      const radioFilter = or(
        isNull(users.lat),
        eq(alerts.barrio, input.barrio),
        lte(distanciaKm, alerts.radioKm),
      );
      if (radioFilter) conditions.push(radioFilter);
    } else {
      const barrioFilter = or(isNull(alerts.barrio), eq(alerts.barrio, input.barrio));
      if (barrioFilter) conditions.push(barrioFilter);
    }

    const candidates = await db
      .select({ id: alerts.id, userId: alerts.userId })
      .from(alerts)
      .innerJoin(users, eq(alerts.userId, users.id))
      .where(and(...conditions))
      .limit(200);

    if (candidates.length === 0) return 0;

    // Excluir a quien ya recibió este aviso y al propio comercio.
    const existing = await db
      .select({ userId: notifications.userId })
      .from(notifications)
      .where(eq(notifications.listingId, input.listingId));
    const already = new Set(existing.map((e) => e.userId));

    const rows = candidates
      .filter((c) => !already.has(c.userId))
      .map((c) => ({
        userId: c.userId,
        alertId: c.id,
        listingId: input.listingId,
        titulo: `${input.title} · ${input.priceCents === 0 ? "gratis" : `$${(input.priceCents / 100).toFixed(0)}`} en ${input.barrio}`,
      }));

    if (rows.length === 0) return 0;
    await db.insert(notifications).values(rows);
    return rows.length;
  } catch (error) {
    console.error("[rescate] matching de alertas falló:", error);
    return 0;
  }
}

export async function setSession(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const next = String(formData.get("next") ?? "/");
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidateAll();
  redirect(next);
}

export async function reserveListing(formData: FormData) {
  const user = await getCurrentUser();
  const listingId = Number(formData.get("listingId"));
  const quantity = Math.max(1, Math.min(10, Number(formData.get("quantity") ?? 1)));

  if (!user) {
    redirect(`/rescate/${listingId}?error=${encodeURIComponent("Elegí un perfil para reservar")}`);
  }
  if (!Number.isFinite(listingId)) {
    redirect("/?error=rescate-inexistente");
  }

  const updated = await db
    .update(listings)
    .set({ quantityAvailable: sql`${listings.quantityAvailable} - ${quantity}` })
    .where(
      and(
        eq(listings.id, listingId),
        eq(listings.status, "activo"),
        sql`${listings.quantityAvailable} >= ${quantity}`,
      ),
    )
    .returning({ id: listings.id });

  if (updated.length === 0) {
    redirect(`/rescate/${listingId}?error=${encodeURIComponent("Ya no queda esa cantidad")}`);
  }

  const rows = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  const current = rows[0];
  if (current && current.quantityAvailable <= 0) {
    await db.update(listings).set({ status: "agotado" }).where(eq(listings.id, listingId));
  }

  const reservationCode = code();
  await db.insert(reservations).values({
    listingId,
    userId: user.id,
    quantity,
    code: reservationCode,
    status: "confirmada",
  });

  revalidateAll();
  redirect(`/reservas?nuevo=${reservationCode}`);
}

export async function cancelReservation(formData: FormData) {
  const user = await getCurrentUser();
  const id = Number(formData.get("reservationId"));
  if (!user || !Number.isFinite(id)) return;

  const rows = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.id, id), eq(reservations.userId, user.id)))
    .limit(1);
  const reservation = rows[0];
  if (!reservation || reservation.status === "recogida") return;

  await db.update(reservations).set({ status: "cancelada" }).where(eq(reservations.id, id));
  await db
    .update(listings)
    .set({
      quantityAvailable: sql`least(${listings.quantityTotal}, ${listings.quantityAvailable} + ${reservation.quantity})`,
      status: "activo",
    })
    .where(eq(listings.id, reservation.listingId));

  revalidateAll();
}

export async function markCollected(formData: FormData) {
  const user = await getCurrentUser();
  const id = Number(formData.get("reservationId"));
  if (!user || !Number.isFinite(id)) return;
  await db
    .update(reservations)
    .set({ status: "recogida" })
    .where(and(eq(reservations.id, id), eq(reservations.userId, user.id)));
  revalidateAll();
}

export async function setReservationStatus(formData: FormData) {
  const user = await getCurrentUser();
  const id = Number(formData.get("reservationId"));
  const status = String(formData.get("status") ?? "");
  if (!user || !Number.isFinite(id)) return;
  if (!["recogida", "cancelada", "confirmada"].includes(status)) return;

  const owned = await db
    .select({ id: reservations.id, listingId: reservations.listingId, quantity: reservations.quantity })
    .from(reservations)
    .innerJoin(listings, eq(reservations.listingId, listings.id))
    .innerJoin(businesses, eq(listings.businessId, businesses.id))
    .where(and(eq(reservations.id, id), eq(businesses.ownerId, user.id)))
    .limit(1);

  const reservation = owned[0];
  if (!reservation) return;

  await db.update(reservations).set({ status }).where(eq(reservations.id, id));

  if (status === "cancelada") {
    await db
      .update(listings)
      .set({
        quantityAvailable: sql`least(${listings.quantityTotal}, ${listings.quantityAvailable} + ${reservation.quantity})`,
        status: "activo",
      })
      .where(eq(listings.id, reservation.listingId));
  }
  if (status === "recogida") {
    // Solo se agota cuando realmente no queda stock disponible.
    await db
      .update(listings)
      .set({
        status: sql`case when ${listings.quantityAvailable} <= 0 then 'agotado' else ${listings.status} end`,
      })
      .where(eq(listings.id, reservation.listingId));
  }

  revalidateAll();
}

export async function createListing(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/comercio?error=" + encodeURIComponent("Elegí un perfil de comercio"));

  const owned = await db.select().from(businesses).where(eq(businesses.ownerId, user.id)).limit(1);
  const business = owned[0];
  if (!business) {
    redirect("/comercio?error=" + encodeURIComponent("Tu usuario no tiene un comercio asociado"));
  }

  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const description = String(formData.get("description") ?? "").trim().slice(0, 800);
  const category = String(formData.get("category") ?? "panaderia");
  const emoji = String(formData.get("emoji") ?? "🥗").slice(0, 8) || "🥗";
  const reason = String(formData.get("reason") ?? "Sobrante del día");
  const unitLabel = String(formData.get("unitLabel") ?? "unidad").trim() || "unidad";
  const originalPrice = Math.max(0, Number(formData.get("originalPrice") ?? 0));
  const price = Math.max(0, Number(formData.get("price") ?? 0));
  const quantity = Math.max(1, Math.min(200, Number(formData.get("quantity") ?? 1)));
  const unitGrams = Math.max(20, Math.min(20000, Number(formData.get("unitGrams") ?? 400)));
  const pickupInHours = Math.max(0.5, Math.min(48, Number(formData.get("pickupIn") ?? 4)));
  const windowHours = Math.max(1, Math.min(12, Number(formData.get("windowHours") ?? 4)));

  if (title.length < 4) {
    redirect("/comercio?error=" + encodeURIComponent("Poné un título de al menos 4 caracteres"));
  }
  if (price > originalPrice) {
    redirect("/comercio?error=" + encodeURIComponent("El precio de rescate no puede superar el original"));
  }

  const now = Date.now();
  const created = await db
    .insert(listings)
    .values({
      businessId: business.id,
      title,
      description,
      category,
      emoji,
      originalPriceCents: Math.round(originalPrice * 100),
      priceCents: Math.round(price * 100),
      quantityTotal: quantity,
      quantityAvailable: quantity,
      unitLabel,
      unitGrams,
      reason,
      pickupFrom: new Date(now + pickupInHours * 3600_000),
      pickupUntil: new Date(now + (pickupInHours + windowHours) * 3600_000),
      status: "activo",
    })
    .returning({ id: listings.id });

  // Notificar a los vecinos que pidieron ser avisados de algo así.
  if (created[0]) {
    const avisados = await matchAlertsForListing({
      listingId: created[0].id,
      title,
      category,
      priceCents: Math.round(price * 100),
      businessLat: business.lat,
      businessLng: business.lng,
      barrio: business.barrio,
    });
    revalidateAll();
    redirect(
      "/comercio?ok=" +
        encodeURIComponent(
          avisados > 0
            ? `Rescate publicado 🎉 · ${avisados} ${avisados === 1 ? "vecino avisado" : "vecinos avisados"} por sus alertas`
            : "Rescate publicado 🎉",
        ),
    );
  }

  revalidateAll();
  redirect("/comercio?ok=" + encodeURIComponent("Rescate publicado 🎉"));
}

export async function createBusiness(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/comercio?error=" + encodeURIComponent("Elegí un perfil primero"));

  const existing = await db.select().from(businesses).where(eq(businesses.ownerId, user.id)).limit(1);
  if (existing[0]) redirect("/comercio");

  const name = String(formData.get("name") ?? "").trim().slice(0, 140);
  if (name.length < 3) {
    redirect("/comercio?error=" + encodeURIComponent("El nombre del comercio es demasiado corto"));
  }

  await db.insert(businesses).values({
    ownerId: user.id,
    name,
    type: String(formData.get("type") ?? "panaderia"),
    barrio: String(formData.get("barrio") ?? user.barrio),
    address: String(formData.get("address") ?? "").trim().slice(0, 180) || "Sin dirección",
    emoji: String(formData.get("emoji") ?? "🏬").slice(0, 8) || "🏬",
    bio: String(formData.get("bio") ?? "").trim().slice(0, 400),
    verified: false,
  });

  revalidateAll();
  redirect("/comercio?ok=" + encodeURIComponent("¡Comercio registrado! Publicá tu primer rescate 🎉"));
}

export async function setListingStatus(formData: FormData) {
  const user = await getCurrentUser();
  const listingId = Number(formData.get("listingId"));
  const status = String(formData.get("status") ?? "");
  if (!user || !Number.isFinite(listingId) || !["activo", "cerrado"].includes(status)) return;

  const owned = await db
    .select({ id: listings.id })
    .from(listings)
    .innerJoin(businesses, eq(listings.businessId, businesses.id))
    .where(and(eq(listings.id, listingId), eq(businesses.ownerId, user.id)))
    .limit(1);

  if (owned.length === 0) return;

  await db.update(listings).set({ status }).where(eq(listings.id, listingId));
  revalidateAll();
}

/* ---------------- Sector del vecino y alertas ---------------- */

export async function saveSector(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/alertas?error=" + encodeURIComponent("Elegí un perfil primero"));

  const barrio = String(formData.get("barrio") ?? user.barrio);
  const radioKm = Math.max(1, Math.min(20, Number(formData.get("radioKm") ?? 2)));
  const coords = BARRIO_COORDS[barrio] ?? null;

  await db
    .update(users)
    .set({
      barrio,
      radioKm,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    .where(eq(users.id, user.id));

  revalidateAll();
  redirect("/alertas?ok=" + encodeURIComponent(`Sector actualizado: ${barrio} a ${radioKm} km`));
}

export async function createAlert(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/alertas?error=" + encodeURIComponent("Elegí un perfil primero"));

  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 80) || "Mi alerta";
  const categoriaRaw = String(formData.get("categoria") ?? "");
  const maxPrice = Number(formData.get("maxPrice") ?? 0);
  const barrioRaw = String(formData.get("barrio") ?? "");
  const radioKm = Math.max(1, Math.min(20, Number(formData.get("radioKm") ?? user.radioKm)));

  await db.insert(alerts).values({
    userId: user.id,
    nombre,
    barrio: barrioRaw || null,
    categoria: categoriaRaw || null,
    maxPriceCents: maxPrice > 0 ? Math.round(maxPrice * 100) : null,
    soloGratis: formData.get("soloGratis") === "1",
    radioKm,
    activa: true,
  });

  revalidateAll();
  redirect("/alertas?ok=" + encodeURIComponent(`Alerta "${nombre}" activada 🔔`));
}

export async function toggleAlert(formData: FormData) {
  const user = await getCurrentUser();
  const id = Number(formData.get("alertId"));
  if (!user || !Number.isFinite(id)) return;

  const owned = await db
    .select({ id: alerts.id, activa: alerts.activa })
    .from(alerts)
    .where(and(eq(alerts.id, id), eq(alerts.userId, user.id)))
    .limit(1);
  if (!owned[0]) return;

  await db.update(alerts).set({ activa: !owned[0].activa }).where(eq(alerts.id, id));
  revalidateAll();
}

export async function deleteAlert(formData: FormData) {
  const user = await getCurrentUser();
  const id = Number(formData.get("alertId"));
  if (!user || !Number.isFinite(id)) return;
  await db.delete(alerts).where(and(eq(alerts.id, id), eq(alerts.userId, user.id)));
  revalidateAll();
}

export async function markNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;
  await db.update(notifications).set({ leido: true }).where(eq(notifications.userId, user.id));
  revalidateAll();
}

/** Simula el push de una alerta: re-evalúa las alertas activas del usuario. */
export async function simulateAlertScan() {
  const user = await getCurrentUser();
  if (!user) return;

  const mine = await db.select().from(alerts).where(and(eq(alerts.userId, user.id), eq(alerts.activa, true)));
  if (mine.length === 0) return;

  const activos = await db
    .select({
      id: listings.id,
      title: listings.title,
      category: listings.category,
      priceCents: listings.priceCents,
      pickupUntil: listings.pickupUntil,
      lat: businesses.lat,
      lng: businesses.lng,
      barrio: businesses.barrio,
    })
    .from(listings)
    .innerJoin(businesses, eq(listings.businessId, businesses.id))
    .where(eq(listings.status, "activo"))
    .limit(50);

  const now = Date.now();
  const yaAvisados = new Set(
    (
      await db
        .select({ listingId: notifications.listingId })
        .from(notifications)
        .where(eq(notifications.userId, user.id))
    ).map((n) => n.listingId),
  );

  const nuevos: { userId: number; alertId: number; listingId: number; titulo: string }[] = [];
  for (const alert of mine) {
    for (const item of activos) {
      if (yaAvisados.has(item.id)) continue;
      if (item.pickupUntil.getTime() < now) continue;
      if (alert.categoria && alert.categoria !== item.category) continue;
      if (alert.maxPriceCents !== null && item.priceCents > alert.maxPriceCents) continue;
      if (alert.soloGratis && item.priceCents !== 0) continue;

      const enRadio =
        alert.barrio === item.barrio ||
        (user.lat !== null &&
          user.lng !== null &&
          item.lat !== null &&
          item.lng !== null &&
          haversineKm(user.lat, user.lng, item.lat, item.lng) <= alert.radioKm);
      if (!enRadio) continue;

      nuevos.push({
        userId: user.id,
        alertId: alert.id,
        listingId: item.id,
        titulo: `${item.title} · ${item.priceCents === 0 ? "gratis" : `$${(item.priceCents / 100).toFixed(0)}`} en ${item.barrio}`,
      });
    }
  }

  if (nuevos.length > 0) {
    await db.insert(notifications).values(nuevos);
  }
  revalidateAll();
  redirect(
    "/alertas?ok=" +
      encodeURIComponent(
        nuevos.length > 0
          ? `Barrido completo: ${nuevos.length} ${nuevos.length === 1 ? "aviso nuevo" : "avisos nuevos"} para tus alertas`
          : "Barrido completo: por ahora no hay rescates que matcheen",
      ),
  );
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2) - toRad(lng1)) +
    Math.sin(toRad(lat1)) * Math.sin(toRad(lat2));
  return 6371 * Math.acos(Math.max(-1, Math.min(1, a)));
}
