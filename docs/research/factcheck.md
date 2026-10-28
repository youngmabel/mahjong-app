# Fact-check: 01-rules.md and 03-card-2026.md (plus 07-app-spec.md sections 4 to 7)

Checked October 26, 2026. Scope: every substantive claim in 01-rules.md and 03-card-2026.md, with extra attention to rules the engine must implement exactly. Sections 4 to 7 of 07-app-spec.md were skimmed only for rule statements that contradict 01-rules.md.

## Method and limits

- Each cited source was opened where reachable. Independent checks came from the American Mah Jongg Association (AMJA) guide, the I Love Mahj guide and knowledge base, YM Imports, The Mahjong Line, Sloper's FAQ 13a, FAQ 28 and cards FAQ, and Sloper columns 476, 534, 666, 793, 797, 798, 812, 815 and 816.
- Sloper FAQ 19: the fetch tool returns only the first 98,940 characters, and the text stops mid-sentence inside the death-challenge answer. The FAQ 19 answers on the Charleston, dealing, Heavenly Hand, seat rotation and most "Errors, Penalties" items fall past that cutoff. Those claims were checked against the other sources listed above.
- The AMJA is a different organization from the NMJL, even though its guide says it tracks NMJL standards. A point backed only by AMJA is labeled as such.
- No hands from the NMJL card are reproduced here. Hands are named only by section and line number where needed.

## Problems found (most important first)

### P1. Dead hands judged from hidden information

- **File and section:** 01-rules section 11, app note ("the engine can always tell exactly when a hand is dead... have the referee declare dead hands"). 07-app-spec 5.3 ("A player is dead ... when no target fits their exposures and is unblocked. Check every player after every action"), where live copies are computed from the player's own rack. 07-app-spec 7 ("With no reachable line left, play safe").
- **Verdict:** Contradiction (the spec against the rules, and 07 against itself).
- **Evidence:** FAQ 19 summarizes the NMJL death grounds from MJME 2023/24 p.19 rule 15. Unwinnability is judged from the player's exposures plus tiles "visible to all, either among the discards or as part of an exposure" (https://sloperama.com/mjfaq/mjfaq19.html, read at offset 60000). The AMJA guide says a death challenge "must be based solely on tiles visible to all". It also says a player who sees that their own hand is dead "should not announce it" and keeps playing until challenged (https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/dead-hand/). A hand is not dead just because the player's hidden tiles make it impossible. Within 07 itself, a bot with no reachable line is already dead under 5.3, so the "play safe" branch in section 7 can never run.
- **Suggested fix:** Separate two states. (a) **Dead:** the player stops picking and discarding but still pays the winner. Use this only for NMJL grounds a table could see: wrong tile count; exposures that match no hand, or match only concealed hands; an incorrect exposure still in place when the player discards; a joker redeemed without 14 tiles; and an unwinnable hand, judged from that player's exposures plus visible tiles. (b) **Privately blocked:** the engine knows the player cannot win, but the player keeps playing. Bots switch to defense, and the coach can tell the human. Use the 07 5.3 calculation only for (b) and for coaching.

### P2. Wrong unwinnable threshold for a needed pair

