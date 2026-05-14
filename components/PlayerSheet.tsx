"use client";

import { useEffect, useRef } from "react";
import type { Team } from "@/lib/teams";
import type { Player } from "@/lib/types";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function age(born?: string): string {
  if (!born) return "—";
  const b = new Date(born);
  if (Number.isNaN(b.getTime())) return "—";
  const d = Date.now() - b.getTime();
  return String(Math.floor(d / (365.25 * 86_400_000)));
}

export default function PlayerSheet({
  player,
  team,
  onClose,
}: {
  player: Player | null;
  team: Team;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!player) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Initial focus into the sheet
    requestAnimationFrame(() => closeBtnRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = sheetRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => !el.hasAttribute("aria-hidden"));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [player, onClose]);

  if (!player) return null;

  const bio = player.bioEn?.split("\n").find(Boolean) ?? "";
  const bioShort = bio.length > 280 ? bio.slice(0, 280).trim() + "…" : bio;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${player.name} detail`}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* veil */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      {/* sheet */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-t-3xl pb-[env(safe-area-inset-bottom)] overflow-hidden animate-[wc26sheet_220ms_ease-out]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--bg-card) 70%, transparent), var(--bg-deep) 80%)",
          border: "1px solid color-mix(in oklab, white 10%, transparent)",
          borderBottom: "none",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          boxShadow: `0 -32px 80px -28px ${team.primary}`,
        }}
      >
        {/* grabber */}
        <div className="pt-2.5 flex justify-center">
          <span className="w-10 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* hero */}
        <div className="relative px-5 pt-3 pb-4 flex items-center gap-4">
          <div
            className="relative w-28 h-32 rounded-2xl overflow-hidden shrink-0"
            style={{
              background: `linear-gradient(160deg, ${team.primary} 0%, ${team.accent} 100%)`,
              border: "1px solid color-mix(in oklab, white 16%, transparent)",
              boxShadow: `0 16px 30px -14px ${team.primary}`,
            }}
          >
            {player.cutoutUrl || player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(player.cutoutUrl ?? player.photoUrl)?.replace(/^http:\/\//, "https://")}
                alt={player.name}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-contain object-bottom"
                style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))" }}
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-faint)]">
              {team.flag} {team.code} · {player.position ?? "—"}
            </div>
            <h2
              className="font-display uppercase tracking-wider text-2xl leading-tight mt-1 break-words"
              style={{ color: team.primary }}
            >
              {player.name}
            </h2>
            {player.altName && (
              <div className="text-[11px] italic text-[color:var(--ink-faint)] mt-0.5">
                “{player.altName}”
              </div>
            )}
          </div>
        </div>

        {/* fact grid */}
        <div className="px-5 grid grid-cols-3 gap-2">
          <Fact label="Age" value={age(player.born)} />
          <Fact label="Club" value={player.club ?? "—"} />
          <Fact label="Position" value={player.position ?? "—"} />
        </div>

        {/* bio */}
        {bioShort && (
          <div className="px-5 mt-4 text-[13px] leading-relaxed text-[color:var(--ink-dim)]">
            {bioShort}
          </div>
        )}

        {/* close */}
        <div className="px-5 mt-5 pb-5">
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="w-full rounded-full py-3 font-display uppercase tracking-[0.18em] text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-deep)] focus-visible:ring-[color:var(--team-accent)]"
            style={{
              background: `linear-gradient(135deg, ${team.primary}, ${team.accent})`,
              // WCAG 2.2 SC 1.4.11 — team.ink can dip below 3:1 across the
              // gradient on pale kits; --team-ink-hi is pre-picked for ≥4.5:1.
              color: "var(--team-ink-hi)",
              boxShadow: `0 10px 26px -10px ${team.primary}`,
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes wc26sheet {
          from { transform: translateY(28px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "color-mix(in oklab, var(--bg-card) 60%, transparent)",
        border: "1px solid color-mix(in oklab, white 8%, transparent)",
      }}
    >
      <div className="font-display uppercase tracking-[0.18em] text-[9px] text-[color:var(--ink-faint)]">
        {label}
      </div>
      <div className="text-sm truncate mt-0.5">{value}</div>
    </div>
  );
}
