# Notes for agents working on mvv-proxy

mvv-proxy serves Munich (MVV) departure boards. The server fetches departures
from mvv-muenchen.de, optionally through a SOCKS proxy, and serves them to a
browser client. It runs on a Raspberry Pi kiosk (see the pi-kiosk repository,
which checks this one out under `projects/mvv-proxy`) and can also ship as a
container image.

`docs/OVERVIEW.md` describes the architecture for people. These notes are
the details for working on the code; when a change alters the architecture,
update both.

## Layout

- `server/`: the Express server (`src/main.ts` is the entry point) and the
  `mvv-proxy` library that `tests/` imports (`src/index.ts`).
- `shared/`: code used by both server and client: departure queries
  (`queryDepartures.ts`), the fetcher interface, request and response types,
  and the small test harness (`testing.ts`).
- `client/`: React pages, bundled by esbuild into `index_bundle` (nearby
  stops, from the browser's location) and `timetable_bundle` (the kiosk's
  configured stops).
- `tests/`: departure tests against recorded MVV responses in
  `tests/data/qtest/`, plus `record_departures` for recording new ones.
- `tools/gen-stop-signs.ts`: build-time generator for the platform and
  bus-stop sign SVGs (`Bussteig-N.svg`, `Gleis-N.svg`), run by `//www`.
- `www/`, `fonts/`: static files served next to the API.

## Building and testing

- Everything goes through Bazel (`.bazelversion` pins it).
  `bazel build //...` and `bazel test //...` cover the whole repository.
- `./pre-commit.sh` runs prettier on staged files, then the full build and
  tests. Run it before handing over a commit.
- Runnable targets: `//server:server_bin`, `//tests:record_departures`,
  `//:gen_stop_signs`, `//server:icon_samples` (redraws `docs/icons`).
- Tests use the harness in `shared/src/testing.ts`. A test file runs its
  suite and must set `process.exitCode = 1` on failure, or a failing test
  counts as a pass.
- `tests:query_departures_test` pins `TZ=Europe/Berlin`, because the
  midnight logic depends on local time.
- Tests that start a local HTTP server must close it even when an
  assertion fails (`try`/`finally`, plus `closeAllConnections()`).
  Otherwise the test hangs until Bazel's timeout.

## Dependencies and lockfiles

- `.bazelrc` sets `--lockfile_mode=error`. After changing any
  `package.json`, run `pnpm install`, then
  `bazel mod deps --lockfile_mode=update`.
- pnpm rewrites `pnpm-lock.yaml` with 2-space indentation. The repository
  keeps prettier's 4-space format, so run `npx prettier -w pnpm-lock.yaml`
  afterwards. Otherwise the diff is the whole file.
- pnpm settings go in `pnpm-workspace.yaml`; pnpm no longer reads them from
  `.npmrc`. `hoist: false` keeps each package to what it declares, as under
  Bazel, so a missing dependency fails locally too.
- Check `pnpm audit` after dependency changes. If it finds something that
  needs an override, put it under `overrides:` in `pnpm-workspace.yaml`, and
  remove it once a fresh resolve no longer needs it.
- `node-fetch` 2 looks old but stays: Node's built-in `fetch` does not accept
  the `SocksProxyAgent` the proxy needs.
- Express is version 5. Routes use path-to-regexp 8 syntax, so a wildcard
  needs a name (`/svg/*filename`). The `listen` callback also receives
  errors, so check its argument.

## Node and modules

- The Node toolchain is pinned in `MODULE.bazel` (26.13.0, with archives and
  checksums because rules_nodejs predates it). The Pi runs this Node too,
  through `//server:server_bin` (see Running the server). pi-kiosk pins its
  own in its `MODULE.bazel`; keep the two equal.
- Every package is an ES module (`"type": "module"`, `module: nodenext`).
  Import local files as `./foo.ts` or `./foo.tsx`, never `./foo.js` and never
  without an extension; `rewriteRelativeImportExtensions` turns them into
  `.js` in the output.
- With `nodenext`, `tsc` reads `"type"` from `package.json`, so each
  `ts_config` lists `package.json` in `deps`. Node also reads it at runtime,
  so binaries and tests list `package.json` in `data`. Without these, output
  quietly becomes CommonJS, or Node falls back to guessing.
- `server/` has `verbatimModuleSyntax`: types must be imported with
  `import type`, because Node can run `src/` directly.
