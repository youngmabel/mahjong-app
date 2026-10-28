# 04. Strategy: Coaching Tips and Computer Opponent Behavior

Strategy for two uses: (a) what the coach teaches in the guided matches, and (b) how the computer opponents play at different skill levels. Main authorities: Tom Sloper (Sloperama FAQs and columns, which quote NMJL rules closely), teacher and author Elaine Sandberg, teacher Linda Fisher (via Sloper's strategy FAQ), and I Love Mahj (the only large-scale published statistics, from one platform that mixes bot and human games). Full research with every link: `research/strategy.md`. Confidence tags: [H] high, [M] medium, [L] low.

---

## 1. The big ideas

1. **Pairs and singles are the bottleneck.** Jokers can't fill them and you can't call a discard for them (except your winning tile). Hands whose pairs you already hold come together; hands that need pairs you don't have usually don't. [H] (Fisher via [Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html); [I Love Mahj strategy guide](https://ilovemahj.com/american-mahjong-strategy); [Sloper column 631](https://sloperama.com/mahjongg/column2/column631.html))
2. **The Charleston is elimination, not choosing "the one right hand."** Pass what fits least, and narrow gradually. [H] (Sloper columns [630](https://sloperama.com/mahjongg/column2/column630.html) and [631](https://sloperama.com/mahjongg/column2/column631.html))
3. **Funnel**: keep 2 or 3 sections in mind on the deal, about 2 hands by the end of the Charleston, then one main hand with a backup that shares tiles. [H] (Sloper; Mahjong 4 Friends; The Mah Jongg Insider)
4. **Consecutive Run is the safe haven.** Sloper calls it the easiest and most powerful section; it has the most variations and wins the most often in every data source. [H]
5. **Save jokers and keep them hidden; take exposed jokers when you can.** [H]
6. **Don't call early.** A common rule of thumb is about seven tiles toward a hand before your first exposure; exposures reveal and lock in your hand. [M-H]
7. **Defense grows as the game goes on.** Never discard into a player's third exposure; when your hand can't finish in time, play safe. [H]

## 2. Phase by phase: coaching tips and bot behavior

### 2.1 Reading the deal and choosing hands

**Sloper's steps** (revised 2019; the clearest published method) [H, one expert's system] ([column 725](https://sloperama.com/mahjongg/column2/column725.html)):

- **Step 0, jokers**: none suggests Singles and Pairs; two or more suggests Quints.
- **Step 1, pairs**: find pairs, pungs, and groups of singles (like NEWS or the year).
- **Step 2, "friends"**: find hands that use two of your pairs together. No pairs? Look for a concentration (winds, dragons, 369, like numbers).
- **Step 3, high or low**: count low (1 to 5) versus high (5 to 9) tiles, which points toward Consecutive Runs.
- **Step 4, odd or even**: if still undecided, pass the three tiles you think best.

**What a typical deal looks like** (calculation; verified) [H]: no jokers 48% of the time, one 38%, two 12%, three or more 2%. About 1.4 pairs on average (17% of deals have none). About 8% of deals include a natural pung. So "a pair or two and no joker" is the normal start, and Sloper's "two or more jokers, consider Quints" applies to only about 14% of deals.

**Coaching tips**:

- Sort, count your jokers, then find your pairs.
- Look for a section first, not an exact line.
- Count your real tiles toward each hand; treat jokers as a bonus that only works in groups of three or more.
- When two hands are close, choose the one that already has its pairs, isn't concealed, and shares tiles with a backup.
- If nothing stands out, Consecutive Run is the most forgiving section.

**Bot behavior**: score each concrete target by weighted distance, with missing single and pair slots costing more than missing group slots (start at about 1.5 to 2 times); penalize concealed targets; scale gaps by live copies; keep the top 3 targets during the first Charleston, 2 after, then 1 main plus 1 backup; prefer target sets whose missing tiles overlap. A personality knob trades value against completion probability ("win big" versus cautious).

### 2.2 The Charleston

**Keep**: pairs, flowers, Soaps (they double as dragons and zeros), and tiles that fit together. **Pass**: what fits your emerging sections least. Never pass a joker (a rule, not a strategy); "don't pass flowers" is strategy. [H] (I Love Mahj; Sloper columns [588](https://sloperama.com/mahjongg/column2/column588.html), 725)

- Don't hand one player a ready-made set; split related tiles across passes. If you must break an unneeded pair, send its two tiles to different players. [H]
- **Blind pass** on the first left or last right when you can't find three expendable tiles. [H]
- **The "evil second across"** (Sloper): no blind pass allowed, so if you must give up something useful, pass from a pung or kong rather than breaking a pair. [H] ([Sloper FAQ 28](https://sloperama.com/mjfaq/mjfaq28.html))
- **Second Charleston**: continue if you have at least three easy passes (nine new tiles is a lot). Stop only with a strong hand or two strong contenders. Sources disagree on the exact threshold, and Sloper warns that stopping often irritates the table. [M]
- **Courtesy pass**: if the player across stopped the Charleston, they may be close, so skipping is often prudent. Trade when your tiles are good; refuse when they're poor. [M]
- **Watch the passes**: which tiles never come back, which types you never receive. Weak clues, but real. [M]
- **2026**: flowers matter more than usual (two hands need six flowers; several need flower pungs). Keep yours early. [H] ([Sloper column 815](https://sloperama.com/mahjongg/column2/column815.html))

**Bot behavior**: usefulness of a tile = how much it lowers distance across the top targets; pass the three least useful, judging the three as a set. Hard rule: never a joker. Soft penalties for passing a pair, a flower, a Soap while year or dragon hands are live, or two related tiles in one pass. Blind pass when fewer than three tiles fall below a usefulness threshold. Stop the second Charleston only if expendables are under three and the hand is strong, with a per-session cap for etiquette. Log what each seat passes and feed it into the opponent model.

### 2.3 Jokers

**Data**: jokers are the biggest luck factor. On the 2022 card, I Love Mahj players won 4.6% of games when they received no jokers, 13.2% with one, 27.0% with two, 41.1% with three, and 51.4% with four. [M] (one platform, bots included; [I Love Mahj statistics](https://ilovemahj.com/mah-jongg-statistics))

**Coaching tips**:

- Jokers only work in groups of three or more, never in a pair or a single.
- Keep jokers hidden as long as you can; an exposed joker can be taken by anyone holding the real tile.
- Every turn, check every exposure for a joker you could exchange for. Taking an exposed joker is usually right even when you don't need it, because it denies it to others (Fisher). The trade-off: it might leave that opponent jokerless and paid double.
- With two jokers, split them across two exposures rather than putting both in one.
- Don't discard a joker you can still use. Once you're only defending, a joker is the safest discard there is, because it is dead the instant it's thrown (Sloper).
- If someone else throws a joker, be careful: they may be waiting on a single or pair.

**Advanced (expert bots only)**: "joker bait": hold an unneeded pair and, around the middle of the game, discard one tile hoping someone calls it with a joker you can then redeem. Not with winds, not early, not late. [M]

### 2.4 Calling and exposing

- **Wait**: I Love Mahj's rule of thumb is about seven tiles toward Mah Jongg before calling; Sloper: "Don't be too quick to take a discard in the early part of the game." Exception: a call that completes a natural kong useful in several hands. [M-H]
- **Information cost**: one exposure narrows your hand; two usually identify it. On the 2026 card, Consecutive Run #4 can pass for its "cousin" hands in other sections until a second exposure shows. [H]
- **Concealed hands** win about a tenth as often as exposed ones (I Love Mahj 2024 data), though they usually carry higher values. At equal tile counts, prefer the exposed hand. You can also finish an exposed-type hand without ever exposing, which hides information. [M-H]
- **Before exposing, check it fits a real line**; a wrong exposure kills your hand. [H]
- Disagreement noted: Sandberg suggests waiting for a second copy before calling; no other source corroborates this and only four copies exist. Treat it as a style option for one bot personality. [L]

**Bot behavior**: call for an exposure only if the hand isn't concealed, the tile completes a group in the main target, the commitment threshold is met (about 7 matched tiles, lower as the wall shortens; about 4 to 5 for "eager" beginner bots), and the exposure still fits a backup or the bot is fully committed. Always claim a legal Mah Jongg. Validate every exposure against the expanded card first.

### 2.5 Switching hands

- Don't switch too early: losing a few tiles is no reason to abandon a hand, given 8 jokers and 4 copies of most tiles. [H]
- Signals to pivot: crucial tiles never appear; they were discarded when you couldn't claim them; an opponent exposes tiles you need; the third copy of a tile you need as a pair is discarded. [H]
- Switch once if you must, not over and over. [H]
- **Is there time?** Sloper: "The wall has to be at least 12 stacks long if I still need to pick 6 tiles," a floor of roughly four wall tiles per tile still needed. Wall tiles divided by four is about how many more turns you get. [H as a floor]

**Bot behavior**: recompute feasibility after every visible tile; switch main targets only when the new one beats the old by a margin (hysteresis, so bots don't flip-flop); if distance exceeds remaining own draws (wall divided by 4), switch to defense.

### 2.6 Defense

- **Why**: the discarder of the winning tile pays double. [H]
- **When**: nothing is hot at the start; danger grows with every exposure and every wall that disappears. [H]
- **Hot and safe tiles**: a tile nobody has thrown by mid-game is probably hot; once two copies are discarded, a third is usually safe. Throw tiles you'll never use before they get hotter, flowers especially; don't throw raw tiles late. [H] (Sandberg, "The Hot Tile"; Sloper FAQ 8)
- **Exposure count rule** (Fisher): "discard to a second exposure at great risk and never discard to a third exposure, even if you have to break up a good hand." [H]
- **When to stop chasing**: your hand is dead; the wall is too short for what you need; or you're sure you hold an opponent's winning tile. Then play safe: tiles dead for everyone first, then tiles with two or more copies out, then jokers last. [H]
- **Calling others dead**: if an exposure matches no hand, call it; "One less player means more picks for you." [H] (Sloper column 576)
- **Reading discards**: early discards are the strongest clues; a mid-game discard may just be a spare copy. [M]

**Bot behavior** (levels 2 and 3): keep a candidate set for each opponent consistent with their exposures; estimate each opponent's readiness from exposure count, wall depletion, a joker discard (big spike), and stopping the Charleston (small spike); danger of a tile = the chance it completes a group or Mah Jongg for a ready opponent; choose discards that minimize own loss plus danger times the payout cost, with the weight on danger rising late in the wall. Fold when the wall is under 4 times your distance, or an opponent has 3 exposures while you're 2 or more away.

## 3. Numbers for coaching and calibration

| Fact | Value | Source and confidence |
|---|---|---|
| Wall after the deal | 99 tiles (152 minus 53 dealt) | arithmetic [H] |
| Wall games | about 7 to 11% (I Love Mahj); about 11% (Gilligan's 2026 simulation) | [M] |
| Fair share of wins against three equal opponents | about 22% | I Love Mahj [M] |
| Concealed vs exposed hands | concealed win about a tenth as often | I Love Mahj 2024 [M] |
| Section share of wins | Consecutive Run 45% (2023), 28.6% (2024); 2024: Winds-Dragons 21.1%, Like Numbers 19.2%, 13579 10.1%, 2468 8.8%, 369 7.1%, year 3.6%; Quints under 1%; Singles and Pairs about 0.1% | I Love Mahj [M] |
| 2026 card | Consecutive Run won about 30% of games in Gilligan's simulation; Quints 12 of 5,328 wins | [M] (03-card-2026) |
| Human decision speed | about 17 seconds per Charleston decision, 3.5 seconds per turn | I Love Mahj 2022 [M] |

**Chance of drawing at least one live copy** (verified calculation; assumes the copies are randomly placed among the tiles you can't see):

| Unseen tiles | Live copies | 4 more draws | 8 more draws | 12 more draws |
|---|---|---|---|---|
| 90 | 1 | 4% | 9% | 13% |
| 90 | 2 | 9% | 17% | 25% |
| 90 | 3 | 13% | 25% | 35% |
| 60 | 1 | 7% | 13% | 20% |
| 60 | 2 | 13% | 25% | 36% |
| 60 | 3 | 19% | 35% | 49% |
| 40 | 1 | 10% | 20% | 30% |
| 40 | 2 | 19% | 36% | 52% |
| 40 | 3 | 28% | 50% | 67% |

Coaching takeaway: a pair or single you need with only one live copy left is a long shot; switch early.

## 4. The 11 common beginner strategy mistakes

[H where two or more sources agree] (I Love Mahj; Sloper FAQ 8; Mahjong 4 Friends; Sandberg)

1. Calling too early (including exposing jokers early).
2. Committing too early, then switching too often (or giving up too soon).
3. Passing pairs or flowers in the Charleston.
4. Missing joker exchanges.
5. Discarding raw or hot tiles late, especially into second and third exposures.
6. Over-reading discards (a discard doesn't mean they have none; an uncalled tile isn't proof it's safe).
7. Telegraphing through pace, gaps in the rack, or arranging flowers and exposures revealingly.
8. Stopping the Charleston too often.
9. Chasing high-value, low-probability hands (Sloper's "win big" view is the counterpoint; coach achievability first, value later).
10. Misreading the card (colors aren't suits; zero is always Soap; year, NEWS, and short runs are singles; no chows; concealed lines can't be partly exposed; sextets can't be split).
11. Overthinking or rushing.

## 5. What to teach in which guided match

| Match | Strategy lessons |
|---|---|
| 1. Open table | Sloper's steps for reading a deal; pairs are the bottleneck; Charleston as elimination (keep pairs, flowers, Soaps); save jokers; Consecutive Run as the safe haven |
| 2. Concealed table | The funnel (two candidates, then main plus backup); the seven-tile calling rule and the information cost of exposing; joker exchanges every turn; when to switch; reading exposures |
| 3. Dress rehearsal | Hot and safe tiles; never feed a third exposure; counting the wall (four tiles per tile needed); when to fold and what to throw; blind passes and stopping the Charleston |

## 6. Making computer opponents feel real

The full bot design is in 07-app-spec, section 7. Additions from the strategy research:

- **Never peek** at hidden tiles or the wall (I Love Mahj states this standard publicly). Offer a post-game view of all racks to build trust.
- **Pace like people**, scaled down for an app: think time proportional to difficulty, anchored on about 17 seconds per Charleston decision and 3.5 per turn for humans.
- **Animate joker exchanges one at a time**; a bot swapping three jokers at once looked rigged to reviewers of another app.
- **At easy levels, avoid implausibly fast wins.** Reviewers of another app complained bots won "with less than 25 tiles played."
- **Personalities**: a favorite section, value-versus-safety appetite, separate offense and defense levels, and an etiquette cap on Charleston stops.
- **Beginner bots** can stick to familiar sections (Consecutive Run, 13579, 2468, Like Numbers), the way new players learn; expert bots use the whole card, including flower-sextet and concealed lines.
- **Low-level mistakes must be legal**: imperfect choices, never rule breaks.
- **Bots should call dead hands** when certain (intermediate and expert), as real players do.

Reviewer complaints to avoid (from another app's reviews) [L]: bots that never defend, throw "the obviously needed tile for Mahj," or win implausibly fast.

## 7. 2026 card strategy notes

[M to H] (Sloper column 815 and his 2026 card FAQ; I Love Mahj clarifications; The Mah Jongg Insider; verify line details against your card)

- **Standout hand**: Sloper singles out Consecutive Run #4 (a pung-pung-kong-kong hand with no pairs, so jokers work anywhere) as easy, flexible, and "most powerful." Its "cousins" sit in 2468, 13579, and 369.
- **Harder**: the four-pair East-West hand in 2468 (Sloper). The six-flower hands and the two hands that need all three dragons as single tiles are likely demanding too (inference).
- **Defensive point**: only concealed hands on the 2026 card use two pungs of the same number, so a player who exposes two same-number pungs is dead and can be called dead (Sloper: "a dead giveaway"). [H]
- **Flower-heavy card**: keep flowers early; don't throw them late.
- **Floating pairs** in 13579 and 369: the pair can be any of the listed numbers, and the kongs must match it.
- **Concealed lines**: one guide lists 2468 #8, Consecutive Run #8, 13579 #8 and #9, Winds-Dragons #8, 369 #6, and all of Singles and Pairs; Sloper independently confirms three of these. Check your card.
- **Values don't track difficulty**: Sloper notes a four-pair 2468 hand and a three-pair 13579 hand carry the same value.
- Some players report more wall games with the 2026 card than usual (anecdote). [L]

---

### Sources

Full notes and links: `research/strategy.md`. Key sources: [Sloper FAQ 8, Strategy](https://sloperama.com/mjfaq/mjfaq08.html); [Sloper FAQ 28](https://sloperama.com/mjfaq/mjfaq28.html); Sloper columns [630](https://sloperama.com/mahjongg/column2/column630.html), [631](https://sloperama.com/mahjongg/column2/column631.html), [725](https://sloperama.com/mahjongg/column2/column725.html), [724](https://sloperama.com/mahjongg/column2/column724.html), [576](https://sloperama.com/mahjongg/column2/column576.html), [588](https://sloperama.com/mahjongg/column2/column588.html), [815](https://sloperama.com/mahjongg/column2/column815.html); [Sloper 2026 card FAQ](https://sloperama.com/mjfaq/2026.html); [I Love Mahj strategy guide](https://ilovemahj.com/american-mahjong-strategy) and statistics ([2022](https://ilovemahj.com/mah-jongg-statistics), [2023](https://ilovemahj.com/mah-jongg-statistics2023), [2024](https://ilovemahj.com/mah-jongg-statistics2024)); Elaine Sandberg, ["Defense! Defense! Defense!"](https://jewishjournal.com/?p=81162) and ["The Hot Tile"](https://jewishjournal.com/?p=88918); [Mahjong 4 Friends strategy guides](https://mahjong4friends.com/guides/mah-jongg-strategy); [The Mah Jongg Insider](https://mahjong.beehiiv.com/p/04-13-26-the-smart-way-to-approach-the-2026-card).
