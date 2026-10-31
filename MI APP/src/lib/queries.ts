import { and, asc, desc, eq, gt, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { alerts, businesses, listings, notifications, reservations, users } from "@/db/schema";
import { CO2_KG_PER_FOOD_KG, MEALS_PER_FOOD_KG } from "@/lib/constants";

export type ListingRow = {
  id: number;
  title: string;
  description: string;
  category: string;
  emoji: string;
  originalPriceCents: number;
  priceCents: number;
  quantityTotal: number;
  quantityAvailable: number;
  unitLabel: string;
  unitGrams: number;
  reason: string;
  pickupFrom: Date;
  pickupUntil: Date;
  status: string;
  businessId: number;
  businessName: string;
  businessType: string;
  businessEmoji: string;
  barrio: string;
  address: string;
  verified: boolean;
  /** Kilómetros a pie hasta el comercio, cuando el vecino tiene sector configurado. */
  distanceKm?: number | null;
};

const listingSelection = {
  id: listings.id,
  title: listings.title,
  description: listings.description,
  category: listings.category,
  emoji: listings.emoji,
  originalPriceCents: listings.originalPriceCents,
  priceCents: listings.priceCents,
  quantityTotal: listings.quantityTotal,
  quantityAvailable: listings.quantityAvailable,
  unitLabel: listings.unitLabel,
  unitGrams: listings.unitGrams,
  reason: listings.reason,
  pickupFrom: listings.pickupFrom,
  pickupUntil: listings.pickupUntil,
  status: listings.status,
  businessId: businesses.id,
  businessName: businesses.name,
  businessType: businesses.type,
  businessEmoji: businesses.emoji,
  barrio: businesses.barrio,
  address: businesses.address,
  verified: businesses.verified,
};

export type ListingFilters = {
  q?: string;
  barrio?: string;
  categoria?: string;
  soloGratis?: boolean;
  maxPriceCents?: number;
  orden?: "pronto" | "precio" | "descuento" | "reciente" | "cerca";
  /** Coordenadas del vecino para calcular distancia a pie. */
  origen?: { lat: number; lng: number; radioKm?: number } | null;
};

/** Distancia Haversine en kilómetros entre el vecino y el comercio. */
function distanceExpr(origen: { lat: number; lng: number }) {
  return sql<number | null>`6371 * acos(least(1, greatest(-1,
    cos(radians(${businesses.lat})) * cos(radians(${origen.lat})) * cos(radians(${origen.lng}) - radians(${businesses.lng}))
    + sin(radians(${businesses.lat})) * sin(radians(${origen.lat}))
  )))`;
}

export async function getListings(filters: ListingFilters = {}): Promise<ListingRow[]> {
  const conditions = [eq(listings.status, "activo"), gt(listings.pickupUntil, new Date())];

  if (filters.q && filters.q.trim().length > 0) {
    const like = `%${filters.q.trim()}%`;
    const search = or(
      ilike(listings.title, like),
      ilike(listings.description, like),
      ilike(businesses.name, like),
    );
    if (search) conditions.push(search);
  }
  if (filters.barrio) conditions.push(eq(businesses.barrio, filters.barrio));
  if (filters.categoria) conditions.push(eq(listings.category, filters.categoria));
  if (filters.soloGratis) conditions.push(eq(listings.priceCents, 0));
  if (filters.maxPriceCents !== undefined) {
    conditions.push(sql`${listings.priceCents} <= ${filters.maxPriceCents}`);
  }

  const discountExpr = sql`case when ${listings.originalPriceCents} > 0
      then (${listings.originalPriceCents} - ${listings.priceCents})::float / ${listings.originalPriceCents}
      else 0 end`;

  // Modo "cerca": filtra por radio y ordena por distancia real a pie.
  if (filters.orden === "cerca" && filters.origen) {
    const dist = distanceExpr(filters.origen);
    if (filters.origen.radioKm) {
      conditions.push(sql`${dist} <= ${filters.origen.radioKm}`);
    }
    const rows = await db
      .select({ ...listingSelection, distanceKm: dist })
      .from(listings)
      .innerJoin(businesses, eq(listings.businessId, businesses.id))
      .where(and(...conditions))
      .orderBy(asc(dist), asc(listings.pickupUntil))
      .limit(60);
    return rows;
  }

  const orderBy =
    filters.orden === "precio"
      ? [asc(listings.priceCents), asc(listings.pickupUntil)]
      : filters.orden === "descuento"
        ? [desc(discountExpr), asc(listings.pickupUntil)]
        : filters.orden === "reciente"
          ? [desc(listings.createdAt)]
          : [asc(listings.pickupUntil), desc(discountExpr)];

  const selection =
    filters.origen ? { ...listingSelection, distanceKm: distanceExpr(filters.origen) } : listingSelection;

  const rows = await db
    .select(selection)
    .from(listings)
    .innerJoin(businesses, eq(listings.businessId, businesses.id))
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(60);

  return rows as ListingRow[];
}

export async function getListing(
  id: number,
  origen?: { lat: number; lng: number } | null,
): Promise<ListingRow | null> {
  const selection = origen
    ? { ...listingSelection, distanceKm: distanceExpr(origen) }
    : listingSelection;
  const rows = await db
    .select(selection)
    .from(listings)
    .innerJoin(businesses, eq(listings.businessId, businesses.id))
    .where(eq(listings.id, id))
    .limit(1);
  return (rows[0] as ListingRow | undefined) ?? null;
}

export async function getReservationsForUser(userId: number) {
  return db
    .select({
      id: reservations.id,
      quantity: reservations.quantity,
      code: reservations.code,
      status: reservations.status,
      createdAt: reservations.createdAt,
      listingId: listings.id,
      listingTitle: listings.title,
      emoji: listings.emoji,
      priceCents: listings.priceCents,
      originalPriceCents: listings.originalPriceCents,
      unitGrams: listings.unitGrams,
      pickupFrom: listings.pickupFrom,
      pickupUntil: listings.pickupUntil,
      businessName: businesses.name,
      businessAddress: businesses.address,
      barrio: businesses.barrio,
      businessEmoji: businesses.emoji,
    })
    .from(reservations)
    .innerJoin(listings, eq(reservations.listingId, listings.id))
    .innerJoin(businesses, eq(listings.businessId, businesses.id))
    .where(eq(reservations.userId, userId))
    .orderBy(desc(reservations.createdAt))
    .limit(50);
}

export async function getBusinessByOwner(ownerId: number) {
  const rows = await db.select().from(businesses).where(eq(businesses.ownerId, ownerId)).limit(1);
  return rows[0] ?? null;
}

/* ---------------- Alertas y notificaciones ---------------- */

export async function getAlertsForUser(userId: number) {
  return db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt))
    .limit(20);
}

