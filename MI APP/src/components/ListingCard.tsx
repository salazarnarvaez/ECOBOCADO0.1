import Link from "next/link";
import { Badge, Progress } from "@/components/ui";
import type { ListingRow } from "@/lib/queries";
import { categoryLabel } from "@/lib/constants";
import { discountPercent, formatDistance, formatPickupWindow, formatPrice, pickupState } from "@/lib/format";

export default function ListingCard({ listing }: { listing: ListingRow }) {
  const discount = discountPercent(listing.originalPriceCents, listing.priceCents);
  const state = pickupState(listing.pickupUntil);
  const soldOut = listing.quantityAvailable <= 0;

  return (
    <Link
      href={`/rescate/${listing.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative flex items-start gap-3 bg-gradient-to-br from-leaf-soft to-sun-soft p-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/85 text-3xl shadow-sm">
          {listing.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="muted">{categoryLabel(listing.category)}</Badge>
            {listing.priceCents === 0 ? <Badge tone="sun">🎁 gratis</Badge> : null}
            {discount >= 40 && listing.priceCents > 0 ? (
              <Badge tone="berry">−{discount}%</Badge>
            ) : null}
          </div>
          <h3 className="mt-1.5 line-clamp-2 text-[15px] leading-snug font-bold text-bark">
            {listing.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <div className="flex items-center gap-2 text-[13px] text-bark/70">
          <span aria-hidden>{listing.businessEmoji}</span>
          <span className="truncate font-bold text-bark/85">{listing.businessName}</span>
          {listing.verified ? <span title="Comercio verificado">✅</span> : null}
          <span className="ml-auto shrink-0 rounded-full bg-bark/5 px-2 py-0.5 text-[11px] font-bold">
            {typeof listing.distanceKm === "number" && listing.distanceKm !== null
              ? `🚶 ${formatDistance(listing.distanceKm)}`
              : `📍 ${listing.barrio}`}
          </span>
        </div>

        <p className="text-xs text-bark/55">
          {state === "cerrado" ? "Retiro cerrado" : `Retiro ${formatPickupWindow(listing.pickupFrom, listing.pickupUntil)}`}
        </p>

        <div className="mt-auto space-y-2">
          <Progress value={listing.quantityTotal - listing.quantityAvailable} max={listing.quantityTotal} />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-lg font-black ${listing.priceCents === 0 ? "text-sun" : "text-leaf"}`}
              >
                {formatPrice(listing.priceCents)}
              </span>
              {discount > 0 ? (
                <span className="text-xs text-bark/40 line-through">
                  {formatPrice(listing.originalPriceCents)}
                </span>
              ) : null}
              <span className="text-[11px] text-bark/45">/ {listing.unitLabel}</span>
            </div>
            {soldOut ? (
              <span className="text-[11px] font-bold text-bark/40">agotado</span>
            ) : listing.quantityAvailable <= 2 ? (
              <span className="text-[11px] font-bold text-berry">¡últimas {listing.quantityAvailable}!</span>
            ) : (
              <span className="text-[11px] font-bold text-bark/50">{listing.quantityAvailable} disponibles</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
