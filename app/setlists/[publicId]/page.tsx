import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SetlistDetail } from "@/components/SetlistComponents/SetlistDetail";
import {
  getSetlistByPublicId,
  userCanAccessSetlist,
} from "@/database/queries/setlists";

export const metadata: Metadata = {
  title: "Setlist",
};

export const dynamic = "force-dynamic";

type Params = { publicId: string };

export default async function SetlistPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { publicId } = await params;
  const session = await auth();
  const userId = Number(session!.user.id);

  const setlist = await getSetlistByPublicId(publicId);
  if (!setlist) notFound();

  const allowed =
    session!.user.isSuperadmin ||
    (await userCanAccessSetlist(setlist, userId));
  if (!allowed) redirect("/setlists");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <SetlistDetail setlist={setlist} />
    </main>
  );
}
