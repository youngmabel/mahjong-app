# HANDOFF: Start Building the Mah Jongg App

**How to use:** open a new chat that is linked to this computer (with the MAHJONG folder connected), then paste everything inside the box below. If the new chat can't see the folder, attach the files instead.

```text
I'm building a personal app (never commercial) for learning and practicing American mah jongg (National Mah Jongg League rules) solo against three computer opponents, using the 2026 NMJL card and a 152-tile set with no blanks. A previous chat finished the research phase. Your job in this chat is to start building the app.

READ FIRST, from my MAHJONG folder (/Users/youngmabel/Documents/MAHJONG):
1. README.md: overview, decisions, open items
2. 07-app-spec.md: the build spec (platform, data formats, algorithms, computer opponents, tests, build order)
3. 01-rules.md: the rules the engine must implement
4. 05-teaching-plan.md: tutorial lessons, guided matches, graduation
Then skim 03-card-2026.md, 04-strategy.md, 02-tiles-and-terms.md, 06-existing-apps.md and 08-design-ideas.md. The research/ subfolder has the full research notes if you need more detail. If you can't reach the folder, tell me and I'll link the chat or attach the files.

THE VISION
- Tutorial: short guided scenarios that teach how the game works at its most basic level and what each piece is called (with a short "why it's called that" when interesting), across several rounds with different teaching points.
- Then 1 to 3 guided practice matches that suggest target hands, help me keep track of the rules, and teach strategy along the way.
- Then I "graduate" to free play against generated games with nothing but a cheat sheet of the winning hands.

DECISIONS ALREADY MADE
- Standard NMJL rules, no house rules, no blank tiles.
- Our own tile art and our own card layout. Don't imitate the printed card's design.
- The real 2026 hands will be entered from photos of my own card into a data file that ships with the app. The hands themselves are unprotectable game rules (I'm an attorney; that's settled for this personal, non-commercial app), so the card data needs no special handling. My card hasn't arrived yet, so build and test everything with the invented practice card in 07-app-spec.md section 13 first. When I send card photos, follow 03-card-2026.md section 7.
- Recommended stack: a TypeScript game engine with no screen code in it, Vite, Vitest, and SVG tiles. Engine and tests first, visuals later.

WHAT I WANT FROM YOU IN THIS CHAT
1. Read the notes. Then give me a short plan for the first milestone (07-app-spec.md section 12, steps 1 to 3: tiles, seeded random numbers, the card compiler and validator, the practice card, the matcher, the game engine with computer opponents, and tests). Ask me to decide the open questions in 07-app-spec.md section 14 (for example: a private Claude artifact or a Home Screen web app, and where the code lives), and recommend an answer for each.
2. After I approve, build it. Keep the source in my MAHJONG folder (for example MAHJONG/app/) unless we agree on a private GitHub repository.
3. Show me it works: unit tests, the brute-force check of the matcher, and computer-only simulated games that confirm all 152 tiles are always accounted for.
4. Before the chat ends, write or update STATUS.md in the MAHJONG folder (what's done, what's next, decisions made) and give me a paste-ready prompt for the next chat.

GROUND RULES
- I'm not an experienced programmer. Make the technical calls yourself and explain them in plain words.
- Take rules from 01-rules.md (and the NMJL rulebook "Mah Jongg Made Easy" if I buy it). Don't invent rules. Where the notes mark something as medium or low confidence, flag it to me rather than guessing.
- The engine is the referee: prevent illegal moves and explain them in a sentence or two.
```
