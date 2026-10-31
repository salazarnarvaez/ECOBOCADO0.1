import Link from "next/link";
import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "leaf" | "sun" | "berry" | "muted";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-white text-bark/80 border-bark/12",
    leaf: "bg-leaf-soft text-leaf border-leaf/20",
    sun: "bg-sun-soft text-[#8a5b00] border-sun/30",
    berry: "bg-[#fbe6e1] text-berry border-berry/25",
    muted: "bg-bark/5 text-bark/55 border-bark/10",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatCard({
  value,
  label,
  hint,
  emoji,
}: {
  value: string;
  label: string;
  hint?: string;
  emoji: string;
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-bark sm:text-3xl">{value}</div>
      <div className="text-xs font-bold tracking-wide text-bark/60 uppercase">{label}</div>
      {hint ? <div className="mt-1 text-xs text-bark/45">{hint}</div> : null}
    </div>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const low = pct <= 34;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-bark/10">
      <div
        className={`h-full rounded-full ${low ? "bg-berry" : "bg-leaf"}`}
        style={{ width: `${Math.max(pct, low ? 8 : 4)}%` }}
      />
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-black tracking-tight text-bark sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-bark/60">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Flash({ tone, children }: { tone: "ok" | "error"; children: ReactNode }) {
  if (!children) return null;
  return (
    <div
      className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
        tone === "ok"
          ? "border-leaf/25 bg-leaf-soft text-leaf"
          : "border-berry/25 bg-[#fbe6e1] text-berry"
      }`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  description,
  href,
  cta,
}: {
  emoji: string;
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <div className="text-4xl">{emoji}</div>
      <h3 className="text-lg font-bold text-bark">{title}</h3>
      <p className="max-w-sm text-sm text-bark/60">{description}</p>
      {href && cta ? (
        <Link href={href} className="btn-primary mt-3">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
