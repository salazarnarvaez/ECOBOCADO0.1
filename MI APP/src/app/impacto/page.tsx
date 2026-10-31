import Link from "next/link";
import { SectionTitle, StatCard } from "@/components/ui";
import { CO2_KG_PER_FOOD_KG, MEALS_PER_FOOD_KG, categoryLabel } from "@/lib/constants";
import { formatKg, formatNumber } from "@/lib/format";
import { getImpactByBarrio, getImpactByCategory, getStats, getTopBusinesses } from "@/lib/queries";

export const dynamic = "force-dynamic";

function Bars({
  rows,
  labelKey,
  emptyLabel,
}: {
  rows: { key: string; label: string; kg: number; extra: string }[];
  labelKey: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-bark/55">{emptyLabel}</p>;
  }
  const max = Math.max(...rows.map((r) => r.kg), 0.5);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-bold text-bark">{r.label}</span>
            <span className="text-xs font-semibold text-bark/55">
              {formatKg(r.kg)} · {r.extra}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-bark/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-leaf to-[#4aa877]"
              style={{ width: `${Math.max(6, (r.kg / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
      <li className="pt-1 text-[11px] font-bold tracking-wide text-bark/40 uppercase">{labelKey}</li>
    </ul>
  );
}

export default async function ImpactoPage() {
  const [stats, byBarrio, byCategory, top] = await Promise.all([
    getStats(),
    getImpactByBarrio(),
    getImpactByCategory(),
    getTopBusinesses(5),
  ]);

  const autoKm = stats.co2Evitado / 0.12; // 0,12 kg CO2/km en auto naftero

  return (
    <div className="space-y-10">
      <section>
        <p className="text-[11px] font-black tracking-[0.16em] text-leaf uppercase">Transparencia</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
          El impacto se mide, no se promete
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bark/70">
          Cada retiro confirmado suma kilos rescatados. Con esos kilos estimamos CO₂eq evitado y
          raciones recuperadas usando factores públicos de la FAO y WRAP. Nada de números inventados:
          acá están los cálculos y su metodología.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard emoji="🥡" value={formatKg(stats.kgRescatados)} label="kg rescatados" hint={`${stats.reservasRecogidas} retiros`} />
        <StatCard emoji="🌍" value={`${formatNumber(stats.co2Evitado)} kg`} label="CO₂eq evitado" hint={`≈ ${formatNumber(autoKm)} km en auto`} />
        <StatCard emoji="🍲" value={formatNumber(stats.raciones)} label="raciones" hint="≈ comidas recuperadas" />
        <StatCard emoji="💸" value={`$${formatNumber(stats.ahorroVecinos)}`} label="ahorro barrial" hint="vs precio original" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <SectionTitle title="Por barrio" subtitle="Dónde se rescata más" />
          <Bars
            rows={byBarrio.map((b) => ({ key: b.barrio, label: b.barrio, kg: b.kg, extra: `${b.rescates} retiros` }))}
            labelKey="kilos rescatados por barrio"
            emptyLabel="Todavía no hay retiros confirmados."
          />
        </div>
        <div className="card p-6">
          <SectionTitle title="Por categoría" subtitle="Qué tipo de comida se salva" />
          <Bars
            rows={byCategory.map((c) => ({
              key: c.category,
              label: categoryLabel(c.category),
              kg: c.kg,
              extra: `${c.rescates} retiros`,
            }))}
            labelKey="kilos rescatados por categoría"
            emptyLabel="Todavía no hay retiros confirmados."
          />
        </div>
        <div className="card p-6" id="comercios">
          <SectionTitle title="Ranking de comercios" subtitle="Los que menos tiran" />
          {top.length === 0 ? (
            <p className="text-sm text-bark/55">Sin datos aún.</p>
          ) : (
            <ol className="space-y-3">
              {top.map((b, i) => (
                <li key={b.name} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-sun-soft text-sm font-black text-[#8a5b00]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {b.emoji} {b.name}
                    </p>
                    <p className="text-xs text-bark/55">📍 {b.barrio}</p>
                  </div>
                  <span className="text-xs font-bold text-leaf">{formatKg(b.kg)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-black tracking-tight">Metodología del cálculo</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm text-bark/70">
          <div className="rounded-2xl bg-cream p-4">
            <p className="font-bold text-bark">Kilos rescatados</p>
            <p className="mt-1">
              Suma de <em>cantidad reservada × peso declarado por unidad</em> en retiros marcados como
              entregados. El peso lo declara el comercio al publicar.
            </p>
          </div>
          <div className="rounded-2xl bg-cream p-4">
            <p className="font-bold text-bark">CO₂eq evitado</p>
            <p className="mt-1">
              kilos rescatados × {CO2_KG_PER_FOOD_KG} (factor medio de emisiones evitadas por kg de
              alimento no descartado, incluyendo disposición final).
            </p>
          </div>
          <div className="rounded-2xl bg-cream p-4">
            <p className="font-bold text-bark">Raciones</p>
            <p className="mt-1">
              kilos rescatados × {MEALS_PER_FOOD_KG} raciones por kilo. Es una estimación conservadora
              para mezcla de pan, platos listos y produce.
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-bark/50">
          En un piloto real estos factores se validan con la balanza del comercio y con un partner local
          de compostaje / banco de alimentos.{" "}
          <Link href="/plan" className="font-bold text-leaf underline">
            Ver el plan de producto
          </Link>
        </p>
      </section>
    </div>
  );
}