export async function getNotificationsForUser(userId: number, limit = 20) {
  return db
    .select({
      id: notifications.id,
      titulo: notifications.titulo,
      leido: notifications.leido,
      createdAt: notifications.createdAt,
      alertNombre: alerts.nombre,
      listingId: notifications.listingId,
      listingTitle: listings.title,
      emoji: listings.emoji,
      priceCents: listings.priceCents,
      pickupUntil: listings.pickupUntil,
      businessName: businesses.name,
      barrio: businesses.barrio,
    })
    .from(notifications)
    .leftJoin(alerts, eq(notifications.alertId, alerts.id))
    .innerJoin(listings, eq(notifications.listingId, listings.id))
    .innerJoin(businesses, eq(listings.businessId, businesses.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function countUnreadNotifications(userId: number): Promise<number> {
  try {
    const rows = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.leido, false)));
    return Number(rows[0]?.value ?? 0);
  } catch {
    return 0;
  }
}

/** Longitud de la lista de rescates para poder describir el match. */
export async function getAlertMatchCount(userId: number): Promise<number> {
  try {
    const rows = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(notifications)
      .innerJoin(listings, eq(notifications.listingId, listings.id))
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.leido, false),
          eq(listings.status, "activo"),
        ),
      );
    return Number(rows[0]?.value ?? 0);
  } catch {
    return 0;
  }
}

export async function getBusinessListings(businessId: number) {
  return db
    .select(listingSelection)
    .from(listings)
    .innerJoin(businesses, eq(listings.businessId, businesses.id))
    .where(eq(listings.businessId, businessId))
    .orderBy(desc(listings.createdAt))
    .limit(50);
}

