import { Link } from "react-router";
import { toast } from "react-toastify";
import { AiFillHeart, AiFillStar, AiOutlineHeart } from "react-icons/ai";
import { BiChevronRight, BiMoviePlay, BiUser } from "react-icons/bi";
import { IoClose } from "react-icons/io5";
import { useI18n } from "../i18n";
import { yearOf } from "../i18n/format";
import { useGenreNames } from "../hooks/tmdbQueries";
import { useMyList } from "../services/myList";
import {
  imageUrl,
  mediaDate,
  mediaTitle,
  type ListItem,
  type MediaType,
} from "../services/tmdb";
import { FadeImage } from "./ui";

type Props = {
  item: ListItem;
  type?: MediaType | "person";
  index?: number;
  subtitle?: string;
  onRemove?: () => void;
};

export default function MediaCard({ item, type, index = 0, subtitle, onRemove }: Props) {
  const { t, href } = useI18n();
  const kind = type ?? item.media_type ?? "movie";
  const isPerson = kind === "person";
  const title = mediaTitle(item);
  const image = imageUrl("w342", isPerson ? item.profile_path : item.poster_path);
  const to = href(kind, item.id);
  const year = yearOf(mediaDate(item));
  const caption =
    subtitle ??
    (isPerson
      ? item.known_for_department && (t.departments[item.known_for_department] ?? item.known_for_department)
      : year);

  return (
    <article className="group relative animate-fade-up" style={{ animationDelay: `${(index % 20) * 35}ms` }}>
      <div className="@container relative overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/5 transition duration-300 group-has-focus-visible:ring-2 group-has-focus-visible:ring-brand group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/60 group-hover:ring-brand/60">
        <Link to={to} aria-label={title} className="block aspect-2/3 focus-visible:outline-none">
          {image ? (
            <FadeImage
              src={image}
              alt=""
              className="size-full object-cover duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid size-full place-items-center bg-linear-to-br from-surface-2 to-ink p-3 text-center">
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                {isPerson ? <BiUser size={40} /> : <BiMoviePlay size={40} />}
                <span className="line-clamp-3 text-xs font-semibold">{title}</span>
              </div>
            </div>
          )}
        </Link>

        {!isPerson && <HoverPanel item={item} type={kind} title={title} year={year} showType={!type} to={to} />}

        {!isPerson && !!item.vote_average && (
          <span className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold text-white backdrop-blur transition duration-300 group-has-focus-visible:opacity-0 group-hover:opacity-0">
            <AiFillStar className="text-yellow-400" />
            {item.vote_average.toFixed(1)}
          </span>
        )}
        {!type && (
          <span className="pointer-events-none absolute top-2 right-2 rounded-full bg-brand/90 px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-white uppercase transition duration-300 group-has-focus-visible:opacity-0 group-hover:opacity-0">
            {t.media[kind]}
          </span>
        )}
      </div>

      <div className="mt-2.5 px-0.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-zinc-100 transition group-hover:text-white" title={title}>
          {title}
        </h3>
        {caption && <p className="line-clamp-1 text-xs text-zinc-400">{caption}</p>}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.myList.remove(title)}
          className="absolute -top-2 -right-2 z-10 grid size-8 place-items-center rounded-full bg-brand text-white shadow-lg transition hover:scale-110 md:scale-75 md:opacity-0 md:group-hover:scale-100 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        >
          <IoClose size={18} />
        </button>
      )}
    </article>
  );
}

type PanelProps = {
  item: ListItem;
  type: MediaType;
  title: string;
  year?: string;
  showType: boolean;
  to: string;
};

function HoverPanel({ item, type, title, year, showType, to }: PanelProps) {
  const { t } = useI18n();
  const genreNames = useGenreNames();
  const { has, add, remove } = useMyList();
  const saved = has(type, item.id);
  const genres = (item.genre_ids ?? [])
    .map((id) => genreNames.get(id))
    .filter(Boolean)
    .slice(0, 3);

  function toggleSaved() {
    if (saved) {
      remove(type, item.id);
      toast.info(t.media.removed);
    } else {
      add(type, item);
      toast.success(t.media.added);
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black via-black/85 via-55% to-black/10 p-3 opacity-0 transition duration-300 group-has-focus-visible:opacity-100 group-hover:opacity-100 @[200px]:p-4">
      <div className="translate-y-4 transition duration-300 ease-out group-has-focus-visible:translate-y-0 group-hover:translate-y-0">
        <p className="line-clamp-2 text-sm leading-tight font-bold text-white @[200px]:text-base">{title}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[0.7rem] font-semibold text-zinc-300 @[200px]:text-xs">
          {!!item.vote_average && (
            <span className="inline-flex items-center gap-0.5 text-white">
              <AiFillStar className="text-yellow-400" />
              {item.vote_average.toFixed(1)}
            </span>
          )}
          {[year, showType ? t.media[type] : undefined].filter(Boolean).map((part) => (
            <span key={part} className="before:mr-1.5 before:text-zinc-500 before:content-['•'] first:before:hidden">
              {part}
            </span>
          ))}
        </div>

        {genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {genres.map((genre, i) => (
              <span
                key={genre}
                className={`truncate rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-medium text-zinc-200 ring-1 ring-white/15 ${i >= 2 ? "hidden @[200px]:inline" : ""}`}
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {item.overview && (
          <p className="mt-2 line-clamp-3 text-[0.7rem] leading-relaxed text-zinc-300 @[200px]:line-clamp-4 @[200px]:text-xs">
            {item.overview}
          </p>
        )}

        <div className="pointer-events-auto mt-3 flex items-center gap-2">
          <Link
            to={to}
            tabIndex={-1}
            className="inline-flex flex-1 items-center justify-center gap-0.5 rounded-full bg-brand py-1.5 text-xs font-bold text-white shadow-md shadow-brand/15 transition hover:bg-red-600 active:scale-95"
          >
            {t.home.details}
            <BiChevronRight className="text-base" />
          </Link>
          <button
            type="button"
            onClick={toggleSaved}
            aria-pressed={saved}
            aria-label={`${saved ? t.media.saved : t.media.save}: ${title}`}
            title={saved ? t.media.saved : t.media.save}
            className={`grid size-8 shrink-0 place-items-center rounded-full ring-1 transition active:scale-90 ${
              saved ? "bg-white text-brand ring-white" : "bg-white/10 text-white ring-white/25 hover:bg-white/20"
            }`}
          >
            {saved ? <AiFillHeart key="on" className="animate-pop" /> : <AiOutlineHeart key="off" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MediaCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-2/3 rounded-xl" />
      <div className="skeleton mt-2.5 h-3.5 w-4/5 rounded" />
      <div className="skeleton mt-1.5 h-3 w-1/3 rounded" />
    </div>
  );
}
