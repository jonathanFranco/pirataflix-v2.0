import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { AiFillHeart, AiFillStar, AiOutlineHeart } from "react-icons/ai";
import { BiCheckDouble, BiChevronRight, BiPlay, BiReset, BiSearchAlt } from "react-icons/bi";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";
import { useI18n } from "../i18n";
import { formatRuntime, yearOf } from "../i18n/format";
import { useTmdbQuery } from "../hooks/tmdbQueries";
import { useMyList } from "../services/myList";
import {
  DEFAULT_PREFS,
  drawTitle,
  loadPrefs,
  loadSeen,
  MOODS,
  PERIODS,
  RATINGS,
  RUNTIMES,
  savePrefs,
  saveSeen,
  titleKey,
  type MoodKey,
  type Prefs,
} from "../services/randomPick";
import {
  imageUrl,
  mediaDate,
  mediaTitle,
  type MediaDetails,
  type MediaType,
  type Provider,
  type Video,
} from "../services/tmdb";
import Modal from "../components/Modal";
import { buttonGhost, buttonPrimary, chip, EmptyState, ErrorState, FadeImage } from "../components/ui";
import Seo from "../components/Seo";
import { pageSeo } from "../seo/pages.ts";

const SPIN_MS = 2400;

type Status = "idle" | "drawing" | "done" | "empty" | "error";
type Picked = MediaDetails & { media_type: MediaType };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function RandomPick() {
  const { t, language, languageCode, region } = useI18n();
  const [prefs, setPrefs] = useState(loadPrefs);
  const [seen, setSeen] = useState(loadSeen);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Picked | null>(null);
  const [history, setHistory] = useState<Picked[]>([]);
  const [posters, setPosters] = useState<string[]>([]);
  const drawId = useRef(0);
  const stage = useRef<HTMLElement>(null);

  useEffect(() => savePrefs(prefs), [prefs]);
  useEffect(() => saveSeen(seen), [seen]);

  async function draw(extraSeen: string[] = []) {
    const id = ++drawId.current;
    setStatus("drawing");
    if (window.innerWidth < 1024) stage.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const exclude = new Set([...seen, ...extraSeen, ...history.map((h) => titleKey(h.media_type, h.id))]);
    try {
      const [picked] = await Promise.all([
        drawTitle({
          prefs,
          language,
          languageCode,
          region,
          exclude,
          onCandidates: (paths) => {
            const urls = paths.map((p) => imageUrl("w342", p)!);
            urls.forEach((url) => (new Image().src = url));
            if (id === drawId.current && urls.length > 1) setPosters(urls);
          },
        }),
        sleep(SPIN_MS),
      ]);
      if (id !== drawId.current) return;
      if (!picked) {
        setStatus("empty");
        return;
      }
      setResult(picked);
      setHistory((h) => [picked, ...h.filter((x) => titleKey(x.media_type, x.id) !== titleKey(picked.media_type, picked.id))].slice(0, 10));
      setStatus("done");
    } catch (error) {
      console.error(error);
      if (id === drawId.current) setStatus("error");
    }
  }

  function markSeen() {
    if (!result) return;
    const key = titleKey(result.media_type, result.id);
    setSeen((s) => (s.includes(key) ? s : [...s, key]));
    toast.info(t.random.seenToast);
    draw([key]);
  }

  const drawing = status === "drawing";

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-24 md:px-8">
      <Seo {...pageSeo.randomPick(t)} />
      <header className="mb-8 flex animate-fade-up flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-bold tracking-widest text-red-300 uppercase ring-1 ring-brand/40">
          <GiPerspectiveDiceSixFacesRandom className="text-base" /> {t.nav.random}
        </span>
        <h1 className="text-3xl font-extrabold text-white md:text-5xl">{t.random.heading}</h1>
        <p className="max-w-2xl text-zinc-400 md:text-lg">{t.random.subtitle}</p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
        <PrefsPanel prefs={prefs} onChange={setPrefs} disabled={drawing} />

        <section ref={stage} className="min-w-0 scroll-mt-20 space-y-6" aria-live="polite" aria-busy={drawing}>
          <button
            type="button"
            onClick={() => draw()}
            disabled={drawing}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-linear-to-r from-brand-dark via-brand to-brand-dark bg-size-[200%_100%] px-6 py-5 text-lg font-extrabold text-white shadow-lg shadow-brand/15 transition-all duration-500 hover:bg-right hover:shadow-brand/25 active:scale-[0.98] disabled:cursor-wait disabled:opacity-90"
          >
            <GiPerspectiveDiceSixFacesRandom
              className={`text-3xl transition-transform duration-500 ${drawing ? "animate-roll" : "group-hover:rotate-180"}`}
            />
            {drawing ? t.random.drawing : status === "done" ? t.random.drawAgain : t.random.draw}
          </button>

          {status === "idle" && <IdleStage />}
          {drawing && <Shuffler posters={posters} />}
          {status === "done" && result && <ResultCard key={titleKey(result.media_type, result.id)} media={result} onSeen={markSeen} />}
          {status === "empty" && (
            <EmptyState icon={<BiSearchAlt />} title={t.random.empty}>
              <p className="text-zinc-400">{t.random.emptyHint}</p>
            </EmptyState>
          )}
          {status === "error" && <ErrorState onRetry={() => draw()} />}

          {history.length > 1 && (
            <div className="animate-fade-up">
              <h2 className="mb-3 text-xs font-bold tracking-widest text-zinc-400 uppercase">{t.random.history}</h2>
              <div className="no-scrollbar -m-2 flex gap-3 overflow-x-auto p-2">
                {history.map((item) => {
                  const active = result && titleKey(item.media_type, item.id) === titleKey(result.media_type, result.id);
                  return (
                    <button
                      key={titleKey(item.media_type, item.id)}
                      type="button"
                      title={mediaTitle(item)}
                      aria-label={mediaTitle(item)}
                      onClick={() => {
                        setResult(item);
                        setStatus("done");
                      }}
                      className={`w-16 shrink-0 overflow-hidden rounded-lg transition hover:scale-105 md:w-20 ${active ? "ring-2 ring-brand" : "opacity-60 ring-1 ring-white/10 hover:opacity-100"}`}
                    >
                      <img src={imageUrl("w185", item.poster_path)} alt="" className="aspect-2/3 w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-xs font-bold tracking-widest text-zinc-400 uppercase">{title}</legend>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function PrefsPanel({ prefs, onChange, disabled }: { prefs: Prefs; onChange: (p: Prefs) => void; disabled: boolean }) {
  const { t, region } = useI18n();
  const providers = useTmdbQuery<{ results: Provider[] }>(`watch/providers/${prefs.type}`, { watch_region: region });
  const topProviders = (providers.data?.results ?? [])
    .slice()
    .sort((a, b) => a.display_priority - b.display_priority)
    .slice(0, 16);
  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) => onChange({ ...prefs, [key]: value });
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  return (
    <aside
      className="animate-fade-up space-y-7 rounded-2xl bg-surface p-5 ring-1 ring-white/5 md:p-6 lg:sticky lg:top-24"
      inert={disabled}
      style={{ animationDelay: "80ms" }}
    >
      <Group title={t.random.type}>
        <div className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-ink p-1.5 ring-1 ring-white/5">
          {(["movie", "tv"] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={prefs.type === type}
              onClick={() => onChange({ ...prefs, type, providers: [] })}
              className={`rounded-xl py-2.5 text-sm font-bold transition duration-300 ${
                prefs.type === type ? "bg-brand text-white shadow-md shadow-brand/15" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {type === "movie" ? "🎬" : "📺"} {t.media[type]}
            </button>
          ))}
        </div>
      </Group>

      <Group title={t.random.mood} hint={t.random.moodHint}>
        {(Object.keys(MOODS) as MoodKey[]).map((mood) => (
          <button
            key={mood}
            type="button"
            aria-pressed={prefs.moods.includes(mood)}
            onClick={() => set("moods", toggle(prefs.moods, mood))}
            className={chip(prefs.moods.includes(mood))}
          >
            <span aria-hidden="true">{MOODS[mood].emoji}</span> {t.random.moods[mood]}
          </button>
        ))}
      </Group>

      <Group title={t.random.period}>
        {PERIODS.map((period) => (
          <button key={period} type="button" aria-pressed={prefs.period === period} onClick={() => set("period", period)} className={chip(prefs.period === period)}>
            {t.random.periods[period]}
          </button>
        ))}
      </Group>

      {prefs.type === "movie" && (
        <Group title={t.random.runtime}>
          {RUNTIMES.map((runtime) => (
            <button key={runtime} type="button" aria-pressed={prefs.runtime === runtime} onClick={() => set("runtime", runtime)} className={chip(prefs.runtime === runtime)}>
              {t.random.runtimes[runtime]}
            </button>
          ))}
        </Group>
      )}

      <Group title={t.random.minRating}>
        {RATINGS.map((rating) => (
          <button key={rating} type="button" aria-pressed={prefs.minRating === rating} onClick={() => set("minRating", rating)} className={chip(prefs.minRating === rating)}>
            ★ {rating}+
          </button>
        ))}
      </Group>

      {topProviders.length > 0 && (
        <Group title={`${t.random.providers} (${region})`} hint={t.random.providersHint}>
          {topProviders.map((p) => {
            const selected = prefs.providers.includes(p.provider_id);
            return (
              <button
                key={p.provider_id}
                type="button"
                title={p.provider_name}
                aria-label={p.provider_name}
                aria-pressed={selected}
                onClick={() => set("providers", toggle(prefs.providers, p.provider_id))}
                className={`overflow-hidden rounded-xl transition hover:scale-110 ${selected ? "ring-3 ring-brand" : "opacity-50 ring-1 ring-white/10 hover:opacity-100"}`}
              >
                <img src={imageUrl("w92", p.logo_path)} alt="" className="size-10" loading="lazy" />
              </button>
            );
          })}
        </Group>
      )}

      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_PREFS, type: prefs.type })}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 transition hover:text-white"
      >
        <BiReset /> {t.random.reset}
      </button>
    </aside>
  );
}

function IdleStage() {
  const { t } = useI18n();
  return (
    <div className="flex animate-fade-up flex-col items-center gap-6 rounded-3xl bg-surface/60 px-6 py-14 text-center ring-1 ring-white/5">
      <div className="relative h-52 w-64" aria-hidden="true">
        {[-14, 0, 14].map((rotate, i) => (
          <div
            key={rotate}
            className="absolute top-0 left-1/2 grid h-48 w-32 place-items-center rounded-2xl bg-linear-to-br from-surface-2 to-ink text-5xl font-extrabold text-zinc-600 shadow-2xl ring-1 ring-white/10"
            style={{ transform: `translateX(-50%) translateX(${rotate * 3}px) rotate(${rotate}deg)`, zIndex: i === 1 ? 2 : 1 }}
          >
            ?
          </div>
        ))}
      </div>
      <div>
        <p className="text-xl font-bold text-white">{t.random.idle}</p>
        <p className="mt-1 text-zinc-400">{t.random.idleHint}</p>
      </div>
    </div>
  );
}

function Shuffler({ posters }: { posters: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (posters.length < 2) return;
    const start = performance.now();
    let delay = 70;
    let timer: number;
    const tick = () => {
      setIndex((i) => (i + 1) % posters.length);
      if (performance.now() - start > SPIN_MS * 0.5) delay = Math.min(delay * 1.2, 360);
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, delay);
    return () => clearTimeout(timer);
  }, [posters]);

  const at = (offset: number) => posters[(index + offset + posters.length) % posters.length];
  const frame = "aspect-2/3 overflow-hidden rounded-2xl ring-1 ring-white/10";

  return (
    <div className="flex animate-fade-in items-center justify-center gap-4 overflow-hidden rounded-3xl bg-surface/60 py-10 ring-1 ring-white/5" role="status">
      {posters.length > 1 ? (
        <>
          <img src={at(-1)} alt="" className={`${frame} hidden w-32 -rotate-6 opacity-30 blur-[2px] sm:block`} />
          <div className={`${frame} w-48 animate-glow ring-2 ring-brand md:w-56`}>
            <img src={at(0)} alt="" className="size-full object-cover" />
          </div>
          <img src={at(1)} alt="" className={`${frame} hidden w-32 rotate-6 opacity-30 blur-[2px] sm:block`} />
        </>
      ) : (
        <div className={`${frame} skeleton w-48 md:w-56`} />
      )}
    </div>
  );
}

function ResultCard({ media, onSeen }: { media: Picked; onSeen: () => void }) {
  const { t, region, href } = useI18n();
  const { has, add, remove } = useMyList();
  const [trailer, setTrailer] = useState<Video | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const type = media.media_type;
  const title = mediaTitle(media);
  const saved = has(type, media.id);
  const year = yearOf(mediaDate(media));
  const runtime = formatRuntime(media.runtime || media.episode_run_time?.[0]);
  const video =
    media.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    media.videos?.results.find((v) => v.site === "YouTube");
  const streaming = media["watch/providers"]?.results[region]?.flatrate ?? [];
  const director = media.credits?.crew.find((c) => c.job === "Director")?.name;
  const creator = media.created_by?.map((c) => c.name).join(", ");
  const stagger = (i: number) => ({ animationDelay: `${300 + i * 80}ms` });

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
    <article className="relative isolate animate-fade-in overflow-hidden rounded-3xl bg-surface ring-1 ring-white/10">
      {media.backdrop_path && (
        <FadeImage
          src={imageUrl("w1280", media.backdrop_path)}
          alt=""
          loading="eager"
          className="absolute inset-0 -z-10 size-full animate-ken-burns object-cover"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-surface via-surface/90 to-surface/50" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-surface via-transparent to-transparent" />

      <div className="grid gap-6 p-5 sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr] md:gap-8 md:p-8">
        <Link to={href(type, media.id)} className="mx-auto w-44 sm:w-full">
          <img
            src={imageUrl("w500", media.poster_path)}
            alt={title}
            className="aspect-2/3 w-full animate-reveal rounded-2xl object-cover ring-2 ring-brand [animation-fill-mode:both] [box-shadow:0_0_60px_-8px_rgb(229_9_20/0.6)]"
          />
        </Link>

        <div className="min-w-0">
          <p className="inline-flex animate-fade-up items-center gap-2 text-xs font-bold tracking-widest text-red-300 uppercase" style={stagger(0)}>
            🎉 {t.random.picked}
          </p>
          <h2 className="mt-2 animate-fade-up text-3xl leading-tight font-extrabold text-white md:text-4xl" style={stagger(1)}>
            {title}
          </h2>

          <div className="mt-3 flex animate-fade-up flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-zinc-300" style={stagger(2)}>
            {!!media.vote_average && (
              <span className="inline-flex items-center gap-1 text-white">
                <AiFillStar className="text-yellow-400" /> {media.vote_average.toFixed(1)}
              </span>
            )}
            {[year, runtime, media.number_of_seasons ? `${media.number_of_seasons} ${t.media.seasons.toLowerCase()}` : undefined]
              .filter(Boolean)
              .map((part) => (
                <span key={part} className="before:mr-3 before:text-zinc-500 before:content-['•']">
                  {part}
                </span>
              ))}
          </div>
          {(director || creator) && (
            <p className="mt-1.5 animate-fade-up text-sm text-zinc-400" style={stagger(2)}>
              {director ? t.media.director : t.media.creators}:{" "}
              <span className="font-semibold text-zinc-200">{director ?? creator}</span>
            </p>
          )}

          {media.genres.length > 0 && (
            <div className="mt-4 flex animate-fade-up flex-wrap gap-2" style={stagger(3)}>
              {media.genres.map((g) => (
                <span key={g.id} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-200 ring-1 ring-white/15">
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {media.tagline && (
            <p className="mt-4 animate-fade-up text-zinc-300 italic" style={stagger(4)}>
              “{media.tagline}”
            </p>
          )}
          <p className="mt-3 line-clamp-5 max-w-2xl animate-fade-up leading-relaxed text-zinc-200" style={stagger(5)}>
            {media.overview || t.media.noOverview}
          </p>

          {streaming.length > 0 && (
            <div className="mt-5 animate-fade-up" style={stagger(6)}>
              <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">{t.media.whereToWatch}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {streaming.map((p) => (
                  <img
                    key={p.provider_id}
                    src={imageUrl("w92", p.logo_path)}
                    alt={p.provider_name}
                    title={p.provider_name}
                    className="size-10 rounded-lg ring-1 ring-white/10"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex animate-fade-up flex-wrap gap-3" style={stagger(7)}>
            <Link to={href(type, media.id)} className={buttonPrimary}>
              {t.home.details} <BiChevronRight className="text-lg" />
            </Link>
            {video && (
              <button
                type="button"
                onClick={() => {
                  setTrailer(video);
                  setTrailerOpen(true);
                }}
                className={buttonGhost}
              >
                <BiPlay className="text-lg" /> {t.media.trailer}
              </button>
            )}
            <button type="button" onClick={toggleSaved} aria-pressed={saved} className={buttonGhost}>
              {saved ? <AiFillHeart className="animate-pop text-lg text-brand" /> : <AiOutlineHeart className="text-lg" />}
              {saved ? t.media.saved : t.media.save}
            </button>
            <button type="button" onClick={onSeen} className={buttonGhost}>
              <BiCheckDouble className="text-lg" /> {t.random.seen}
            </button>
          </div>
        </div>
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
    </article>
  );
}
