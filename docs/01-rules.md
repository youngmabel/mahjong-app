# 01. Rules of Play (NMJL standard, no blanks)

This is the rules reference the app should implement. Everything here is official National Mah Jongg League (NMJL) play unless it is labeled a table rule. Each key claim carries a confidence tag:

- **[H] High**: the NMJL rulebook or card (as quoted by Tom Sloper, who tracks every rulebook edition and League bulletin) plus at least one independent teaching source agree.
- **[M] Medium**: one solid source, or several secondary sources that agree.
- **[L] Low**: a single secondary source, or an inference.

The governing documents are the NMJL rulebook *Mah Jongg Made Easy* (revised 2024, $13 from the NMJL store) and the rules printed on the back of the 2026 card. The rulebook is not online, so most details below come from Tom Sloper's FAQ 19, which cites the rulebook and League bulletins by edition and page, cross-checked against teacher guides. **Suggestion:** buy *Mah Jongg Made Easy* along with the card, so the build chat can settle edge cases from the primary source. [NMJL store](https://www.nationalmahjonggleague.org/store.aspx)

---

## 1. Equipment

| Group | Kinds | Copies of each | Tiles |
|---|---|---|---|
| Bams (bamboo), 1 to 9 | 9 | 4 | 36 |
| Craks (characters), 1 to 9 | 9 | 4 | 36 |
| Dots (circles), 1 to 9 | 9 | 4 | 36 |
| Winds: North, East, West, South | 4 | 4 | 16 |
| Dragons: Red, Green, White ("Soap") | 3 | 4 | 12 |
| Flowers (all 8 interchangeable) | 1 | 8 | 8 |
| Jokers | 1 | 8 | 8 |
| **Total** | | | **152** |

