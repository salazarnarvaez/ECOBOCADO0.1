import { ensureSeed } from "@/db/seed";
import { getImpactByBarrio, getImpactByCategory, getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** GET /api/stats · métricas de impacto agregadas de la red. */
export async function GET() {
  await ensureSeed();
  try {
    const [stats, byBarrio, byCategory] = await Promise.all([
      getStats(),
      getImpactByBarrio(),
      getImpactByCategory(),
    ]);
    return Response.json({ stats, byBarrio, byCategory });
  } catch (error) {
    return Response.json({ error: "No se pudieron calcular las métricas", detail: String(error) }, { status: 500 });
  }
}
