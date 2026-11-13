import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { BiCameraMovie } from "react-icons/bi";
import { useI18n } from "../i18n";
import type { ListItem, MediaType, Paged } from "../services/tmdb";
import MediaCard, { MediaCardSkeleton } from "./MediaCard";
import { EmptyState, ErrorState, Spinner } from "./ui";

export const gridClass =
  "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

type GridProps = {
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  empty?: ReactNode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  isStale?: boolean;
};

export function InfiniteGrid({ children, isLoading, isEmpty, empty, hasMore, isLoadingMore, onLoadMore, isStale }: GridProps) {
  const { t } = useI18n();
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || isLoadingMore || isStale || !onLoadMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && onLoadMore(),
      { rootMargin: "900px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isStale, onLoadMore]);

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 18 }, (_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isEmpty) return <>{empty ?? <EmptyState icon={<BiCameraMovie />} title={t.common.noResults} />}</>;

  return (
    <>
      <div
        aria-busy={isStale}
        className={`${gridClass} transition-[opacity,filter] duration-300 ${isStale ? "pointer-events-none opacity-40 saturate-50" : ""}`}
      >
        {children}
      </div>
      <div ref={sentinel} className="flex h-24 items-center justify-center">
        {isLoadingMore && <Spinner />}
        {!hasMore && !isLoadingMore && (
          <p className="flex items-center gap-3 text-sm text-zinc-500">
            <span className="h-px w-10 bg-zinc-700" />
            {t.common.end}
            <span className="h-px w-10 bg-zinc-700" />
          </p>
        )}
      </div>
    </>
  );
}

type QueryGridProps = {
  query: UseInfiniteQueryResult<InfiniteData<Paged<ListItem>>>;
  type?: MediaType | "person";
  empty?: ReactNode;
};

export function QueryGrid({ query, type, empty }: QueryGridProps) {
  const { data, isPending, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage, isPlaceholderData } = query;

  const items = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) =>
      page.results.filter((item) => {
        const key = `${type ?? item.media_type}-${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    );
  }, [data, type]);

  if (isError && !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <InfiniteGrid
      isLoading={isPending}
      isEmpty={items.length === 0}
      empty={empty}
      hasMore={hasNextPage}
      isLoadingMore={isFetchingNextPage}
      onLoadMore={fetchNextPage}
      isStale={isPlaceholderData}
    >
      {items.map((item, index) => (
        <MediaCard key={`${type ?? item.media_type}-${item.id}`} item={item} type={type} index={index} />
      ))}
    </InfiniteGrid>
  );
}

export function useLocalPaging<T>(items: T[], pageSize = 24) {
  const [count, setCount] = useState(pageSize);
  return {
    visible: items.slice(0, count),
    hasMore: count < items.length,
    loadMore: () => setCount((c) => c + pageSize),
    reset: () => setCount(pageSize),
  };
}
