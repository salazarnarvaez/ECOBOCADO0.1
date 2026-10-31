const money = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(cents: number): string {
  if (cents <= 0) return "Gratis";
  const value = cents / 100;
  return `$${money.format(value)}`;
}

export function formatPricePlain(cents: number): string {
  return `$${money.format(cents / 100)}`;
}

export function discountPercent(originalCents: number, priceCents: number): number {
  if (originalCents <= 0 || priceCents < 0 || priceCents >= originalCents) return 0;
  return Math.round(((originalCents - priceCents) / originalCents) * 100);
}

export function formatKg(kg: number): string {
  if (kg >= 1000) return `${money.format(kg / 1000)} t`;
  if (kg >= 10) return `${Math.round(kg)} kg`;
  return `${(Math.round(kg * 10) / 10).toFixed(1)} kg`;
}

/** 800 m o 1,2 km según la magnitud. */
export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined || !Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.max(50, Math.round(km * 1000 / 50) * 50)} m`;
  return `${(Math.round(km * 10) / 10).toFixed(1)} km`;
}

export function walkMinutes(km: number | null | undefined): number | null {
  if (km === null || km === undefined || !Number.isFinite(km)) return null;
  // ~4,5 km/h de paso urbano
  return Math.max(1, Math.round((km / 4.5) * 60));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-AR").format(Math.round(n));
}

const dtf = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const tf = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });

export function formatPickupWindow(from: Date, until: Date): string {
  return `${dtf.format(from).replace(",", " ·")} → ${tf.format(until)}`;
}

export function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function relative(from: Date, now = new Date()): string {
  const diffMs = untilSafe(from.getTime() - now.getTime());
  const mins = Math.round(diffMs / 60000);
  if (Math.abs(mins) < 60) return mins >= 0 ? `en ${mins} min` : `hace ${-mins} min`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return hours >= 0 ? `en ${hours} h` : `hace ${-hours} h`;
  const days = Math.round(hours / 24);
  return days >= 0 ? `en ${days} d` : `hace ${-days} d`;
}

function untilSafe(ms: number) {
  if (!Number.isFinite(ms)) return 0;
  return ms;
}

export function pickupState(until: Date, now = new Date()): "abierto" | "último" | "cerrado" {
  const mins = (until.getTime() - now.getTime()) / 60000;
  if (mins <= 0) return "cerrado";
  if (mins <= 90) return "último";
  return "abierto";
}

export function code() {
  const alphabet = "ACDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
