export const CATEGORIES = [
  { slug: "panaderia", label: "Panadería & dulce", emoji: "🥐" },
  { slug: "listo", label: "Comida lista", emoji: "🍲" },
  { slug: "frutas", label: "Frutas & verduras", emoji: "🥬" },
  { slug: "lacteos", label: "Lácteos & frío", emoji: "🧀" },
  { slug: "despensa", label: "Despensa", emoji: "🥫" },
] as const;

export const BARRIOS = [
  "Centro",
  "Palermo",
  "San Telmo",
  "Almagro",
  "Caballito",
  "Villa Crespo",
  "Recoleta",
  "Belgrano",
] as const;

export const BUSINESS_TYPES = [
  { slug: "panaderia", label: "Panadería", emoji: "🥖" },
  { slug: "restaurante", label: "Restaurante", emoji: "🍽️" },
  { slug: "cafeteria", label: "Cafetería", emoji: "☕" },
  { slug: "supermercado", label: "Supermercado / dietética", emoji: "🛒" },
  { slug: "verduleria", label: "Verdulería", emoji: "🥕" },
  { slug: "rotiseria", label: "Rotisería", emoji: "🥘" },
] as const;

export const REASONS = [
  "Sobrante del día",
  "Se acerca el vencimiento",
  "Empaque dañado",
  "Producción de más",
  "Fruta/verdura imperfecta",
  "Pedido cancelado",
] as const;

/** 1 kg de comida evitada ≈ 2,5 kg de CO₂eq (FAO / WRAP, orden de magnitud). */
export const CO2_KG_PER_FOOD_KG = 2.5;
/** 1 kg de alimento ≈ 2,4 raciones (estimación conservadora). */
export const MEALS_PER_FOOD_KG = 2.4;

/** Centroides aproximados (CABA) para calcular distancia real a pie. */
export const BARRIO_COORDS: Record<string, { lat: number; lng: number }> = {
  Centro: { lat: -34.6037, lng: -58.3816 },
  Palermo: { lat: -34.578, lng: -58.426 },
  "San Telmo": { lat: -34.621, lng: -58.372 },
  Almagro: { lat: -34.608, lng: -58.42 },
  Caballito: { lat: -34.619, lng: -58.44 },
  "Villa Crespo": { lat: -34.599, lng: -58.438 },
  Recoleta: { lat: -34.588, lng: -58.396 },
  Belgrano: { lat: -34.562, lng: -58.456 },
};

export function categoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function categoryEmoji(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.emoji ?? "🍱";
}
