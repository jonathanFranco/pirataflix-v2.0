import { Fragment, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { isAxiosError } from "axios";
import { toast } from "react-toastify";
import { AiFillHeart, AiFillStar, AiOutlineHeart } from "react-icons/ai";
import { BiLinkExternal, BiMoviePlay, BiPlay, BiUser } from "react-icons/bi";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useI18n } from "../i18n";
import {
  countryName,
  formatCompact,
  formatDate,
  formatMoney,
  formatRuntime,
  languageName,
  yearOf,
} from "../i18n/format";
import { useTmdbQuery } from "../hooks/tmdbQueries";
import { useMyList } from "../services/myList";
import {
  imageUrl,
  mediaDate,
  mediaTitle,
  type MediaDetails,
  type MediaType,
  type Provider,
  type Video,
} from "../services/tmdb";
import MediaCard from "../components/MediaCard";
import Modal from "../components/Modal";
import Row from "../components/Row";
import { useLocalPaging } from "../components/MediaGrid";
import {
  buttonGhost,
  buttonPrimary,
  chip,
  ErrorState,
  FadeImage,
  ScoreRing,
  SectionTitle,
} from "../components/ui";
import Seo from "../components/Seo";
import { mediaSeo } from "../seo/meta.ts";

const WRITER_JOBS = ["Screenplay", "Writer", "Story", "Novel", "Teleplay"];
const VIDEO_ORDER = ["Trailer", "Teaser", "Clip", "Featurette", "Behind the Scenes"];

export default function Details({ type }: { type: MediaType }) {
  const { id } = useParams();
  return <DetailsContent key={`${type}-${id}`} type={type} id={Number(id)} />;
}

