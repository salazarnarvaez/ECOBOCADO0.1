import Link from "next/link";
import {
  createAlert,
  deleteAlert,
  markNotificationsRead,
  saveSector,
  simulateAlertScan,
  toggleAlert,
} from "@/app/actions";
import { Badge, EmptyState, Flash, StatCard } from "@/components/ui";
import { BARRIOS, CATEGORIES, categoryLabel } from "@/lib/constants";
import { formatPickupWindow, formatPrice, relative } from "@/lib/format";
import { getAlertsForUser, getNotificationsForUser } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AlertasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        emoji="🔔"
        title="Elegí un perfil para configurar alertas"
        description="Las alertas son por persona: cambiá de usuario en el selector superior para ver las alertas de otro vecino."
      />
    );
  }

  const [alerts, notifications] = await Promise.all([
    getAlertsForUser(user.id),
    getNotificationsForUser(user.id),
  ]);

  const unread = notifications.filter((n) => !n.leido).length;
  const activas = alerts.filter((a) => a.activa).length;
  const conCoords = user.lat !== null && user.lng !== null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-black tracking-[0.16em] text-leaf uppercase">F1 · retención</p>
        <h1 className="text-3xl font-black tracking-tight">Alertas de barrio</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bark/70">
          El rescate aparece a las 20:14 y se agota a las 20:40. Nadie está mirando la app a esa hora.
          La alerta hace el trabajo: <strong>vos decís qué buscás y hasta cuánto pagás</strong>, y el
          aviso te llega cuando el comercio publica.
        </p>
      </div>

      <Flash tone="ok">{sp.ok ? String(sp.ok) : ""}</Flash>
      <Flash tone="error">{sp.error ? `⚠️ ${String(sp.error)}` : ""}</Flash>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard emoji="🔔" value={String(activas)} label="alertas activas" />
        <StatCard emoji="📨" value={String(notifications.length)} label="avisos recibidos" />
        <StatCard emoji="👀" value={String(unread)} label="sin leer" />
        <StatCard
          emoji="📍"
          value={conCoords ? `${user.radioKm} km` : "—"}
          label={conCoords ? `radio desde ${user.barrio}` : "sector sin configurar"}
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-black tracking-tight">Tu sector</h2>
            <p className="mt-1 text-sm text-bark/65">
              Usamos el centro del barrio como punto de partida. Con el radio definimos qué rescates te
              quedan a distancia caminable.
            </p>
            <form action={saveSector} className="mt-4 grid gap-4 sm:grid-cols-2">
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
              <div>
                <label htmlFor="radioKm">Radio (km)</label>
                <input
                  id="radioKm"
                  name="radioKm"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue={user.radioKm}
                  className="mt-1"
                />
              </div>
              <button type="submit" className="btn-primary sm:col-span-2">
                Guardar sector
              </button>
            </form>
          </div>

          <div className="card p-6" id="nueva">
            <h2 className="text-xl font-black tracking-tight">Nueva alerta</h2>
            <p className="mt-1 text-sm text-bark/65">
              Dejá en blanco lo que no te importe restringir: menos filtros = más avisos.
            </p>
            <form action={createAlert} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="nombre">Nombre de la alerta</label>
                <input id="nombre" name="nombre" placeholder="Pan barato cerca del trabajo" className="mt-1" />
              </div>
              <div>
                <label htmlFor="categoria">Categoría</label>
                <select id="categoria" name="categoria" className="mt-1">
                  <option value="">Cualquiera</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="maxPrice">Precio máx. ($, 0 = sin tope)</label>
                <input id="maxPrice" name="maxPrice" type="number" min="0" step="100" defaultValue="0" className="mt-1" />
              </div>
              <div>
                <label htmlFor="barrio">Barrio</label>
                <select id="barrio" name="barrio" className="mt-1">
                  <option value="">Cualquiera (usa mi radio)</option>
                  {BARRIOS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="radioKm-alerta">Radio (km)</label>
                <input
                  id="radioKm-alerta"
                  name="radioKm"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue={user.radioKm}
                  className="mt-1"
                />
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-bark/12 bg-white px-3 py-2 !text-[13px] !font-semibold !normal-case !tracking-normal !text-bark/80 sm:col-span-2">
                <input type="checkbox" name="soloGratis" value="1" className="!h-4 !w-4 !p-0 accent-[#166f4a]" />
                Solo avisame de rescates gratis
              </label>
              <button type="submit" className="btn-primary sm:col-span-2">
                Activar alerta
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black tracking-tight">Tus alertas</h2>
              <form action={simulateAlertScan}>
                <button type="submit" className="btn-ghost !py-1.5 !text-[12px]">
                  🔄 Simular barrido ahora
                </button>
              </form>
            </div>
            {alerts.length === 0 ? (
              <p className="mt-3 text-sm text-bark/60">
                Todavía no tenés alertas. Creá una y te avisamos cuando aparezca algo así cerca.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {alerts.map((a) => (
                  <li key={a.id} className="rounded-2xl border border-bark/10 bg-cream p-4">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="min-w-[160px] flex-1">
                        <p className="font-bold">{a.nombre}</p>
                        <p className="mt-0.5 text-xs text-bark/60">
                          {a.categoria ? `${categoryLabel(a.categoria)} · ` : "categoría libre · "}
                          {a.barrio ?? "cualquier barrio"} · hasta {a.radioKm} km ·{" "}
                          {a.maxPriceCents !== null ? `tope ${formatPrice(a.maxPriceCents)}` : "sin tope de precio"}
                        </p>
                      </div>
                      <Badge tone={a.activa ? "leaf" : "muted"}>{a.activa ? "activa" : "pausada"}</Badge>
                      <div className="flex gap-2">
                        <form action={toggleAlert}>
                          <input type="hidden" name="alertId" value={a.id} />
                          <button type="submit" className="btn-ghost !py-1 !text-[11px]">
                            {a.activa ? "Pausar" : "Activar"}
                          </button>
                        </form>
                        <form action={deleteAlert}>
                          <input type="hidden" name="alertId" value={a.id} />
                          <button type="submit" className="btn-ghost !py-1 !text-[11px] !text-berry">
                            Borrar
                          </button>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black tracking-tight">Bandeja de avisos</h2>
              {unread > 0 ? (
                <form action={markNotificationsRead}>
                  <button type="submit" className="btn-ghost !py-1.5 !text-[12px]">
                    Marcar todo como leído
                  </button>
                </form>
              ) : null}
            </div>
            {notifications.length === 0 ? (
              <p className="mt-3 text-sm text-bark/60">
                Sin avisos todavía. Tocá <strong>Simular barrido</strong> para ver qué matchearía hoy.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${
                      n.leido ? "border-bark/8 bg-white" : "border-leaf/25 bg-leaf-soft"
                    }`}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl">
                      {n.emoji}
                    </span>
                    <div className="min-w-[150px] flex-1">
                      <Link href={`/rescate/${n.listingId}`} className="text-sm font-bold hover:text-leaf">
                        {n.titulo}
                      </Link>
                      <p className="text-xs text-bark/60">
                        {n.businessName} · cierra {relative(n.pickupUntil)} ·{" "}
                        {formatPickupWindow(n.pickupUntil, n.pickupUntil).split("→")[1]?.trim() ?? ""}
                      </p>
                      {n.alertNombre ? (
                        <p className="mt-0.5 text-[11px] font-bold text-leaf">🔔 matchea: {n.alertNombre}</p>
                      ) : null}
                    </div>
                    {!n.leido ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sun" /> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
