import { LANGUAGES, type Language } from "./messages.ts";

export const ROUTE_KEYS = [
  "home",
  "movies",
  "series",
  "search",
  "myList",
  "randomPick",
  "movie",
  "tv",
  "person",
] as const;
export type RouteKey = (typeof ROUTE_KEYS)[number];

export const DETAIL_KEYS: RouteKey[] = ["movie", "tv", "person"];

export type RouteRef = { key: RouteKey; id?: number | string };

export const SLUGS: Record<Language, Record<RouteKey, string>> = {
  "pt-BR": {
    home: "inicio",
    movies: "filmes",
    series: "series",
    search: "busca",
    myList: "minha-lista",
    randomPick: "sorteio",
    movie: "filme",
    tv: "serie",
    person: "pessoa",
  },
  "en-US": {
    home: "home",
    movies: "movies",
    series: "tv-shows",
    search: "search",
    myList: "my-list",
    randomPick: "random-pick",
    movie: "movie",
    tv: "tv",
    person: "person",
  },
  "es-ES": {
    home: "inicio",
    movies: "peliculas",
    series: "series",
    search: "buscar",
    myList: "mi-lista",
    randomPick: "sorteo",
    movie: "pelicula",
    tv: "serie",
    person: "persona",
  },
};

export const DEFAULT_LANGUAGE: Language = "pt-BR";

export const languagePrefix = (language: Language) => LANGUAGES.find((l) => l.code === language)!.prefix;

export function routePattern(language: Language, key: RouteKey) {
  return DETAIL_KEYS.includes(key) ? `${SLUGS[language][key]}/:id` : SLUGS[language][key];
}

export function routePath(language: Language, { key, id }: RouteRef) {
  const base = `/${languagePrefix(language)}/${SLUGS[language][key]}`;
  return id === undefined ? base : `${base}/${id}`;
}

export function matchRoute(pathname: string): (RouteRef & { language: Language }) | undefined {
  const [prefix, slug, id, ...rest] = pathname.split("/").filter(Boolean);
  const language = LANGUAGES.find((l) => l.prefix === prefix)?.code;
  if (!language || rest.length) return undefined;
  if (!slug) return { language, key: "home" };
  const key = ROUTE_KEYS.find((k) => SLUGS[language][k] === slug);
  if (!key || DETAIL_KEYS.includes(key) !== (id !== undefined)) return undefined;
  if (id !== undefined && !/^\d+$/.test(id)) return undefined;
  return { language, key, id };
}

export function translatePath(pathname: string, target: Language) {
  const match = matchRoute(pathname);
  return routePath(target, match ? { key: match.key, id: match.id } : { key: "home" });
}

const LEGACY: Record<string, RouteKey> = {
  "": "home",
  home: "home",
  filmes: "movies",
  series: "series",
  busca: "search",
  "minha-lista": "myList",
  sorteio: "randomPick",
  filme: "movie",
  serie: "tv",
  pessoa: "person",
};

export function legacyRoute(pathname: string): RouteRef | undefined {
  const [slug = "", id, ...rest] = pathname.split("/").filter(Boolean);
  const key = LEGACY[slug];
  if (!key || rest.length || DETAIL_KEYS.includes(key) !== (id !== undefined)) return undefined;
  return { key, id };
}
