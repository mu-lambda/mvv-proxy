/**
 * The nearby page's HTML, in German, English or Russian. `/de`, `/en` and
 * `/ru` fix the language, so search engines can find each; `/` picks it
 * from the browser's Accept-Language. The client reads `<html lang>` and shows its
 * text in the same language. All the text is in shared/src/strings.ts.
 */
import { strings } from "shared";

type Lang = strings.Lang;

/** The header's colour, for the browser's and the installed app's bars. */
const THEME_COLOUR = "#c0d101";

/**
 * `s` for an attribute. The text is ours, but escape quotes anyway in case
 * it ever has some.
 */
function attr(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * The links that need the site's own address: canonical and hreflang for
 * search engines, and the link preview. Without a host there are none.
 */
function siteLinks(
    lang: Lang,
    t: strings.PageText,
    at: Lang | "auto",
    host: string | undefined,
): string {
    if (host === undefined) return "";
    const site = `https://${host}`;
    const url = (l: Lang | "auto") =>
        l === "auto" ? `${site}/` : `${site}/${l}`;
    const alternates = strings.LANGS.map(
        (l) =>
            `\n        <link rel="alternate" hreflang="${l}" href="${url(l)}" />`,
    ).join("");
    return `
        <link rel="canonical" href="${url(at)}" />${alternates}
        <link rel="alternate" hreflang="x-default" href="${url("auto")}" />

        <!-- Link previews in chats and social networks. -->
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url(at)}" />
        <meta property="og:site_name" content="${host}" />
        <meta property="og:title" content="${attr(t.ogTitle)}" />
        <meta property="og:description" content="${attr(t.ogDescription)}" />
        <meta property="og:locale" content="${t.ogLocale}" />
        <meta property="og:image" content="${site}/og-image-${lang}.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="${attr(t.ogImageAlt)}" />
        <meta name="twitter:card" content="summary_large_image" />`;
}

/**
 * The page in `lang`. `at` is which address it is served at: its own
 * language's, or `auto` for `/`. `host` is the operator file's; without
 * one, as on the kiosk, it is undefined.
 */
export function nearbyPage(
    lang: Lang,
    at: Lang | "auto",
    host: string | undefined,
): string {
    const t = strings.forLang(lang).page;
    return `<!doctype html>
<html lang="${lang}">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${t.title}</title>
        <meta name="description" content="${attr(t.description)}" />${siteLinks(lang, t, at, host)}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />

        <!-- Add to Home Screen. An app installed from here opens /${lang}. -->
        <link rel="manifest" href="/${lang}.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="${attr(t.appShortName)}" />
        <meta name="theme-color" content="${THEME_COLOUR}" />

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

/**
 * The web app manifest for `lang`, which makes the site installable ("Add
 * to Home Screen"). There is no service worker: browsers no longer need
 * one to install a site, and it would store files in the browser, which
 * the privacy notice says the site doesn't do.
 */
export function manifest(lang: Lang): string {
    const t = strings.forLang(lang).page;
    return JSON.stringify(
        {
            name: t.appName,
            short_name: t.appShortName,
            description: t.ogDescription,
            lang,
            // Opens in the language it was installed in; the location is
            // asked for as on the site.
            start_url: `/${lang}`,
            id: `/${lang}`,
            scope: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: THEME_COLOUR,
            icons: [
                { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
                { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
                {
                    src: "/icon-maskable-512.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "maskable",
                },
            ],
        },
        null,
        2,
    );
}
