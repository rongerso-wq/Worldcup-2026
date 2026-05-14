"use client";

import { useEffect, useState } from "react";
import type { Team } from "@/lib/teams";
import type { Player } from "@/lib/types";

type ApiResponse = { ok: boolean; player?: Player; error?: string };

// Force https on upstream image URLs (TheSportsDB sometimes serves http://).
function toHttps(url: string | undefined): string | undefined {
  if (!url) return url;
  return url.startsWith("http://") ? "https://" + url.slice(7) : url;
}

function abbrevPosition(pos?: string): string {
  if (!pos) return "—";
  // Manual overrides for common SDB positions
  const map: Record<string, string> = {
    "Goalkeeper": "GK",
    "Centre-Back": "CB",
    "Left-Back": "LB",
    "Right-Back": "RB",
    "Defensive Midfield": "DM",
    "Central Midfield": "CM",
    "Attacking Midfield": "AM",
    "Left Midfield": "LM",
    "Right Midfield": "RM",
    "Left Winger": "LW",
    "Right Winger": "RW",
    "Centre-Forward": "CF",
    "Second Striker": "ST",
    "Forward": "FW",
    "Defender": "DF",
    "Midfielder": "MF",
  };
  if (map[pos]) return map[pos];
  // Fallback: take capital letters
  const caps = pos.match(/[A-Z]/g);
  return caps ? caps.slice(0, 2).join("") : pos.slice(0, 2).toUpperCase();
}

function age(born?: string): string {
  if (!born) return "—";
  const b = new Date(born);
  if (Number.isNaN(b.getTime())) return "—";
  const diff = Date.now() - b.getTime();
  return String(Math.floor(diff / (365.25 * 86_400_000)));
}

export default function PlayerCard({
  name,
  nationality,
  team,
  onOpen,
}: {
  name: string;
  nationality: string;
  team: Team;
  onOpen?: (p: Player) => void;
}) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/player?name=${encodeURIComponent(name)}&nationality=${encodeURIComponent(nationality)}`)
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((j) => {
        if (cancelled) return;
        if (j.ok && j.player) setPlayer(j.player);
        else setErr(true);
      })
      .catch(() => !cancelled && setErr(true));
    return () => { cancelled = true; };
  }, [name, nationality]);

  const loading = !player && !err;
  const pos = abbrevPosition(player?.position);

  return (
    <button
      type="button"
      onClick={() => player && onOpen?.(player)}
      className="relative shrink-0 transition-transform active:scale-95"
      style={{ width: 168, aspectRatio: "3 / 4.2" }}
    >
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          background: `
            radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, white 16%, transparent), transparent 60%),
            linear-gradient(160deg, ${team.primary} 0%, ${team.accent} 100%)
          `,
          border: "1px solid color-mix(in oklab, white 16%, transparent)",
          boxShadow: `0 18px 36px -16px ${team.primary}, inset 0 1px 0 color-mix(in oklab, white 22%, transparent)`,
          clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)",
        }}
      >
        {/* faint pitch-tile overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 8px, transparent 8px 16px)",
          }}
        />

        {/* top row: position + flag */}
        <div className="absolute inset-x-0 top-2 px-3 flex items-center justify-between">
          <div className="flex flex-col items-start leading-none">
            <span
              className="font-display tracking-wider text-2xl"
              style={{ color: team.ink, textShadow: "0 1px 0 rgba(0,0,0,0.18)" }}
            >
              {pos}
            </span>
            <span
              className="font-display uppercase tracking-[0.2em] text-[9px] -mt-0.5"
              style={{ color: team.ink, opacity: 0.75 }}
            >
              {age(player?.born)}
            </span>
          </div>
          <span className="text-2xl leading-none">{team.flag}</span>
        </div>

        {/* player image (cutout > thumb > silhouette) */}
        <div className="absolute inset-x-0 top-[34px] bottom-[78px] flex items-end justify-center overflow-hidden">
          {player?.cutoutUrl || player?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={toHttps(player.cutoutUrl ?? player.photoUrl)}
              alt={player.name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="max-h-full max-w-[120%] object-contain object-bottom select-none pointer-events-none"
              style={{ filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.35))" }}
            />
          ) : (
            <Silhouette ink={team.ink} loading={loading} />
          )}
        </div>

        {/* bottom name + club + jersey stripe */}
        <div
          className="absolute inset-x-0 bottom-0 h-[78px] px-3 pt-2 pb-3"
          style={{
            background: `linear-gradient(180deg, transparent 0%, color-mix(in oklab, black 35%, transparent) 100%)`,
          }}
        >
          <div className="h-[3px] rounded-full mb-2 mx-auto w-2/3" style={{ background: `linear-gradient(90deg, transparent, ${team.ink}, transparent)`, opacity: 0.75 }} />
          <div
            className="font-display uppercase tracking-wider text-[14px] leading-tight truncate text-center"
            style={{ color: team.ink, textShadow: "0 1px 0 rgba(0,0,0,0.3)" }}
          >
            {player?.name ?? (err ? name : <span className="opacity-50">···</span>)}
          </div>
          <div
            className="font-mono uppercase tracking-wider text-[9px] mt-0.5 truncate text-center"
            style={{ color: team.ink, opacity: 0.7 }}
          >
            {player?.club ?? (err ? "tap to retry" : "loading")}
          </div>
        </div>
      </div>
    </button>
  );
}

function Silhouette({ ink, loading }: { ink: string; loading: boolean }) {
  return (
    <svg
      viewBox="0 0 100 140"
      className={`w-3/5 h-full ${loading ? "animate-pulse" : ""}`}
      style={{ color: ink, opacity: 0.18 }}
      aria-hidden
    >
      <circle cx="50" cy="40" r="22" fill="currentColor" />
      <path d="M10 140 C 10 90, 90 90, 90 140 Z" fill="currentColor" />
    </svg>
  );
}