- TypeScript is 7 (the native compiler); rules_ts takes its version from the
  root `package.json` and fetches the per-platform compiler package. TS 7
  loads no `@types` packages unless they are listed, so tsconfigs that need
  Node list `"types": ["node"]`.
- `server`, `client` and `tests` map `shared` (and `mvv-proxy`) to their
  sources in `tsconfig.json` for editors, which needs `rootDir: ".."`. Bazel
  rejects that, so it builds with `tsconfig.bazel.json`, which extends
  `tsconfig.json` and sets `rootDir` back to `./src`. Put compiler options
  in `tsconfig.json`.
- `server/src` is split into `ts_project`s by what uses the files:
  `server_tsc` (the server and the `index.ts` that `//tests` imports),
  `tests_tsc` and `icon_samples_tsc`. The image holds only `server_tsc`, so
  a test or a tool neither ships in it nor changes it. Add a new file to
  the `*_SRCS` list of the part that uses it, a test to `TEST_SRCS`; the
  build fails on a file in none of them. A part imports `server_tsc`'s
  output: for that, `server/tsconfig.bazel.json` adds `out` to `rootDirs`.
- CommonJS libraries: a library that compiles fine can still fail at
  runtime. `opentype.js` needs a default import; `import * as` compiled but
  failed with `opentype.parse is not a function`. Run the real entry point
  after changing an import, not just `tsc`.
- `__dirname` does not exist; use `import.meta.dirname`.
- To run from source: `npx tsc` in `shared/` first (`shared` resolves to its
  compiled `out/`), then `node src/main.ts` in `server/`, or use the `dev`
  script.

## Running the server

- Environment: `MVV_PROXY_PORT` (default 3000), `MVV_PROXY_STOPS_FILE`,
  `MVV_PROXY_REQUEST_FILE` (the kiosk's stops for `/api/v1/timetable`),
  `MVV_PROXY_OPERATOR_FILE` (who runs the site, for `/impressum` and
  `/datenschutz`, and the host the site is public at), `SOCKS_PROXY`.
  Paths such as `../www/` and `./data/stops.csv` are relative to the
  working directory, which must be `server/`. The Bazel targets `chdir`
  there.
- On the Pi, pi-kiosk's `services/mvv-proxy.sh` runs the `server_bin`
  launcher (`bazel-bin/server/server_bin_/server_bin`) from its runfiles
  tree, as `bazel run` does, after `update-projects.sh` builds
  `//server:server_bin`. The launcher brings Bazel's Node and changes into
  `server/` itself, so a file the server reads at runtime must be in the
  binary's `data`.
- The SOCKS proxy URL contains credentials. Never print it, and keep it out
  of logs; the service script turns off xtrace around it.
- MVV works without the proxy, so you can test live by leaving `SOCKS_PROXY`
  unset. Use public stops: `/api/v1/stopsNearby` at Marienplatz
  (`lat=48.13743&long=11.57549&d=400`) returns a `request` you can save as a
  request file to drive `/api/v1/timetable`. Don't use the owner's own
  request file or home stops in tests or fixtures.
- `/api/v1/stopsNearby` gets the visitor's location. Log it rounded to two
  decimals (about 1 km) at most, never in full.
- `/api/v1/stopsNearby` takes `d` (metres, default 500) and `minutes`
  (of departures, default `NEARBY_MINUTES`, 30); the nearby page
  passes `?d=` and `?minutes=` through from its own address. Walking time is
  the straight-line distance at `WALKING_METRES_PER_MINUTE` (60: slow for
  walking, but real routes are longer than the straight line). Departures
  are asked for from when you'd arrive, so a stop further than `minutes`
  minutes' walk can't show anything; the server leaves those out, which
  also bounds how many stops the browser asks MVV about, whatever `d` is.
- With no stops to show, `/api/v1/stopsNearby` sets `outsideArea` if the
  place is outside the bounding box of all the stops in `stops.csv`
  (`Locator.covers`), and the page says it's outside the MVV area instead
  of "no stops within d m". The box is rough on purpose: stops.csv reaches
  past MVV, and the point is to answer Berlin or New York.
- `/impressum` and `/datenschutz` (`server/src/legal.ts`) are rendered from
  the operator file: name, address, email, hosting provider and host, in
  the format of `server/data/operator.example.yaml`. The real file lives on
  the public server, never in the repository. Without the variable both
  pages are 404, as on the kiosk; a broken file stops the server.
- The operator's `host` (`mvv.mulambda.de`, just the name) is what the
  legal pages call the site, and what the nearby page's canonical, hreflang
  and link preview tags point at (`page.ts`). Without an operator file the
  page has none of those tags. Tests use `mvv.example.org`, from the
  example file.
- The privacy notice describes what the site does. Update it with any
  change that sends visitor data somewhere new, logs personal data, or
  stores anything in the browser. It promises the server's logs are
  deleted after `LOG_DAYS` (14) days, so the public server's log rotation
  has to match.
- `server.ts` sets Express's `env` to `production`, so error pages carry no
  stack trace however the server was started. The stack still goes to the
  log.
- `ProxyFetcher` retries lost connections and 5xx replies (4 tries, or as
  many as its constructor says), but not 4xx: a refusal will be the same
  next time. `MVVRequestFailure.status`
  carries the HTTP status.
- A request names lines by the ids in `server/src/lines.ts` (`S6-i`). Each
  is a name and direction (`H` or `R`), not an MVV line id: those change
  every December and sometimes in between (S6 went from `92M06` to `920S6`
  within 2026). `Q` looks the ids up in MVV's `available_lines` for the
  stop, matching `number` and the `H`/`R` field, and keeps that list for
  24 hours. A named line MVV doesn't list at the stop is skipped and logged
  once per list.
- `/svg/*filename` serves MVV's line icons. mvv-proxy also runs on the
  internet (mvv.mulambda.de), so it asks MVV as little as it can, to avoid
  being rate-limited: it keeps MVV's answer for each icon (the icon, or 404
  or 410 for none) for a day, shares one request among clients asking at the
  same time, and refuses names that can't be MVV's (five capitals or digits
  plus `.svg`) without asking. Other 4xx, such as 429, are not kept, and
  their 404 says `no-store`: Cloudflare would cache it for 4 hours.
  Requests to MVV for icons also have a budget (1,500 at once, then about
  4,000 a day), run at most 8 at a time, and are tried once
  (`ICON_LIMITS`). For icons MVV lacks, it uses MVV's icon under another
  name, or draws one from the line the client passes as query parameters
  (`server/src/icons.ts`). `docs/MVV-ICONS.md` has the classes of missing
  icons and the decisions behind each drawing.
