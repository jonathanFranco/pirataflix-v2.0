import { useRef, type ReactNode } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useI18n } from "../i18n";
import { SectionTitle } from "./ui";

export default function Row({ title, children }: { title: ReactNode; children: ReactNode }) {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) =>
    track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.85, behavior: "smooth" });

  const arrow =
    "hidden size-9 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/10 transition hover:bg-brand md:grid";

  return (
    <section className="animate-fade-up">
      <SectionTitle
        aside={
          <div className="flex gap-2">
            <button type="button" aria-label={t.common.previous} onClick={() => scroll(-1)} className={arrow}>
              <IoChevronBack />
            </button>
            <button type="button" aria-label={t.common.next} onClick={() => scroll(1)} className={arrow}>
              <IoChevronForward />
            </button>
          </div>
        }
      >
        {title}
      </SectionTitle>
      <div
        ref={track}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-2 pb-4 md:-mx-8 md:scroll-px-8 md:px-8"
      >
        {children}
      </div>
    </section>
  );
}
