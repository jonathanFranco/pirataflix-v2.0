import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { LANGUAGES, MESSAGES } from "./src/i18n/messages.ts";
import { DEFAULT_LANGUAGE, routePath, type RouteRef } from "./src/i18n/routes.ts";
import { injectSeo, SITE_URL } from "./src/seo/meta.ts";
import { pageSeo } from "./src/seo/pages.ts";
import { TMDB_API_KEY } from "./src/services/tmdbKey.ts";

type SitemapEntry = { route: RouteRef; priority: string; changefreq: string };

const STATIC_ENTRIES: SitemapEntry[] = [
  { route: { key: "home" }, priority: "1.0", changefreq: "daily" },
  { route: { key: "movies" }, priority: "0.9", changefreq: "daily" },
  { route: { key: "series" }, priority: "0.9", changefreq: "daily" },
  { route: { key: "randomPick" }, priority: "0.8", changefreq: "weekly" },
];

const POPULAR_SOURCES = [
  { endpoint: "movie/popular", key: "movie", pages: 5 },
  { endpoint: "tv/popular", key: "tv", pages: 5 },
  { endpoint: "movie/top_rated", key: "movie", pages: 3 },
  { endpoint: "tv/top_rated", key: "tv", pages: 3 },
  { endpoint: "person/popular", key: "person", pages: 2 },
] as const;

function seoDefaults(): Plugin {
  return {
    name: "pirataflix-seo-defaults",
    transformIndexHtml: (html) => injectSeo(html, pageSeo.home(MESSAGES[DEFAULT_LANGUAGE]), DEFAULT_LANGUAGE),
  };
}

async function popularEntries(): Promise<SitemapEntry[]> {
  const requests = POPULAR_SOURCES.flatMap(({ endpoint, key, pages }) =>
    Array.from({ length: pages }, async (_, i) => {
      const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&page=${i + 1}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`${endpoint} ${response.status}`);
      const data = (await response.json()) as { results: { id: number }[] };
      return data.results.map((r) => `${key}/${r.id}`);
    }),
  );
  const unique = [...new Set((await Promise.all(requests)).flat())];
  return unique.map((ref) => {
    const [key, id] = ref.split("/") as [RouteRef["key"], string];
    return { route: { key, id }, priority: "0.6", changefreq: "weekly" };
  });
}

function sitemap(): Plugin {
  return {
    name: "pirataflix-sitemap",
    apply: "build",
    async generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      let dynamic: SitemapEntry[] = [];
      try {
        dynamic = await popularEntries();
      } catch (error) {
        this.warn(`sitemap: títulos populares indisponíveis (${String(error)}); gerando só as páginas principais`);
      }
      const url = (language: (typeof LANGUAGES)[number]["code"], route: RouteRef) => `${SITE_URL}${routePath(language, route)}`;
      const urls = [...STATIC_ENTRIES, ...dynamic].flatMap(({ route, priority, changefreq }) => {
        const alternates = LANGUAGES.map(
          (l) => `<xhtml:link rel="alternate" hreflang="${l.code}" href="${url(l.code, route)}"/>`,
        ).join("");
        return LANGUAGES.map(
          (l) =>
            `  <url><loc>${url(l.code, route)}</loc><lastmod>${today}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority>${alternates}</url>`,
        );
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoDefaults(), sitemap()],
  build: { outDir: "build" },
});