- Static files (`server/src/staticFiles.ts`) are hashed when the server
  starts. The hash is each file's ETag, because Express's own is the size
  and modification time, and the image's files are all dated 1970: a
  changed file of the same size would look unchanged. `StaticFiles.url`
  adds it as `?v=`, and with the right `v` a file is kept for a year
  (`immutable`). The nearby page links its script and styles that way,
  the font's stylesheet included; a file the page links must go through
  `url`, or it's rechecked on every load. So no `@import` in the CSS
  (`pre-commit.sh` refuses it): an imported file has no version, and the
  browser finds it only after its parent has loaded.
  Unversioned HTML, CSS and JavaScript say `no-cache`, pictures and fonts a
  day, and any 404 `no-store`. Cloudflare must pass these on as they are
  (Browser TTL "Respect origin TTL" in a Cache Rule for the host, or the
  zone's "Respect Existing Headers"); its default raises anything under 4
  hours to 4 hours.

## The nearby page

- The server writes its HTML (`server/src/page.ts`) in German, English or
  Russian: `/de`, `/en` and `/ru` fix the language, and `/` picks it from
  the browser's Accept-Language (whichever of the three it prefers,
  English if none), with `Vary: Accept-Language`. Cloudflare keeps a
  copy of the page but ignores `Vary`, so `/` is right only because the
  page says `max-age=0`: Cloudflare fetches it again for every visitor,
  and the server picks the language. Keep it at 0; with any longer,
  visitors to `/` get whichever language was fetched last. Each version
  links the others with `hreflang`, so search engines index each. There
  is no `www/index.html`. `strings.LANGS` lists the languages; the
  routes, manifests and `hreflang` links follow it.
- All of the page's text, the HTML head's and the client's, is in
  `shared/src/strings.ts`, with the language choice (`pickLang`, `langOf`).
  Add new text there in every language. The client takes the language
  from `<html lang>`. German speaks to the visitor as "du", Russian as
  "вы"; the legal pages use "Sie". Line and stop names, U-Bahn and S-Bahn
  stay German in every language. Russian counts with `ruPlural` (1, 2–4,
  5 and up, 11–14 like 5).
- The legal pages are German and English only, also from `/ru`; their
  German version is the one that applies. The Russian page uses the English
  PayPal button.
