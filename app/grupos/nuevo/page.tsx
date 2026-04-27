import type { Metadata } from "next";
import { GroupCreateForm } from "@/components/GroupComponents/GroupCreateForm";

export const metadata: Metadata = {
  title: "Nuevo grupo",
};

export default function NuevoGrupoPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <GroupCreateForm />
    </main>
  );
}
