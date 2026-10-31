import Link from "next/link";
import { BARRIOS, CATEGORIES } from "@/lib/constants";

export type Orden = "pronto" | "precio" | "descuento" | "reciente" | "cerca";

export type FilterValues = {
  q: string;
  barrio: string;
  categoria: string;
  gratis: boolean;
  max: string;
  orden: Orden;
};

/** "cerca" solo está disponible si el vecino tiene sector configurado. */
export function normalizeOrden(raw: string, conSector = false): Orden {
  if (raw === "precio" || raw === "descuento" || raw === "reciente") return raw;
  if (raw === "cerca" && conSector) return "cerca";
  return "pronto";
}

export const EMPTY_FILTERS: FilterValues = {
  q: "",
  barrio: "",
  categoria: "",
  gratis: false,
  max: "",
  orden: "pronto",
};

function buildHref(values: FilterValues, patch: Partial<FilterValues>) {
  const merged = { ...values, ...patch };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.barrio) params.set("barrio", merged.barrio);
  if (merged.categoria) params.set("categoria", merged.categoria);
  if (merged.gratis) params.set("gratis", "1");
  if (merged.max) params.set("max", merged.max);
  if (merged.orden && merged.orden !== "pronto") params.set("orden", merged.orden);
  const qs = params.toString();
  return qs ? `/?${qs}#rescates` : "/#rescates";
}

export default function Filters({ values, total }: { values: FilterValues; total: number }) {
  const hasFilters =
    Boolean(values.q) || Boolean(values.barrio) || Boolean(values.categoria) || values.gratis || Boolean(values.max);

  return (
    <div className="space-y-3" id="rescates">
      <form method="get" action="/" className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="q">Buscar</label>
          <input
            id="q"
            name="q"
            defaultValue={values.q}
            placeholder="pan, guiso, bananas…"
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="barrio">Barrio</label>
          <select id="barrio" name="barrio" defaultValue={values.barrio} className="mt-1">
            <option value="">Todos</option>
            {BARRIOS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="max">Precio máx.</label>
          <input id="max" name="max" type="number" min="0" step="100" defaultValue={values.max} placeholder="$" className="mt-1" />
        </div>
        <div>
          <label htmlFor="orden">Ordenar</label>
          <select id="orden" name="orden" defaultValue={values.orden} className="mt-1">
            <option value="pronto">Retiro más pronto</option>
            <option value="cerca">🚶 Más cerca de mí</option>
            <option value="precio">Menor precio</option>
            <option value="descuento">Mayor descuento</option>
            <option value="reciente">Recién publicados</option>
          </select>
        </div>
        <label className="flex !normal-case !text-[13px] !tracking-normal !font-semibold !text-bark/80 items-center gap-2 rounded-xl border border-bark/12 bg-white px-3 py-2">
          <input type="checkbox" name="gratis" value="1" defaultChecked={values.gratis} className="!h-4 !w-4 !p-0 accent-[#166f4a]" />
          Solo gratis
        </label>
        <button type="submit" className="btn-primary">
          Aplicar
        </button>
        <input type="hidden" name="categoria" value={values.categoria} />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildHref(values, { categoria: "" })}
          className={`chip ${values.categoria === "" ? "!border-leaf !bg-leaf-soft !text-leaf" : ""}`}
        >
          Todo
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={buildHref(values, { categoria: c.slug })}
            className={`chip ${values.categoria === c.slug ? "!border-leaf !bg-leaf-soft !text-leaf" : ""}`}
          >
            <span aria-hidden>{c.emoji}</span>
            {c.label}
          </Link>
        ))}
        {hasFilters ? (
          <Link href="/#rescates" className="chip !border-berry/25 !bg-[#fbe6e1] !text-berry">
            ✕ Limpiar
          </Link>
        ) : null}
        <span className="ml-auto text-xs font-bold text-bark/45">
          {total} {total === 1 ? "rescate activo" : "rescates activos"}
        </span>
      </div>
    </div>
  );
}
