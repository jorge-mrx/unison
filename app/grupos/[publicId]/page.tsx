import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { GroupDetail } from "@/components/GroupComponents/GroupDetail";
import { getGroupByPublicId } from "@/database/queries/groups";

export const metadata: Metadata = {
  title: "Grupo",
};

export const dynamic = "force-dynamic";

type Params = { publicId: string };

export default async function GroupPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { publicId } = await params;
  const session = await auth();
  const userId = Number(session!.user.id);

  const group = await getGroupByPublicId(publicId, userId);
  if (!group) notFound();

  const isMember = group.members.some((m) => m.user.id === userId);
  if (!isMember && !session!.user.isSuperadmin) {
    redirect("/grupos");
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <GroupDetail group={group} currentUserId={userId} />
    </main>
  );
}