export async function getBusinessReservations(businessId: number) {
  return db
    .select({
      id: reservations.id,
      quantity: reservations.quantity,
      code: reservations.code,
      status: reservations.status,
      createdAt: reservations.createdAt,
      listingTitle: listings.title,
      unitGrams: listings.unitGrams,
      pickupUntil: listings.pickupUntil,
      userName: users.name,
      userEmoji: users.emoji,
      userBarrio: users.barrio,
    })
    .from(reservations)
    .innerJoin(listings, eq(reservations.listingId, listings.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .where(eq(listings.businessId, businessId))
    .orderBy(desc(reservations.createdAt))
    .limit(50);
}

export type Stats = {
  rescatesActivos: number;
  comercios: number;
  vecinos: number;
  reservasRecogidas: number;
  kgRescatados: number;
  kgDisponibles: number;
  co2Evitado: number;
  raciones: number;
  ahorroVecinos: number;
};

async function scalar(query: Promise<{ value: number | null }[]>): Promise<number> {
  const rows = await query;
  return Number(rows[0]?.value ?? 0);
}

export async function getStats(): Promise<Stats> {
  const now = new Date();

  const [rescatesActivos, comercios, vecinos, recogidas, kg, disponibles, ahorro] = await Promise.all([
    scalar(
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(listings)
        .where(and(eq(listings.status, "activo"), gt(listings.pickupUntil, now))),
    ),
    scalar(db.select({ value: sql<number>`count(*)::int` }).from(businesses)),
    scalar(db.select({ value: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "vecino"))),
    scalar(
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(reservations)
        .where(eq(reservations.status, "recogida")),
    ),
    scalar(
      db
        .select({
          value: sql<number>`coalesce(sum(${reservations.quantity} * ${listings.unitGrams}), 0)::int`,
        })
        .from(reservations)
        .innerJoin(listings, eq(reservations.listingId, listings.id))
        .where(eq(reservations.status, "recogida")),
    ),
    scalar(
      db
        .select({ value: sql<number>`coalesce(sum(${listings.quantityAvailable} * ${listings.unitGrams}), 0)::int` })
        .from(listings)
        .where(and(eq(listings.status, "activo"), gt(listings.pickupUntil, now))),
    ),
    scalar(
      db
        .select({
          value: sql<number>`coalesce(sum(${reservations.quantity} * (${listings.originalPriceCents} - ${listings.priceCents})), 0)::int`,
        })
        .from(reservations)
        .innerJoin(listings, eq(reservations.listingId, listings.id))
        .where(eq(reservations.status, "recogida")),
    ),
  ]);

  const kgRescatados = kg / 1000;
  return {
    rescatesActivos: rescatesActivos,
    comercios,
    vecinos,
    reservasRecogidas: recogidas,
    kgRescatados,
    kgDisponibles: disponibles / 1000,
    co2Evitado: kgRescatados * CO2_KG_PER_FOOD_KG,
    raciones: kgRescatados * MEALS_PER_FOOD_KG,
    ahorroVecinos: ahorro / 100,
  };
}

export async function getImpactByBarrio() {
  return db
    .select({
      barrio: businesses.barrio,
      kg: sql<number>`coalesce(sum(${reservations.quantity} * ${listings.unitGrams}), 0)::float / 1000`,
      rescates: sql<number>`count(*)::int`,
    })
    .from(reservations)
    .innerJoin(listings, eq(reservations.listingId, listings.id))
    .innerJoin(businesses, eq(listings.businessId, businesses.id))
    .where(eq(reservations.status, "recogida"))
    .groupBy(businesses.barrio)
    .orderBy(desc(sql`coalesce(sum(${reservations.quantity} * ${listings.unitGrams}), 0)`));
}

export async function getImpactByCategory() {
  return db
    .select({
      category: listings.category,
      kg: sql<number>`coalesce(sum(${reservations.quantity} * ${listings.unitGrams}), 0)::float / 1000`,
      rescates: sql<number>`count(*)::int`,
    })
    .from(reservations)
    .innerJoin(listings, eq(reservations.listingId, listings.id))
    .where(eq(reservations.status, "recogida"))
    .groupBy(listings.category)
    .orderBy(desc(sql`coalesce(sum(${reservations.quantity} * ${listings.unitGrams}), 0)`));
}

export async function getTopBusinesses(limit = 5) {
  return db
    .select({
      name: businesses.name,
      emoji: businesses.emoji,
      barrio: businesses.barrio,
      kg: sql<number>`coalesce(sum(${reservations.quantity} * ${listings.unitGrams}), 0)::float / 1000`,
      rescates: sql<number>`count(${reservations.id})::int`,
    })
    .from(businesses)
    .leftJoin(listings, eq(listings.businessId, businesses.id))
    .leftJoin(
      reservations,
      and(eq(reservations.listingId, listings.id), eq(reservations.status, "recogida")),
    )
    .groupBy(businesses.id, businesses.name, businesses.emoji, businesses.barrio)
    .orderBy(desc(sql`coalesce(sum(${reservations.quantity} * ${listings.unitGrams}), 0)`))
    .limit(limit);
}
