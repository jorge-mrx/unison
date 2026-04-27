"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSetlistAction } from "@/lib/actions/setlists";
import { createSetlistSchema, type CreateSetlistInput } from "@/lib/validations";
import { es } from "@/lib/i18n/locales/es";

const t = es.setlists.create;

type Props = {
  groupOptions?: { publicId: string; name: string }[];
  initialGroupPublicId?: string;
};

export function SetlistCreateForm({ groupOptions = [], initialGroupPublicId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSetlistInput>({
    resolver: zodResolver(createSetlistSchema),
    defaultValues: {
      name: "",
      eventDate: "",
      venue: "",
      notes: "",
      ownerGroupPublicId: initialGroupPublicId ?? "",
    },
  });

  const onSubmit = (values: CreateSetlistInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createSetlistAction(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      router.replace(`/setlists/${result.publicId}`);
      router.refresh();
    });
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <header>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
      </header>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t.nameLabel}</Label>
        <Input
          id="name"
          placeholder={t.namePlaceholder}
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        {errors.name?.message && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="eventDate">{t.dateLabel}</Label>
          <Input
            id="eventDate"
            type="date"
            placeholder={t.datePlaceholder}
            {...register("eventDate")}
          />
          {errors.eventDate?.message && (
            <p className="text-sm text-destructive">{errors.eventDate.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="venue">{t.venueLabel}</Label>
          <Input id="venue" placeholder={t.venuePlaceholder} {...register("venue")} />
        </div>
      </div>

      {groupOptions.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="ownerGroupPublicId">Grupo (opcional)</Label>
          <select
            id="ownerGroupPublicId"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            {...register("ownerGroupPublicId")}
          >
            <option value="">— Setlist personal —</option>
            {groupOptions.map((g) => (
              <option key={g.publicId} value={g.publicId}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">{t.notesLabel}</Label>
        <textarea
          id="notes"
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register("notes")}
        />
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11">
        {pending ? es.common.saving : t.submit}
      </Button>
    </form>
  );
}
