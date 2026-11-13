import type { Params } from "../hooks/tmdbQueries";
import { tmdb, type ListItem, type MediaDetails, type MediaType, type Paged } from "./tmdb";

export const MOODS = {
  laugh: { emoji: "😂", movie: [35], tv: [35] },
  adrenaline: { emoji: "💥", movie: [28, 12], tv: [10759] },
  scare: { emoji: "👻", movie: [27], tv: [9648] },
  love: { emoji: "💘", movie: [10749], tv: [18] },
  mystery: { emoji: "🕵️", movie: [9648, 53, 80], tv: [9648, 80] },
  scifi: { emoji: "🚀", movie: [878, 14], tv: [10765] },
  feels: { emoji: "😢", movie: [18], tv: [18] },
  family: { emoji: "🍿", movie: [16, 10751], tv: [16, 10751] },
} as const;
export type MoodKey = keyof typeof MOODS;

export const PERIODS = ["any", "classic", "retro", "modern", "new"] as const;
export type PeriodKey = (typeof PERIODS)[number];

export const RUNTIMES = ["any", "short", "medium", "long"] as const;
export type RuntimeKey = (typeof RUNTIMES)[number];

export const RATINGS = [6, 7, 8] as const;

export type Prefs = {
  type: MediaType;
  moods: MoodKey[];
  period: PeriodKey;
  runtime: RuntimeKey;
  minRating: number;
  providers: number[];
};

export const DEFAULT_PREFS: Prefs = {
  type: "movie",
  moods: [],
  period: "any",
  runtime: "any",
  minRating: 7,
  providers: [],
};

const PREFS_KEY = "sorteio-preferencias";
const SEEN_KEY = "sorteio-vistos";
const MAX_SEEN = 1000;

export function loadPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
    return {
      type: raw.type === "tv" ? "tv" : "movie",
      moods: Array.isArray(raw.moods) ? raw.moods.filter((m: string) => m in MOODS) : [],
      period: PERIODS.includes(raw.period) ? raw.period : DEFAULT_PREFS.period,
      runtime: RUNTIMES.includes(raw.runtime) ? raw.runtime : DEFAULT_PREFS.runtime,
      minRating: RATINGS.includes(raw.minRating) ? raw.minRating : DEFAULT_PREFS.minRating,
      providers: Array.isArray(raw.providers) ? raw.providers.filter(Number.isInteger) : [],
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

export const titleKey = (type: MediaType, id: number) => `${type}-${id}`;

export function loadSeen(): string[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
}

export function saveSeen(seen: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-MAX_SEEN)));
  } catch {}
}

function discoverParams(prefs: Prefs, region: string): Params {
  const movie = prefs.type === "movie";
  const date = movie ? "primary_release_date" : "first_air_date";
  const today = new Date().toISOString().slice(0, 10);
  const twoYearsAgo = `${new Date().getFullYear() - 2}-01-01`;
  const ranges: Record<PeriodKey, [string?, string?]> = {
    any: [],
    classic: [undefined, "1989-12-31"],
    retro: ["1990-01-01", "2009-12-31"],
    modern: ["2010-01-01"],
    new: [twoYearsAgo],
  };
  const [from, to] = ranges[prefs.period];
  const genres = [...new Set(prefs.moods.flatMap((mood) => MOODS[mood][prefs.type]))];
  const runtime = movie ? prefs.runtime : "any";

  return {
    sort_by: "popularity.desc",
    include_adult: false,
    with_genres: genres.join("|") || undefined,
    [`${date}.gte`]: from,
    [`${date}.lte`]: to ?? today,
    "vote_average.gte": prefs.minRating,
    "vote_count.gte": movie ? 300 : 150,
    "with_runtime.lte": runtime === "short" ? 100 : runtime === "medium" ? 140 : undefined,
    "with_runtime.gte": runtime === "medium" ? 100 : runtime === "long" ? 140 : undefined,
    with_watch_providers: prefs.providers.join("|") || undefined,
    watch_region: prefs.providers.length ? region : undefined,
    with_watch_monetization_types: prefs.providers.length ? "flatrate" : undefined,
  };
}

type DrawOptions = {
  prefs: Prefs;
  language: string;
  languageCode: string;
  region: string;
  exclude: Set<string>;
  onCandidates: (posters: string[]) => void;
};

const MAX_ATTEMPTS = 4;

export async function drawTitle({ prefs, language, languageCode, region, exclude, onCandidates }: DrawOptions) {
  const params = { ...discoverParams(prefs, region), language };
  const getPage = (page: number) =>
    tmdb.get<Paged<ListItem>>(`discover/${prefs.type}`, { params: { ...params, page } }).then((r) => r.data);

  const first = await getPage(1);
  if (!first.total_results) return null;
  const totalPages = Math.min(first.total_pages, 500);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const page = attempt === MAX_ATTEMPTS - 1 ? 1 : 1 + Math.floor(Math.random() * totalPages);
    const data = page === 1 ? first : await getPage(page);
    onCandidates(data.results.flatMap((r) => (r.poster_path ? [r.poster_path] : [])));

    const candidates = data.results.filter((r) => r.poster_path && !exclude.has(titleKey(prefs.type, r.id)));
    if (candidates.length === 0) continue;

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const details = await tmdb
      .get<MediaDetails>(`${prefs.type}/${pick.id}`, {
        params: {
          language,
          append_to_response: "videos,watch/providers,credits",
          include_video_language: `${languageCode},en`,
        },
      })
      .then((r) => r.data);
    return { ...details, media_type: prefs.type } as MediaDetails & { media_type: MediaType };
  }
  return null;
}