function DetailsContent({ type, id }: { type: MediaType; id: number }) {
  const { t, languageCode, href } = useI18n();
  const query = useTmdbQuery<MediaDetails>(`${type}/${id}`, {
    append_to_response: [
      "credits",
      "videos",
      "images",
      "recommendations",
      "similar",
      "watch/providers",
      "keywords",
      type === "movie" ? "release_dates" : "content_ratings",
    ].join(","),
    include_image_language: `${languageCode},en,null`,
    include_video_language: `${languageCode},en`,
  });

  if (query.isPending) return <DetailsSkeleton />;
  if (query.isError) {
    const notFound = isAxiosError(query.error) && query.error.response?.status === 404;
    return (
      <div className="pt-24">
        <Seo
          title={notFound ? t.media.notFound : t.common.loadError}
          description={t.seo.homeDescription}
          route={{ key: type, id }}
          noindex
        />
        <ErrorState
          message={notFound ? t.media.notFound : undefined}
          onRetry={notFound ? undefined : () => query.refetch()}
        />
        <div className="flex justify-center">
          <Link to={href("home")} className={buttonGhost}>
            {t.common.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return <DetailsView media={query.data} type={type} />;
}

function DetailsView({ media, type }: { media: MediaDetails; type: MediaType }) {
  const { t, language, languageCode, region, href } = useI18n();
  const { has, add, remove } = useMyList();
  const [trailer, setTrailer] = useState<Video | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const openTrailer = (video: Video) => {
    setTrailer(video);
    setTrailerOpen(true);
  };
  const openPhoto = (index: number) => {
    setPhoto(index);
    setPhotoOpen(true);
  };

  const title = mediaTitle(media);
  const saved = has(type, media.id);
  const runtime = formatRuntime(media.runtime || media.episode_run_time?.[0]);
  const certification =
    type === "movie"
      ? [region, "US"]
          .map((r) => media.release_dates?.results.find((x) => x.iso_3166_1 === r))
          .flatMap((x) => x?.release_dates ?? [])
          .find((d) => d.certification)?.certification
      : [region, "US"]
          .map((r) => media.content_ratings?.results.find((x) => x.iso_3166_1 === r)?.rating)
          .find(Boolean);
  const logos = media.images?.logos ?? [];
  const logo = logos.find((l) => l.iso_639_1 === languageCode) ?? logos.find((l) => l.iso_639_1 === "en");
  const videos = (media.videos?.results ?? [])
    .filter((v) => v.site === "YouTube")
    .sort(
      (a, b) =>
        (VIDEO_ORDER.indexOf(a.type) + 1 || 99) - (VIDEO_ORDER.indexOf(b.type) + 1 || 99) ||
        Number(b.official) - Number(a.official),
    );
  const crew = media.credits?.crew ?? [];
  const uniqueNames = (people: { id: number; name: string }[]) =>
    [...new Map(people.map((p) => [p.id, p])).values()].slice(0, 4);
  const highlights = [
    { label: t.media.director, people: uniqueNames(crew.filter((c) => c.job === "Director")) },
    { label: t.media.creators, people: uniqueNames(media.created_by ?? []) },
    { label: t.media.writers, people: uniqueNames(crew.filter((c) => WRITER_JOBS.includes(c.job))) },
  ].filter((h) => h.people.length > 0);
  const cast = (media.credits?.cast ?? []).slice(0, 20);
  const backdrops = media.images?.backdrops ?? [];
  const recommendations = media.recommendations?.results.length
    ? media.recommendations.results
    : (media.similar?.results ?? []);
  const keywords = media.keywords?.keywords ?? media.keywords?.results ?? [];
  const providers = media["watch/providers"]?.results[region];
  const discoverPath = href(type === "movie" ? "movies" : "series");

  const year = yearOf(mediaDate(media));
  const meta = [
    year && <span>{year}</span>,
    certification && (
      <span className="rounded border border-zinc-400/70 px-1.5 py-0.5 text-xs text-zinc-100">{certification}</span>
    ),
    runtime && <span>{runtime}</span>,
    media.number_of_seasons ? (
      <span>
        {media.number_of_seasons} {t.media.seasons.toLowerCase()}
      </span>
    ) : null,
  ].filter(Boolean);

  function toggleSaved() {
    if (saved) {
      remove(type, media.id);
      toast.info(t.media.removed);
    } else {
      add(type, media);
      toast.success(t.media.added);
    }
  }

  return (
    <>
      <Seo {...mediaSeo(media, type, { key: type, id: media.id }, t.seo.mediaFallback)} />
      <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden md:min-h-[88vh]">
        {media.backdrop_path ? (
          <FadeImage
            src={imageUrl("w1280", media.backdrop_path)}
            srcSet={`${imageUrl("w780", media.backdrop_path)} 780w, ${imageUrl("w1280", media.backdrop_path)} 1280w, ${imageUrl("original", media.backdrop_path)} 1920w`}
            sizes="100vw"
            alt=""
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 -z-10 size-full animate-ken-burns object-cover object-[center_25%]"
          />
        ) : (
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-surface-2 via-ink to-brand-dark/40" />
        )}
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-ink via-ink/60 via-35% to-transparent to-75%" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/10 via-40% to-ink/60" />

        <div className="mx-auto w-full max-w-[1600px] px-4 pt-32 pb-10 md:px-8 md:pb-16">
          <div className="max-w-2xl animate-fade-up">
            {logo ? (
              <>
                <h1 className="sr-only">{title}</h1>
                <img
                  src={imageUrl("w500", logo.file_path)}
                  alt=""
                  className="max-h-20 w-auto max-w-[min(70%,420px)] object-contain object-left drop-shadow-[0_4px_24px_rgb(0_0_0/0.8)] md:max-h-28"
                />
              </>
            ) : (
              <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-white drop-shadow-xl md:text-6xl">
                {title}
              </h1>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm font-semibold text-zinc-200">
              {media.vote_count ? (
                <div className="flex w-full items-center gap-2.5 border-white/15 sm:w-auto sm:border-r sm:pr-4">
                  <ScoreRing value={media.vote_average ?? 0} size={44} />
                  <div className="leading-tight">
                    <p className="font-bold text-white">{t.media.userScore}</p>
                    <p className="text-xs font-medium text-zinc-400">
                      {t.media.votes(formatCompact(media.vote_count, language))}
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-x-3">
                {meta.map((item, i) => (
                  <Fragment key={i}>
                    {i > 0 && (
                      <span className="text-zinc-500" aria-hidden="true">
                        •
                      </span>
                    )}
                    {item}
                  </Fragment>
                ))}
              </div>
            </div>

            {media.genres.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {media.genres.map((g) => (
                  <Link key={g.id} to={`${discoverPath}?genres=${g.id}`} className={chip(false)}>
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            {media.tagline && <p className="mt-6 text-base text-zinc-300 italic md:text-lg">“{media.tagline}”</p>}

            <p className={`mt-3 max-w-xl leading-relaxed text-zinc-200 ${expanded ? "" : "line-clamp-4"}`}>
              {media.overview || t.media.noOverview}
            </p>
            {(media.overview?.length ?? 0) > 300 && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="mt-1 text-sm font-bold text-brand transition hover:text-red-400"
              >
                {expanded ? t.person.readLess : t.person.readMore}
              </button>
            )}

            {highlights.length > 0 && (
              <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
                {highlights.map((h) => (
                  <div key={h.label}>
                    <dt className="text-xs font-bold tracking-wider text-zinc-400 uppercase">{h.label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-white">
                      {h.people.map((p, i) => (
                        <span key={p.id}>
                          {i > 0 && ", "}
                          <Link to={href("person", p.id)} className="transition hover:text-brand">
                            {p.name}
                          </Link>
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {videos[0] && (
                <button type="button" onClick={() => openTrailer(videos[0])} className={buttonPrimary}>
                  <BiPlay className="text-xl" /> {t.media.trailer}
                </button>
              )}
              <button type="button" onClick={toggleSaved} aria-pressed={saved} className={buttonGhost}>
                {saved ? <AiFillHeart className="animate-pop text-lg text-brand" /> : <AiOutlineHeart className="text-lg" />}
                {saved ? t.media.saved : t.media.save}
              </button>
              {media.homepage && (
                <a href={media.homepage} target="_blank" rel="noreferrer" className={buttonGhost}>
                  <BiLinkExternal className="text-lg" /> {t.media.homepage}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 md:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-12">
          {providers && (providers.flatrate || providers.rent || providers.buy) && (
            <section className="animate-fade-up">
              <SectionTitle>{t.media.whereToWatch}</SectionTitle>
              <div className="flex flex-wrap gap-8 rounded-2xl bg-surface p-5 ring-1 ring-white/5">
                <ProviderGroup title={t.media.stream} providers={providers.flatrate} link={providers.link} />
                <ProviderGroup title={t.media.rent} providers={providers.rent} link={providers.link} />
                <ProviderGroup title={t.media.buy} providers={providers.buy} link={providers.link} />
                <p className="w-full text-xs text-zinc-500">{t.media.providersSource}</p>
              </div>
            </section>
          )}

          {cast.length > 0 && (
            <Row title={t.media.cast}>
              {cast.map((person, index) => (
                <Link
                  key={`${person.id}-${index}`}
                  to={href("person", person.id)}
                  className="group w-32 shrink-0 snap-start md:w-36"
                >
                  <div className="aspect-2/3 overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/5 transition group-hover:ring-brand/60">
                    {person.profile_path ? (
                      <FadeImage
                        src={imageUrl("w185", person.profile_path)}
                        alt={person.name}
                        className="size-full object-cover group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-4xl text-zinc-600">
                        <BiUser />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm font-semibold text-white group-hover:text-brand">{person.name}</p>
                  {person.character && <p className="line-clamp-2 text-xs text-zinc-400">{person.character}</p>}
                </Link>
              ))}
            </Row>
          )}

          {media.seasons && media.seasons.length > 0 && (
            <Row title={t.media.seasons}>
              {media.seasons.map((season) => (
                <div key={season.id} className="w-36 shrink-0 snap-start md:w-40">
                  <div className="aspect-2/3 overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/5">
                    {season.poster_path ? (
                      <FadeImage src={imageUrl("w342", season.poster_path)} alt={season.name} className="size-full object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center text-4xl text-zinc-600">
                        <BiMoviePlay />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm font-semibold text-white">{season.name}</p>
                  <p className="text-xs text-zinc-400">
                    {[yearOf(season.air_date), t.media.episodes(season.episode_count)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </Row>
          )}

          {videos.length > 0 && (
            <Row title={t.media.videos}>
              {videos.slice(0, 15).map((video) => (
                <button
                  key={video.key}
                  type="button"
                  onClick={() => openTrailer(video)}
                  className="group w-72 shrink-0 snap-start text-left md:w-80"
                >
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/5 transition group-hover:ring-brand/60">
                    <FadeImage
                      src={`https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`}
                      alt=""
                      className="size-full object-cover group-hover:scale-105"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/30 transition group-hover:bg-black/10">
                      <span className="grid size-14 place-items-center rounded-full bg-brand/90 text-3xl text-white shadow-xl transition group-hover:scale-110">
                        <BiPlay />
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm font-semibold text-white">{video.name}</p>
                  <p className="text-xs text-zinc-400">{video.type}</p>
                </button>
              ))}
            </Row>
          )}

          {backdrops.length > 0 && <Gallery backdrops={backdrops} onOpen={openPhoto} />}
        </div>

        <aside className="animate-fade-up space-y-8">
          <InfoPanel media={media} type={type} />
          {keywords.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold tracking-widest text-zinc-400 uppercase">{t.media.keywords}</h3>
              <div className="flex flex-wrap gap-2">
                {keywords.slice(0, 20).map((k) => (
                  <span key={k.id} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-zinc-300 ring-1 ring-white/10">
                    {k.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {recommendations.length > 0 && (
        <div className="mx-auto mt-12 max-w-[1600px] px-4 md:px-8">
          <Row title={t.media.recommendations}>
            {recommendations.map((item, index) => (
              <div key={item.id} className="w-36 shrink-0 snap-start md:w-44">
                <MediaCard item={item} type={type} index={index} />
              </div>
            ))}
          </Row>
        </div>
      )}

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

      <Lightbox
        images={backdrops.map((b) => b.file_path)}
        index={photo}
        open={photoOpen}
        onChange={setPhoto}
        onClose={() => setPhotoOpen(false)}
        label={title}
      />
    </>
  );
}

function ProviderGroup({ title, providers, link }: { title: string; providers?: Provider[]; link: string }) {
  if (!providers?.length) return null;
  return (
    <div>
      <h3 className="mb-3 text-xs font-bold tracking-widest text-zinc-400 uppercase">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => (
          <a
            key={p.provider_id}
            href={link}
            target="_blank"
            rel="noreferrer"
            title={p.provider_name}
            className="overflow-hidden rounded-xl ring-1 ring-white/10 transition hover:scale-110 hover:ring-brand"
          >
            <img src={imageUrl("w92", p.logo_path)} alt={p.provider_name} className="size-12" loading="lazy" />
          </a>
        ))}
      </div>
    </div>
  );
}

function Gallery({ backdrops, onOpen }: { backdrops: { file_path: string }[]; onOpen: (index: number) => void }) {
  const { t } = useI18n();
  const { visible, hasMore, loadMore } = useLocalPaging(backdrops, 9);
  return (
    <section className="animate-fade-up">
      <SectionTitle aside={<span className="text-sm text-zinc-500">{backdrops.length}</span>}>{t.media.images}</SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {visible.map((image, index) => (
          <button
            key={image.file_path}
            type="button"
            onClick={() => onOpen(index)}
            className="group aspect-video animate-fade-up overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/5 transition hover:ring-brand/60"
            style={{ animationDelay: `${(index % 9) * 40}ms` }}
          >
            <FadeImage src={imageUrl("w780", image.file_path)} alt="" className="size-full object-cover group-hover:scale-105" />
          </button>
        ))}
      </div>
      {hasMore && (
        <div className="mt-5 flex justify-center">
          <button type="button" onClick={loadMore} className={buttonGhost}>
            {t.media.showMore}
          </button>
        </div>
      )}
    </section>
  );
}

function Lightbox({
  images,
  index,
  open,
  onChange,
  onClose,
  label,
}: {
  images: string[];
  index: number;
  open: boolean;
  onChange: (index: number) => void;
  onClose: () => void;
  label: string;
}) {
  const { t } = useI18n();
  const go = (delta: number) => onChange((index + delta + images.length) % images.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") onChange((index + 1) % images.length);
      if (event.key === "ArrowLeft") onChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onChange]);

  const arrow =
    "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-2xl text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-brand";

  return (
    <Modal open={open} onClose={onClose} label={label}>
      {images[index] && (
        <figure className="relative">
          <img
            key={images[index]}
            src={imageUrl("w1280", images[index])}
            alt=""
            className="max-h-[80vh] w-full animate-fade-in rounded-2xl bg-black object-contain shadow-2xl"
          />
          <button type="button" aria-label={t.common.previous} onClick={() => go(-1)} className={`${arrow} left-3`}>
            <IoChevronBack />
          </button>
          <button type="button" aria-label={t.common.next} onClick={() => go(1)} className={`${arrow} right-3`}>
            <IoChevronForward />
          </button>
          <figcaption className="mt-3 text-center text-sm text-zinc-400">
            {index + 1} / {images.length}
          </figcaption>
        </figure>
      )}
    </Modal>
  );
}

function InfoPanel({ media, type }: { media: MediaDetails; type: MediaType }) {
  const { t, language } = useI18n();
  const originalTitle = media.original_title ?? media.original_name;
  const countries =
    media.production_countries?.map((c) => c.iso_3166_1) ?? media.origin_country ?? [];
  const next = media.next_episode_to_air;

  const rows: [string, string | undefined][] = [
    [t.media.originalTitle, originalTitle !== mediaTitle(media) ? originalTitle : undefined],
    [t.media.status, media.status && (t.statuses[media.status] ?? media.status)],
    [t.media.originalLanguage, languageName(media.original_language, language)],
    ...(type === "movie"
      ? ([
          [t.media.releaseDate, formatDate(media.release_date, language)],
          [t.media.budget, formatMoney(media.budget, language)],
          [t.media.revenue, formatMoney(media.revenue, language)],
        ] as [string, string | undefined][])
      : ([
          [t.media.firstAirDate, formatDate(media.first_air_date, language)],
          [t.media.lastAirDate, formatDate(media.last_air_date, language)],
          [
            t.media.nextEpisode,
            next
              ? `${t.media.episodeCode(next.season_number, next.episode_number)} · ${formatDate(next.air_date, language)}`
              : undefined,
          ],
          [t.media.seasons, media.number_of_seasons ? String(media.number_of_seasons) : undefined],
          [t.media.episodeCount, media.number_of_episodes ? String(media.number_of_episodes) : undefined],
          [t.media.networks, media.networks?.map((n) => n.name).join(", ")],
        ] as [string, string | undefined][])),
    [t.media.companies, media.production_companies.slice(0, 4).map((c) => c.name).join(", ")],
    [t.media.countries, countries.map((c) => countryName(c, language)).join(", ")],
  ];

  return (
    <div className="rounded-2xl bg-surface p-6 ring-1 ring-white/5">
      <h2 className="mb-5 text-lg font-bold text-white">{t.media.info}</h2>
      {media.vote_count ? <RatingSummary value={media.vote_average ?? 0} votes={media.vote_count} /> : null}
      <dl className="space-y-4">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-bold tracking-wider text-zinc-500 uppercase">{label}</dt>
              <dd className="mt-0.5 text-sm text-zinc-200">{value}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

function RatingSummary({ value, votes }: { value: number; votes: number }) {
  const { t, language } = useI18n();
  const percent = Math.round(value * 10);
  const color = percent >= 70 ? "bg-green-500" : percent >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="mb-6 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="text-xs font-bold tracking-wider text-zinc-500 uppercase">{t.media.userScore}</p>
      <div className="mt-2 flex items-end gap-2">
        <AiFillStar className="mb-1 text-2xl text-yellow-400" aria-hidden="true" />
        <span className="text-4xl leading-none font-extrabold text-white">{value.toFixed(1)}</span>
        <span className="mb-0.5 text-sm font-semibold text-zinc-400">/ 10</span>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-label={t.media.userScore}
      >
        <div className={`h-full rounded-full ${color} transition-[width] duration-1000`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-zinc-400">{t.media.votes(formatCompact(votes, language))}</p>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="flex min-h-[78vh] items-end md:min-h-[88vh]">
      <div className="mx-auto w-full max-w-[1600px] space-y-4 px-4 pb-10 md:px-8 md:pb-16">
        <div className="skeleton h-16 w-80 max-w-full rounded-lg md:h-24" />
        <div className="flex items-center gap-3 pt-2">
          <div className="skeleton size-11 rounded-full" />
          <div className="skeleton h-4 w-56 rounded" />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="max-w-xl space-y-2 pt-2">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-11/12 rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
        <div className="flex gap-3 pt-4">
          <div className="skeleton h-12 w-44 rounded-full" />
          <div className="skeleton h-12 w-44 rounded-full" />
        </div>
      </div>
    </div>
  );
}
