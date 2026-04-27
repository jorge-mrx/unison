import type { Metadata } from "next";
import { auth } from "@/auth";
import { SongLibrary } from "@/components/SongComponents/SongLibrary";
import { searchSongs } from "@/database/queries/songs";
import { getCurrentGuestId } from "@/lib/guest";

export const metadata: Metadata = {
  title: "Canciones",
};

export const dynamic = "force-dynamic";

export default async function CancionesPage() {
  const session = await auth();
  const currentUserId = session?.user?.id ? Number(session.user.id) : null;
  const currentGuestId = await getCurrentGuestId();

  const initialItems = await searchSongs({
    filter: "all",
    currentUserId,
    currentGuestId,
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-6">
      <SongLibrary
        initialItems={initialItems}
        isAuthenticated={Boolean(currentUserId)}
      />
    </main>
  );
}
