import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { JerseyThemeProvider } from "@/components/JerseyThemeProvider";
import ThemedSmokeBackground from "@/components/ThemedSmokeBackground";
import TopBar from "@/components/TopBar";
import BottomTabNav from "@/components/BottomTabNav";
import PageTransition from "@/components/PageTransition";
import MotionProvider from "@/components/MotionProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { TEAMS } from "@/lib/teams";
import { pickInkHi } from "@/lib/contrast";

// Pre-compute a compact code → [primary, secondary, accent, ink, inkHi] map
// inlined at build time so a tiny blocking script can apply the theme on
// the very first paint (no flash from neutral → team colors).
const THEME_MAP: Record<string, [string, string, string, string, string]> = Object.fromEntries(
  Object.values(TEAMS).map((t) => [
    t.code,
    [t.primary, t.secondary, t.accent, t.ink, pickInkHi(t.primary)],
  ]),
);
const THEME_BOOTSTRAP = `(function(){try{var k=localStorage.getItem('wc26.myTeam');if(!k)return;var m=${JSON.stringify(THEME_MAP)};var t=m[k];if(!t)return;var s=document.documentElement.style;s.setProperty('--team-primary',t[0]);s.setProperty('--team-secondary',t[1]);s.setProperty('--team-accent',t[2]);s.setProperty('--team-ink',t[3]);s.setProperty('--team-ink-hi',t[4]);document.documentElement.dataset.team=k;}catch(e){}})();`;

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "World Cup 2026 — Floating Lighthouse",
  description: "Your tournament — live matches, jersey-themed, every team, every minute.",
  manifest: "/manifest.webmanifest",
  applicationName: "WC 2026",
  appleWebApp: { capable: true, title: "WC 2026", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#050810",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${mono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-1.5 focus:rounded-md focus:bg-[color:var(--bg-card)] focus:text-[color:var(--ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--team-accent)]"
        >
          Skip to content
        </a>
        <JerseyThemeProvider>
          <MotionProvider>
            <ThemedSmokeBackground />
            <TopBar />
            <main
              id="main"
              className="relative z-10 flex-1 mx-auto w-full max-w-md px-4 pt-4"
              style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
            >
              <PageTransition>{children}</PageTransition>
            </main>
            <BottomTabNav />
            <ServiceWorkerRegister />
          </MotionProvider>
        </JerseyThemeProvider>
      </body>
    </html>
  );
}
