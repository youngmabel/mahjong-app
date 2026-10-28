# MAHJONG: American Mah Jongg Learning App (Research Notes)

Research notes for a personal, non-commercial app for learning and practicing American (NMJL) mah jongg, solo against three computer opponents, using the 2026 NMJL card and a 152-tile set with no blanks.

**Start here:** to begin building, open a new chat and paste the prompt in `HANDOFF.md`.

## The app in one paragraph

A tutorial of short guided scenarios teaches the basics and what each piece is called (with a quick "why it's called that"). Then one to three guided practice matches coach the player through real games: suggesting target hands, keeping track of the rules, and teaching strategy. After that the player "graduates" to free play against generated games with only a cheat sheet of the winning hands.

## Files

| File | What it covers |
|---|---|
| `01-rules.md` | The complete NMJL rules the app must implement, with confidence levels and sources |
| `02-tiles-and-terms.md` | Every tile and term, with name origins for the tutorial, plus a short history |
| `03-card-2026.md` | The 2026 card: sections, values, notation, what's new, and how its hands get into the app |
| `04-strategy.md` | Strategy for the coach and for the computer opponents |
| `05-teaching-plan.md` | How beginners learn, the tutorial lessons, the guided matches, and graduation |
| `06-existing-apps.md` | Other American mah jongg apps: what to borrow, what gaps to fill, licensing notes |
| `07-app-spec.md` | The build spec: platform, data formats, algorithms, opponents, testing, build order |
| `08-design-ideas.md` | Ideas for our own tile art and card (cheat sheet) design |
| `HANDOFF.md` | Paste-ready prompt for the build chat |
| `research/` | The full research notes behind the files above (apps, teaching, strategy, technical prior art, tiles and history, fact check), with every source link |

## Confidence tags used throughout

- **[H] High**: authoritative sources agree (the NMJL rulebook or card as quoted by Tom Sloper, plus independent teaching sources).
- **[M] Medium**: one solid source, or several secondary sources that agree.
- **[L] Low**: one secondary source, or an inference.

## Decisions so far

- Personal use only, never for money.
- The hands themselves are unprotectable game rules (your settled position as an attorney), so the card data ships with the app with no special handling.
- 2026 NMJL card; no blank tiles; standard NMJL rules, no house rules.
- Solo means you plus three computer opponents in full games.
- Our own tile art and our own card layout.
- The real hand list will be entered from your own card (photo) once it arrives; until then the app is built and tested with an invented practice card.
- Recommended platform: a single-page web app that runs on your Mac and iPhone (see `07-app-spec.md`).

## How reliable these notes are

An independent reviewer checked the rules and card notes against their sources and found 25 issues (6 outright errors, the rest omissions, weak citations, or confidence levels set too high or too low). All of them have been corrected in the main files; the review itself is in `research/factcheck.md`. The most important fix: a hand is only officially "dead" on evidence the whole table can see, which the app must keep separate from what the engine privately knows.

## Still open

- The exact number of hands and values on the 2026 card (sources disagree; your card settles it).
- Where the app lives (a private Claude artifact or a Home Screen web app) and how progress is saved.
- A few rules details the NMJL doesn't publish online are marked as the app's labeled choices in `01-rules.md` (for example, how to pay a hand East completes right after the Charleston). The NMJL rulebook *Mah Jongg Made Easy* ($13 from the NMJL store) would settle most of them.
