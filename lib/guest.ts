import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

export const GUEST_COOKIE = "unison_guest_id";
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function getCurrentGuestId(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_COOKIE)?.value ?? null;
}

export async function getOrCreateGuestId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return id;
}

export async function clearGuestId(): Promise<void> {
  const store = await cookies();
  store.delete(GUEST_COOKIE);
}
