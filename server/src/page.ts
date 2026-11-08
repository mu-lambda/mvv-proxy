/**
 * The nearby page's HTML, in German or English. `/de` and `/en` fix the
 * language, so search engines can find both; `/` picks it from the
 * browser's Accept-Language. The client reads `<html lang>` and shows its
 * text in the same language. All the text is in shared/src/strings.ts.
 */
import { strings } from "shared";

type Lang = strings.Lang;

const SITE = "https://mvv.mulambda.de";

/** The address of each version, for canonical and hreflang links. */
const URLS: Record<Lang | "auto", string> = {
    auto: `${SITE}/`,
    de: `${SITE}/de`,
    en: `${SITE}/en`,
};

/**
 * The page in `lang`. `at` is which address it is served at: its own
 * language's, or `auto` for `/`.
 */
export function nearbyPage(lang: Lang, at: Lang | "auto"): string {
    const t = strings.forLang(lang).page;
    // The text is ours, but escape quotes anyway in case it ever has some.
    const attr = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    return `<!doctype html>
<html lang="${lang}">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${t.title}</title>
        <meta name="description" content="${attr(t.description)}" />
        <link rel="canonical" href="${URLS[at]}" />
        <link rel="alternate" hreflang="de" href="${URLS.de}" />
        <link rel="alternate" hreflang="en" href="${URLS.en}" />
        <link rel="alternate" hreflang="x-default" href="${URLS.auto}" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />

        <!-- Link previews in chats and social networks. -->
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${URLS[at]}" />
        <meta property="og:site_name" content="mvv.mulambda.de" />
        <meta property="og:title" content="${attr(t.ogTitle)}" />
        <meta property="og:description" content="${attr(t.ogDescription)}" />
        <meta property="og:locale" content="${t.ogLocale}" />
        <meta property="og:image" content="${SITE}/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="${attr(t.ogImageAlt)}" />
        <meta name="twitter:card" content="summary_large_image" />

        <!-- Absolute, so they also load under /de/ with a slash. -->
        <link rel="stylesheet" href="/index.css" />
        <link rel="stylesheet" href="/loading.css" />
        <link rel="stylesheet" href="/table.css" />
    </head>
    <body>
        <div id="root"></div>
        <script src="/out/index-bundle.js"></script>
    </body>
</html>
`;
}
