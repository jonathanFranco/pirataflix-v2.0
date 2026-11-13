import { lazy, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router";
import { I18nProvider, LANGUAGES, preferredLanguage, type Language } from "./i18n";
import { DEFAULT_LANGUAGE, legacyRoute, ROUTE_KEYS, routePath, routePattern, type RouteKey } from "./i18n/routes.ts";
import Layout from "./components/Layout";

const Home = lazy(() => import("./pages/Home"));
const Discover = lazy(() => import("./pages/Discover"));
const Search = lazy(() => import("./pages/Search"));
const Details = lazy(() => import("./pages/Details"));
const Person = lazy(() => import("./pages/Person"));
const MyList = lazy(() => import("./pages/MyList"));
const RandomPick = lazy(() => import("./pages/RandomPick"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      retry: (failures, error) => failures < 1 && !(isAxiosError(error) && error.response?.status === 404),
      refetchOnWindowFocus: false,
    },
  },
});

const PAGES: Record<RouteKey, ReactNode> = {
  home: <Home />,
  movies: <Discover key="movie" type="movie" />,
  series: <Discover key="tv" type="tv" />,
  search: <Search />,
  myList: <MyList />,
  randomPick: <RandomPick />,
  movie: <Details type="movie" />,
  tv: <Details type="tv" />,
  person: <Person />,
};

function LocaleRoot({ language }: { language: Language }) {
  return (
    <I18nProvider language={language}>
      <Layout />
    </I18nProvider>
  );
}

function Fallback() {
  const { pathname, search } = useLocation();
  const legacy = legacyRoute(pathname);
  const target = legacy && pathname !== "/" ? routePath(DEFAULT_LANGUAGE, legacy) : routePath(preferredLanguage(), { key: "home" });
  return <Navigate to={`${target}${legacy ? search : ""}`} replace />;
}

const router = createBrowserRouter([
  ...LANGUAGES.map(({ code, prefix }) => ({
    path: prefix,
    element: <LocaleRoot language={code} />,
    children: [
      { index: true, element: <Navigate to={routePath(code, { key: "home" })} replace /> },
      ...ROUTE_KEYS.map((key) => ({ path: routePattern(code, key), element: PAGES[key] })),
      { path: "*", element: <Navigate to={routePath(code, { key: "home" })} replace /> },
    ],
  })),
  { path: "*", element: <Fallback /> },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
