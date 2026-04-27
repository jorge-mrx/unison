"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { es } from "@/lib/i18n/locales/es";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await signOutAction();
          if (result.ok) {
            router.replace(result.redirectTo);
            router.refresh();
          }
        })
      }
    >
      {es.auth.signOut.submit}
    </Button>
  );
}
