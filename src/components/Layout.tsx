import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from "react-router";
import { useIsFetching } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { BiCameraMovie, BiHomeAlt2, BiSearch, BiTv } from "react-icons/bi";
import { IoLanguage } from "react-icons/io5";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";
import { LANGUAGES, useI18n, type Language } from "../i18n";
import { useMyList } from "../services/myList";
import logo from "../assets/logo.png";
import { SearchField, Select, Spinner } from "./ui";

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(() => window.scrollY > threshold);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

function LanguageSelect() {
  const { t, language, setLanguage } = useI18n();
  return (
    <Select<Language>
      icon={<IoLanguage />}
      value={language}
      onChange={setLanguage}
      label={t.nav.language}
      options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
    />
  );
}

function SearchForm() {
  const { t, href } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");

  if (location.pathname === href("search")) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `${href("search")}?q=${encodeURIComponent(q)}` : href("search"));
    setQuery("");
  }

  return (
    <form role="search" onSubmit={submit} className="hidden lg:block">
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder={t.nav.searchPlaceholder}
        aria-label={t.nav.search}
        enterKeyHint="search"
        className="w-56 transition-[width] duration-300 focus-within:w-80"
      />
    </form>
  );
}

function ProgressBar() {
  const fetching = useIsFetching() > 0;
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity duration-500 ${fetching ? "opacity-100" : "opacity-0"}`}
    >
      <div className="h-full w-2/5 animate-progress bg-linear-to-r from-transparent via-brand to-transparent" />
    </div>
  );
}

function Navbar() {
  const { t, href } = useI18n();
  const { lista } = useMyList();
  const scrolled = useScrolled();

  const links = [
    { to: href("home"), label: t.nav.home },
    { to: href("movies"), label: t.nav.movies },
    { to: href("series"), label: t.nav.series },
    { to: href("randomPick"), label: t.nav.random },
    { to: href("search"), label: t.nav.search },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-ink/80 shadow-lg shadow-black/30 backdrop-blur-xl"
          : "bg-linear-to-b from-black/80 to-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 md:px-8">
        <Link to={href("home")} className="flex shrink-0 items-center gap-2.5 transition hover:opacity-90">
          <img src={logo} alt="" className="h-8 w-auto" />
          <span className="text-xl font-extrabold tracking-tight text-white">
            Pirata<span className="text-brand">flix</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-white/10 text-white" : "text-zinc-300 hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <SearchForm />
          <LanguageSelect />
          <NavLink
            to={href("myList")}
            aria-label={t.nav.myList}
            className={({ isActive }) =>
              `relative hidden size-10 place-items-center rounded-full text-xl ring-1 transition md:grid ${
                isActive ? "bg-brand text-white ring-brand" : "bg-white/5 text-brand ring-white/10 hover:bg-white/10"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? <AiFillHeart /> : <AiOutlineHeart />}
                {lista.length > 0 && (
                  <span
                    key={lista.length}
                    className="absolute -top-1 -right-1 grid min-w-5 animate-pop place-items-center rounded-full bg-white px-1 text-[0.65rem] font-bold text-ink"
                  >
                    {lista.length}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

function BottomNav() {
  const { t, href } = useI18n();
  const tabs = [
    { to: href("home"), label: t.nav.home, icon: BiHomeAlt2 },
    { to: href("movies"), label: t.nav.movies, icon: BiCameraMovie },
    { to: href("series"), label: t.nav.series, icon: BiTv },
    { to: href("randomPick"), label: t.nav.random, icon: GiPerspectiveDiceSixFacesRandom },
    { to: href("search"), label: t.nav.search, icon: BiSearch },
    { to: href("myList"), label: t.nav.myList, icon: AiOutlineHeart },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-6">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[0.65rem] font-semibold transition ${
                  isActive ? "text-white" : "text-zinc-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`text-2xl transition ${isActive ? "scale-110 text-brand" : ""}`} />
                  <span className="line-clamp-1">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-white/5 px-4 py-10 text-center text-xs text-zinc-500 md:px-8">
      <a
        href="https://www.themoviedb.org"
        target="_blank"
        rel="noreferrer"
        className="font-bold text-zinc-300 transition hover:text-white"
      >
        The Movie Database (TMDB)
      </a>
      <p className="mt-2">{t.footer.attribution}</p>
    </footer>
  );
}

function PageTransition() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="animate-page-in">
      <Outlet />
    </div>
  );
}

export default function Layout() {
  return (
    <>
      <ProgressBar />
      <Navbar />
      <main className="min-h-screen">
        <Suspense fallback={<Spinner className="h-screen" />}>
          <PageTransition />
        </Suspense>
      </main>
      <Footer />
      <div className="h-16 md:hidden" />
      <BottomNav />
      <ToastContainer position="bottom-center" autoClose={2000} hideProgressBar theme="dark" />
      <ScrollRestoration />
    </>
  );
}
