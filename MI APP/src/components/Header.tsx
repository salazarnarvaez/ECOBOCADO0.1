import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import UserSwitcher from "@/components/UserSwitcher";
import { setSession } from "@/app/actions";
import { countUnreadNotifications } from "@/lib/queries";
import { getAllUsers, getCurrentUser } from "@/lib/session";

export default async function Header() {
  const [user, users] = await Promise.all([getCurrentUser(), getAllUsers()]);
  const unread = user ? await countUnreadNotifications(user.id) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-bark/8 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-leaf text-lg text-white shadow-sm">
            🥖
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-black tracking-tight text-bark">Rescate</span>
            <span className="block text-[10px] font-bold tracking-[0.14em] text-bark/45 uppercase">
              comida que no se tira
            </span>
          </span>
        </Link>

        <div className="order-3 w-full sm:order-2 sm:w-auto">
          <NavLinks />
        </div>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
          <Link
            href="/alertas"
            title={`${unread} avisos sin leer`}
            className="relative grid h-9 w-9 place-items-center rounded-full border border-bark/12 bg-white text-base transition hover:border-bark/30"
          >
            🔔
            {unread > 0 ? (
              <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-berry px-1 text-[10px] font-black text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>
          <Link href="/comercio#publicar" className="btn-primary hidden !py-2 !text-[13px] md:inline-flex">
            Publicar rescate
          </Link>
          <UserSwitcher
            users={users.map((u) => ({
              id: u.id,
              name: u.name,
              role: u.role,
              emoji: u.emoji,
              barrio: u.barrio,
            }))}
            currentId={user?.id ?? null}
            action={setSession}
          />
        </div>
      </div>
    </header>
  );
}
