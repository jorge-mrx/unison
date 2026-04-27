import type { Metadata } from "next";
import { auth } from "@/auth";
import { SongCreateForm } from "@/components/SongComponents/SongCreateForm";

export const metadata: Metadata = {
  title: "Subir canción",
};

export default async function NuevaCancionPage() {
  const session = await auth();
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-3 md:px-6 md:py-4">
      <SongCreateForm isAuthenticated={Boolean(session?.user?.id)} />
    </main>
  );
}
