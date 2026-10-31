import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

export const SESSION_COOKIE = "rescate_uid";

/** Usuario por defecto (demo): el primer vecino disponible. */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const store = await cookies();
    const raw = store.get(SESSION_COOKIE)?.value;
    const id = raw ? Number.parseInt(raw, 10) : Number.NaN;

    if (Number.isFinite(id)) {
      const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (found[0]) return found[0];
    }

    const fallback = await db
      .select()
      .from(users)
      .where(eq(users.role, "vecino"))
      .orderBy(asc(users.id))
      .limit(1);
    return fallback[0] ?? null;
  } catch {
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    return await db.select().from(users).orderBy(asc(users.role), asc(users.id));
  } catch {
    return [];
  }
}
