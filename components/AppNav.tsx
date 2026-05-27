import Link from "next/link";
import { NAV_LINKS } from "@/constants";

type Props = {
  isAuthed: boolean;
};

export function AppNav({ isAuthed }: Props) {
  return (
    <header className="sticky top-0 z-30 hidden border-b border-border bg-background/85 backdrop-blur md:block">
      <nav className="mx-auto flex w-full max-w-5xl items-center gap-3 px-6 py-3">
        <ul className="flex items-center gap-1 text-sm text-muted-foreground">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-md px-3 py-1.5 hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
          {isAuthed && (
            <li>
              <Link
                href="/perfil"
                className="rounded-md px-3 py-1.5 hover:bg-muted hover:text-foreground"
              >
                Perfil
              </Link>
            </li>
          )}
        </ul>
        {!isAuthed && (
          <Link
            href="/sign-in"
            className="ml-auto rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Acceder
          </Link>
        )}
      </nav>
    </header>
  );
}
