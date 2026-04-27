import type { Metadata } from "next";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { groupMembers, groups } from "@/database/schema";
import { SetlistCreateForm } from "@/components/SetlistComponents/SetlistCreateForm";

export const metadata: Metadata = {
  title: "Nuevo setlist",
};

export default async function NuevoSetlistPage() {
  const session = await auth();
  const userId = Number(session!.user.id);

  const myGroups = await db
    .select({ publicId: groups.publicId, name: groups.name })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, userId));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <SetlistCreateForm groupOptions={myGroups} />
    </main>
  );
}
