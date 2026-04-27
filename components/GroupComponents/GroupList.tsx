import Link from "next/link";
import type { Group } from "@/database/schema";
import { es } from "@/lib/i18n/locales/es";

export function GroupList({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {es.groups.empty}
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <li key={g.publicId}>
          <Link
            href={`/grupos/${g.publicId}`}
            className="hover-lift flex flex-col gap-1 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          >
            <h3 className="font-semibold">{g.name}</h3>
            <p className="text-xs text-muted-foreground">{g.readableId}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
