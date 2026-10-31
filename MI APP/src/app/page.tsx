import Link from "next/link";
import Filters, { normalizeOrden, type FilterValues } from "@/components/Filters";
import ListingCard from "@/components/ListingCard";
import { StatCard } from "@/components/ui";
import { ensureSeed } from "@/db/seed";
import { formatKg, formatNumber } from "@/lib/format";
import { getAlertMatchCount, getListings, getStats } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    emoji: "🏬",
    title: "El comercio publica",
    text: "Al cierre, lo que quedó en perfectas condiciones se publica en 30 segundos con horario de retiro.",
  },
  {
    emoji: "🔔",
    title: "El barrio reserva",
    text: "Los vecinos cercanos ven el rescate, reservan su unidad y reciben un código de retiro.",
  },
  {
    emoji: "🌍",
    title: "Nadie tira nada",
    text: "Se retira en el mostrador, se ahorra plata y el impacto se mide en kg y CO₂ evitado.",
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeed();
  const sp = await searchParams;
  const pick = (key: string) => (Array.isArray(sp[key]) ? (sp[key] as string[])[0] : (sp[key] as string) ?? "");

  const values: FilterValues = {
    q: pick("q"),
    barrio: pick("barrio"),
    categoria: pick("categoria"),
    gratis: pick("gratis") === "1",
    max: pick("max"),
    orden: normalizeOrden(pick("orden")),
  };

  const maxPriceCents = values.max && Number(values.max) > 0 ? Number(values.max) * 100 : undefined;

  const [user, stats] = await Promise.all([getCurrentUser(), getStats()]);
  const avisos = user ? await getAlertMatchCount(user.id) : 0;
  const tieneSector = values.orden === "cerca" && user?.lat !== null && user?.lng !== null && user !== null;
  const origen =
    tieneSector && user?.lat !== null && user?.lng !== null
      ? { lat: user.lat, lng: user.lng, radioKm: user.radioKm }
      : null;

  const listings = await getListings({
    q: values.q,
    barrio: values.barrio,
    categoria: values.categoria,
    soloGratis: values.gratis,
    maxPriceCents,
    orden: tieneSector ? "cerca" : values.orden,
    origen,
  });

  const free = listings.filter((l) => l.priceCents === 0).length;
  const enRadio = origen
    ? listings.filter((l) => (l.distanceKm ?? 99) <= (origen.radioKm ?? 99)).length
    : listings.length;

  return (
    <div className="space-y-10">
      {avisos > 0 ? (
        <Link
          href="/alertas"
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-leaf/25 bg-leaf-soft px-4 py-3 transition hover:border-leaf/50"
        >
          <span className="text-xl">🔔</span>
          <span className="text-sm font-bold text-bark">
            {avisos} {avisos === 1 ? "aviso nuevo" : "avisos nuevos"} de tus alertas de barrio
          </span>
          <span className="text-xs font-semibold text-leaf">
            {user ? `para ${user.name.split(" ")[0]}` : ""} · ver bandeja →
          </span>
        </Link>
      ) : null}

      <section className="grid items-center gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <span className="chip !border-leaf/20 !bg-leaf-soft !text-leaf">
            🌱 {stats.rescatesActivos} rescates abiertos ahora mismo
          </span>
          <h1 className="mt-4 text-4xl leading-[1.05] font-black tracking-tight text-bark sm:text-5xl">
            La comida de tu barrio
            <span className="block text-leaf">no debería terminar en la basura.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-bark/70">
            Panaderías, restaurantes y verdulerías publican lo que no pudieron vender —en perfecto
            estado— a precio de rescate o gratis. Los vecinos del barrio lo retiran el mismo día. Menos
            desperdicio, más comunidad, plata que se queda en el barrio.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="#rescates" className="btn-primary">
              Ver rescates cerca
            </Link>
            <Link href="/comercio#publicar" className="btn-ghost">
              Soy comercio, quiero publicar
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-bark/55">
            <span>✅ Retiro en mostrador, sin app de pagos</span>
            <span>⏱️ Ventanas de 2 a 6 horas</span>
            <span>🤝 {formatNumber(stats.vecinos)} vecinos sumados</span>
          </div>
        </div>

        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero.jpg"
            alt="Panadero entregando una bolsa de pan a un vecino en el mostrador"
            className="aspect-4/3 w-full rounded-3xl object-cover shadow-[0_30px_60px_-40px_rgba(29,42,34,0.6)]"
          />
          <div className="card absolute -bottom-5 left-4 right-4 flex items-center gap-3 p-3 sm:left-8 sm:right-8">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sun-soft text-2xl">🥐</span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-bark">Facturas surtidas · docena</p>
              <p className="text-xs text-bark/60">Gratis · Panadería Ortiz, Palermo</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-sun px-2.5 py-1 text-[11px] font-black text-white">
              3 quedan
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard emoji="🥡" value={formatKg(stats.kgRescatados)} label="comida rescatada" hint="registrada en retiros" />
        <StatCard emoji="🌍" value={`${formatNumber(stats.co2Evitado)} kg`} label="CO₂eq evitado" hint="≈ auto 60 km menos" />
        <StatCard emoji="🍲" value={formatNumber(stats.raciones)} label="raciones salvadas" hint="1 kg ≈ 2,4 raciones" />
        <StatCard emoji="💸" value={`$${formatNumber(stats.ahorroVecinos)}`} label="ahorro del barrio" hint="vs precio original" />
      </section>

      <section className="space-y-4">
        <Filters values={values} total={listings.length} />
        {listings.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-3xl">🫙</p>
            <h3 className="mt-2 text-lg font-bold">No hay rescates con ese filtro</h3>
            <p className="mt-1 text-sm text-bark/60">
              Probá ampliar el barrio o quitar el precio máximo. Los rescates suelen aparecer al cierre
              de cada comercio.
            </p>
            <Link href="/#rescates" className="btn-ghost mt-4">
              Limpiar filtros
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
        <p className="text-xs text-bark/45">
          {free} de {listings.length} rescates son 100% gratuitos · {formatKg(stats.kgDisponibles)} de
          comida disponible
          {origen
            ? ` · ${enRadio} dentro de tus ${origen.radioKm} km en ${user?.barrio}`
            : " en este momento"}
        </p>
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-black tracking-tight">Cómo funciona</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-leaf-soft text-2xl">
                {step.emoji}
              </div>
              <div>
                <p className="text-[11px] font-black tracking-[0.16em] text-leaf uppercase">
                  Paso {i + 1}
                </p>
                <h3 className="text-[15px] font-bold">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-bark/65">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-bark p-6 text-cream sm:p-10">
        <div className="flex flex-wrap items-center gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              ¿Tenés un comercio? Tirar te cuesta más que regalar.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/70">
              Publicar un rescate toma 30 segundos, recupera parte del costo de producción y te da
              clientes nuevos que ya conocen tu mostrador. Sin comisiones sobre lo gratis.
            </p>
            <Link href="/comercio#publicar" className="btn-primary mt-5 !bg-sun !text-bark">
              Publicar mi primer rescate
            </Link>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-2xl font-black">{formatNumber(stats.comercios)}</p>
              <p className="text-[11px] font-bold tracking-wide text-cream/60 uppercase">comercios</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-2xl font-black">30 s</p>
              <p className="text-[11px] font-bold tracking-wide text-cream/60 uppercase">para publicar</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
