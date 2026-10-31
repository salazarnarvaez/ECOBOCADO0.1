import Link from "next/link";
import { SectionTitle } from "@/components/ui";

export const metadata = {
  title: "Plan de producto · Rescate",
};

const PROBLEM = [
  {
    stat: "1/3",
    label: "de la comida producida en el mundo se pierde o desperdicia",
    source: "FAO",
  },
  { stat: "8-10%", label: "de las emisiones globales de GEI vienen de la comida que se tira", source: "UNEP" },
  { stat: "70%", label: "del desperdicio en ciudades ocurre en retail, servicios y hogares", source: "estimación" },
];

const LOOPS = [
  {
    emoji: "🏬",
    title: "Lado oferta (comercio)",
    bullets: [
      "Dolor real: pagar basura, sentir que tira trabajo propio.",
      "Publicar toma 30 s al cierre, desde el celular.",
      "Gana: recupera caja + clientes nuevos + métrica de RSE para mostrar.",
    ],
  },
  {
    emoji: "🚲",
    title: "Lado demanda (vecino)",
    bullets: [
      "Dolor: la inflación + la culpa de ver gente tirando comida.",
      "Llega por WhatsApp del barrio, no por publicidad paga.",
      "Se queda por cercanía: retiro a 5 cuadras, no un delivery.",
    ],
  },
  {
    emoji: "🌍",
    title: "Lado planeta",
    bullets: [
      "Impacto medible por transacción (kg y CO₂eq).",
      "Habilita alianzas con municipios y bancos de alimentos.",
      "Genera contenido con sentido: fotos de antes/después del mostrador.",
    ],
  },
];

const PHASES = [
  {
    tag: "F0 · ya construido",
    tone: "leaf",
    title: "Prototipo funcional (esta app)",
    items: [
      "Publicación de rescates con precio de rescate o gratis",
      "Reserva con código de retiro y control de stock",
      "Panel del comercio con reservas recibidas",
      "Métricas de impacto y ranking por barrio",
    ],
  },
  {
    tag: "F1 · semanas 1-6",
    tone: "sun",
    title: "Piloto hiperlocal en 1 barrio",
    items: [
      "15 comercios fundadores + 1 grupo de WhatsApp",
      "Cuentas reales con WhatsApp / Magic link",
      "Verificación de comercios (foto de local + CUIT)",
      "Notificación push cuando un rescate aparece a 800 m",
    ],
  },
  {
    tag: "F2 · meses 2-4",
    tone: "sun",
    title: "Densidad y logística",
    items: [
      "Puntos de retiro compartidos para comedores y ollas",
      "Reserva recurrente ('cada martes te aviso')",
      "Balanza / reporte semanal automático al comercio",
      "Modo donación solidaria con ONG registrada",
    ],
  },
  {
    tag: "F3 · meses 4-12",
    tone: "berry",
    title: "Escala y monetización",
    items: [
      "Suscripción Pro para cadenas y franquicias",
      "Comisión baja solo en rescates pagos (5-8%)",
      "Reporte de impacto certificado para ESG",
      "App nativa + mapa de calor de rescates en vivo",
    ],
  },
];

const RISKS = [
  {
    title: "Seguridad alimentaria",
    text: "Reglas duras en el producto: solo comida en perfecto estado, ventana máxima de retiro, etiquetado obligatorio, cadena de frío declarada. Checklist de 4 preguntas antes de publicar.",
  },
  {
    title: "Responsabilidad legal",
    text: "Términos que dejan claro que Rescate es intermediario, no productor. Modelo de ley del buen samaritano / ley de donación de alimentos, y seguro de responsabilidad civil para comercios Pro.",
  },
  {
    title: "Gallina o huevo",
    text: "El marketplace muere sin densidad. Solución: arrancar con UN solo barrio y UN horario (el cierre), con comercios fundadores y reservas pre-cargadas.",
  },
  {
    title: "Fraude / no-show",
    text: "Código de retiro + contador de ausencias: quien no retira 3 veces pierde prioridad 24 h. El comercio recupera stock automáticamente.",
  },
  {
    title: "Margen raso",
    text: "Comisión sobre precio de rescate es poca plata. El negocio real es la suscripción de cadenas + reportes de impacto + datos de demanda por barrio.",
  },
];

const KPIS = [
  { k: "Rescates publicados por comercio", v: "≥ 4 / semana" },
  { k: "Tasa de retiro", v: "≥ 85 %" },
  { k: "Kilos rescatados por comercio / mes", v: "≥ 60 kg" },
  { k: "Tiempo hasta agotarse un rescate", v: "< 90 min" },
  { k: "Retención de vecinos a 30 días", v: "≥ 40 %" },
  { k: "Ratio oferta : demanda por barrio", v: "1 : 5" },
];

const PROMPTS = [
  {
    title: "1. Modelá el dominio antes que la pantalla",
    text: "“Creá las tablas users, businesses, listings y reservations en Drizzle con relaciones, índices y tipos inferidos. Los precios van en centavos (integer) para evitar floats.”",
  },
  {
    title: "2. Una feature = un prompt con criterio de aceptación",
    text: "“Agregá reserva con código de retiro: al reservar se descuenta stock de forma atómica, si llega a 0 el rescate pasa a agotado, y el vecino ve su código en /reservas.”",
  },
  {
    title: "3. Pedí el estado, no solo la vista",
    text: "“Listá los rescates activos filtrables por barrio, categoría, precio máximo y orden. Los filtros viven en la URL para que se puedan compartir.”",
  },
  {
    title: "4. Pedí datos verosímiles",
    text: "“Generá un seed idempotente con 5 comercios, 12 rescates y reservas ya retiradas para que el panel de impacto tenga números reales.”",
  },
  {
    title: "5. Validá siempre en el mismo orden",
    text: "typegen → tsc --noEmit → build → healthcheck. Si algo falla, corregí antes de seguir sumando features.",
  },
];

