# Mah Jongg Practice App

A personal, non-commercial app for learning and practicing American mah jongg (National Mah Jongg
League rules, 152 tiles, no blanks) against three computer opponents. Build status, decisions and next
steps are in [STATUS.md](STATUS.md). The research notes behind every rule are in [docs/](docs/).

## What's here (milestone 1: the engine, no screens yet)

| Folder | What it holds |
|---|---|
| `src/engine/tiles.ts` | The 36 tile kinds, names, and the 152-tile set |
| `src/engine/rng.ts` | Seeded random numbers, so every game can be replayed from a seed |
| `src/engine/card/` | The card notation, compiler, checker and expansion into concrete hands |
| `src/engine/cards/practice.ts` | The invented practice card (12 lines, 113 concrete hands) |
| `src/engine/matcher.ts` | Win check, tiles away, claims, joker exchanges, dead and blocked hands |
| `src/engine/engine.ts` | The referee: the whole game flow and every rule check |
| `src/engine/rules.ts` | Rule settings, including the labeled choices for uncertain rules |
| `src/engine/scenario.ts` | Rigged tables from tile codes (for tests now, tutorial lessons later) |
| `src/engine/view.ts`, `describe.ts` | What each seat may see; plain-English event text |
| `src/bots/` | Computer opponents (level 2 "Steady" built; levels 1 and 3 later) |
| `src/sim/runner.ts` | Plays whole games; replays saved games |
| `test/` | The automatic tests |
| `scripts/` | The sample game, simulation and card report |
| `docs/` | Research notes and the card notation guide |

## Running it (on a Mac with Node.js 22 or later)

```
npm install          # one time: downloads the build and test tools
npm test             # all automatic tests (about 20 seconds)
npm run typecheck    # the type checker
npm run sample       # one computer-only game, printed as a play-by-play
npm run sim          # 2,000 computer-only games with statistics
npm run card         # the practice card, line by line, with an example hand for each
```

The engine has no outside dependencies; the tools listed in package.json are only for building and testing.
