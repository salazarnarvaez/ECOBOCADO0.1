import { ensureSeed } from "@/db/seed";
import { getListings } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings?barrio=Palermo&categoria=panaderia&gratis=1&max=1000&orden=precio&q=pan
 * API JSON pública de rescates activos.
 */
export async function GET(request: Request) {
  await ensureSeed();
  const url = new URL(request.url);
  const ordenRaw = url.searchParams.get("orden") ?? "pronto";
  const orden =
    ordenRaw === "precio" || ordenRaw === "descuento" || ordenRaw === "reciente" ? ordenRaw : "pronto";
  const maxParam = Number(url.searchParams.get("max") ?? "");
  const gratis = url.searchParams.get("gratis") === "1" || url.searchParams.get("gratis") === "true";

  try {
    const rows = await getListings({
      q: url.searchParams.get("q") ?? undefined,
      barrio: url.searchParams.get("barrio") ?? undefined,
      categoria: url.searchParams.get("categoria") ?? undefined,
      soloGratis: gratis,
      maxPriceCents: Number.isFinite(maxParam) && maxParam > 0 ? maxParam * 100 : undefined,
      orden,
    });

    return Response.json({
      count: rows.length,
      items: rows.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        category: l.category,
        emoji: l.emoji,
        price: l.priceCents / 100,
        originalPrice: l.originalPriceCents / 100,
        unit: l.unitLabel,
        available: l.quantityAvailable,
        total: l.quantityTotal,
        reason: l.reason,
        pickupFrom: l.pickupFrom,
        pickupUntil: l.pickupUntil,
        business: {
          id: l.businessId,
          name: l.businessName,
          type: l.businessType,
          barrio: l.barrio,
          address: l.address,
          verified: l.verified,
        },
        url: `/rescate/${l.id}`,
      })),
    });
  } catch (error) {
    return Response.json({ error: "No se pudieron leer los rescates", detail: String(error) }, { status: 500 });
  }
}
