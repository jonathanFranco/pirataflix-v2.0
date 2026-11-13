import { LANGUAGES, type Language } from "../i18n/messages.ts";
import { DEFAULT_LANGUAGE, routePath, type RouteRef } from "../i18n/routes.ts";

export const SITE_URL = "https://pirataflix.netlify.app";
export const SITE_NAME = "Pirataflix";
export const DEFAULT_IMAGE = `${SITE_URL}/assets/logo.png`;

const IMAGE_BASE = "https://image.tmdb.org/t/p";

export type SeoData = {
  title: string;
  description: string;
  route: RouteRef;
  image?: string;
  imageAlt?: string;
  type?: "website" | "video.movie" | "video.tv_show" | "profile";
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
};

export type HeadTag =
  | { tag: "title"; text: string }
  | { tag: "meta"; attrs: Record<string, string> }
  | { tag: "link"; attrs: Record<string, string> }
  | { tag: "script"; text: string };

type Named = { name: string };

export type MediaLike = {
  title?: string;
  name?: string;
  overview?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genres?: Named[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  created_by?: Named[];
  credits?: { cast: Named[]; crew: (Named & { job: string })[] };
};

export type PersonLike = {
  name: string;
  biography?: string;
  profile_path?: string | null;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  known_for_department?: string;
};

export const absoluteUrl = (language: Language, route: RouteRef) => `${SITE_URL}${routePath(language, route)}`;

const toLocale = (language: Language) => language.replace("-", "_");

const tmdbImage = (size: string, path?: string | null) => (path ? `${IMAGE_BASE}/${size}${path}` : undefined);

export const fullTitle = (title: string) => (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`);

export function truncate(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}

function isoDuration(minutes?: number) {
  if (!minutes) return undefined;
  return `PT${Math.floor(minutes / 60)}H${minutes % 60}M`;
}

function compact(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)),
  );
}

const people = (list?: Named[]) => list?.map((p) => ({ "@type": "Person", name: p.name }));

export function mediaSeo(
  media: MediaLike,
  type: "movie" | "tv",
  route: RouteRef,
  fallback: (title: string) => string,
): SeoData {
  const title = media.title ?? media.name ?? "";
  const date = media.release_date || media.first_air_date || undefined;
  const year = date?.slice(0, 4);
  const directors = media.credits?.crew.filter((c) => c.job === "Director");

  return {
    title: year ? `${title} (${year})` : title,
    description: truncate(media.overview || fallback(title)),
    route,
    image: tmdbImage("w1280", media.backdrop_path) ?? tmdbImage("w780", media.poster_path),
    imageAlt: title,
    type: type === "movie" ? "video.movie" : "video.tv_show",
    jsonLd: compact({
      "@context": "https://schema.org",
      "@type": type === "movie" ? "Movie" : "TVSeries",
      name: title,
      description: media.overview || undefined,
      image: tmdbImage("w780", media.poster_path),
      [type === "movie" ? "datePublished" : "startDate"]: date,
      genre: media.genres?.map((g) => g.name),
      duration: type === "movie" ? isoDuration(media.runtime) : undefined,
      numberOfSeasons: media.number_of_seasons,
      director: type === "movie" ? people(directors) : undefined,
      creator: type === "tv" ? people(media.created_by) : undefined,
      actor: people(media.credits?.cast.slice(0, 10)),
      aggregateRating: media.vote_count
        ? {
            "@type": "AggregateRating",
            ratingValue: Math.round((media.vote_average ?? 0) * 10) / 10,
            ratingCount: media.vote_count,
            bestRating: 10,
            worstRating: 0,
          }
        : undefined,
    }),
  };
}

export function personSeo(person: PersonLike, route: RouteRef, fallback: (name: string) => string): SeoData {
  return {
    title: person.name,
    description: truncate(person.biography || fallback(person.name)),
    route,
    image: tmdbImage("h632", person.profile_path),
    imageAlt: person.name,
    type: "profile",
    jsonLd: compact({
      "@context": "https://schema.org",
      "@type": "Person",
      name: person.name,
      description: person.biography ? truncate(person.biography, 300) : undefined,
      image: tmdbImage("h632", person.profile_path),
      birthDate: person.birthday,
      deathDate: person.deathday,
      birthPlace: person.place_of_birth ?? undefined,
      jobTitle: person.known_for_department,
    }),
  };
}

export function headTags(seo: SeoData, language: Language): HeadTag[] {
  const title = fullTitle(seo.title);
  const url = absoluteUrl(language, seo.route);
  const image = seo.image ?? DEFAULT_IMAGE;
  const meta = (key: "name" | "property", id: string, content: string): HeadTag => ({
    tag: "meta",
    attrs: { [key]: id, content },
  });

  const tags: HeadTag[] = [
    { tag: "title", text: title },
    meta("name", "description", seo.description),
    meta("name", "robots", seo.noindex ? "noindex, follow" : "index, follow, max-image-preview:large"),
    { tag: "link", attrs: { rel: "canonical", href: url } },
    ...LANGUAGES.map(
      (l): HeadTag => ({ tag: "link", attrs: { rel: "alternate", hrefLang: l.code, href: absoluteUrl(l.code, seo.route) } }),
    ),
    {
      tag: "link",
      attrs: { rel: "alternate", hrefLang: "x-default", href: absoluteUrl(DEFAULT_LANGUAGE, seo.route) },
    },
    meta("property", "og:site_name", SITE_NAME),
    meta("property", "og:type", seo.type ?? "website"),
    meta("property", "og:locale", toLocale(language)),
    ...LANGUAGES.filter((l) => l.code !== language).map((l) => meta("property", "og:locale:alternate", toLocale(l.code))),
    meta("property", "og:title", title),
    meta("property", "og:description", seo.description),
    meta("property", "og:url", url),
    meta("property", "og:image", image),
    meta("property", "og:image:alt", seo.imageAlt ?? SITE_NAME),
    meta("name", "twitter:card", seo.image ? "summary_large_image" : "summary"),
    meta("name", "twitter:title", title),
    meta("name", "twitter:description", seo.description),
    meta("name", "twitter:image", image),
  ];
  if (seo.jsonLd) {
    const jsonLd = { ...seo.jsonLd, url, inLanguage: language };
    tags.push({ tag: "script", text: JSON.stringify(jsonLd).replace(/</g, "\\u003c") });
  }
  return tags;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderHeadHtml(tags: HeadTag[]) {
  return tags
    .map((t) => {
      if (t.tag === "title") return `<title data-seo>${escapeHtml(t.text)}</title>`;
      if (t.tag === "script") return `<script data-seo type="application/ld+json">${t.text}</script>`;
      const attrs = Object.entries(t.attrs)
        .map(([k, v]) => `${k.toLowerCase()}="${escapeHtml(v)}"`)
        .join(" ");
      return `<${t.tag} data-seo ${attrs} />`;
    })
    .join("\n    ");
}

const SEO_TAG = /<title data-seo>[\s\S]*?<\/title>\s*|<script data-seo[^>]*>[\s\S]*?<\/script>\s*|<(?:meta|link) data-seo[^>]*>\s*/g;

export function injectSeo(html: string, seo: SeoData, language: Language) {
  const head = renderHeadHtml(headTags(seo, language));
  return html.replace(SEO_TAG, "").replace(/\s*<\/head>/, `\n    ${head}\n  </head>`);
}
