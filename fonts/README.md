# Fonts

Two fonts with two different jobs.

- **ptsans/** — PT Sans (SIL Open Font License), the interface font: the
  header, the departure table, everything you read. `www` and `mvv-routes` in
  the pi-kiosk repository serve the same two files, so the tabs of the kiosk
  read as one display rather than as separate pages. Only weights 400 and 700
  are shipped, which is all this UI asks for.
- **publicsans/** — Public Sans (SIL Open Font License), kept for one job
  only: `//tools:gen-stop-signs` outlines the numerals of the Bussteig/Gleis
  signs from its ExtraBold face (weight 800, see `publicsans.css` for the
  hashed-filename to weight mapping). Those signs imitate real MVV signage and
  want that heavy stroke; PT Sans has nothing above 700. Nothing in the UI
  loads it any more.
