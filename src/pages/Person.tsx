import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { isAxiosError } from "axios";
import { BiUser } from "react-icons/bi";
import { useI18n } from "../i18n";
import { ageAt, formatDate } from "../i18n/format";
import { useTmdbQuery } from "../hooks/tmdbQueries";
import { imageUrl, mediaDate, type ListItem, type PersonDetails } from "../services/tmdb";
import MediaCard from "../components/MediaCard";
import Row from "../components/Row";
import { InfiniteGrid, useLocalPaging } from "../components/MediaGrid";
import { buttonGhost, chip, ErrorState, FadeImage, SectionTitle } from "../components/ui";
import Seo from "../components/Seo";
import { personSeo } from "../seo/meta.ts";

type Dept = "cast" | "crew";
type Kind = "all" | "movie" | "tv";

export default function Person() {
  const { id } = useParams();
  return <PersonContent key={id} id={Number(id)} />;
}

function PersonContent({ id }: { id: number }) {
  const { t, language, href } = useI18n();
  const query = useTmdbQuery<PersonDetails>(`person/${id}`, { append_to_response: "combined_credits" });
  const needsFallback = !!query.data && !query.data.biography && language !== "en-US";
  const fallback = useTmdbQuery<PersonDetails>(`person/${id}`, { language: "en-US" }, { enabled: needsFallback });

  if (query.isPending) {
    return (
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 pt-28 md:flex-row md:px-8">
        <div className="skeleton aspect-2/3 w-48 self-center rounded-2xl md:w-72 md:self-start" />
        <div className="flex-1 space-y-4">
          <div className="skeleton h-12 w-1/2 rounded-lg" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-4 w-full max-w-2xl rounded" />
          ))}
        </div>
      </div>
    );
  }
  if (query.isError) {
    const notFound = isAxiosError(query.error) && query.error.response?.status === 404;
    return (
      <div className="pt-24">
        <Seo
          title={notFound ? t.person.notFound : t.common.loadError}
          description={t.seo.homeDescription}
          route={{ key: "person", id }}
          noindex
        />
        <ErrorState message={notFound ? t.person.notFound : undefined} onRetry={notFound ? undefined : () => query.refetch()} />
        <div className="flex justify-center">
          <Link to={href("home")} className={buttonGhost}>
            {t.common.backHome}
          </Link>
        </div>
      </div>
    );
  }

  const person = query.data;
  const biography = person.biography || fallback.data?.biography;
  return <PersonView person={person} biography={biography} />;
}

