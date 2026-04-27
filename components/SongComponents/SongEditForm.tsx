"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArtistAutocomplete } from "@/components/SongComponents/ArtistAutocomplete";
import { SongEditor } from "@/components/SongComponents/SongEditor";
import { updateSongAction } from "@/lib/actions/songs";
import { hasChords } from "@/lib/chordpro";
import { updateSongSchema, type UpdateSongInput } from "@/lib/validations";
import { es } from "@/lib/i18n/locales/es";

const t = es.songs.create;

type Step = "lyrics" | "details";

type Props = {
  publicId: string;
  defaultValues: UpdateSongInput;
};

export function SongEditForm({ publicId, defaultValues }: Props) {
  const router = useRouter();
  const initialContent = defaultValues.contentChordPro ?? "";
  const [step, setStep] = useState<Step>("lyrics");
  const [content, setContent] = useState(initialContent);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const pendingNavRef = useRef<string | null>(null);
  const submittedRef = useRef(false);

  const dirty = !submittedRef.current && content !== initialContent;

  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const onLinkClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      const link = target?.closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) return;
      } catch {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      pendingNavRef.current = href;
      setLeaveOpen(true);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onLinkClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onLinkClick, true);
    };
  }, [dirty]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<UpdateSongInput>({
    resolver: zodResolver(updateSongSchema),
    defaultValues,
  });

  const onSubmit = (values: UpdateSongInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateSongAction(publicId, {
        ...values,
        contentChordPro: content,
      });
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      submittedRef.current = true;
      router.replace(`/canciones/${publicId}`);
      router.refresh();
    });
  };

  const requestCancel = () => {
    if (!dirty) {
      router.replace(`/canciones/${publicId}`);
      return;
    }
    pendingNavRef.current = `/canciones/${publicId}`;
    setLeaveOpen(true);
  };

  const closeLeaveDialog = () => {
    pendingNavRef.current = null;
    setLeaveOpen(false);
  };

  const proceedNavigation = () => {
    const target = pendingNavRef.current ?? `/canciones/${publicId}`;
    pendingNavRef.current = null;
    submittedRef.current = true;
    setLeaveOpen(false);
    if (target.startsWith("/") && !target.startsWith("//")) {
      router.replace(target);
    } else {
      window.location.href = target;
    }
  };

  if (step === "lyrics") {
    return (
      <>
        <div className="flex min-h-[calc(100dvh-5rem)] flex-col gap-3 md:min-h-[calc(100dvh-7rem)]">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={requestCancel}
              className="h-10 gap-1.5 px-3"
            >
              <X className="h-4 w-4" />
              {t.cancelEditing}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setValue("contentChordPro", content, { shouldValidate: true });
                setStep("details");
              }}
              className="h-10 gap-1.5 px-4"
            >
              {t.continue}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <SongEditor value={content} onChange={setContent} />
        </div>

        <Dialog open={leaveOpen} onOpenChange={(open) => !open && closeLeaveDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.leavePromptTitle}</DialogTitle>
              <DialogDescription>{t.leavePromptBody}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={closeLeaveDialog}>
                {t.leaveContinue}
              </Button>
              <Button variant="destructive" onClick={proceedNavigation}>
                {t.leaveDiscard}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const songHasChords = hasChords(content);

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <header className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.stepDetailsTitle}</h1>
        <button
          type="button"
          onClick={() => setStep("lyrics")}
          className="flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          {t.backToLyrics}
        </button>
      </header>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t.titleLabel}</Label>
        <Input
          id="title"
          placeholder={t.titlePlaceholder}
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
        {errors.title?.message && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="artist">{t.artistLabel}</Label>
        <Controller
          control={control}
          name="artist"
          render={({ field }) => (
            <ArtistAutocomplete
              id="artist"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder={t.artistPlaceholder}
            />
          )}
        />
      </div>

      <details className="group rounded-xl border border-border bg-card/40 transition-colors open:bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
          <span>{t.moreInfo}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="genre">{t.genreLabel}</Label>
              <Input id="genre" placeholder={t.genrePlaceholder} {...register("genre")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tags">{t.tagsLabel}</Label>
              <Input id="tags" placeholder={t.tagsPlaceholder} {...register("tags")} />
            </div>
          </div>

          <div className={songHasChords ? "grid gap-4 sm:grid-cols-2" : "flex flex-col gap-2"}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bpm">{t.bpmLabel}</Label>
              <Input
                id="bpm"
                type="number"
                inputMode="numeric"
                placeholder={t.bpmPlaceholder}
                aria-invalid={Boolean(errors.bpm)}
                {...register("bpm")}
              />
              {errors.bpm?.message && (
                <p className="text-sm text-destructive">{errors.bpm.message}</p>
              )}
            </div>
            {songHasChords && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="originalKey">{t.originalKeyLabel}</Label>
                <Input
                  id="originalKey"
                  placeholder={t.originalKeyPlaceholder}
                  {...register("originalKey")}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">{t.notesLabel}</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder={t.notesPlaceholder}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              {...register("notes")}
            />
          </div>
        </div>
      </details>

      {errors.contentChordPro?.message && (
        <p role="alert" className="text-sm text-destructive">
          {errors.contentChordPro.message}
        </p>
      )}
      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="h-11 flex-1">
          {pending ? es.common.saving : es.common.save}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={requestCancel}
          className="h-11"
        >
          {es.common.cancel}
        </Button>
      </div>
    </form>
  );
}
