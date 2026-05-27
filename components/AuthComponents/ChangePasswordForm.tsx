"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/lib/actions/auth";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations";
import { es } from "@/lib/i18n/locales/es";

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (values: ChangePasswordInput) => {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (result.ok) {
        setSuccess(true);
        reset();
      } else {
        setServerError(result.error);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <h2 className="text-lg font-semibold">{es.profile.changePassword}</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">{es.profile.currentPasswordLabel}</Label>
        <Input
          id="currentPassword"
          type="password"
          placeholder={es.profile.currentPasswordPlaceholder}
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">{es.profile.newPasswordLabel}</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder={es.profile.newPasswordPlaceholder}
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">{es.profile.confirmPasswordLabel}</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder={es.profile.confirmPasswordPlaceholder}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      {success && (
        <p className="text-sm text-green-500">{es.profile.changePasswordSuccess}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? es.profile.changePasswordSubmitting : es.profile.changePasswordSubmit}
      </Button>
    </form>
  );
}
