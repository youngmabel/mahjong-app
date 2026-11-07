# STATUS: Mah Jongg Practice App

Last updated: November 6, 2026 (build chat 3, milestone 3 complete).

## Play it

- **The app:** https://claude.ai/artifact/Gytq4hufBNLTVDJBMxLtwX (a private Claude artifact named "Mah Jongg Practice"). It opens on your Mac or iPhone wherever you're signed in to Claude.
- **Guided practice:** tap **Menu**, then **Match 1: open table**. Match 2 opens when match 1 is finished, and match 3 after match 2.
- **Saving:** your free-play game, your guided match, your settings and your progress each save to the artifact's private per-person storage, so you can stop anytime and pick up on the other device. Only you can read them. Your free-play game from milestone 2 carries over.
- **The card:** games use the invented practice card until the real 2026 card is entered.

## Where things live

- **Code, master copy:** the private GitHub repository youngmabel/mahjong-app (branch main). Future build chats attach and clone it.
- **Mirror on your Mac:** MAHJONG/app/, refreshed at the end of each build chat. Treat it as read-only; edits there are overwritten. It holds everything in the repository except the copied research notes, which live in MAHJONG/ itself.
- **Research notes:** MAHJONG/*.md and MAHJONG/research/, also copied into the repository's docs/ folder so the repository stands on its own.
- **Tile art:** the 3D tile set is in "Claude Outputs (Local)/26-10-28 Mahjong 3D Tiles" on your Mac (full-size images, the Blender file and scripts). The repository keeps the parts the app uses in assets/tiles/clean/: the flat face drawings (faces-svg), the small WebP images (images-app), tiles.json and the scripts.

## Done: milestone 3 (build order step 5, the coach and guided matches)

1. **The coach** (src/coach/). It sees only your own view of the table, like the computer players, and uses the same hand-checking code.
   - **Your closest hands:** every card line, ranked by tiles away (counting only tiles still available), then by missing singles and pairs (jokers can't fill those), then by how many live tiles would help. A line you can no longer finish is skipped.
   - **Charleston:** suggests 3 tiles judged together as a set (never a joker, never a tile your pinned hand needs when others will do), says why, and suggests a blind pass on the first left or last right when fewer than 3 tiles are easy to give up.
   - **Your turn:** suggests a discard and why, never one your pinned hand needs when another tile will do; warns before you feed a player with 2 or 3 exposures; plays safe late in a hopeless hand; points out joker exchanges and Mah Jongg.
   - **After a discard:** weighs every legal call (each size and joker count), and says whether calling is wise, not just legal.
   - **Stop vote and courtesy pass:** advice without naming tiles.
   - **Wording:** rules as facts, hand advice as suggestions. "Hide concealed hands" keeps concealed lines out of all of it.
2. **Pinning a hand.** Pin up to two lines (from the coach in match 1, the Card sheet, or the "Which hand are you going for?" list when play begins). The pinned line is drawn just above your rack: tiles you hold, then the ones still needed, faded. Rack tiles the line uses get a gold underline. The rack itself keeps its fixed order.
3. **Rule cards.** Sixteen short rule cards (the goal, the Charleston, blind passes, the stop vote, the courtesy pass, East starting, a turn, calling, after a call, concealed hands, jokers, joker exchange, discarded jokers, dead hands, who pays, wall games, and "Safety is off" for match 3), each shown the first time its situation comes up and remembered after "Got it." A move the referee stops twice for the same rule brings that card back.
4. **Hints.** A Hint button reveals four tiers: a nudge, the section your tiles point to, the specific line and what it still needs, then the coach's answer (for passes and discards, only after you've picked a tile of your own).
5. **Guided matches** (Menu). One game each, with help that fades:
   - **Match 1, open table:** everyone's tiles face up (a setting can hide them on a small screen), the computer players explain each move in a sentence, the coach offers your 3 closest hands to pin, suggests every move and comments on what you select. The coach makes your first Charleston pass with you, picks 2 of the 3 tiles on the second, then you take over. Undo is on, Safety is on, and the gentle computer players never declare Mah Jongg (shown on screen as a practice setting). The deal starts within 7 tiles of a Consecutive Run line that is the closest line on the card.
   - **Match 2, concealed table:** racks hidden, computer players who can win, hints only on request, rule explanations right away, and strategy notes saved for the review. Safety is on.
   - **Match 3, dress rehearsal:** Safety off (as at a real table), 6 hint taps for the game, stronger computer players, and the full review.
6. **After each match:** a readiness report (Rules, Choosing a hand, Card reading, and Pace as advice only) and the coach's review: how many of your decisions matched the coach's, and up to four of the costliest differences with a one-line lesson.
7. **Graduation:** after match 3, or offered early when every check passes after match 2. It unlocks Classic tiles (drawn in step 7), and every match stays open to replay.
8. **Free play** is unchanged and always open. New setting: "Coach hints in free play" (off by default) adds the Hint button, rule cards and pinning. Until you start match 1, free play shows a one-line pointer to guided practice.
9. **Screen changes:** the top bar now has Card and Menu; the Table log and Settings moved into the Menu. Settings shows Safety as set by the match during a guided match, and "New session" becomes "Restart this match."

## Milestone 3 results

- **Automatic tests:** 182 passing: the 146 from milestones 1 and 2 plus 36 new (21 coach, 14 guided-match and settings, 1 screen-code guard).
  - **A stand-in that only follows the coach** played 24 free-play games against level 2 computer players: the referee accepted all 928 suggested moves, every suggestion and hint was one or two sentences, and it won 8 of 24 (about 22% is par against three equal players).
  - **Set judgment:** on 40 random racks the coach's Charleston pass was the best of every possible 3-tile set (checked by brute force), never worse than picking one tile at a time.
  - **Guided matches with the stand-in:** match 1, 8 games: 4 wins, 4 wall games, 0 computer wins (the practice setting works). Matches 2 and 3, 12 games: the computer players won 9.
- **Browser check:** the final run at all six sizes is in progress; this line is updated when it finishes.
- **Bug found and fixed by the browser check:** the "Which hand are you going for?" list crashed, which froze the screen at your first turn when nothing was pinned (a variable named `h` hid the screen library's own `h`). A test now checks the screen code for that mistake.
- **Engine:** unchanged in milestone 3; no rule changes or bug fixes were needed.

## Done earlier: milestone 2 (build order step 4, a playable screen)

1. **The table.**
   - **Top bar:** game number, your wind (and Dealer), tiles left in the wall, your score, and Card, Log and Settings buttons.
   - **Each opponent:** wind and seat ("on your right", "across", "on your left"), hidden tile count, points, Dealer and Dead markers, and exposures.
   - **Message box:** the newest discard shown large, the latest lines, the referee's notices, and a prompt saying what to do next.
   - **Your own exposures and your rack.**
2. **Your rack.**
   - A fixed order that never depends on a hand: Bams, Craks, then Dots 1 to 9; winds N, E, W, S; dragons Red, Green, Soap; flowers; jokers last.
   - Small gaps between groups, and the tile you just drew is marked "new".
   - Tile names under each tile (a setting), and a "By number" option that groups all the 1s, all the 2s and so on.
3. **The discard chart.**
   - 4 rows of 9 places, one place per kind of tile: Bams, Craks and Dots, then a row for N, E, W, S, Red, Green, Soap, flowers and jokers.
   - Copies stack in their place with a count, and the newest discard is outlined.
   - Tap any place to see who threw each copy.
4. **A button for every legal move.**
   - **Charleston:** passes (including blind passes), declaring a hand dealt complete, the stop vote, and the courtesy offer and pass.
   - **Your turn:** discarding, Mah Jongg, joker exchanges, and changing a new exposure before you discard.
   - **Calls:** Mah Jongg, or a pung, kong, quint or sextet, showing how many jokers each uses. Every button is decided by trying the move with the referee on a copy of the game, so the screen can't disagree with the rules.
   - **Dimmed buttons:** they stay tappable and show the referee's reason.
5. **When play stops for you after a discard.** Only when you can call Mah Jongg or make an exposure that fits a hand on the card. The setting "Stop after every discard" stops every time. If another player's call beats yours, a note says why.
6. **Cheat sheet (Card button).**
   - The 12 practice-card lines in our own layout: small tiles with A/B/C suit badges, a plain note, Open or Concealed, points and an example.
   - The payment rules.
   - A "Hide concealed hands" switch.
7. **End of game.** It shows:
   - the result and payments, and the winning hand in card order
   - session scores
   - every hand, with what each computer player was aiming for
   - a Next game button (the deal passes to the right)
8. **Settings.**
   - Safety (OFF by default) and Stop after every discard.
   - Computer speed (slow, normal or fast), tile names, and Hide concealed hands.
   - Tile style: Clean. Playful and Classic are shown locked, with what unlocks them.
   - Sound (none yet), where your progress is saved, and New session (asks first).
9. **Saving.**
   - The game saves after each of your moves and whenever it waits for you.
   - Reloading or reopening resumes exactly where you were, since computer moves replay the same way from a save.
   - Updating the artifact while it's open keeps your game.
10. **One layout that adapts to your device.**
    - **iPhone held upright:** everything stacks, and the discard chart sizes itself to the space left.
    - **iPhone on its side and the Mac:** the players and messages sit beside the chart.
    - **Very short screens** (an iPhone SE with Safari's toolbars showing, for example): the page scrolls a little, and the buttons stay pinned to the bottom.
11. **Tile art: Clean.** The faces come from the 3D tile set's flat drawings, so the 2D and 3D tiles match. The 3D images are kept for the hold-to-magnify view later.

### Milestone 2 results

- **Automatic tests:** 146 passing. That is the 126 engine tests plus 20 new screen tests.
  - **Stand-in player:** a stand-in for you that can only use the moves the screen offers plays whole games: 40 with Safety off, plus a 25-game session with Safety on.
  - **What it checks:** every move the screen offers must be accepted by the referee. When it tries a dimmed button, the referee must refuse it with the same reason and nothing may change. All 152 tiles must be accounted for after every move.
  - **A one-time longer run** (400 games, about 20,000 moves, about 2,200 refused moves tried) found no disagreement.
- **Browser check** (scripts/ui-check.cjs):
  - **Sizes:** whole games played by tapping the screen at six sizes. iPhone upright, on its side, and the small iPhone SE; an iPhone and an SE with Safari's toolbars showing; and a Mac window.
  - **Also checked:** reloading resumes the same game, no page errors, and no sideways scrolling.
  - **Caveat:** it runs on Chrome's engine, so Safari and the Claude iPhone app haven't been tested directly yet.
- **The published app, opened once in Claude in your Chrome on the Mac:**
  - It loaded and dealt Game 1.
  - It saved the game to your private storage, and a reload resumed the same hand. Settings confirms it saves to your private storage in Claude.
  - No moves were made, so your first game is waiting at the first Charleston pass.
- **Engine:** unchanged in milestone 2. No bug fixes were needed.

## Done earlier: milestone 1 (build order steps 1 to 3)

1. **Tiles and seeded random numbers.** 36 tile kinds, the 152-tile set, plain-English names, and sfc32 random streams, so any game replays exactly from its seed.
2. **Card compiler and validator.** An entry notation for typing card lines (docs/CARD-NOTATION.md) is compiled to checked data and expanded into every concrete hand. It covers the 2026 features the notes describe:
   - "-or-" layouts
   - matching, opposite, "any" and literal dragons
   - flower sextets and separate flower pungs
   - restricted numbers, even slides and free suits
   - per-tile colors (three dragons as singles), runs and year singles

   Mistakes are explained in plain words.
3. **Practice card.** The invented card from 07-app-spec section 13: 12 lines and 113 concrete hands (each line's count was predicted by hand and confirmed by the tests).
4. **Matcher.** It covers:
   - the win check, tiles away, missing tiles and outs
   - whether exposures fit a hand, and Mah Jongg and exposure claims
   - joker exchanges
   - privately blocked hands (for bots and the coach), kept separate from officially dead hands (public evidence only)
   - which tile goes where, for display
5. **Game engine (the referee).** One entry point, apply(state, seat, action), returns the new state and events, or a one- or two-sentence reason a move isn't allowed. It covers:
   - the deal and the Heavenly Hand
   - both Charlestons, with blind passes and the IOU method, the stop vote and the courtesy pass
   - turns, and call windows with Mah Jongg priority and next-in-turn ties
   - exposures (changeable until locked) and joker exchanges
   - dead hands, and three-dead and wall-game endings
   - payments, session scores and the Safety switch
6. **Computer opponents, level 2 ("Steady").** They see only their own seat's view and judge tiles against their own candidate hands. They pass and blind pass, vote, offer courtesy tiles, call, exchange jokers and play light defense, and they never make an illegal move. Levels 1 and 3 exist as placeholders.
7. **Tools.**
   - `npm run sample`: a play-by-play
   - `npm run sim`: statistics
   - `npm run card`: the card line by line, with an example hand for each line to check against the printed card

### Milestone 1 results

- **Automatic tests:** 126 passing, covering tiles, random numbers, the card compiler, the matcher, the brute-force matcher check, the rules scenarios, edge cases, bots, simulations and replay.
- **Brute-force check of the matcher:** the fast matcher agreed with an independent slow checker on 6,500 random cases (5,000 seeded, 1,500 generated by fast-check).
- **Computer-only games:** 2,000 games and 659,333 actions, each checked for all 152 tiles accounted for, legal hand sizes and sound exposures: 0 problems and 0 rejected moves. Another 1,000 games under the alternative rule settings: 0 problems.
- **Practice-card statistics** (not comparable to the real card): 94.2% of games ended in Mah Jongg and 5.8% in wall games. Games averaged 73 discards and 5.3 exposures. East won 27.6% of the wins.

### Independent review of the engine (October 28, 2026)

A separate reviewer checked the engine against docs/01-rules.md and confirmed each finding with a script. Fixed, with tests:

- **(High)** A hand was declared dead counting a discard that was still claimable. A player whose Mah Jongg tile was that very discard could not claim it. Dead hands are now judged only on settled evidence: a discard counts once it goes unclaimed; a changeable exposure counts only its claimed tile; and the player whose turn it is gets judged when they discard.
- **(Medium)** The dead-hand check treated jokers in a player's own exposures as unreachable, though a player may take them back by joker exchange. All jokers not yet discarded now count, as docs/01-rules.md section 11 says.
- **(Medium)** Choice (b) paid any claim-turn win after any joker exchange as self-picked. It now applies only when the exchange completed the hand.
- **(Low)** A Heavenly Hand caused a pause that told other players East was dealt a complete hand. The dealer now declares during the first pass, so nothing is revealed.
- **(Low, card entry)** A `#` inside a line cut off the rest. Different number symbols could become the same tile. A "no jokers" option on an exposed line could never accept an exposure; it is now allowed on concealed lines only.

## Decisions made

### Milestone 3 (this chat)

- **One guided match is one game** (you approved Claude's recommendation), so the program is three games.
- **Free play stays open** the whole time, as it was (you: "We can keep it open as it is now").
- **Graduation** (you approved Claude's recommendation): always after match 3; after match 2, offered early when every check passes. Match 1 gives too much help to show readiness, so it never leads to early graduation (the teaching plan allowed any match).
- **Card-reading check** (you: "That's fine"): shown as "comes with the tutorial" and not counted until the tutorial's questions exist (step 6).
- **Pausing after discards in guided matches** (you: "just do what makes sense"; Claude's call): play stops for you only when you have a legal call, as in free play, and the coach explains the choice. "Stop after every discard" still works. The spec's stop-every-time rule would add about 50 stops a game.
- **Technical calls (Claude):**
  - **Computer players:** match 1 has three level 1 players who never declare Mah Jongg; match 2 has three level 2 players; match 3 has two level 2 players and one level 3 player across from you.
  - **Match 1's deal** starts within 7 tiles of a Consecutive Run line that is also the closest line on the card. Typical practice-card deals start 9 or 10 tiles away (2,000 test deals).
  - **Match 3 hint budget:** 6 taps.
  - **Readiness checks:**
    - **Rules:** no move the referee stopped for a real rule (passing a joker, calling a discard for a pair, and so on) and no dead hand. Safety blocks and taps with nothing chosen don't count.
    - **Choosing a hand:** the hand pinned when play began can still be finished and is within 2 tiles of the closest.
    - **Pace:** advice only.
  - **Saving:** separate saves for free play, the guided match, settings and progress, so switching never loses a game.
  - **Top bar:** Card and Menu.
  - **The coach** lives in src/coach/, beside the bots and apart from the engine, and the engine's rules didn't change.

### Milestone 2

- **Rack order (you):** a fixed order, not based on any hand, plus a sort by number. Sorting by a target hand would give hints, which is the coach's job.
- **Discards (you):** "organized by suit and sets, with the newest one highlighted and named". Who threw each copy shows on tap.
- **Hide concealed hands (you):** an option, because "a lot of new players are scared of pursuing concealed hands". It covers the cheat sheet now and the coach's suggestions later. The computer players still play every line, and you can still declare a concealed hand.
- **Tile sets (you):** Clean is the default and the only set drawn so far. Playful unlocks when you finish the tutorial. Classic unlocks when you graduate to free play: "wins are not needed - just finishing the training program and graduate". Both get drawn in build step 7.
- **Layout (you):** "Do whatever works best for this. I want to be able to play on the computer or the iPhone." The result is one adaptive layout.
- **3D tiles (you):** the screen uses the 3D set's flat faces now. The 3D images wait for the magnifier in step 7.
- **When play stops (Claude's plan, approved):** after a discard, only for Mah Jongg or an exposure that fits a hand, with a setting to stop every time. Computer speed is adjustable.
- **Technical (Claude):** the screen code is in src/ui/, apart from the engine. It uses Preact 10.29.8, a small screen library loaded from the jsDelivr site. A build step (esbuild) packs everything else into one page, dist/mahjong.html, which is what gets published.

### Carried from milestone 1

- **Where the app lives:** a private Claude artifact, with progress in the artifact's private per-person storage. A Home Screen version can come later; the engine is the same either way.
- **Where the code lives:** the private GitHub repository, mirrored to MAHJONG/app/.
- **Safety switch:**
  - ON for the tutorial and guided matches 1 and 2.
  - OFF for match 3, and OFF by default in free play (changeable in settings).
  - It only governs legal moves that kill your own hand; illegal moves are always blocked with an explanation.
- **Scores:** points (the card's values), with a running session total.
- **Sound:** off by default.
- **Stack:** TypeScript 7, Vitest 5, fast-check 4 and tsx, on Node 22. The engine has no outside dependencies.

## Labeled rule choices (approved; each is one setting in src/engine/rules.ts)

| | Choice | Confidence |
|---|---|---|
| a | East completing a hand during the Charleston declares instead of discarding; paid as self-pick | L-M (AMJA) |
| b | A Mah Jongg completed by a joker exchange counts as self-picked | M |
| c | No jokerless bonus for Singles and Pairs, or for Quints | H / M |
| d | Jokerless is judged by the tiles shown when declaring | L-M (AMJA) |
| e | An exposure can be changed until its owner discards or starts a joker exchange | H / M |
| f | Three dead: game ends, nobody pays, the deal passes right | M-H / L |
| g | Everyone blind passing: the IOU method (dealer passes first, owes the blind tiles) | M |
| h | The last discard can be claimed for an exposure or Mah Jongg as usual | M (inference) |
| i | The referee declares dead hands automatically, on settled public evidence only | design choice |

The NMJL rulebook *Mah Jongg Made Easy* would settle most of these.

## Open questions for you or the rulebook

- **[L] With Safety off, an exposure that fits no hand.** The hand goes dead when the player discards. Right now the exposure stays on the rack and its jokers can still be taken. docs/01-rules.md section 7 says that for an "erroneous exposure" the tiles go back to the rack and those jokers can't be taken. The notes don't say whether a legal pung that fits no hand counts as "erroneous." This arises only with Safety off: free play by default, and now match 3.
- **Dead-hand calls never guess.** The referee counts every joker not yet discarded as still obtainable, so it may miss a few provable deaths, but it never declares a hand dead that could still win.
- **On a nearly empty wall, everyone can be declared dead.** Late in a game, if the table shows that no hand on the card can still be made, players with no exposures can be declared dead too. The game then ends as "three dead" rather than as a wall game. Nobody pays either way.
- **Your iPhone and Mac.** Please play the guided matches on your iPhone (in the Claude app, and in Safari if you like) and on your Mac, and tell the next chat anything that looks off or reads wrong. Known: on an upright iPhone, match 1 scrolls a little because everyone's tiles are face up (Settings can hide them).
- **Is match 1 too hard to finish?** On the practice card, a stand-in following the coach won half its match 1 games; the rest ran out of wall (the computer players never win match 1). If you'd like more wins there, the deal can start closer to a hand.

## Known limitations

- The real 2026 card isn't entered yet (waiting for your card photos).
- No tutorial yet (build step 6). Until it exists, the readiness report's card-reading check shows "comes with the tutorial" and isn't counted, and rule cards have no "why" link to a lesson.
- Levels 1 and 3 of the computer players are starting settings, not tuned (build step 9). They are used in match 1 (level 1) and match 3 (one level 3 player, across from you). Level 2 bots expose often and win 94% of practice games; all need retuning against the real card.
- The coach's weights and the readiness thresholds are starting values to tune [M]: a hand is "viable" when it can still be finished and is within 2 tiles of the closest; Pace is the typical Charleston decision, 15 seconds or less.
- Undo (match 1) remembers your moves only while the page is open; a reload clears it.
- Playful and Classic tiles, the magnifier, sound and rearranging tiles by hand come later (step 7 and beyond).
- The IOU blind-pass method follows Tom Sloper's description; the NMJL's 2020 rule text wasn't found.
- Screens were checked with Chrome's engine at iPhone and Mac sizes, not yet on a real iPhone or in Safari.

## What's next

- **Milestone 4: build order step 6, the tutorial engine and lessons** (docs/05-teaching-plan.md section 3, docs/07-app-spec.md section 9): 5 rounds, 14 scenarios, each lesson a data file played on a rigged table, with recall questions that feed the readiness report's card-reading check. Finishing it unlocks Playful tiles.
- **Then:** step 7 (tile art polish: the Playful and Classic sets, plus the magnifier) and step 9 (level 1 and 3 computer players, stats, export).
- **When your card photos arrive:** step 8, entering and checking the 2026 card (docs/03-card-2026.md section 7).

## For the next build chat (technical notes)

- **The coach (src/coach/):**
  - lines.ts reads a rack from one seat's view: each line's closest version, tiles away, outs, blocked lines, pinned lines.
  - advice.ts has the suggestions (passes, discards, calls, joker exchanges, the vote and courtesy pass), using the bots' own evaluation (src/bots/evaluate.ts) with a coach setting.
  - note.ts turns them into one note per decision, with the four hint tiers and the screen button it points to. narrate.ts explains computer moves; rulecards.ts holds the rule cards; review.ts the review and readiness report.
- **Screen code (src/ui/):**
  - session.ts runs free play or a guided match: modeSettings, botsFor, match1Deal, undo, hints, rule cards, the decision log, the direction check and matchResult.
  - progress.ts holds matches finished, reports, rule cards seen and graduation. view/Coach.tsx has the coach bar, pinned strip, menu, direction picker and report.
  - Saves live at data/users/<your id>/game (free play), /guided, /prefs and /progress.
- **Tests:** test/coach.test.ts and test/guided.test.ts; test/coachstandin.ts has stand-ins that follow the coach through the screen's own buttons.
- **Commands:**
  - `npm run build` (add MINIFY=0 for readable code when debugging a page error).
  - `node scripts/ui-check.cjs <folder> <games-per-size>` now also plays guided matches 1 to 3 at each size and checks graduation. It takes about 15 to 25 minutes per size, so run sizes in parallel with SIZES=<one size> each; GUIDED=0 skips the guided matches.
- **Screen code rule:** never name a variable `h` in a .tsx file; it hides the screen library's `h()` inside JSX. A test checks.
- **Publishing:** publish dist/mahjong.html with the Artifact tool, passing the artifact's URL (above) so it updates in place. Capabilities are db and user; leave capabilities out on an update to keep them.
- **Git:** milestone 3 was built on branch milestone-3 and merged into main. Commit 489eadf on milestone-2 was recorded under the name "youngmabel" by mistake; rewriting published history was refused as destructive, so it stays.

## How to run (on a Mac with Node.js 22 or later)

In the app folder, run `npm install` once. Then `npm test`, `npm run build` (the playable page goes to dist/), `npm run sample`, `npm run sim` and `npm run card`.

## Prompt for the next chat

```text
Continuing work from earlier chats on my mah jongg practice app. Before anything else, read every file listed below directly; do not rely on this summary for what is in them. If a file and this summary disagree, trust the file and tell me.

THE PROJECT
I'm building a personal app (never commercial) for learning and practicing American mah jongg (National Mah Jongg League rules) solo against three computer opponents, using the 2026 NMJL card and a 152-tile set with no blanks. Done so far: milestone 1 (the rules engine, the card compiler with an invented practice card, level 2 computer opponents), milestone 2 (a playable screen, published as a private Claude artifact that saves my progress) and milestone 3 (the coach and three guided matches with graduation), with 182 passing tests. Your job in this chat is milestone 4: build order step 6, the tutorial engine and its lessons.

READ FIRST
1. STATUS.md in my private GitHub repository youngmabel/mahjong-app, branch main (attach the repository with push access and clone it; it is the master copy of the code). The same STATUS.md is in my MAHJONG folder (/Users/youngmabel/Documents/MAHJONG). It has what's done, every decision and who made it, the open questions, and technical notes for you.
2. In the repository's docs/ folder: 05-teaching-plan.md (sections 2, 3, 4, 7 and 8: the lessons, the beginner mistakes, hints and the content guardrails), 07-app-spec.md (section 9, the tutorial scenario format, and section 13, the practice card), 02-tiles-and-terms.md (tile names and the "why it's called that" notes), 08-design-ideas.md, and 01-rules.md as needed.
3. The code: src/engine/scenario.ts (rigged tables), src/coach/ (the coach: lines.ts, advice.ts, note.ts, rulecards.ts, review.ts), src/ui/session.ts, src/ui/progress.ts, src/ui/prefs.ts, src/ui/view/App.tsx, view/Coach.tsx and view/Sheets.tsx.
4. The published app: https://claude.ai/artifact/Gytq4hufBNLTVDJBMxLtwX. Read it with the Artifact tool, and update it in place by passing this link when you publish, so my saved games, settings and progress carry over.

DECISIONS ALREADY MADE (details and reasons in STATUS.md)
- Standard NMJL rules, no house rules, no blank tiles. Our own tile art and our own card layout.
- The app is a private Claude artifact with progress in its private per-person storage. The code lives in the GitHub repository; MAHJONG/app/ is a read-only mirror refreshed at the end of each chat.
- Safety switch ON for the tutorial and guided matches 1 and 2, OFF for match 3 and (by default) free play. Scores in points. Sound off by default. Nine labeled rule choices (a to i) are approved.
- My rack keeps a fixed order and is never sorted by a target hand. "Hide concealed hands" also keeps concealed hands out of the coach ("a lot of new players are scared of pursuing concealed hands").
- Tile sets: Clean now; Playful unlocks when I finish the tutorial, and Classic when I graduate ("wins are not needed - just finishing the training program and graduate"). The settings hold the progress flags.
- From milestone 3: one guided match is one game; free play stays open the whole time; I graduate after match 3, or early after a clean match 2; the readiness report's card-reading check waits for the tutorial's questions and isn't counted until then.

WHAT I WANT FROM YOU IN THIS CHAT
1. Read the files. Ask me how the guided matches and the coach worked on my iPhone and Mac, and fix anything I report first. Then give me a short plan for milestone 4: the tutorial engine (lessons as data files on rigged tables, each checked automatically) and the 5 rounds of lessons in docs/05-teaching-plan.md section 3, including the recall questions that feed the card-reading check. Ask me to decide anything open, with a recommendation for each.
2. After I approve, build it without changing the engine's rules (bug fixes only, each with a test). Keep every existing test passing and add tests for every lesson.
3. Show me it works: update the published artifact in place, with all tests passing and the browser check run at iPhone and Mac sizes.
4. Before the chat ends, update STATUS.md (in the repository and my MAHJONG folder), push to GitHub, refresh MAHJONG/app/, and give me a paste-ready prompt for the next chat.
If I attach photos of my 2026 card, also enter it (build step 8, following docs/03-card-2026.md section 7 and docs/CARD-NOTATION.md) and show me the line-by-line check.

GROUND RULES
- I'm not an experienced programmer. Make the technical calls yourself and explain them in plain words.
- Take rules from docs/01-rules.md (and the NMJL rulebook "Mah Jongg Made Easy" if I buy it). Don't invent rules. Where the notes mark something as medium or low confidence, flag it to me rather than guessing. Present rules as facts and hand advice as suggestions. Check lesson text against the guardrails in docs/05-teaching-plan.md section 8.
- The engine is the referee: prevent illegal moves and explain them in a sentence or two.

SETUP IN THE NEW WORKSPACE
- Clone the repository, run npm ci, then npm run check (182 tests should pass) and npm run build.
- The browser check (node scripts/ui-check.cjs <folder> <games-per-size>) needs Playwright with Chromium, which Claude's build environment has. It now plays the three guided matches at each size, so run the six sizes in parallel (SIZES=<one size> each); see the technical notes in STATUS.md.
- Commit under Claude's default git identity.

IF SOMETHING IS MISSING
This continues the chat "Mah jongg app milestone 3" from November 6, 2026 (Claude session https://claude.ai/code/session_01FMc1CGgrHruVE6jXFt2V7c). Search my past chats for "mah jongg milestone 3", "guided matches", "readiness report" or "coach bar" if you need the exact wording of something.
```
