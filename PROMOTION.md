# Making mvv.mulambda.de better known

A plan for making the public site more useful and better known. Tick items
as they are done, and note anything decided along the way next to them.

## What the site is, and stays

- One simple view: every departure from the stops near you.
- No configuration needed. That is its main advantage.
- No login, no cookies. The only permission or consent it asks for is the
  visitor's location.

Every change below has to fit these.

## Before promoting it

- [x] **Impressum.** A public German site with a donate button very likely
      needs one (§5 DDG), and a missing one is a common reason for an
      Abmahnung. (Our reading, not legal advice.) `/impressum`, in German
      with English, linked from the page's header.
- [x] **Privacy notice** (`/datenschutz`). The site processes the visitor's
      location and IP address, so GDPR asks for one: what is processed and
      by whom (this server, Cloudflare, and MVV, since the browser fetches
      departures from MVV directly), and that only rounded locations are
      kept, in the logs. German with English, linked from the header.
    - [x] Put the operator file on the public server and set
          `MVV_PROXY_OPERATOR_FILE`; until then both pages are 404.
    - [x] Make the public server delete its logs after 14 days, as the
          notice says.
    - [x] Check that nothing in front of the server (a reverse proxy, the
          host's own logs) keeps IP addresses, as the notice says it
          doesn't.
    - [ ] Check that Cloudflare's data processing addendum covers its part.
          As far as we know it is part of Cloudflare's terms on every plan,
          so there is nothing to sign.
- [x] **Host the PayPal button image ourselves.** It loaded from
      `paypalobjects.com`, so every visit told PayPal the visitor's IP
      address. It was the page's only third-party request; now the page
      loads only from this site and MVV, so "no tracking, no third parties"
      is true and can be advertised. (`www/paypal-donate.gif`)
- [ ] **Consider writing to MVV before a big push.** More visitors means
      more traffic on MVV's unofficial departures interface, and the name
      and icons are MVV's. The load comes from visitors' browsers, so no
      single address gets blocked, but MVV could stop allowing cross-origin
      requests and the site would stop working. Better they hear of it from
      us. Keep the "Not an official service of MVV" note.

## Changes to the site

Ranked by effect for effort.

- [x] **Let a link look like something.** The page had no `<title>`, no
      description, no language and no favicon, so search results, tabs and
      bookmarks showed a bare URL, and links shared in chats showed no
      preview.
    - [x] `<title>`: "Abfahrten in der Nähe – MVV Departures nearby"
    - [x] meta description, in English with one German sentence until the
          site speaks German
    - [x] `lang="en"` on `<html>`; changes with the German item below
    - [x] favicon: a German bus-stop sign, green H on yellow
          (`favicon.svg`, and `favicon.ico` for browsers that ask for it)
    - [x] Open Graph tags, with `og-image.png`: departures at Marienplatz.
          Retake it after a visible change to the page.
    - [x] viewport meta tag. The header's padding is now in `vw` too, so
          phones show the same layout as before; the donate button is now
          big enough to tap.
    - [x] canonical link, since `?lat=…&long=…` links show the same page
- [ ] **A sentence before the location prompt.** Say what the site does
      before the browser asks for the location, e.g. "Every departure around
      you, U-Bahn, S-Bahn, tram and bus, in one list. No app, no account, no
      cookies." It helps visitors decide and gives search engines text.
- [ ] **German.** Most people in Munich search in German ("Abfahrten in der
      Nähe", "Abfahrtsmonitor München"). Pick the language from
      `navigator.language`: no setting, no cookie.
- [ ] **Add to Home Screen.** A web app manifest and icons make the site
      installable. The browser remembers the location permission, so the
      installed site shows departures straight away: one tap.
- [ ] **Refresh by itself.** Today the page only updates when reload is
      pressed. Refresh every 30 to 60 seconds while the page is visible.
      This adds load on MVV.
- [ ] **"Departures from here" links and QR codes.** The page already takes
      `?lat=…&long=…`. Make it easy to get such a link, for cafés, hostels,
      hotels, coworking spaces and offices: a QR code at the door, or a
      tablet showing the page.

## Promotion

- [ ] r/Munich (English, expats)
- [ ] r/muenchen (German)
- [ ] Toytown Germany
- [ ] Expat groups: Facebook, InterNations
- [ ] Mastodon: muenchen.social, #München #MVV
- [ ] TUM and LMU student councils (Fachschaften): newsletters and channels
- [ ] Hacker News "Show HN"
- [ ] Local press and blogs: Mucbook, Abendzeitung, tz
- [ ] QR codes with a "Departures from here" link for a few cafés or
      hostels near busy stops

Post when people need the site most: Stammstrecke closures and weekends
with replacement buses (SEV icons now look right), strikes, Oktoberfest,
Christmas markets.

## Measuring, without tracking

No analytics on the page. Instead:

- Cloudflare's dashboard: requests per day.
- The server log: `stops nearby:` lines per day are uses, and their rounded
  locations show roughly where the site is used.