function PersonView({ person, biography }: { person: PersonDetails; biography?: string }) {
  const { t, language } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [dept, setDept] = useState<Dept>(person.known_for_department === "Acting" ? "cast" : "crew");
  const [kind, setKind] = useState<Kind>("all");

  const knownFor = useMemo(
    () =>
      dedupe(person.known_for_department === "Acting" ? person.combined_credits.cast : person.combined_credits.crew)
        .filter((c) => c.poster_path)
        .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
        .slice(0, 15),
    [person],
  );

  const facts: [string, string | null | undefined][] = [
    [t.person.department, t.departments[person.known_for_department] ?? person.known_for_department],
    [
      t.person.born,
      person.birthday &&
        `${formatDate(person.birthday, language)}${person.deathday ? "" : ` (${t.person.age(ageAt(person.birthday))})`}`,
    ],
    [
      t.person.died,
      person.deathday &&
        `${formatDate(person.deathday, language)}${person.birthday ? ` (${t.person.age(ageAt(person.birthday, person.deathday))})` : ""}`,
    ],
    [t.person.birthplace, person.place_of_birth ?? undefined],
  ];

  return (
    <>
      <Seo {...personSeo({ ...person, biography }, { key: "person", id: person.id }, t.seo.personFallback)} />
      <section className="relative overflow-hidden">
        {person.profile_path && (
          <img
            src={imageUrl("w500", person.profile_path)}
            alt=""
            className="absolute inset-0 size-full scale-110 object-cover opacity-20 blur-3xl"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-ink to-ink/40" />
        <div className="relative mx-auto flex max-w-[1600px] flex-col gap-8 px-4 pt-28 pb-12 md:flex-row md:px-8">
          <div className="w-48 shrink-0 animate-fade-up self-center md:w-72 md:self-start">
            {person.profile_path ? (
              <FadeImage
                src={imageUrl("w500", person.profile_path)}
                alt={person.name}
                loading="eager"
                className="aspect-2/3 w-full rounded-2xl object-cover shadow-2xl ring-1 ring-white/10"
              />
            ) : (
              <div className="grid aspect-2/3 place-items-center rounded-2xl bg-surface-2 text-7xl text-zinc-600">
                <BiUser />
              </div>
            )}
          </div>
          <div className="max-w-3xl animate-fade-up" style={{ animationDelay: "120ms" }}>
            <h1 className="text-4xl font-extrabold text-white md:text-6xl">{person.name}</h1>
            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {facts
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-bold tracking-wider text-zinc-400 uppercase">{label}</dt>
                    <dd className="mt-0.5 text-sm text-zinc-200">{value}</dd>
                  </div>
                ))}
            </dl>
            <h2 className="mt-8 text-sm font-bold tracking-widest text-zinc-400 uppercase">{t.person.biography}</h2>
            <p className={`mt-2 leading-relaxed whitespace-pre-line text-zinc-200 ${expanded ? "" : "line-clamp-6"}`}>
              {biography || t.person.noBiography}
            </p>
            {biography && biography.length > 500 && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="mt-2 text-sm font-bold text-brand transition hover:text-red-400"
              >
                {expanded ? t.person.readLess : t.person.readMore}
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] space-y-12 px-4 md:px-8">
        {knownFor.length > 0 && (
          <Row title={t.person.knownFor}>
            {knownFor.map((item, index) => (
              <div key={`${item.media_type}-${item.id}`} className="w-36 shrink-0 snap-start md:w-44">
                <MediaCard item={item} index={index} />
              </div>
            ))}
          </Row>
        )}

        <section>
          <SectionTitle>{t.person.filmography}</SectionTitle>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {(["cast", "crew"] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDept(d)} className={chip(dept === d)}>
                {d === "cast" ? t.person.acting : t.person.crew} ({dedupe(person.combined_credits[d]).length})
              </button>
            ))}
            <span className="mx-2 h-6 w-px bg-white/10" />
            {(["all", "movie", "tv"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)} className={chip(kind === k)}>
                {k === "all" ? t.home.all : t.media[k]}
              </button>
            ))}
          </div>
          <Filmography key={`${dept}-${kind}`} credits={person.combined_credits[dept]} kind={kind} />
        </section>
      </div>
    </>
  );
}

function dedupe(credits: ListItem[]) {
  const byKey = new Map<string, ListItem>();
  for (const credit of credits) {
    const key = `${credit.media_type}-${credit.id}`;
    const existing = byKey.get(key);
    if (!existing) byKey.set(key, { ...credit });
    else if (credit.job && existing.job && !existing.job.includes(credit.job)) existing.job += `, ${credit.job}`;
  }
  return [...byKey.values()];
}

function Filmography({ credits, kind }: { credits: ListItem[]; kind: Kind }) {
  const items = useMemo(
    () =>
      dedupe(credits)
        .filter((c) => kind === "all" || c.media_type === kind)
        .sort((a, b) => (mediaDate(b) ?? "9999").localeCompare(mediaDate(a) ?? "9999")),
    [credits, kind],
  );
  const { visible, hasMore, loadMore } = useLocalPaging(items);

  return (
    <InfiniteGrid isEmpty={items.length === 0} hasMore={hasMore} onLoadMore={loadMore}>
      {visible.map((item, index) => (
        <MediaCard
          key={`${item.media_type}-${item.id}`}
          item={item}
          index={index}
          subtitle={[mediaDate(item)?.slice(0, 4), item.character || item.job].filter(Boolean).join(" · ")}
        />
      ))}
    </InfiniteGrid>
  );
}
