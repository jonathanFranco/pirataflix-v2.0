import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AiFillHeart, AiFillStar, AiOutlineHeart } from "react-icons/ai";
import { BiChevronRight, BiInfoCircle, BiPlay, BiSolidFlame } from "react-icons/bi";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";
import { useI18n } from "../i18n";
import { formatRuntime, yearOf } from "../i18n/format";
import { tmdbQueryOptions, useTmdbInfinite, useTmdbQuery } from "../hooks/tmdbQueries";
import { useMyList } from "../services/myList";
import { QueryGrid } from "../components/MediaGrid";
import Modal from "../components/Modal";
import { buttonGhost, buttonPrimary, chip, FadeImage, SectionTitle } from "../components/ui";
import {
  imageUrl,
  mediaDate,
  mediaTitle,
  type ListItem,
  type MediaDetails,
  type MediaType,
  type Paged,
  type Video,
} from "../services/tmdb";
import Seo from "../components/Seo";
import { pageSeo } from "../seo/pages.ts";

const HERO_COUNT = 6;
const HERO_INTERVAL_MS = 9000;
const UP_NEXT_COUNT = 3;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Hero() {
  const { t, language, languageCode, href } = useI18n();
  const { data } = useTmdbQuery<Paged<ListItem>>("trending/all/week");
  const featured = (data?.results ?? [])
    .filter((item) => item.backdrop_path && (item.media_type === "movie" || item.media_type === "tv"))
    .slice(0, HERO_COUNT);

  const detailParams = {
    append_to_response: "images,videos",
    include_image_language: `${languageCode},en,null`,
    include_video_language: `${languageCode},en`,
  };
  const details = useQueries({
    queries: featured.map((f) => tmdbQueryOptions<MediaDetails>(`${f.media_type}/${f.id}`, language, detailParams)),
  });

  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [trailer, setTrailer] = useState<Video | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [autoplay] = useState(() => !prefersReducedMotion());
  const { has, add, remove } = useMyList();

  const activeIndex = active < featured.length ? active : 0;
  const item = featured[activeIndex];
  if (!item) return <div className="skeleton h-[85vh] min-h-[560px]" />;

  const type = item.media_type as MediaType;
  const info = details[activeIndex]?.data;
  const infoPending = details[activeIndex]?.isPending ?? true;
  const logos = info?.images?.logos ?? [];
  const logo = logos.find((l) => l.iso_639_1 === languageCode) ?? logos.find((l) => l.iso_639_1 === "en");
  const runtime = formatRuntime(info?.runtime || info?.episode_run_time?.[0]);
  const seasons = info?.number_of_seasons ? `${info.number_of_seasons} ${t.media.seasons.toLowerCase()}` : undefined;
  const genres = info?.genres.slice(0, 3).map((g) => g.name) ?? [];
  const video =
    info?.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    info?.videos?.results.find((v) => v.site === "YouTube");
  const saved = has(type, item.id);
  const paused = hovering || trailerOpen;
  const next = () => setActive((i) => (i + 1) % featured.length);
  const upNext = Array.from({ length: Math.min(UP_NEXT_COUNT, featured.length - 1) }, (_, k) => (activeIndex + k + 1) % featured.length);
  const stagger = (i: number) => ({ animationDelay: `${i * 90}ms` });

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
    <section
      className="relative h-[85vh] min-h-[560px] overflow-hidden"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      aria-roledescription="carousel"
    >
      {featured.map((f, i) => (
        <div
          key={f.id}
          aria-hidden={i !== activeIndex}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === activeIndex ? "opacity-100" : "opacity-0"}`}
        >
          <FadeImage
            src={imageUrl("w1280", f.backdrop_path)}
            srcSet={`${imageUrl("w780", f.backdrop_path)} 780w, ${imageUrl("w1280", f.backdrop_path)} 1280w, ${imageUrl("original", f.backdrop_path)} 1920w`}
            sizes="100vw"
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            className={`size-full object-cover object-[center_20%] ${i === activeIndex ? "animate-ken-burns" : ""}`}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/70 via-30% to-transparent to-70%" />
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/20 via-35% to-black/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,transparent_40%,rgb(0_0_0/0.45)_100%)]" />

      <div className="relative mx-auto flex h-full max-w-[1600px] items-end px-4 pb-14 md:px-8 md:pb-20">
        <div key={item.id} className="w-full max-w-2xl">
          <div className="flex animate-fade-up flex-wrap items-center gap-2" style={stagger(0)}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-extrabold tracking-wide text-white uppercase shadow-md shadow-brand/20">
              <BiSolidFlame className="text-sm" /> {t.home.rank(activeIndex + 1)}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-zinc-200 uppercase ring-1 ring-white/15 backdrop-blur">
              {t.media[type]}
            </span>
          </div>

          <div className="mt-5 animate-fade-up" style={stagger(1)}>
            {logo ? (
              <>
                <h1 className="sr-only">{mediaTitle(item)}</h1>
                <img
                  src={imageUrl("w500", logo.file_path)}
                  alt=""
                  className="max-h-24 w-auto max-w-[min(80%,460px)] object-contain object-left drop-shadow-[0_4px_24px_rgb(0_0_0/0.8)] md:max-h-36"
                />
              </>
            ) : infoPending ? (
              <div className="skeleton h-14 w-80 max-w-full rounded-lg md:h-20" />
            ) : (
              <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-white drop-shadow-xl md:text-6xl">
                {mediaTitle(item)}
              </h1>
            )}
          </div>

          <div
            className="mt-5 flex animate-fade-up flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-zinc-200"
            style={stagger(2)}
          >
            {!!item.vote_average && (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/40 px-2 py-0.5 text-white ring-1 ring-white/10 backdrop-blur">
                <AiFillStar className="text-yellow-400" /> {item.vote_average.toFixed(1)}
              </span>
            )}
            {[yearOf(mediaDate(item)), runtime ?? seasons].filter(Boolean).map((part) => (
              <span key={part} className="before:mr-3 before:text-zinc-500 before:content-['•']">
                {part}
              </span>
            ))}
            {genres.length > 0 && (
              <span className="text-zinc-300 max-sm:basis-full sm:before:mr-3 sm:before:text-zinc-500 sm:before:content-['•']">
                {genres.join(" · ")}
              </span>
            )}
          </div>

          {info?.tagline && (
            <p className="mt-4 animate-fade-up text-base text-zinc-300 italic md:text-lg" style={stagger(3)}>
              “{info.tagline}”
            </p>
          )}
          {item.overview && (
            <p
              className="mt-3 line-clamp-3 max-w-xl animate-fade-up leading-relaxed text-zinc-200 md:text-lg"
              style={stagger(4)}
            >
              {item.overview}
            </p>
          )}

          <div className="mt-7 flex animate-fade-up flex-wrap items-center gap-3" style={stagger(5)}>
            {video && (
              <button
                type="button"
                onClick={() => {
                  setTrailer(video);
                  setTrailerOpen(true);
                }}
                className={buttonPrimary}
              >
                <BiPlay className="text-xl" /> {t.media.trailer}
              </button>
            )}
            <Link
              to={href(type, item.id)}
              aria-label={t.home.details}
              className={`${video ? buttonGhost : buttonPrimary} ${video ? "max-sm:size-12 max-sm:px-0" : ""}`}
            >
              <BiInfoCircle className="text-lg" /> <span className={video ? "max-sm:hidden" : ""}>{t.home.details}</span>
            </Link>
            <button
              type="button"
              onClick={toggleSaved}
              aria-pressed={saved}
              aria-label={saved ? t.media.saved : t.media.save}
              title={saved ? t.media.saved : t.media.save}
              className={`grid size-12 place-items-center rounded-full text-xl ring-1 backdrop-blur transition active:scale-90 ${
                saved ? "bg-white text-brand ring-white" : "bg-white/10 text-white ring-white/25 hover:bg-white/20"
              }`}
            >
              {saved ? <AiFillHeart key="on" className="animate-pop" /> : <AiOutlineHeart key="off" />}
            </button>
          </div>

          <div className="mt-8 flex max-w-sm gap-1.5">
            {featured.map((f, i) => (
              <button
                key={f.id}
                type="button"
                aria-label={mediaTitle(f)}
                aria-current={i === activeIndex}
                onClick={() => setActive(i)}
                className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/20 transition hover:bg-white/35"
              >
                <span
                  key={i === activeIndex ? `run-${activeIndex}` : "idle"}
                  className={`absolute inset-0 origin-left rounded-full ${
                    i < activeIndex ? "bg-white/70" : i === activeIndex ? "bg-brand" : "scale-x-0"
                  }`}
                  onAnimationEnd={i === activeIndex ? next : undefined}
                  style={
                    i === activeIndex && autoplay
                      ? {
                          animation: `hero-progress ${HERO_INTERVAL_MS}ms linear forwards`,
                          animationPlayState: paused ? "paused" : "running",
                        }
                      : undefined
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {upNext.length > 0 && (
          <div className="absolute right-8 bottom-20 hidden w-72 xl:block">
            <p className="mb-3 text-xs font-bold tracking-widest text-zinc-400 uppercase">{t.home.upNext}</p>
            <div className="space-y-3">
              {upNext.map((i, k) => {
                const f = featured[i];
                return (
                  <button
                    key={`${activeIndex}-${f.id}`}
                    type="button"
                    onClick={() => setActive(i)}
                    className="group flex w-full animate-fade-up items-center gap-3 rounded-xl bg-black/40 p-2 text-left ring-1 ring-white/10 backdrop-blur-md transition hover:bg-black/60 hover:ring-brand/60"
                    style={{ animationDelay: `${300 + k * 90}ms` }}
                  >
                    <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={imageUrl("w300", f.backdrop_path)}
                        alt=""
                        className="size-full object-cover transition duration-500 group-hover:scale-110"
                      />
                      <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                        <BiPlay className="text-2xl text-white" />
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm leading-tight font-bold text-white">{mediaTitle(f)}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                        {!!f.vote_average && (
                          <>
                            <AiFillStar className="text-yellow-400" /> {f.vote_average.toFixed(1)} ·
                          </>
                        )}{" "}
                        {t.media[f.media_type as MediaType]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Modal open={trailerOpen} onClose={() => setTrailerOpen(false)} label={trailer?.name ?? t.media.trailer}>
        {trailer && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
            title={trailer.name}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="aspect-video w-full rounded-2xl bg-black shadow-2xl"
          />
        )}
      </Modal>
    </section>
  );
}

function RandomPromo() {
  const { t, href } = useI18n();
  return (
    <Link
      to={href("randomPick")}
      className="group relative mb-12 flex animate-fade-up flex-col items-start gap-4 overflow-hidden rounded-3xl bg-linear-to-r from-brand-dark via-brand/80 to-surface-2 p-6 ring-1 ring-brand/40 transition duration-300 hover:shadow-xl hover:shadow-brand/15 sm:flex-row sm:items-center md:p-8"
    >
      <GiPerspectiveDiceSixFacesRandom
        aria-hidden="true"
        className="absolute -right-6 -bottom-10 text-[11rem] text-white/10 transition duration-700 group-hover:rotate-45 group-hover:scale-110"
      />
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-3xl text-white ring-1 ring-white/25 transition duration-500 group-hover:rotate-180">
        <GiPerspectiveDiceSixFacesRandom />
      </span>
      <div className="relative flex-1">
        <p className="text-xl font-extrabold text-white md:text-2xl">{t.random.heading}</p>
        <p className="mt-1 text-sm text-red-100/80 md:text-base">{t.random.subtitle}</p>
      </div>
      <span className="relative inline-flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-dark shadow-lg transition group-hover:scale-105">
        {t.random.promoCta} <BiChevronRight className="text-lg" />
      </span>
    </Link>
  );
}

export default function Home() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const kind = (["all", "movie", "tv"] as const).find((k) => k === params.get("tipo")) ?? "all";
  const period = params.get("periodo") === "week" ? "week" : "day";
  const query = useTmdbInfinite(`trending/${kind}/${period}`);

  const set = (key: string, value: string, fallback: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === fallback) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  return (
    <>
      <Seo {...pageSeo.home(t)} />
      <Hero />
      <div className="relative mx-auto -mt-6 max-w-[1600px] px-4 md:px-8">
        <RandomPromo />
        <SectionTitle>{t.home.trending}</SectionTitle>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(["all", "movie", "tv"] as const).map((k) => (
            <button key={k} type="button" onClick={() => set("tipo", k, "all")} className={chip(kind === k)}>
              {k === "all" ? t.home.all : t.media[k]}
            </button>
          ))}
          <span className="mx-2 h-6 w-px bg-white/10" />
          {(["day", "week"] as const).map((p) => (
            <button key={p} type="button" onClick={() => set("periodo", p, "day")} className={chip(period === p)}>
              {p === "day" ? t.home.today : t.home.week}
            </button>
          ))}
        </div>
        <QueryGrid query={query} type={kind === "all" ? undefined : kind} />
      </div>
    </>
  );
}
