"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Descubrir" },
  { href: "/alertas", label: "Alertas" },
  { href: "/reservas", label: "Mis reservas" },
  { href: "/comercio", label: "Mi comercio" },
  { href: "/impacto", label: "Impacto" },
  { href: "/vibecode", label: "Vibe coding" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 text-[13px] font-bold whitespace-nowrap transition ${
              active ? "bg-leaf text-white" : "text-bark/65 hover:bg-bark/5 hover:text-bark"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
