import { MESSAGES, type Language } from "../../src/i18n/messages.ts";
import { DEFAULT_LANGUAGE, matchRoute, type RouteRef } from "../../src/i18n/routes.ts";
import { injectSeo, mediaSeo, personSeo, type SeoData } from "../../src/seo/meta.ts";
import { isStaticKey, pageSeo } from "../../src/seo/pages.ts";
import { TMDB_API_KEY } from "../../src/services/tmdbKey.ts";

type Context = { next: () => Promise<Response> };

async function detailSeo(language: Language, route: Required<RouteRef>): Promise<SeoData | undefined> {
  const messages = MESSAGES[language];
  const append = route.key === "person" ? "" : "&append_to_response=credits";
  const response = await fetch(
    `https://api.themoviedb.org/3/${route.key}/${route.id}?api_key=${TMDB_API_KEY}&language=${language}${append}`,
    { signal: AbortSignal.timeout(3000) },
  );
  if (response.status === 404) {
    return {
      title: route.key === "person" ? messages.person.notFound : messages.media.notFound,
      description: messages.seo.homeDescription,
      route,
      noindex: true,
    };
  }
  if (!response.ok) return undefined;
  const data = await response.json();
  return route.key === "person"
    ? personSeo(data, route, messages.seo.personFallback)
    : mediaSeo(data, route.key as "movie" | "tv", route, messages.seo.mediaFallback);
}

async function resolveSeo(pathname: string): Promise<{ seo: SeoData; language: Language } | undefined> {
  const match = matchRoute(pathname);
  if (!match) return { seo: pageSeo.home(MESSAGES[DEFAULT_LANGUAGE]), language: DEFAULT_LANGUAGE };
  const { language, key, id } = match;
  if (isStaticKey(key)) return { seo: pageSeo[key](MESSAGES[language]), language };
  const seo = await detailSeo(language, { key, id: id! }).catch(() => undefined);
  return seo && { seo, language };
}

export default async function handler(request: Request, context: Context) {
  const response = await context.next();
  if (!response.headers.get("content-type")?.includes("text/html")) return response;

  const resolved = await resolveSeo(new URL(request.url).pathname);
  if (!resolved) return response;

  const html = (await response.text()).replace(/<html lang="[^"]*"/, `<html lang="${resolved.language}"`);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(injectSeo(html, resolved.seo, resolved.language), { status: response.status, headers });
}

export const config = {
  path: "/*",
  excludedPath: [
    "/assets/*",
    "/*.js",
    "/*.css",
    "/*.png",
    "/*.jpg",
    "/*.svg",
    "/*.ico",
    "/*.xml",
    "/*.txt",
    "/*.webmanifest",
  ],
};
