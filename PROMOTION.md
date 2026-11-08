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

- [ ] **Impressum.** A public German site with a donate button very likely
      needs one (§5 DDG), and a missing one is a common reason for an
      Abmahnung. Needs the name and address to show. `/impressum` is a 404
      today. (Our reading, not legal advice.)
- [ ] **Privacy notice** (`/datenschutz`). The site processes the visitor's
      location and IP address, so GDPR asks for one. Short is fine: what is
      processed and by whom (this server, Cloudflare, and MVV, since the
      browser fetches departures from MVV directly), and that only rounded
      locations are kept, in the logs.
- [ ] **Host the PayPal button image ourselves.** It loads from
      `paypalobjects.com`, so every visit tells PayPal the visitor's IP
      address. It is the page's only third-party request; without it, "no
      tracking, no third parties" is true and can be advertised.
- [ ] **Consider writing to MVV before a big push.** More visitors means
      more traffic on MVV's unofficial departures interface, and the name
      and icons are MVV's. The load comes from visitors' browsers, so no
      single address gets blocked, but MVV could stop allowing cross-origin
      requests and the site would stop working. Better they hear of it from
      us. Keep the "Not an official service of MVV" note.

## Changes to the site

Ranked by effect for effort.

- [ ] **Let a link look like something.** The page has no `<title>`, no
      description, no language and no favicon, so search results, tabs and
      bookmarks show a bare URL, and links shared in chats show no preview.
    - [ ] `<title>`, e.g. "Abfahrten in der Nähe – MVV Departures nearby"
    - [ ] meta description
    - [ ] `lang` on `<html>`
    - [ ] favicon
    - [ ] Open Graph tags with a screenshot, for link previews
    - [ ] viewport meta tag. The layout already scales (the CSS uses `vw`),
          but without it Google treats the page as not mobile-friendly.
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
