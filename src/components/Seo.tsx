import { useI18n } from "../i18n";
import { headTags, type SeoData } from "../seo/meta.ts";

export default function Seo(props: SeoData) {
  const { language } = useI18n();
  return (
    <>
      {headTags(props, language).map((tag, i) => {
        if (tag.tag === "title") return <title key={i}>{tag.text}</title>;
        if (tag.tag === "meta") return <meta key={i} {...tag.attrs} />;
        if (tag.tag === "link") return <link key={i} {...tag.attrs} />;
        return <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: tag.text }} />;
      })}
    </>
  );
}
