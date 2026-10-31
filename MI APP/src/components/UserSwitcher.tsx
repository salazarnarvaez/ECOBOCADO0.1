"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";

export default function UserSwitcher({
  users,
  currentId,
  action,
}: {
  users: { id: number; name: string; role: string; emoji: string; barrio: string }[];
  currentId: number | null;
  action: (formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const pathname = usePathname();
  const current = users.find((u) => u.id === currentId);

  return (
    <form ref={formRef} action={action} className="flex items-center gap-2">
      <input type="hidden" name="next" value={pathname || "/"} />
      <span aria-hidden className="hidden text-xl sm:inline">
        {current?.emoji ?? "👤"}
      </span>
      <select
        name="userId"
        defaultValue={currentId ?? undefined}
        onChange={() => formRef.current?.requestSubmit()}
        aria-label="Perfil activo"
        className="!w-auto max-w-[190px] !border-bark/12 !bg-white !py-1.5 !text-[13px] font-bold"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.emoji} {u.name} · {u.role === "comercio" ? "comercio" : u.barrio}
          </option>
        ))}
      </select>
    </form>
  );
}