export default function PlanPage() {
  return (
    <div className="space-y-12">
      <section>
        <p className="text-[11px] font-black tracking-[0.16em] text-leaf uppercase">Análisis de producto</p>
        <h1 className="mt-1 max-w-3xl text-3xl leading-tight font-black tracking-tight sm:text-4xl">
          Rescate: un marketplace de 3 lados que arranca en una sola cuadra
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bark/70">
          La intuición es correcta: la comida desperdiciada es un problema logístico, no de buena
          voluntad. El sobrante existe a una hora conocida, a una distancia corta de alguien que lo
          quiere. Lo único que falta es el encuentro en el momento exacto. Ese es todo el producto.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {PROBLEM.map((p) => (
          <div key={p.stat} className="card p-5">
            <p className="text-3xl font-black text-leaf">{p.stat}</p>
            <p className="mt-1 text-sm font-semibold text-bark/75">{p.label}</p>
            <p className="mt-2 text-[11px] font-bold tracking-wide text-bark/40 uppercase">{p.source}</p>
          </div>
        ))}
      </section>

      <section>
        <SectionTitle
          title="Por qué puede funcionar"
          subtitle="Tres incentivos que empujan en la misma dirección"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {LOOPS.map((l) => (
            <div key={l.title} className="card p-5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sun-soft text-2xl">
                {l.emoji}
              </span>
              <h3 className="mt-3 font-black">{l.title}</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-bark/70">
                {l.bullets.map((b) => (
                  <li key={b}>· {b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Roadmap" subtitle="De prototipo a negocio, una fase a la vez" />
        <div className="grid gap-4 lg:grid-cols-4">
          {PHASES.map((p) => (
            <div key={p.tag} className="card flex flex-col p-5">
              <span
                className={`chip !w-fit ${
                  p.tone === "leaf"
                    ? "!border-leaf/25 !bg-leaf-soft !text-leaf"
                    : p.tone === "sun"
                      ? "!border-sun/30 !bg-sun-soft !text-[#8a5b00]"
                      : "!border-berry/25 !bg-[#fbe6e1] !text-berry"
                }`}
              >
                {p.tag}
              </span>
              <h3 className="mt-3 text-[15px] font-black">{p.title}</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-bark/70">
                {p.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden className="text-leaf">
                      ✓
                    </span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <SectionTitle title="Riesgos y cómo se resuelven" subtitle="Lo que mata este tipo de app" />
          <div className="space-y-4">
            {RISKS.map((r) => (
              <div key={r.title} className="border-l-2 border-leaf/30 pl-4">
                <h3 className="text-sm font-black text-bark">{r.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-bark/70">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <SectionTitle title="KPIs del piloto" subtitle="Números que definen si sigue" />
            <ul className="divide-y divide-bark/8">
              {KPIS.map((kpi) => (
                <li key={kpi.k} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="text-bark/70">{kpi.k}</span>
                  <span className="font-black text-leaf">{kpi.v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card bg-bark p-6 text-cream">
            <h3 className="font-black">Modelo de negocio</h3>
            <ul className="mt-3 space-y-2 text-sm text-cream/75">
              <li>💸 <strong className="text-cream">0 %</strong> en rescates gratuitos (motor de adopción)</li>
              <li>📉 <strong className="text-cream">5-8 %</strong> sobre rescates pagos</li>
              <li>🏪 <strong className="text-cream">Pro</strong>: cadenas, multi-sucursal y reportes</li>
              <li>📊 <strong className="text-cream">Impacto certificado</strong> para ESG y municipios</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle
          title="Cómo seguir construyéndolo con vibe coding"
          subtitle="El método aplicado en este prototipo, para que lo repliques"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROMPTS.map((p) => (
            <div key={p.title} className="card p-5">
              <h3 className="text-sm font-black text-bark">{p.title}</h3>
              <p className="mt-2 rounded-xl bg-cream p-3 text-[13px] leading-relaxed text-bark/75 italic">
                {p.text}
              </p>
            </div>
          ))}
        </div>
        <div className="card mt-4 p-6">
          <h3 className="font-black">Arquitectura de este prototipo</h3>
          <div className="mt-3 grid gap-3 text-sm text-bark/70 sm:grid-cols-2">
            <ul className="space-y-1.5">
              <li>📁 <code>src/db/schema.ts</code> · users, businesses, listings, reservations</li>
              <li>📁 <code>src/lib/queries.ts</code> · consultas y agregados de impacto</li>
              <li>📁 <code>src/app/actions.ts</code> · reservar, liberar, entregar, publicar</li>
            </ul>
            <ul className="space-y-1.5">
              <li>📁 <code>src/app/page.tsx</code> · descubrir con filtros en la URL</li>
              <li>📁 <code>src/app/comercio</code> · panel del comercio</li>
              <li>📁 <code>src/app/api/listings</code> · API JSON pública</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-3xl bg-leaf-soft p-6">
        <p className="max-w-lg text-sm font-semibold text-bark/80">
          Querés tocar el producto en vez de leerlo? Andá al mercado, reservá algo como vecino y
          después atendé la reserva desde el panel del comercio.
        </p>
        <Link href="/#rescates" className="btn-primary">
          Ir al mercado
        </Link>
        <Link href="/comercio#publicar" className="btn-ghost">
          Panel del comercio
        </Link>
      </section>
    </div>
  );
}