- **File and section:** 01-rules 11, third bullet ("For a needed single or pair, all copies are visible"), tagged [M] and sourced to the AMJA-affiliated Insider.
- **Verdict:** Error.
- **Evidence:** FAQ 19, citing MJME 2023/24 p.19 rule 15(e), gives three thresholds. When the exposures show the player needs a pair, the hand is unwinnable once "three or more of the needed tiles are dead on the table". A needed single is unwinnable when "all four of that tile are already used up". A needed flower pair is unwinnable when "seven flowers are visible" (https://sloperama.com/mjfaq/mjfaq19.html). The Insider's wording, "every tile needed", fits this only if it is read as every copy but one.
- **Suggested fix:** A pair is dead once 3 of its 4 copies are visible (7 of the 8 flowers for a flower pair), because jokers cannot fill pairs. A single is dead once all 4 copies are visible. Cite FAQ 19 and MJME rule 15(e), and raise the tag to [H]. Keep the Insider's point about pungs and larger groups: those require accounting for the natural tiles and all eight jokers.

### P3. Exposed jokers treated as gone in the blocked and dead check

- **File and section:** 07-app-spec 5.3 ("Live copies ... supply minus own rack, all exposures, and all discards. Live jokers likewise.").
- **Verdict:** Contradiction (with 01-rules 8).
- **Evidence:** 01-rules 8 and FAQ 19 let a player redeem exposed jokers from any rack, several in one turn, including from a dead player's rack. The Insider of July 27, 2026 says: "Unless you can account for the required natural tile and all eight Jokers, the player may still have a path to Mah Jongg" (https://mahjong.beehiiv.com/p/07-27-26-your-burning-mah-jongg-questions-answered).
- **Suggested fix:** Treat an exposed joker as obtainable by a player who holds the natural tile it stands for, or can still get one. At minimum, never declare a hand dead on the assumption that exposed jokers are unavailable.

### P4. The 2026 "defensive reading tip" is misread

- **File and section:** 03-card-2026 5 ("an opponent with two exposed pungs of the same number is probably not on an ordinary hand", [M], Sloper column 815).
- **Verdict:** Error.
- **Evidence:** Column 815 calls such exposures "a dead giveaway", because "the only hands/lines on the card that can use same-number pungs are Concealed hands" (https://sloperama.com/mahjongg/column2/column815.html). A concealed hand cannot have exposures, so no legal hand fits these exposures. FAQ 19 lists exactly this as a death ground: "Player's exposures indicate that player's hand must be concealed" (MJME 2023/24 rule 15(f)).
- **Suggested fix:** Reword: on the 2026 card, a player who exposes two pungs of the same number is dead and can be called dead. The engine catches this on its own; the coach can teach it as a defensive point.

### P5. Heavenly Hand under-sourced and its payment missing; East's Mah Jongg after the Charleston missing

- **File and section:** 01-rules 3 (Heavenly Hand, [M], sourced to Wikipedia); 01-rules 5 ("East begins by discarding one of 14 tiles"); 07-app-spec 6 (HEAVENLY_CHECK, then "East discards without drawing").
- **Verdict:** Omission. The [M] tag is also too low.
- **Evidence:**
  - Column 666 quotes the 2013 rulebook, p.12: if East "draws a Mah Jongg hand, the Charleston is waived". It also reports a 2010 letter from then-president Ruth Unger saying a Heavenly Hand is paid as self-pick, so every player pays double (https://sloperama.com/mahjongg/column2/column666.html).
  - The AMJA guide agrees: a Heavenly Hand counts as self-picked and pays double. It adds an "Earthly Hand" for East completing a hand during the Charleston: the Charleston continues, then East may declare, again paid as self-pick (https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/the-charleston/).
  - Column 534 says the dealer must discard to start play unless she can declare Mah Jongg (https://sloperama.com/mahjongg/column534a.html).
  - Sloper notes that the official rules do not say how a hand completed during the Charleston is paid (follow-up in column 666).
- **Suggested fix:** Tag the Heavenly Hand [H], citing the rulebook via column 666, and pay it as self-pick: double from all, quadruple if jokerless. Add that East may declare Mah Jongg instead of making the first discard when the 14 tiles are complete after the Charleston. Label that case's payment (self-pick, per AMJA) as a choice the NMJL has not documented.

### P6. Three dead players not covered

- **File and section:** 01-rules 11 (consequences); 07-app-spec 6 (game flow).
- **Verdict:** Omission.
- **Evidence:** Column 793 reports the January 2024 NMJL bulletin. When three players go dead, it is "recommended" that "the hand be thrown in and redealt", citing MJME 2020 p.19 rule 10(c) (https://sloperama.com/mahjongg/column2/column793.html). The AMJA rule is slightly different: the game ends with no winner and no payments, and East rotates (AMJA dead-hand page above).
- **Suggested fix:** Add the rule: when three hands are dead, the game ends and nobody pays. Choose and label the deal rule, since the NMJL says redeal and the AMJA rotates East. This matters more if bots can go dead often (see P1).

### P7. Incorrect exposures: when they kill, and what happens to the tiles

- **File and section:** 01-rules 7 (illegal exposure bullet) and 11. This bears on the free-play option in 07-app-spec 5.4 and 14.
- **Verdict:** Omission.
- **Evidence:** FAQ 19 makes three points. The death penalty for an incorrect exposure applies once the player has discarded; before that, the exposure can be fixed. When a player is called dead for an erroneous exposure, those tiles go back to the rack. Jokers exposed at the same moment the hand became dead cannot be redeemed. The AMJA dead-hand page agrees that exposures made at the moment of the challenge go back to the sloping rack, jokers included. Also, "exposure in a concealed hand" is its own ground, rule 15(f). The bullet's citation to rule 15(c) covers only the first part.
- **Suggested fix:** Add the three details and cite 15(f) separately. They matter only if free play may allow a hand-killing exposure.

### P8. Exposure lock: tag too low, and one lock point missing

- **File and section:** 01-rules 7 ("Exposures are fixed after you discard ... [M, inferred]"); 07-app-spec 5.4 ("Exposure size may change until the owner discards").
- **Verdict:** Underconfident.
- **Evidence:** Several sources state the lock outright:
  - YM Imports: a called set "cannot be changed for the rest of the game".
  - I Love Mahj knowledge base: the exposure locks once the player discards (https://ilovemahj.com/kb/67000729550).
  - AMJA: after "discarding or starting a Joker Exchange", the tile count "may not change for the rest of the game" (https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/claiming-discarded-tile-exposure/).
  - Mahj Life primer: changes are allowed until the player requests a joker exchange or discards.
- **Suggested fix:** Raise the tag to [H]. Also lock the exposure once the player starts a joker exchange; this is how AMJA and Mahj Life read the card-back rule together with the 2019 and 2026 joker-exchange rule. Note that the tile kind of an exposure can never change.

### P9. "Three single dragons" hands

- **File and section:** 03-card-2026 5 ("Three hands use three single dragons ... in Any Like Numbers, Winds-Dragons, and Singles and Pairs").
- **Verdict:** Error.
- **Evidence:** Column 815 lists the three three-dragon hands. It notes that the Winds-Dragons hand (#2) uses its dragons as two pungs and a kong. Only the Any Like Numbers hand (#2) and the Singles and Pairs hand (#1) use them as three singles (https://sloperama.com/mahjongg/column2/column815.html).
- **Suggested fix:** "Three hands use all three dragons: two as single tiles (Any Like Numbers, Singles and Pairs) and one as two pungs and a kong (Winds-Dragons)."

### P10. Spools cited in support of the section order

- **File and section:** 03-card-2026 2 (section order [H], citing Sloper, Sweet Jojo and Spools); 3 (55 lines, "also 55 in a retailer blog, Spools").
- **Verdict:** Unsupported.
- **Evidence:** Spools gives a different order, with Quints second to last and 369 before Winds-Dragons. It also says the card was released April 17, 2026 (https://spools.com/blogs/blog/how-to-read-the-2026-nmjl-card-a-players-guide-and-what-changed-this-year), but column 815 and the Insider show it arrived in March. The order in the notes is supported by Sloper's 2026 FAQ (https://sloperama.com/mjfaq/2026.html) and Sweet Jojo.
- **Suggested fix:** Drop Spools as support for the order; [H] still holds with Sloper and Sweet Jojo. Treat Spools as unreliable wherever else it is cited (the 55-line count, the note on 6s).

### P11. The 1,077 data-entry check rests on an undefined counting rule

- **File and section:** 03-card-2026 3, and 7 step 3 ("A big mismatch means a transcription or expansion error"); 07-app-spec 4.3.
- **Verdict:** Overconfident.
- **Evidence:** Missy Mahjong reports 1,077 from an EightBam developer without defining a "hand" (https://www.missymahjong.com/post/nmjl-2026-card-statistics). Gilligan says her script expands each row and "removes duplicates", but she does not say what counts as a duplicate: a relabeled suit, or a different dragon or wind choice (https://fuzzymatch.substack.com/p/i-taught-a-computer-to-play-the-2026). Mahjong Mate counts 1,059 from 55 lines.
- **Suggested fix:** First define the app's counting unit, for example distinct 14-tile sets of natural tiles after removing suit swaps. Then treat 1,077 as a soft cross-check only. The real gate is the line-by-line verification and per-line tests in steps 4 and 5.

### P12. "New to read on 2026: winds go with numbers"

- **File and section:** 03-card-2026 4.
- **Verdict:** Error (framing).
- **Evidence:** Sloper calls the pairing of East and West with even numbers, and North and South with odd ones, "the tradition on the NMJL card" (https://sloperama.com/mjfaq/2026.html). Column 815 says East and West are "traditionally associated" with evens. What is new in 2026 is an E-W hand in 2468 and an N-S hand in 13579. The winds in each hand are printed or fixed by the parenthetical, so the player never picks winds by odd or even.
- **Suggested fix:** Describe it as a long-standing card convention and a memory aid, used by two new 2026 hands. The card data should record winds exactly as printed. Tag the convention [H].

### P13. "Regrouped patterns trip up experienced players"

- **File and section:** 03-card-2026 5, carry-overs bullet ([M], Insider issues of March 30 and April 13).
- **Verdict:** Unsupported.
- **Evidence:** The Insider shows regrouping examples and warns that "Small Pattern changes can completely change the hand". But the April 13 issue says veteran players know the card "changes less than it seems" (https://mahjong.beehiiv.com/p/04-13-26-the-smart-way-to-approach-the-2026-card). Column 815 supports the regrouping itself: last year's version of the top run hand was pung-kong-pung-kong.
- **Suggested fix:** Keep the regrouping fact and cite column 815. Drop "trips up experienced players", or attribute it as opinion.

### P14. Fifth-player betting and three-player play called "not NMJL rules"

- **File and section:** 01-rules 14 (the list of table rules includes "Betting by a fifth player ('bettor'), and three-player adaptations").
- **Verdict:** Error.
- **Evidence:** Column 798 (January 29, 2024) reports that the 2023 rulebook makes betting by a fifth player an option, and cites p.25 rule 9(b) on how the bettor is paid (https://sloperama.com/mahjongg/column2/column798.html). FAQ 13a cites the official rulebook for games with other numbers of players: 2018 edition pp. 24 to 26, and the 2020 edition for the three-player deal (https://sloperama.com/mjfaq/mjfaq13a.html).
- **Suggested fix:** Move both items to a separate list of official NMJL provisions that are out of scope for a solo four-player app.

### P15. Detail on when the Charleston can be stopped, tagged [H] though sources differ

- **File and section:** 01-rules 4 ("before anyone racks the second-left tiles").
- **Verdict:** Overconfident.
- **Evidence:**
  - Mahjong Mississippi tournament rules: a player may stop if no one has racked the second-Charleston tiles.
  - The Mahjong Line: a player may stop "as long as no one has looked at the second left pass".
  - AMJA: an objection made after the tiles are viewed makes the second Charleston mandatory.
  - FAQ 28 says only that anyone may stop after the first Charleston (https://sloperama.com/mjfaq/mjfaq28.html).
- **Suggested fix:** Write "after the first Charleston, before the second Charleston's first pass is looked at (sources differ on looked at versus racked)". This does not affect the app, which holds the vote before any second-Charleston pass.

### P16. Mah Jongg in error: a newer rule, and one citation

- **File and section:** 01-rules 10.
- **Verdict:** Omission (low priority).
- **Evidence:** Column 797 reports a 2023 rulebook rule (p.21, rule 3): a player who wrongly called Mah Jongg on a discard may keep that discard as an exposure and play on (https://www.sloperama.com/mahjongg/column2/column797.html). On the citations: column 414 covers payments already made, which are not refunded. Only column 415 describes the erring player paying the survivor double.
- **Suggested fix:** Add the 2023 rule for completeness, and cite only column 415 for the double payment. Low priority, since the app blocks invalid declarations.

### P17. Picking ahead "on the card since 1956"

- **File and section:** 01-rules 5.
- **Verdict:** Error (trivial).
- **Evidence:** FAQ 19 says picking ahead has been prohibited since 1956, and that the card said "No looking ahead" as early as 1947.
- **Suggested fix:** "Picking ahead prohibited since 1956; 'no looking ahead' on the card since 1947."

### P18. Discarded jokers: how the rule is framed, and how to name the tile

- **File and section:** 01-rules 6 ("a new numbered joker rule on the back of the 2026 card"); 01-rules 8 ("name it 'joker' or name the previous discard").
- **Verdict:** Omission (minor).
- **Evidence:** FAQ 19 traces "Once a joker is discarded, it is DEAD" to the rulebook and to League newsletters from 2005 on. Only its listing as joker rule 2 on the card back is new (column 816). FAQ 19 also says naming the discard "same", "joker" or the previous tile are "All three are legal practices."
- **Suggested fix:** Say the rule is long-standing and newly printed on the card, so the build chat does not think the rule changed. Add "same" as a legal name.

### P19. 2026 flower sextet and two-flower-pung hands tagged [M]

- **File and section:** 01-rules 7 (2026 specifics); 03-card-2026 5.
- **Verdict:** Underconfident.
- **Evidence:** I Love Mahj is not the only source. Sloper's 2026 FAQ says the sextet "is unbreakable" and calls the other hand's flowers "two separate pungs, exposable at separate times". Column 815 counts two sextet hands and two hands with two flower pungs.
- **Suggested fix:** Raise to [H] and add the two Sloper citations.

### P20. "Payment rules now live only in the rulebook"

- **File and section:** 01-rules 13.
- **Verdict:** Unsupported (low priority).
- **Evidence:** Column 816 says only that the scoring section was dropped from the card back (https://sloperama.com/mahjongg/column2/column816.html).
- **Suggested fix:** Mark the second half of the sentence as an inference, or drop it.

### P21. "The usual April timing"

- **File and section:** 03-card-2026 1.
- **Verdict:** Unsupported (low priority).
- **Evidence:** Column 815 says only "almost two weeks early!". Sloper's cards FAQ says cards are "mailed out in March and April" (https://sloperama.com/mjfaq/cards.html).
- **Suggested fix:** Drop "the usual April timing", or cite the cards FAQ.

### P22. Callie's Mahjong keeping card data on the device

- **File and section:** 03-card-2026 8.
- **Verdict:** Unsupported (low priority).
- **Evidence:** The Jade Table listing says "Your patterns stay on your device" (https://mwm.ai/apps/jade-table/6762567102). The Callie's listing says only that you can photograph your card and keep it in the app (https://mwm.ai/apps/callies-mahjong/6781089384).
- **Suggested fix:** Limit the on-device claim to Jade Table.

### P23. TMBTQ described as "more cautious" than Lerner David

- **File and section:** 03-card-2026 8.
- **Verdict:** Overconfident (framing, low priority).
- **Evidence:** TMBTQ also says "lists of names/numbers and methods of game play are not copyrightable" (https://www.tmbtq.com/post/ip-and-mah-jongg/). Its caution is about copying the printed card, which Lerner David also says players generally may not do. Neither post cites a court ruling.
- **Suggested fix:** Present the two posts as broadly agreeing: the printed card is protected, and the hands, as game rules, likely are not. The recommendation in 03 section 8 still stands.

### P24. Group sizes "flowers up to 8"

- **File and section:** 07-app-spec 4.2 ("Groups: size 1 to 6 (flowers up to 8)").
- **Verdict:** Contradiction (minor).
- **Evidence:** 01-rules 7 and 8 say the largest legal group is a sextet, and that jokers fit only pungs, kongs, quints and sextets (FAQ 19; column 816).
- **Suggested fix:** Cap groups at 6, and have the validator reject anything larger.

### P25. Two small rules the engine should state

- **File and section:** 01-rules 11 and 13.
- **Verdict:** Omission (low priority).
- **Evidence:**
  - (a) A wrong death call. I Love Mahj says the challenger's own hand is declared dead (https://ilovemahj.com/american-mahjong-getting-started). AMJA says the challenger pays 50. The NMJL text in FAQ 19 is past the fetch cutoff. This matters only if the player can call bots dead.
  - (b) Whether a hand counts as jokerless. AMJA says "Payment calculation is based solely on the tiles exposed at the time of Mah Jongg declaration", so a hand whose jokers were all exchanged out counts as jokerless (https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/hand-value-and-payment/). This comes from AMJA only.
- **Suggested fix:** Add both as labeled choices, sourced to AMJA or a teaching site and not confirmed as NMJL.

## Count by verdict

- Error: 6 (P2, P4, P9, P12, P14, P17)
- Omission: 6 (P5, P6, P7, P16, P18, P25)
- Unsupported: 5 (P10, P13, P20, P21, P22)
- Contradiction: 3 (P1, P3, P24)
- Overconfident: 3 (P11, P15, P23)
- Underconfident: 2 (P8, P19)
- Total: 25

## Important claims verified as correct

- **Tiles:** 152 in all, with 8 flowers (flowers and seasons count alike) and 8 jokers. Quints need jokers except flower quints. (Sloper Shanghai guide part 1; Linda Fisher; YM Imports)
- **Seating and direction:** turns go counterclockwise (to the right) and the wall is picked clockwise. South sits to East's right. The deal passes to the right after every game, wall games included. (FAQ 19; YM; Shanghai guide part 4; AMJA game-completion page)
- **Setup and deal:** walls are 19 stacks of 2. Tiles are dealt 4 at a time until each player has 12; East ends with 14 and the others with 13. East discards first without picking. (YM; The Mahjong Line; Wikipedia; I Love Mahj)
- **Charleston:**
  - Passes go right, across, left, then optionally left, across, right, 3 tiles each.
  - Blind passing is allowed only on the first left and the last right.
  - Any one player can stop after the first Charleston.
  - The courtesy pass is 0 to 3 tiles across, using the lower of the two numbers, and still happens after a stop.
  - Jokers are never passed. A joker passed by mistake is returned (Mahjong 4 Friends, and AMJA, which says a natural is passed instead).
  - The IOU method for an all-blind pass dates from a 2020 League rule (column 534 postscript).
- **Claim window:** a discard can be claimed once it is down. The window closes when the next player racks a tile, discards, declares Mah Jongg, or starts a joker exchange (the last added in 2020). (FAQ 19; AMJA; I Love Mahj)
- **What can be claimed:**
  - Only the latest discard, and only for a pung, kong, quint or sextet, or for Mah Jongg.
  - Never for singles, pairs, NEWS or year groups, except as the Mah Jongg tile.
  - Concealed hands claim only the Mah Jongg tile.
  - Discarded jokers are never claimable, and a tile that matches an exposed joker cannot be claimed in order to redeem the joker. (FAQ 19; column 816; AMJA)
- **Claim priority:** Mah Jongg beats an exposure claim even mid-exposure (2020). Between claims of the same kind, the player next in turn wins unless the other claimant has already started exposing. (FAQ 19, citing the 2019 NMJL FAQ; AMJA)
- **Exposures:**
  - The claimed natural plus any number of jokers; no all-joker exposures.
  - On the card back, the size and tile mix can change until the player discards.
  - A redeemed joker cannot be added to the exposure just made (2019 League letter and January 2026 bulletin, per column 816).
  - Exposures are put in card order at Mah Jongg (2018 rulebook, per FAQ 19).
- **Joker exchange:**
  - Only on your own turn, with 14 tiles.
  - From any rack, including your own, several per turn; concealed hands may exchange.
  - Exchanging without 14 tiles is a death ground (2020 newsletter and MJME rule 15(b) per FAQ 19; Mahj Life). FAQ 19 is a better citation than column 797, which covers only "out of turn".
  - If a wrong tile is handed over and not caught before the redeemer discards, the owner of the exposure is dead, not the redeemer (FAQ 19; League bulletin per column 793).
  - A Mah Jongg made by joker exchange scores as self-pick (Shanghai guide part 3; AMJA payment page; JCC St. Louis).
- **Payment:**
  - On a discard win, the discarder pays double and the others single. On a self-pick, all pay double.
  - Jokerless doubles again: the discarder pays 4x and others 2x, or all pay 4x on a self-pick.
  - The jokerless bonus does not apply to Singles and Pairs (FAQ 19; YM; AMJA; Shanghai guide part 4) or to Quints (FAQ 19).
  - A jokerless win must be announced (January 2014 newsletter).
  - A wall game pays nothing. A dead player stops play but still pays the winner, and their properly exposed jokers stay redeemable.
  - Throwing into 2 or 3 exposures carries no NMJL penalty, though some tournaments penalize it. Hot wall and cold wall are table rules.
- **2026 card back changes** (column 816, March 29, 2026): the claiming rule moved to the top and now bars singles and pairs groupings except for Mah Jongg; a "discarded joker is dead" rule was added; sextets were added to where jokers may be used; the misnamed-tile and dead-hand sections were merged; the scoring section was dropped. The exposure-change sentence is unchanged from 2025.
- **2026 card facts:**
  - Prices: $14 standard, $15 large print. *Mah Jongg Made Easy* is $13, "Revised for 2024". NMJL Online requires owning the card plus a paid subscription. (NMJL store)
  - Section order as listed in the notes (Sloper 2026 FAQ; Sweet Jojo), with the same sections as 2025 (Insider, March 30). The 2025 card dropped the dedicated Addition and Multiplication sections (I Love Mahj).
  - Values run from 25 to 75, with the Mahj Life breakdown. There were no 35s in 2025, and 2024 did have 35-point hands, so "35 is back" holds (I Love Mahj 2024 and 2025 analyses).
  - Reported hand counts: 55 lines and 1,059 hands (Mahjong Mate); 65 lines and 1,077 (Gilligan); 72 entries (EightBam); 1,077 by section (Missy Mahjong); 71 to 72 (Mahj Life). For 2025: 71 lines and 1,002 hands.
  - Card reading: colors give the number of suits, not which suits. Parentheticals override colors. Soap is the only zero. Dragons go Red with Craks, Green with Bams, White with Dots. Consecutive runs go up in the order shown. In the floating-pair hands, the kongs match the pair's number. (Sloper 2026 FAQ)
  - Flowers: two sextet hands, two hands with two flower pungs, no flower kongs, and nine hands needing three or more flowers. The most common shape is pung-pung-kong-kong (9 hands). Five hands carry over from 2025. (Column 815; Mahj Life)
  - Arrival: column 815 is dated March 22, 2026 and says "almost two weeks early". The Insider reported cards in mailboxes on March 23.
  - The 2025 card was reprinted over color errors on two lines (column 812). Counterfeit cards are sold on Amazon and Temu (Sloper cards FAQ) and eBay (I Love Mahj).
- **Simulation figures:** all of Gilligan's figures match her article: 6,000 games, about 7 tiles away at the start, Consecutive Run about 30%, Quints 12 of 5,328, about 67% of wins on discards, 11.2% wall games, about 67 discards, East 24.5%, jokerless about 3%, and her finding on committing too early. EightBam's figures also match: 10 million games, no bot strategy, both paths explored on callable discards, Runs 46.9% against Quints 0.04%.
- **Copyright posts:** Lerner David (July 2026, a summer associate's post, relying on 17 U.S.C. 102(b)) and TMBTQ (May 2025, registrations back to 1982, photocopying a card is "technically infringement") are summarized accurately. P23 concerns only how the two are contrasted.

**General note:** several [H] items in 01-rules cite only FAQ 19, although the file's own definition of [H] asks for an independent teaching source too. That independent support exists, so the tags are fine, but the citations should be added. Examples: the AMJA claim page for the claim window and priority, and the I Love Mahj guide for the window and courtesy pass.
