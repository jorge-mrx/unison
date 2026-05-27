"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { migrateGuestSongsAction } from "@/lib/actions/songs";
import {
  signInSchema,
  signUpSchema,
  changePasswordSchema,
  type SignInInput,
  type SignUpInput,
  type ChangePasswordInput,
} from "@/lib/validations";

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

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitas iniciar sesión" };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const userId = Number(session.user.id);
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { ok: false, error: "Usuario no encontrado" };
  }

  const ok = await compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return { ok: false, error: "La contraseña actual es incorrecta" };
  }

  const newHash = await hash(parsed.data.newPassword, 12);
  await db
    .update(users)
    .set({
      passwordHash: newHash,
      recordUpdatedTimesTamp: new Date(),
      recordModifiedBy: `User:${userId}`,
    })
    .where(eq(users.id, userId));

  return { ok: true, redirectTo: "/perfil" };
}

export async function signOutAction(): Promise<ActionResult> {
  await signOut({ redirect: false });
  return { ok: true, redirectTo: "/" };
}
