# STATUS: Mah Jongg Practice App

Last updated: November 6, 2026 (build chat 4: milestone 4 part 1, Pip the visible coach, published; the lessons are part 2).

## Play it

- **The app:** https://claude.ai/artifact/Gytq4hufBNLTVDJBMxLtwX (a private Claude artifact named "Mah Jongg Practice"). It opens on your Mac or iPhone wherever you're signed in to Claude.
- **Start here:** tap **Menu**. It is now a three-step path: 1 Learn the basics (Pip's tour of the table; the lessons come in part 2), 2 Practice with Pip (the three matches), 3 Play on your own (free play). Match 2 opens when match 1 is finished, and match 3 after match 2.
- **Saving:** your free-play game, your guided match, your settings and your progress each save to the artifact's private per-person storage, so you can stop anytime and pick up on the other device. Only you can read them. Your free-play game from milestone 2 carries over.
- **The card:** games use the invented practice card until the real 2026 card is entered.

## Where things live

- **Code, master copy:** the private GitHub repository youngmabel/mahjong-app (branch main). Future build chats attach and clone it.
- **Mirror on your Mac:** MAHJONG/app/, refreshed at the end of each build chat. Treat it as read-only; edits there are overwritten. It holds everything in the repository except the copied research notes, which live in MAHJONG/ itself.
- **Research notes:** MAHJONG/*.md and MAHJONG/research/, also copied into the repository's docs/ folder so the repository stands on its own.
- **Tile art:** the 3D tile set is in "Claude Outputs (Local)/26-10-28 Mahjong 3D Tiles" on your Mac (full-size images, the Blender file and scripts). The repository keeps the parts the app uses in assets/tiles/clean/: the flat face drawings (faces-svg), the small WebP images (images-app), tiles.json and the scripts.

## Done: milestone 4, part 1 (Pip, the visible coach, and beginner fixes)

You played match 1 in Claude on your Mac and reported: you "had to scroll up for the card often"; you won ("it was a good match"); the coach "feels a little robotic with it just being in the chatbox... more on-screen / visuals"; and "The goal is to TEACH Mahjong to people who have no idea what they are doing... Identify those reasons, and fix them." Claude walked through match 1 as a beginner would and found seven problems: it starts in the deep end; the coach talked in text boxes away from the tiles (about nine sentences across two boxes on match 1's first screen); jargon came before it was taught; hands were named but never shown; directions weren't visual; moves went by as text; and there was no clear place to start. Part 1 fixes all but the first, which the lessons (part 2) fix.

1. **Claude's panel on a Mac** (fixed and published first). The panel is taller than it is wide, so the app used its upright layout and ran longer than the panel: Card scrolled away, the rack wrapped to two rows, and the Pass bar sat on top of the tiles. Now there is a Card button right above your tiles, the top bar stays in view, your rack and buttons stay together at the bottom (screens 600px tall or more), and the rack is one row once the window is 680px wide.
2. **Pip, your coach.** A small original bird (a nod to the bird on the 1 Bam) with a speech bubble right above your rack. Pip says one short, friendly sentence ("I'd pass 8 Bam, 5 Dot and North wind to East, on your right."), and "Why?" shows the reasoning (it stays open once you ask, until you hide it). The tiles Pip suggests get a small pointer above them, and the button Pip suggests glows (match 1). In matches 2 and 3, and free play with hints on, Pip waits to be asked: the Hint button, as before; once the answer tier is shown, the tiles get pointers too.
3. **Spotlights instead of yellow rule banners.** The first time each rule comes up, the screen dims except the part that matters, and Pip introduces the rule beside it ("First, everyone swaps some tiles. The arrow shows where yours go."). The rule text itself is unchanged.
4. **Hands drawn as tiles.** Pip's "Pick a hand to aim for" chips and the "Which hand are you going for?" list draw each line as tiles: in match 1 your own tiles lit and the missing ones faded, closest first; in matches 2 and 3 the line as the card draws it (so the list gives nothing away). The pinned hand above your rack is drawn larger.
5. **Words you can tap.** In Pip's bubble, the spotlights and the prompt, the first mention of 35 terms (Charleston, pung, exposure, Soap, NEWS, the section names, and more) is underlined; tapping one shows a one- or two-sentence meaning, with tiles where a picture helps (src/ui/glossary.ts).
6. **A seat map** in the message box: you at the bottom, play going to the right, whose turn it is, the dealer, and during a pass an animated arrow to the player receiving your tiles ("Your 3 tiles go to East, on your right.").
7. **Moves you can see.** A new discard pops onto the table (the newest-discard tile and its place on the chart). In match 1, tap any player's face-up rack to see it large, with tile names.
8. **A start screen.** The Menu is now a path: 1 Learn the basics (Pip's tour of the table; lessons "coming in the next update"), 2 Practice with Pip (the three matches), 3 Play on your own (free play). Someone who has never played lands on it with a welcome from Pip; you open where you left off.
9. **The tour of the table:** nine short spotlight steps (your tiles, the card, who sits where, the other players, discards, what just happened, your buttons, the Menu), skippable, ticked off on the start screen.
10. **Smaller fixes:** the readiness report's pace check is marked "Advice" (it never counts); the browser check now includes Claude's Mac panel (720 by 780).

## Milestone 4 part 1 results

- **Automatic tests:** RESULTS_TESTS
- **Browser check:** RESULTS_BROWSER
- **Published** in place (your saves, settings and progress carry over).
- **Engine and coach logic:** unchanged. Pip is a presentation layer (src/ui/coachview.ts and src/ui/view/Pip.tsx) over the same coach notes, so everything the coach suggests is still checked by the milestone 3 tests.

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
- **Browser check** (scripts/ui-check.cjs), at six sizes: iPhone upright, on its side, and the small iPhone SE; an iPhone and an SE with Safari's toolbars showing; and a Mac window.
  - **What it did at each size:** one free-play game, then guided matches 1, 2 and 3, all played by tapping the screen. Along the way it pinned a hand, dismissed rule cards, asked for hints and used undo once.
  - **What it checked:** a readiness report after each match, graduation after match 3, the cheat sheet and settings, and a reload that resumed the game and kept graduation. There were no page errors and no sideways scrolling at any size.
  - **Results:** the random tapper doesn't play to win, so match 1 ended in a wall game every time, and computer players won matches 2 and 3.
  - **Timing fix:** two fixes went into the check script itself: a button lookup that matched two buttons, and taps that could land just as the results sheet opened.
  - **Caveat:** it runs on Chrome's engine, so Safari and the Claude iPhone app haven't been tested directly yet.
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

### Milestone 4 (build chat 4)

- **Your report after playing match 1 on your Mac** (see part 1 above): Card scrolled away; you won ("it was a good match"); the coach felt "a little robotic with it just being in the chatbox"; "The goal is to TEACH Mahjong to people who have no idea what they are doing ... Identify those reasons, and fix them."
- **The plan (you: "Approved."):** part 1, a coach you can see (this chat); part 2, the tutorial's 14 lessons built on it, round by round, over the next chats, each checkpoint published and pushed.
- **A coach character (you: "That's fine"):** Pip, a small original bird that points at what it talks about. The research behind it (Mayer, The Future of Multimedia Learning): a picture of a teacher alone adds little (image principle, 4 of 7 tests), but one that points helps (embodiment, 15 of 17) and so does friendly, conversational wording (personalization, 13 of 15); words next to what they describe (spatial contiguity, 9 of 9) and cues that highlight what matters (signaling, 15 of 16) also help.
- **The table (you: "Okay"):** a seat map now; redrawing the whole table with players seated around you waits for the tile-art step (7), since it reworks every screen size.
- **Concealed hands (you: "Okay"):** the tutorial still teaches what C means (lesson E1), while play and the coach keep hiding concealed hands as your setting says.
- **Card reading and graduation (you: "Okay"):** once the tutorial exists, the card-reading check counts, so graduating early after match 2 needs it; graduating after match 3 stays automatic. The tutorial is recommended, not required, so match 2 stays open.
- **Technical calls (Claude):**
  - Pip is a presentation layer: src/ui/coachview.ts turns the coach's notes into Pip's words ("Suggestion: pass ..." becomes "I'd pass ... to East, on your right."), and src/ui/view/Pip.tsx draws Pip, the bubble, words you can tap and hands as tiles. The coach's logic (src/coach/) did not change.
  - Pip's bubble lives in the dock with your rack and buttons, so the coach's words sit beside the tiles; the reasoning is folded behind "Why?" to keep it to one sentence.
  - Rule cards keep their text (src/coach/rulecards.ts) and are shown as spotlights; src/ui/coachview.ts says where each one points and how Pip introduces it.
  - The tour's completion is saved as the progress entry "tour" (no change to the save format), and someone with nothing saved and nothing done lands on the start screen.

### Milestone 3

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
- **Your iPhone.** You've played on your Mac (Claude app). Please try Pip, the tour and a match on your iPhone too (in the Claude app, and in Safari if you like), and tell the next chat anything that looks off or reads wrong. Known: on an upright iPhone, Pip's bubble plus a two-row rack take about half the screen; the table above scrolls.
- **Match 1's difficulty (settled):** you won match 1 and called it "a good match", so the deal stays as it is.

## Known limitations

- The real 2026 card isn't entered yet (waiting for your card photos).
- The lessons aren't built yet (part 2 of build step 6). Until they exist, the start screen shows them as coming next, the readiness report's card-reading check shows "comes with the tutorial" and isn't counted, and rule spotlights have no "why" link to a lesson.
- Levels 1 and 3 of the computer players are starting settings, not tuned (build step 9). They are used in match 1 (level 1) and match 3 (one level 3 player, across from you). Level 2 bots expose often and win 94% of practice games; all need retuning against the real card.
- The coach's weights and the readiness thresholds are starting values to tune [M]: a hand is "viable" when it can still be finished and is within 2 tiles of the closest; Pace is the typical Charleston decision, 15 seconds or less.
- Undo (match 1) remembers your moves only while the page is open; a reload clears it.
- Playful and Classic tiles, the magnifier, sound and rearranging tiles by hand come later (step 7 and beyond).
- The IOU blind-pass method follows Tom Sloper's description; the NMJL's 2020 rule text wasn't found.
- Screens were checked with Chrome's engine at iPhone and Mac sizes (now including Claude's Mac panel), and you've played on your Mac; not yet on a real iPhone or in Safari. On an upright iPhone, Pip's bubble plus a two-row rack take about half the screen.
- On the smallest screens (an iPhone SE with Safari's toolbars, phones on their side), Pip's bubble sits below the table rather than with the rack, so you may scroll to see it.

## What's next

- **Milestone 4, part 2: the tutorial engine and its 14 lessons** (docs/05-teaching-plan.md section 3; scenario format in docs/07-app-spec.md section 9), built on Pip, round by round: round A first (A0 to A3), then B and C, then D and E with the recall questions wired into the readiness report's card-reading check. Each round is published and pushed when it's done. Finishing the tutorial unlocks Playful tiles.
- **Then:** step 7 (tile art polish: the Playful and Classic sets, the magnifier, and possibly the table redrawn with players around you) and step 9 (level 1 and 3 computer players, stats, export).
- **When your card photos arrive:** step 8, entering and checking the 2026 card (docs/03-card-2026.md section 7).

### Design for part 2 (Claude's proposal from build chat 4; adjust as the build teaches)

- **A tutorial module, src/tutorial/ (no screen code):**
  - Lesson data (one file per round): id (A0 to E2), round, title, teaching point, a list of beats, and 2 or 3 recall questions.
  - Beats: Pip explains (a spotlight on a part of the screen); a rigged table built with src/engine/scenario.ts and played under the engine's rules, with steps that say what to do, check the move, and answer a different move gently (the referee still explains anything illegal); drills that aren't games (A1 tap the tile Pip names from one of each tile; A2 put tiles into group slots; C1 to C4 build a card line two ways, checked by the matcher); and A0's short animated example.
  - A runner that steps through the beats, and checks used by the tests: tiles within supply and 152 in all, 13 or 14 tiles per seat as the phase needs, no jokers in scripted passes, every expected move legal when it comes up, and the lesson reachable to its end.
  - Recall questions: each has one right answer, a one-sentence "why", and a skill from docs/05-teaching-plan.md section 7 (tile names, groups, colors and suits, like numbers, runs, dragons, NEWS and year, Soap as zero, X and C, values and payments, joker placement, joker exchange, calling, Charleston, choosing a direction, declaring); card-reading ones are marked.
- **Lesson notes from the teaching plan:** A3 (four pungs and a pair, no card, no jokers, no Charleston, all racks face up) needs a tiny starter card with a few four-pungs-and-a-pair lines (the engine already loads cards by id), plus a rigged wall so the learner can finish, then a second short deal where the wall runs out (a wall game). B1's twist uses the referee's own reason for calling a discard for a pair; C3's uses the matcher's refusal of a joker in the year; E1 shows a concealed line becoming impossible after an exposure, then recovering with an X hand; E2 ends on the payout breakdown.
- **Progress:** progress gains lessons done and the latest answer to each recall question (correct, and whether a hint was used), plus rounds passed by the test-out quiz; older saves load as before. The tutorial is done when every round is done or tested out, which sets the Playful unlock (prefs.progress.tutorialDone).
- **The card-reading check:** passes when the latest answer to every card-reading skill was right without a hint, and says which skills to review otherwise; it then counts toward graduating early (your decision 4).
- **Screens:** Lessons on the start screen (rounds with ticks and a test-out quiz each); a lesson view reusing the table pieces (rack, buttons, seat map, Pip's bubble and spotlight); the drill and quiz views.
- **Tests:** one or more for every lesson (the checks above, followed through to the end), the recall questions, the progress and readiness changes, and the guardrails on all lesson text; the browser check takes round A at every size.

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
  - `node scripts/ui-check.cjs <folder> <games-per-size>` starts as a brand-new player (the welcome screen and Pip's whole tour), plays a free-play game, then guided matches 1 to 3 (dismissing spotlights, pinning a hand from Pip's chips, tapping a word, opening a face-up rack, hints, one undo) and checks graduation and a reload. Seven sizes, including Claude's Mac panel (mac-claude-panel, 720 by 780). Run them in parallel with SIZES=<one size> each (a few minutes per size); GUIDED=0 skips the guided matches. Its taps give up after 3 seconds and look again, so a sheet or spotlight opening mid-tap can't stall it.
- **Pip (milestone 4 part 1):**
  - src/ui/coachview.ts: Pip's words for each coach note (bubbleFor), the rule spotlights (RULE_SPOTS: where each points, Pip's lead-in), the tour (TOUR), the seat map (seatMap), and who lands on the start screen (isNewPlayer).
  - src/ui/glossary.ts: the 35 words you can tap (splitTerms links the first mention of each, whole words, longest spelling first).
  - src/ui/view/Pip.tsx: Pip (SVG), Words and TermCard, CoachBubble (in the dock), hands drawn as tiles (lineGroups, LineTiles, PatternTiles), and which tiles and button Pip points at (pipMarks, pipButton). src/ui/view/Spotlight.tsx: the spotlight (keeps its card fully on screen, even on a phone held sideways) and the seat map.
  - Layout: the dock (Pip's bubble, the rack, the buttons) sticks to the bottom on screens 600px tall or more; shorter screens use the older rows (only the buttons stick).
  - test/pip.test.ts covers the glossary, Pip's wording, the seat map, spotlight and tour coverage, the start screen rule, and the content guardrails on all new text.
- **Screen code rule:** never name a variable `h` in a .tsx file; it hides the screen library's `h()` inside JSX. A test checks.
- **Publishing:** publish dist/mahjong.html with the Artifact tool, passing the artifact's URL (above) so it updates in place. Capabilities are db and user; leave capabilities out on an update to keep them.
- **Git:** milestone 4 is built on branch milestone-4 (part 1 merged into main at the end of build chat 4); milestone 3 was built on branch milestone-3 and merged into main. Commit 489eadf on milestone-2 was recorded under the name "youngmabel" by mistake; rewriting published history was refused as destructive, so it stays.

## How to run (on a Mac with Node.js 22 or later)

In the app folder, run `npm install` once. Then `npm test`, `npm run build` (the playable page goes to dist/), `npm run sample`, `npm run sim` and `npm run card`.

## Prompt for the next chat

```text
Continuing work from earlier chats on my mah jongg practice app. Before anything else, read every file listed below directly; do not rely on this summary for what is in them. If a file and this summary disagree, trust the file and tell me.

THE PROJECT
I'm building a personal app (never commercial) to TEACH American mah jongg (National Mah Jongg League rules) to people who have no idea how to play, then let them practice solo against three computer opponents, using the 2026 NMJL card and a 152-tile set with no blanks. Done so far: milestone 1 (the rules engine, the card compiler with an invented practice card, level 2 computer opponents), milestone 2 (a playable screen, published as a private Claude artifact that saves my progress), milestone 3 (the coach and three guided matches with graduation) and milestone 4 part 1 (Pip, a visible coach: speech bubbles beside the rack, spotlights for first-time rules, a tour of the table, hands drawn as tiles, words you can tap, a seat map, and a start screen), with 198 passing tests. Your job in this chat is milestone 4 part 2: the tutorial engine and its 14 lessons, built on Pip, round by round.

READ FIRST
1. STATUS.md in my private GitHub repository youngmabel/mahjong-app, branch main (attach the repository with push access and clone it; it is the master copy). The same STATUS.md is in my MAHJONG folder (/Users/youngmabel/Documents/MAHJONG). It has what's done, every decision and who made it, the open questions, the proposed design for part 2, and technical notes.
2. In the repository's docs/ folder: 05-teaching-plan.md (sections 2, 3, 4, 6, 7 and 8: the lessons, beginner mistakes, readiness, hints and the content guardrails), 07-app-spec.md (section 9, the tutorial scenario format, and section 13, the practice card), 02-tiles-and-terms.md (tile names and "why it's called that" notes), 08-design-ideas.md, and 01-rules.md as needed.
3. The code: src/engine/scenario.ts (rigged tables), src/ui/coachview.ts, src/ui/glossary.ts, src/ui/view/Pip.tsx and view/Spotlight.tsx (Pip), src/coach/ (rulecards.ts, review.ts, note.ts), src/ui/session.ts, src/ui/progress.ts, src/ui/prefs.ts, src/ui/view/App.tsx, view/Coach.tsx, and scripts/ui-check.cjs.
4. The published app: https://claude.ai/artifact/Gytq4hufBNLTVDJBMxLtwX. Read it with the Artifact tool (read the URL without a path once before republishing), and update it in place by passing this link when you publish, so my saved games, settings and progress carry over.

DECISIONS ALREADY MADE (details, reasons and my exact words in STATUS.md)
- Standard NMJL rules, no house rules, no blank tiles. Our own tile art and our own card layout.
- The app is a private Claude artifact with progress in its private per-person storage. The code lives in the GitHub repository; MAHJONG/app/ is a read-only mirror refreshed at the end of each chat.
- Safety switch ON for the tutorial and guided matches 1 and 2, OFF for match 3 and (by default) free play. Scores in points. Sound off by default. Nine labeled rule choices (a to i) are approved.
- My rack keeps a fixed order and is never sorted by a target hand. "Hide concealed hands" also keeps concealed hands out of the coach.
- Tile sets: Clean now; Playful unlocks when I finish the tutorial, and Classic when I graduate ("wins are not needed - just finishing the training program and graduate").
- From milestone 3: one guided match is one game; free play stays open the whole time; I graduate after match 3, or early after a clean match 2.
- From build chat 4 (I approved all of Claude's recommendations): the coach is Pip, a small original bird that points at what it talks about; a seat map now, and redrawing the whole table waits for the tile-art step; the tutorial teaches what C means (lesson E1) while play keeps hiding concealed hands per my setting; once the tutorial exists the card-reading check counts toward graduating early after match 2, graduating after match 3 stays automatic, and the tutorial is recommended, not required.
- My feedback that shaped this: the old coach felt "a little robotic with it just being in the chatbox", and "The goal is to TEACH Mahjong to people who have no idea what they are doing". Lessons should be visual and hands-on, with Pip pointing at things, not walls of text.

WHAT I WANT FROM YOU IN THIS CHAT
1. Read the files. Ask me how Pip, the tour and the start screen worked (on my Mac, and on my iPhone if I've tried it), and fix anything I report first. Then give me a short plan for round A (lessons A0 to A3) and the tutorial engine, starting from the design in STATUS.md, and ask me to decide anything open, with a recommendation for each.
2. After I approve, build it without changing the engine's rules (bug fixes only, each with a test). Keep every existing test passing and add tests for every lesson. Continue with later rounds only as far as this chat comfortably allows.
3. Show me it works: update the published artifact in place, with all tests passing and the browser check run at all seven sizes (including Claude's Mac panel).
4. Before this chat would ever need to compact, and at the end: update STATUS.md (in the repository and my MAHJONG folder), merge to main and push to GitHub, refresh MAHJONG/app/, and give me a paste-ready prompt for the next chat.
If I attach photos of my 2026 card, also enter it (build step 8, following docs/03-card-2026.md section 7 and docs/CARD-NOTATION.md) and show me the line-by-line check.

GROUND RULES
- I'm not an experienced programmer. Make the technical calls yourself and explain them in plain words.
- Take rules from docs/01-rules.md (and the NMJL rulebook "Mah Jongg Made Easy" if I buy it). Don't invent rules. Where the notes mark something as medium or low confidence, flag it to me rather than guessing. Present rules as facts and hand advice as suggestions. Check all lesson text against the guardrails in docs/05-teaching-plan.md section 8 (test/pip.test.ts has an automatic guardrail check to extend).
- The engine is the referee: prevent illegal moves and explain them in a sentence or two.

SETUP IN THE NEW WORKSPACE
- Clone the repository, run npm ci, then npm run check (198 tests should pass) and npm run build.
- The browser check (node scripts/ui-check.cjs <folder> <games-per-size>) needs Playwright with Chromium, which Claude's build environment has. Run the seven sizes in parallel (SIZES=<one size> each); see the technical notes in STATUS.md.
- Commit under Claude's default git identity.

IF SOMETHING IS MISSING
This continues the chat "Mah jongg app milestone 4" from November 6, 2026 (Claude session https://claude.ai/code/session_01FMc1CEuuZ6TG34RRDUrH5s). Search my past chats for "mah jongg milestone 4", "Pip", "visible coach", "spotlight" or "start screen" if you need the exact wording of something.
```
