import Link from "next/link";
import { cancelReservation, markCollected } from "@/app/actions";
import { Badge, EmptyState, Flash, StatCard } from "@/components/ui";
import { CO2_KG_PER_FOOD_KG } from "@/lib/constants";
import { formatKg, formatNumber, formatPickupWindow, formatPrice } from "@/lib/format";
import { getReservationsForUser } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  confirmada: "leaf",
  recogida: "muted",
  cancelada: "berry",
} as const;

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const nuevo = Array.isArray(sp.nuevo) ? sp.nuevo[0] : sp.nuevo;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        emoji="👤"
        title="Elegí un perfil para empezar"
        description="Este prototipo usa perfiles de demostración: cambiá de usuario en el selector superior para reservar como vecino o gestionar como comercio."
      />
    );
  }

  const reservations = await getReservationsForUser(user.id);
  const activas = reservations.filter((r) => r.status === "confirmada");
  const historial = reservations.filter((r) => r.status !== "confirmada");
  const kg = historial
    .filter((r) => r.status === "recogida")
    .reduce((acc, r) => acc + (r.quantity * r.unitGrams) / 1000, 0);
  const ahorro = historial
    .filter((r) => r.status === "recogida")
    .reduce((acc, r) => acc + (r.quantity * (r.originalPriceCents - r.priceCents)) / 100, 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-black tracking-[0.16em] text-leaf uppercase">Hola {user.emoji}</p>
        <h1 className="text-3xl font-black tracking-tight">Mis reservas</h1>
        <p className="mt-1 text-sm text-bark/65">
          Mostrá el código en el mostrador dentro de la ventana de retiro. Sin pagos online.
        </p>
      </div>

      {nuevo ? (
        <div className="card border-leaf/30 bg-leaf-soft p-6">
          <p className="text-[11px] font-black tracking-[0.16em] text-leaf uppercase">¡Reserva confirmada!</p>
          <p className="mt-2 text-sm text-bark/75">
            Tu código de retiro es
            <span className="ml-2 rounded-xl bg-white px-3 py-1 text-2xl font-black tracking-[0.3em] text-leaf">
              {nuevo}
            </span>
          </p>
          <p className="mt-2 text-xs text-bark/60">
            Avisale al comercio si no podés ir: la reserva vuelve al stock y otro vecino la aprovecha.
          </p>
        </div>
      ) : null}

      <Flash tone="error">{sp.error ? `⚠️ ${String(sp.error)}` : ""}</Flash>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard emoji="⏳" value={String(activas.length)} label="reservas activas" />
        <StatCard emoji="🥡" value={formatKg(kg)} label="rescatadas por vos" />
        <StatCard emoji="🌍" value={`${formatNumber(kg * CO2_KG_PER_FOOD_KG)} kg`} label="CO₂eq evitado" />
        <StatCard emoji="💸" value={`$${formatNumber(ahorro)}`} label="ahorro acumulado" />
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-black tracking-tight">Para retirar</h2>
        {activas.length === 0 ? (
          <div className="card p-8 text-center text-sm text-bark/60">
            Todavía no tenés reservas activas.{" "}
            <Link href="/#rescates" className="font-bold text-leaf underline">
              Buscá un rescate cerca
            </Link>
            .
          </div>
        ) : (
          activas.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center gap-4 p-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-leaf-soft text-3xl">
                {r.emoji}
              </span>
              <div className="min-w-[180px] flex-1">
                <Link href={`/rescate/${r.listingId}`} className="font-bold hover:text-leaf">
                  {r.listingTitle}
                </Link>
                <p className="text-xs text-bark/60">
                  {r.businessEmoji} {r.businessName} · {r.businessAddress}, {r.barrio}
                </p>
                <p className="mt-1 text-xs font-bold text-bark/70">
                  🕒 {formatPickupWindow(r.pickupFrom, r.pickupUntil)} · {r.quantity} × {formatPrice(r.priceCents)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black tracking-[0.16em] text-bark/45 uppercase">Código</p>
                <p className="rounded-xl bg-bark px-3 py-1.5 text-lg font-black tracking-[0.2em] text-cream">
                  {r.code}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={markCollected}>
                  <input type="hidden" name="reservationId" value={r.id} />
                  <button type="submit" className="btn-primary !py-2 !text-[13px]">
                    Ya lo retiré
                  </button>
                </form>
                <form action={cancelReservation}>
                  <input type="hidden" name="reservationId" value={r.id} />
                  <button type="submit" className="btn-ghost !py-2 !text-[13px]">
                    Liberar
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>

      {historial.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-black tracking-tight">Historial</h2>
          {historial.map((r) => (
            <div
              key={r.id}
              className="card flex flex-wrap items-center gap-3 p-4 opacity-80 transition hover:opacity-100"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-bark/5 text-2xl">
                {r.emoji}
              </span>
              <div className="min-w-[160px] flex-1">
                <p className="text-sm font-bold">{r.listingTitle}</p>
                <p className="text-xs text-bark/55">
                  {r.businessName} · {r.quantity} {r.quantity > 1 ? "unidades" : "unidad"} ·{" "}
                  {formatPrice(r.priceCents)}
                </p>
              </div>
              <Badge tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE] ?? "muted"}>
                {r.status === "recogida" ? "✅ retirada" : "✕ cancelada"}
              </Badge>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
