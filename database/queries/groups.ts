import { eq, inArray } from "drizzle-orm";
import { db } from "@/database/drizzle";
import {
  groupMembers,
  groups,
  setlists,
  users,
  type Group,
  type Setlist,
  type User,
} from "@/database/schema";

export type GroupRow = Group;

export type GroupDetail = Group & {
  members: Array<{
    membershipPublicId: string;
    user: Pick<User, "id" | "publicId" | "name" | "email">;
    joinedAt: Date;
  }>;
  setlists: Setlist[];
  isOwner: boolean;
};

export async function listMyGroups(userId: number): Promise<GroupRow[]> {
  const rows = await db
    .select({ group: groups })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, userId));
  return rows.map((r) => r.group);
}

export async function getGroupByPublicId(
  publicId: string,
  currentUserId: number,
): Promise<GroupDetail | null> {
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.publicId, publicId))
    .limit(1);
  if (!group) return null;

  const memberRows = await db
    .select({
      membershipPublicId: groupMembers.publicId,
      joinedAt: groupMembers.joinedAt,
      user: {
        id: users.id,
        publicId: users.publicId,
        name: users.name,
        email: users.email,
      },
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, group.id));

  const groupSetlists = await db
    .select()
    .from(setlists)
    .where(eq(setlists.ownerGroupId, group.id));

  return {
    ...group,
    members: memberRows.map((r) => ({
      membershipPublicId: r.membershipPublicId,
      joinedAt: r.joinedAt,
      user: r.user,
    })),
    setlists: groupSetlists,
    isOwner: group.ownerUserId === currentUserId,
  };
}

export async function isUserInGroup(
  userId: number,
  groupId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId))
    .limit(1);
  void row;
  const [direct] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      inArray(groupMembers.userId, [userId]),
    )
    .limit(1);
  return Boolean(direct);
}