- The kiosk only loads `timetable.html`, which stays English.
- Link previews (WhatsApp, Telegram…) show `www/og-image-<lang>.png`, the
  page in its own language. They are screenshots of departures at
  Marienplatz (`/<lang>?lat=48.13743&long=11.57549`) at 600×315 CSS pixels
  and scale 2, so 1200×630, taken in headless Chrome over the DevTools
  protocol with the scrollbar hidden and the blinking of close departures
  (`.time-close`) turned off. Retake all of them after a visible change to
  the page, and when adding a language. Messengers cache previews by
  image address, so a new picture may need a new file name to show up.
- The site can be installed ("Add to Home Screen"): the server writes a
  manifest per language (`/de.webmanifest`, `/en.webmanifest`,
  `/ru.webmanifest`,
  `page.manifest`), whose names are in `strings.ts`. The icons are drawn in
  `www/app-icon.svg` (the favicon's bus-stop sign with a μλ badge, the
  letters as strokes so no font is needed) and made into PNGs by
  `www/make-app-icons.sh` (ImageMagick); commit the PNGs after a change.
  They are on white, since iOS fills transparent corners black. Don't add a service worker without changing the privacy
  notice: it would store files in the browser.
- While departures are fetched, `client/src/index.tsx` (state `fetching`)
  lists the stops it found, nearest first, each with a spinner that turns
  into a green check mark as soon as that stop is done.
  `getDeparturesForMultipleStops` reports each stop to its `onStopDone`
  callback by its index in the request. The timetable page has no such list.
- The owner's choices: a check mark, not a green dot; and the departure
  board replaces the list as soon as the last stop is in, without a pause
  on the finished list.
- A stop that fails still sends the whole page to its error state, so the
  list shows no failed stops.
- The list's styles are in `www/index.css`, which only this page loads.
  `loading.css` is shared with the timetable and loaded after
  `index.css`, so rules that change `.loader` need a second class to win.
- To see the list change in a browser, fetches have to be slower than they
  are: add a temporary delay to `WebFetcher.fetch`, and take it out again.

## Container image

- `//server:image` is built with rules_oci; `image_push` pushes it to
  `docker.io/mulambda/mvv-proxy`. The Node that runs comes from
  `js_image_layer`, not the base image, but the base needs `libatomic`,
  which is why it is `node:26-trixie-slim` and not plain Debian.
- The image sets `TZ=Europe/Berlin`; without it, departures around midnight
  go wrong.
- After module or packaging changes, check that `package.json` files are in
  the layers: `tar tzf bazel-bin/server/server_layer_app.tar.gz`. Running
  the image needs Docker, which may not be running.

## Working with the owner

- The owner commits. Prepare a commit by staging, running
  `./pre-commit.sh`, and writing the message to a file for
  `git commit -e -F <file>`; do not commit yourself.
- Prepare that commit unprompted whenever a change is finished, rather than
  asking whether to. The owner reviews it and asks for changes if needed.
- Sometimes the owner wants a pull request instead: prepare the commit the
  same way, but on a new branch off an up-to-date main. Still do not commit
  or push; the owner runs `make-pr.sh <message file>`, which commits
  (signed), pushes and opens the pull request. The script is the owner's,
  on their `PATH`, not in this repository. To address review comments,
  read them with `gh pr view --comments` (the line comments need
  `gh api repos/<owner>/<repo>/pulls/<n>/comments`), change the branch,
  and prepare another commit for the same script. This repository is
  public, so a pushed branch is published before anyone reviews it: check
  for keys and personal data before handing it over.
- `PROMOTION.md` is the plan for the public site. When a change does one
  of its items, tick the box in the same commit.
- The owner tests on the Pi before calling a change done. Say what you could
  not test locally: the proxy, the image, the browser.

## Known loose ends

- When a timetable update fails, `timetable.tsx` switches to its error state
  until the next successful update. That is intended: the owner prefers a
  visible error to stale departures.
- Line lookup trusts MVV to keep `H` and `R` the same way round. If MVV ever
  flips them, a stop shows the opposite direction and nothing is logged,
  because both directions are still listed.
- `minutes` has no upper bound, and the stops searched grow with its
  square. Each stop costs the visitor's browser two requests to MVV, all
  at once: at Marienplatz the default 30 minutes finds 88 stops, `minutes=60`
  266 (about 530 requests). One failed stop sends the page to its error
  state, and MVV may throttle the visitor. A cap on `minutes` would bound
  it, if that becomes a problem.
