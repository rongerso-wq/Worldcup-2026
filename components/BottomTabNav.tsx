"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { haptics } from "@/lib/haptics";

const TABS = [
  { href: "/",        label: "Today",   icon: "today"   },
  { href: "/matches", label: "Matches", icon: "matches" },
  { href: "/teams",   label: "Teams",   icon: "teams"   },
  { href: "/bracket", label: "Bracket", icon: "bracket" },
  { href: "/me",      label: "Me",      icon: "me"      },
] as const;

function Icon({ kind, active }: { kind: string; active: boolean }) {
  const stroke = active ? "var(--team-ink)" : "var(--ink)";
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "today":
      return (
        <svg {...props}>
          <path d="M12 2v3M4 5l2 2M2 12h3M5 19l2-2M22 12h-3M19 5l-2 2M12 22v-3" />
          <circle cx="12" cy="12" r="4" fill={active ? stroke : "none"} />
        </svg>
      );
    case "matches":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18M12 5v14" />
          <circle cx="7.5" cy="14.5" r="1" fill={stroke} />
          <circle cx="16.5" cy="14.5" r="1" fill={stroke} />
        </svg>
      );
    case "teams":
      return (
        <svg {...props}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" fill={active ? stroke : "none"} fillOpacity={active ? 1 : 0.15} />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "bracket":
      return (
        <svg {...props}>
          <path d="M7 4v6l5 2-5 2v6M17 4v6l-5 2 5 2v6" />
          <circle cx="12" cy="12" r="1.5" fill={stroke} />
        </svg>
      );
    case "me":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" fill={active ? stroke : "none"} fillOpacity={active ? 1 : 0.15} />
          <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function BottomTabNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed z-30 inset-x-0 px-4"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div
        className="mx-auto max-w-md h-16 rounded-full flex items-center justify-around px-3"
        style={{
          background: "color-mix(in oklab, var(--bg-card) 55%, transparent)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "1px solid color-mix(in oklab, var(--team-primary) 30%, color-mix(in oklab, white 10%, transparent))",
          boxShadow:
            "0 24px 60px -20px color-mix(in oklab, var(--team-primary) 55%, transparent), 0 8px 24px -10px rgba(0,0,0,0.45)",
        }}
      >
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
              onClick={() => { if (!active) haptics.tap(); }}
              className="relative h-12 w-12 flex items-center justify-center rounded-full transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-deep)] focus-visible:ring-[color:var(--team-ink-hi)]"
              style={{
                background: active
                  ? `linear-gradient(135deg, var(--team-primary), var(--team-accent))`
                  : "transparent",
                boxShadow: active
                  ? "0 8px 22px -8px color-mix(in oklab, var(--team-primary) 80%, transparent), inset 0 1px 0 color-mix(in oklab, white 30%, transparent)"
                  : "none",
                transform: active ? "scale(1.08)" : "scale(1)",
              }}
            >
              <Icon kind={t.icon} active={active} />
              {active && (
                <span
                  aria-hidden
                  className="absolute -bottom-1.5 w-1 h-1 rounded-full"
                  style={{ background: "var(--team-primary)", boxShadow: "0 0 8px var(--team-primary)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
