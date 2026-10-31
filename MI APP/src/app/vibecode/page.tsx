import Link from "next/link";

export const metadata = {
  title: "Cómo seguir construyendo con vibe coding · Rescate",
};

const PRIMER_PROMPT = `Ahora que el marketplace funciona, quiero resolver el problema de retención: los rescates aparecen a las 20:14 y se agotan a las 20:40, y nadie está mirando la app a esa hora.

**Construí "Alertas de barrio" con distancia real.**

1. Modelo de datos (Drizzle, src/db/schema.ts):
   - Agregá lat/lng (doublePrecision) a businesses y a users, y radio_km (integer) a users.
   - Nueva tabla \`alerts\`: id, user_id, nombre, barrio (nullable), categoria (nullable), max_price_cents (nullable), solo_gratis, radio_km, activa.
   - Nueva tabla \`notifications\`: id, user_id, alert_id, listing_id, titulo, leido, created_at.
   - Precios en centavos (integer), nunca floats. Índices en user_id y listing_id.

2. Distancia real: calculá Haversine en SQL (no en JS) para poder filtrar y ordenar por distancia. Agregá el orden "cerca" a la home que filtra por el radio del vecino y ordena de más cerca a más lejos, mostrando "800 m" o "1,2 km" en la tarjeta.

3. Motor de matching: exportá una Server Action \`matchAlertsForListing\` que, al publicar un rescate, genere una notificación por cada alerta activa que matchee categoría, tope de precio, "solo gratis" y (barrio O distancia dentro del radio). No notifiques dos veces el mismo rescate al mismo usuario y nunca rompas la publicación si el matching falla (try/catch + log).

4. UI en \`/alertas\`: alta y baja de alertas, configuración de sector (barrio + radio), bandeja de avisos con las no leídas resaltadas, y campana con contador en el header.

5. Criterio de aceptación: publicar un rescate como comercio muestra cuántos vecinos fueron avisados; el vecino ve el aviso en la campana; el matching no crea duplicados; tsc y build pasan.`;

const REGLAS = [
  {
    n: "01",
    t: "Arrancá del dolor, no de la pantalla",
    d: "El prompt siempre abre con el problema concreto: 'los rescates aparecen a las 20:14 y nadie mira la app'. Eso te da el criterio de aceptación gratis.",
  },
  {
    n: "02",
    t: "Modelá el dominio antes que la vista",
    d: "El punto 1 del prompt es el schema. Si las tablas están bien, la UI sale sola; al revés no.",
  },
  {
    n: "03",
    t: "Decí dónde va cada cosa",
    d: "Mencionar archivos (src/db/schema.ts, /alertas) evita que el agente invente estructura paralela y te deje un repo imposible de mantener.",
  },
  {
    n: "04",
    t: "Anticipá los casos feos",
    d: "'No dupliques notificaciones' y 'si el matching falla, que igual se publique' son las dos frases que separan un prototipo de un producto.",
  },
  {
    n: "05",
    t: "Cerrá con verificación medible",
    d: "Terminá siempre con el criterio de aceptación y los comandos de validación. Sin eso, 'listo' significa cualquier cosa.",
  },
];

const SIGUIENTES = [
  {
    tag: "Prompt 2",
    titulo: "Retiro sin fricción",
    texto:
      "Agregá validación del código de retiro del lado del comercio: un input donde pega el código, marca la reserva como entregada y muestra el nombre del vecino. Si el código no existe o ya fue usado, mostrá el error en la misma página sin recargar.",
  },
  {
    tag: "Prompt 3",
    titulo: "Confianza y seguridad alimentaria",
    texto:
      "Antes de publicar, obligá un checklist de 4 preguntas (¿está en perfecto estado?, ¿tiene etiquetado?, ¿necesita cadena de frío?, ¿declaro la ventana?). Guardalo en el listing y mostralo en el detalle.",
  },
  {
    tag: "Prompt 4",
    titulo: "Notificación real por WhatsApp",
    texto:
      "Reemplazá la bandeja interna por un envío real: una route /api/notify que lea las notificaciones pendientes y llame a la API de WhatsApp Business usando process.env.WHATSAPP_TOKEN. Encolá y registrá el resultado.",
  },
  {
    tag: "Prompt 5",
    titulo: "El dato que falta",
    texto:
      "Al comercio le importa saber cuánto dejó de tirar. Agregá un reporte semanal por comercio: kg rescatados, top de rescates que más volaron y comparación con el barrio.",
  },
];

