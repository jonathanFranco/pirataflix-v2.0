import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useI18n } from "../i18n";
import { tmdb, type Genre, type ListItem, type Paged } from "../services/tmdb";

export type Params = Record<string, string | number | boolean | undefined>;

const MAX_PAGE = 500;

export function tmdbQueryOptions<T>(path: string, language: string, params: Params = {}) {
  return {
    queryKey: [path, language, params],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      tmdb.get<T>(path, { params: { language, ...params }, signal }).then((r) => r.data),
  };
}

export function useTmdbQuery<T>(path: string, params: Params = {}, options: { enabled?: boolean } = {}) {
  const { language } = useI18n();
  return useQuery({ ...tmdbQueryOptions<T>(path, language, params), enabled: options.enabled });
}

export function useTmdbInfinite(path: string, params: Params = {}, options: { enabled?: boolean } = {}) {
  const { language } = useI18n();
  return useInfiniteQuery({
    queryKey: [path, language, params, "infinite"],
    queryFn: ({ pageParam, signal }) =>
      tmdb
        .get<Paged<ListItem>>(path, { params: { language, ...params, page: pageParam }, signal })
        .then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < Math.min(last.total_pages, MAX_PAGE) ? last.page + 1 : undefined,
    placeholderData: keepPreviousData,
    enabled: options.enabled,
  });
}

export function useGenreNames() {
  const movie = useTmdbQuery<{ genres: Genre[] }>("genre/movie/list");
  const tv = useTmdbQuery<{ genres: Genre[] }>("genre/tv/list");
  const names = new Map<number, string>();
  for (const genre of [...(movie.data?.genres ?? []), ...(tv.data?.genres ?? [])]) names.set(genre.id, genre.name);
  return names;
}
