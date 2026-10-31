import Link from "next/link";
import { createBusiness, createListing, setListingStatus, setReservationStatus } from "@/app/actions";
import { Badge, EmptyState, Flash, Progress, StatCard } from "@/components/ui";
import { BARRIOS, BUSINESS_TYPES, CATEGORIES, REASONS } from "@/lib/constants";
import {
  discountPercent,
  formatKg,
  formatNumber,
  formatPickupWindow,
  formatPrice,
  pickupState,
  relative,
} from "@/lib/format";
import { getBusinessByOwner, getBusinessListings, getBusinessReservations, getStats } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ComercioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        emoji="👤"
        title="Elegí un perfil de comercio"
        description="Usá el selector de la esquina superior derecha y elegí a Sofía, Bruno o Kelvin para ver el panel del comercio."
      />
    );
  }

  const business = await getBusinessByOwner(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Flash tone="error">{sp.error ? `⚠️ ${String(sp.error)}` : ""}</Flash>
        <div className="card p-6">
          <p className="text-[11px] font-black tracking-[0.16em] text-leaf uppercase">Onboarding</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Registrá tu comercio</h1>
          <p className="mt-1 text-sm text-bark/65">
            Tres datos y ya podés publicar rescates. Sin contratos ni costos fijos: solo publicás lo que
            te sobra.
          </p>
          <form action={createBusiness} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name">Nombre del comercio</label>
              <input id="name" name="name" placeholder="Panadería del barrio" className="mt-1" required />
            </div>
            <div>
              <label htmlFor="type">Rubro</label>
              <select id="type" name="type" className="mt-1">
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="barrio">Barrio</label>
              <select id="barrio" name="barrio" defaultValue={user.barrio} className="mt-1">
                {BARRIOS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address">Dirección</label>
              <input id="address" name="address" placeholder="Av. Siempre Viva 1234" className="mt-1" />
            </div>
            <div>
              <label htmlFor="emoji">Ícono</label>
              <select id="emoji" name="emoji" className="mt-1">
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.slug} value={t.emoji}>
                    {t.emoji}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="bio">¿Qué suele sobrarte?</label>
              <textarea id="bio" name="bio" rows={3} placeholder="Facturas y pan al cierre, todos los días." className="mt-1" />
            </div>
            <button type="submit" className="btn-primary sm:col-span-2">
              Registrar comercio
            </button>
          </form>
        </div>
      </div>
    );
  }

  const [listings, reservations, stats] = await Promise.all([
    getBusinessListings(business.id),
    getBusinessReservations(business.id),
    getStats(),
  ]);

  const activos = listings.filter((l) => l.status === "activo" && l.quantityAvailable > 0);
  const pendientes = reservations.filter((r) => r.status === "confirmada");
  const recogidas = reservations.filter((r) => r.status === "recogida");
  const kgRescatados =
    recogidas.reduce((acc, r) => acc + (r.quantity * r.unitGrams) / 1000, 0);

  return (
    <div className="space-y-8">
      <Flash tone="ok">{sp.ok ? String(sp.ok) : ""}</Flash>
      <Flash tone="error">{sp.error ? `⚠️ ${String(sp.error)}` : ""}</Flash>

      <section className="card flex flex-wrap items-center gap-4 p-6">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-leaf-soft to-sun-soft text-4xl">
          {business.emoji}
        </span>
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight">{business.name}</h1>
            {business.verified ? <Badge tone="leaf">✅ verificado</Badge> : <Badge tone="sun">pendiente de verificación</Badge>}
          </div>
          <p className="mt-1 text-sm text-bark/65">
            📍 {business.address}, {business.barrio} · gestionado por {user.name}
          </p>
          {business.bio ? <p className="mt-2 max-w-xl text-sm text-bark/60">{business.bio}</p> : null}
        </div>
        <div className="rounded-2xl bg-leaf-soft px-4 py-3 text-center">
          <p className="text-2xl font-black text-leaf">{formatKg(stats.kgRescatados)}</p>
          <p className="text-[11px] font-bold tracking-wide text-leaf/70 uppercase">rescatados en la red</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard emoji="🟢" value={String(activos.length)} label="rescates activos" />
        <StatCard emoji="⏳" value={String(pendientes.length)} label="retiros pendientes" />
        <StatCard emoji="🥡" value={formatKg(kgRescatados)} label="kg salvados por vos" />
        <StatCard emoji="🤝" value={formatNumber(recogidas.length)} label="retiros completados" />
      </section>

      <section id="publicar" className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="card p-6">
          <h2 className="text-xl font-black tracking-tight">Publicar un rescate</h2>
          <p className="mt-1 text-sm text-bark/65">
            Toma 30 segundos. Podés poner precio de rescate o regalarlo: sobre lo gratis no cobramos
            comisión.
          </p>
          <form action={createListing} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title">¿Qué estás rescantando?</label>
              <input id="title" name="title" placeholder="Bolsa de pan del día" className="mt-1" required />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description">Detalles (estado, cantidad, cómo viene)</label>
              <textarea id="description" name="description" rows={3} placeholder="Quedaron 6 bolsas del horno de la tarde." className="mt-1" />
            </div>
            <div>
              <label htmlFor="category">Categoría</label>
              <select id="category" name="category" className="mt-1">
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="emoji">Ícono</label>
              <select id="emoji" name="emoji" className="mt-1">
                {["🥖", "🥐", "🍞", "🍰", "🍲", "🍕", "🥗", "🍌", "🥕", "🧀", "🥛", "☕", "🥣", "🥫"].map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="originalPrice">Precio original ($)</label>
              <input id="originalPrice" name="originalPrice" type="number" min="0" step="100" defaultValue="4500" className="mt-1" />
            </div>
            <div>
              <label htmlFor="price">Precio de rescate ($, 0 = gratis)</label>
              <input id="price" name="price" type="number" min="0" step="100" defaultValue="900" className="mt-1" />
            </div>
            <div>
              <label htmlFor="quantity">Cantidad</label>
              <input id="quantity" name="quantity" type="number" min="1" max="200" defaultValue="6" className="mt-1" />
            </div>
            <div>
              <label htmlFor="unitLabel">Unidad</label>
              <input id="unitLabel" name="unitLabel" defaultValue="bolsa de 1 kg" className="mt-1" />
            </div>
            <div>
              <label htmlFor="unitGrams">Peso por unidad (g)</label>
              <input id="unitGrams" name="unitGrams" type="number" min="20" max="20000" step="10" defaultValue="800" className="mt-1" />
            </div>
            <div>
              <label htmlFor="reason">Motivo</label>
              <select id="reason" name="reason" className="mt-1">
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pickupIn">Retiro desde (en horas)</label>
              <input id="pickupIn" name="pickupIn" type="number" min="0.5" max="48" step="0.5" defaultValue="2" className="mt-1" />
            </div>
            <div>
              <label htmlFor="windowHours">Duración de la ventana (h)</label>
              <input id="windowHours" name="windowHours" type="number" min="1" max="12" step="0.5" defaultValue="4" className="mt-1" />
            </div>
            <button type="submit" className="btn-primary sm:col-span-2">
              Publicar rescate
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-black tracking-tight">Tus rescates</h2>
          {listings.length === 0 ? (
            <div className="card p-8 text-center text-sm text-bark/60">
              Todavía no publicaste nada. Empezá con lo que te sobra hoy.
            </div>
          ) : (
            listings.map((l) => {
              const discount = discountPercent(l.originalPriceCents, l.priceCents);
              return (
                <div key={l.id} className="card p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-leaf-soft text-2xl">
                      {l.emoji}
                    </span>
                    <div className="min-w-[160px] flex-1">
                      <Link href={`/rescate/${l.id}`} className="font-bold hover:text-leaf">
                        {l.title}
                      </Link>
                      <p className="text-xs text-bark/60">
                        {formatPrice(l.priceCents)}
                        {discount > 0 ? ` (−${discount}%)` : ""} · {l.quantityAvailable}/{l.quantityTotal}{" "}
                        {l.unitLabel} · retiro {formatPickupWindow(l.pickupFrom, l.pickupUntil)}
                      </p>
                      <div className="mt-2 max-w-xs">
                        <Progress value={l.quantityTotal - l.quantityAvailable} max={l.quantityTotal} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={l.status === "activo" ? "leaf" : "muted"}>
                        {l.status === "activo" ? "activo" : l.status}
                      </Badge>
                      <form action={setListingStatus}>
                        <input type="hidden" name="listingId" value={l.id} />
                        <input type="hidden" name="status" value={l.status === "activo" ? "cerrado" : "activo"} />
                        <button type="submit" className="btn-ghost !py-1.5 !text-[12px]">
                          {l.status === "activo" ? "Pausar" : "Reactivar"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black tracking-tight">Reservas recibidas</h2>
        {reservations.length === 0 ? (
          <div className="card p-8 text-center text-sm text-bark/60">
            Cuando alguien reserve, vas a ver su código acá para marcar el retiro.
          </div>
        ) : (
          reservations.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center gap-4 p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sun-soft text-2xl">
                {r.userEmoji}
              </span>
              <div className="min-w-[180px] flex-1">
                <p className="font-bold">
                  {r.userName} <span className="text-xs font-normal text-bark/50">· {r.userBarrio}</span>
                </p>
                <p className="text-xs text-bark/65">
                  {r.quantity} × {r.listingTitle} · hasta{" "}
                  {formatPickupWindow(r.pickupUntil, r.pickupUntil).split("→")[1] ?? ""} (
                  {pickupState(r.pickupUntil)})
                </p>
              </div>
              <p className="rounded-xl bg-bark px-3 py-1.5 text-sm font-black tracking-[0.2em] text-cream">
                {r.code}
              </p>
              <Badge tone={r.status === "confirmada" ? "leaf" : r.status === "recogida" ? "muted" : "berry"}>
                {r.status}
              </Badge>
              {r.status === "confirmada" ? (
                <div className="flex gap-2">
                  <form action={setReservationStatus}>
                    <input type="hidden" name="reservationId" value={r.id} />
                    <input type="hidden" name="status" value="recogida" />
                    <button type="submit" className="btn-primary !py-1.5 !text-[12px]">
                      Entregado
                    </button>
                  </form>
                  <form action={setReservationStatus}>
                    <input type="hidden" name="reservationId" value={r.id} />
                    <input type="hidden" name="status" value="cancelada" />
                    <button type="submit" className="btn-ghost !py-1.5 !text-[12px]">
                      No vino
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
