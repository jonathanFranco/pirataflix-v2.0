import axios from "axios";
import { TMDB_API_KEY } from "./tmdbKey.ts";

export const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3/",
  params: { api_key: TMDB_API_KEY },
});

export type MediaType = "movie" | "tv";

export type ListItem = {
  id: number;
  media_type?: MediaType | "person";
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  profile_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  known_for_department?: string;
  genre_ids?: number[];
  popularity?: number;
  character?: string;
  job?: string;
};

export type Paged<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type Genre = { id: number; name: string };

export type CastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
};

export type CrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
};

export type Video = { key: string; name: string; site: string; type: string; official: boolean };

export type ImageInfo = { file_path: string; aspect_ratio: number; iso_639_1: string | null };

export type Provider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
};

export type RegionProviders = {
  link: string;
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
};

export type Season = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
};

export type MediaDetails = ListItem & {
  genres: Genre[];
  tagline?: string;
  status?: string;
  homepage?: string;
  original_language: string;
  original_title?: string;
  original_name?: string;
  runtime?: number;
  episode_run_time?: number[];
  budget?: number;
  revenue?: number;
  production_companies: { id: number; name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  origin_country?: string[];
  created_by?: { id: number; name: string }[];
  networks?: { id: number; name: string; logo_path: string | null }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  last_air_date?: string;
  next_episode_to_air?: { air_date: string; season_number: number; episode_number: number } | null;
  seasons?: Season[];
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  images?: { backdrops: ImageInfo[]; logos: ImageInfo[] };
  recommendations?: Paged<ListItem>;
  similar?: Paged<ListItem>;
  "watch/providers"?: { results: Record<string, RegionProviders> };
  keywords?: { keywords?: Genre[]; results?: Genre[] };
  release_dates?: {
    results: { iso_3166_1: string; release_dates: { certification: string }[] }[];
  };
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
};

export type PersonDetails = {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  combined_credits: { cast: ListItem[]; crew: ListItem[] };
};

type ImageSize = "w92" | "w185" | "w300" | "w342" | "w500" | "w780" | "w1280" | "original";

export const imageUrl = (size: ImageSize, path: string | null | undefined) =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;

export const mediaTitle = (item: ListItem) => item.title ?? item.name ?? "";

export const mediaDate = (item: ListItem) => item.release_date || item.first_air_date || undefined;

