"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGroupAction } from "@/lib/actions/groups";
import { createGroupSchema, type CreateGroupInput } from "@/lib/validations";
import { es } from "@/lib/i18n/locales/es";

const t = es.groups.create;

export function GroupCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = (values: CreateGroupInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createGroupAction(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      router.replace(`/grupos/${result.publicId}`);
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
