/**
 * All of the nearby page's text, in German, English and Russian: what the
 * server writes into its HTML (server/src/page.ts) and what the client
 * shows (client/src/index.tsx). Add new text here in every language.
 * German speaks to the visitor as "du", Russian as "вы". Line and stop
 * names stay German, and so do U-Bahn and S-Bahn.
 *
 * The server picks the language and writes it into `<html lang>`; the
 * client reads it back from there with `langOf`.
 */

export type Lang = "de" | "en" | "ru";

/** Every language, English first: it is the one for browsers that prefer none. */
export const LANGS: readonly Lang[] = ["en", "de", "ru"];

/** The page's HTML head: title, description and link previews. */
export type PageText = {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogLocale: string;
    ogImageAlt: string;
    /** The installed app's name, and the shorter one under its icon. */
    appName: string;
    appShortName: string;
};

export type Strings = {
    page: PageText;

    /** The header before a location is known. */
    title: string;
    /** "MVV Departures around [you] at 17:28", with "you" a map link. */
    header: { before: string; link: string; at: string };
    notOfficial: string;
    legalNotice: string;
    privacy: string;
    donateAlt: string;
    /** PayPal's donate button image, in this language. */
    donateImage: string;

    introHeading: string;
    introText: string;
    introButton: string;
    introLocation: string;

    loading: string;
    fetching: (stops: number) => string;
    noStops: (metres: number) => string;
    /** Within the request's limit, or at all if it has none. */
    noDepartures: (minutes: number | undefined) => string;

    geolocationFailed: string;
    stopsFailed: (reason: string) => string;
    tryAgain: string;
};

const en: Strings = {
    page: {
        title: "MVV Departures nearby",
        description:
            "Every departure from the stops around you in Munich: U-Bahn, " +
            "S-Bahn, tram and bus, in one list. No app, no account, no " +
            "cookies.",
        ogTitle: "MVV Departures nearby",
        ogDescription:
            "Every departure around you in Munich, in one list. No app, no " +
            "account, no cookies.",
        ogLocale: "en_GB",
        ogImageAlt:
            "Departures around Marienplatz: tram 21, bus 52 and U6, each " +
            "with its stop, distance and time.",
        appName: "MVV Departures nearby",
        appShortName: "Departures",
    },

    title: "MVV Departures",
    header: { before: "MVV Departures around ", link: "you", at: " at " },
    notOfficial: "Not an official service of MVV",
    legalNotice: "Legal notice",
    privacy: "Privacy",
    donateAlt: "Donate with PayPal",
    donateImage: "/paypal-donate.gif",

    introHeading: "Every departure around you",
    introText:
        "U-Bahn, S-Bahn, tram and bus from all the stops within a few " +
        "minutes' walk, in one list.",
    introButton: "Show departures near me",
    introLocation:
        "Your browser will ask for your location. It is only used to find " +
        "the stops near you.",

    loading: "Loading...",
    fetching: (n) =>
        `Fetching departures from ${n} ${n === 1 ? "stop" : "stops"}`,
    noStops: (m) => `No stops within ${m} m from here`,
    noDepartures: (min) =>
        min === undefined
            ? "No departures"
            : `No departures within ${min} minutes`,

    geolocationFailed: "Geolocation failed",
    stopsFailed: (reason) => `Fetching stops nearby failed: ${reason}`,
    tryAgain: "Try again",
};

const de: Strings = {
    page: {
        title: "Abfahrten in der Nähe – MVV",
        description:
            "Alle Abfahrten an den Haltestellen in deiner Nähe in München: " +
            "U-Bahn, S-Bahn, Tram und Bus, in einer Liste. Ohne App, ohne " +
            "Konto, ohne Cookies.",
        ogTitle: "MVV-Abfahrten in deiner Nähe",
        ogDescription:
            "Alle Abfahrten in deiner Nähe in München, in einer Liste. Ohne " +
            "App, ohne Konto, ohne Cookies.",
        ogLocale: "de_DE",
        ogImageAlt:
            "Abfahrten am Marienplatz: Tram 21, Bus 52 und U6, jeweils mit " +
            "Haltestelle, Entfernung und Uhrzeit.",
        appName: "MVV-Abfahrten in deiner Nähe",
        appShortName: "Abfahrten",
    },

    title: "MVV-Abfahrten",
    header: { before: "MVV-Abfahrten in ", link: "deiner Nähe", at: " um " },
    notOfficial: "Kein offizielles Angebot des MVV",
    legalNotice: "Impressum",
    privacy: "Datenschutz",
    donateAlt: "Mit PayPal spenden",
    donateImage: "/paypal-donate-de.gif",

    introHeading: "Alle Abfahrten in deiner Nähe",
    introText:
        "U-Bahn, S-Bahn, Tram und Bus von allen Haltestellen in wenigen " +
        "Gehminuten, in einer Liste.",
    introButton: "Abfahrten in meiner Nähe",
    introLocation:
        "Dein Browser fragt gleich nach deinem Standort. Er wird nur " +
        "verwendet, um die Haltestellen in deiner Nähe zu finden.",

    loading: "Lädt …",
    fetching: (n) =>
        `Abfahrten von ${n} ${n === 1 ? "Haltestelle" : "Haltestellen"} ` +
        `werden geladen`,
    noStops: (m) => `Keine Haltestelle im Umkreis von ${m} m`,
    noDepartures: (min) =>
        min === undefined
            ? "Keine Abfahrten"
            : `Keine Abfahrten in den nächsten ${min} Minuten`,

    geolocationFailed: "Standort nicht verfügbar",
    stopsFailed: (reason) =>
        `Haltestellen konnten nicht geladen werden: ${reason}`,
    tryAgain: "Bitte noch einmal versuchen",
};

