# 07. App Build Spec

How to turn the research into a working app. Written for the build chat. Rules come from 01-rules, card facts from 03-card-2026, coaching and opponent behavior from 04-strategy, lessons from 05-teaching-plan, visuals from 08-design-ideas. Confidence tags: [H] high, [M] medium, [L] low.

---

## 0. Key recommendations

1. **A web app (TypeScript) that runs in Safari on your Mac and iPhone.** No App Store. The game engine is plain TypeScript with no screen code in it, so it can be tested on its own. Tiles are drawn as SVG. (Section 2)
2. **The card is data, not code.** The app ships with an invented practice card for the tutorial and tests. The real 2026 hands go in their own data file, entered from your photo (03-card-2026, section 7), and ship with the app. A 2027 card next spring is just a new file.
3. **Expand every card line into all of its concrete hands** (about 1,077 for the 2026 card) and do all checking against those. Win checks, "tiles away," hand suggestions, claim legality, dead hands, and bots all become simple counting. Every serious open-source engine converges on this. [H]
4. **The engine is the referee.** It prevents illegal moves and explains why, instead of penalizing them. Learning modes always wait for the player.
5. **Build and test the rules engine before the visuals.** Property tests against a brute-force checker, plus thousands of bot-only games that confirm all 152 tiles are always accounted for.
6. **Study the existing open-source projects first** (section 1). Borrow ideas, not code.

## 1. Prior art to study

About a dozen public American mah jongg projects exist, most built in 2026. [H] (technical research, October 26, 2026; repositories read, not run)

