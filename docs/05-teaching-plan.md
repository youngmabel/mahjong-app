# 05. Teaching Plan: Tutorial, Guided Matches, Graduation

How beginners actually learn American mah jongg, and the lesson plan that follows from it. Tile names and "why it's called that" stories are in 02-tiles-and-terms; strategy tips are in 04-strategy; the scenario file format is in 07-app-spec, section 9. Confidence tags: [H] high, [M] medium, [L] low.

---

## 1. What the research says

**Lesson order.** Every teacher starts with the tiles. Most teach the card before full games, and the Charleston after the card, because passing depends on knowing which hands you might play. Calling is taught during live play, and strategy and scoring come last. Courses run 2 to 5 sessions; Tom Sloper recommends at least 3. [H] ([Sloper FAQ 26](https://sloperama.com/mjfaq/mjfaq26.html) and a dozen course outlines; see `research/teaching.md`)

One real disagreement: Elaine Sandberg teaches the card first and calls starting with a full rack "working backward"; Sloper has students play simple face-up games aiming at "four pungs and a pair" before they see the card, so they "have fun before I hit'em with the hard stuff." Both use play to teach the turn and the card to teach the goal. [H] ([Sloper column 308](https://sloperama.com/mahjongg/column308a.html); FAQ 26)

**What is hardest.** Sloper: "The card IS the most difficult thing to teach." Choosing a hand during the Charleston is close behind ("Absolutely!"). Then the joker rules ("rather complex"), slow play, and vocabulary. [H] (FAQ 26) Nobody memorizes the card; learners need to read its families and notation.

**What works.** First games played with every rack face up so the teacher can advise; tiles in hands quickly rather than long explanations; rules explained when the situation comes up ("layer the complexities on bit by bit"); cheat sheets within reach; a quiz after each chapter; drills that separate card reading from full play (make a hand from tiles; name possible hands from a few tiles; guess an opponent's hand from their exposures). [H] (FAQ 26; [I Love Mahj Learn page](https://ilovemahj.com/learn-american-mah-jongg))

**Learning science that applies** [M to H] (sources in `research/teaching.md`, section 5):

- In a study of more than 45,000 players, tutorials helped only in the complex game, and only when instructions appeared at the moment they applied: 40% more levels completed than an up-front manual. American mah jongg is a complex game, so build the tutorial, and teach just in time. (Andersen et al., CHI 2012)
- Worked examples first, then partly finished examples, then solo problems ("fading"). (Renkl and Atkinson, 2003)
- Immediate, specific, one-or-two-sentence feedback for novices; delayed feedback later helps transfer. (Shute, 2008)
- Hints on request in tiers, with the final "here is the answer" tier only after an attempt; unprompted help only after repeated errors. (Koedinger and Aleven, 2007)
- Short quizzes and spaced practice are the two most effective study methods. (Dunlosky et al., 2013; Cepeda et al., 2006)
- Track skills separately and move on when each is mastered. (Koedinger and Aleven, 2007)
- One concept per level: introduce, develop, twist, conclude (Nintendo's level design).

**What other apps do.** They rank candidate hands by tiles still needed, let the player pin a target hand, offer practice bots that don't win, and give daily puzzles. None documents fading its help or mastery-based progression. That is this app's opening. [M] (App Store listings and help pages)

## 2. Design rules for this app

1. One teaching point per scenario, in four beats: introduce, develop, twist, conclude.
2. Teach rules just in time: a short rule card appears the first time its situation arises.
3. Let the learner make the wrong move, then explain in one or two sentences, instead of silently blocking everything. (Illegal moves are still prevented; the explanation is the lesson.)
4. Worked example, then a partly finished one, then the learner alone.
5. Practice that doesn't count: undo in the tutorial and the first match, and a first match the learner can actually win.
6. Every scenario ends with a 2 or 3 question recall check; card-reading questions come back in later rounds.
7. Never compare the learner with other players.
8. Show the pinned card line next to the rack with matched tiles marked, not on a separate screen.
9. Don't rely on color alone (color-blind players); use labels and shapes too.
10. Label every teaching simplification as temporary on screen.

## 3. The tutorial: 5 rounds, 14 scenarios

Each round fits in one sitting. A returning player can take a quick test-out quiz to skip a round. Lessons use the invented practice card (07-app-spec, section 13) until noted.

| Round | Scenario | Teaching point | How it plays (and the twist) |
|---|---|---|---|
| **A. Tiles and turns** | A0 The goal | A winning hand is 14 tiles that match one line on the card; a turn is draw, then discard | A 60-second animated example. No rule list. |
| | A1 The Big Square | Every tile's name: three suits 1 to 9, winds, dragons and the suit each goes with, flowers, jokers | Lay out one of each tile; tap the tile the app names. Short "why it's called that" notes (02-tiles-and-terms). Foreshadow Soap's second job as zero. |
| | A2 Groups | Single, pair, pung, kong, quint, sextet; NEWS and a year are groups of singles | Drag tiles into group slots. Twist: call NEWS a kong and see why it isn't one. |
| | A3 First game, simplified | The rhythm: East starts with 14 and discards first; play goes to the right; discards are named | Four pungs and a pair, no card, no jokers, no Charleston, all racks face up. Twist: the wall runs out and nobody wins (a wall game). Labeled as a practice simplification. |
| **B. Calling and jokers** | B1 Calling | Claim a discard only for a pung, kong, quint, or sextet, or to win; the window; priority | A bot discards a tile you can use; call, expose, discard. Twist: try to call for a pair and learn it's allowed only if it wins. |
| | B2 Jokers | Jokers fill only groups of 3 or more; never passed; a discarded joker is dead; redeem on your own turn | Joker completes a pung; joker sits in an exposure; try a joker in a pair (refused, with the reason); redeem a joker from a bot's exposure. |
| **C. The card** | C1 Reading a line | Colors show how many suits, not which; X and C; the value; the small print; letters and 0 | Build one line in two different suit combinations, both accepted. Then "which rack fits this line?" |
| | C2 Number families | Like numbers; evens and odds; 369 | Build the same line with different numbers. Twist: a "these numbers only" note. |
| | C3 Dragons, winds, and the year | Matching and opposite dragons; NEWS; the year with Soap as zero | Count-the-suits puzzles. Twist: a joker in the year group is refused, with the reason. |
| | C4 Quints, then runs | Quints need jokers; runs slide but keep their order, and are single tiles | Quints first, then runs (Sloper's order). Twist: try to call a discard or use a joker to finish a run; both refused unless the call wins. |
| **D. Deal to Charleston** | D1 Choosing a direction | Look at families before specific lines; keep two candidates; Sloper's steps (jokers, pairs, friends, high/low, odd/even) | A worked example, then a half-finished one, then one on your own. |
| | D2 Charleston mechanics | Right, across, left; optional left, across, right; stopping; blind passes; courtesy pass; no jokers; "ROLLOR" | The app makes the first pass with narration; you make the rest. Twist: a blind pass on the first left. |
| **E. Winning correctly** | E1 Concealed and dead hands | C hands call only the winning tile; what makes a hand dead | Expose a group while holding a C hand and see the result; recover and play an X hand. |
| | E2 Declaring and scoring | Lay out the hand in card order; base value; discarder pays double; self-pick doubles for all; jokerless doubles | Declare a win and see the payout breakdown. |

**After your 2026 card is loaded**, add one more: **"Meet the 2026 card,"** a guided tour of its nine sections in the app's own display, with what's new this year (03-card-2026, section 5) and how the app's markers map to the colors on your printed card.

## 4. Beginner mistakes the app should anticipate

From Sloper's columns 809, 815 and 817, I Love Mahj, Mahjong 4 Friends, and Donna Miller-Small. [H] (see `research/teaching.md`, section 2)

| Mistake | Correct reading | App response |
|---|---|---|
| Thinking a card color names a suit | Colors show how many suits and which tiles share one | Show the same line accepted in several suit combinations |
| Reading printed numbers literally on "any like numbers" lines | The printed number stands for whatever number you choose | Build it with 3s, then 7s |
| Treating runs like Chinese chows | A run is single tiles in the printed order: no jokers, no calling except to win | Refuse with a one-line reason |
| Calling NEWS or a year group a kong | They are singles | Refuse with a reason |
| Jokers in pairs or singles | Only in groups of 3 or more | Refuse with a reason |
| Miscounting suits when dragons are involved | Dragons belong to suits: Red/Craks, Green/Bams, Soap/Dots | Count-the-suits puzzles |
| Using Soap as zero where no 0 is printed | Soap is zero only where the card shows 0 | Refuse with a reason |
| Exposing in a concealed (C) hand | C hands expose nothing before Mah Jongg | Gray out Call with a reason while a C line is pinned |
| Exposing more than the called group | Expose exactly the group you're completing | Exposure picker shows only legal sizes |
| Locking into one hand too early | Keep a loose direction and 2 candidates through the Charleston | Coach tip; Gilligan's 2026 simulation found early commitment was the biggest weakness |
| Passing pairs, flowers, or honors too fast | Pairs are the hard part (jokers can't fill them, and they can't be called) | Charleston coach flags it |
| Agonizing over defense, playing slowly | Build your hand first; keep the game moving | Gentle pace indicator (Sloper allows 10 to 15 seconds per Charleston pass), never a punishing timer |
| Playing a hand from last year's card | Only the current card counts | Card file carries its year; new-card lesson each spring |

Settled point: whether an exposure can be changed after it's placed. Teaching sources disagree, but the back of the 2026 card says "A player may change the number and type of tiles displayed in an exposure up until the player has discarded" ([Sloper column 816](https://sloperama.com/mahjongg/column2/column816.html)). [H]

## 5. Guided practice matches

Support fades across the matches, the way teachers move from an open table to concealed tiles. The number of matches adapts: you graduate after any match where the readiness checks in section 6 pass, and after match 3 regardless.

**Match 1: open table.**

- All four racks face up, as in Sloper's lessons; bots narrate each decision in one sentence (worked examples).
- The coach proposes 2 or 3 target lines ranked by tiles needed; you pin one or two.
- Rule errors get immediate one-or-two-sentence explanations; rule cards appear the first time a situation arises; undo is on.
- The Charleston fades within the match: the first pass fully narrated, the next half done (the coach picks 2 tiles, you pick the third), then yours.
- Gentle bots tuned so you can finish a hand (labeled as a practice setting). Seeded deal starting within reach of a Consecutive Run line, the section that wins most often in simulation.
- Strategy taught: keep options open in the Charleston; pairs are the hard part, so favor hands whose pairs you already hold; save jokers for pungs and kongs.

**Match 2: concealed table.**

- Bot racks hidden. Target suggestions only on request, through tiered hints.
- Rule errors still get immediate feedback; strategy feedback moves to an end-of-hand review.
- New skills: reading opponents' exposures, when to call versus wait, when to switch hands, joker exchanges.
- Normal-strength bots that can win.

**Match 3: dress rehearsal.**

- Free-play conditions with the cheat sheet you'll keep, plus a small hint budget.
- Rules enforced as at a real table; if you make a hand-killing exposure, it goes dead and is explained afterward.
- New skills: defense (not feeding exposures), counting the wall, blind passes, stopping the Charleston.
- Full post-game review.

Strategy content for each match comes from 04-strategy.

## 6. Graduation

Your vision: graduate after the guided matches, then play generated games with only a cheat sheet. Teachers have no published readiness rubric, so these checks are a synthesis; treat them as starting values to tune. [M]

**Readiness checks** (shown as a short report after each guided match):

1. **Rules**: a full match with no illegal move attempted and no dead hand.
2. **Card reading**: the recall questions from rounds A to E answered correctly (each concept tracked separately; hint use counts against it).
3. **Hand selection**: by the end of the Charleston, you picked a direction the app's own ranking considers viable.
4. **Pace** (advice only): typical Charleston decision around 15 seconds or less.
5. **Optional retention check**: a short card-reading quiz a day or more later.

Winning is not a requirement: the outcome of one game is largely luck, and beginners lose a lot even when they play correctly.

**After graduation**:

- Free play with generated games, bot level of your choice, and only the cheat sheet (no coach, no tiles-away counts unless you turn hints on in settings).
- Tutorial and guided matches stay replayable; nobody is forced to graduate.
- Occasional short card-reading puzzles at growing intervals (spaced practice).
- A "new card" lesson each spring when the next card arrives. Keep card-specific lessons separate from rules that never change, so the yearly update is cheap.

## 7. Hints and feedback

- Four hint tiers: a nudge, then the family, then the specific line, then the answer (only after an attempt).
- Unprompted help only after repeated errors on the same skill.
- Every explanation is one or two sentences, with a "why" link back to the lesson that taught it.
- Present rules as facts and hand advice as suggestions.

**Skills to track separately**: tile names; group types; colors and suits; like numbers; runs; dragons (matching and opposite); NEWS and year groups; Soap as zero; X and C; values and payments; joker placement; joker exchange; calling legality and timing; Charleston mechanics; choosing a direction; declaring Mah Jongg.

## 8. Content guardrails

- Teach only official rules (01-rules). Mention house rules only as "you may meet this at some tables."
- Check all tutorial text against the errors Sloper found in new, apparently AI-written beginner books (May 2026): claiming the card specifies suits; treating runs as chows; recommending chows; saying pungs may be exposed freely but kongs must be concealed; inventing four wind rounds; getting the direction of play or the deal wrong. [H] ([Sloper column 817](https://sloperama.com/mahjongg/column2/column817.html))
- Keep the tone of a patient teacher: mistakes are expected, questions welcome.

---

### Sources

Full research notes with all links: `research/teaching.md`. Key sources: [Sloper FAQ 26, So You Want To Teach Mah-Jongg](https://sloperama.com/mjfaq/mjfaq26.html); Sloper columns [308](https://sloperama.com/mahjongg/column308a.html), [725](https://sloperama.com/mahjongg/column2/column725.html), [809](https://sloperama.com/mahjongg/column2/column809.html), [815](https://sloperama.com/mahjongg/column2/column815.html), [816](https://sloperama.com/mahjongg/column2/column816.html), [817](https://sloperama.com/mahjongg/column2/column817.html); [I Love Mahj, Beginner's Guide](https://ilovemahj.com/american-mahjong-getting-started) and [Learn page](https://ilovemahj.com/learn-american-mah-jongg); [Mahjong 4 Friends, beginner guide](https://mahjong4friends.com/guides/mah-jongg-for-beginners); [Andersen et al., CHI 2012](https://grail.cs.washington.edu/projects/game-abtesting/chi2012/chi2012.pdf); [Shute 2008](https://myweb.fsu.edu/vshute/pdf/shute%202008_b.pdf); [Koedinger and Aleven 2007](https://pslcdatashop.web.cmu.edu/KDDCup/FAQ/Koedinger-Aleven-EPR-07.pdf); [Renkl and Atkinson 2003](https://asu.elsevierpure.com/en/publications/structuring-the-transition-from-example-study-to-problem-solving--2); [Dunlosky et al. 2013](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html); [Cepeda et al. 2006](https://pubmed.ncbi.nlm.nih.gov/16719566/); [Sarah Gilligan, Fuzzy Match](https://fuzzymatch.substack.com/p/i-taught-a-computer-to-play-the-2026).
