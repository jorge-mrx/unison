import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <Link href="/" className="mb-8 font-display text-4xl text-primary">
        Unison
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg shadow-black/40">
        {children}
      </div>
    </div>
  );
}
