"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { migrateGuestSongsAction } from "@/lib/actions/songs";
import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from "@/lib/validations";

export type ActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

export async function signInAction(input: SignInInput): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Email o contraseña inválidos" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Email o contraseña incorrectos" };
    }
    throw error;
  }

  return { ok: true, redirectTo: "/" };
}

export async function signUpAction(input: SignUpInput): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { ok: false, error: message };
  }

  const { name, email, password } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { ok: false, error: "Ya existe una cuenta con ese email" };
  }

  const passwordHash = await hash(password, 12);

  const [created] = await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash,
      recordCreatedBy: "SignUpForm",
    })
    .returning({ id: users.id });

  if (created) {
    await migrateGuestSongsAction(created.id);
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Cuenta creada, pero falló el inicio de sesión" };
    }
    throw error;
  }

  return { ok: true, redirectTo: "/" };
}

export async function signOutAction(): Promise<ActionResult> {
  await signOut({ redirect: false });
  return { ok: true, redirectTo: "/" };
}
