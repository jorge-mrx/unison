import type { Metadata } from "next";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/AuthComponents/SignOutButton";
import { PreferencesSection } from "@/components/PreferencesSection";
import { es } from "@/lib/i18n/locales/es";

export const metadata: Metadata = {
  title: "Perfil",
};

export default async function PerfilPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{es.profile.title}</h1>
        <p className="text-sm text-muted-foreground">{es.profile.signedInAs}</p>
      </header>

      {user && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <p className="text-lg font-medium">{user.name}</p>
            {user.isSuperadmin && (
              <Badge variant="default">{es.profile.superadminBadge}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </section>
      )}

      <PreferencesSection />

      <SignOutButton />
    </main>
  );
}
