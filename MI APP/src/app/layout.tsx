import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rescate · comida de tu barrio que no se tira",
  description:
    "Mercado local donde panaderías, restaurantes y vecinos rescatan comida en perfecto estado a precio de rescate o gratis.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen text-bark antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">{children}</main>
        <footer className="mt-10 border-t border-bark/8 bg-white/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-bark/60">
            <div>
              <p className="font-black text-bark">🥖 Rescate</p>
              <p className="mt-1 max-w-md text-xs">
                Prototipo funcional construido con vibe coding: Next.js, PostgreSQL y Drizzle ORM. Los
                datos son de demostración.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <Link href="/plan">Plan de producto</Link>
              <Link href="/impacto">Impacto</Link>
              <Link href="/comercio">Para comercios</Link>
              <Link href="/api/listings">API</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
