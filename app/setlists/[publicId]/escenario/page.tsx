import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { StageMode } from "@/components/SetlistComponents/StageMode";
import {
  getSetlistByPublicId,
  userCanAccessSetlist,
} from "@/database/queries/setlists";

export const dynamic = "force-dynamic";

type Params = { publicId: string };

export default async function StagePage({
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
  if (!allowed) redirect(`/setlists/${publicId}`);

  return <StageMode setlist={setlist} entries={setlist.songs} />;
}
