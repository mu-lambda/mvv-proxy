# Line icons MVV doesn't have

MVV names an icon for every line (`line.symbol` in departures and in
`available_lines`, e.g. `02019.svg`), and the server proxies it from
`https://www.mvv-muenchen.de/fileadmin/lines/` at `/svg/<file>`. For about one
line in eight, MVV doesn't have the file. The client then shows the line's
name as text, cut to three letters when it is longer than five (`SEV S6`
becomes `SEV...`).

This file records which icons are missing and what we serve instead. The
decisions are settled; the implementation is still to do.

![Sample icons, with some of MVV's own for comparison](docs/icons/preview.png)

The samples are in `docs/icons/`. The top row is MVV's own icons.

## Survey

On 2026-11-07 we fetched `available_lines` for 1,487 of the 11,062 stops in
`server/data/stops.csv` (denser in Munich and Landkreis München), and checked
every icon they name. 420 distinct lines, 53 icons missing. Departures at 137
of those stops (4,503 departures) name the same icons as `available_lines`,
and no lines that it doesn't list.

## MVV's template

Every MVV icon is the same SVG: `viewBox="0 0 1000 500"`, a coloured
rectangle (a rounded pill for the S-Bahn), and the line's number centred in
bold Arial at 425px. Ours use the same template.

| Family | Background | Text |
| --- | --- | --- |
| Bus, regional bus, StadtBus, FLEXlinie | `#005262` | white |
| Express bus (X…) | `#4d9380` | white |
| HEX, Lufthansa Express | `#646464` | white |
| MetroBus | `#ec6726` | white |
| Night bus and night tram (MVG) | `#1d1d1b` | `#fbba00` |
| Regional night bus | `#f7a600` | white |
| Tram, U-Bahn, S-Bahn | one colour per line | white |

Tram 28 is drawn as an outline: an orange frame, orange number and no fill.

## What we serve

The SEV colour is `#992168`, the purple of the
[Ersatzverkehr sign](https://upload.wikimedia.org/wikipedia/commons/8/89/Schienenersatzverkehr_214544-288243.jpg).
An SEV icon is an outline in that colour with the line's name without "SEV"
(`SEV S6` shows `S6`). Like MVV's tram 28, it has no fill, so the row colour
shows through.

| # | Class | Examples (MVV's file) | We serve |
| --- | --- | --- | --- |
| 1 | S-Bahn under its new line code | S1–S8 (`920S1`–`920S8`) | MVV's icon under the old code, `92M01`–`92M08`. `getFallback` does this today; its pattern should be `^920S\d`. |
| 2 | MVG express buses | X30, X35, X36, X80 (`20X30`…) | MVV's icon at `03X30`…, the right colour and label. |
| 3 | Regional express buses | X205, X206, X208, X730 (`20205`…) | Generated: `#4d9380`, label `X208`. MVV's `19208` is the plain regional bus (`208`, dark teal), so the client's `20208 → 19208` hack goes. |
| 4 | SEV for S-Bahn and DB regional trains | SEV S2, S6, S8 (`870S2`…), SEV RB6, RB65, RB67 (`87A03`, `87RB6`) | Generated SEV outline: `S6`, `RB65`. RB65 and RB67 share `87RB6.svg`, so the label must come from the line, not the file. |
| 5 | SEV for MVG lines | Tram 21, 25 (`345nn`), U3 (`35503`), N19 (`36719`), X6 (`35596`) | Generated SEV outline. MVV gives the replaced line's name (`U3`), so the label is the name as it is. |
| 6 | New or temporary MVG lines | Tram 14 (`02014`), bus O7 (`03407`) | Generated: tram 14 as a black (`#000000`) outline without fill, like MVV's tram 28; bus O7 `#005262`. |
| 7 | Regional on-demand and town buses | FLEXlinie 2100, 5010… (`16xxx`), AST 8150… (`lvg:`), StadtBus 724 Dachau (`65724`) | Generated: `#005262`. |
| 8 | Operators outside MVV | Allgäu (`rva:`), Oberbayern (`rvo:`), Inn (`mul:`), Tyrol (`vvt:`, the Innsbruck S6 `92AS6`), Regensburg (`gfn:`) | Generated: `#646464`. |
| 9 | MVV's own wrong icon | Bus 438 (`12438.svg` reads `9441`) | Generated in place of MVV's: `#005262`, `438`. |

Class 2 needs no drawing, so it stays as the rename above.

## How the server does it

The server keeps `/svg/<file>`, the generation option the owner chose:

1. Overrides first. A short list of MVV files we replace even though they
   exist (`12438.svg`).
2. MVV's file, as now.
3. Renames, when MVV has no such file: `920S<n>` → `92M0<n>`,
   `20X<nn>` → `03X<nn>`.
4. Otherwise draw an icon. The client passes the line's name and product as
   query parameters, because the file name alone can't say what to draw (see
   classes 4 and 5). That means `Departure.line` gains the product: MVV sends
   it in every departure as `line.name` (`SEV`, `Ersatzverkehr`,
   `ExpressBus`, `Tram`, `FLEXlinie`, `AST`…), and `queryDepartures.ts`
   currently drops it.

Choosing the drawing, from the product and the operator (the first part of
`line.stateless`):

- `SEV` or `Ersatzverkehr`: SEV outline, label without a leading `SEV `.
- Operator not `ddb`, `swm`, `mvv` or `lvg`: grey.
- `ExpressBus`: `#4d9380`.
- `Tram`: black outline.
- Any other bus product: `#005262`.

Labels keep MVV's 425px when they fit, and shrink when they don't
(`RB65` inside an outline, `5680`). Outlines are MVV's tram 28 frame: a
50-unit stroke inset by 25, no fill, the label in the stroke colour.

## Not decided

- A tram MVV has no icon for, other than 14. The rule above would draw it
  as a black outline too.
- Night lines without an icon. None were missing in the survey.
