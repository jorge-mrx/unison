import Link from "next/link";
import type { Setlist } from "@/database/schema";
import { formatRelative } from "@/lib/time";
import { es } from "@/lib/i18n/locales/es";

type Props = {
  setlists: Setlist[];
};

export function SetlistList({ setlists }: Props) {
  if (setlists.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {es.setlists.empty}
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {setlists.map((s) => (
        <li key={s.publicId}>
          <Link
            href={`/setlists/${s.publicId}`}
            className="hover-lift flex flex-col gap-1 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          >
            <h3 className="font-semibold leading-tight">{s.name}</h3>
            <p className="text-xs text-muted-foreground">
              {s.eventDate ? `${es.setlists.detail.eventDate} ${s.eventDate}` : null}
              {s.eventDate && s.venue ? " · " : null}
              {s.venue}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              {formatRelative(s.recordCreationTimeStamp)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