- 152 tiles, no blanks. Some modern sets add blank tiles for a table rule; this app excludes them. [H] ([Linda Fisher's rules](https://sites.google.com/site/mahjrules/home/rules), [YM Imports](https://www.ymimports.com/pages/how-to-play-american-mahjong), [Sloper, Shanghai guide part 1](https://sloperama.com/shanghai/Images/mjamer-1.htm))
- Flowers and Seasons from Chinese sets all count as one interchangeable "Flower" tile. [H] (Sloper part 1)
- Each player has a rack: the sloped front holds the hidden hand, and the flat top holds exposures. Called tiles go on top of the rack, never into the hand. [H] ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html), [Mahjong Mississippi tournament rules 2026](https://www.hopevillagems.org/wp-content/uploads/2026/01/mjms-rules-and-scoring-2026-tournament-revisions-nov-11.pdf))
- Quints and sextets (5 or 6 identical tiles) exist only because of jokers, since there are only 4 of each tile. Flowers are the exception: with 8 Flowers, flower quints and sextets can be natural. [H] (Sloper part 1)

## 2. Seats, direction, and the dealer

- Four players. The dealer is East. The player to East's right is South, then West, then North. [H] (YM Imports)
- Turns go counterclockwise, which means to the right. Tiles come off the wall clockwise. [H] (Sloper FAQ 19)
- After every game, win or wall game, the deal passes to the right. [H] ([Sloper, Shanghai guide part 4](https://sloperama.com/shanghai/Images/mjamer-4.htm), YM Imports)

## 3. Setup and the deal

- Tiles are shuffled face down. Each player builds a wall 19 stacks long and 2 tiles high (38 tiles x 4 = 152). [H] ([Wikipedia](https://en.wikipedia.org/wiki/American_mahjong), YM Imports)
- East rolls dice to choose where to break the wall. Players take 4 tiles at a time (two stacks) going to the right until everyone has 12. East then takes 2 more and everyone else takes 1. **East starts with 14 tiles; everyone else has 13.** [H for the 14/13 split; M for the exact dealing pattern] (YM Imports, [The Mahjong Line](https://themahjongline.com/pages/the-big-card-american-mahjong-101); Linda Fisher describes a slightly different older pattern)
- **Heavenly Hand**: if East's 14 dealt tiles already form a card hand, East declares Mah Jongg at once and the Charleston is skipped (2013 rulebook). It is paid as a self-pick: everyone pays double, four times if jokerless (2010 League letter from then-president Ruth Unger). [H] ([Sloper column 666](https://sloperama.com/mahjongg/column2/column666.html); the AMJA guide agrees)
- **East complete after the Charleston**: East may declare Mah Jongg instead of making the first discard. [H] (Sloper column 534) The NMJL doesn't document how that win is paid; the AMJA treats a hand East completes during the Charleston (an "Earthly Hand") as self-picked. Use self-pick payment as the app's labeled choice. [L-M]
- **App note:** shuffling and dealing are automatic and seeded (see 07-app-spec). The tutorial can show the wall and deal as a short animation; the physical method does not affect fairness.

## 4. The Charleston (tile passing before play)

| Pass | Direction | Required? | Blind pass allowed? |
|---|---|---|---|
| 1 | Right | Yes | No |
| 2 | Across | Yes | No |
| 3 ("first left") | Left | Yes | Yes, 1 to 3 tiles |
| 4 ("second left") | Left | Optional (second Charleston) | No |
| 5 | Across | Optional | No |
| 6 ("last right") | Right | Optional | Yes, 1 to 3 tiles |
| Courtesy pass | Across | Optional | Not applicable |

- Every Charleston pass is exactly 3 tiles. Memory aid: "ROL LOR" (right, over, left; left, over, right). [H] ([Mahjong 4 Friends](https://mahjong4friends.com/guides/american-mah-jongg-charleston-guide), [Sloper FAQ 28](https://sloperama.com/mjfaq/mjfaq28.html), YM Imports)
- **Jokers may never be passed**, in any pass including the courtesy pass. [H] (all sources) If one is passed by mistake, it is returned and a natural tile passed instead. [M] (Mahjong 4 Friends; the AMJA guide; one low-quality site claims a dead hand, which no authoritative source supports) The app simply prevents it.
- **Blind pass ("steal")**: on the first left and the last right only, you may forward 1 to 3 of the tiles coming to you without looking at them, and make up the rest of your 3 from your own hand. [H] (Linda Fisher, The Mahjong Line, Mahjong Mississippi)
- **Stopping**: the second Charleston happens only if nobody objects. Any single player may stop it once the first Charleston is complete. [H] (Sloper FAQ 28: "It takes only one person to cause a stop") Sources describe the cutoff for objecting differently (before anyone looks at, or racks, the second Charleston's first pass). [M] (The Mahjong Line; Mahjong Mississippi; AMJA) The app sidesteps this by asking all four players before any second-Charleston tile moves.
- **Courtesy pass**: after the Charleston(s), each player may exchange 0 to 3 tiles with the player across. If the two disagree on the number, the lower number is used. Stopping the second Charleston does not cancel the courtesy pass. [H] (Sloper FAQ 28; [Sloper, Shanghai guide part 3](https://sloperama.com/shanghai/Images/mjamer-3.htm); The Mahjong Line; [I Love Mahj guide](https://ilovemahj.com/american-mahjong-getting-started))
- Edge case: if all four players want to blind pass all 3 tiles at once, a 2020 League rule supports an "IOU" method. [M] ([Sloper column 534](https://sloperama.com/mahjongg/column534a.html)) The app can resolve this automatically.
- "Mush" or "mish" (pooling unwanted tiles) is a table rule, not official. Leave it out. [H]

## 5. A normal turn

1. East begins by discarding one of 14 tiles (East does not pick first), unless East can declare Mah Jongg (section 3). [H]
2. Each later turn: **pick** the next wall tile (or **claim** the last discard; see section 6), optionally **redeem jokers** (section 8), then **discard** one tile and name it aloud, **or declare Mah Jongg**. [H] (Sloper FAQ 19; YM Imports)
3. Hand size is 13 between turns and 14 during your own turn. A wrong count makes the hand dead. [H] (Linda Fisher; Sloper FAQ 19)
- A discard is "down" once it touches the table or is fully named. After that it can never be taken back: "Down is dead." [H] (Sloper FAQ 19, citing the 2020 and 2023 rulebooks)
- No picking ahead: prohibited since 1956 ("no looking ahead" was printed on the card as early as 1947). The phrase was dropped from the card's wording in 2024, but the prohibition stands. [M-H] ([Sloper FAQ 19](https://sloperama.com/mjfaq/mjfaq19.html); [Sloper column 797](https://www.sloperama.com/mahjongg/column2/column797.html); [Sloper timeline](https://sloperama.com/mjfaq/mjfaq11h.html)) Not relevant to the app except as trivia.

## 6. Claiming ("calling") a discard

- Only the most recent discard can be claimed. [H]
- **Window**: opens when the discard is down; closes when the next player racks a wall tile, discards, declares Mah Jongg, or starts a joker exchange. [H] (Sloper FAQ 19, where the joker-exchange trigger dates from 2020; [AMJA claiming guide](https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/claiming-discarded-tile-exposure/); I Love Mahj guide)
- **Allowed purposes**: (a) to complete a pung, kong, quint, or sextet that you then expose, or (b) to complete Mah Jongg. You may never claim a discard for a single, a pair, or a grouping of singles such as NEWS or 2026, **except** as the tile that completes Mah Jongg. [H] (Sloper FAQ 19; [Sloper column 816](https://sloperama.com/mahjongg/column2/column816.html) on the expanded rule on the back of the 2026 card)
- **Concealed hands** (marked C) may never claim a discard except the final tile for Mah Jongg. [H]
- **Discarded jokers are dead** and can never be claimed. This is a long-standing rule (in League newsletters since at least 2005) that is now also printed on the back of the 2026 card as a numbered joker rule; the rule itself did not change. [H] (Sloper FAQ 19; Sloper column 816)
- A discarded tile that matches an exposed joker can only be claimed for a new exposure or Mah Jongg, never to redeem the joker. [H] (Sloper FAQ 19)
- **Priority**: a Mah Jongg claim beats an exposure claim, even if the other player already started exposing (2020 rule). For two claims of the same kind, the player next in turn after the discarder wins, unless the other claimant has already begun exposing. [H] (Sloper FAQ 19, citing the 2019 NMJL FAQ; AMJA claiming guide)
- **After a claim for exposure**, the claimer exposes the set, then discards. Play continues to the claimer's right, so any players in between lose that turn. [H] (Sloper, Shanghai guide part 3; YM Imports)
- **App note:** after every discard, pause for claims. In tutorial and guided modes, always wait for the player to choose Call or Pass, and only light up Call when a claim is legal. Bots answer instantly.

## 7. Exposures

- An exposure is 3, 4, 5, or 6 identical tiles (pung, kong, quint, sextet): the claimed natural tile plus matching tiles and/or jokers from your hand, placed face up on top of your rack. Any number of jokers may join the claimed natural. [H] (Sloper FAQ 19)
- An exposure cannot be all jokers, because it must include the claimed natural. A set made only of jokers is legal if it stays concealed. [H] (Sloper FAQ 19)
- "A player may change the number and type of tiles displayed in an exposure up until the player has discarded" (back of the 2026 card, unchanged from 2025). [H] (Sloper column 816)
- Once an exposure is made, you may not then do a joker exchange and add that joker to the new exposure (2019 League letter, repeated in the January 2026 bulletin). [H] (Sloper column 816)
- **Exposures are fixed once you discard**, for the rest of the game: no adding tiles later (no "promoted kong" as in Chinese play), and the tile kind never changes. [H] (YM Imports; [I Love Mahj](https://ilovemahj.com/kb/67000729550); AMJA claiming guide) The AMJA and the Mahj Life primer also treat starting a joker exchange as locking the exposure, which fits the 2019/2026 rule above; the app should lock it at whichever comes first. [M]
- There is no replacement draw after a kong; every card hand is exactly 14 tiles. [H by structure; no source describes a replacement draw]
- An illegal exposure (anything other than a pung, kong, quint, or sextet: rule 15(c) of the 2023/24 rulebook) or any exposure in a concealed hand (rule 15(f)) makes the hand dead. An incorrect exposure can still be fixed before the player discards; the death penalty applies once they discard. When a player is called dead for an erroneous exposure, those tiles go back to the rack, and jokers exposed at the moment the hand died cannot be redeemed. [H] ([Sloper column 797](https://www.sloperama.com/mahjongg/column2/column797.html); Sloper FAQ 19; AMJA dead-hand guide)
- 2026 specifics: some hands require a flower sextet, which is "unbreakable" (exposed as one sextet, never split into two pungs); other hands need two separate flower pungs, "exposable at separate times." [H] ([Sloper 2026 card FAQ](https://sloperama.com/mjfaq/2026.html); [Sloper column 815](https://sloperama.com/mahjongg/column2/column815.html); [I Love Mahj 2026 clarifications](https://ilovemahj.com/kb/67000752308))
- When declaring Mah Jongg, arrange the exposures in card order. [H] (Sloper FAQ 19, citing the 2018 rulebook)

## 8. Jokers

- 8 jokers. A joker can stand in for any tile in a group of 3 or more identical tiles (pung, kong, quint, sextet). **Never** in a single or a pair, never in singles groupings like NEWS or 2026, and never in the Singles and Pairs section. [H] (Sloper FAQ 19; [Sloper 2026 card FAQ](https://sloperama.com/mjfaq/2026.html); Linda Fisher)
- **Joker exchange (redemption)**: on your own turn, after you have a 14th tile (by picking or by claiming a discard), you may hand over a natural tile from your hand that matches what an exposed joker stands for, and take the joker. You may redeem from any player's exposures, including your own, and more than one per turn. Concealed hands may redeem, since redeeming exposes nothing. [H] (Sloper FAQ 19; YM Imports)
- Redeeming before you have 14 tiles (for example as the first act of a turn) or out of turn makes the hand dead (2020 bulletin; 2023/24 rulebook rule 15(b)). [H] (Sloper FAQ 19; Sloper column 797; [Mahj Life primer](https://mahjlife.com/wp-content/uploads/2026/04/American-Mah-Jongg-Primer-Companion-20260406.1.pdf))
- If a wrong tile is handed over and nobody catches it before the redeemer discards, the player who now has the incorrect exposure is dead, not the redeemer. [H] (Sloper FAQ 19) The app prevents this.
- No reverse exchange: "You can use a tile to get a joker, but you can't use a joker to get a tile." [H] ([Sloper column 783](https://www.sloperama.com/mahjongg/column2/column783.html))
- Discarding a joker is legal. It is dead immediately. Saying "joker," "same," or the previous discard's name are all legal ways to announce it. [H] (Sloper FAQ 19; Linda Fisher)
- Properly exposed jokers on a dead player's rack stay redeemable. [H] (Sloper FAQ 19; Mahjong Mississippi)
- A Mah Jongg completed by a joker exchange counts as self-picked. [M] (Sloper, Shanghai guide part 3; [JCC St. Louis 2023 rules](https://jccstl.com/wp-content/uploads/2023/05/2358_Senior-Olympics-rules-2023_Mah-Jong.pdf))

## 9. Exposed (X) versus concealed (C) hands

- Every hand on the card is marked X (exposures allowed) or C (concealed). [H]
- A C hand shows nothing before Mah Jongg and may claim only its winning tile. [H]
- Singles and Pairs hands are all concealed. [H]

## 10. Winning (Mah Jongg)

- You win with 14 tiles that exactly match one hand on the card, with your exposures fitting that hand. The winning tile is self-picked from the wall or claimed from a discard. [H]
- The winner shows the hand laid out as on the card. [H]
- A jokerless win must be announced as jokerless to get the bonus (2014 bulletin). [H] (Sloper FAQ 19) The app does this automatically.
- **Mah Jongg in error**: if the hand was not exposed, there is no penalty and play continues. If it was exposed, the hand is dead and the player still pays the eventual winner; other players continue. [M] (YM Imports; Mahjong Mississippi) A 2023 rulebook rule lets a player who wrongly called Mah Jongg on a discard keep that tile as an exposure and play on. [M] ([Sloper column 797](https://www.sloperama.com/mahjongg/column2/column797.html)) If other players already threw in their tiles because of the false call, a rulebook provision has the erring player pay the surviving player double. [L-M] ([Sloper column 415](https://sloperama.com/mahjongg/column415a.html); [column 414](https://sloperama.com/mahjongg/column414a.html) adds that payments already made are not refunded) None of this can arise in the app if it prevents invalid declarations and explains why, which is the recommendation.

## 11. Dead hands

Causes [H] (Sloper FAQ 19; Sloper column 797; Linda Fisher):

- Wrong number of tiles.
- Exposures that match no hand on the card, or that commit the player to a concealed hand.
- **Unwinnable**, judged only from the player's exposures plus tiles visible to everyone (discards and exposures), never from hidden tiles. A needed single is gone when all 4 copies are visible; a needed **pair** is gone when **3 of the 4** are visible (7 of the 8 flowers for a flower pair), because jokers can't fill pairs. For a pung or larger the analysis must also account for all eight jokers, including jokers sitting in exposures (they can still be won by joker exchange), so it is rarely provable. [H] (Sloper FAQ 19, citing rule 15(e) of the 2023/24 rulebook; [AMJA dead-hand guide](https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/dead-hand/); [The Mah Jongg Insider, July 27, 2026](https://mahjong.beehiiv.com/p/07-27-26-your-burning-mah-jongg-questions-answered), an AMJA-affiliated newsletter)
- An illegal exposure, a joker redeemed out of turn or without 14 tiles, picking out of turn or from the wrong wall, or discarding before picking.

Consequences:

- Any player may call a hand dead at any time. [H]
- **The dead player stops playing; the game continues without them. The dead player still pays the winner** if someone goes Mah Jongg. [M-H] (Sloper, Shanghai guide part 4; YM Imports)
- A player who privately realizes their own hand can't win is not dead; they keep playing until someone challenges (the AMJA guide says not to announce it). [M]
- **If three players go dead**, the League's January 2024 bulletin recommends throwing the hand in and redealing (2020 rulebook rule 10(c)). [M-H] ([Sloper column 793](https://sloperama.com/mahjongg/column2/column793.html)) The AMJA instead ends the game with no payments and rotates East. Pick one and label it; redeal is the NMJL's recommendation.
- **A wrong death call**: penalties differ (I Love Mahj kills the challenger's hand; the AMJA has the challenger pay 50 cents); the NMJL text wasn't confirmed. [L] This only matters if the player can challenge bots.
- **App note:** keep two separate states. **Dead** (official): only on grounds the whole table could see, as above; the referee declares it with a one-line explanation, or bots call it, as at a real table. **Privately blocked**: the engine knows a player can't win because of their hidden tiles; that player keeps playing. Bots then switch to defense, and the coach can tell the learner. In guided modes, warn before any move that would make the player's hand officially dead.

## 12. Wall game

- If the last wall tile is picked and discarded with no Mah Jongg, the game is a wall game: no winner, and nobody pays. The deal passes to the right. [H] (Sloper, Shanghai guide part 4; YM Imports)

## 13. Payment and scoring

- Each card hand shows a point value. On the 2026 card values run from 25 to 75 (see 03-card-2026). Traditionally 25 points means 25 cents. [H for the method; M for the 2026 range]
- **Win on a discard:** the discarder pays double the hand's value; the other two pay single. [H]
- **Self-picked win:** all three pay double. [H]
- **Jokerless bonus:** the payment doubles again (discard win: discarder pays 4x, others 2x; self-pick: all pay 4x). The bonus does not apply to Singles and Pairs hands, and per Sloper not to Quints either. [H for S&P; M for Quints] (Sloper FAQ 19; Sloper, Shanghai guide part 4; YM Imports; Linda Fisher)
- Only the winner is paid. Non-winners are not scored against each other. [H]
- No current source describes any special payment for East. [M]
- New for 2026: the scoring section was removed from the back of the card. [H] (Sloper column 816) So the rulebook is now the place to check payment rules (inference).
- Whether a hand counts as jokerless is judged by the tiles shown at the moment of declaring, so a hand whose jokers were all exchanged out counts as jokerless, per the AMJA. [L-M] (AMJA payment guide; not confirmed for the NMJL) Treat it as the app's labeled choice.
- "Pie" (a cap on how much each player can lose in a session) is a table rule. [H]
- **App note:** keep a running session score in points. The cheat sheet should show each hand's value and the doubling rules.

## 14. Table rules and variants to leave out

These are common at home tables but are not NMJL rules. Leave them out of version 1; some could become toggles later.

- Blanks (excluded by your decision).
- "Hot wall" or "cold wall" (restrictions or penalties near the end of the wall). Sloper: there is no such rule in the official NMJL rules. [H]
- Mush or mish in the Charleston. [H]
- Extra penalties for discarding into a player with 2 or 3 exposures (some tournaments do this; the NMJL does not). [H] (Sloper FAQ 19; Mahjong Mississippi uses them)
Separately, two **official** NMJL provisions are simply out of scope for a solo four-player app: betting by a fifth player (the "bettor"; 2023 rulebook p. 25 rule 9(b), per [Sloper column 798](https://sloperama.com/mahjongg/column2/column798.html)) and games with fewer or more than four players ([Sloper FAQ 13a](https://sloperama.com/mjfaq/mjfaq13a.html)). [H]

## 15. Recent rule changes worth knowing

- **2020**: a Mah Jongg claim beats an exposure claim even mid-exposure; starting a joker exchange closes the discard window; the IOU method for an all-blind pass. (Sloper FAQ 19; column 534)
- **2023/24 rulebook**: "incorrect exposure" defined as anything not a pung, kong, quint, or sextet; dead hand for redeeming a joker out of turn; dead hand for discarding before picking; rules about pushing out the wrong wall. (Sloper column 797)
- **January 2024 bulletin**: when three players are dead, throw the hand in and redeal (recommended). (Sloper column 793)
- **Back of the 2026 card**: the claiming rule moved to the top of its section and now bars claiming for singles or pairs groupings except for Mah Jongg; joker rules renumbered, with "a discarded joker is dead" added and sextets added to where jokers may be used; the misnamed-tile and dead-hand sections merged; the scoring section dropped. (Sloper column 816)

## 16. How the app should handle rules (recommendations)

- Deal, count tiles, and arrange exposures automatically.
- Use an explicit claim window after every discard. In learning modes, wait for the player's Call or Pass.
- Prevent illegal actions rather than punishing them (no joker passing, no illegal exposures, no invalid Mah Jongg). When the player tries one, explain the rule in one or two sentences. That turns rule errors into teaching moments.
- Declare dead hands only on public evidence (section 11), and track "privately blocked" separately for bots and coaching. Warn in guided modes; enforce with an explanation in free play.
- Detect and apply the jokerless bonus automatically.
- Follow current rules (2026 card back plus the 2023/24 rulebook as reported by Sloper). Where sources conflict, the build chat should check *Mah Jongg Made Easy* if available.

---

### Sources

- Tom Sloper, FAQ 19, Questions about American rules: https://sloperama.com/mjfaq/mjfaq19.html
- Tom Sloper, FAQ 28, Stopping Charleston-Stoppers: https://sloperama.com/mjfaq/mjfaq28.html
- Tom Sloper, FAQ on the 2026 card: https://sloperama.com/mjfaq/2026.html
- Tom Sloper, columns 414, 415, 534, 666, 783, 793, 797, 798, 815, 816: https://sloperama.com/mahjongg/column414a.html, https://sloperama.com/mahjongg/column415a.html, https://sloperama.com/mahjongg/column534a.html, https://sloperama.com/mahjongg/column2/column666.html, https://www.sloperama.com/mahjongg/column2/column783.html, https://sloperama.com/mahjongg/column2/column793.html, https://www.sloperama.com/mahjongg/column2/column797.html, https://sloperama.com/mahjongg/column2/column798.html, https://sloperama.com/mahjongg/column2/column815.html, https://sloperama.com/mahjongg/column2/column816.html
- Tom Sloper, FAQ 13a (fewer or more than four players) and history timeline: https://sloperama.com/mjfaq/mjfaq13a.html, https://sloperama.com/mjfaq/mjfaq11h.html
- American Mah Jongg Association (AMJA) guide, a separate organization that tracks NMJL standards; used as an independent cross-check: claiming (https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/claiming-discarded-tile-exposure/), dead hand (https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/dead-hand/), Charleston (https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/the-charleston/), payment (https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/hand-value-and-payment/)
- I Love Mahj, Beginner's Guide and exposure knowledge-base article: https://ilovemahj.com/american-mahjong-getting-started, https://ilovemahj.com/kb/67000729550
- Independent fact check of this file: research/factcheck.md
- Tom Sloper, Shanghai: Second Dynasty American Mah-Jongg guide, parts 1, 3, 4: https://sloperama.com/shanghai/Images/mjamer-1.htm, https://sloperama.com/shanghai/Images/mjamer-3.htm, https://sloperama.com/shanghai/Images/mjamer-4.htm
- Linda Fisher, Rules for NMJL Mahjongg: https://sites.google.com/site/mahjrules/home/rules
- YM Imports, How to Play American Mahjong: https://www.ymimports.com/pages/how-to-play-american-mahjong
- The Mahjong Line, American Mahjong 101 (rules for its own alternative card, same play rules): https://themahjongline.com/pages/the-big-card-american-mahjong-101
- Mahjong 4 Friends, Charleston guide: https://mahjong4friends.com/guides/american-mah-jongg-charleston-guide
- Mahjong Mississippi 2026 tournament rules: https://www.hopevillagems.org/wp-content/uploads/2026/01/mjms-rules-and-scoring-2026-tournament-revisions-nov-11.pdf
- JCC St. Louis Senior Olympics rules (2023): https://jccstl.com/wp-content/uploads/2023/05/2358_Senior-Olympics-rules-2023_Mah-Jong.pdf
- The Mah Jongg Insider (AMJA-affiliated), July 27, 2026: https://mahjong.beehiiv.com/p/07-27-26-your-burning-mah-jongg-questions-answered
- I Love Mahj, NMJL 2026 card clarifications: https://ilovemahj.com/kb/67000752308
- Mahj Life, American Mah Jongg Primer Companion 2026: https://mahjlife.com/wp-content/uploads/2026/04/American-Mah-Jongg-Primer-Companion-20260406.1.pdf
- Wikipedia, American mahjong: https://en.wikipedia.org/wiki/American_mahjong
- NMJL store: https://www.nationalmahjonggleague.org/store.aspx
