import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { BiFilterAlt, BiX } from "react-icons/bi";
import { useI18n } from "../i18n";
import { formatCompact, languageName } from "../i18n/format";
import { useTmdbInfinite, useTmdbQuery, type Params } from "../hooks/tmdbQueries";
import { QueryGrid } from "../components/MediaGrid";
import { chip, Select } from "../components/ui";
import { imageUrl, type Genre, type MediaType, type Provider } from "../services/tmdb";
import Seo from "../components/Seo";
import { pageSeo } from "../seo/pages.ts";

type Sort = "popularity" | "rating" | "votes" | "newest" | "oldest" | "revenue" | "title";
const SORTS: Record<MediaType, Sort[]> = {
  movie: ["popularity", "rating", "votes", "newest", "oldest", "revenue", "title"],
  tv: ["popularity", "rating", "votes", "newest", "oldest", "title"],
};

const RATINGS = ["5", "6", "7", "8"];
const VOTES = ["50", "200", "1000", "5000"];
const RUNTIMES = ["short", "medium", "long"] as const;
const ORIGINAL_LANGUAGES = ["en", "pt", "es", "fr", "it", "de", "ja", "ko", "zh", "hi", "sv", "da", "tr", "ru"];
const FILTER_KEYS = ["genres", "from", "to", "rating", "votes", "runtime", "lang", "providers"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR + 2 - 1920 }, (_, i) => String(CURRENT_YEAR + 1 - i));

