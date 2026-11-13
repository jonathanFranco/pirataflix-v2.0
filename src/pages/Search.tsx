import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { BiSearchAlt } from "react-icons/bi";
import { useI18n } from "../i18n";
import { useTmdbInfinite } from "../hooks/tmdbQueries";
import { QueryGrid } from "../components/MediaGrid";
import { chip, EmptyState, SearchField } from "../components/ui";
import Seo from "../components/Seo";
import { pageSeo } from "../seo/pages.ts";

const TABS = ["multi", "movie", "tv", "person"] as const;
type Tab = (typeof TABS)[number];

export default function Search() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const tab = TABS.find((k) => k === params.get("tipo")) ?? "multi";
  const [input, setInput] = useState(q);
  const [lastQ, setLastQ] = useState(q);

  if (q !== lastQ) {
    setLastQ(q);
    if (q !== input.trim()) setInput(q);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim() === q) return;
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (input.trim()) next.set("q", input.trim());
          else next.delete("q");
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [input, q, setParams]);

  const query = useTmdbInfinite(`search/${tab}`, { query: q, include_adult: false }, { enabled: q.length > 0 });

  const setTab = (next: Tab) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next === "multi") p.delete("tipo");
        else p.set("tipo", next);
        return p;
      },
      { replace: true, preventScrollReset: true },
    );

  const labels: Record<Tab, string> = {
    multi: t.search.all,
    movie: t.nav.movies,
    tv: t.nav.series,
    person: t.search.people,
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-24 md:px-8">
      <Seo {...pageSeo.search(t)} title={q ? `${t.nav.search}: ${q}` : t.nav.search} />
      <SearchField
        size="lg"
        autoFocus
        value={input}
        onChange={setInput}
        placeholder={t.search.placeholder}
        aria-label={t.nav.search}
        enterKeyHint="search"
        className="mx-auto max-w-3xl animate-fade-up"
      />

      <div className="my-8 flex flex-wrap justify-center gap-2">
        {TABS.map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={chip(tab === k)}>
            {labels[k]}
          </button>
        ))}
      </div>

      {q ? (
        <QueryGrid
          query={query}
          type={tab === "multi" ? undefined : tab}
          empty={<EmptyState icon={<BiSearchAlt />} title={t.search.empty(q)} />}
        />
      ) : (
        <EmptyState icon={<BiSearchAlt />} title={t.search.prompt}>
          <p className="text-zinc-400">{t.search.hint}</p>
        </EmptyState>
      )}
    </div>
  );
}
