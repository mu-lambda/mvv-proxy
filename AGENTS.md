# Notes for agents working on mvv-proxy

mvv-proxy serves Munich (MVV) departure boards. The server fetches departures
from mvv-muenchen.de, optionally through a SOCKS proxy, and serves them to a
browser client. It runs on a Raspberry Pi kiosk (see the pi-kiosk repository,
which checks this one out under `projects/mvv-proxy`) and can also ship as a
container image.

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
  `//:gen_stop_signs`.
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
- Check `pnpm audit` after dependency changes.
- `node-fetch` 2 looks old but stays: Node's built-in `fetch` does not accept
  the `SocksProxyAgent` the proxy needs.
- Express is version 5. Routes use path-to-regexp 8 syntax, so a wildcard
  needs a name (`/svg/*filename`). The `listen` callback also receives
  errors, so check its argument.

## Node and modules

- The Node toolchain is pinned in `MODULE.bazel` (26.13.0, with archives and
  checksums because rules_nodejs predates it). Keep it equal to
  `NODE_VERSION` in pi-kiosk's `services/mvv-proxy.sh`, which is what the Pi
  runs.
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
  `tsconfig.json` and only sets `rootDir` back to `./src`. Put compiler
  options in `tsconfig.json`.
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
  `SOCKS_PROXY`. Paths such as `../www/` and `./data/stops.csv` are relative
  to the working directory, which must be `server/`. The Bazel targets
  `chdir` there.
- On the Pi, `services/mvv-proxy.sh` runs `node out/main.js` from
  `bazel-bin/server`, after `update-projects.sh` builds
  `//server:server_bin`.
- The SOCKS proxy URL contains credentials. Never print it, and keep it out
  of logs; the service script turns off xtrace around it.
- MVV works without the proxy, so you can test live by leaving `SOCKS_PROXY`
  unset. Use public stops: `/api/v1/stopsNearby` at Marienplatz
  (`lat=48.13743&long=11.57549&d=400`) returns a `request` you can save as a
  request file to drive `/api/v1/timetable`. Don't use the owner's own
  request file or home stops in tests or fixtures.
- `server.ts` sets Express's `env` to `production`, so error pages carry no
  stack trace however the server was started. The stack still goes to the
  log.
- `ProxyFetcher` retries lost connections and 5xx replies (4 tries), but not
  4xx: a refusal will be the same next time. `MVVRequestFailure.status`
  carries the HTTP status.
- `/svg/*filename` proxies MVV's line icons. It caches icons it got, and
  remembers icons MVV answered 4xx for until restart.

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
- The owner tests on the Pi before calling a change done. Say what you could
  not test locally: the proxy, the image, the browser.

## Known loose ends

- When a timetable update fails, `timetable.tsx` switches to its error state
  until the next successful update. That is intended: the owner prefers a
  visible error to stale departures.
