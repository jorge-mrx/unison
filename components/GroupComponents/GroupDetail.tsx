"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  deleteGroupAction,
  inviteToGroupAction,
  leaveGroupAction,
  removeMemberAction,
} from "@/lib/actions/groups";
import type { GroupDetail as GroupDetailType } from "@/database/queries/groups";
import { es } from "@/lib/i18n/locales/es";

const t = es.groups.detail;

type Props = {
  group: GroupDetailType;
  currentUserId: number;
};

export function GroupDetail({ group, currentUserId }: Props) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleInvite = () => {
    setInviteError(null);
    startTransition(async () => {
      const result = await inviteToGroupAction(group.publicId, { email: inviteEmail });
      if (!result.ok) {
        setInviteError(result.error);
        return;
      }
      setInviteEmail("");
      router.refresh();
    });
  };

  const handleRemove = (membershipPublicId: string) => {
    startTransition(async () => {
      await removeMemberAction(membershipPublicId);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!confirm(t.deleteConfirm)) return;
    startTransition(async () => {
      const result = await deleteGroupAction(group.publicId);
      if (result.ok) {
        router.replace("/grupos");
        router.refresh();
      }
    });
  };

  const handleLeave = async () => {
    startTransition(async () => {
      const result = await leaveGroupAction(group.publicId);
      if (result.ok) {
        router.replace("/grupos");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/grupos"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{group.name}</h1>
            <p className="text-xs text-muted-foreground">{group.readableId}</p>
          </div>
          <div className="flex gap-2">
            {group.isOwner ? (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={pending}
              >
                {t.delete}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleLeave} disabled={pending}>
                {t.leave}
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t.members}
        </h2>
        <ul className="flex flex-col gap-2">
          {group.members.map((m) => {
            const isOwner = m.user.id === group.ownerUserId;
            const isSelf = m.user.id === currentUserId;
            const canRemove = group.isOwner && !isOwner;
            return (
              <li
                key={m.membershipPublicId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{m.user.name}</span>
                    {isOwner && <Badge variant="default">{t.ownerBadge}</Badge>}
                    {isSelf && !isOwner && <Badge variant="secondary">{t.youBadge}</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{m.user.email}</span>
                </div>
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemove(m.membershipPublicId)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    {t.remove}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t.invite}
        </h2>
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="inviteEmail" className="sr-only">
              {t.inviteLabel}
            </Label>
            <Input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t.invitePlaceholder}
            />
          </div>
          <Button onClick={handleInvite} disabled={pending || !inviteEmail}>
            {t.inviteSubmit}
          </Button>
        </div>
        {inviteError && (
          <p role="alert" className="text-sm text-destructive">
            {inviteError}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t.setlists}
        </h2>
        {group.setlists.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin setlists todavía</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {group.setlists.map((s) => (
              <li key={s.publicId}>
                <Link
                  href={`/setlists/${s.publicId}`}
                  className="flex flex-col rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <span className="font-medium">{s.name}</span>
                  {s.eventDate && (
                    <span className="text-xs text-muted-foreground">{s.eventDate}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