| Project | What to learn from it | License |
|---|---|---|
| [ClaysonIO/american-mahjong](https://github.com/ClaysonIO/american-mahjong) | Closest to this app: complete solo game against 3 bots in about 1,800 lines of plain JavaScript; a "Learning" mode that marks suggested lines and missing tiles; seeded games saved as seed plus decisions; 40 bot-only games as a test | MIT |
| [imon-stevenson/modern-mahj](https://github.com/imon-stevenson/modern-mahj) | Best typed hand schema (validated JSON); exact matcher after fixing a greedy-fill bug; three bot levels behind one interface | None stated (ideas only) |
| [phishery/mahjong-iq](https://github.com/phishery/mahjong-iq) | Most rigorous: card format document and validator, private-card folder kept out of the repo, Monte Carlo checked against exact math, Charleston drills | None stated |
| [YakovYeger/the-mahjong-room](https://github.com/YakovYeger/the-mahjong-room) | Closest to our learning goals: guided first game, coach panel, 8-step tutorial, a rules scope document, and the best write-up of coach pitfalls | None stated |
| [joshbelot/mahjong-mania](https://github.com/joshbelot/mahjong-mania) | The best "spec to hand an AI coder": a 1,700-line spec with a card grammar, algorithms, danger model, payout tables, and a required brute-force property test | None stated |
| [nicknaiser/mahjong](https://github.com/nicknaiser/mahjong) | Whole game as one JSON state changed by `apply(state, seat, action)`; bots see only their seat's view; three difficulty presets | ISC |

Others worth a glance: pauls-gh/mahjong (2018 to 2020, an early data model), EpicOrange/riichi_advanced (mature multi-variant engine; AGPL, so ideas only), EricTams/Mahjong (odds trainer), jackwallner/mahj (a test suite that validates every scripted drill).

Notes:

- Several projects bundle transcribed NMJL cards with the app. That's fine here too: the hands are unprotectable game rules (your settled position), so the card data needs no special handling.
- Projects without a license reserve all rights by default, so read them for ideas only and write our own code. [H]
- Existing American bots are all hand-written rules (heuristics). No one uses trained AI models, and no academic work on American mah jongg AI was found. [H for the projects; M for the absence]

## 2. Platform and delivery

**Stack** (recommended) [M]:

- TypeScript (strict) with Vite for building and Vitest for tests. The engine modules have zero dependencies and no DOM access.
- UI: plain DOM or a small library (Preact). Keep it separate from the engine either way.
- Tiles: inline SVG drawn in code (crisp on Retina screens, themeable, accessible labels). Don't rely on the Unicode mah jongg characters; their iPhone rendering is unverified.
- A lighter alternative: plain JavaScript with JSDoc types and `// @ts-check` (ClaysonIO shows a full game this way).

**Where it lives** (decide with you):

- **Option A, private Claude artifact.** Opens on Mac and iPhone through Claude with no hosting account. Progress can use the artifact's own data storage so it follows you between devices. Check how well landscape play works inside the Claude app on iPhone.
- **Option B, Home Screen web app (PWA)** on a static host. Works offline once installed. On iPhone, Safari deletes a site's saved data after 7 days without use **unless the app is added to the Home Screen**; also call `navigator.storage.persist()` and offer a progress export file. [H] ([WebKit, 2020](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/); [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/))
- Either way: ship both the invented practice card and your 2026 card inside the app as separate data files, so next year's card is a drop-in replacement.

**iPhone layout** [H]: 14 tiles across a 390-point portrait screen is about 26 points per tile, below Apple's 44-point recommended tap size. So: play in landscape, or use a two-row rack in portrait; tap to select plus an explicit Discard button (not drag-only); sort and arrange buttons. ([Apple HIG, Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility))

## 3. Architecture

- **One engine entry point**: `apply(state, seat, action)` returns either `{ state, events }` or a typed `violation` (with a plain-English reason the coach can show). Bots and the human submit actions the same way. [H] (the-mahjong-room, nicknaiser)
- **Seat views**: bots receive only what their seat could see (public table plus own rack). They never peek. [H]
- Modules:

| Module | Job |
|---|---|
| `tiles` | 36 tile kinds, codes, names, sort order, the 152-tile set |
| `rng` | Seeded random streams and Fisher-Yates shuffle |
| `card` | Parse entry notation, compile to JSON, validate, expand to concrete targets |
| `matcher` | Win check, tiles away, outs, live and dead targets, exposure filter, claims, joker exchanges, tile allocation for display |
| `engine` | The state machine and `apply()` |
| `bots` | Computer opponents (three levels) |
| `coach` | Suggestions and explanations |
| `tutorial` | Runs scripted lesson files |
| `progress` | Saves, settings, stats, graduation |
| `ui` | Rendering, input, animation, cheat sheet |

## 4. Data model

### 4.1 Tiles

- 36 kinds: 27 suited (`1B` to `9B` Bams, `1C` to `9C` Craks, `1D` to `9D` Dots), 4 winds (`N`, `E`, `W`, `S`), 3 dragons (`RD`, `GD`, `WD` where `WD` is Soap and also zero), `F` (flower), `J` (joker).
- A rack is a count vector of 36 numbers. Supply: 4 of each kind, except 8 flowers and 8 jokers, for 152 total. Keep physical tile IDs (0 to 151) separately for animation and logs. [H]
- Dragon-suit links: `RD` with Craks, `GD` with Bams, `WD` with Dots.

### 4.2 Card format: two layers

**Layer 1, entry notation** (what gets typed from your photo; one line per printed line) [M, synthesized from several projects]:

```
# section | value | X or C | pattern [| -or- pattern] | options
Runs | 25 | X | FF 1111g 2222g 3333r | slide
```

(That line is invented.) Rules:

- Ink letters `g`, `r`, `b` record the printed color of number tiles and `D`. The compiler maps colors to suit variables A, B, C. `F`, `N`, `E`, `W`, `S`, and `0` ignore color (they are suitless even though printed in blue).
- Digits are the example numbers as printed. A `D` takes the suit of its color.
- Options state what the small print allows: `slide` (all numbers shift together), `slide2` (shift by even steps), `nums x=1,3,5` (explicit choices), `dragon=any|matching|opposite`, `wind=any`, `pairsuit=any|notA`, `float=pair`.
- Escape hatch: write variables (`x`, `x+1`, `y`) instead of digits for anything the options can't say.

**Layer 2, compiled JSON** (what the engine loads; validated at load time):

```json
{
  "schemaVersion": 1,
  "card": { "id": "practice", "year": 2026, "source": "invented" },
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

- Tile types: `num` (suit variable or fixed suit; number literal or variable plus offset), `dragon` (`of` a suit variable, a fixed color, or a variable for "any"), `wind` (fixed or variable), `flower`, `zero` (compiles to `WD`).
- Groups: size 1 to 6 (a sextet is the largest legal group, flowers included); the validator rejects anything larger. Optional `jokers: "never"` override.
- Constraints: distinct suits (default), free suits that may coincide, number domains (odd, even, explicit sets), distinct numbers, "suit not equal to," wind and dragon domains.
- `alternatives` handles "-or-" lines and floating pairs.
- `jokerlessBonus` is derived: false for Singles and Pairs and for Quints (01-rules, section 13).
- Record `source` (invented, or user-supplied) on every card file. [H] (mahjong-iq)

**Validation at load** [H]: every alternative totals 14; at most 3 suits; every concrete target respects supply (natural-only demand at most 4 per kind, 8 for flowers; joker-eligible demand coverable by copies plus 8 jokers); each line has at least one valid target (example: a hand cannot use Dots if that would need 5 Soaps); unique IDs; the display string round-trips; print variant counts per section for a sanity check. Validate live while typing and say what is wrong ("this line adds up to 13 tiles"). Escape any user-typed text before showing it as HTML.

### 4.3 Concrete targets

Expansion gives `{ lineId, value, concealed, jokerlessBonus, groups: [{ kind, size }] }` plus precomputed per-kind counts: `plain[k]` (sizes of singles and pairs) and `flex[k]` (sizes of groups of 3 or more). Deduplicate symmetric suit swaps with a sorted signature.

Expected counts for the 2026 card [M] (EightBam via [Missy Mahjong](https://www.missymahjong.com/post/nmjl-2026-card-statistics); matches Gilligan's independent total): about 1,077 targets. By section: Year 30, 2468 66, Like Numbers 135, Quints 264, Runs 315, 13579 81, Winds-Dragons 107, 369 48, Singles and Pairs 31. Neither source defines what counts as one hand, so define the app's unit first (suggested: a distinct set of 14 natural tiles after removing suit swaps that give the same tiles) and treat 1,077 as a soft cross-check. The real check is line-by-line verification against your photo (03-card-2026, section 7).

### 4.4 Game state

Plain JSON: seats with winds; dealer; wall (ordered tile IDs); each player's rack, exposures (kind, size, which IDs are jokers), discards, dead flag; phase; turn; last discard and call window; event log; seeds; session scores. Plain JSON can be saved, restored, and diffed easily. [H]

## 5. Core algorithms

### 5.1 Exact win check (per tile kind, not group by group) [H]

For one target, after matching the player's exposures to groups of the same kind and size (concealed targets accept no exposures):

```
for each kind k:  have = rack[k] (naturals);  need plain[k] naturals for singles and pairs
    if have < plain[k]: fail                 # singles and pairs need real tiles
    if have > plain[k] + flex[k]: fail       # a real tile would be left over
    jokerShort += plain[k] + flex[k] - have
win if jokerShort == jokers in rack          # every tile used exactly once
```

Why this is exact: jokers can only fill groups of 3 or more, and real tiles of kind k can only fill slots of kind k, so real tiles must go to the singles and pairs of k first; the rest are interchangeable. Filling group by group is a known bug source (two projects had to fix it). [H]

### 5.2 Tiles away, outs, ranking [H]

```
missPlain += plain[k] - min(have, plain[k])
missFlex  += flex[k]  - min(have - usedPlain, flex[k])
tilesAway = missPlain + max(0, missFlex - jokers)
```

- With 13 tiles held, the minimum is 1; with 14, 0 means Mah Jongg.
- **Outs** = unseen copies that would lower tiles away (live copies of missing kinds, plus live jokers where a big group is short).
- Rank suggestions by: still possible, then fewer tiles away, then fewer missing singles and pairs (jokers can't help those), then more outs, then higher value. (mahjong-mania)
- Report the best target per card line, plus its missing tiles.

### 5.3 Live tiles, blocked targets, dead hands [H]

Keep two different ideas apart (from the independent fact check, `research/factcheck.md`, finding P1):

- **Privately blocked** (used by bots and the coach, never announced): from one player's own view, live copies of a tile = supply minus copies in their own rack, all exposures, and all discards. A target is blocked for that player if a missing single needs more copies than are live, a missing pair needs 2 but fewer remain, or the missing big-group slots exceed live naturals plus jokers they could still get. **Jokers sitting in exposures still count as obtainable** (anyone holding the matching natural can exchange for them), so never treat exposed jokers as gone. A player whose every target is privately blocked keeps playing; a bot switches to defense, and the coach can tell the learner.
- **Officially dead** (01-rules, section 11): judged only from what the whole table can see: the player's exposures plus all discards and exposures, never their hidden tiles. Grounds: wrong tile count; exposures matching no line, or only concealed lines; an illegal exposure left in place when the player discards; a joker redeemed without 14 tiles; or no line fitting their exposures remains possible on visible evidence (a needed single with all 4 copies visible; a needed pair with 3 of 4 visible, or 7 of 8 flowers; big groups must account for all 8 jokers). A dead player stops picking and discarding but still pays the winner.
- Check both after every action. If three players are dead, end the game with no payments and redeal (the NMJL's January 2024 recommendation).

### 5.4 Claims, exposures, joker exchanges [H]

- Mah Jongg claim: legal if adding the discard makes some fitting target complete (allowed even when it fills a single or pair, and for concealed hands).
- Exposure claim: legal if some fitting, non-concealed target has a remaining group of that kind with size 3 or more, and the player holds enough of that kind plus jokers to fill it. The claimer picks the size and joker count. Afterward at least one target must still fit; block it in learning modes, with a settings choice for free play.
- Priority: Mah Jongg beats exposure; ties go to the seat next in turn after the discarder. A discarded joker opens no window. After an exposure the claimer discards without drawing; play resumes to the claimer's right.
- Joker exchange: on your own turn with 14 tiles, swap a natural for any exposed joker standing for that kind; repeatable; re-check for Mah Jongg after each. A joker just redeemed can't join an exposure made that turn.
- Exposure size and makeup may change until the owner discards (back of the 2026 card) or starts a joker exchange (AMJA's reading), whichever comes first; after that it is locked for the game. Pungs can't be upgraded later and an exposure's tile kind never changes.

### 5.5 Showing which tile goes where

For hints and the win screen, allocate real tiles to singles and pairs first, then to larger groups, then jokers to the larger groups still short. [H] (ClaysonIO, modern-mahj)

### 5.6 Performance [M]

A full scan of about 1,100 targets took about 26 microseconds and choosing a discard about 0.4 milliseconds in a server benchmark (not measured on iPhone). So heuristics can run on every tap. Exhaustive Charleston search is affordable: at most 286 three-tile choices. Any Monte Carlo goes in a Web Worker.

## 6. Game flow (state machine)

```
DEAL (East 14, others 13) -> HEAVENLY_CHECK (East declares at once; Charleston skipped; paid as self-pick)
-> CHARLESTON_1: RIGHT -> ACROSS -> LEFT (blind pass 1 to 3 allowed on LEFT)
-> VOTE (any player may stop) -> CHARLESTON_2: LEFT -> ACROSS -> RIGHT (blind pass allowed on RIGHT)
-> COURTESY (each across pair exchanges the lower of their two requests, 0 to 3)
-> PLAY: East declares Mah Jongg if complete (self-pick payment, labeled choice), otherwise discards without drawing
   loop: CALL_WINDOW (collect answers; Mah Jongg beats exposure; ties to next in turn)
         -> MAHJONG -> END | EXPOSE -> caller's TURN_ACTIONS | else next seat DRAWS (empty wall -> wall game)
         TURN_ACTIONS: self-drawn Mah Jongg | joker exchanges | discard
-> END -> SCORE -> NEXT_GAME (deal passes right)
```

- Jokers can never be selected in any pass. No replacement tile after a kong or quint.
- Blind passes: resolve the chain in seat order; if all four forward all three, nobody's tiles change (2020 IOU rule).
- Call windows with one human: bots answer instantly. In learning modes, always pause for the player. In free play, pause only when the player has a legal call (ClaysonIO), with an optional timer.
- After every action, assert all 152 tiles are accounted for.

## 7. Computer opponents

**Value of a position** (for a seat's own view) [M, synthesized]:

```
V = sum over the top 10 to 15 fitting, unblocked targets t:
      (1 + value_t / 100) * 2^-(tilesAway_t - best) * outsFactor_t
```

- **Discard**: the non-joker tile that leaves the highest V, minus a danger penalty that grows as the wall shrinks and when an opponent has 3 or more exposures. When every line is privately blocked (section 5.3), play safe (tiles already dead or visible).
- **Charleston**: try every 3-tile set (at most 286), keep the set that leaves the highest V. Courtesy: offer fewer tiles the closer the hand. Second Charleston vote: continue if best tiles away is 5 or more (ClaysonIO's rule of thumb).
- **Calls**: simulate the exposure plus the forced discard; call only if the exposure fits a reachable line, best tiles away drops, and V rises by a margin (larger early in the wall, because exposing reveals and locks the hand).
- **Joker exchange**: take it when the natural given is not needed by the top targets.
- **Weighting**: distance alone over-values Quints (they almost never finish: 0.04% in EightBam's 10-million-game simulation; 12 of 5,328 wins in Gilligan's). Weight by outs or completion likelihood. [M]

**Difficulty knobs** [H for where the ideas come from; M for the numbers]:

| Knob | Level 1 Gentle | Level 2 Steady | Level 3 Sharp |
|---|---|---|---|
| Hand choice | Commits to one hand after the Charleston | Keeps 2 to 3 hands open | Same, plus drops blocked hands early |
| Decision noise (picks among top 4 to 5) | 35% | 5% | 0% |
| Live-tile counting | No | No | Yes |
| Defense | Off | Light | On, rising late in the wall |
| Calls | Rarely | When tiles away drops | When tiles away drops and V clears a margin |
| Joker exchanges | Never | When it helps | Evaluated, including keeping jokers from a player near Mah Jongg |
| Charleston | Simple greedy | Greedy | Exhaustive |
| Lookahead | None | None | Optional one-step expected value |

Mode mapping: tutorial uses scripted bots; guided match 1 level 1, match 2 level 2, match 3 a mix of 2 and 3; free play is your choice. Calls are untimed while learning (Apple accessibility guidance favors adjustable timing).

Ideas borrowed from other apps (06-existing-apps):

- Give bots persona names that hint at their strength (NMJL Online names its beginner bots Betty, Bianca, Barbara and its advanced bots Alice, Angie, Andy).
- In the very first guided match, bots can be set to never declare Mah Jongg (Eight Bam's default), so the learner can always finish a hand.
- Reveal every bot's hand after each game, with a one-line note on what each was going for.
- Show win-rate context: against three equal bots with about 10% wall games, about 22% wins is par.

**Pitfalls others hit** [H]:

- Ranking tiles with one card-wide usefulness table makes every bot pass the same junk around the table. Rank against each rack's own candidate hands.
- Bots that call without checking that all their exposures still fit one line end up with unusable pungs.

## 8. Coach (guided modes)

The coach uses the same matcher as the bots, on the player's own view:

- After the deal: your closest hands with tiles-away counts; let the player pin one or two target lines (ClaysonIO's "pick up to 2 lines").
- Charleston: suggests 3 tiles to pass with a one-line reason; explains blind pass and the stop vote.
- Each turn: suggests a discard and why; warns about feeding a visible exposure.
- Discard window: says when a claim is legal and whether it is wise.
- Joker exchanges: points them out.
- Rule reminders appear the first time each situation comes up.
- Hints fade across the guided matches (05-teaching-plan).

Coach mistakes others documented, to avoid [H] (the-mahjong-room coach audit):

- Recommending a discard the player's pinned hand needs.
- Fixed bonuses for pairs and jokers instead of re-running the exact allocation for each candidate.
- Choosing the 3 Charleston tiles one at a time instead of judging the set together.
- Checking only the first legal call option.
- Ignoring tiles already dead in the discards.
- Giving tile advice during a non-tile decision (like the stop vote).
- Overstating confidence: present rules as facts and hand advice as suggestions.

## 9. Tutorial scenario engine

None of the existing projects has a reusable, data-driven tutorial format; make one. [M] Each lesson is a file:

```json
{
  "id": "t05-joker-exchange",
  "card": "practice",
  "seed": "t05",
  "start": { "phase": "PLAY", "turn": 0, "step": "TURN_ACTIONS" },
  "racks": { "0": ["5C", "J", "..."] },
  "exposures": { "2": [{ "kind": "5C", "tiles": ["5C", "5C", "J"] }] },
  "wallTop": ["7D", "F", "N"],
  "fillRest": "seeded",
  "botScript": { "1": [{ "when": "turn", "do": { "discard": "9B" } }] },
  "steps": [
    { "expect": { "action": "jokerExchange", "tile": "5C", "fromSeat": 2 },
      "say": "Trade your 5 Crak for the joker in that exposure.",
      "onOther": "Not yet. Look at the exposure across the table." }
  ],
  "success": { "after": 1 }
}
```

- Rigged setups: place the listed racks, exposures, discards, and top of wall, remove those tiles from the set, then shuffle the rest with the lesson seed so it is random but repeatable.
- Steps can restrict allowed actions, highlight tiles, and check the expected action.
- Test every lesson automatically: tile counts within supply and 152 total; 13 or 14 tiles per seat as the phase requires; no jokers in scripted passes; each expected action legal at that point; the lesson reaches its success step. [H] (jackwallner/mahj does this for its drills)

## 10. Saving, replay, progress

- **RNG**: use sfc32 (128-bit state) seeded from a hash of a readable seed string; mulberry32 is common but weaker. Use separate streams (wall, each bot) so changing a bot doesn't change the deal. [H] ([bryc PRNG notes](https://github.com/bryc/code/blob/master/jshash/PRNGs.md))
- **Saving a game**: seed plus the human's decisions (tiny, replayable, needs deterministic bots), with a version number so old saves are rejected cleanly when rules or bots change; also store a full snapshot for finished games. [H] (ClaysonIO)
- **Progress**: lessons done, guided matches done, graduated, settings, stats (games, wins, wins by section, average tiles away after the Charleston). Export and import as a JSON backup.

## 11. Testing

- **Rule unit tests**: jokers never in singles or pairs; Soap as zero; exposures exclude concealed and non-matching lines; claim priority; discarded jokers not claimable; Charleston directions and blind-pass limits; payment tables.
- **Property tests**: random small racks, targets, and exposures; the fast matcher must agree with an exhaustive brute-force assignment (500 or more cases, fixed seed; fast-check can generate and shrink failures). [H]
- **Simulation**: thousands of bot-only games with fixed seeds; assert 152 tiles at all times, legal hand sizes, every game ends, and every declared win re-validates. Compare rough statistics with Gilligan's 2026 results (about 11% wall games, about two thirds of wins on discards, about 67 discards per game). Big differences suggest bugs.
- **Card validation** and the notation round trip (section 4.2).
- **Replay determinism**: replaying a saved log gives the identical game.
- **Scenario validation** (section 9).
- **Performance guard**: a loose timing test (for example 250 ms for a full analysis) so slowdowns get caught.

## 12. Suggested build order

1. Tiles, RNG, card compiler and validator, practice card, expansion tests.
2. Matcher with unit and property tests.
3. Engine state machine with level 2 bots; bot-only simulation tests.
4. Minimal UI: rack, discards, exposures, action buttons, cheat sheet.
5. Coach and guided-match mode.
6. Tutorial engine and the lessons in 05-teaching-plan.
7. Custom tile art and polish (08-design-ideas).
8. Enter the real 2026 card from your photo; verify line by line against generated examples.
9. Level 1 and 3 bots, stats, settings, saved games, export.

## 13. Practice card (invented hands for the tutorial and tests)

Made up for teaching. They imitate the general style of a card so lessons can teach card reading, but they are not NMJL hands. Here: digits are tiles, A/B/C are suit variables, x is any number that fits, D is a dragon, F is a flower, 0 is Soap. Each totals 14 tiles.

| ID | Pattern | Suits | X/C | Value | Teaches |
|---|---|---|---|---|---|
| P-YEAR-1 | FF, 2026 (singles 2, 0, 2, 6), kong of 2s, kong of 6s | 2026 in A; kongs in B and C | X | 30 | Year singles, Soap as zero, no jokers in singles |
| P-EVEN-1 | FF, 22, 444, 666, 8888 | A | X | 25 | Reading evens, group sizes |
| P-LIKE-1 | FFFF, xxx, xxx, xxxx | A, B, C | X | 25 | Like numbers across suits |
| P-RUN-1 | x pair, x+1 pung, x+2 kong, x+3 pung, x+4 pair | A | X | 25 | Consecutive runs |
| P-RUN-2 | x pung, x+1 kong, x+2 pung, matching-dragon kong | A | X | 30 | Matching dragons |
| P-ODD-1 | 11, 333, 5555, 777, 99 | A | X | 25 | Odds |
| P-WIND-1 | NNNN, EEE, WWW, SSSS | none | X | 25 | Winds; pungs and kongs of honors |
| P-WIND-2 | NEWS (singles), Red kong, Green kong, FF | none | X | 30 | NEWS is four singles |
| P-369-1 | 333, 666, 9999 in A; 3333 in B | A, B | X | 25 | Two suits |
| P-QUINT-1 | x quint, x+1 kong, FFFFF | A | X | 40 | Quints need jokers (except flowers) |
| P-CONC-1 | FF, 2222, 4444, 6666 | A | C | 35 | Concealed hands |
| P-SP-1 | FF, 11, 22, 33, 44, 55, matching-dragon pair | A | C | 50 | Singles and Pairs: concealed, no jokers |

## 14. Open questions to settle with you

- Option A (private Claude artifact) or Option B (Home Screen web app), and where progress is saved.
- A practice switch like NMJL Online's "Safety": ON blocks illegal moves with an explanation; OFF lets you make the mistake, then explains it. Suggested: ON in the tutorial and guided matches 1 and 2, OFF in match 3, your choice in free play.
- Free-play handling of a hand-killing exposure: block it, or allow it and go dead as at a real table.
- Scores in points, or as cents like a home game.
- Sound on or off by default.

---

### Sources

Repositories: [ClaysonIO/american-mahjong](https://github.com/ClaysonIO/american-mahjong), [imon-stevenson/modern-mahj](https://github.com/imon-stevenson/modern-mahj), [phishery/mahjong-iq](https://github.com/phishery/mahjong-iq) (see docs/CARD_FORMAT.md and docs/PROBABILITY.md), [YakovYeger/the-mahjong-room](https://github.com/YakovYeger/the-mahjong-room) (see docs/COACH_AUDIT_AND_DESIGN.md and docs/RULES_SPEC.md), [joshbelot/mahjong-mania](https://github.com/joshbelot/mahjong-mania) (see docs/SPEC.md), [nicknaiser/mahjong](https://github.com/nicknaiser/mahjong), [pauls-gh/mahjong](https://github.com/pauls-gh/mahjong), [EpicOrange/riichi_advanced](https://github.com/EpicOrange/riichi_advanced), [EricTams/Mahjong](https://github.com/EricTams/Mahjong), [jackwallner/mahj](https://github.com/jackwallner/mahj).

Card statistics: [EightBam, best sections](https://eightbam.com/best-sections/), [EightBam, probability](https://eightbam.com/probability/), [Missy Mahjong, 2026 card statistics](https://www.missymahjong.com/post/nmjl-2026-card-statistics), [Sarah Gilligan, Fuzzy Match](https://fuzzymatch.substack.com/p/i-taught-a-computer-to-play-the-2026).

Engineering: [bryc PRNG notes](https://github.com/bryc/code/blob/master/jshash/PRNGs.md), [fast-check](https://fast-check.dev/docs/introduction/), [WebKit storage cap](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/), [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/), [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).

Research on mah jongg AI (mostly Riichi, ideas only): [Suphx](https://arxiv.org/abs/2003.13590), [Mizukami and Tsuruoka 2015](https://www.logos.ic.i.u-tokyo.ac.jp/~tsuruoka/papers/cig2015mizukami.pdf), [Long et al. 2010](https://ojs.aaai.org/index.php/AAAI/article/view/7562).

Full technical research notes (about 9,900 words, with every repository link) are in the research appendix: `research/tech-prior-art.md`.
