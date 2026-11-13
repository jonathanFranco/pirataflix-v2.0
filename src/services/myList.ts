import { useSyncExternalStore } from "react";
import { mediaDate, mediaTitle, type ListItem, type MediaType } from "./tmdb";

const STORAGE_KEY = "minha-lista";

export type SavedItem = {
  id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  added_at: number;
};

function normalize(raw: ListItem & { added_at?: number }): SavedItem {
  const type: MediaType =
    raw.media_type === "movie" || raw.media_type === "tv"
      ? raw.media_type
      : raw.title !== undefined
        ? "movie"
        : "tv";
  return {
    id: raw.id,
    media_type: type,
    title: mediaTitle(raw),
    poster_path: raw.poster_path ?? null,
    vote_average: raw.vote_average ?? 0,
    release_date: mediaDate(raw),
    added_at: raw.added_at ?? 0,
  };
}

function read(): SavedItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((i) => typeof i?.id === "number").map(normalize) : [];
  } catch {
    return [];
  }
}

let snapshot = read();
const listeners = new Set<() => void>();

function write(next: SavedItem[]) {
  snapshot = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const same = (item: SavedItem, type: MediaType, id: number) =>
  item.id === id && item.media_type === type;

export function useMyList() {
  const lista = useSyncExternalStore(subscribe, () => snapshot);
  return {
    lista,
    has: (type: MediaType, id: number) => lista.some((item) => same(item, type, id)),
    add: (type: MediaType, item: ListItem) =>
      write([{ ...normalize({ ...item, media_type: type }), added_at: Date.now() }, ...snapshot]),
    remove: (type: MediaType, id: number) =>
      write(snapshot.filter((item) => !same(item, type, id))),
  };
}
