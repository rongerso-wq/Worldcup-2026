"use client";

import { useEffect, useState } from "react";
import type { Team } from "@/lib/teams";

type Article = {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
};

type ApiResponse = { ok: boolean; articles?: Article[]; error?: string };

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NewsStrip({ team }: { team: Team }) {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setArticles(null);
    setErr(null);
    fetch(`/api/news/${team.code}`)
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((j) => {
        if (cancelled) return;
        if (!j.ok) {
          setErr(j.error || "fetch_failed");
          return;
        }
        setArticles(j.articles ?? []);
      })
      .catch((e) => !cancelled && setErr(String(e)));
    return () => { cancelled = true; };
  }, [team.code]);

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2
          className="font-display uppercase tracking-[0.22em] text-[10px] flex items-center gap-2"
          style={{ color: "var(--team-primary)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--team-primary)", boxShadow: "0 0 10px var(--team-primary)" }}
          />
          {team.code} news
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] font-display text-[color:var(--ink-faint)]">
          via Google News
        </span>
      </div>

      {err && (
        <div className="card-dim p-3 text-[12px] text-[color:var(--ink-dim)]">
          Couldn&apos;t load news for {team.name}.
        </div>
      )}

      {!err && articles == null && (
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 pb-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="card-dim h-[112px] shrink-0 animate-pulse"
                style={{ width: 240, animationDelay: `${i * 110}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {!err && articles && articles.length === 0 && (
        <div className="card-dim p-3 text-[12px] text-[color:var(--ink-dim)]">
          No recent headlines for {team.name}.
        </div>
      )}

      {!err && articles && articles.length > 0 && (
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 pb-1">
            {articles.map((a) => (
              <ArticleCard key={a.link} article={a} team={team} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ArticleCard({ article, team }: { article: Article; team: Team }) {
  // Strip trailing source repetition that Google News appends ("Title - ESPN")
  let title = article.title;
  if (article.source && title.endsWith(` - ${article.source}`)) {
    title = title.slice(0, title.length - article.source.length - 3);
  }
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="card-dim shrink-0 p-3 transition-transform active:scale-[0.98] flex flex-col gap-2 relative overflow-hidden"
      style={{ width: 240, minHeight: 132 }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: `linear-gradient(180deg, ${team.primary}, ${team.accent})` }}
      />
      <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-[0.18em]">
        <span
          className="px-2 py-0.5 rounded-full truncate max-w-[140px]"
          style={{
            background: "color-mix(in oklab, var(--bg-card) 70%, transparent)",
            color: "var(--ink)",
            border: "1px solid color-mix(in oklab, white 8%, transparent)",
          }}
        >
          {article.source ?? "news"}
        </span>
        <span className="text-[color:var(--ink-faint)] tabular-nums">
          {relTime(article.pubDate)}
        </span>
      </div>
      <div className="text-[13px] leading-snug line-clamp-4 text-[color:var(--ink)]">
        {title}
      </div>
    </a>
  );
}
