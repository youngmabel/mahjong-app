# 06. Existing Apps: What to Borrow, What's Missing, Licensing

A survey of American mah jongg apps and sites as of October 26, 2026, to decide what this app should copy, improve on, and avoid. Based on store listings, developer help pages, the official NMJL Online FAQ, and visible reviews; no app was installed or played. Full survey with every source: `research/apps.md`. Confidence tags: [H] high, [M] medium, [L] low.

---

## 1. Bottom line

1. **The field is crowded and young.** Long-running options: Real Mah Jongg (2017), Eight Bam's American Mahjong Practice (2019), I Love Mahj (2020), Mahjong 4 Friends (2021). At least a dozen more launched in 2026, many aimed at beginners. [H]
2. **The official app doesn't show the card.** NMJL Online (built by Quicksilver Software, designed by the League with Tom Sloper on the team) needs a subscription plus your physical card; its FAQ says "There is no in-game card visible to players." [H]
3. **"Suggested hands" is standard**, but these lists rank by tile overlap, usually ignore tiles already discarded, and say what to aim for, never why. [H]
4. **The gap this app fills:** no app combines scripted lessons, guided matches that explain strategy, and a planned fading of help into free play. [M] (based on listings, not hands-on testing)

## 2. The main options (condensed)

| App | Platforms and price | Card | Learning features worth noting |
|---|---|---|---|
| **NMJL Online** (official) | Web, iPhone, iPad, Mac; $4.99/mo or about $50/yr plus the $14 card | Official; never shown in game | 4 short tutorials (Welcome; How to Play; The Charleston and the Card; Death Challenges); **Safety ON/OFF** switch; 7 bot personalities; tile magnifier; big-number tiles and high-contrast schemes. iOS rating 1.8 from 4 reviews (landscape-locked, hard to exit, login trouble) |
| **Real Mah Jongg** | Web, iOS, Android, Windows; about $6 to $7/mo | Says "the official card"; no license statement | Hand Suggestions; social tables. A forum user: good for practice, doesn't teach |
| **Mahjong 4 Friends** | Web, iOS, Android, Windows; free with ads | NMJL 2026 built in; no license statement | Suggested hands (its docs admit they ignore discards); opponent-exposure analysis; Charleston instruction bubbles; undo ("Revert" and "History"); one switch disables all hints. iOS 4.9 (about 26K) |
| **I Love Mahj** | Browser; $6/mo or $60/yr | NMJL 2019 to 2026 plus its own free card; calls the NMJL card "copyrighted material" | Practice Mode with Level 1 bots; Exercise Room drills (make a hand; name a hand from a few tiles; deduce a hand from exposures); cheat sheet; stats |
| **American Mahjong Practice** (Eight Bam) | iOS, Mac, Android; $17.99 for 2026 hands or $3.99/mo | Hands built in, sold per year | Bots that **never declare Mah Jongg by default** (turn on "bots that win" for defense practice); section filters; Replay and Undo; shows bots' hands after the game; iOS 4.9 (about 20K) |
| **Mahj Parlour** (2026) | iOS; $6.99/mo or $49.99/yr | "An official NMJL card is required to play" | 12 free lessons; pin a suggested hand above the rack (even during the Charleston); bots' hands revealed after practice games |
| **Bam Good Time** (2026) | iOS, Mac; free | 2025 and 2026 hands built in | Banners explaining **why a call is blocked**; joker-swap cue; warning before spending jokers |
| **The Mahj Index** (2026) | iOS | Drills use the current card | **Guided mode** (highlights lines) and **Classic mode** (no help): the nearest thing to "graduation" |
| **Mahjong Mate** | iOS; about $3/yr | 2026 lines built in | Rates lines by the odds of drawing what you still need: a rare availability-aware "tiles away" |
| **Jade Table** (2026) | iOS | You photograph your card; data stays on the device | Odds calculator, dead-hand detector, post-game analysis, replay viewer |

Learning-only tools: JokerTile.com (free drills where every answer cites its rule), The Order of the Tile (daily puzzles and Charleston trainers), Mahjong Card Guide (explains notation without listing hands), Eight Bam's Defense app (guess a hand from exposures), mahjongg.ai.studio (Charleston assistant; operator unknown, low confidence).

