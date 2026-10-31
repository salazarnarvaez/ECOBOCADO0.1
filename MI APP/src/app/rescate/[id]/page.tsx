import Link from "next/link";
import { notFound } from "next/navigation";
import { reserveListing } from "@/app/actions";
import { Badge, Flash, Progress } from "@/components/ui";
import { CO2_KG_PER_FOOD_KG, categoryLabel } from "@/lib/constants";
import {
  discountPercent,
  formatKg,
  formatPickupWindow,
  formatPrice,
  formatPricePlain,
  pickupState,
  relative,
} from "@/lib/format";
import { getListing, getListings } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import ListingCard from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const listingId = Number(id);
  if (!Number.isFinite(listingId)) notFound();

  const listing = await getListing(listingId);
  if (!listing) notFound();

  const [user, nearby] = await Promise.all([
    getCurrentUser(),
    getListings({ barrio: listing.barrio, orden: "pronto" }),
  ]);

  const discount = discountPercent(listing.originalPriceCents, listing.priceCents);
  const state = pickupState(listing.pickupUntil);
  const closed = state === "cerrado" || listing.status !== "activo" || listing.quantityAvailable <= 0;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const maxQty = Math.max(1, Math.min(6, listing.quantityAvailable));
  const co2 = (listing.unitGrams / 1000) * CO2_KG_PER_FOOD_KG;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${listing.address}, ${listing.barrio}`,
  )}`;

  return (
    <div className="space-y-8">
      <Link href="/#rescates" className="text-sm font-bold text-bark/55 hover:text-bark">
        ← Volver a los rescates
      </Link>

      <Flash tone="error">{error ? `⚠️ ${error}` : ""}</Flash>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="card overflow-hidden">
          <div className="flex flex-wrap items-start gap-4 bg-gradient-to-br from-leaf-soft to-sun-soft p-6">
            <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white/85 text-5xl shadow-sm">
              {listing.emoji}
            </span>
            <div className="min-w-[200px] flex-1">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="muted">{categoryLabel(listing.category)}</Badge>
                <Badge tone="leaf">{listing.reason}</Badge>
                {listing.priceCents === 0 ? <Badge tone="sun">🎁 gratis</Badge> : null}
                {discount > 0 ? <Badge tone="berry">−{discount}%</Badge> : null}
              </div>
              <h1 className="mt-2 text-2xl leading-tight font-black tracking-tight sm:text-3xl">
                {listing.title}
              </h1>
              <p className="mt-1 text-sm text-bark/70">
                {listing.businessEmoji} <strong>{listing.businessName}</strong> · 📍 {listing.address},{" "}
                {listing.barrio} {listing.verified ? "✅" : ""}
              </p>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <p className="text-[15px] leading-relaxed text-bark/80">
              {listing.description || "El comercio no agregó detalles, preguntale en el mostrador."}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-bark/10 bg-cream p-4">
                <p className="text-[11px] font-black tracking-wider text-bark/50 uppercase">
                  Ventana de retiro
                </p>
                <p className="mt-1 text-sm font-bold">{formatPickupWindow(listing.pickupFrom, listing.pickupUntil)}</p>
                <p className="mt-1 text-xs text-bark/55">
                  {closed ? "Ventana cerrada" : `Abre ${relative(listing.pickupFrom)} · cierra ${relative(listing.pickupUntil)}`}
                </p>
              </div>
              <div className="rounded-2xl border border-bark/10 bg-cream p-4">
                <p className="text-[11px] font-black tracking-wider text-bark/50 uppercase">Stock</p>
                <p className="mt-1 text-sm font-bold">
                  {listing.quantityAvailable} de {listing.quantityTotal} {listing.unitLabel}
                </p>
                <div className="mt-2">
                  <Progress
                    value={listing.quantityTotal - listing.quantityAvailable}
                    max={listing.quantityTotal}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-leaf/20 bg-leaf-soft p-4 text-sm">
              <p className="font-bold text-leaf">🌱 Impacto de este rescate</p>
              <p className="mt-1 text-bark/75">
                Cada {listing.unitLabel} evita <strong>{formatKg(listing.unitGrams / 1000)}</strong> de
                desperdicio y <strong>~{co2.toFixed(1)} kg de CO₂eq</strong>. Los alimentos ya producidos
                no necesitan más agua, tierra ni transporte.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-ghost">
                🗺️ Cómo llegar
              </a>
              <Link href={`/impacto#comercios`} className="btn-ghost">
                Ver otros comercios del barrio
              </Link>
            </div>
          </div>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${listing.priceCents === 0 ? "text-sun" : "text-leaf"}`}>
                {formatPrice(listing.priceCents)}
              </span>
              {discount > 0 ? (
                <span className="text-sm text-bark/40 line-through">
                  {formatPricePlain(listing.originalPriceCents)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-bark/55">por {listing.unitLabel} · se abona en el local</p>

            {closed ? (
              <div className="mt-5 rounded-2xl border border-bark/12 bg-cream p-4 text-sm font-semibold text-bark/70">
                😴 Este rescate ya no tiene stock o la ventana de retiro cerró. Mirá los rescates
                activos del barrio.
              </div>
            ) : (
              <form action={reserveListing} className="mt-5 space-y-3">
                <input type="hidden" name="listingId" value={listing.id} />
                <div>
                  <label htmlFor="quantity">¿Cuántos llevás?</label>
                  <select id="quantity" name="quantity" defaultValue="1" className="mt-1">
                    {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? listing.unitLabel : `${listing.unitLabel}s`}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full !py-3">
                  Reservar con mi perfil
                </button>
                <p className="text-center text-xs text-bark/50">
                  Reservás como <strong>{user?.name ?? "invitado"}</strong>. Recibís un código de 6
                  caracteres para mostrar en el mostrador.
                </p>
              </form>
            )}

            <ul className="mt-5 space-y-2 border-t border-bark/8 pt-4 text-xs text-bark/60">
              <li>🤝 Sin pago online: abonás (o no) directamente en el comercio.</li>
              <li>⏱️ Si no lo retirás, se libera para otro vecino.</li>
              <li>🌡️ Productos de frío: traé bolsa térmica.</li>
            </ul>
          </div>
        </aside>
      </div>

      {nearby.filter((n) => n.id !== listing.id).length > 0 ? (
        <section>
          <h2 className="mb-4 text-xl font-black tracking-tight">Más rescates en {listing.barrio}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearby
              .filter((n) => n.id !== listing.id)
              .slice(0, 3)
              .map((n) => (
                <ListingCard key={n.id} listing={n} />
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