function discoverParams(type: MediaType, params: URLSearchParams, region: string): Params {
  const date = type === "movie" ? "primary_release_date" : "first_air_date";
  const sort = (params.get("sort") as Sort | null) ?? "popularity";
  const sortBy: Record<Sort, string> = {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    votes: "vote_count.desc",
    newest: `${date}.desc`,
    oldest: `${date}.asc`,
    revenue: "revenue.desc",
    title: type === "movie" ? "title.asc" : "name.asc",
  };
  const from = params.get("from");
  const to = params.get("to");
  const runtime = params.get("runtime");
  const providers = params.get("providers");
  const today = new Date().toISOString().slice(0, 10);

  return {
    sort_by: sortBy[sort] ?? sortBy.popularity,
    include_adult: false,
    with_genres: params.get("genres") ?? undefined,
    [`${date}.gte`]: from ? `${from}-01-01` : undefined,
    [`${date}.lte`]: to ? `${to}-12-31` : sort === "newest" ? today : undefined,
    "vote_average.gte": params.get("rating") ?? undefined,
    "vote_count.gte": params.get("votes") ?? (sort === "rating" ? 300 : undefined),
    "with_runtime.gte": runtime === "medium" ? 90 : runtime === "long" ? 120 : undefined,
    "with_runtime.lte": runtime === "short" ? 90 : runtime === "medium" ? 120 : undefined,
    with_original_language: params.get("lang") ?? undefined,
    with_watch_providers: providers ?? undefined,
    watch_region: providers ? region : undefined,
  };
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-bold tracking-widest text-zinc-400 uppercase">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export default function Discover({ type }: { type: MediaType }) {
  const { t, language, region } = useI18n();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(() => FILTER_KEYS.some((key) => params.has(key)));

  const genres = useTmdbQuery<{ genres: Genre[] }>(`genre/${type}/list`);
  const providers = useTmdbQuery<{ results: Provider[] }>(`watch/providers/${type}`, { watch_region: region });
  const query = useTmdbInfinite(`discover/${type}`, discoverParams(type, params, region));
  const total = query.data?.pages[0]?.total_results;

  const update = (key: string, value: string | undefined) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  const listParam = (key: string) => params.get(key)?.split(/[,|]/).filter(Boolean) ?? [];
  const toggleInList = (key: string, id: string, separator: "," | "|") => {
    const current = listParam(key);
    const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
    update(key, next.join(separator) || undefined);
  };
  const toggleValue = (key: string, value: string) => update(key, params.get(key) === value ? undefined : value);

  const activeCount = FILTER_KEYS.filter((key) => params.has(key)).length;
  const clear = () =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        FILTER_KEYS.forEach((key) => next.delete(key));
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  const sort = params.get("sort") ?? "popularity";
  const selectedGenres = listParam("genres");
  const selectedProviders = listParam("providers");
  const topProviders = (providers.data?.results ?? [])
    .slice()
    .sort((a, b) => a.display_priority - b.display_priority)
    .slice(0, 24);

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-24 md:px-8">
      <Seo {...pageSeo[type === "movie" ? "movies" : "series"](t)} />
      <header className="mb-6 animate-fade-up">
        <h1 className="text-3xl font-extrabold text-white md:text-5xl">
          {type === "movie" ? t.nav.movies : t.nav.series}
        </h1>
        <p className="mt-2 text-zinc-400">{t.discover.subtitle[type]}</p>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-3 bg-ink/85 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={chip(open)}
        >
          <BiFilterAlt />
          {t.discover.filters}
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-white text-xs font-bold text-ink">
              {activeCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="hidden sm:inline" aria-hidden="true">
            {t.discover.sortBy}
          </span>
          <Select
            value={sort}
            onChange={(value) => update("sort", value === "popularity" ? undefined : value)}
            label={t.discover.sortBy}
            options={SORTS[type].map((s) => ({ value: s, label: t.discover.sort[s] }))}
          />
        </div>
        {activeCount > 0 && (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-400 transition hover:text-white">
            <BiX className="text-lg" /> {t.discover.clear}
          </button>
        )}
        {total !== undefined && (
          <span className="ml-auto text-sm text-zinc-500">{t.discover.results(formatCompact(total, language))}</span>
        )}
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-500 ${open ? "mb-8 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        inert={!open}
      >
        <div className="overflow-hidden">
          <div className="grid gap-8 rounded-2xl bg-surface p-5 ring-1 ring-white/5 md:p-8 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <FilterGroup title={t.discover.genres}>
                {genres.data?.genres.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={selectedGenres.includes(String(g.id))}
                    onClick={() => toggleInList("genres", String(g.id), ",")}
                    className={chip(selectedGenres.includes(String(g.id)))}
                  >
                    {g.name}
                  </button>
                ))}
              </FilterGroup>
            </div>

            <FilterGroup title={t.discover.period}>
              {(["from", "to"] as const).map((key) => {
                const from = params.get("from");
                const to = params.get("to");
                const years = YEARS.filter((y) => (key === "from" ? !to || y <= to : !from || y >= from));
                return (
                  <div key={key} className="flex items-center gap-2 text-sm text-zinc-400">
                    <span aria-hidden="true">{t.discover[key]}</span>
                    <Select
                      value={params.get(key) ?? ""}
                      onChange={(value) => update(key, value || undefined)}
                      label={`${t.discover.period}: ${t.discover[key]}`}
                      options={[{ value: "", label: t.discover.any }, ...years.map((y) => ({ value: y, label: y }))]}
                      className="min-w-32"
                    />
                  </div>
                );
              })}
            </FilterGroup>

            <FilterGroup title={t.discover.originalLanguage}>
              <Select
                value={params.get("lang") ?? ""}
                onChange={(value) => update("lang", value || undefined)}
                label={t.discover.originalLanguage}
                options={[
                  { value: "", label: t.discover.any },
                  ...ORIGINAL_LANGUAGES.map((code) => ({ value: code, label: languageName(code, language) })),
                ]}
                className="min-w-48"
              />
            </FilterGroup>

            <FilterGroup title={t.discover.minRating}>
              {RATINGS.map((r) => (
                <button key={r} type="button" aria-pressed={params.get("rating") === r} onClick={() => toggleValue("rating", r)} className={chip(params.get("rating") === r)}>
                  ★ {r}+
                </button>
              ))}
            </FilterGroup>

            <FilterGroup title={t.discover.minVotes}>
              {VOTES.map((v) => (
                <button key={v} type="button" aria-pressed={params.get("votes") === v} onClick={() => toggleValue("votes", v)} className={chip(params.get("votes") === v)}>
                  {formatCompact(Number(v), language)}+
                </button>
              ))}
            </FilterGroup>

            <FilterGroup title={t.discover.runtime}>
              {RUNTIMES.map((r) => (
                <button key={r} type="button" aria-pressed={params.get("runtime") === r} onClick={() => toggleValue("runtime", r)} className={chip(params.get("runtime") === r)}>
                  {t.discover.runtimeOptions[r]}
                </button>
              ))}
            </FilterGroup>

            {topProviders.length > 0 && (
              <div className="lg:col-span-2">
                <FilterGroup title={`${t.discover.providers} (${region})`}>
                  {topProviders.map((p) => {
                    const selected = selectedProviders.includes(String(p.provider_id));
                    return (
                      <button
                        key={p.provider_id}
                        type="button"
                        title={p.provider_name}
                        aria-label={p.provider_name}
                        aria-pressed={selected}
                        onClick={() => toggleInList("providers", String(p.provider_id), "|")}
                        className={`overflow-hidden rounded-xl transition hover:scale-110 ${selected ? "ring-3 ring-brand" : "opacity-60 ring-1 ring-white/10 hover:opacity-100"}`}
                      >
                        <img src={imageUrl("w92", p.logo_path)} alt="" className="size-11" loading="lazy" />
                      </button>
                    );
                  })}
                </FilterGroup>
              </div>
            )}
          </div>
        </div>
      </div>

      <QueryGrid query={query} type={type} />
    </div>
  );
}
