import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { SetlistList } from "@/components/SetlistComponents/SetlistList";
import { listMySetlists } from "@/database/queries/setlists";
import { es } from "@/lib/i18n/locales/es";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Setlists",
};

export const dynamic = "force-dynamic";

export default async function SetlistsPage() {
  const session = await auth();
  const userId = Number(session!.user.id);
  const list = await listMySetlists(userId);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">{es.setlists.listTitle}</h1>
          <p className="text-sm text-muted-foreground">{es.setlists.listSubtitle}</p>
        </div>
        <Link
          href="/setlists/nuevo"
          className={cn(buttonVariants({ variant: "default" }), "h-11 self-start px-5 sm:self-auto")}
        >
          {es.setlists.newCta}
        </Link>
      </header>
      <SetlistList setlists={list} />
    </main>
  );
}
