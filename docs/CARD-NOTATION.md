# Card Notation (how card lines are typed into the app)

Each printed card line becomes one text line. The app turns it into data, checks it, and lists every
concrete hand it allows. `npm run card` prints a report with one example hand per line to compare
against the card photo (docs/03-card-2026.md, section 7, step 4).

## Line format

```
section | value | X or C | pattern | or: pattern | opt: options | note: small print | id: ID
```

- **section**: the card section, exactly as printed (for example `2468`, `Consecutive Run`).
- **value**: the point value printed on the line.
- **X or C**: X = exposures allowed, C = concealed.
- **pattern**: the tiles, typed as described below.
- **or:** another layout of the same line (the card's "-or-"). Repeat for more layouts.
- **opt:** options that say what the small print allows (list below).
- **note:** the small print in plain words, shown to the player.
- **id:** optional. Without it, the id is the section plus the line number, like `2468-3`.

Lines starting with `#` are comments (a `#` later in a line, as in "run #2", is ordinary text). The file
starts with header lines:

```
card: nmjl-2026
name: NMJL 2026 Card
year: 2026
source: user-supplied
```

## Pattern words

Words are separated by spaces, exactly as the card separates its groups.

| Symbol | Meaning |
|---|---|
| `1` to `9` | number tiles; each needs an ink color |
| `0` | Soap used as zero (color ignored) |
| `F` | Flower |
| `N` `E` `W` `S` | winds (color ignored) |
| `D` | Dragon; needs an ink color |
| `{x}`, `{x+1}`, `{y-2}` | a number variable (the "escape hatch" for anything the options can't say) |

**Ink colors**: `g` (green), `r` (red), `b` (blue). Type the color the card prints. Colors stand for
suits *relatively*: same color = same suit, different colors = different suits. The player chooses the
actual suits. Suitless tiles (flowers, winds, zeros) are printed in blue on the card; their color is ignored.

**One color for the whole word**: a color letter after the last tile colors the whole word (`2026g`).
**Mixed colors**: put a color after each tile (`DgDrDb` = three dragons, each in a different suit).

**Groups versus singles**: a word whose tiles are all identical is one group (`1111g` is a kong, `FF` is
a pair). Otherwise every tile in the word is a single tile (`2026g`, `NEWS`, `123g`). Singles and pairs
never take jokers; groups of 3 to 6 do.

**Dragons**: a `D` takes the suit of its color. In the same color as numbers it is the matching dragon
(Bams-Green, Craks-Red, Dots-Soap); in a color no numbers use, it is a dragon of a different suit.

## Options (`opt:`)

| Option | Meaning |
|---|---|
| `slide` | all numbers shift together by any amount that keeps them between 1 and 9 ("any consecutive", "any like numbers") |
| `slide2` | shift by even amounts only (odds stay odd, evens stay even) |
| `lowest=1,3,5` | the lowest number in the line may only be these (implies slide) |
| `x=1-9`, `x=1,3,5` | allowed values for a `{x}` variable (default 1 to 9) |
| `numfree=y` | variable `y` may equal other variables (default: different number symbols never become the same tile, so `{x}` and `{y+1}` in one suit can't both be 5s) |
| `free=r` | the red-ink suit may be the same as another suit (default: different colors, different suits) |
| `differ=r:g` | with `free`, still require these two suits to differ |
| `dragon=any` | dragons are not tied to number suits: same color = same dragon, different colors = different dragons |
| `dragon=literal` | the D's color names the dragon itself: r = Red, g = Green, b = Soap |
| `dragon=matching` / `dragon=opposite` | a check: the compiler confirms the dragon colors match (or differ from) the numbers' colors |
| `wind=any` | winds are not fixed: same letter = same wind, different letters = different winds |
| `bonus=no` / `bonus=yes` | override the jokerless bonus (default: none for Singles and Pairs or Quints) |
| `jokers=never` | no jokers anywhere in this line (concealed lines only; no NMJL line needs it) |

## Examples (from the invented practice card)

```
2026            | 30 | X | FF 2026g 2222r 6666b     | note: The year in one suit; kongs of 2s and 6s in the other two suits.
Any Like Numbers| 25 | X | FFFF 111g 111r 1111b     | opt: slide
Consecutive Run | 30 | X | 111g 2222g 333g DDDDg    | opt: slide dragon=matching
Winds-Dragons   | 30 | X | NEWS DDDDr DDDDg FF      | opt: dragon=literal
```

More features (tested in test/card.test.ts):

```
Test | 25 | X | FF 1111g 2222g 3333g | or: FF 1111g 2222r 3333g      (two layouts)
Test | 25 | X | FFFFFF 1111g 1111r | opt: slide                       (flower sextet)
Test | 25 | X | FFF FFF 22g 4444g 66g                                (two separate flower pungs)
Test | 25 | X | DgDrDb 111g 222r 333b FF                            (all three dragons as singles)
Test | 25 | X | 111g 333g 5555g 7777g | opt: slide2                  (1357 or 3579)
Test | 25 | X | {x}{x}{x}g {y}{y}{y}{y}g FFFF NNN | opt: x=1,3 y=3-4 (restricted numbers)
```

## What the checker catches

- A layout that doesn't add up to 14 tiles ("adds up to 13 tiles").
- A group bigger than a sextet, a missing ink color, an unknown symbol, a bad X/C or value.
- Two lines with the same id.
- A line no set of 152 tiles can make (for example five natural Soaps); suit choices that are impossible
  are dropped and counted, and a line with no possible version is an error.
- Dragon colors that contradict `dragon=matching` or `dragon=opposite`.

## Entering the 2026 card (plan)

1. Photograph the card (front and back) and send the photos.
2. Each printed line becomes one line here; the parenthetical small print becomes `opt:` and `note:`.
3. Run `npm run card` and compare each line's example hand with the photo.
4. The total number of concrete hands is a soft cross-check (sources report about 1,077 for 2026); the
   line-by-line comparison is the real check.
5. Floating pairs ("any one of the numbers can be the pair") can be entered as `or:` layouts; if that
   proves too verbose, a dedicated option will be added then.
