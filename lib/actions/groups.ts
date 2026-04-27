"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { groupMembers, groups, users } from "@/database/schema";
import {
  createGroupSchema,
  inviteToGroupSchema,
  type CreateGroupInput,
  type InviteToGroupInput,
} from "@/lib/validations";

export type GroupCreateResult =
  | { ok: true; publicId: string }
  | { ok: false; error: string };

export type SimpleResult = { ok: true } | { ok: false; error: string };

type Me = { ok: true; userId: number; isSuperadmin: boolean } | { ok: false; error: string };

async function requireUser(): Promise<Me> {
  const session = await auth();
  const id = session?.user?.id ? Number(session.user.id) : null;
  if (!id) return { ok: false, error: "Inicia sesión para gestionar grupos" };
  return { ok: true, userId: id, isSuperadmin: Boolean(session!.user.isSuperadmin) };
}

export async function createGroupAction(
  input: CreateGroupInput,
): Promise<GroupCreateResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const parsed = createGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const [created] = await db
    .insert(groups)
    .values({
      name: parsed.data.name,
      ownerUserId: me.userId,
      recordCreatedBy: `User:${me.userId}`,
    })
    .returning({ id: groups.id, publicId: groups.publicId });

  await db.insert(groupMembers).values({
    groupId: created!.id,
    userId: me.userId,
    recordCreatedBy: `User:${me.userId}`,
  });

  revalidatePath("/grupos");
  return { ok: true, publicId: created!.publicId };
}

export async function updateGroupAction(
  publicId: string,
  input: CreateGroupInput,
): Promise<SimpleResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const parsed = createGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.publicId, publicId))
    .limit(1);
  if (!group) return { ok: false, error: "Grupo no encontrado" };
  if (group.ownerUserId !== me.userId && !me.isSuperadmin) {
    return { ok: false, error: "Sin permiso" };
  }

  await db
    .update(groups)
    .set({
      name: parsed.data.name,
      recordUpdatedTimesTamp: new Date(),
      recordModifiedBy: `User:${me.userId}`,
    })
    .where(eq(groups.id, group.id));

  revalidatePath("/grupos");
  revalidatePath(`/grupos/${publicId}`);
  return { ok: true };
}

export async function deleteGroupAction(publicId: string): Promise<SimpleResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.publicId, publicId))
    .limit(1);
  if (!group) return { ok: false, error: "Grupo no encontrado" };
  if (group.ownerUserId !== me.userId && !me.isSuperadmin) {
    return { ok: false, error: "Sin permiso" };
  }

  await db.delete(groups).where(eq(groups.id, group.id));
  revalidatePath("/grupos");
  return { ok: true };
}

export async function inviteToGroupAction(
  publicId: string,
  input: InviteToGroupInput,
): Promise<SimpleResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const parsed = inviteToGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Email inválido" };
  }

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.publicId, publicId))
    .limit(1);
  if (!group) return { ok: false, error: "Grupo no encontrado" };

  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, me.userId)),
    )
    .limit(1);
  if (!membership && !me.isSuperadmin) {
    return { ok: false, error: "No eres miembro de este grupo" };
  }

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (!target) {
    return { ok: false, error: "No encontramos un usuario con ese email" };
  }

  const [existing] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, target.id)),
    )
    .limit(1);
  if (existing) {
    return { ok: false, error: "Ya es miembro" };
  }

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: target.id,
    recordCreatedBy: `User:${me.userId}`,
  });

  revalidatePath(`/grupos/${publicId}`);
  return { ok: true };
}

export async function removeMemberAction(
  membershipPublicId: string,
): Promise<SimpleResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.publicId, membershipPublicId))
    .limit(1);
  if (!membership) return { ok: false, error: "Miembro no encontrado" };

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, membership.groupId))
    .limit(1);
  if (!group) return { ok: false, error: "Grupo no encontrado" };

  const isOwner = group.ownerUserId === me.userId;
  const isSelf = membership.userId === me.userId;
  if (!isOwner && !isSelf && !me.isSuperadmin) {
    return { ok: false, error: "Sin permiso" };
  }
  if (membership.userId === group.ownerUserId) {
    return { ok: false, error: "El owner no puede salir del grupo, eliminalo" };
  }

  await db.delete(groupMembers).where(eq(groupMembers.id, membership.id));
  revalidatePath(`/grupos/${group.publicId}`);
  return { ok: true };
}

export async function leaveGroupAction(
  groupPublicId: string,
): Promise<SimpleResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.publicId, groupPublicId))
    .limit(1);
  if (!group) return { ok: false, error: "Grupo no encontrado" };

  if (group.ownerUserId === me.userId) {
    return { ok: false, error: "Eres el owner, elimina el grupo en lugar de salir" };
  }

  await db
    .delete(groupMembers)
    .where(
      and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, me.userId)),
    );
  revalidatePath(`/grupos/${groupPublicId}`);
  revalidatePath("/grupos");
  return { ok: true };
}
