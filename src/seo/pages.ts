import type { Messages } from "../i18n/messages.ts";
import type { RouteKey } from "../i18n/routes.ts";
import type { SeoData } from "./meta.ts";

type StaticKey = Exclude<RouteKey, "movie" | "tv" | "person">;

export const pageSeo: Record<StaticKey, (t: Messages) => SeoData> = {
  home: (t) => ({ title: t.seo.homeTitle, description: t.seo.homeDescription, route: { key: "home" } }),
  movies: (t) => ({ title: t.seo.discoverTitle.movie, description: t.discover.subtitle.movie, route: { key: "movies" } }),
  series: (t) => ({ title: t.seo.discoverTitle.tv, description: t.discover.subtitle.tv, route: { key: "series" } }),
  randomPick: (t) => ({ title: t.seo.randomTitle, description: t.random.subtitle, route: { key: "randomPick" } }),
  search: (t) => ({ title: t.nav.search, description: t.seo.searchDescription, route: { key: "search" }, noindex: true }),
  myList: (t) => ({ title: t.myList.title, description: t.seo.myListDescription, route: { key: "myList" }, noindex: true }),
};

export const isStaticKey = (key: RouteKey): key is StaticKey => key in pageSeo;
