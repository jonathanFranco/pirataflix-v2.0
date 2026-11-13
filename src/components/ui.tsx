import {
  useRef,
  useState,
  type ImgHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { BiCheck, BiChevronDown, BiErrorCircle, BiSearch } from "react-icons/bi";
import { IoClose } from "react-icons/io5";
import { useI18n } from "../i18n";

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand/15 transition hover:scale-[1.03] hover:bg-red-600 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
export const buttonGhost =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
export const chip = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition duration-200 active:scale-95 ${
    active
      ? "bg-brand text-white ring-brand"
      : "bg-white/5 text-zinc-300 ring-white/10 hover:bg-white/10 hover:text-white"
  }`;

export type SelectOption<T extends string> = { value: T; label: string };

type SelectProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  label: string;
  icon?: ReactNode;
  className?: string;
};

export function Select<T extends string>({ value, onChange, options, label, icon, className = "" }: SelectProps<T>) {
  const selected = options.find((o) => o.value === value) ?? options[0];
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        aria-label={label}
        className={`group inline-flex items-center gap-2 rounded-full bg-white/5 py-2 pr-3 pl-4 text-sm font-medium text-white ring-1 ring-white/10 transition duration-200 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand data-open:bg-white/10 data-open:ring-brand/60 ${className}`}
      >
        {icon && (
          <span className="text-zinc-400 transition group-hover:text-white" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="truncate">{selected?.label}</span>
        <BiChevronDown
          className="ml-auto shrink-0 text-lg text-zinc-400 transition duration-300 group-hover:text-white group-data-open:rotate-180 group-data-open:text-brand"
          aria-hidden="true"
        />
      </ListboxButton>
      <ListboxOptions
        anchor={{ to: "bottom start", gap: 8, padding: 12 }}
        transition
        className="z-50 max-h-72 min-w-(--button-width) origin-top overflow-y-auto rounded-2xl bg-surface-2/95 p-1.5 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-xl transition duration-200 ease-out outline-none [scrollbar-width:thin] data-closed:-translate-y-1 data-closed:scale-95 data-closed:opacity-0"
      >
        {options.map((option) => (
          <ListboxOption
            key={option.value}
            value={option.value}
            className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-colors duration-150 select-none data-focus:bg-white/10 data-focus:text-white data-selected:font-semibold data-selected:text-white"
          >
            <span className="flex-1 truncate">{option.label}</span>
            <BiCheck className="invisible shrink-0 text-lg text-brand group-data-selected:visible" aria-hidden="true" />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> & {
  value: string;
  onChange: (value: string) => void;
  size?: "md" | "lg";
};

export function SearchField({ value, onChange, size = "md", className = "", ...props }: SearchFieldProps) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const lg = size === "lg";
  const clear = () => {
    onChange("");
    input.current?.focus();
  };

  return (
    <div className={`group relative ${className}`}>
      <BiSearch
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-brand ${lg ? "left-5 text-2xl" : "left-3.5 text-lg"}`}
        aria-hidden="true"
      />
      <input
        ref={input}
        type="search"
        autoComplete="off"
        spellCheck={false}
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            clear();
          }
        }}
        className={`w-full text-white ring-1 ring-white/10 transition-all duration-300 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-brand ${
          lg
            ? "rounded-2xl bg-surface py-5 pr-14 pl-14 text-lg shadow-2xl focus:shadow-brand/10 md:text-xl"
            : "rounded-full bg-white/5 py-2 pr-9 pl-10 text-sm focus:bg-white/10"
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label={t.search.clear}
          className={`absolute top-1/2 grid -translate-y-1/2 animate-pop place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white ${lg ? "right-4 size-9 text-2xl" : "right-2 size-6 text-base"}`}
        >
          <IoClose />
        </button>
      )}
    </div>
  );
}

export function FadeImage({ className = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      loading="lazy"
      decoding="async"
      {...props}
      ref={(img) => {
        if (img?.complete && img.naturalWidth) setLoaded(true);
      }}
      onLoad={() => setLoaded(true)}
      className={`transition-[opacity,transform] duration-700 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-label={t.common.loading} className={`flex items-center justify-center gap-1.5 ${className}`}>
      {[0, 120, 240, 360].map((delay) => (
        <span
          key={delay}
          className="h-6 w-1.5 animate-pulse rounded-full bg-brand"
          style={{ animationDelay: `${delay}ms`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

export function ScoreRing({ value, size = 56 }: { value: number; size?: number }) {
  const percent = Math.round(value * 10);
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = percent >= 70 ? "#22c55e" : percent >= 50 ? "#eab308" : "#ef4444";
  return (
    <div className="relative grid shrink-0 place-items-center rounded-full bg-ink/80" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className="transition-[stroke-dashoffset] duration-1000"
        />
      </svg>
      <span className="text-sm font-bold text-white">
        {percent}
        <span className="text-[0.6em] align-super">%</span>
      </span>
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="flex items-center gap-3 text-xl font-bold text-white md:text-2xl">
        <span className="h-6 w-1 rounded-full bg-brand" aria-hidden="true" />
        {children}
      </h2>
      {aside}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex animate-fade-up flex-col items-center gap-3 px-4 py-20 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-white/5 text-4xl text-zinc-500 ring-1 ring-white/10">
        {icon}
      </div>
      <p className="text-lg font-bold text-white">{title}</p>
      {children}
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useI18n();
  return (
    <EmptyState icon={<BiErrorCircle />} title={message ?? t.common.loadError}>
      {onRetry && (
        <button type="button" onClick={onRetry} className={buttonGhost}>
          {t.common.retry}
        </button>
      )}
    </EmptyState>
  );
}
