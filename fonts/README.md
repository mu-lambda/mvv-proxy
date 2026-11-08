# Fonts

Two fonts with two different jobs.

- **librefranklin/** — Libre Franklin (SIL Open Font License), the interface
  font: the header, the departure table, everything you read. It is the
  variable font `LibreFranklin[wght].ttf` from the Google Fonts repository,
  renamed, and covers every weight. `www`, `mvv-routes` and `fritz-status` in
  the pi-kiosk repository serve the same file, so the tabs of the kiosk read
  as one display rather than as separate pages. Public Sans was derived from
  it; unlike Public Sans it covers Cyrillic.
- **publicsans/** — Public Sans (SIL Open Font License), kept for one job
  only: `//tools:gen-stop-signs` outlines the numerals of the Bussteig/Gleis
  signs from its ExtraBold face (weight 800, see `publicsans.css` for the
  hashed-filename to weight mapping). Those signs imitate real MVV signage and
  want that heavy stroke, and the generator reads one static weight from a
  plain font file. Nothing in the UI loads it any more.
