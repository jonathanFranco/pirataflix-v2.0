import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { AiOutlineHeart } from "react-icons/ai";
import { useI18n } from "../i18n";
import { useMyList } from "../services/myList";
import MediaCard from "../components/MediaCard";
import { InfiniteGrid, useLocalPaging } from "../components/MediaGrid";
import { buttonPrimary, chip, EmptyState, Select } from "../components/ui";
import Seo from "../components/Seo";
import { pageSeo } from "../seo/pages.ts";

type Kind = "all" | "movie" | "tv";
type Sort = "recent" | "title" | "rating";

export default function MyList() {
  const { t, language, href } = useI18n();
  const { lista, remove } = useMyList();
  const [kind, setKind] = useState<Kind>("all");
  const [sort, setSort] = useState<Sort>("recent");

  const items = useMemo(() => {
    const filtered = lista.filter((item) => kind === "all" || item.media_type === kind);
    const sorters: Record<Sort, (a: (typeof lista)[number], b: (typeof lista)[number]) => number> = {
      recent: (a, b) => b.added_at - a.added_at,
      title: (a, b) => a.title.localeCompare(b.title, language),
      rating: (a, b) => b.vote_average - a.vote_average,
    };
    return [...filtered].sort(sorters[sort]);
  }, [lista, kind, sort, language]);

  const { visible, hasMore, loadMore } = useLocalPaging(items);

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-24 md:px-8">
      <Seo {...pageSeo.myList(t)} />
      <header className="mb-6 animate-fade-up">
        <h1 className="text-3xl font-extrabold text-white md:text-5xl">{t.myList.title}</h1>
        <p className="mt-2 text-zinc-400">{t.myList.subtitle(lista.length)}</p>
      </header>

      {lista.length === 0 ? (
        <EmptyState icon={<AiOutlineHeart />} title={t.myList.empty}>
          <p className="text-zinc-400">{t.myList.emptyHint}</p>
          <Link to={href("home")} className={`${buttonPrimary} mt-4`}>
            {t.myList.explore}
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {(["all", "movie", "tv"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)} className={chip(kind === k)}>
                {k === "all" ? t.home.all : t.media[k]}
              </button>
            ))}
            <div className="ml-auto">
              <Select
                value={sort}
                onChange={setSort}
                label={t.discover.sortBy}
                options={[
                  { value: "recent", label: t.myList.sortRecent },
                  { value: "title", label: t.myList.sortTitle },
                  { value: "rating", label: t.myList.sortRating },
                ]}
              />
            </div>
          </div>
          <InfiniteGrid isEmpty={items.length === 0} hasMore={hasMore} onLoadMore={loadMore}>
            {visible.map((item, index) => (
              <MediaCard
                key={`${item.media_type}-${item.id}`}
                item={item}
                type={kind === "all" ? undefined : item.media_type}
                index={index}
                onRemove={() => {
                  remove(item.media_type, item.id);
                  toast.info(t.media.removed);
                }}
              />
            ))}
          </InfiniteGrid>
        </>
      )}
    </div>
  );
}
