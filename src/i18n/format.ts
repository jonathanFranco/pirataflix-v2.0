export const formatDate = (date: string | null | undefined, language: string) =>
  date
    ? new Intl.DateTimeFormat(language, { dateStyle: "long", timeZone: "UTC" }).format(new Date(date))
    : undefined;

export const yearOf = (date: string | null | undefined) => date?.slice(0, 4) || undefined;

export const formatMoney = (value: number | null | undefined, language: string) =>
  value
    ? new Intl.NumberFormat(language, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value)
    : undefined;

export const formatCompact = (value: number, language: string) =>
  new Intl.NumberFormat(language, { notation: "compact" }).format(value);

export const formatRuntime = (minutes: number | null | undefined) => {
  if (!minutes) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? ` ${m}min` : ""}` : `${m}min`;
};

function displayName(code: string, language: string, type: "language" | "region") {
  try {
    const name = new Intl.DisplayNames([language], { type }).of(code);
    return name ? name.charAt(0).toLocaleUpperCase(language) + name.slice(1) : code;
  } catch {
    return code;
  }
}

export const languageName = (code: string, language: string) =>
  displayName(code, language, "language");

export const countryName = (code: string, language: string) => displayName(code, language, "region");

export function ageAt(birthday: string, until?: string | null) {
  const from = new Date(birthday);
  const to = until ? new Date(until) : new Date();
  let age = to.getUTCFullYear() - from.getUTCFullYear();
  const beforeBirthday =
    to.getUTCMonth() < from.getUTCMonth() ||
    (to.getUTCMonth() === from.getUTCMonth() && to.getUTCDate() < from.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}
