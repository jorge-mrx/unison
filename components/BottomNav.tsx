"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, ListMusic, Users, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isAuthed: boolean;
};

const PRIMARY_ITEMS = [
  { href: "/canciones", label: "Canciones", icon: Music },
  { href: "/setlists", label: "Setlists", icon: ListMusic },
  { href: "/grupos", label: "Grupos", icon: Users },
] as const;

const HIDE_PATTERNS = ["/escenario"];

export function BottomNav({ isAuthed }: Props) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const cur = window.scrollY;
        const delta = cur - last;
        if (delta > 4 && cur > 80) setHidden(true);
        else if (delta < -4 || cur < 80) setHidden(false);
        last = cur;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (HIDE_PATTERNS.some((pattern) => pathname?.includes(pattern))) {
    return null;
  }

  const profileItem = isAuthed
    ? { href: "/perfil", label: "Perfil", icon: User }
    : { href: "/sign-in", label: "Entrar", icon: LogIn };

  const items = [...PRIMARY_ITEMS, profileItem];

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur transition-transform duration-200 md:hidden",
        hidden ? "translate-y-full" : "translate-y-0",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex h-14 items-stretch">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (pathname?.startsWith(item.href + "/") ?? false);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/15",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
