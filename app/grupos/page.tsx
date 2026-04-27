import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { GroupList } from "@/components/GroupComponents/GroupList";
import { listMyGroups } from "@/database/queries/groups";
import { es } from "@/lib/i18n/locales/es";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Grupos",
};

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const session = await auth();
  const userId = Number(session!.user.id);
  const list = await listMyGroups(userId);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-semibold">{es.groups.listTitle}</h1>
        <Link
          href="/grupos/nuevo"
          className={cn(buttonVariants({ variant: "default" }), "h-11 self-start px-5 sm:self-auto")}
        >
          {es.groups.newCta}
        </Link>
      </header>
      <GroupList groups={list} />
    </main>
  );
}
