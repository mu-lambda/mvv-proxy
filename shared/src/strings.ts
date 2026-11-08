/**
 * All of the nearby page's text, in German and English: what the server
 * writes into its HTML (server/src/page.ts) and what the client shows
 * (client/src/index.tsx). Add new text here in both languages. German
 * speaks to the visitor as "du".
 *
 * The server picks the language and writes it into `<html lang>`; the
 * client reads it back from there with `langOf`.
 */

export type Lang = "de" | "en";

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
 * The language for `/`, from the Accept-Language header's choice between
 * the two (Express's `req.acceptsLanguages("en", "de")`). English when the
 * browser prefers neither.
 */
export function pickLang(accepted: string | false): Lang {
    return accepted === "de" ? "de" : "en";
}

/** The language `<html lang>` names; English unless it is German. */
export function langOf(htmlLang: string): Lang {
    return htmlLang.toLowerCase().startsWith("de") ? "de" : "en";
}

export function forLang(lang: Lang): Strings {
    return lang === "de" ? de : en;
}