## 3. Interface conventions the field has settled on

- **Suggested hands panel**: ranked closest lines with tiles-away count; pinning a target above the rack (Mahj Parlour, Maylee); concealed marker and value (Bam Good Time); section filters (Eight Bam).
- **Rule enforcement**: NMJL Online's **Safety ON** lights Call and Mahj only when legal; **Safety OFF** lets you make mistakes and be penalized ("We learn by making mistakes"). Apps that **explain** why a move is blocked get praised in reviews.
- **Calls**: legal-only Call button (NMJL Online); a "placemat" plus Proceed button (Mahjong 4 Friends). Reviewers dislike constant pauses and call windows that are too short or cover the rack.
- **Charleston**: tap tiles to raise them, then Pass; instruction bubbles each round; the game fills in the rest of a blind pass.
- **Rack**: auto-sort by suit and number by default, with manual sorting allowed.
- **Undo and review**: Replay/Undo (Eight Bam), Revert/History (Mahjong 4 Friends), bots' hands revealed after the game, post-game analysis (Jade Table).
- **Bots**: personalities with names that cue strength (NMJL Online's Beginner bots are Betty, Bianca, Barbara; Advanced are Alice, Angie, Andy), or numeric levels.
- **Accessibility**: big-number tiles, high contrast, a magnifier, large tiles.

## 4. What users praise and complain about

**Praise** [M]: suggested hands with tile counts and seeing the card on screen; being told why a move is blocked; patient, always-available practice; offline play.

**Complaints** [M to H]:

- Bots that seem unrealistic or unfair ("the computer wins almost every game"; endless wall games). I Love Mahj answers this with math: against three bots with about 10% wall games, an equally skilled player should win about 22.5% of games.
- Silent blocks: the official FAQ needed threads titled "Why wouldn't the computer let me win?" and "...let me call a discard?"
- Hidden controls, especially the joker swap.
- Tiny tiles and buttons on phones; accidental discards; overlays covering the rack.
- Needing the physical card at hand.
- Suggestions that ignore discarded tiles.
- Bugs at the moment of declaring Mah Jongg (false "joker violation" errors and the like), the most damaging bug for a learner.

**What confuses beginners**: card colors, using a joker as a single or pair, exposing a concealed hand (the official FAQ's top reasons a win is blocked); confusing 2026 lines (I Love Mahj keeps a clarification page); wrong card year selected; counterfeit cards with wrong hands sold on Amazon, Temu, and eBay; error-ridden beginner books (Sloper names *Mah Jongg Made Easy* as the primary rules source). [H]

## 5. Gaps this app can fill

1. A structured path from scripted scenarios, to guided matches that coach strategy, to unaided play. (The nearest pieces are scattered across I Love Mahj, The Mahj Index, and NMJL Online's Safety switch.)
2. Hints that explain **why**, count only live tiles, and cover the Charleston and defense, inside the game rather than in separate tools.
3. Every blocked move explained in a sentence.
4. Bots that teach: narrate decisions in early matches, reveal their hands afterward, and feel fair.
5. Card-notation drills on the live card during guided play.
6. Short "why it's called that" notes tied to the tiles (none seen elsewhere). [L]
7. Phone-friendly layout with large targets and nothing covering the rack.
8. Rule explanations that cite their source (the card or *Mah Jongg Made Easy*).

## 6. Licensing and the NMJL card (facts, not a legal conclusion)

**What the NMJL says publicly** [H]:

- Website footer "© THE NATIONAL MAH JONGG LEAGUE, INC."; site terms grant limited permission for personal use and require written authorization to copy or distribute any part. No card-specific reproduction policy was found.
- Online subscriptions are listed "CARD REQUIRED: (not included)."
- Official NMJL Online FAQ (October 17, 2026): no in-game card; use only authentic League cards; beware counterfeits.

**Enforcement**: no public report of the NMJL acting against any app or website (no cease and desist letters, takedowns, or lawsuits found). [M: Reddit was blocked and no court dockets or takedown databases were searched, so absence of reports is not proof]

**Legal commentary** (law-firm blog posts, not case law) [M]:

- [Lerner David, July 30, 2026](https://www.lernerdavid.com/news-successes/unscripted/copyright-issues-in-america-s-fast-growing-mah-jongg-craze): the winning hands are uncopyrightable rules under 17 U.S.C. 102(b); the protectable part is the card's layout, typography, colors, and formatting.
- [TMBTQ, May 14, 2025](https://www.tmbtq.com/post/ip-and-mah-jongg/): broadly agrees that "lists of names/numbers and methods of game play are not copyrightable" while the printed card is. It found NMJL copyright registrations in the Copyright Office database (including the 2025 card, with records back to 1982), says photocopying a card even for a friend is technically infringing, notes registration makes statutory damages available, and warns that lookalike cards with minor layout changes may still draw claims.
- Neither cites a court ruling on the card, and neither addresses apps or private transcription for personal use.

**How apps handle the card** (observed practice): (1) official, no display; (2) require your own card and show only suggestions; (3) **you enter or photograph your own card** (Jade Table, which says the patterns stay on your device; Callie's Mahjong lets you photograph and store your card in the app); (4) original cards with a non-affiliation statement; (5) built-in current-year hands with no stated license (Eight Bam, Mahjong 4 Friends, and others, some for years).

**For this app**: the hands are unprotectable game rules (your settled position as an attorney), so the card data needs no special handling. The app enters the hands from your genuine card for accuracy and shows them in its own design.

## 7. Borrow and avoid

**Borrow**:

- Strict-but-explained enforcement, with a **practice switch** like Safety ON/OFF: ON blocks illegal moves with an explanation; OFF lets you make the mistake and then explains what happened. (The official app lets you err but doesn't coach afterward.)
- A suggested-hands panel with tiles-away, pinning, concealed marker, and value, improved by counting only live tiles and giving a one-line reason for each suggestion.
- Bots that never declare Mah Jongg in the earliest practice (Eight Bam's default), then normal bots; persona names that cue strength; reveal bots' hands after each game, plus a short post-hand review.
- Undo and replay in guided matches.
- Proven drill formats: build a given hand; name a hand from a few tiles; guess a hand from exposures; find the missing tile; choose Charleston passes.
- Win-rate context so losses feel fair (about 22% wins is par against three equal bots).
- Accessibility: big-number tiles, high contrast, a magnifier, large tap targets, portrait support.
- Rule explanations that cite their source.

**Avoid**: hidden joker swaps; constant Proceed or pause prompts in solo play; overlays covering the rack; suggestions that ignore dead tiles; bots that feel scripted or all-seeing; landscape lock and other basic usability faults.

---

### Sources

Full survey with 86 inline sources: `research/apps.md`. Key sources: [NMJL Online App Store listing](https://apps.apple.com/us/app/nmjl-online/id6476651173); NMJL Online FAQ threads on [the card](https://faqs.nmjlonline.com/forums/showthread.php?tid=145), [Safety](https://faqs.nmjlonline.com/forums/showthread.php?tid=89), [bot types](https://faqs.nmjlonline.com/forums/showthread.php?tid=98), and [tutorials](https://faqs.nmjlonline.com/forums/showthread.php?tid=88); [NMJL store](https://nationalmahjonggleague.org/store.aspx); [NMJL terms](https://nationalmahjonggleague.org/terms_and_privacy.aspx); [Mahjong 4 Friends documentation](https://mahjong4friends.com/pages/faqs/full_documentation.html); [I Love Mahj Learn page](https://ilovemahj.com/learn-american-mah-jongg) and [win-rate article](https://ilovemahj.com/kb/67000755046); [Eight Bam listing](https://apps.apple.com/app/id1458051621); [Mahj Parlour listing](https://apps.apple.com/us/app/id6761298326); [Bam Good Time listing](https://apps.apple.com/us/app/bam-good-time-mahjong-online/id6759616156); [Mahjong Mate listing](https://apps.apple.com/app/id6478509695); [Sloper column 813](https://sloperama.com/mahjongg/column2/column813.html); [Sloper cards FAQ](https://sloperama.com/mjfaq/cards.html); [Lerner David](https://www.lernerdavid.com/news-successes/unscripted/copyright-issues-in-america-s-fast-growing-mah-jongg-craze); [TMBTQ](https://www.tmbtq.com/post/ip-and-mah-jongg/).