export default function VibecodePage() {
  return (
    <div className="space-y-12">
      <section>
        <p className="text-[11px] font-black tracking-[0.16em] text-leaf uppercase">Método</p>
        <h1 className="mt-1 max-w-3xl text-3xl leading-tight font-black tracking-tight sm:text-4xl">
          Cómo seguir construyendo esto con vibe coding
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bark/70">
          Vibe coding no es &quot;pedile una app&quot;. Es delegar un vertido bien definido por vez, con dominio de
          datos claro, casos feos anticipados y criterio de aceptación explícito. Acá está el primer
          prompt —el que ya ejecutamos en esta app— y los que siguen.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black tracking-tight">🎯 El primer prompt</h2>
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bark/8 bg-leaf-soft px-5 py-3">
            <p className="text-[11px] font-black tracking-[0.14em] text-leaf uppercase">
              Copiar y pegar · retención por alertas
            </p>
            <Link href="/alertas" className="btn-primary !py-1.5 !text-[12px]">
              Ver el resultado construido
            </Link>
          </div>
          <pre className="overflow-x-auto bg-bark p-5 text-[12.5px] leading-relaxed whitespace-pre-wrap text-cream/90">
{PRIMER_PROMPT}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black tracking-tight">Las 5 reglas del prompt que funciona</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REGLAS.map((r) => (
            <div key={r.n} className="card p-5">
              <span className="text-2xl font-black text-leaf">{r.n}</span>
              <h3 className="mt-1 text-[15px] font-black">{r.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-bark/70">{r.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black tracking-tight">Los prompts que siguen</h2>
        <div className="space-y-3">
          {SIGUIENTES.map((p) => (
            <div key={p.tag} className="card p-5">
              <span className="chip !border-sun/30 !bg-sun-soft !text-[#8a5b00]">{p.tag}</span>
              <h3 className="mt-2 text-[15px] font-black">{p.titulo}</h3>
              <p className="mt-1.5 rounded-xl bg-cream p-3 text-[13px] leading-relaxed text-bark/75 italic">
                {p.texto}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-black tracking-tight">El ritual de validación (no es opcional)</h2>
        <p className="mt-2 text-sm text-bark/70">
          Después de cada prompt, en este orden. Si algo falla, corregí antes de seguir: los errores se
          componen y después ya no sabés qué rompió qué.
        </p>
        <ol className="mt-4 space-y-2 text-sm">
          {[
            ["npx drizzle-kit push", "aplica el schema nuevo a la base"],
            ["npx next typegen", "regenera los tipos de rutas"],
            ["npm exec tsc -- --noEmit", "tipos sin compilar nada"],
            ["npm run build", "build de producción real"],
            ["probar el flujo con HTTP", "reservá, publicá, entregá: la UI puede mentir, la base no"],
          ].map(([cmd, why], i) => (
            <li key={cmd} className="flex flex-wrap items-center gap-3 rounded-xl bg-cream px-4 py-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf text-[11px] font-black text-white">
                {i + 1}
              </span>
              <code className="font-bold text-bark">{cmd}</code>
              <span className="text-xs text-bark/55">— {why}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-3xl bg-leaf-soft p-6">
        <p className="max-w-lg text-sm font-semibold text-bark/80">
          Este prototipo ya implementó el primer prompt completo: alertas, distancia Haversine en SQL,
          motor de matching y bandeja de avisos. Tocalo antes de escribir el prompt 2.
        </p>
        <Link href="/alertas" className="btn-primary">
          Probar las alertas
        </Link>
        <Link href="/#rescates" className="btn-ghost">
          Volver al mercado
        </Link>
      </section>
    </div>
  );
}
