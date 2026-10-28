# American Mah Jongg Strategy: Research Notes for Coaching and Bot Design

> **Note added after the independent fact check (research/factcheck.md):** where this file and the main notes (01 to 08) differ, the main notes carry the corrected version.

Prepared October 26, 2026, for a personal learning app: one human against three computer opponents, official NMJL rules, the 2026 card, a 152-tile set with no blanks.

Scope: strategy only, for (a) coaching tips in guided practice matches and (b) believable computer opponents at several skill levels. Rules appear only where strategy depends on them (Section 1).

## 0. How to read these notes

**Source weighting.** The most useful authority is Tom Sloper (Sloperama FAQs and his weekly "Sloper on Mah-Jongg" column), who quotes NMJL rule text, the rulebook *Mah Jongg Made Easy*, and the annual NMJL bulletins closely. Elaine Sandberg is a longtime teacher and author of two Tuttle books on the American game ([Tuttle](https://www.tuttlepublishing.com/bestsellers/winning-american-mah-jongg-strategies)); her strategy columns ran in the Jewish Journal in 2010 and 2011. Linda Fisher is a teacher whose tip list Sloper reproduces in his strategy FAQ. I Love Mahj (ILM, by Julie and Philippe) runs a large online platform and publishes the only large-scale statistics found, drawn from "millions of games" that include bot games; treat their numbers as one platform's data. The Mah Jongg Insider (a beehiiv newsletter) and Mahjong 4 Friends (an online platform's guides) are useful but editorial and sometimes loose on rules. App listings and reviews are anecdotal. The NMJL website FAQ was "under construction" and its January 2026 bulletin is an image flipbook that could not be read, so official rules are cited through Sloper's quotations.

**Confidence scale.** High: official rule text, or consistent across several strong sources. Medium: one strong source, or several weaker ones. Low: a single weak or anecdotal source, or my own inference.

**Labels.** "My calculation" or "my inference" marks content I derived rather than found.

**Short glossary.** Pung, kong, quint, sextet: 3, 4, 5, 6 identical tiles. Soap: the white dragon, which also serves as zero. Exposure: a group placed face up after calling a discard. Hot tile: a tile likely to give someone a call or Mah Jongg. Raw tile: a tile not yet seen in the discards. Key tile: in Sloper's usage, a tile whose death kills an opponent's hand. Dogging: breaking up your own hand to discard safely. Joker bait: discarding a tile in the hope that an opponent calls it with a joker you can then redeem.

---

## 1. Rules baseline that strategy depends on (official vs house vs tournament)

| Topic | Official NMJL position | Confidence |
|---|---|---|
| Tile counts | 152 tiles: 4 of each suit tile, wind and dragon; 8 flowers; 8 jokers ([ILM guide](https://ilovemahj.com/american-mahjong-strategy), [Wikipedia](https://en.wikipedia.org/wiki/American_mahjong)). After the deal (53 tiles), 99 remain in the wall ([Mahjong 4 Friends](https://mahjong4friends.com/guides/advanced-mah-jongg-strategies)). Zeros are always soaps ([Sloper 2026 FAQ](https://sloperama.com/mjfaq/2026.html)). | High |
| Charleston order | First Charleston is mandatory: right, across, left. Second is optional: left, across, right ([The Mahjong Line](https://themahjongline.com/pages/the-big-card-american-mahjong-101), [ILM Q601](https://ilovemahj.com/mah-jongg-question/601/when-can-you-stop-passing-during-the-charleston-in-mah-jongg)). | High |
| Stopping | Any one player may stop after the first Charleston, with no reason needed ([Sloper FAQ 28](https://sloperama.com/mjfaq/mjfaq28.html)); per the January 2023 newsletter it may be stopped as long as no one has picked up the second left pass ([Sloper col. 783](https://www.sloperama.com/mahjongg/column2/column783.html)). | High |
| Blind pass | Allowed on the first left and the last right: pass 1 to 3 of the tiles just received without looking, still passing 3 in total ([The Mahjong Line](https://themahjongline.com/pages/the-big-card-american-mahjong-101), [Wikipedia](https://en.wikipedia.org/wiki/American_mahjong)). Not allowed on the second left ([Sloper col. 729](https://www.sloperama.com/mahjongg/column2/column729.html)). When everyone must blind pass, a 2020 NMJL rule supports the "IOU" method ([Sloper col. 534](https://sloperama.com/mahjongg/column534a.html), [ILM Q609](https://ilovemahj.com/mah-jongg-question/609/if-on-the-last-pass-right-of-the-second-charleston-all-four-players-want-to-blind-pass-one-tile-can-everyone-just-pass--tiles-and-eliminate-the-blind-tile--otherwise-no-one-has-a-third-tile-to-pass)). | High |
| Courtesy pass | Optional exchange of 0 to 3 tiles with the player across; the player who wants fewer sets the number ([The Mahjong Line](https://themahjongline.com/pages/the-big-card-american-mahjong-101)). Stopping the Charleston does not cancel it ([Sloper FAQ 28](https://sloperama.com/mjfaq/mjfaq28.html)). | High |
| Passing jokers | Never allowed (official rule, per [Sloper col. 588](https://sloperama.com/mahjongg/column2/column588.html)). "Don't pass flowers" is strategy, not a rule (same source). | High |
| Where jokers go | Only in pungs, kongs, quints and sextets; never in singles or pairs, and never in single-tile groupings such as the year or NEWS ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html), [Sloper col. 816](https://sloperama.com/mahjongg/column2/column816.html)). | High |
| Discarded jokers | Dead. The 2026 card back says a discarded joker "may NEVER be picked up" ([Sloper col. 816](https://sloperama.com/mahjongg/column2/column816.html)); it cannot be claimed even for Mah Jongg ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html)). | High |
| Joker exchange | Only on your own turn, after you have brought a 14th tile in (by picking, or by claiming a discard for a completed exposure); from any exposure including your own; several per turn; concealed hands may redeem ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html)). No reverse exchange: "You can use a tile to get a joker, but you can't use a joker to get a tile" ([Sloper col. 783](https://www.sloperama.com/mahjongg/column2/column783.html)). Per the January 2026 bulletin, after making an exposure you cannot then redeem a joker and add it to that exposure ([Sloper col. 816](https://sloperama.com/mahjongg/column2/column816.html)). Properly exposed jokers in a dead hand stay redeemable; improperly exposed ones do not ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html)). | High |
| Calling discards | New 2026 card-back rule: a discard may only be claimed to complete a pung, kong, quint or sextet in an exposed hand, never a single or pair except for Mah Jongg ([Sloper col. 816](https://sloperama.com/mahjongg/column2/column816.html)). A Mah Jongg claim beats an exposure claim; otherwise the player next in turn wins the claim ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html)). Making the exposure commits you, though it may be changed before you discard ([Sloper col. 783](https://www.sloperama.com/mahjongg/column2/column783.html)). | High |
| Concealed (C) hands | No calls for exposures; only the winning tile may be claimed ([Mahjong 4 Friends 2026 guide](https://mahjong4friends.com/guides/understanding-2026-nmjl-mahjong-hands); consistent with [Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html)). Concealed hands can't be partially exposed ([Sloper 2026 FAQ](https://sloperama.com/mjfaq/2026.html)). | Medium-High (verify wording in *Mah Jongg Made Easy*) |
| Dead hands | Any player may challenge at any time; grounds include an exposure that matches no hand and a wrong tile count ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html)). A dead player stops drawing ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)). | High |
| Payment | The discarder of the winning tile pays double and the others pay single; on a self-pick all pay double; a jokerless hand doubles again, except Singles and Pairs, and the bonus can't apply to Quints ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html), [Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)). Sloper notes the 2026 card back dropped its old scoring section ([col. 816](https://sloperama.com/mahjongg/column2/column816.html)), so take payment rules from the rulebook. | High (rule); Medium (2026 card-back detail) |

**House (table) rules, not official.** These include the hot wall, cold wall, "pay for the party", kitty and double dice ([Sloper col. 588](https://sloperama.com/mahjongg/column2/column588.html)). Sloper: "Under the official rules, the last wall does not have any 'temperature'" ([col. 513](https://sloperama.com/mahjongg/column513a.html)), and a hot wall exists only if every player has agreed to it ([col. 500](https://sloperama.com/mahjongg/column500a.html)). ILM also names Mish or Mush, Atomic and Throw and Pick as house rules ([ILM Q725](https://www.ilovemahj.com/mah-jongg-question/725/what-are-mah-jongg-house-rules)). Groups may adopt table rules by agreement; otherwise the official rules apply ([Sloper FAQ 14](https://sloperama.com/mjfaq/mjfaq14.html)).

**Tournament scoring differs, and that changes defensive incentives.** In Mahjong Mississippi's 2026 tournament rules (revised 11/2025), the winner scores the card value, plus 10 for a self-pick and 10 for a jokerless hand (not Singles and Pairs). The discarder of the winning tile loses nothing if the winner had 0 or 1 exposures, 10 if 2, and 20 if 3. A wall game gives each player 10 ([Mahjong Mississippi rules PDF](https://www.hopevillagems.org/wp-content/uploads/2026/01/mjms-rules-and-scoring-2026-tournament-revisions-nov-11.pdf)). Confidence: High for that event; such rules vary by tournament.

Design implication (my inference): implement official rules by default and put any house rule behind an explicit toggle, since several strategy heuristics below (for example, defense against third exposures) rely on official payment.

---

## 2. Choosing target hands from the opening deal

**A published procedure.** Sloper's "Four-Step Charleston," revised in 2019, is the clearest published method for reading a fresh deal ([col. 725](https://sloperama.com/mahjongg/column2/column725.html); original in [col. 630](https://sloperama.com/mahjongg/column2/column630.html) and [col. 631](https://sloperama.com/mahjongg/column2/column631.html)).
- **Step 0, jokers.** With none, consider Singles and Pairs. With one, Singles and Pairs would mean throwing it away. With two or more, consider Quints.
- **Step 1, pairs.** Find pairs, pungs and "singles groupings" such as the year or NEWS.
- **Step 2, friends.** Find hands that use two of your pairs together. With no pairs, look for a concentration of one type: winds, dragons, 369 or like numbers.
- **Step 3, high vs low.** Count low (1 to 5) against high (5 to 9) suit tiles, with fives counting as both. This points toward Consecutive Runs.
- **Step 4, odd vs even.** If still undecided, "pass any three tiles you think best."

His framing: "The point of the Charleston is elimination" ([col. 631](https://sloperama.com/mahjongg/column2/column631.html)). Confidence: High that this is expert practice; it is one author's system.

**Pairs and singles are the bottleneck.** In Linda Fisher's list: "the pairs are the most difficult to get since they cannot be exposed" ([Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)). ILM advises building around scarce combinations (pairs, flowers, singles groupings) and, when choosing between options, preferring the one that needs the fewest additional pairs. Two pairs are only strong if a single hand uses both ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)). Sloper drops hands that need a pair you don't have ([col. 631](https://sloperama.com/mahjongg/column2/column631.html)). Confidence: High (unanimous).

**Counting tiles toward a hand (disagreement).** Sloper does not count jokers: "I don't count jokers when I count up how many tiles I have towards one hand" ([col. 724](https://sloperama.com/mahjongg/column2/column724.html)). He tallies them separately, as in "Six tiles (plus jokers)" ([col. 563](https://sloperama.com/mahjongg/column2/column563.html)). ILM counts tiles per option with jokers included, after first applying the fewest-pairs test ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)). For a bot the difference matters, because a joker can only fill a group of three or more, not every gap.

**Flexibility.** Measure flexibility in playable variations, not printed lines. ILM expands each card line into every concrete variation: the 2025 card's 71 printed lines became 1,002 playable hands, and the 2024 card's 73 became 1,683 ([ILM 2025 analysis](https://ilovemahj.com/2025-card-analysis), [ILM 2024 stats](https://ilovemahj.com/mah-jongg-statistics2024), [ILM Q747](https://ilovemahj.com/mah-jongg-question/747/when-analyzing-the-card-why-is-it-more-accurate-to-use-total-hands-rather-than-printed-hands)). ILM's 2024 analysis for The Mahjong Line lists the drivers of difficulty ([The Mahjong Line 2024](https://themahjongline.com/blogs/mahjong-tales/national-mah-jongg-league-s-2024-card-analysis)):
- Hands with more variations are easier.
- Patterns where jokers can fill any group are easier.
- Each required pair makes a hand harder.
- Heavily demanded tiles bring competition.
- Concealed hands are harder.
- Overlap with other hands gives switching options.

Sloper calls Consecutive Runs "the easiest section on the card" ([FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)) and "always a good safe haven" ([col. 587](https://sloperama.com/mahjongg/column2/column587.html)). Confidence: High.

**How many candidates to keep (apparent disagreement, reconcilable by timing).**
- Mahjong 4 Friends: keep "two or three possible hands in mind" in the early passes ([Charleston guide](https://mahjong4friends.com/guides/american-mah-jongg-charleston-guide)).
- Sloper: when narrowing, "it's a better idea to have two or fewer"; eliminate the weakest by tile count ([col. 631](https://sloperama.com/mahjongg/column2/column631.html)).
- The Mah Jongg Insider: near the end of the Charleston, pick a main hand and one backup ([4/13/26](https://mahjong.beehiiv.com/p/04-13-26-the-smart-way-to-approach-the-2026-card)).
- Linda Fisher: "Try to find one hand and stick with it" ([Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)).

Read together, these describe a funnel: wide on the deal, about two by the end of the Charleston, one main hand with a tile-sharing backup in mid-game. ILM measures overlap directly; some pairs of hands share 12 tiles ([ILM 2025 initial analysis](https://ilovemahj.com/2025-card-initial-analysis)). Confidence: High.

**Concealed vs exposed.** With equal tile counts, prefer the exposed hand ([Sloper col. 631](https://sloperama.com/mahjongg/column2/column631.html), [ILM guide](https://ilovemahj.com/american-mahjong-strategy)). ILM reports concealed hands achieving Mah Jongg "about ten times less frequently" than exposed hands ([ILM 2024 stats](https://ilovemahj.com/mah-jongg-statistics2024)), although concealed hands tend to carry higher values ([The Mahjong Line 2024](https://themahjongline.com/blogs/mahjong-tales/national-mah-jongg-league-s-2024-card-analysis)). Confidence: Medium-High.

**Value vs achievability (disagreement).** Sloper: "Go for the high-scoring hands" and "Lose small and win big" ([FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)). The same FAQ says he would take an available win rather than gamble it for a bigger one. Mahjong 4 Friends lists "choosing high-scoring but difficult hands" as a beginner mistake ([strategy guide](https://mahjong4friends.com/guides/mah-jongg-strategy)). ILM's data shows card values are out of step with how often hands are actually won, and it suggests weighing difficulty against value when playing for money or in tournaments ([ILM 2022 stats](https://ilovemahj.com/mah-jongg-statistics), [ILM 2024 stats](https://ilovemahj.com/mah-jongg-statistics2024)). For a learning app, coach achievability first and introduce value later.

**What a random deal looks like (my calculation).** These figures come from a hypergeometric model of a 13-tile deal (8 jokers in 152 tiles) and a 200,000-deal simulation, with flowers treated as interchangeable.
- **Jokers:** none 48%, exactly one 38%, two 12%, three or more 2%. Sloper's "two or more jokers, consider Quints" therefore applies to only about 14% of deals.
- **Pairs:** a hand averages 1.4 tile kinds held twice or more. 17% of hands have none, 40% one, 32% two, 12% three or more.
- **Pungs:** about 8% of deals contain a natural pung.
- **Takeaway:** "a pair or two and no joker" is the normal starting point.

Confidence: High for the arithmetic.

**Coaching tips (beginner)**
- Sort your tiles, count your jokers, then find your pairs. Pairs decide most hands because jokers and called discards can't make them.
- Look for a section first, not an exact line. Keep two or three hands in mind at first, narrow to two by the end of the Charleston, then play one with a backup.
- Count your real tiles toward each hand and treat jokers as a bonus for groups of three or more.
- When two hands are close, choose the one that already has its pairs, isn't concealed, and shares tiles with a backup.
- If nothing stands out, Consecutive Run is the most forgiving section.

**Bot heuristics (programmer)**
- At card load, expand every line into concrete playable variations (suits, numbers, matching dragons, floating pairs), as ILM does. Evaluation becomes a scan over roughly 1,000 to 2,000 targets per card (2024: 1,683; 2025: 1,002).
- For each variation, compute the naturals held, then split the missing tiles into:
  - single and pair slots (natural only, wall only except for the final tile);
  - group slots (joker-fillable, and callable if the hand is not concealed).
  Assign jokers greedily to group gaps.
- Score each target as a weighted distance. Single and pair gaps cost more than group gaps (start around 1.5 to 2 times). Add a penalty for concealed hands, scale gaps by remaining live copies, and use value as a tie-breaker at low skill or as an expected-value term at high skill.
- Keep the top K targets (K about 3 during the first Charleston, 2 after, then 1 main and 1 backup), and prefer sets whose missing tiles overlap.
- Expose a personality parameter that trades value against completion probability: a Sloper-style "win big" bot versus a cautious bot.

---

## 3. Charleston strategy

**What to pass and keep.** Pass the tiles that fit your emerging sections least, then reassess with the three you receive ([ILM guide](https://ilovemahj.com/american-mahjong-strategy), [Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html), [Insider 3/30/26](https://mahjong.beehiiv.com/p/03-30-26-before-you-study-the-2026-card-read-this)). ILM's keep list ([ILM guide](https://ilovemahj.com/american-mahjong-strategy), [ILM part 2](https://stljewishlight.org/uncategorized/this-week-in-mah-jongg-game-strategy-part-2/)):
- Don't pass pairs. Either break up an unneeded pair by sending its tiles to different players, or keep it as joker bait.
- Don't pass flowers.
- Pass white dragons (soaps) only as a last resort.
- Don't pass tiles that fit together (the same number in two suits, consecutive numbers, one suit, all winds), so the receiver doesn't get a coherent group.

The Insider adds: hold flowers and dragons until your direction is clear ([4/13/26](https://mahjong.beehiiv.com/p/04-13-26-the-smart-way-to-approach-the-2026-card)). Sloper treats "don't pass flowers" as strategy, while "don't pass jokers" is a rule ([col. 588](https://sloperama.com/mahjongg/column2/column588.html)). Older quiz answers show the same elimination logic, such as passing high numbers when lows dominate ([col. 227](https://sloperama.com/mahjongg/column227a.html)). Confidence: High.

**Defensive passing (emphasis differs).** Sandberg: passing "is a defensive move" whether or not you mean it ([Defense! Defense! Defense!](https://jewishjournal.com/?p=81162)). Sloper: don't worry much about defense in the first Charleston, but adjust in the second, for example if someone seems to be collecting winds ([FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)).

**Reading the passes.** Note which of your passed tiles never come back, which tile types you never receive, and what a receiver keeps. Treat these clues as tentative, because a player who passes you winds may switch to a wind hand later ([ILM guide](https://ilovemahj.com/american-mahjong-strategy), [Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)). Confidence: Medium (sound, but weak signals).

**Pass-by-pass notes**
- **First right and first across:** pure elimination. You don't need to commit while you still have three tiles you're happy to give; once you have two or fewer and can't blind pass, you must choose ([ILM part 2](https://stljewishlight.org/uncategorized/this-week-in-mah-jongg-game-strategy-part-2/)).
- **First left (blind pass allowed):** blind pass when you can't find three expendable tiles. Sloper's quiz answers vary with hand strength, from "Blind pass one, but don't stop the Charleston" to "blind pass three and stop the Charleston" ([col. 524](https://sloperama.com/mahjongg/column524a.html), [col. 520](https://www.sloperama.com/mahjongg/column520a.html)). The cost (my inference) is that you pass along tiles you never saw, which might have helped you.
- **Second Charleston (left, across, right):** continue if you have at least three easy passes, since you receive nine new tiles ([ILM Let's Play](https://stljewishlight.org/news/news-local/this-week-in-mah-jongg-lets-play)). Sloper cautions that second-dance "miracles" are rare and the same tiles tend to circulate ([FAQ 28](https://sloperama.com/mjfaq/mjfaq28.html)). There is no blind pass on the second left ([col. 729](https://www.sloperama.com/mahjongg/column2/column729.html)).
- **The "evil second across" (Sloper's phrase):** a blind pass isn't available. If you must give up something useful, pass from a pung or kong rather than breaking a pair ([FAQ 28](https://sloperama.com/mjfaq/mjfaq28.html)), choosing the tile that is easiest to replace from discards or a joker ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)).
- **Last right (blind pass allowed again):** same logic as the first left.

**When to stop the second Charleston (disagreement).**
- ILM: continue with at least three obvious passes; stop only with a strong hand or two strong contenders when you can't afford to give three tiles ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)).
- Sloper: stopping is reasonable with two equally good hands; don't stop just to protect a clearly weaker option; doing it often irritates the table ([FAQ 28](https://sloperama.com/mjfaq/mjfaq28.html)).
- Sloper's quiz answers recommend stopping only when the hand's start is strong enough ([col. 493](https://www.sloperama.com/mahjongg/column493a.html)). He adds that stopping can "throw off" opponents and needs no explanation ([col. 494](https://www.sloperama.com/mahjongg/column494a.html)).
- A reader in the same column argued for stopping only when two or three tiles from Mah Jongg ([col. 494](https://www.sloperama.com/mahjongg/column494a.html)).

Confidence: Medium (judgment call with no data).

**Courtesy pass.**
- If the player across stopped the Charleston, they may be close, so skipping is often prudent ([ILM part 2](https://stljewishlight.org/uncategorized/this-week-in-mah-jongg-game-strategy-part-2/)).
- If they offer fewer tiles than you want to pass, it is usually safer to skip (same source).
- A strong hand can justify the risk (same source). Sloper similarly suggests refusing with poor tiles and trading when your tiles are good ([FAQ 28](https://sloperama.com/mjfaq/mjfaq28.html)).

Confidence: Medium.

**2026-specific.** Flowers matter more than usual this year (Section 10). Two hands need a six-flower sextet and others use flower pungs ([Sloper col. 815](https://sloperama.com/mahjongg/column2/column815.html)). The Insider notes that six-flower hands leave few flowers for anyone needing a flower pair ([3/30/26](https://mahjong.beehiiv.com/p/03-30-26-before-you-study-the-2026-card-read-this)).

**Coaching tips (beginner)**
- Pass the three tiles that fit your hands least. Keep pairs, flowers and soaps for now.
- Never pass a joker; it is against the rules.
- Don't hand one player a ready-made set. Split related tiles between different passes.
- Short on throwaways on the first left or last right? You may pass on some of the tiles you just received without looking.
- Keep the second Charleston going if you have three easy passes. Nine new tiles is a lot.
- Watch which tiles never come back to you. Someone may be collecting them.

**Bot heuristics (programmer)**
- usefulness(tile) = max, or a score-weighted sum, over the top-K targets of the drop in distance that tile provides. Pass the three lowest.
- Hard constraint: never pass a joker. Soft penalties for passing:
  - a pair, preferring to send its two tiles in different passes or directions;
  - a flower;
  - a soap while year or dragon hands are live;
  - two tiles in one pass that form a pair, run or like-number group.
- Blind pass on the first left or last right when fewer than three tiles fall below a usefulness threshold. The number of blind tiles is 3 minus the expendable count.
- Second Charleston: stop if (expendables < 3 and best distance <= D) or the top two targets are within epsilon. Cap stops per session by personality, for etiquette realism.
- Courtesy pass: offer n = expendables (0 to 3). Decline when the player across stopped the Charleston and your hand is weak.
- Log every tile passed to each seat and whether it ever reappears. Feed "collecting" signals into the opponent model (Section 7).

---

## 4. Jokers

**Supply and impact.** A player sees about 1.5 jokers in a typical game: about 0.7 in the 13-tile deal plus about 16 draws (my calculation, using ILM's average of about 35 wall tiles left at Mah Jongg). ILM measured about 1.6 received and 0.5 swapped per game ([ILM 2022 stats](https://ilovemahj.com/mah-jongg-statistics)). ILM's win rates by jokers received on the 2022 card:

| Jokers received | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| Win rate | 4.6% | 13.2% | 27.0% | 41.1% | 51.4% |

Jokers are the largest luck factor in that data. Confidence: Medium (one platform, bots included, a single card year).

**Using them.**
- Save jokers for later and keep them concealed: "Save your jokers for later in the game" ([Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)). An exposed joker can be redeemed by anyone holding the natural ([Mahjong 4 Friends jokers](https://mahjong4friends.com/guides/mah-jongg-joker), [ILM guide](https://ilovemahj.com/american-mahjong-strategy)).
- Spend them on the groups hardest to complete naturally ([Mahjong 4 Friends jokers](https://mahjong4friends.com/guides/mah-jongg-joker)).
- A quint of any four-copy tile needs at least one joker (same source).
- With two jokers, split them across two exposures rather than putting both in one ([ILM guide](https://ilovemahj.com/american-mahjong-strategy), [ILM joker article](https://stljewishlight.org/arts-entertainment/reading-you-opponents-hands-joker-strategy)).
- Build pairs and singles naturally and early, since jokers can never fill them ([Mahjong 4 Friends jokers](https://mahjong4friends.com/guides/mah-jongg-joker)).

Confidence: High.

**Joker exchanges.**
- Check every exposure on every turn; "don't miss an exchange on your next turn" ([ILM Strategic Thinking](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-strategic-thinking)).
- Linda Fisher: "Redeem a joker from someone else's hand even if you don't need it," which denies it to others ([Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)).
- ILM agrees but flags a trade-off: the opponent may finish jokerless and be paid double. ILM still calls redeeming usually better ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)).
- Redeeming a joker with a tile you could use is still sometimes right. Sloper's example redeems two jokers in one turn to switch hands ([col. 728](https://sloperama.com/mahjongg/column2/column728.html)), and exchanging can keep a scarce tile such as a flower away from opponents ([ILM part 2](https://stljewishlight.org/uncategorized/this-week-in-mah-jongg-game-strategy-part-2/)).

Confidence: Medium-High.

**Joker bait.** Hold an unneeded pair and later discard one tile, hoping an opponent calls it with a joker that you then redeem on your next turn ([Sloper col. 587](https://sloperama.com/mahjongg/column2/column587.html), [col. 522](https://sloperama.com/mahjongg/column522a.html), [ILM guide](https://ilovemahj.com/american-mahjong-strategy)). Timing matters:
- Around the middle of the game, roughly the third wall ([ILM part 2](https://stljewishlight.org/uncategorized/this-week-in-mah-jongg-game-strategy-part-2/)).
- Not early, when nobody is calling yet, and not late, when the discard becomes dangerous (same source).
- Bait is "often ineffective" with winds ([Sloper col. 522](https://sloperama.com/mahjongg/column522a.html)).
- Keeping bait makes most sense while the wall is long ([col. 728](https://sloperama.com/mahjongg/column2/column728.html)).

Confidence: Medium (an expert tactic with no data on how often it works).

**Discarding a joker (disagreement on emphasis).**
- **Rule:** legal, and the joker is dead.
- **Sloper:** "Jokers are the safest discard in the deck, because jokers die the instant they're discarded" ([FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)). He discards jokers when dogging a hand ([col. 724](https://sloperama.com/mahjongg/column2/column724.html)).
- **Sandberg:** late in a game you can't win, break up your hand and discard jokers. They no longer help you, and they keep you from giving up a winning tile ([The Hot Tile](https://jewishjournal.com/?p=88918)).
- **ILM:** jokers are safe, but save them for last, because throwing one signals a broken hand ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)).
- **Mahjong 4 Friends:** discarding a joker is "generally a bad idea" unless it is unusable ([joker guide](https://mahjong4friends.com/guides/mah-jongg-joker)).
- **Singles and Pairs:** a hand in this section forces you to throw jokers away ([Sloper col. 563](https://sloperama.com/mahjongg/column2/column563.html)).

The reconciliation: never discard a joker you can use while you're still trying to win; once you're defending, it is the perfect safe tile. Confidence: High.

**Reading someone else's joker discard.** It often means the player is close and waiting on a pair or single ([Sandberg](https://jewishjournal.com/?p=81162), [ILM guide](https://ilovemahj.com/american-mahjong-strategy)). It can also mean they are playing Singles and Pairs or have switched to defense ([ILM joker article](https://stljewishlight.org/arts-entertainment/reading-you-opponents-hands-joker-strategy), [Mahjong 4 Friends advanced](https://mahjong4friends.com/guides/advanced-mah-jongg-strategies)). Confidence: Medium.

**Coaching tips (beginner)**
- Jokers only work in groups of three or more, never in a pair or a single.
- Keep jokers hidden as long as you can. An exposed joker can be taken by anyone holding the real tile.
- Every turn, look at every exposure. If you hold the matching tile, you can swap it for that joker on your turn.
- Don't throw away a joker you can still use. When you can't win anymore, jokers are your safest discards.
- If someone else throws a joker, be careful: they may be one tile away.

**Bot heuristics (programmer)**
- Keep jokers in hand until an exposure needs them. When exposing, use naturals first, and split jokers across exposures.
- Redemption check every turn, for each exposed joker whose natural you hold:
  - if the natural isn't needed by any top-K target, redeem;
  - if it is needed, redeem only when the joker's value to you exceeds the natural's;
  - at high skill, also redeem to deny jokers to an opponent who looks close.
  - Penalize a redemption that leaves an opponent jokerless and close to winning.
- Joker bait (expert only): if holding an unneeded pair, discard one tile during the middle third of the wall, never with winds, and never when the tile is hot.
- Joker discards: allowed only when (a) folding, after other safe tiles are used up (ILM ordering), (b) committed to Singles and Pairs, or (c) personality = "early dumper" as a deliberate style variant.
- Opponent model: on seeing a joker discard, raise that player's readiness estimate sharply and shift their candidates toward hands whose last needs are pairs or singles.

---

## 5. Calling and exposing

**When to call.**
- **ILM:** have at least seven tiles toward Mah Jongg before calling ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4), [ILM guide](https://ilovemahj.com/american-mahjong-strategy)). The exception is a call that completes a jokerless kong which stays useful if you switch hands ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)).
- **Sloper:** "Don't be too quick to take a discard in the early part of the game" ([FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)).
- **Mahjong 4 Friends:** call when speed matters, for example when key tiles are disappearing or an opponent is close ([strategy guide](https://mahjong4friends.com/guides/mah-jongg-strategy)).
- **The Insider:** delay calling and exposing flowers until fully committed ([Insider quiz 4/20/26](https://mahjong.beehiiv.com/p/0420ymn2)).
- **Sandberg:** "Wait for a second discard" rather than calling the first copy you need. She notes others use the same delay, so an uncalled tile is not proof that nobody wants it ([Defense!](https://jewishjournal.com/?p=81162)).

Disagreement: Sandberg's wait-for-the-second advice stands alone, with no other source corroborating it, and it conflicts with scarcity (only four copies, and others may take the tile). Treat it as a style option. Confidence: High for "don't call early"; Low for "wait for the second".

**Information cost.** One exposure narrows your hand, and two usually identify it to attentive players ([ILM guide](https://ilovemahj.com/american-mahjong-strategy), [ILM joker article](https://stljewishlight.org/arts-entertainment/reading-you-opponents-hands-joker-strategy)). Some hands stay ambiguous even after two exposures ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)). On the 2026 card, Consecutive Run #4 can be mistaken for cousin hands in 2468, 13579 and 369 until two exposures show ([Sloper col. 815](https://sloperama.com/mahjongg/column2/column815.html)). Exposures also lock you in, and an exposure that fits no hand makes you dead ([Sloper col. 771](https://www.sloperama.com/mahjongg/column2/column771.html), [Insider quiz 6/26](https://mahjong.beehiiv.com/p/p0601qk5)). Don't arrange your exposures or flowers in an order that gives the hand away ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)). Confidence: High.

**Concealed-hand considerations.** A concealed hand gets every tile from the wall except the last, so it is slower. ILM reports concealed hands winning about a tenth as often as exposed ones ([ILM 2024 stats](https://ilovemahj.com/mah-jongg-statistics2024)). Sloper rates one concealed option "strongest, but risky since it's a concealed hand" ([col. 520](https://www.sloperama.com/mahjongg/column520a.html)) and prefers exposed hands at equal tile counts ([col. 631](https://sloperama.com/mahjongg/column2/column631.html)). You can still complete an exposed-type hand without ever exposing, by drawing everything, which hides information ([ILM part 2](https://stljewishlight.org/uncategorized/this-week-in-mah-jongg-game-strategy-part-2/)). Confidence: Medium-High.

**2026 reading traps.** The single-tile groupings (the year, NEWS, 1234, 2468, 135, 369) and the new four-number run are singles. They can't be called, jokered or exposed before Mah Jongg. There are no chows. Sextets can't be split into two pungs ([Sloper 2026 FAQ](https://sloperama.com/mjfaq/2026.html), [Insider 4/20/26](https://mahjong.beehiiv.com/p/04-20-26-your-new-card-game-plan-starts-here)). Confidence: High.

**Coaching tips (beginner)**
- Calling a discard shows everyone part of your hand. Early on, let most discards go by.
- A good rule of thumb: call for an exposure once you have about seven tiles toward your hand.
- You may call only to finish a group of three or more, or to win. You can't call for a pair or a single unless it wins.
- In a concealed (C) hand, you may only call your winning tile.
- Before you expose, check that the tiles fit a real line on the card; a wrong exposure makes your hand dead.

**Bot heuristics (programmer)**
- Call for an exposure only if:
  - (a) the hand is not concealed;
  - (b) the claimed tile completes a group slot in the current main target;
  - (c) the commitment threshold is met (matched tiles >= 7, scaled down as the wall shortens);
  - (d) the exposure still fits at least one backup target, or the bot is fully committed.
- Prefer exposures with no jokers, and if jokers are needed, spread them.
- Always claim a legal Mah Jongg (Sloper takes the sure win, [FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)).
- Validate every exposure against the expanded hand list before making it. A bot should never expose itself into a dead hand except as a deliberate low-skill error, and even then sparingly.
- Style variants:
  - "eager caller": threshold about 4 to 5 tiles, for beginner bots;
  - "patient": threshold 7 or more;
  - "second-copy waiter": skips the first copy of a needed pung tile while the wall is long, after Sandberg.
- Leave the human a visible claim window after every discard (Section 11).

---

## 6. Switching hands and recognizing a dead end

**Don't switch too early.** Losing a few needed tiles early is not a reason to abandon a hand, given 8 jokers and 4 copies of most tiles ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)). Mid-game signals to pivot ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)):
- crucial tiles never appear (someone may be collecting them);
- crucial tiles were discarded when you couldn't claim them;
- an opponent exposes tiles you need;
- the third copy of a tile you need as a pair is discarded;
- you made an error, such as exposing part of a concealed hand.

Switching repeatedly "will likely lead to confusion and probably loss" (same source). Confidence: High.

**Dead-tile arithmetic.**
- A single slot dies when all 4 copies are visible; a pair slot dies at 3 visible.
- A group slot can be filled with jokers, so it dies only when too few naturals plus jokers remain. In one Sloper example, a player "would need four jokers" to call a tile once three copies were out ([col. 771](https://www.sloperama.com/mahjongg/column2/column771.html)).
- Sloper's "key" tile: "if that tile is dead on the table, the player's hand is dead" ([col. 529](https://sloperama.com/mahjongg/column529a.html)). This test applies to your own hand as much as an opponent's.

Confidence: High.

**Is there time left?** "The wall has to be at least 12 stacks long if I still need to pick 6 tiles" ([Sloper col. 724](https://sloperama.com/mahjongg/column2/column724.html)). Twelve stacks is 24 tiles, about 6 of your own draws, so the rule is a best-case floor of roughly four wall tiles per tile still needed (my arithmetic). Confidence: High as a floor; real needs are higher.

**Fallbacks.** Keep a plan B from the start ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)); Consecutive Run is a common "safe haven" ([Sloper col. 587](https://sloperama.com/mahjongg/column2/column587.html)). When no hand is realistic, "dog" it: discard tiles nobody seems to need, and jokers ([Sloper col. 724](https://sloperama.com/mahjongg/column2/column724.html), [FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)).

**Coaching tips (beginner)**
- If a pair you need has lost two of its four tiles to the discards, that pair is gone; time to switch.
- Count your turns: the wall divided by four is roughly how many more tiles you'll draw.
- If you need more tiles than you have turns left, start playing safe instead.
- Switch hands once if you must, not over and over.

**Bot heuristics (programmer)**
- After every visible tile event, recompute feasibility: mark targets infeasible when a single or pair slot exceeds live copies, or when group gaps exceed live naturals plus jokers still unseen.
- Switch rule: move to a new main target when its score beats the current one by a margin (hysteresis), so the bot doesn't flip-flop.
- Time test: own_draws_left ~ wall / 4. If distance > own_draws_left (or > wall / 4 times an efficiency factor below 1), set mode = defend (Section 7).

---

## 7. Defense

**Why defend.** Under official payment, feeding the winning tile costs double what everyone else pays ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html)); Sloper lays out these payout odds in a hot-tile dilemma ([FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)). Tournament formats can scale the penalty by the winner's exposures (Section 1).

**When defense starts (emphasis differs).** Sandberg: "Playing defensively is not a separate strategy," and every discard is a defensive act, though early discards are usually safe because few exposures exist ([Defense!](https://jewishjournal.com/?p=81162)). Sloper: don't play defensively too early in the game ([FAQ 28](https://sloperama.com/mjfaq/mjfaq28.html)). Both agree risk grows as the game goes on. Confidence: High.

**Reading exposures.**
- One exposure narrows an opponent's options and two usually identify the hand. A quint or a wind exposure narrows fast ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)).
- Sloper's "defense by the numbers" columns map exposures to likely hands and their hot tiles ([col. 488](https://sloperama.com/mahjongg/column488a.html), [col. 516](https://sloperama.com/mahjongg/column516a.html), [col. 529](https://sloperama.com/mahjongg/column529a.html), [col. 535](https://sloperama.com/mahjongg/column535a.html), [col. 576](https://sloperama.com/mahjongg/column2/column576.html), [col. 771](https://www.sloperama.com/mahjongg/column2/column771.html)). They use dead tiles on the table to eliminate candidates; one example reads "If 5D is dead, so is she" ([col. 535](https://sloperama.com/mahjongg/column535a.html)).
- Before assuming danger, "check the discard floor" ([col. 488](https://sloperama.com/mahjongg/column488a.html)).

Confidence: High.

**Reading discards.** Early discards are the strongest clues. A mid-game discard may just be an excess copy, so a discarded North doesn't mean the player has no Norths ([ILM guide](https://ilovemahj.com/american-mahjong-strategy), [ILM joker article](https://stljewishlight.org/arts-entertainment/reading-you-opponents-hands-joker-strategy)). Confidence: Medium.

**Hot and safe tiles.**
- Nothing is hot at the start. A tile not seen by mid-game is probably hot, and once two copies have been discarded a third is "probably safe" ([Sandberg, The Hot Tile](https://jewishjournal.com/?p=88918), [ILM guide](https://ilovemahj.com/american-mahjong-strategy)).
- Sloper: late in the game, don't discard "raw tiles" ([FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)).
- Heat rises over time: "Always discard warmer tiles before colder tiles," and flowers "get hotter as time goes by" ([col. 522](https://sloperama.com/mahjongg/column522a.html), [col. 518](https://sloperama.com/mahjongg/column518a.html)).
- A tile you will have to give up eventually is "a hot potato, getting more dangerous the longer you hold on" ([col. 724](https://sloperama.com/mahjongg/column2/column724.html)).
- Discard tiles an opponent will need while they still can't use them, especially pair tiles ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)).
- Sandberg: get rid of flowers early if unneeded, but don't throw them late ([The Hot Tile](https://jewishjournal.com/?p=88918)).
- In 2026, flowers and soaps late in the game may be someone's needed single ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)).

Confidence: High.

**Exposure count rule.** Linda Fisher: "discard to a second exposure at great risk and never discard to a third exposure, even if you have to break up a good hand" ([Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)). Mahjong 4 Friends rates two compatible exposures very high risk and a third extreme ([advanced](https://mahjong4friends.com/guides/advanced-mah-jongg-strategies)). Sloper allows that you "can throw a hot tile if you want to risk it, when your hand is strong," as a strategy choice ([col. 500](https://sloperama.com/mahjongg/column500a.html)). Confidence: High.

**When to stop chasing your own hand.**
- When your hand is dead, discard only tiles nobody needs ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)).
- When the wall is too short for what you still need ([Sloper col. 724](https://sloperama.com/mahjongg/column2/column724.html)).
- When you are sure you have drawn an opponent's winning tile: break up your hand and discard jokers ([Sandberg, The Hot Tile](https://jewishjournal.com/?p=88918)).
- When you are one tile away late: opponents who can read you won't discard your tile, so your chances rest on drawing it, and defending may be better ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)).
- With two or three tiles left in the wall, almost anything can be a winner ([Sandberg](https://jewishjournal.com/?p=88918)).

Confidence: High that experts fold; Medium on exact triggers.

**Calling opponents dead.** If an exposure matches no hand, call the player dead: "One less player means more picks for you" ([Sloper col. 576](https://sloperama.com/mahjongg/column2/column576.html), [col. 771](https://www.sloperama.com/mahjongg/column2/column771.html)). A dead hand still has its properly exposed jokers available ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)). The chance a dead player is sitting on your tile is modest. Sloper puts it at about 1 in 4 with 13 tiles left in the wall ([FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)); my check gives 13 / (13 + 39) = 0.25 for one specific opponent. Confidence: High.

**Pace and tells.** Keep a steady pace on every tile so you don't reveal what you're waiting for ([Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)). Human tells such as a jolt when a needed tile goes by are real clues ([ILM joker article](https://stljewishlight.org/arts-entertainment/reading-you-opponents-hands-joker-strategy)).

**Coaching tips (beginner)**
- Early discards are usually safe. Danger grows with every exposure and every row of wall that disappears.
- A tile nobody has thrown yet is "hot" late in the game. A tile already discarded twice is usually safe.
- Throw tiles you know you'll never use before they get hotter, flowers especially.
- Don't discard into a player with three exposures unless you're sure the tile can't help them.
- If you can't win, play safe: throw tiles nobody wants, and jokers last.
- If someone's exposure doesn't match any hand, you may call them dead.

**Bot heuristics (programmer)**
- **Opponent candidates.** Per opponent, keep a weighted candidate set of playable variations consistent with their exposures (exact group identity, never concealed hands once they have exposed). Remove infeasible ones using dead tiles. Down-weight variations needing tiles that opponent passed in the Charleston or discarded early.
- **Prior weights.** Use section frequencies as priors; ILM's data has Consecutive Run most common.
- **Readiness r_o** in [0, 1]. Base it on exposure count (0, 1, 2, 3), wall depletion, a joker discard (spike), stopping the Charleston (small spike), and estimated tiles missing for their best candidate.
- **Danger(t).** Danger(t) = 1 - product over opponents of (1 - r_o * P_o(t completes a group or Mah Jongg)). Set Danger = 0 for jokers. Down-weight tiles with 2 or more copies discarded, but not to 0 (Sandberg's delayed-call caveat).
- **Discard choice.** Choose the discard minimizing own_value_loss(t) + lambda * Danger(t) * payout_cost. Lambda grows with wall depletion and with defensive skill. Tie-break by "warmth trend": throw tiles whose danger will rise.
- **Fold rule.** Fold when P(own win) * value < expected feed cost. Also fold on simple triggers: wall < 4 x own distance; an opponent with 3 exposures while own distance >= 2; or the bot holds a tile it believes completes an opponent's hand.
- **Fold discard order.** Tiles dead for all candidates first, then tiles with 2 or more copies out, then jokers last (ILM ordering).
- **Dead calls.** After every exposure, test it against the expanded hand list and call dead when nothing matches (expert and intermediate bots).

---

## 8. Probability rules of thumb and quantitative data

**Counting.** Every suit tile, wind and dragon has 4 copies, flowers 8, jokers 8 ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)). Live copies = 4 minus copies visible in discards, exposures and your own rack. A pair is impossible at 3 visible, a single at 4 visible (my arithmetic).

**Turns.**
- The wall holds 99 tiles after the deal. Divide the wall by four for your approximate remaining draws, for example 40 tiles left is about 10 picks ([Mahjong 4 Friends advanced](https://mahjong4friends.com/guides/advanced-mah-jongg-strategies)).
- ILM games that end in Mah Jongg finish with about 35 tiles left in the wall ([ILM 2022 stats](https://ilovemahj.com/mah-jongg-statistics)), so a typical winning game lasts about 64 draws, or 16 per player (my arithmetic).
- Calls skip turns, so this is approximate.

**Chance of drawing at least one live copy (my calculation).** This hypergeometric model assumes the copies are randomly placed among the tiles you can't see (wall plus opponents' racks). It ignores calls, which help for group tiles in exposed hands, and ignores opponents hoarding tiles, which hurts.

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

Rule of thumb from the table: a single live copy is a long shot unless you can call it, so hands that need a natural pair or single with only one copy left should be abandoned early.

**Win and wall-game rates.**
- ILM's 2022 data: 89.3% of games ended in Mah Jongg and 10.7% in a wall game, so a player among equals should expect to win about 22.3% ([ILM 2022 stats](https://ilovemahj.com/mah-jongg-statistics)).
- ILM's help article: about 10% wall games and a 22.5% expected win rate, with each game seating three bots and one human ([ILM KB](https://ilovemahj.com/kb/67000755046)).
- The 2024 card produced 7% wall games, against about 10 to 11% in earlier years ([ILM 2024 stats](https://ilovemahj.com/mah-jongg-statistics2024)).

Confidence: Medium (one platform, bots included).

**Which hands actually get won (ILM, 2023 and 2024 cards, bots and humans combined).**
- **By section:** Consecutive Run took 45.0% of wins in 2023 and 28.6% in 2024 ([ILM 2023](https://ilovemahj.com/mah-jongg-statistics2023), [ILM 2024](https://ilovemahj.com/mah-jongg-statistics2024)). The 2024 figures for the rest were Winds-Dragons 21.1%, Any Like Numbers 19.2%, 13579 10.1%, 2468 8.8%, 369 7.1% and the year section 3.6%.
- **Rare sections:** Quints were under 1% both years and Singles and Pairs about 0.1%.
- **Concealed:** concealed hands won about a tenth as often as exposed ones.
- **By structure:** in 2024, hands of two kongs plus two pungs took about 52 to 58% of wins (the article gives both figures).
- **By number:** hands using 1s or 9s won more often than middle-number hands, and 6s were the most demanded tile. ILM attributes this to less competition for terminal numbers ([ILM 2024](https://ilovemahj.com/mah-jongg-statistics2024)).
- **Card variety vs wins:** on the 2025 card Quints held 16.5% of playable variations ([ILM 2025 analysis](https://ilovemahj.com/2025-card-analysis)), yet Quints historically take under 1% of wins. My inference: printed variety is not the same as achievability. Different card years, so treat this as illustrative.

Confidence: Medium.

**Card values vs difficulty.** ILM argues that card values don't track how often hands are completed and suggests valuing hands by completion probability ([ILM 2022](https://ilovemahj.com/mah-jongg-statistics), [ILM 2025 analysis](https://ilovemahj.com/2025-card-analysis)). Sloper makes the same point about the 2026 card: a 2468 hand with four pairs and a 13579 hand with three pairs carry the same value ([col. 815](https://sloperama.com/mahjongg/column2/column815.html)). Confidence: Medium-High.

**Human decision speed (useful for bot pacing).** ILM players averaged 16.7 seconds per Charleston decision and 3.5 seconds per in-game decision ([ILM 2022 stats](https://ilovemahj.com/mah-jongg-statistics)). Confidence: Medium.

**2026.** No public quantitative analysis of the 2026 card was found. ILM's full 2026 analysis is members-only, and also sold as a book ([ILM 2026 page](https://www.ilovemahj.com/nmjl-2026-analysis)). One newsletter reports a playing group's sense that 2026 produces more wall games than any card they remember ([Insider 6/1/26](https://mahjong.beehiiv.com/p/06-01-26-this-trips-everyone-up)). Confidence: Low (anecdote).

**Coaching tips (beginner)**
- There are only four of each tile (eight flowers, eight jokers). Count what you can see before you count on a tile.
- Wall tiles divided by four is about how many more turns you get.
- A fair share of wins against three equal opponents is a bit under one in four games, and about one game in ten ends with nobody winning.
- Hands with fewer pairs, more kongs and pungs, and numbers at the ends (1s and 9s) tend to come together more often.

**Bot heuristics (programmer)**
- Maintain a visible-count table (discards, exposures, own rack) and derive live copies per tile. Use the hypergeometric estimate above for P(draw), and add P(call) for group tiles in exposed targets, using the number of opponents' discards remaining.
- P(complete target) can be approximated as the product of per-slot acquisition probabilities. For better estimates, run quick Monte Carlo rollouts of the remaining wall, holding opponents' hidden tiles as random draws from the unseen pool.
- Calibrate difficulty with self-play. Target wall-game rates of roughly 7 to 11% and equal-skill win shares near 22 to 25% per seat. Measure a beginner human's win rate and tune guided-match bots below that (my inference).

---

## 9. Common beginner strategy mistakes

Compiled from several sources; confidence High where two or more sources agree.

1. **Calling too early.** This includes calling discards for a pung or kong, growing a pair into a pung, and exposing jokers early ([ILM guide](https://ilovemahj.com/american-mahjong-strategy), [Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html), [Mahjong 4 Friends strategy](https://mahjong4friends.com/guides/mah-jongg-strategy)).
2. **Committing too early, then switching too often** (same sources, [ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)). Also the reverse: giving up on a hand too soon ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)).
3. **Passing pairs or flowers in the Charleston** ([ILM guide](https://ilovemahj.com/american-mahjong-strategy), [Mahjong 4 Friends strategy](https://mahjong4friends.com/guides/mah-jongg-strategy)).
4. **Missing joker exchanges** on your turn ([ILM Strategic Thinking](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-strategic-thinking)).
5. **Discarding raw or hot tiles late**, especially into second and third exposures ([Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html), [ILM guide](https://ilovemahj.com/american-mahjong-strategy)). Sandberg adds discarding flowers late ([The Hot Tile](https://jewishjournal.com/?p=88918)).
6. **Over-reading discards.** Assuming a discard means the player has none of that tile ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)), or that an uncalled tile is safe ([Sandberg](https://jewishjournal.com/?p=81162)).
7. **Telegraphing** through pace, gaps in the rack, or an obvious arrangement of flowers and exposures ([Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html), [ILM guide](https://ilovemahj.com/american-mahjong-strategy)).
8. **Stopping the Charleston too often** ([Sloper FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html), [FAQ 28](https://sloperama.com/mjfaq/mjfaq28.html)).
9. **Chasing high-value, low-probability hands** ([Mahjong 4 Friends strategy](https://mahjong4friends.com/guides/mah-jongg-strategy)); compare Sloper's opposite view in Section 2.
10. **Misreading the card.** This is the biggest 2026 trap. Color does not mean suit, zero is always soap, and the year, NEWS and short runs are singles that can't take jokers or be called. There are no chows. Concealed lines can't be partly exposed, and sextets can't be split ([Sloper 2026 FAQ](https://sloperama.com/mjfaq/2026.html), [Insider 4/20/26](https://mahjong.beehiiv.com/p/04-20-26-your-new-card-game-plan-starts-here), [LocalLife SC](https://www.locallifesc.com/mahjong-hand-august-2026-card-error/)).
11. **Overthinking or rushing** ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)).

---

## 10. Hand categories, and commentary on the 2026 card

Below, sections and lines are referenced by name and number only. Year-to-year line numbers change, so general statements come from older sources and 2026 notes are labeled.

**Consecutive Run.**
- Sloper calls it "the most powerful section of the card" ([col. 631](https://sloperama.com/mahjongg/column2/column631.html)), the easiest section ([FAQ 8](https://sloperama.com/mjfaq/mjfaq08.html)) and a safe haven ([col. 587](https://sloperama.com/mahjongg/column2/column587.html)).
- It has the most playable variations (29% in 2025) and the most wins in ILM data ([ILM 2025](https://ilovemahj.com/2025-card-analysis), [ILM 2024](https://ilovemahj.com/mah-jongg-statistics2024)).
- 2026: Sloper singles out CR #4 as easy, flexible, regular in value and "most powerful." It has no pairs, so jokers work anywhere, and any consecutive numbers qualify. He says it can pass for cousin hands (2468 #1, 13579 #2, 369 #1) until a second exposure ([col. 815](https://sloperama.com/mahjongg/column2/column815.html), [2026 FAQ](https://sloperama.com/mjfaq/2026.html)).
- 2026: CR #6 needs a six-flower sextet, and CR #8 is concealed with same-number pungs ([col. 815](https://sloperama.com/mahjongg/column2/column815.html)). Sloper stresses that the runs of singles on this card (in Consecutive Run and Winds-Dragons) are not chows and can't be called; American mah jongg has no chows ([col. 815](https://sloperama.com/mahjongg/column2/column815.html), [2026 FAQ](https://sloperama.com/mjfaq/2026.html)).

Confidence: High.

**13579 (Odds).**
- The second most powerful section, partly because there are five odd numbers against four even ([Sloper col. 631](https://sloperama.com/mahjongg/column2/column631.html)).
- Many odd hands use only three numbers, either the low or the high odds ([col. 725](https://sloperama.com/mahjongg/column2/column725.html)).
- 2026: a North-South pairs hand has three pairs at the same value as a harder Evens hand ([col. 815](https://sloperama.com/mahjongg/column2/column815.html)). 13579 #4 is a "floating pair" hand whose kongs must match the pair ([Sloper 2026 FAQ](https://sloperama.com/mjfaq/2026.html)). A teacher featured a 13579 line with the same "kongs must match the pair" requirement as a commonly misread hand ([LocalLife SC](https://www.locallifesc.com/mahjong-hand-august-2026-card-error/); the article's line reference is garbled, so it may or may not be #4). 13579 #9 is concealed with a three-single run.

Confidence: High.

**2468 (Evens).**
- All-even hands use all four even numbers ([Sloper col. 725](https://sloperama.com/mahjongg/column2/column725.html)). About 9 to 10% of ILM wins.
- 2026: the East-West hand is "four pairs, making it harder" ([col. 815](https://sloperama.com/mahjongg/column2/column815.html)); Sloper's mnemonic is "East equals Even" ([2026 FAQ](https://sloperama.com/mjfaq/2026.html)).
- 2026: 2468 #7 uses two separate flower pungs, "exposable at separate times." You may not show all six as a sextet to fool opponents and then split them at Mah Jongg ([Sloper 2026 FAQ](https://sloperama.com/mjfaq/2026.html)). 2468 #8 is concealed, and one line has a four-single grouping with no jokers (same sources).

Confidence: High.

**369.**
- About 6 to 7% of ILM wins. Sloper: "Don't overlook 369 and S&P" ([col. 630](https://sloperama.com/mahjongg/column2/column630.html)).
- In 2024 data, players completing flexible 369 hands chose 6s least often ([ILM 2024](https://ilovemahj.com/mah-jongg-statistics2024)).
- 2026: 369 #1 is a cousin of CR #4; #5 has a floating pair; #6 has three singles that can't be called or jokered and must be shown at declaration ([Sloper col. 815](https://sloperama.com/mahjongg/column2/column815.html), [2026 FAQ](https://sloperama.com/mjfaq/2026.html)). Mahjong 4 Friends also lists 369 #6 as concealed ([2026 guide](https://mahjong4friends.com/guides/understanding-2026-nmjl-mahjong-hands)).

Confidence: High.

**Any Like Numbers.**
- Don't pass the same number across suits ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)).
- In 2024, 1s were the most chosen number in like-number wins and 6s the least ([ILM 2024](https://ilovemahj.com/mah-jongg-statistics2024)).
- 2026: ALN #1 needs an unbreakable six-flower sextet; ALN #2 uses three dragon singles; ALN #3's dragon pair can match any suit ([Sloper col. 815](https://sloperama.com/mahjongg/column2/column815.html), [2026 FAQ](https://sloperama.com/mjfaq/2026.html)). An Insider quiz favored ALN #3 over CR #4 when ALN #3's pairs were already in hand ([Insider quiz](https://mahjong.beehiiv.com/p/0420ymn2)).

Confidence: Medium-High.

**Winds-Dragons.**
- About 16 to 21% of ILM wins ([ILM 2023](https://ilovemahj.com/mah-jongg-statistics2023), [2024](https://ilovemahj.com/mah-jongg-statistics2024)).
- Wind exposures are easy to read ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)), and joker bait works poorly with winds ([Sloper col. 522](https://sloperama.com/mahjongg/column522a.html)).
- Winds circulating in the second Charleston may be an invitation to switch to a wind hand ([ILM part 2](https://stljewishlight.org/uncategorized/this-week-in-mah-jongg-game-strategy-part-2/)).
- NEWS is singles, so no jokers.
- 2026: W-D #2 includes a four-number "Rummy run" of singles (no jokers, no calls) plus all three dragons, used as two pungs and a kong. [Correction after the fact check: an earlier draft said dragon singles; Sloper column 815 says "two pungs and a kong."] W-D #3 and #4 pair winds with numbers by odd or even. W-D #5 has two flower pungs. W-D #8 is a one-suit year hand ([Sloper col. 815](https://sloperama.com/mahjongg/column2/column815.html), [2026 FAQ](https://sloperama.com/mjfaq/2026.html)).
- The Insider warns that one W-D line mixing number singles with growing wind groups gets misread and wrongly exposed ([4/20/26](https://mahjong.beehiiv.com/p/04-20-26-your-new-card-game-plan-starts-here)).

Confidence: Medium-High.

**Quints.**
- Consider Quints with two or more jokers ([Sloper col. 725](https://sloperama.com/mahjongg/column2/column725.html), [ILM guide](https://ilovemahj.com/american-mahjong-strategy)).
- Under 1% of ILM wins, and no jokerless bonus is possible ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html)).
- Quint exposures reveal a lot. Which quint exposures are dead changes yearly; in 2025 every quint of a wind, dragon, soap or flower was dead ([ILM 2025 initial](https://ilovemahj.com/2025-card-initial-analysis)).
- 2026: Quints #3 allows "literally any two numbers," with a dragon of any suit ([Sloper 2026 FAQ](https://sloperama.com/mjfaq/2026.html)).

Confidence: Medium-High.

**Singles and Pairs.**
- Concealed, no jokers usable, no jokerless bonus ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html)), and about 0.1% of ILM wins.
- Best when dealt many pairs and no jokers ([Sloper col. 725](https://sloperama.com/mahjongg/column2/column725.html)); one Insider reader credits this advice for a win ([4/20/26](https://mahjong.beehiiv.com/p/04-20-26-your-new-card-game-plan-starts-here)).
- Any jokers you draw must be discarded ([Sloper col. 563](https://sloperama.com/mahjongg/column2/column563.html)), which signals to others.
- 2026: S&P #1 includes three dragon singles, #3 is a 369 hand with a floating pair, and #6 needs three single soaps ([Sloper col. 815](https://sloperama.com/mahjongg/column2/column815.html), [2026 FAQ](https://sloperama.com/mjfaq/2026.html)).

Confidence: High.

**Year hands (2026).**
- The year is four singles with a soap as the zero. It can't take jokers and can't be exposed before Mah Jongg ([Sloper 2026 FAQ](https://sloperama.com/mjfaq/2026.html)).
- The year section took about 3.6 to 5.4% of ILM wins in 2023 and 2024.
- Soaps double as dragons and zeros, so don't pass them lightly ([ILM guide](https://ilovemahj.com/american-mahjong-strategy)). Late in the game a soap or flower may be someone's needed single ([ILM part 4](https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4)).
- 2026: 2026 #1 uses suitless (blue) tiles, so its zeros are soaps; #2 can be any suit, with dragons that match ([Sloper 2026 FAQ](https://sloperama.com/mjfaq/2026.html)). Sloper notes 2026 #4 is four singles with no jokers ([2026 FAQ](https://sloperama.com/mjfaq/2026.html)). One guide goes further and says several year lines bar jokers entirely ([Mahjong 4 Friends 2026](https://mahjong4friends.com/guides/understanding-2026-nmjl-mahjong-hands)); verify against the card.

Confidence: Medium-High.

**Overall 2026 commentary**
- **Flower-heavy.** First takes noted "flower-heavy hands" and many consecutive pungs and kongs ([Insider 3/23/26](https://mahjong.beehiiv.com/p/03-23-26-the-2026-card-is-hitting-mailboxes-now)). Sloper counts two six-flower hands and several flower-pung hands, with no flower kongs ([col. 815](https://sloperama.com/mahjongg/column2/column815.html)). The Insider expects flowers to be in high demand ([quiz](https://mahjong.beehiiv.com/p/0420ymn2)). Confidence: High.
- **The standout hand** is CR #4 ([Sloper col. 815](https://sloperama.com/mahjongg/column2/column815.html)). Confidence: Medium-High (one expert, strongly stated).
- **Harder hands.** Sloper explicitly calls the four-pair E-W hand in 2468 harder ([col. 815](https://sloperama.com/mahjongg/column2/column815.html)). By the same logic (naturals that jokers can't fill, or heavy competition for flowers), the six-flower hands and the two hands that use all three dragons as singles (Any Like Numbers #2 and Singles and Pairs #1) should also be demanding (my inference). Confidence: Medium for the E-W hand; Low for the inference.
- **Familiar structures.** Sections are unchanged from 2025, and the first lines of several sections echo prior years with rearranged tile types ([Insider 3/30/26](https://mahjong.beehiiv.com/p/03-30-26-before-you-study-the-2026-card-read-this), [4/13/26](https://mahjong.beehiiv.com/p/04-13-26-the-smart-way-to-approach-the-2026-card)). Confidence: Medium.
- **Concealed lines.** Per one guide, they are 2468 #8, CR #8, 13579 #8 and #9, W-D #8, 369 #6 and all of S&P ([Mahjong 4 Friends 2026](https://mahjong4friends.com/guides/understanding-2026-nmjl-mahjong-hands)); Sloper independently confirms 2468 #8, CR #8 and 13579 #9. Confidence: Medium (verify on the card).
- **Rule text.** The 2026 card back adds the claiming rule, the "NEVER picked up" joker rule and the sextet wording ([Sloper col. 816](https://sloperama.com/mahjongg/column2/column816.html)). Confidence: High.
- **Sentiment.** Some players report more wall games this year ([Insider 6/1/26](https://mahjong.beehiiv.com/p/06-01-26-this-trips-everyone-up)). Confidence: Low.

**Coaching tips (beginner)**
- Learn Consecutive Run first; on the 2026 card, CR #4 is the most forgiving hand.
- Two or more jokers? Peek at Quints. No jokers and lots of pairs? Peek at Singles and Pairs.
- Flowers are in demand this year: keep yours early, and don't throw them late.
- Read every line to the end, including color, parentheses and C or X, before you commit.

**Bot heuristics (programmer)**
- Encode each line's constraints exactly: suit relations, matching dragons, floating pairs that must match kongs, singles groupings, the concealed flag, no-joker groups, and unbreakable sextets. Most card misreads are encoding bugs.
- Seed opponent-model priors by section using ILM's win shares, then update from observed exposures.
- Beginner bots can restrict themselves to a "familiar" subset (Consecutive Run, 13579, 2468, Like Numbers), mimicking how new players learn ([Insider 4/13/26](https://mahjong.beehiiv.com/p/04-13-26-the-smart-way-to-approach-the-2026-card)).
- Expert bots use the full card, including flower-sextet and concealed lines.

---

## 11. Bots: published approaches and what feels realistic

**What American mah jongg products disclose (marketing-level detail only).**
- **I Love Mahj** ([KB](https://ilovemahj.com/kb/67000755046), [Let's Play](https://stljewishlight.org/news/news-local/this-week-in-mah-jongg-lets-play), [ILM 2023](https://ilovemahj.com/mah-jongg-statistics2023)):
  - three bot levels, where higher levels apply "more advanced strategies (including defensive strategies)";
  - bots "learn it instantly" when a new card comes out;
  - no information advantage: bots see the same discards and exposures as humans;
  - bots pick hands "objectively" from their tiles, unlike humans with favorites;
  - a Practice Mode gives hand suggestions.
- **NMJL Online** (official app, developer Quicksilver Software): "seven different AI players" per the App Store ([listing](https://apps.apple.com/us/app/nmjl-online/id6476651173)), "eight bots with different playing styles" per Sloper ([FAQ 5](https://sloperama.com/mjfaq/mjfaq05.html)). Minor discrepancy, unresolved.
- **JLMahjongg:** three skill levels with "selectable defensive and offensive skill," plus hand hints and defense feedback ([App Store](https://apps.apple.com/us/app/jlmahjongg/id6636551178)).
- **Jade Table:** Beginner, Intermediate and Expert tiers, plus a post-game analysis showing each player's best target and the tiles still needed ([listing](https://mwm.ai/apps/jade-table/6762567102)).
- **Callie's Mahjong:** computer opponents "each with their own way of playing" across three levels ([listing](https://mwm.ai/apps/callies-mahjong/6781089384)).
- **American Mahjong Practice:** solo bots that "play valid patterns and exchange jokers but do not declare Mahjong," with an option to enable winning bots "to practice defense." Suggested hands are ranked by matching tile count ([App Store](https://apps.apple.com/app/id1458051621)).
- **mahjongg.ai.studio** (anonymous site; weak source): a Charleston assistant that scores racks by "compatibility" with card families and protects natural pairs ([tools](https://mahjongg.ai.studio/tools/)).

Confidence: Low to Medium (self-descriptions).

**Research approaches from other mahjong variants.** No academic paper on American (NMJL) mahjong AI was found. Wikipedia's survey covers Japanese mahjong only ([Mahjong and AI](https://en.wikipedia.org/wiki/Mahjong_and_artificial_intelligence)).
- **Mizukami and Tsuruoka (Japanese riichi; CIG 2015, per the file name)** ([PDF](https://www.logos.ic.i.u-tokyo.ac.jp/~tsuruoka/papers/cig2015mizukami.pdf)). They combine Monte Carlo simulation with three learned opponent models: whether an opponent is one tile from winning, which tiles would win for them, and what it would cost. Folding is treated as an expected-value comparison.
- **Kurita and Hoki** ([arXiv 1904.07491](https://arxiv.org/pdf/1904.07491)). They abstract opponents into a probabilistic environment so each decision becomes a single-player Markov decision process, with separate "win" and "fold" models.
- **Suphx** (deep reinforcement learning, Japanese) ([arXiv 2003.13590](https://arxiv.org/pdf/2003.13590)) reached top human ranks.
- **Li et al. 2025** ([arXiv 2506.16995](https://arxiv.org/abs/2506.16995v1)) target agents that stay strong while preserving distinct, human-like play styles.
- **IJCAI** has run mahjong AI competitions on other variants ([IJCAI 2024](https://ijcai.org/proceedings/2024/1020)).

How they transfer (my inference): American mahjong's fixed, enumerable card (about 1,000 to 2,000 playable variations) makes exact distance-to-hand computation cheap, so heuristic or Monte Carlo bots are practical without machine learning. The opponent-model ideas (readiness, winning-tile prediction, explicit folding) map directly onto Section 7.

**What players say about realism (Real Mah Jongg app reviews, [SplitMetrics](https://splitmetrics.com/apps/real-mah-jongg/id1249840399)).**
- **Unrealistic play:** "the computer makes plays that would never be done in real life"; "Computer does not play defensively"; a bot "will throw the obviously needed tile for Mahj."
- **Suspected rigging:** "the computers seem rigged and unfair"; "joker distribution favors the computers"; a bot exchanging "3 jokers with 3 flowers in one fail swoop" looked suspicious.
- **Speed:** bots that "mahjong with less than 25 tiles played"; wins come "so fast you don't have a chance."
- **Missed calls:** reports of the game skipping tiles players wanted to call.
- **Praise:** "fast and very realistic"; bots "play quite well" even if not like humans.

ILM's help article answers the "bots cheat" complaint with arithmetic. Three bots against one human should collectively win about three times as often, so a human of equal skill wins about 22.5% of games ([ILM KB](https://ilovemahj.com/kb/67000755046)). Confidence: Low for the reviews (one app, self-selected); High for the arithmetic.

**Synthesis: a suggested bot design (my proposal, built from the sourced heuristics above)**
- **Architecture.** Six modules, all reading only public information plus the bot's own rack:
  - card expander (Section 2);
  - hand evaluator (Section 2);
  - Charleston policy (Section 3);
  - call and joker policy (Sections 4 and 5);
  - opponent model and danger (Section 7);
  - personality and difficulty layer.
- **Difficulty knobs:**

| Knob | Beginner | Intermediate | Expert |
|---|---|---|---|
| Card coverage | Familiar sections only, top few targets, some evaluation noise | Full card | Full card plus overlap-aware backups |
| Charleston | Never stops, never blind passes | Blind passes when needed, rarely stops | Uses all options, reads passes |
| Calling | Calls eagerly (about 4 to 5 tiles toward the hand) | Calls at about 7 tiles toward the hand | Calls at about 7 tiles; considers information cost and backups |
| Jokers | Redeems only when it needs the joker; never discards jokers | Redeems to use or deny | Redeems to deny, uses joker bait, splits jokers |
| Defense | None beyond legality | Never discards to a third exposure | Full danger model, folds by expected value, discards warmer before colder |
| Dead calls | Never | When obvious | Always when certain |

- **Realism rules.**
  - Never peek at hidden tiles or the wall (ILM's stated standard). Offer an optional post-game replay of all racks to build trust, as Jade Table's post-game analysis does.
  - Pace decisions like people: variable delays scaled to decision difficulty, anchored on ILM's human averages (about 17 s per Charleston decision, 3.5 s per in-game decision), shortened for an app.
  - Always give the human a visible claim window after each discard. The Mahjong Line notes players may say "pause" to get thinking time ([The Mahjong Line](https://themahjongline.com/pages/the-big-card-american-mahjong-101)).
  - Animate joker exchanges one at a time.
  - At easy levels, avoid improbably fast wins (consider a soft floor on early Mah Jongg declarations in guided matches).
  - Give each bot a personality: a favorite section, value versus safety appetite, offense and defense levels set separately (as JLMahjongg does), and an etiquette cap on Charleston stops.
  - Inject occasional legal but imperfect choices at low levels, never illegal ones.
- **Guided-practice ideas seen in products:**
  - bots that play but can't win, then a mode where they can, for defense practice (American Mahjong Practice);
  - live hand suggestions (ILM Practice Mode);
  - a post-game "what was everyone going for" review (Jade Table);
  - Charleston puzzles (The Winning Hand's "Charleston Challenge," per [Insider 3/30/26](https://mahjong.beehiiv.com/p/03-30-26-before-you-study-the-2026-card-read-this));
  - an exposure-reading game ([American Mahjong Defense](https://apps.apple.com/us/app/id1575634397)).

**Coaching tips (beginner)**
- The computer players see only what you see: the discards, the exposures and their own tiles.
- Against three opponents of equal skill, winning about one game in four or five is normal.
- Watch what the computer players expose; it is good practice for reading real opponents.

---

## 12. Open questions and weak spots

1. **No public 2026 statistics.** ILM's 2026 analysis (playable-hand counts, tile demand, safest exposures) is members-only and sold as a book. Only anecdote supports "more wall games in 2026."
2. **Official text read second-hand.** The NMJL website FAQ was under construction, and the January 2026 bulletin is an image flipbook that couldn't be read. Official rules here come through Sloper's quotations. Verify these points against *Mah Jongg Made Easy*: the concealed-hand final-tile claim, payment details (Sloper says the 2026 card back dropped its scoring section), and joker exchange from dead hands.
3. **Line-level 2026 details from a single guide.** Some details (the list of concealed lines; joker bans in the year section) come from Mahjong 4 Friends' guide, which is anonymous and loose on some rules elsewhere. Check them against your card.
4. **Thin American-specific bot research.** No academic work on NMJL bots was found, and product descriptions are marketing-level. User feedback on bot realism comes from one app's reviews.
5. **Books not read.** Strategy books by Elaine Sandberg, Swain and Salk (foreword by Gladys Grad) and Ann Israel were identified only through publisher or catalog pages. No online strategy writing by Ann Israel or Gladys Grad was found in this session.
6. **Sandberg's "wait for the second discard."** This 2010 tactic was not corroborated by any other source.
7. **Search budget.** The session's web search budget ran out before follow-up searches on YouTube teachers' 2026 card reviews, Reddit threads about bot realism, and Ann Israel's newsletter could run.
8. **ILM statistics.** They mix bot and human games, come from one platform, and are tied to specific card years. Use them as calibration targets, not truths.

---

## Consolidated source list

**Official rules (via Sloper) and Tom Sloper (Sloperama)**
- FAQ 8, Strategy: https://sloperama.com/mjfaq/mjfaq08.html
- FAQ 19, American rules: https://sloperama.com/mjfaq/mjfaq19.html
- FAQ 16, the 2026 card: https://sloperama.com/mjfaq/2026.html
- FAQ 28, Charleston stoppers: https://sloperama.com/mjfaq/mjfaq28.html
- FAQ 14, table rules: https://sloperama.com/mjfaq/mjfaq14.html
- FAQ 5, computer games: https://sloperama.com/mjfaq/mjfaq05.html
- Columns: 815 (Mar 22, 2026) https://sloperama.com/mahjongg/column2/column815.html ; 816 (Mar 29, 2026) https://sloperama.com/mahjongg/column2/column816.html ; 796 https://sloperama.com/mahjongg/column2/column796.html ; 783 https://www.sloperama.com/mahjongg/column2/column783.html ; 771 https://www.sloperama.com/mahjongg/column2/column771.html ; 729 https://www.sloperama.com/mahjongg/column2/column729.html ; 728 https://sloperama.com/mahjongg/column2/column728.html ; 725 https://sloperama.com/mahjongg/column2/column725.html ; 724 https://sloperama.com/mahjongg/column2/column724.html ; 631 https://sloperama.com/mahjongg/column2/column631.html ; 630 https://sloperama.com/mahjongg/column2/column630.html ; 588 https://sloperama.com/mahjongg/column2/column588.html ; 587 https://sloperama.com/mahjongg/column2/column587.html ; 576 https://sloperama.com/mahjongg/column2/column576.html ; 563 https://sloperama.com/mahjongg/column2/column563.html ; 535 https://sloperama.com/mahjongg/column535a.html ; 534 https://sloperama.com/mahjongg/column534a.html ; 529 https://sloperama.com/mahjongg/column529a.html ; 524 https://sloperama.com/mahjongg/column524a.html ; 522 https://sloperama.com/mahjongg/column522a.html ; 520 https://www.sloperama.com/mahjongg/column520a.html ; 518 https://sloperama.com/mahjongg/column518a.html ; 516 https://sloperama.com/mahjongg/column516a.html ; 513 https://sloperama.com/mahjongg/column513a.html ; 500 https://sloperama.com/mahjongg/column500a.html ; 494 https://www.sloperama.com/mahjongg/column494a.html ; 493 https://www.sloperama.com/mahjongg/column493a.html ; 488 https://sloperama.com/mahjongg/column488a.html ; 227 https://sloperama.com/mahjongg/column227a.html

**Elaine Sandberg**
- "Defense! Defense! Defense!" (2010): https://jewishjournal.com/?p=81162
- "The Hot Tile" (2011): https://jewishjournal.com/?p=88918
- Book page: https://www.tuttlepublishing.com/bestsellers/winning-american-mah-jongg-strategies

**I Love Mahj**
- Strategy guide: https://ilovemahj.com/american-mahjong-strategy
- Statistics: 2022 https://ilovemahj.com/mah-jongg-statistics ; 2023 https://ilovemahj.com/mah-jongg-statistics2023 ; 2024 https://ilovemahj.com/mah-jongg-statistics2024
- Card analyses: 2025 https://ilovemahj.com/2025-card-analysis ; 2025 initial https://ilovemahj.com/2025-card-initial-analysis ; 2026 (paywalled) https://www.ilovemahj.com/nmjl-2026-analysis ; 2024 for The Mahjong Line https://themahjongline.com/blogs/mahjong-tales/national-mah-jongg-league-s-2024-card-analysis
- Help and Q&A: KB https://ilovemahj.com/kb/67000755046 ; Q601, Q609, Q725, Q747 (URLs inline above)
- St. Louis Jewish Light series: https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-strategic-thinking ; https://stljewishlight.org/uncategorized/this-week-in-mah-jongg-game-strategy-part-2/ ; https://stljewishlight.org/arts-entertainment/this-week-in-mah-jongg-game-strategy-part-4 ; https://stljewishlight.org/arts-entertainment/reading-you-opponents-hands-joker-strategy ; https://stljewishlight.org/news/news-local/this-week-in-mah-jongg-lets-play

**Other teaching and newsletter sources**
- The Mahjong Line rules primer: https://themahjongline.com/pages/the-big-card-american-mahjong-101
- Mahjong 4 Friends: https://mahjong4friends.com/guides/advanced-mah-jongg-strategies ; https://mahjong4friends.com/guides/mah-jongg-strategy ; https://mahjong4friends.com/guides/american-mah-jongg-charleston-guide ; https://mahjong4friends.com/guides/mah-jongg-joker ; https://mahjong4friends.com/guides/understanding-2026-nmjl-mahjong-hands
- The Mah Jongg Insider: https://mahjong.beehiiv.com/p/03-23-26-the-2026-card-is-hitting-mailboxes-now ; https://mahjong.beehiiv.com/p/03-30-26-before-you-study-the-2026-card-read-this ; https://mahjong.beehiiv.com/p/04-13-26-the-smart-way-to-approach-the-2026-card ; https://mahjong.beehiiv.com/p/04-20-26-your-new-card-game-plan-starts-here ; https://mahjong.beehiiv.com/p/0420ymn2 ; https://mahjong.beehiiv.com/p/06-01-26-this-trips-everyone-up ; https://mahjong.beehiiv.com/p/p0601qk5
- LocalLife SC: https://www.locallifesc.com/mahjong-hand-august-2026-card-error/
- Mahjong Mississippi tournament rules: https://www.hopevillagems.org/wp-content/uploads/2026/01/mjms-rules-and-scoring-2026-tournament-revisions-nov-11.pdf
- Wikipedia, American mahjong: https://en.wikipedia.org/wiki/American_mahjong

**Apps and AI research**
- Apps: NMJL Online https://apps.apple.com/us/app/nmjl-online/id6476651173 ; Real Mah Jongg reviews https://splitmetrics.com/apps/real-mah-jongg/id1249840399 ; American Mahjong Practice https://apps.apple.com/app/id1458051621 ; JLMahjongg https://apps.apple.com/us/app/jlmahjongg/id6636551178 ; Jade Table https://mwm.ai/apps/jade-table/6762567102 ; Callie's Mahjong https://mwm.ai/apps/callies-mahjong/6781089384 ; American Mahjong Defense https://apps.apple.com/us/app/id1575634397 ; mahjongg.ai.studio https://mahjongg.ai.studio/tools/
- Research: Mizukami and Tsuruoka https://www.logos.ic.i.u-tokyo.ac.jp/~tsuruoka/papers/cig2015mizukami.pdf ; Kurita and Hoki https://arxiv.org/pdf/1904.07491 ; Suphx https://arxiv.org/pdf/2003.13590 ; Li et al. https://arxiv.org/abs/2506.16995v1 ; IJCAI competitions https://ijcai.org/proceedings/2024/1020 ; Wikipedia survey https://en.wikipedia.org/wiki/Mahjong_and_artificial_intelligence