/**
 * The Russian noun after a number, by its plural rule: `one` for 1, 21,
 * 31…, `few` for 2–4, 22–24…, `many` for the rest, 11–14 included.
 */
function ruPlural(n: number, one: string, few: string, many: string): string {
    const tens = n % 100;
    const ones = n % 10;
    if (tens >= 11 && tens <= 14) return many;
    if (ones === 1) return one;
    if (ones >= 2 && ones <= 4) return few;
    return many;
}

const ru: Strings = {
    page: {
        // The site's Russian name, in every title.
        title: "MVV: Что Где Куда",
        description:
            "Все отправления с остановок рядом с вами в Мюнхене: U-Bahn, " +
            "S-Bahn, трамвай и автобус, одним списком. Без приложения, без " +
            "регистрации, без cookies.",
        ogTitle: "MVV: Что Где Куда",
        ogDescription:
            "Все отправления рядом с вами в Мюнхене, одним списком. Без " +
            "приложения, без регистрации, без cookies.",
        ogLocale: "ru_RU",
        ogImageAlt:
            "Отправления у Мариенплац: трамвай 21, автобус 52 и U6, у " +
            "каждого остановка, расстояние и время.",
        appName: "MVV: Что Где Куда",
        appShortName: "Что Где Куда",
    },

    title: "MVV: Что Где Куда",
    // "MVV: Что Где Куда [рядом с вами] в 13:05"
    header: { before: "MVV: Что Где Куда ", link: "рядом с вами", at: " в " },
    notOfficial: "Неофициальный сервис, не от MVV",
    // The pages themselves are in German and English.
    legalNotice: "Impressum",
    privacy: "Конфиденциальность",
    donateAlt: "Пожертвовать через PayPal",
    // PayPal's button in English: there is no Russian one here.
    donateImage: "/paypal-donate.gif",

    introHeading: "Все отправления рядом с вами",
    introText:
        "U-Bahn, S-Bahn, трамвай и автобус со всех остановок в нескольких " +
        "минутах ходьбы, одним списком.",
    introButton: "Показать отправления рядом",
    introLocation:
        "Браузер спросит ваше местоположение. Оно нужно только для того, " +
        "чтобы найти ближайшие остановки.",

    loading: "Загрузка…",
    // "с 1 остановки", "с 2 остановок", "с 21 остановки"
    fetching: (n) =>
        `Загружаем отправления с ${n} ` +
        ruPlural(n, "остановки", "остановок", "остановок"),
    noStops: (m) => `В радиусе ${m} м нет остановок`,
    // "мин" needs no plural.
    noDepartures: (min) =>
        min === undefined
            ? "Нет отправлений"
            : `Нет отправлений в ближайшие ${min} мин`,

    geolocationFailed: "Не удалось определить местоположение",
    stopsFailed: (reason) => `Не удалось загрузить остановки: ${reason}`,
    tryAgain: "Попробуйте ещё раз",
};

/**
 * The language for `/`, from the Accept-Language header's choice among
 * them (Express's `req.acceptsLanguages(...LANGS)`). English when the
 * browser prefers none of them.
 */
export function pickLang(accepted: string | false): Lang {
    return LANGS.find((l) => l === accepted) ?? "en";
}

/** The language `<html lang>` names; English unless it is another of ours. */
export function langOf(htmlLang: string): Lang {
    const tag = htmlLang.toLowerCase();
    return LANGS.find((l) => tag === l || tag.startsWith(`${l}-`)) ?? "en";
}

const STRINGS: Record<Lang, Strings> = { de, en, ru };

export function forLang(lang: Lang): Strings {
    return STRINGS[lang];
}
