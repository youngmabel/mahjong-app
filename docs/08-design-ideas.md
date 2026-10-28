# 08. Design Ideas: Our Own Tiles and Card Layout

Ideas for original tile art and an original card (cheat sheet) design. The goal is art that is clearly ours yet instantly recognizable to someone who later sits down with a physical set, and a card display that teaches better than the printed card while never imitating its look. What traditional tiles look like, tile by tile, is in 02-tiles-and-terms, section 4.

---

## 1. Design goals

1. **Recognizable**: keep each tile's traditional "anchor" (the feature players use to identify it), so skills transfer to real tiles.
2. **Readable on an iPhone**: tiles may be as small as about 26 points wide in portrait; identification must not depend on fine detail.
3. **Color-blind safe**: never rely on red versus green alone. Every tile carries a shape cue and a text index too.
4. **Teaching-friendly**: the design itself should reinforce lessons (suits, dragon-suit links, flowers being interchangeable, jokers standing out).
5. **Original**: our own drawings, palette, and layout. Don't trace a commercial set, and don't imitate the NMJL card's layout, typography, or color scheme.

## 2. Tile art principles

- **Keep the anchors** (details in 02-tiles-and-terms): bamboo sticks on Bams with a bird on the 1 Bam; a Chinese numeral over the red 萬 character on Craks; circle arrangements on Dots; 中 on the Red Dragon and 發 on the Green Dragon; a framed face for the White Dragon (Soap); flower or season art on Flowers; a bold JOKER on jokers.
- **Add big corner indices**, as many American sets do: the Arabic numeral and a suit letter on suit tiles (for example "5" with a small "D" or a dot icon), N/E/W/S on winds, R/G/0 on dragons, F on flowers. Offer a "big numbers" setting (the official NMJL Online app has one).
- **Tie each dragon to its suit visually.** A suggested teaching palette: Bams and the Green Dragon share a green accent; Craks and the Red Dragon share a red accent; Dots and Soap share a blue accent. Players will then see "Red goes with Craks, Green with Bams, Soap with Dots" every time they look at a rack. (Real sets often mix colors on Dots; this is a deliberate teaching choice.)
- **Make red and green distinguishable without color**: the dragons already differ by character shape (中 versus 發) and index letter (R versus G). Give the Bam and Crak motifs clearly different silhouettes too (vertical sticks versus a character).
- **Jokers must pop**: a distinct background or border treatment no other tile uses, so a learner can count jokers at a glance.
- **Flowers**: eight different small illustrations, all with the same "F" index, which quietly teaches that all eight are interchangeable.
- **Soap as zero**: in year groups, show Soap with its "0" index emphasized, tying back to the lesson that Soap doubles as zero.
- **Tile back**: one simple original pattern.

**Three style directions to choose from** (pick one, or mix):

| Direction | Look | Strength | Risk |
|---|---|---|---|
| Classic | Ivory tiles, traditional engraved-style faces, refined colors | Most like the sets you'll play with in person | Busier at small sizes |
| Clean | Flat tiles, simplified motifs, large numerals, generous spacing | Best readability on a phone | Must keep enough of each anchor to stay recognizable |
| Playful | Rounded shapes, friendly palette, an original bird character for the 1 Bam, illustrated flowers | Warm and inviting for learning | Can feel less like the real game |

**Learning overlay**: in the tutorial, show each tile's name under it ("3 Bam," "Soap," "North"). Fade the labels out as the player progresses, in step with the coach's hints, with a setting to bring them back.

## 3. Card (cheat sheet) design

The printed card shows each hand as colored digits and letters. That notation is the single hardest thing for beginners (05-teaching-plan), and the printed look belongs to the NMJL. So the app's card should be our own layout, built for learning:

- **Each line as mini tiles**, grouped with clear gaps between groups (pair, pung, kong), instead of colored digits.
- **Suits shown with neutral badges, not colors**: a letter plus a shape (for example A in a circle, B in a triangle, C in a square) in neutral tones, so nobody reads a color as a suit. The Mahjong Line made the same choice for its own card: colors that don't suggest suits and avoid red-green confusion.
- **Plain-English note line** for the small print ("Any one suit. Any three consecutive numbers. Dragon must match the suit.").
- **Clear tags**: "Open" or "Concealed" (X or C) and the point value.
- **One concrete example** per line ("for example: 3, 4, 5 of Bams with Green Dragons").
- **Sections as tabs** with search and filters.
- **Guided modes**: sort by "closest to my hand" with tiles-away counts that use only live tiles, plus a one-line reason. Free play hides these unless hints are turned on.
- **The pinned line sits next to the rack** with matched tiles highlighted, so the player never flips between screens.
- **Bridge to the paper card**: lesson C1 and the "Meet the 2026 card" lesson show how the app's A/B/C badges correspond to the colors on your printed card.

## 4. Table layout

- **iPhone landscape (main play view)**: your rack along the bottom at full size; your exposures just above it; each opponent's exposures at their seat; the discard area in the center with the newest discard highlighted and named; an action bar (Call, Pass, Mah Jongg, Exchange Joker, Sort); a collapsible coach panel that never covers the rack.
- **Portrait**: a two-row rack, or a prompt to rotate for play. Tutorials can run in portrait.
- **Input**: tap to select, then a Discard button (no drag-only actions, which cause accidental discards in other apps). Joker exchange gets its own clearly visible button that lights up when an exchange is possible; other apps' hidden joker swaps are a top complaint.
- **Auto-sort** the rack by suit and number by default, jokers grouped at the end, with manual rearranging allowed.
- **Tile magnifier**: press and hold any tile on the table to enlarge it.

## 5. Words on screen

- One or two sentences per message, plain English, patient tone.
- Every blocked move says why, citing the rule's source when useful (for example "Jokers can't be used in a pair. (Back of the card, jokers rules)").
- Rules are stated as facts; hand advice is phrased as a suggestion.
- Discards are named in text as they happen ("East discards 5 Dot"), which drills tile names the way players do at a real table.

## 6. Accessibility and comfort

- High-contrast mode and big-number tiles.
- VoiceOver labels on every tile ("Five Dot," "Red Dragon," "Joker").
- Reduce-motion setting for animations.
- Large tap targets (about 44 points where possible).
- Optional sounds (tile click, spoken discard names) off by default.

---

### Sources

- What players complain about and praise in existing apps: 06-existing-apps.md and `research/apps.md`.
- Split attention and color-blind guidance: 05-teaching-plan.md and `research/teaching.md` (including [The Mahjong Line's Big Card FAQ](https://themahjongline.com/pages/the-big-card-faq)).
- iPhone sizing: [Apple Human Interface Guidelines, Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility); tile art options: `research/tech-prior-art.md`, section 6.2.
