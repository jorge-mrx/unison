import type { Metadata, Viewport } from "next";
import { Inter, Righteous, JetBrains_Mono } from "next/font/google";
import { auth } from "@/auth";
import { AppNav } from "@/components/AppNav";
import { BottomNav } from "@/components/BottomNav";
import { SplashScreen } from "@/components/SplashScreen";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const righteous = Righteous({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Unison",
    template: "%s · Unison",
  },
  description: "Biblioteca colaborativa de canciones y setlists para vocalistas y bandas",
  applicationName: "Unison",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Unison",
  },
};

export const viewport: Viewport = {
  themeColor: "#13131C",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAuthed = Boolean(session?.user?.id);

  return (
    <html
      lang="es"
      className={`dark ${inter.variable} ${righteous.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background pb-16 text-foreground antialiased md:pb-0">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('unison.theme');if(t==='light')document.documentElement.classList.remove('dark');}catch(e){}})();`,
          }}
        />
        <SplashScreen />
        <AppNav isAuthed={isAuthed} />
        {children}
        <BottomNav isAuthed={isAuthed} />
      </body>
    </html>
  );
}
