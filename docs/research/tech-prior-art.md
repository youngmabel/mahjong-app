# Technical prior art for an American (NMJL) mahjong practice app

> **Note added after the independent fact check (research/factcheck.md):** where this file and the main notes (01 to 08) differ, the main notes carry the corrected version.

Prepared October 26, 2026, as input to the build notes for a personal, non-commercial app: one human against three computer opponents, standard NMJL rules, the 2026 card loaded from a data file the owner types in, a 152-tile set with no blanks, and a learning path that runs from scripted tutorials to guided practice matches to free play.

**Method.** Repositories were found through web search, GitHub topic pages, and links inside the repositories themselves. GitHub's search API and code search were not available from this environment, so discovery may have missed projects that search engines do not index. Each public repository listed below was cloned read-only and its README, data files, and core source files were read. None of the code was run, except one small benchmark that I wrote myself (Section 3.6). Nothing below copies repository code. Approaches are described in my own words, and the pseudocode is my own. No NMJL card content is reproduced, and every example hand is invented.

**Confidence labels.** High means I read it in source code or a primary document. Medium means a secondary source, a README claim I did not verify by running code, or my own inference from the code. Low means a weak or unverified source.

---

## 0. Most important findings

1. There is a lot of recent prior art. At least a dozen public American mahjong projects exist, most started in 2026, many built with AI coding assistants. Four are the most useful models. ClaysonIO/american-mahjong (MIT, plain JavaScript, a complete single-player game with a learning mode) is the closest match to this app's shape. imon-stevenson/modern-mahj (TypeScript and React) has the best-documented JSON hand schema and three bot difficulty levels. phishery/mahjong-iq is the most rigorous on card format, Monte Carlo methodology, and validation. joshbelot/mahjong-mania has the most complete written algorithm specification. (High)
2. Every serious implementation converges on the same core model. Each printed card line is expanded into a list of concrete "targets" (one per choice of suits and numbers). Each target is reduced to per-tile-kind counts split into natural-only slots (singles and pairs) and joker-eligible slots (groups of 3 or more). Matching and "tiles away" then become simple arithmetic over a count vector. (High)
3. The joker rule makes exact matching easy if you do it per tile identity rather than per group. Fill natural-only demand with natural tiles first, then fill joker-eligible demand with leftover naturals, then jokers. Two projects record bugs from an order-dependent, group-by-group greedy fill. (High)
4. The 2026 NMJL card reportedly expands to about 1,077 concrete hands, dominated by Runs (315) and Quints (264), per a blog crediting EightBam. Practice cards of 35 to 47 lines expand to 455 to 468 targets. A full scan of about 1,100 targets took about 26 microseconds in my synthetic benchmark, so heuristic bots are cheap. Monte Carlo rollouts belong in a Web Worker. (Medium: the 1,077 figure's counting method is not stated)
5. Existing American bots are all heuristic. None uses learned models. The common recipe: score the rack by its distance to the best few targets, discard the tile whose removal hurts least, call only when the exposure keeps a reachable line and reduces distance, and swap for exposed jokers when it does not hurt. Difficulty comes from noise, information awareness, defense, and calling aggressiveness. (High)
6. Riichi and Chinese mahjong research (Suphx, Mortal, Monte Carlo with opponent models) is mostly too heavy for this app. Its transferable ideas are distance (shanten), outs (ukeire), one-ply expected value, determinized Monte Carlo, and danger estimates from opponents' exposures. (Medium)
7. For reproducibility, the strongest pattern is a seeded PRNG plus a decision log. ClaysonIO saves a game as seed plus the human's decisions and replays it, which works only because its bots are deterministic. (High)
8. A TypeScript engine with zero dependencies, a small UI layer, SVG tiles, and local storage with an export backup fits a Mac and iPhone browser well. On iPhone, Safari can delete a site's stored data after 7 days without use unless the app is added to the Home Screen. (High)

---

## 1. Open-source American (NMJL-style) implementations

### 1.1 Overview

Activity dates come from git commit history as cloned on October 26, 2026. "No license found" means the repository has no license file, which by default reserves all rights. Those projects are useful for ideas only. Completeness is my assessment from reading the code and READMEs, not from running the apps.

| Project | Stack | License | Completeness (my read) | Activity | How hands are represented | Bundles an NMJL card? |
|---|---|---|---|---|---|---|
| [ClaysonIO/american-mahjong](https://github.com/ClaysonIO/american-mahjong) | Plain JS modules, no build step, `node:test` | MIT | Complete single-player game against 3 bots: Charleston, calls, joker swaps, scoring, saved games, offline PWA, Easy/Learning mode. No blind or courtesy passes. | 6 commits, all 2026-10-11 | Compact string notation; 35 practice hands expand to 455 targets | No (original practice card) |
| [imon-stevenson/modern-mahj](https://github.com/imon-stevenson/modern-mahj) | TypeScript, React 19, Vite, Zustand, Zod, Vitest | No license found | Complete single-player game against 3 bots with 3 difficulties: full Charleston with courtesy pass, calls through sextets, joker swaps, PWA | 45 commits, 2026-07-13 to 2026-09-21 | Zod-validated JSON with suit, number, wind, and dragon variables and constraints | Yes, 2025 and 2026 (`hands2025.json`, `hands2026.json`) |
| [phishery/mahjong-iq](https://github.com/phishery/mahjong-iq) | TypeScript, React, Vite, Vitest, Playwright, Web Worker | No license found | Charleston-only trainer (no full play): heuristic plus Monte Carlo scoring, drills, spaced repetition | 10 commits, 2026-10-12 to 2026-10-13 | JSON card with a `COUNT TILE:SUITVAR` pattern DSL; 47 demo lines expand to 468 variants | No (fictional demo card; user import) |
| [YakovYeger/the-mahjong-room](https://github.com/YakovYeger/the-mahjong-room) | TypeScript, Next.js-compatible (vinext), React 19, optional Supabase | No license found | Guided first game against 3 deterministic bots, coach panel, 8-step tutorial, optional multiplayer. No scoring. | 81 commits, 2026-08-29 to 2026-10-19 | Typed group definitions; ink-color transcription notation | Mixed: the README says original hands only, but the repo includes a transcription of a "user's photographed 2025 card" (55 lines) |
| [nicknaiser/mahjong](https://github.com/nicknaiser/mahjong) ("Mahjong Night") | JS modules bundled by esbuild, `node:test`, PeerJS | ISC in package.json, no license file | Solo against bots (easy/medium/hard), online room codes, card editor, blind passes, dead hands, scoring | 2 commits, 2026-10-25 | String notation with a/b/c suit tags and a shift flag | No (practice card plus editor) |
| [pauls-gh/mahjong](https://github.com/pauls-gh/mahjong) | JS with the Phaser game engine, PNG sprite sheet | No license found | Playable single-player game against 3 AI players with Charleston, courtesy, calls, and joker exchange | 57 commits, 2018-04 to 2020-04 (inactive) | JS objects: components with virtual suits and virtual consecutive numbers | Yes, 2017 to 2020 NMJL cards as JS files |
| [EpicOrange/riichi_advanced](https://github.com/EpicOrange/riichi_advanced) | Elixir server, Rust matcher, JS client, "MahjongScript" ruleset DSL | AGPL-3.0 | Mature multi-variant online client with an American (NMJL) ruleset, bots, and dead-hand declarations | About 3,650 commits; last 2026-10-17 | `~m"american, ..."` shorthand compiled to general match specs | Yes, NMJL 2013 to 2026 card "mods" plus other publishers' cards |
| [joshbelot/mahjong-mania](https://github.com/joshbelot/mahjong-mania) | Swift 6, SwiftUI, Swift package core | No license found | Table-side scorekeeper and hand helper, not a game against bots. Very detailed engineering spec. | 146 commits, 2026-05-16 to 2026-10-18 | "MahjNotation" text grammar | No (original Practice Card; user cards) |
| [pvcomms/maj-companion](https://github.com/pvcomms/maj-companion) | TypeScript library | MIT | Library plus two scripts, 16 tests, no app | 2 to 3 commits; date not visible | Combinator DSL; 8 templates expand to 73 targets | No (by design) |
| [EricTams/Mahjong](https://github.com/EricTams/Mahjong) | Single HTML file, no dependencies | No license found | "Outs trainer": first Charleston plus Monte Carlo odds of finishing a chosen hand | 2 commits, 2026-09-14 | Editable text list with a/b/c suits, x/y/z free suits, and an S "slide" flag | No (illustrative hands) |
| [systemslibrarian/mahjong-atelier](https://github.com/systemslibrarian/mahjong-atelier) | Plain JS with `.d.ts` types; node tests | No license found | Teaching app; its American mode uses 6 original shape-only patterns | 25 commits, 2026-10-17 to 2026-10-24 | Lists of group sizes (shape only) | No |
| [lhbergen/mahjong-ai-engine](https://github.com/lhbergen/mahjong-ai-engine) | Java (Gradle) with Cucumber specs; Python AI planned | MIT | Specs only: Gherkin feature files and design records, no engine code | 23 commits, 2026-09-04 to 2026-09-18 | Not yet | No |

Smaller or tangential finds:

- [jackwallner/mahj](https://github.com/jackwallner/mahj) is a commercial Swift and Kotlin drill app with original teaching hands. Its useful idea is a `ContentValidityTests` suite that checks every scripted drill (13-tile racks, 3-tile passes, no passed jokers, at most 4 copies of a tile, unique IDs) ([AGENTS.md](https://github.com/jackwallner/mahj/blob/main/AGENTS.md)). (High)
- [andrewjwinig-bot/mahjong-tracker](https://github.com/andrewjwinig-bot/mahjong-tracker) is a Next.js scorecard with "bring your own card" entry and IndexedDB storage, not a game engine. (High)
- [benjamin051000/mahjongg](https://github.com/benjamin051000/mahjongg) is a Godot table simulator with dealing and tile physics, but no card or rules logic. (High)
- [sammchugh-gif/godot-games PR #150](https://github.com/sammchugh-gif/godot-games/pull/150) is a Godot American game with bots, PeerJS room codes, its own card, and a "tiles away" display, merged 2026-09-24. Its internals were not described on the page. (Medium)
- [dragonpony1/gnome-vault PR #4](https://github.com/dragonpony1/gnome-vault/pull/4) "Mahj Helper" ranks hands by tiles away from tapped-in tiles and ships 24 made-up practice hands, merged 2026-09-23. (Medium)
- [woolfscottkevin-commits/dadarcade PR #2](https://github.com/woolfscottkevin-commits/dadarcade/pull/2) lets a player type a whole card one line per hand, using color letters, `like`/`run`/`odd` keywords, X/C, and points, with live validation and copy-paste round trips. It also fixed a script-injection bug where typed section names were rendered as HTML, a reminder to escape user-entered card text. (Medium)
- [kumechang/American-Mahjong](https://github.com/kumechang/American-Mahjong) is a club and event directory site, not an engine. [BadTowers/american-mahjong](https://github.com/BadTowers/american-mahjong) showed up in search results but could not be fetched.

### 1.2 Project notes

**ClaysonIO/american-mahjong** is the most transferable example. It is about 1,800 lines with no dependencies ([README](https://github.com/ClaysonIO/american-mahjong/blob/main/README.md)).

- *Card notation* ([js/card.js](https://github.com/ClaysonIO/american-mahjong/blob/main/js/card.js)). Each space-separated token is either a group (one repeated symbol) or a run of singles. Symbols are F, N/E/W/S, 1 to 9, 0 for Soap, X/Y/Z/Q for "any number and the next three consecutive," and D for the dragon matching the token's suit. A suffix a/b/c names a suit variable, and different letters mean different suits. Each hand carries a value and a concealed flag.
- *Expansion.* All permutations of real suits over the suit letters are combined with all valid starting numbers. Duplicates are removed with a sorted multiset key.
- *Matching* ([js/matcher.js](https://github.com/ClaysonIO/american-mahjong/blob/main/js/matcher.js)). Each target is precomputed into per-kind natural and jokerable counts. Distance is missing natural tiles plus whatever joker-eligible shortfall the held jokers cannot cover.
- *Learning features.* The Easy/Learning mode marks the closest lines as "Suggested," shows how many tiles each line needs and which are missing, and suggests a discard that fits up to 2 lines the player picked.
- *Reproducibility.* It uses a mulberry32 seeded RNG, a `?seed=` URL parameter, and deterministic bots, so a game in progress is saved as seed, dealer, and the human's decisions, then replayed on reload ([js/record.js](https://github.com/ClaysonIO/american-mahjong/blob/main/js/record.js)).
- *Tests.* It runs 40 computer-only games as an invariant test.

(High)

**imon-stevenson/modern-mahj** ([README](https://github.com/imon-stevenson/modern-mahj/blob/main/README.md)) is the best example of an explicit, typed hand schema; see [src/game/hands/schema.ts](https://github.com/imon-stevenson/modern-mahj/blob/main/src/game/hands/schema.ts) and Section 2.

- Its matcher documents moving from an "order-dependent greedy fill" to exact per-identity allocation, and it assigns exposures to groups by backtracking ([match.ts](https://github.com/imon-stevenson/modern-mahj/blob/main/src/game/hands/match.ts)).
- Bots come in beginner, intermediate, and expert strategies behind one interface ([src/game/bots](https://github.com/imon-stevenson/modern-mahj/tree/main/src/game/bots)). Difficulty also sets how long the human has to claim a discard.
- All randomness flows through a seeded mulberry32 RNG, so the Vitest suite is deterministic.
- It bundles the 2025 and 2026 NMJL cards as JSON. The README says "both NMJL cards are bundled."

(High)

**phishery/mahjong-iq** ([README](https://github.com/phishery/mahjong-iq/blob/main/README.md)) is narrower, a Charleston trainer, but it is the most methodical.

- Its [card format doc](https://github.com/phishery/mahjong-iq/blob/main/docs/CARD_FORMAT.md) defines a JSON card with `source.kind` (demo, licensed, or user-supplied), categories, and a pattern DSL. It also ships a validator that prints variant counts, and a git-ignored `private-cards/` folder for a personally transcribed card.
- Its [probability doc](https://github.com/phishery/mahjong-iq/blob/main/docs/PROBABILITY.md) describes a heuristic score calibrated against a Monte Carlo simulator (mean Spearman correlation 0.85 on 80 fresh racks), validates the simulator against exact hypergeometric results, and reports run times.
- It uses an sfc32 PRNG and "same-rack challenge codes," and opponents see only their own view.

(High for what the docs and code say. I did not run it.)

**YakovYeger/the-mahjong-room** is the closest to this app's learning goals.

- Its engine is one pure transition function returning a new immutable state plus events, or a typed rule violation ([docs/GAME_ENGINE.md](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/GAME_ENGINE.md), [docs/ARCHITECTURE.md](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/ARCHITECTURE.md)).
- Its [rules spec](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/RULES_SPEC.md) lists exactly which NMJL procedures are in or out of scope. In beginner mode it prevents illegal actions up front instead of applying a dead-hand penalty.
- Its [coach audit](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/COACH_AUDIT_AND_DESIGN.md) is the best available write-up of hint-system pitfalls (Section 4.2).
- Card provenance is inconsistent. The README says the project "contains only original training-hand definitions," but [docs/CARD_DESIGN.md](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/CARD_DESIGN.md) and `src/game/reference-card.ts` describe and include a transcription of a user-photographed 2025 card. Its section names match the NMJL layout.

(High for the docs. Medium on whether the transcription is the NMJL card.)

**nicknaiser/mahjong** ([src](https://github.com/nicknaiser/mahjong/tree/main/src)) keeps the whole game as one plain JSON object that is changed only through `apply(state, seat, action)`, so it can be saved and sent over the network. Its notation has a `shift` setting: exact numbers, any shift, or even shifts only. Its bots ([src/bot.js](https://github.com/nicknaiser/mahjong/blob/main/src/bot.js)) see only what a human in their seat could see, and use three difficulty presets (Section 4.5). (High)

**pauls-gh/mahjong** is the oldest, from 2018 to 2020. Its card files ([card/2020](https://github.com/pauls-gh/mahjong/tree/master/card/2020)) describe each hand as a list of components, each with a suit, a number, and a count. Suits can be virtual (VSUIT1 to VSUIT3, plus "the dragon of VSUIT1"), and numbers can be virtual (CONSECUTIVE1 to CONSECUTIVE7, relative to a minimum number). Flags cover odd, even, and concealed. There are no point values in the data. Its matcher ([card/card.js](https://github.com/pauls-gh/mahjong/blob/master/card/card.js)) loops over suit permutations and starting numbers and fills components in order. The hand files carry a warning to list exact singles first, which is a symptom of order dependence. It is a useful historical reference, but its data model is less expressive than the newer ones. (High)

**EpicOrange/riichi_advanced** is the only mature, multi-ruleset engine with American support ([documentation/american.md](https://github.com/EpicOrange/riichi_advanced/blob/main/documentation/american.md)).

- American hands are written in a shorthand ([documentation.md, "American hand match specifications"](https://github.com/EpicOrange/riichi_advanced/blob/main/documentation/documentation.md)): F any flower, D any dragon (or the dragon of a suffixed suit), Z any wind, N/E/W/S, R/G/0 dragons, 1 to 9, X plus a trailing offset digit for variable numbers, a/b/c suits, and `|` for alternatives within a group.
- Its "nearest hands" feature uses maximum bipartite matching between rack tiles and pattern slots ([american.ex](https://github.com/EpicOrange/riichi_advanced/blob/main/lib/riichi_advanced/game/game_state/american.ex)). The project page says rulesets are encoded as SMT constraints and solved with Z3 to enumerate joker assignments.
- Its American bot discards the tile used least among the closest hands. It calls only when its riichi-style "shanten" count (13 minus matched tiles) is 3 or less and the discard helps an open closest hand ([ai_player.ex](https://github.com/EpicOrange/riichi_advanced/blob/main/lib/riichi_advanced/game/ai_player.ex)).
- AGPL-3.0 is a strong copyleft license, which is a further reason to borrow ideas only.

(High)

**joshbelot/mahjong-mania** has a 1,700-line product and engineering spec ([docs/SPEC.md](https://github.com/joshbelot/mahjong-mania/blob/main/docs/SPEC.md)) with a formal line grammar (section 9), expansion and evaluation algorithms (section 10), Charleston pass, discard, and call suggestions, an opponent "Scout" danger model, payout rules with test tables, and a required property test against a brute-force solver. Its decision log ([docs/DECISIONS.md](https://github.com/joshbelot/mahjong-mania/blob/main/docs/DECISIONS.md)) reports full-rack analysis at a 4.4 ms maximum per tap in a Release build on an Apple-silicon Mac. This is the best "spec to hand an AI coder" model I found. (High)

**pvcomms/maj-companion** ([GitHub page](https://github.com/pvcomms/maj-companion)) deliberately ships zero hands. Hands are written as combinators, for example a pung of a sequence variable in suit variable A, and the README calls the "joker-ineligible groups first, then jokers" fill "genuinely optimal." It experiments with a vision model that turns a photo of the user's own card into the DSL, but the README says that path is untested on real card photos. (Medium: README only; the clone failed)

**EricTams/Mahjong** ([index.html](https://github.com/EricTams/Mahjong/blob/main/index.html)) plays a full game with Monte Carlo to estimate your odds of finishing a chosen hand, with opponents passing and discarding tiles useless to their own targets. Its in-app help explains the card's color convention for users entering hands. (High)

### 1.3 Card-bundling and licensing patterns

Four projects ship NMJL card data:

- pauls-gh: 2017 to 2020
- modern-mahj: 2025 and 2026
- riichi_advanced: 2013 to 2026 card mods ([priv/static/mods/american](https://github.com/EpicOrange/riichi_advanced/tree/main/priv/static/mods/american))
- the-mahjong-room: a transcribed 2025 card

The rest ship original practice cards and let users enter their own. Patterns for keeping a personal card out of a public codebase:

- mahjong-iq: a git-ignored folder, plus an optional passcode-gated serverless unlock ([CARD_FORMAT.md](https://github.com/phishery/mahjong-iq/blob/main/docs/CARD_FORMAT.md))
- dadarcade: hands stored only on the device ([PR #2](https://github.com/woolfscottkevin-commits/dadarcade/pull/2))
- maj-companion: parse a photo of the owner's own card ([page](https://github.com/pvcomms/maj-companion))

For this app, the build notes should keep the owner's 2026 card in a local data file that is never committed to a public repository, and ship a small invented practice card for tests and the tutorial. (Medium: this is a design inference, not legal advice)

---

## 2. Modeling a card hand as data

### 2.1 What the printed card encodes

A data model has to capture these features of the physical card. Sources are the [Sloperama 2026 FAQ](https://www.sloperama.com/mjfaq/2026.html), the help text in [EricTams/Mahjong](https://github.com/EricTams/Mahjong/blob/main/index.html), [mahjong-iq's card format](https://github.com/phishery/mahjong-iq/blob/main/docs/CARD_FORMAT.md), and the [AMJA joker rules](https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/jokers-and-joker-exchange/).

- **Colors are relative suits, not specific suits.** "A color on the card does not dictate suit," and "Three colors means three suits must be used." Blue (or navy) also marks suitless tiles (flowers, winds, zeroes), and for those tiles blue means "no suit," not a third suit. So a transcription should map ink colors to suit variables only for numbered tiles and suit-bound dragons. (High, Sloperama)
- **The parenthetical note governs flexibility.** "Any like numbers," "any N consecutive numbers," "these numbers only," "any dragon," "matching dragons," "opposite dragon," and "any wind" live in the note. A missing "these numbers only" does not grant flexibility; the note must state it. "Any dragon" overrides the color coding. (High, Sloperama)
- **Matching dragons** pair Craks with Red, Bams with Green, and Dots with Soap (the White Dragon). **Soap is the only tile used as zero**, and only where the card prints a 0. (High)
- **Singles are singles.** Year digits, NEWS, and printed runs such as 1-2-3 are groups of single tiles. They can never take jokers and cannot be exposed except to declare Mah Jongg. (High, Sloperama; AMJA)
- **Jokers** substitute only in pungs, kongs, quints, and sextets of identical tiles, flower groups of 3 or more included. A concealed group may be all jokers, but an exposed group must contain the called natural tile. A quint of any tile other than a flower always needs at least one joker, because only 4 copies exist. Flowers have 8 copies. (High: [AMJA](https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/jokers-and-joker-exchange/), [mahjong-iq RULES.md](https://github.com/phishery/mahjong-iq/blob/main/docs/RULES.md))
- **"-or-" lines** print two layouts of one hand. Some hands have a floating pair whose number varies while the kongs match it. Some say pairs may be any suit except the kongs' suit. (High, Sloperama)
- **Each line carries X (exposed allowed) or C (concealed) and a point value.** (High)

### 2.2 Existing representations compared

| Style | Example project | Strengths | Weaknesses |
|---|---|---|---|
| Component list with virtual suits and virtual numbers | [pauls-gh](https://github.com/pauls-gh/mahjong/blob/master/card/2020/hands2468.js) | Explicit; easy to loop over | Verbose to type; odd/even flags only; no alternatives; no point values |
| Compact token notation (repeated symbol = group, a/b/c suit letters, XYZQ or X-offset numbers, D = matching dragon) | [ClaysonIO](https://github.com/ClaysonIO/american-mahjong/blob/main/js/card.js), [nicknaiser](https://github.com/nicknaiser/mahjong/blob/main/src/card.js), [riichi_advanced](https://github.com/EpicOrange/riichi_advanced/blob/main/documentation/documentation.md) | Looks like the printed card; fast to type; tiny parser | Flexibility rules (parity, independent numbers, opposite dragon) need extra flags |
| Literal digits plus a "shift" flag (`shift` = any offset, `shift2` = even offsets only) | [mahjong-mania SPEC section 9](https://github.com/joshbelot/mahjong-mania/blob/main/docs/SPEC.md), [nicknaiser](https://github.com/nicknaiser/mahjong/blob/main/src/card.js), [EricTams](https://github.com/EricTams/Mahjong/blob/main/index.html) | Closest to transcription: type the example numbers you see, then add one flag | Cannot express two independent numbers or a set domain without escape hatches |
| `COUNT TILE:SUITVAR` DSL with number variables and offsets (`4x:A 4x+1:A`), explicit `vars` domains, `distinctVars`, alternatives array, `jokers: none` | [mahjong-iq](https://github.com/phishery/mahjong-iq/blob/main/docs/CARD_FORMAT.md) | Unambiguous; domains handle odd/even and "these numbers only" | Less like the printed card, so transcription takes more thought |
| Typed JSON with suit vars X/Y/Z, number vars N, N+1 to N+6, and an independent M, a wind var, a dragon var (or dragon tied to a suit var), `suitConstraints` (allDifferent/same), and `numberConstraints` (range/oneOf), validated with Zod | [modern-mahj schema.ts](https://github.com/imon-stevenson/modern-mahj/blob/main/src/game/hands/schema.ts) | Most expressive; runtime validation with readable errors | Too verbose to hand-type; needs an editor or compiler |
| Combinators in code | [maj-companion](https://github.com/pvcomms/maj-companion) | Type-checked | Needs a programmer to edit |
| Ink-color transcription plus free-text notes parsed heuristically | [the-mahjong-room photo-card.ts](https://github.com/YakovYeger/the-mahjong-room/blob/main/src/game/photo-card.ts) | Very fast to transcribe | Brittle: ended up with special cases keyed to individual row IDs |

Lessons from these designs:

1. **Make flexibility explicit.** Inferring "any like numbers" from note text led the-mahjong-room to per-row special cases. Explicit variables or flags avoid that. (High, from reading the code)
2. **Derive joker eligibility from group size, but allow an override.** NMJL needs no exceptions. riichi_advanced's TODO list shows other publishers' cards need "jokers may not be used in this grouping" and similar overrides ([american.md](https://github.com/EpicOrange/riichi_advanced/blob/main/documentation/american.md)). (High)
3. **Validate supply per concrete variant.** Some suit choices need more copies than exist; mahjong-mania's example is a hand that cannot use Dots because it would need 5 Soaps. Drop such bindings during expansion and fail if none survive ([SPEC section 9.2](https://github.com/joshbelot/mahjong-mania/blob/main/docs/SPEC.md)). (High)
4. **Support alternatives and remove duplicates.** "-or-" lines are an array of patterns, and symmetric suit swaps produce duplicate targets. Remove them by a sorted multiset signature. (ClaysonIO, mahjong-iq, mahjong-mania; High)
5. **Store source metadata and a canonical serialization.** Use a parse, serialize, parse round-trip test ([mahjong-mania SPEC section 9.4](https://github.com/joshbelot/mahjong-mania/blob/main/docs/SPEC.md)), and record where the card came from (`source.kind`) ([mahjong-iq](https://github.com/phishery/mahjong-iq/blob/main/docs/CARD_FORMAT.md)). (High)
6. **Plan for a non-programmer typing the card.** Validate each line live and say what is wrong and how many tiles it adds up to ([dadarcade PR #2](https://github.com/woolfscottkevin-commits/dadarcade/pull/2), [nicknaiser card editor](https://github.com/nicknaiser/mahjong)). An editor should also preserve comments and untouched lines ([mahjong-mania DECISIONS](https://github.com/joshbelot/mahjong-mania/blob/main/docs/DECISIONS.md)). (High)

### 2.3 Recommended two-layer schema

This is my synthesis, not taken from any one project.

**Layer 1: an entry notation that mirrors the printed card.** The owner types one line per printed line, and a compiler turns it into Layer 2.

```
# section | value | X or C | pattern [| -or- pattern] | options
Runs | 25 | X | FF 1111g 2222g 3333r | slide
```

This line is invented, not from any card. The rules:

- **Ink letters.** g, r, and b are the ink colors. The compiler maps colors to suit variables A, B, C only for number tiles and `D`. F, N, E, W, S, and 0 ignore color.
- **Digits.** Digits are the printed example numbers.
- **Options.** Options state what the parenthetical allows:
  - `slide` (shift all numbers together by any amount)
  - `slide2` (shift by even amounts)
  - `nums x=1,3,5` (explicit domain)
  - `dragon=any|matching|opposite`
  - `wind=any`
  - `pairsuit=any|notA`
  - `float=pair`
- **Escape hatch.** For anything the options cannot say, the owner writes explicit variables (`x`, `x+1`, `y`) in place of digits, as in mahjong-iq.

**Layer 2: compiled JSON**, validated at load time. Field names are illustrative.

```json
{
  "schemaVersion": 1,
  "card": { "id": "nmjl-2026-personal", "year": 2026, "source": "user-supplied" },
  "hands": [{
    "id": "runs-01", "section": "Runs", "line": 1, "value": 25, "concealed": false,
    "display": "FF 1111g 2222g 3333r",
    "alternatives": [{
      "groups": [
        { "size": 2, "tile": { "type": "flower" } },
        { "size": 4, "tile": { "type": "num", "suit": "A", "n": "x" } },
        { "size": 4, "tile": { "type": "num", "suit": "A", "n": "x+1" } },
        { "size": 4, "tile": { "type": "num", "suit": "B", "n": "x+2" } }
      ]
    }],
    "vars": { "x": { "domain": [1, 2, 3, 4, 5, 6, 7] } },
    "constraints": [{ "distinctSuits": ["A", "B"] }]
  }]
}
```

The model needs these tile kinds and constraint types:

- **Tile types:**
  - `num` (suit var or fixed suit, with a number literal or a number var plus offset)
  - `dragon` with `of: "A"` (matching), `color` (fixed), or `var` (any dragon)
  - `wind` with a fixed letter or a `var`
  - `flower`
  - `zero` (compiles to the White Dragon; kept distinct only for display)
- **Groups:**
  - `size` from 1 to 6, or up to 8 for flowers
  - optional `jokers: "never"` override
- **Constraints:**
  - distinct suit vars (default)
  - free suit vars that may coincide (needed for "pairs any suit")
  - parity or set domains for numbers
  - distinct number vars
  - "suit var not equal to" (for "pairs any suit except the kongs' suit")
  - wind or dragon var domains

**Validation at load time:**

- every alternative totals 14
- at most 3 distinct suits after binding
- every concrete variant respects supply (natural-only demand at most 4 per kind, or 8 for flowers; joker-eligible demand coverable by copies plus 8 jokers)
- at least one surviving variant per line
- unique IDs
- the display string round-trips
- per-section variant counts printed, so the owner can sanity-check against the card

This structure covers year hands, NEWS (four wind singles), flowers, matching, opposite, and any dragons, like numbers, consecutive runs, fixed numbers, concealed flags, and point values. (Medium: synthesized; needs testing against the real card)

---

## 3. Algorithms

### 3.1 Tile representation

Use 36 tile kinds: 27 suited, 4 winds, 3 dragons, 1 flower (all flowers interchangeable), and 1 joker. A rack is a count vector (`Int8Array(36)`). Flowers have 8 copies, jokers 8, everything else 4, for 152 tiles. Physical tile IDs are kept separately for animation and for logs. ClaysonIO ([tiles.js](https://github.com/ClaysonIO/american-mahjong/blob/main/js/tiles.js)) and mahjong-iq (README architecture section) both use count vectors. (High)

### 3.2 Expanding a line into concrete targets

```
expandLine(line):
  targets = {}
  for alt in line.alternatives:
    for suitMap in assignments(alt.suitVars, {Bam, Crak, Dot})      # injective unless a var is "free"
        where constraints(suitMap):
      for numMap in product(domain(v) for v in alt.numberVars)
          where all offsets stay in 1..9 and constraints(numMap):
        for windMap, dragonMap in product(...):
          groups = resolve(alt.groups, suitMap, numMap, windMap, dragonMap)
          need = per-kind { plain: sum of sizes < 3, flex: sum of sizes >= 3 }
          if violatesSupply(need): continue
          key = sorted multiset signature of (kind, size) groups
          targets[key] = { line, groups, need }                       # dedupe symmetric swaps
  return values(targets)
```

**How many variants to expect:**

- About 1,077 for the 2026 NMJL card, by section: Year 30, 2468 66, Like Numbers 135, Quints 264, Runs 315, 13579 81, Winds and Dragons 107, 369 48, Singles and Pairs 31 ([Missy Mahjong, crediting EightBam](https://www.missymahjong.com/post/nmjl-2026-card-statistics); counting method not stated, Medium).
- EightBam counts 72 printed entries on that card, with A/B versions counted separately ([EightBam best sections](https://eightbam.com/best-sections/)). That is roughly 15 targets per entry.
- Practice cards: ClaysonIO's 35 lines give 455 targets, mahjong-iq's 47 give 468, and maj-companion's 8 give 73. (High)
- By my arithmetic, a one-suit "any 3 consecutive" line gives 3 suits x 7 starts = 21 targets. A three-suit like-number line gives at most 6 suit orders x 9 numbers = 54, fewer after deduplication.

### 3.3 Exact win check with jokers

The key is to account per tile identity, not group by group. For one concrete target, after removing the groups matched by exposures:

```
canComplete(target, rackCounts, jokers, exposures) -> bool:      # rack + exposures = 14 tiles
  if target.concealed and exposures not empty: return false
  groups = copy(target.groups)
  for e in exposures:                      # e = {kind, size}; its jokers are locked in it
    g = any group in groups with g.kind == e.kind and g.size == e.size and g.size >= 3
    if none: return false
    remove g from groups                   # same (kind,size) groups are interchangeable, so counting suffices
  jokerShort = 0
  for kind k in groups:
    plain = sum of sizes < 3 for k; flex = sum of sizes >= 3 for k; have = rackCounts[k]
    if have < plain: return false          # singles/pairs need naturals
    if have > plain + flex: return false   # a natural would be left over
    jokerShort += (plain + flex) - have
  return jokerShort == jokers              # every remaining tile used exactly once
```

**Why per-identity accounting is exact.** Jokers can fill only flexible slots, and natural tiles of kind k can fill only slots of kind k. So any valid assignment must put naturals into the plain slots of k first. The remaining naturals and the jokers are interchangeable across the flexible slots of k. mahjong-mania's spec states this optimality and requires a property test against a brute-force solver ([SPEC section 10.2](https://github.com/joshbelot/mahjong-mania/blob/main/docs/SPEC.md)), and mahjong-iq makes the same argument ([PROBABILITY.md section 3](https://github.com/phishery/mahjong-iq/blob/main/docs/PROBABILITY.md)). (High)

**Why group-by-group greedy fails.** When a hand has two groups of the same tile, for example a single 2 inside a year group plus a pung of 2s in the same suit, filling the pung first can swallow the natural 2 the single needs. pauls-gh worked around this by requiring "exact singles first" in its data files ([hands2468.js header](https://github.com/pauls-gh/mahjong/blob/master/card/2020/hands2468.js)). modern-mahj replaced its "old order-dependent greedy fill" ([match.ts](https://github.com/imon-stevenson/modern-mahj/blob/main/src/game/hands/match.ts)). (High)

**Exposure rules that matter for matching:**

- An exposure's size is fixed once its owner discards or starts a joker exchange; before that it may be changed ([AMJA claiming rules](https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/claiming-discarded-tile-exposure/)). Most apps simply forbid editing ([riichi_advanced](https://github.com/EpicOrange/riichi_advanced/blob/main/documentation/american.md), [the-mahjong-room RULES_SPEC](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/RULES_SPEC.md)).
- Pungs cannot be upgraded later, and exposures can only be made from discards.
- Discarded jokers cannot be called.
- A concealed hand may call only its final tile for Mah Jongg, and any natural discard can complete a final single or pair for Mah Jongg ([the-mahjong-room RULES_SPEC](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/RULES_SPEC.md)).

(High)

### 3.4 Distance ("tiles away"), outs, and dead hands

Use the same loop, but count shortfalls instead of returning false:

```
distance(target, rackCounts, jokers, exposures):
  (filter by concealed flag and exposure fit exactly as above; if no fit -> Infinity)
  missPlain = 0; missFlex = 0
  for kind k: usePlain = min(have, plain); missPlain += plain - usePlain
              spare = have - usePlain; useFlex = min(spare, flex); missFlex += flex - useFlex
  return missPlain + max(0, missFlex - jokers)
```

ClaysonIO ([matcher.js](https://github.com/ClaysonIO/american-mahjong/blob/main/js/matcher.js)) and mahjong-mania ([SPEC section 10.2](https://github.com/joshbelot/mahjong-mania/blob/main/docs/SPEC.md)) compute essentially this. For a line, report the minimum over its targets, plus the "missing" list for the best target.

**Useful extensions:**

- **Live tiles and dead hands.** From one player's view, `live[k] = copies[k] - own rack - all exposures - discards`. A target is dead if any natural-only shortfall exceeds `live[k]`, or the flexible shortfall exceeds what live naturals plus live jokers can cover. Mahjong Hand Helper's public tool marks such hands "Dead" with the missing tile struck through ([how-to](https://mahjonghandhelper.com/howto.html)). The-mahjong-room shows a dead-hand notice only when visible discards prove every compatible line impossible ([RULES_SPEC](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/RULES_SPEC.md)). (High)
- **Outs.** This is the American analogue of riichi "ukeire": the number of unseen copies that would reduce distance. Count live copies of each missing kind, plus live jokers where a flexible slot is missing ([riichi.wiki: Ukeire](https://riichi.wiki/Ukeire); mahjong-mania's `liveOuts`). Use outs to break ties between lines at equal distance. mahjong-mania's ranking order is: possible first, then lower distance, then fewer natural-only shortfalls, then more live outs, then higher points ([SPEC section 10.4](https://github.com/joshbelot/mahjong-mania/blob/main/docs/SPEC.md)). (High)
- **Exposure filter for "which hands remain."** A line survives only if, for every exposed (kind, size), the target has at least as many joker-eligible groups with that kind and size, and the line is not concealed. ClaysonIO does this by counting, and modern-mahj by backtracking. Both are correct for NMJL-style groups. (High)
- **Joker exchange opportunities.** If an exposure anywhere holds a joker standing for kind k, and your rack holds a natural k that your targets do not need, the swap turns a dead tile into a flexible one. A coach can show "distance after the best available exchange" as a separate figure. (Medium, my inference; the-mahjong-room lists exchange advice as a planned increment in its [coach doc](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/COACH_AUDIT_AND_DESIGN.md))

### 3.5 Showing which tile goes where

For hints and the win screen, allocate actual tiles to groups: naturals to singles and pairs first, then to larger groups, then jokers to the larger groups still short. ClaysonIO's `holdings` ([matcher.js](https://github.com/ClaysonIO/american-mahjong/blob/main/js/matcher.js)) and modern-mahj's `arrangeWinningHand` ([match.ts](https://github.com/imon-stevenson/modern-mahj/blob/main/src/game/hands/match.ts)) do this. riichi_advanced uses general maximum bipartite matching ([american.ex](https://github.com/EpicOrange/riichi_advanced/blob/main/lib/riichi_advanced/game/game_state/american.ex)), which is more general than NMJL needs.

For display, when the player still holds several jokers, mahjong-mania allocates them to the shortfalls with the fewest live copies first ([SPEC section 10.2 step 7](https://github.com/joshbelot/mahjong-mania/blob/main/docs/SPEC.md)). (High)

### 3.6 Performance

**My micro-benchmark** (own code, synthetic data) used 1,100 random targets with 4 to 7 groups, on Node 22 and a 2.8 GHz Xeon server. The script is saved at /tmp/claude-0/-home-claude/866f77d0-fe0d-520c-be9e-65b210cfc8db/scratchpad/bench/bench.mjs.

| Operation | Time |
|---|---|
| Full distance scan of one rack | About 26 microseconds |
| Choosing a discard by trying each held kind | About 0.4 ms |
| Naive Monte Carlo, 1,000 playouts x 20 draws, full rescan after every draw | About 1.2 s |

This was not measured on an iPhone. (Medium)

**Published figures:**

- mahjong-mania: 4.4 ms maximum per tap for full analysis in Swift Release, 66 ms in Debug ([DECISIONS.md](https://github.com/joshbelot/mahjong-mania/blob/main/docs/DECISIONS.md)).
- mahjong-iq: at 1,000 trials, Monte Carlo takes about 0.3 s for all 9 categories and about 0.6 s for all 47 lines, in a Web Worker ([PROBABILITY.md](https://github.com/phishery/mahjong-iq/blob/main/docs/PROBABILITY.md)).

(High for what they report)

**Implications.**

- Precompute each target's requirement arrays once at card load.
- Run heuristics on the main thread, and run Monte Carlo in a Web Worker with cancellation.
- Narrow each rollout to targets near the current best distance.
- Exhaustive Charleston search is affordable. There are at most C(13,3) = 286 three-tile choices, which by the benchmark is about 7.5 ms. mahjong-iq enumerates distinct pass multisets against its top 60 variants ([passes.ts](https://github.com/phishery/mahjong-iq/blob/main/src/engine/passes.ts)).

---

## 4. Computer opponents

### 4.1 Heuristics in existing American bots

| Decision | Approaches found |
|---|---|
| Charleston pass (3 tiles, never jokers) | Remove the tile whose removal raises best distance least, tie-broken by a weighted "usefulness" over the top 12 targets ([ClaysonIO ai.js](https://github.com/ClaysonIO/american-mahjong/blob/main/js/ai.js)). Rank by fit to this rack's own candidate hands ([modern-mahj intermediate](https://github.com/imon-stevenson/modern-mahj/blob/main/src/game/bots/intermediate.ts)). Maximize a smooth score summed over all lines ([nicknaiser](https://github.com/nicknaiser/mahjong/blob/main/src/bot.js)). Exhaustive pass search for grading ([mahjong-iq](https://github.com/phishery/mahjong-iq/blob/main/src/engine/passes.ts)). |
| Second Charleston vote | Continue if best distance is 5 or more (ClaysonIO, nicknaiser medium and hard). Continue if the best hand is under 75% filled (modern-mahj). Random 60% (nicknaiser easy). |
| Courtesy pass (0 to 3) | Fewer tiles the closer the best hand: thresholds on match % ([pauls-gh gameAI.js](https://github.com/pauls-gh/mahjong/blob/master/gameAI.js), modern-mahj). Offer only tiles whose removal costs under 3% of score (nicknaiser). |
| Discard | Least increase in best distance (ClaysonIO). Never a joker, keep the committed target's needs, then least globally useful (modern-mahj). Maximize the sum over lines of exp(-1.1 x need) x (1 + value/100), with random noise by level (nicknaiser). Least-used tile among the closest hands ([riichi_advanced](https://github.com/EpicOrange/riichi_advanced/blob/main/lib/riichi_advanced/game/ai_player.ex)). Smallest weighted drop in match % across hands (pauls-gh). |
| Calling for exposure | Only if the exposure strictly lowers best distance and leaves it at 6 or less (ClaysonIO). Only if some hand is still reachable with all exposures and closeness improves (modern-mahj). Must lower best need and raise score 10% after the forced discard (nicknaiser). Top hand at least 55% matched and the tile completes a pung or larger (pauls-gh). "Shanten" (13 minus matched tiles) of 3 or less and the discard helps an open closest hand (riichi_advanced). |
| Joker exchange | Take it if distance does not worsen (ClaysonIO). Take it if score does not drop, never on easy (nicknaiser). First available (modern-mahj intermediate). If total match % improves (pauls-gh). |
| Defense | Expert: avoid discarding tiles that match opponents' exposed tiles (modern-mahj [expert.ts](https://github.com/imon-stevenson/modern-mahj/blob/main/src/game/bots/expert.ts)). Hard: tiles still needed by any line consistent with an opponent holding 3 or more exposures get a 0.85 score penalty (nicknaiser `dangerKinds`). "Scout" danger: average remaining needs of all targets consistent with each opponent's exposures, normalized 0 to 1 ([mahjong-mania SPEC section 10.6](https://github.com/joshbelot/mahjong-mania/blob/main/docs/SPEC.md)). Several bots have no defense at all. |
| Mah Jongg | Always declared, except a deliberately weak setting (nicknaiser easy passes on a discard win 10% of the time). |

All of the above is High confidence, from reading the source.

### 4.2 Pitfalls that existing projects documented

- **Global usefulness tables relay junk.** If every seat ranks tiles by a card-wide usefulness table, all bots pass the same kinds of tiles and forward what they just received, so "one trio of junk" circulates to the human. Rank against each rack's own candidates instead ([modern-mahj scoring.ts comment](https://github.com/imon-stevenson/modern-mahj/blob/main/src/game/bots/scoring.ts)). (High)
- **Incompatible exposures.** Bots that call without checking that all their exposures still fit one line stack pungs no hand can use (modern-mahj intermediate comment). (High)
- **Coach-specific errors** ([the-mahjong-room coach audit](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/COACH_AUDIT_AND_DESIGN.md)):
  - recommending a discard that the player's pinned hand needs
  - fixed bonuses for pairs and jokers instead of re-running the exact allocation after each hypothetical removal
  - choosing three Charleston tiles independently instead of measuring their joint loss
  - checking only the first legal call option
  - ignoring natural tiles already dead in the discards
  - giving a tile suggestion during a non-tile decision, such as voting on the second Charleston
  - overstating confidence: the fix reserves "high" for rules facts and labels hand-fit advice tentative

  (High)
- **Card-wide statistics are not the same as rack-level odds.** EightBam simulated 10 million games on the 2026 card, exploring both paths whenever a discard could be called, with "no bot strategy." It reports Runs "showing up" in 46.9% of games but Quints in 0.04%, and median completion rates of 4.0% for Runs and 0.01% for Quints ([best sections](https://eightbam.com/best-sections/), [probability](https://eightbam.com/probability/)). Bots that weight lines only by distance will chase quints too often. Weighting by live outs or a calibrated completion probability fixes this. (Medium: secondary site; methodology only partly described)

### 4.3 Simulation-based approaches

**mahjong-iq** estimates the chance of finishing within 20 turns ([PROBABILITY.md](https://github.com/phishery/mahjong-iq/blob/main/docs/PROBABILITY.md)). (High)

- *Model.* Unknown tiles are everything not in the rack or known-passed. Each trial shuffles them, and the player draws while three opponents draw and discard.
- *Calls.* Calls are allowed for exposed targets, and the player retargets adaptively after each acquisition.
- *Variance and validation.* It uses common random numbers across candidate targets, Wilson intervals, and checks against hypergeometric closed forms.
- *Heuristic.* It is a product of per-missing-tile binomial chances, with a smaller weight on jokers and a fourth root, and its weights were grid-searched against the simulator. That form reached a Spearman rank correlation of 0.85 with simulated line completion, against 0.68 for an older "sum of expected waits" form.
- *Limits.* It does not model opponents winning first, defense, or joker exchanges.

**EricTams/Mahjong** runs a similar per-hand rollout in which opponents discard tiles useless to their own targets ([index.html](https://github.com/EricTams/Mahjong/blob/main/index.html)). (High)

**Transferable published methods**, scaled to this app:

- **Monte Carlo with opponent models** (Mizukami and Tsuruoka, CIG 2015, riichi; [paper](https://www.logos.ic.i.u-tokyo.ac.jp/~tsuruoka/papers/cig2015mizukami.pdf)). Three regression models predict whether an opponent is one tile from winning, which tiles would complete their hand, and the hand's value. Each candidate discard is scored by simulated value, weighted by the chance it avoids feeding a win, minus expected loss. Simulated opponents are abstracted rather than given real hands. Folding uses a one-ply expected value, and moves take about one second. The authors put its stable rating (1718) at roughly the average level of Tenhou's Joukyuu (upper-level) table. A related line of work abstracts the game into several Markov decision processes to build tractable search trees ([Kurita and Hoki, arXiv 1904.07491](https://arxiv.org/abs/1904.07491)). The American translation: estimate how close each opponent is from their exposures and discards, estimate the danger of each tile, and compare "keep building" with "play safe." (High for the paper summary; Medium for the translation)
- **Determinization.** Perfect-information Monte Carlo samples the hidden information, solves each sample as if everything were visible, and averages. It has known theoretical weaknesses but works well in many card games ([Long et al., AAAI 2010](https://ojs.aaai.org/index.php/AAAI/article/view/7562)). Information Set MCTS builds its tree over information sets instead of states ([Cowling, Powley and Whitehouse, 2012](https://eprints.whiterose.ac.uk/75048/)). For a personal app, flat determinized rollouts with the heuristic policy for all four seats, run in a worker, are the realistic ceiling. Full ISMCTS is probably unnecessary. (Medium)
- **Expected value over draws.** Riichi "what to discard" calculators compute tenpai probability, win probability, and expected score per discard, turn by turn ([nekobean/mahjong-cpp](https://github.com/nekobean/mahjong-cpp), GPL-3.0). An American one-ply version averages the best resulting distance or score over the unseen-tile distribution for the next draw, which costs about 35 kinds x 1 scan per candidate discard. (Medium)
- **Deep reinforcement learning is out of scope.** Suphx uses deep RL with global reward prediction, oracle guiding, and run-time policy adaptation, and is rated above 99.99% of ranked Tenhou players ([arXiv 2003.13590](https://arxiv.org/abs/2003.13590)). Mortal is an open-source Rust deep-RL riichi AI under AGPL-3.0 ([GitHub](https://github.com/Equim-chan/Mortal)). Both need training pipelines and large models, and neither handles card-based American hands. Other platforms' marketing mentions "machine learning" bots for American, such as Mahjongg School per [Sloperama FAQ 5](https://www.sloperama.com/mjfaq/mjfaq05.html), but no technical details are published. I found no academic paper on American mahjong AI. (Medium: absence of evidence)

### 4.4 A bot design for this app

This is my synthesis.

**State value.** For a seat's own view (rack, own exposures, all visible tiles):

```
V = sum over the top K targets t (K about 10..15, after the exposure filter and dead-hand filter):
      weight(t) = (1 + value_t / 100) * 2^-(d_t - d_min) * outsFactor(t)
outsFactor(t) = min(1, liveOuts_t / max(1, d_t)) or a mahjong-iq-style binomial completion estimate
```

**Actions:**

- *Discard* the non-joker kind that maximizes V after removal, then subtract a defense penalty `lambda * danger(kind)`, where lambda grows as the wall shrinks and as any opponent reaches 3 or more exposures. If no reachable line remains, play safe: discard tiles dead or already visible, since a discarded joker is safe because it cannot be called ([AMJA](https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/jokers-and-joker-exchange/)), at the cost of a joker.
- *Charleston*: evaluate all non-joker 3-tile multisets (at most 286) and keep the set with the highest V of the kept tiles. Use the same method for courtesy counts 0 to 3, giving fewer tiles the closer the hand.
- *Call*: simulate the exposure and the forced discard. Call only if the exposure fits a still-reachable line, `d_min` strictly drops, and V rises by a margin. Raise the margin early in the wall, because an exposure reveals the hand and locks it in.
- *Joker exchange*: on its own turn, after drawing or calling, take any exchange where the natural given is not needed by the top targets, re-checking for Mah Jongg after each one.
- *Optional hard mode or coach*: determinized rollouts (Section 4.3) for the discard decision only, in a worker, using common random numbers across candidate actions.

### 4.5 Difficulty levels

| Knob | Easy | Medium | Hard | Source of idea |
|---|---|---|---|---|
| Decision noise (chance of picking among the top 4 to 5 instead of the best) | 35% | 5% | 0% | [nicknaiser LEVELS](https://github.com/nicknaiser/mahjong/blob/main/src/bot.js) |
| Uses live and dead tile counts | No | No | Yes | nicknaiser (`aware`) |
| Defense (danger penalty) | Off | Light | On, rising late | [modern-mahj expert](https://github.com/imon-stevenson/modern-mahj/blob/main/src/game/bots/expert.ts), nicknaiser |
| Calls exposures | Rarely or never | When distance drops | When distance drops and V clears a margin | [modern-mahj beginner](https://github.com/imon-stevenson/modern-mahj/blob/main/src/game/bots/beginner.ts) (never calls) |
| Joker exchanges | Never | Greedy | Evaluated, including taking jokers from an opponent close to winning | nicknaiser, modern-mahj |
| Charleston quality | Random non-jokers | Greedy marginal | Exhaustive 286-way | modern-mahj beginner, mahjong-iq |
| Lookahead | None | None | One-ply expected value or rollouts in a worker | Section 4.3 |
| Human response time on calls | Untimed | Generous | Shorter | [modern-mahj README](https://github.com/imon-stevenson/modern-mahj/blob/main/README.md) |

**Learning-path modes:**

- **Tutorial** uses fully scripted bots that play from the scenario file.
- **Guided practice** uses medium bots that never call on the human's key tiles, plus a coach that pins one or two target lines. ClaysonIO's "pick up to 2 lines" and the-mahjong-room's pinned-variant coach are the models.
- **Free play** uses a selectable difficulty and only the cheat sheet.

Apple's guidance suggests letting players adjust difficulty and reaction time, and minimizing time-boxed interface elements ([HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility.md)). That argues for untimed call prompts while learning. (High for the guidance; the mapping to modes is my suggestion)

---

## 5. Practical engineering

### 5.1 Seeds, shuffles, and replays

**PRNG choice.** JavaScript's `Math.random` cannot be seeded, so the engine needs its own PRNG.

- Mulberry32 is used by ClaysonIO ([tiles.js](https://github.com/ClaysonIO/american-mahjong/blob/main/js/tiles.js)) and modern-mahj ([rng.ts](https://github.com/imon-stevenson/modern-mahj/blob/main/src/game/rng.ts)). It is tiny, but bryc's PRNG notes say it has a 32-bit state (about a 4 billion period), "appears to skip a third of all 32-bit values," and recommend SplitMix32 or sfc32 for serious use.
- Sfc32 has 128 bits of state and passes PractRand and BigCrush. mahjong-iq uses it.
- For a human-readable seed, hash the seed string into the PRNG's state, as bryc suggests ([bryc PRNGs](https://github.com/bryc/code/blob/master/jshash/PRNGs.md)).

(High)

**Shuffle.** Use a Fisher-Yates shuffle driven by the seeded PRNG, as ClaysonIO and modern-mahj do. Avoid sort-based shuffles. (High)

**Separate random streams.** Derive one seed for the wall and one per bot for decision noise, for example seed+":wall" and seed+":bot2". Then changing bot behavior does not change the deal, and replays stay valid. (Medium, my recommendation)

**Saving as a decision log.** ClaysonIO saves the game in progress as {seed, dealer, decisions}, keeps a `RECORD_VERSION` to invalidate old logs when rules or bots change, rejects logs that no longer fit the deal, and stores finished games as snapshots for review ([record.js](https://github.com/ClaysonIO/american-mahjong/blob/main/js/record.js)). This needs deterministic bots or seeded bot streams. Seeds also make shareable "same deal" challenges possible ([mahjong-iq README](https://github.com/phishery/mahjong-iq/blob/main/README.md); ClaysonIO's `?seed=` parameter). (High)

### 5.2 Engine shape

The engine should be a pure, UI-free module with one entry point, `apply(state, seat, action) -> { state, events } | { violation }`. The-mahjong-room returns typed violations instead of throwing ([GAME_ENGINE.md](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/GAME_ENGINE.md)), and nicknaiser keeps state as plain JSON ([engine.js](https://github.com/nicknaiser/mahjong/blob/main/src/engine.js)).

- Bots and the human submit actions through the same path.
- Bots receive a "public plus own private" projection, so they cannot peek ([the-mahjong-room ARCHITECTURE](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/ARCHITECTURE.md); nicknaiser `unseenFor`).
- An alternative is ClaysonIO's "controllers" design: the game loop awaits a decision from each seat's controller, either the UI or a bot ([game.js](https://github.com/ClaysonIO/american-mahjong/blob/main/js/game.js)). This reads naturally, but it is harder to snapshot mid-decision than a reducer.

(High)

### 5.3 Turn-flow state machine

The phases below combine NMJL procedure from the [AMJA Charleston](https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/the-charleston/) and [claiming](https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/claiming-discarded-tile-exposure/) pages with the engines above:

```
DEAL (East 14, others 13)
  -> HEAVENLY_CHECK (East may declare before the Charleston)
  -> CHARLESTON_1: RIGHT -> ACROSS -> LEFT (blind pass of 1-3 allowed on LEFT)
  -> VOTE_SECOND (unanimous to continue; any player may stop it)
  -> CHARLESTON_2 (optional): LEFT -> ACROSS -> RIGHT (blind pass allowed on RIGHT)
  -> COURTESY (each across pair exchanges min(requested) of 0..3)
  -> PLAY: East discards first without drawing
     loop:
       CALL_WINDOW(discard): collect responses from eligible seats
         resolve: Mah Jongg beats exposure; ties go to the seat next in turn after the discarder
         if MAHJONG -> END
         if EXPOSE  -> caller exposes (size 3..6, called tile + naturals/jokers) -> TURN_ACTIONS(caller)
         else       -> next seat DRAW (if wall empty -> END wall game) -> TURN_ACTIONS
       TURN_ACTIONS(seat): [self-drawn Mah Jongg] | joker exchanges (any number) | discard
  -> END (Mah Jongg, or wall game)
```

Rules to encode:

- Jokers can never be passed in any Charleston or courtesy pass ([riichi_advanced american.md](https://github.com/EpicOrange/riichi_advanced/blob/main/documentation/american.md), [mahjong-iq RULES.md](https://github.com/phishery/mahjong-iq/blob/main/docs/RULES.md)).
- Kongs and quints draw no replacement tile.
- A discarded joker opens no call window.
- After a call, the caller discards without drawing.

**Implementation.** A hand-written discriminated-union phase field with a transition function is enough. XState v5 is an option if visual inspection and model-based tests are wanted ([XState docs](https://stately.ai/docs/xstate)). (High for rules; Medium for tooling)

**Calling windows with one human.** Bots answer instantly. Options:

- Pause only when the human has a legal call. ClaysonIO asks the human only about "discards you could do something with" ([record.js](https://github.com/ClaysonIO/american-mahjong/blob/main/js/record.js)).
- Always pause in learning modes, to teach the habit.
- Use a timer scaled by difficulty in free play (modern-mahj).

riichi_advanced and the-mahjong-room keep the window open until every eligible player answers, which is the simplest correct digital equivalent of the physical rule. (High)

**Hand-killing exposures.** Beginner modes can block them before they happen (the-mahjong-room), or allow them and let others declare the hand dead (riichi_advanced). (High)

### 5.4 Scripted scenario format for tutorials

None of the projects has a reusable, data-driven tutorial format. The-mahjong-room's tutorial is hand-coded steps with small interactive rehearsals ([tutorial.tsx](https://github.com/YakovYeger/the-mahjong-room/blob/main/src/learn/tutorial.tsx)). mahjong-atelier's practice stations are imperative per-step code with "Rule / Calculation / Heuristic" labels on each explanation ([practice.js](https://github.com/systemslibrarian/mahjong-atelier/blob/main/js/practice.js)). mahjong-iq uses deliberately selected "targeted" racks, labeled as such. I recommend a data file per scenario, with the engine running it. Field names are illustrative:

```json
{
  "id": "t05-joker-exchange",
  "card": "practice",
  "seed": "t05",
  "dealer": 0,
  "start": { "phase": "PLAY", "turn": 0, "step": "TURN_ACTIONS" },
  "racks": { "0": ["5C", "J", "..."], "1": ["..."] },
  "exposures": { "2": [{ "kind": "5C", "tiles": ["5C", "5C", "J"] }] },
  "discards": [],
  "wallTop": ["7D", "F", "N"],
  "fillRest": "seeded",
  "botScript": { "1": [{ "when": "turn", "do": { "discard": "9B" } }] },
  "steps": [
    { "expect": { "action": "jokerExchange", "tile": "5C", "fromSeat": 2 },
      "say": "Trade your natural 5 Crak for the joker in that exposure.",
      "onOther": "Not yet: look at the exposure across the table." },
    { "expect": { "action": "discard", "anyOf": ["9D", "WD"] },
      "explain": { "rule": "...", "calculation": "...", "heuristic": "..." } }
  ],
  "success": { "after": 2 }
}
```

**Rigged walls.** Place the specified racks, exposures, discards, and `wallTop` first. Remove those tiles from the 152-tile multiset, then shuffle the remainder with the scenario seed, so unscripted parts are random but repeatable.

**Validate every scenario in tests**, as jackwallner/mahj does for its drills ([AGENTS.md](https://github.com/jackwallner/mahj/blob/main/AGENTS.md)):

- per-kind totals within supply and 152 overall
- 13 or 14 tiles per seat as the phase requires
- no jokers in any scripted pass
- every expected action legal in the engine at that point
- the scenario reaches its success step when the expected actions are applied

(Medium: proposal)

### 5.5 Testing a rules engine

- **Rule unit tests.**
  - jokers fill groups but never singles or pairs
  - Soap as zero
  - exposures rule out concealed lines and lines without a matching group
  - call priority
  - a discarded joker is not callable
  - Charleston directions and blind-pass limits
  - scoring tables

  ClaysonIO's test list is a compact model ([mahjong.test.js](https://github.com/ClaysonIO/american-mahjong/blob/main/test/mahjong.test.js)). mahjong-mania specifies exact payout tables ([SPEC section 10.7](https://github.com/joshbelot/mahjong-mania/blob/main/docs/SPEC.md)). (High)
- **Property tests against a brute-force solver.** Generate random small racks, targets, and exposures, compare the fast matcher with exhaustive assignment, and use a fixed seed (mahjong-mania requires 500 cases). fast-check generates inputs and shrinks failures to minimal cases ([fast-check](https://fast-check.dev/docs/introduction/)). (High)
- **Whole-game invariant simulations.**
  - ClaysonIO: 40 computer-only games
  - the-mahjong-room: `simulate-games --count=100`, flagging invalid or stalled games ([simulation.ts](https://github.com/YakovYeger/the-mahjong-room/blob/main/src/game/simulation.ts))
  - dadarcade: 100 four-bot hands with tile-conservation checks
  - mahjong-iq: tile conservation checked on every transition

  Check 152 tiles at all times, legal hand sizes, termination, and that every declared win re-validates. (High)
- **Card validation.** Check 14 tiles per variant, supply, and variant counts per section (mahjong-iq `validate-card`), plus a notation round trip (mahjong-mania). (High)
- **Replay determinism.** Replay a saved log and expect an identical game, and reject logs that no longer fit (ClaysonIO). (High)
- **Statistical checks.** Monte Carlo estimates should match closed-form hypergeometric cases within a few standard errors (mahjong-iq). (High)
- **Behavior specs and end-to-end tests.** Gherkin feature files can double as readable rule documentation ([lhbergen jokers.feature](https://github.com/lhbergen/mahjong-ai-engine/blob/main/mahjong-engine/src/test/resources/features/jokers.feature)). Playwright can run full browser rounds (mahjong-iq). (High)
- **Performance guard.** A loose timing test, such as mahjong-mania's 250 ms bound, keeps regressions out. (High)

---

## 6. Recommended technical approach

### 6.1 Recommendation

**Language and structure.** Use TypeScript (strict) with Vite for the dev server and static build, and Vitest for tests. Keep the engine (tiles, card compiler, matcher, rules reducer, bots, coach) as dependency-free TypeScript modules with no DOM access. The UI layer can be a small framework (Preact or React) or plain DOM.

**Tiles** are inline SVG.

**Storage:**

- `localStorage` for settings and learning progress, wrapped in try/catch
- IndexedDB only if game history grows large
- a versioned save format
- an "export or import progress" JSON backup

**Delivery.** Deploy as a static PWA, and add it to the iPhone Home Screen. The owner's 2026 card lives in a separate JSON or text file loaded at startup or imported in the app, never in a public repository. Ship an invented practice card for tests and the tutorial.

### 6.2 Trade-offs

| Choice | Option A | Option B | Notes |
|---|---|---|---|
| Language | TypeScript with Vite (modern-mahj, mahjong-iq, the-mahjong-room) | Plain JS modules, no build (ClaysonIO, mahjong-atelier) | TypeScript catches the shape errors an AI-written engine is prone to, and Vite builds with one command. No build is simpler to host and inspect, and ClaysonIO shows a complete game in about 1,800 lines. A middle path is JS with JSDoc types and `// @ts-check`, which mahjong-atelier approximates with `.d.ts` files. (High for the examples; Medium for the judgment) |
| UI | React or Preact with one store (modern-mahj uses Zustand) | Plain DOM rendering from state (ClaysonIO) | React is what AI coders know best. Plain DOM keeps the bundle tiny. Keep the engine separate either way. |
| Rendering | DOM plus inline SVG tiles | Canvas or a game engine with PNG sprites (pauls-gh uses Phaser and a sprite sheet) | SVG stays crisp on Retina screens, can be themed, and supports accessible labels and normal touch events. Canvas suits heavy animation, which this app does not need. |
| Tile art source | Draw your own SVG faces, or adapt the CC0 [FluffyStuff riichi tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles) (suits, winds, dragons, front, back, blank) | Unicode Mahjong Tiles block U+1F000 to U+1F02F, which includes flowers U+1F022 to 1F025, seasons, joker U+1F02A, and back U+1F02B ([Unicode chart](http://www.unicode.org/Public/18.0.0/charts/PDF/U1F000.pdf)) | FluffyStuff has no flowers or jokers, and riichi faces lack the English indices American players expect. mahjong-atelier adapted some FluffyStuff faces and drew its own dots, flowers, and joker with "readable English indices" ([THIRD_PARTY_NOTICES](https://github.com/systemslibrarian/mahjong-atelier/blob/main/THIRD_PARTY_NOTICES.md)). I could not verify how well iPhone fonts render the Unicode glyphs (Low), so do not rely on them. |
| Saving | Snapshot of state | Seed plus decision log (ClaysonIO) | Logs are tiny and allow replay and analysis, but break when bots or rules change. Store both, as ClaysonIO does for finished games. |
| Storage | `localStorage` | IndexedDB | Wrap every access; mahjong-iq notes its app "still works in private windows." The-mahjong-room stores "one versioned checkpoint" on the device for guests. |

### 6.3 iPhone and Mac specifics

**Storage survival.** Safari's tracking prevention deletes a site's script-writable storage (localStorage, IndexedDB, service worker caches) after 7 days of Safari use without interacting with that site. Home Screen web apps are exempt and track their own days of use ([WebKit, 2020](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)). Since Safari 17, `navigator.storage.persist()` is supported, and WebKit grants it based on heuristics such as being opened as a Home Screen web app ([WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)). Recommend Home Screen installation, call `persist()`, and offer an export file. (High)

**Offline and updates.** A manifest plus a service worker gives offline play. ClaysonIO stamps its service worker with each commit, so updates arrive one visit late, and fails a test if a file is missing from the cache list. modern-mahj shows a "new version available" prompt and keeps the game in progress across reloads. (High)

**Layout.** Fourteen tiles across a 390-point-wide iPhone screen leave about 26 points per tile, below Apple's 44 x 44 point default and 28 x 28 point minimum control sizes ([HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility.md)). Plan for:

- a two-row rack in portrait, or landscape play
- tap-to-select with an explicit Discard button, not drag-only
- sort and arrange controls

modern-mahj requires a viewport at least 1000 pixels wide (desktop or tablet landscape) ([README](https://github.com/imon-stevenson/modern-mahj/blob/main/README.md)). The-mahjong-room verified 390 and 360 pixel widths ([CARD_DESIGN.md](https://github.com/YakovYeger/the-mahjong-room/blob/main/docs/CARD_DESIGN.md), coach doc). Design for phone first. (High for the facts; Medium for the advice)

**Performance.** Heuristic analysis is cheap (Section 3.6). Put any Monte Carlo in a Web Worker, as mahjong-iq does, and cache results per rack. (High)

---

## 7. Open questions and weak spots

- **Discovery coverage.** GitHub's search API and code search were blocked in this environment, and the web-search budget ran out near the end. There may be relevant repositories, for example on GitLab or not indexed, that I did not find. BadTowers/american-mahjong could not be fetched. pvcomms/maj-companion could not be cloned, so its details come from its GitHub page only.
- **Quality of the projects.** Most are from 2026, often AI-assisted, with few commits. Completeness was judged by reading code and docs, not by running the apps.
- **Variant counts for the 2026 card.** The 1,077 figure comes from a blog crediting EightBam, with no stated counting rules (for example, whether "-or-" layouts or symmetric suit swaps are deduplicated). The engine's own expansion of the owner's card should be the reference.
- **No American-specific AI literature found.** The research cited is riichi-focused. The claim that its ideas transfer is my inference.
- **iPhone measurements.** JavaScript speed and Unicode tile-glyph rendering on iPhone were not measured.
- **Rule variants the owner should settle:**
  - blind passes and courtesy pass in the app
  - jokerless bonus (doubles, except Singles and Pairs, whose value already includes it per Sloperama)
  - Heavenly and Earthly hands
  - dead-hand handling (block, warn, or penalize)
  - whether exposures can be resized before discarding
  - payment rules (discarder pays double; self-drawn, everyone pays double)
- **Card notation coverage.** The proposed two-layer schema should be tried against the owner's physical card early. Lines with floating pairs, "any dragon," or suit exceptions are the likely edge cases.
- **Not legal advice.** Keeping a personally transcribed card private, off any public repository, follows what careful projects do. Whether that is enough for the owner's purposes is outside this research.

---

## Sources (consolidated)

Repositories and project docs:

- [ClaysonIO/american-mahjong](https://github.com/ClaysonIO/american-mahjong)
- [imon-stevenson/modern-mahj](https://github.com/imon-stevenson/modern-mahj)
- [phishery/mahjong-iq](https://github.com/phishery/mahjong-iq)
- [YakovYeger/the-mahjong-room](https://github.com/YakovYeger/the-mahjong-room)
- [nicknaiser/mahjong](https://github.com/nicknaiser/mahjong)
- [pauls-gh/mahjong](https://github.com/pauls-gh/mahjong)
- [EpicOrange/riichi_advanced](https://github.com/EpicOrange/riichi_advanced)
- [joshbelot/mahjong-mania](https://github.com/joshbelot/mahjong-mania)
- [pvcomms/maj-companion](https://github.com/pvcomms/maj-companion)
- [EricTams/Mahjong](https://github.com/EricTams/Mahjong)
- [systemslibrarian/mahjong-atelier](https://github.com/systemslibrarian/mahjong-atelier)
- [lhbergen/mahjong-ai-engine](https://github.com/lhbergen/mahjong-ai-engine)
- [jackwallner/mahj](https://github.com/jackwallner/mahj)
- [andrewjwinig-bot/mahjong-tracker](https://github.com/andrewjwinig-bot/mahjong-tracker)
- [benjamin051000/mahjongg](https://github.com/benjamin051000/mahjongg)
- [sammchugh-gif/godot-games PR #150](https://github.com/sammchugh-gif/godot-games/pull/150)
- [dragonpony1/gnome-vault PR #4](https://github.com/dragonpony1/gnome-vault/pull/4)
- [woolfscottkevin-commits/dadarcade PR #2](https://github.com/woolfscottkevin-commits/dadarcade/pull/2)
- [FluffyStuff/riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles)

Rules and card reading:

- [AMJA Charleston](https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/the-charleston/)
- [AMJA claiming and exposures](https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/claiming-discarded-tile-exposure/)
- [AMJA jokers](https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/jokers-and-joker-exchange/)
- [Sloperama 2026 card FAQ](https://www.sloperama.com/mjfaq/2026.html)
- [Sloperama FAQ 5, software](https://www.sloperama.com/mjfaq/mjfaq05.html)

Card statistics:

- [EightBam best sections](https://eightbam.com/best-sections/)
- [EightBam probability](https://eightbam.com/probability/)
- [Missy Mahjong 2026 card statistics](https://www.missymahjong.com/post/nmjl-2026-card-statistics)

Closed-source tools (behavior only):

- [Mahjong Hand Helper how-to](https://mahjonghandhelper.com/howto.html)
- [mahjongg.ai.studio tools](https://mahjongg.ai.studio/tools/)

AI research:

- [Suphx](https://arxiv.org/abs/2003.13590)
- [Mortal](https://github.com/Equim-chan/Mortal)
- [Mizukami and Tsuruoka 2015](https://www.logos.ic.i.u-tokyo.ac.jp/~tsuruoka/papers/cig2015mizukami.pdf)
- [Kurita and Hoki 2019](https://arxiv.org/abs/1904.07491)
- [Long et al. 2010 (PIMC)](https://ojs.aaai.org/index.php/AAAI/article/view/7562)
- [Cowling et al. 2012 (ISMCTS)](https://eprints.whiterose.ac.uk/75048/)
- [nekobean/mahjong-cpp](https://github.com/nekobean/mahjong-cpp)
- [riichi.wiki Ukeire](https://riichi.wiki/Ukeire)

Engineering:

- [bryc PRNG notes](https://github.com/bryc/code/blob/master/jshash/PRNGs.md)
- [fast-check](https://fast-check.dev/docs/introduction/)
- [XState](https://stately.ai/docs/xstate)
- [WebKit 7-day storage cap](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility.md)
- [Unicode Mahjong Tiles chart](http://www.unicode.org/Public/18.0.0/charts/PDF/U1F000.pdf)
