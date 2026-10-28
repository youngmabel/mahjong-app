# American Mah Jongg: Tiles, Terms, and History

> **Note added after the independent fact check (research/factcheck.md):** where this file and the main notes (01 to 08) differ, the main notes carry the corrected version.

Research notes for the app's tutorial ("what it's called and why") and for designing custom tile art. Compiled October 26, 2026. Scope: the standard 152-tile National Mah Jongg League (NMJL) set without blanks, played on the 2026 card. No hands from any NMJL card are reproduced here.

**Confidence labels.** High: two or more independent, reputable sources agree, or a primary source states it. Medium: one reputable source, or several weaker sources that agree. Low: a single weak source, an unverified popular story, or my own inference. **Folk** marks a popular explanation that has no documentary support.

**About the sources.** The NMJL's website has very little rules or history text online (its FAQ page says it is under construction), and the League's rulebook and card are print products. League rules are therefore cited through Tom Sloper's sloperama.com FAQs and columns, the standard English-language reference, which track the card year by year. History draws on the historian Annelise Heinz (University of Oregon; her book *Mahjong: A Chinese Game and the Making of Modern American Culture* came out from Oxford University Press in 2021), cited here through a book excerpt and a 2026 interview, and on the tile-set historians Michael Stanwick and Hongbing Xu, plus the Macau historian Tam Sai-po. Collector blogs, retailers, and newsletters appear only as supporting or weak sources and are labeled that way. The web search budget ran out midway, so the last checks used only pages already found (see Section 10).

---

## Quick reference: one-liners safe to use in the tutorial

The wording below is pitched to match the confidence of the evidence.

| Item | Suggested one-liner | Confidence |
|---|---|---|
| Bams | Short for "bamboo." The sticks started out as strings of coins, and Western players read them as bamboo. | High (strings); Medium (who named it) |
| 1 Bam | The 1 Bam is a bird. Early sets drew it as a single string of coins, and artists gradually turned it into a bird. | High |
| Craks | Short for "characters." The red character 萬 (wàn) means ten thousand, and the character above it gives the number. | High |
| Dots | Each circle is a coin. The three suits come from old Chinese money cards: coins, strings of coins, and big sums. | High |
| Winds | The four directions. The card lists them as N, E, W, S ("NEWS"). | High |
| Red Dragon | 中 (zhōng) means "center." | High |
| Green Dragon | 發 (fā), as in 發財 (fācái), "to get rich." | High |
| Soap | The White Dragon's plain face reminded American players of a bar of soap. On the card, Soap also stands for zero. | Medium-High (name); High (zero rule) |
| Flowers | In American play, any flower counts the same as any other. | High |
| Jokers | Wild tiles the NMJL added in 1961. Modern sets have eight. | High |
| Charleston | Probably named after the 1920s dance, though nobody has documented where the name came from. | Low |
| Mah Jongg | Joseph Babcock's 1920s trademark spelling of a Chinese name connected with the word for "sparrow." | Medium |
| Pung, Kong | From the Chinese calls 碰 (pèng) and 槓 (gàng). | High (pung); Medium (kong) |

---

## 1. Tile inventory: the 152-tile NMJL set, no blanks

| Group | Tiles | Copies of each | Total |
|---|---|---|---|
| Bams (Bamboos) | 1 to 9 | 4 | 36 |
| Craks (Characters) | 1 to 9 | 4 | 36 |
| Dots (Circles) | 1 to 9 | 4 | 36 |
| Winds | North, East, West, South | 4 | 16 |
| Dragons | Red, Green, White (Soap) | 4 | 12 |
| Flowers | 8 tiles that all count as the same tile in American play | 8 | 8 |
| Jokers | 1 type | 8 | 8 |
| **Total** | | | **152** |

- **The total checks out.** 108 + 16 + 12 + 8 + 8 = 152. Put another way, it is the Chinese 144-tile set (136 suit and honor tiles plus 8 flower and season tiles) with 8 jokers added ([Sloper FAQ 7b][sl7b]; [I Love Mahj][ilm-tiles]; [Wikipedia: American mahjong][wp-am]). **Confidence: High** (several sources agree, and the arithmetic holds).
- **The wall.** With 152 tiles, each player's wall is 19 stacks long and two tiles high, and 4 x 19 x 2 = 152 ([Sloper, Shanghai manual: basics][slbasic]; [Oh My Mahjong][omm-pregame]).
- **Distinct tiles for game logic.** The game engine needs 36 tile identities: 27 suit tiles, 4 winds, 3 dragons, 1 flower identity, and 1 joker. That is my own arithmetic from the inventory. The art can still draw up to eight different flower faces.
- **Retail spares.** Sets sold in stores often add spare blanks, jokers, or flowers. One retail manual lists 160 tiles, of which 152 are used and the rest (6 blanks and 2 extra jokers) are spares ([Cirquejong manual][cirque]). Sloper notes that manufacturers and earlier owners add extra tiles ([Sloper FAQ 7b][sl7b]). The app leaves out blanks, so the blank-swap house rule never comes up.
- **Spotting an American set.** Sloper's rule of thumb is that a set with more than four tiles reading "Joker" in English is an American set ([Sloper FAQ 7b][sl7b]).

---

## 2. Names and why: tile by tile

### 2.1 The money behind the three suits

Mahjong's three suits come from Chinese money-suited playing cards of the *madiao* (馬吊) family. Those decks had suits of coins (cash), strings of coins, and myriads, and some also had a fourth suit of tens of myriads. Mahjong descends from the later three-suited games ([Sloper FAQ 11b][sl11b]; [Sloper FAQ 18][sl18]; [Wikipedia: Madiao][wp-madiao]). Sloper names the suits "Coins, Strings of Coins, and Myriads of Strings of Coins" ([FAQ 18][sl18]). A string stands for 100 coins ([World of Playing Cards][wopc]). **Confidence: High.** Sloper, Wikipedia, and the World of Playing Cards all describe the same coins, strings, and myriads scheme.

- **Disagreement over what a "myriad" counted.** Wikipedia gives 10,000 coins, or 100 strings of 100 ([Wikipedia: Mahjong tiles][wp-tiles]). Sloper writes "myriads of strings" ([FAQ 18][sl18]). Pollett at the World of Playing Cards reads *wan* as short for "10,000 guan," with a *guan* being a string of 1,000 coins ([WOPC][wopc]). The tutorial-safe version is: "萬 means ten thousand, and the suit stands for big sums of money." **Confidence on the exact amount: Low.**
- **Early sets used other suit names.** The Himly set (collected c. 1868 to 1876) labels its suits 同 tóng ("copper cash"), 索 suǒ ("strings"), and 万 wàn ("myriads"). Another early set used 饼 bǐng ("cakes"), 梭 suō ("shuttles"), and 品 pǐn ("ranks") ([Stanwick and Xu, terms 1780 to 1920][st-terms]).

### 2.2 Bams

- **American names:** Bams, Bamboos, Sticks ([Sloper, Shanghai manual][slbasic]). The Japanese name is Sōzu ([Sloper FAQ 6][sl6]).
- **Chinese names:** 索子 suǒzi, from 索, "rope; cable." Wiktionary also lists a regional mahjong sense, "bamboo tile" ([Wiktionary 索][wikt-suo]). The Cantonese is sok3 zi2, glossed "the bamboo tiles" ([Jyutjyu / words.hk][jyutjyu]). The suit is also called 條子 tiáozi ([Sloper FAQ 6][sl6] lists tiáo). 條 is a word for long, thin strips, but I did not check that gloss against a cited source.
- **Why "bamboo":** the sticks are side views of coins threaded on a cord. Pollett describes the card versions as coins "threaded up on a string" ([WOPC][wopc]). Wikipedia says Babcock mistook the knots for bamboo joints, which gave the suit its English name ([Wikipedia: Mahjong tiles][wp-tiles]). A collector history adds that over time the tile art itself drifted toward bamboo stalks ([Mahjong Treasures][mt-history]).
- **Confidence:** High that the suit depicts strings of coins. Medium-Low that Babcock personally coined "bamboo": only one secondary source says so, and a rival American rulebook from 1922 already uses "Bamboo" ([Harr, *Pung Chow*, 1922][harr]).
- **Colors:** in typical sets the 2, 3, 4, 6, and 8 Bams are all green (or blue and green), and the 1, 5, 7, and 9 carry red accents ([Wikipedia: Mahjong tiles][wp-tiles]; [Sloper FAQ 7s][sl7s]). Sloper calls the red on the 5, 7, and 9 an unconfirmed convention whose purpose is unknown ([Sloper FAQ 7e][sl7e]).

### 2.3 Why the 1 Bam is usually a bird

- **What it looks like.** Usually a bird, with a "1" index in American sets. Wikipedia says it is often called the sparrow, and in Japan it is most often a peacock ([Wikipedia: Mahjong tiles][wp-tiles]). A few sets show a bamboo shoot instead ([Sloper FAQ 7e][sl7e]).
- **Best-supported explanation: the bird grew out of a single string of coins.** Sloper describes an 1873 set with a stylized string of coins on the 1 Bam and an 1890 set with a "very birdlike" string ([FAQ 7e][sl7e]). Wikipedia, citing the historian Andrew Lo, says early sets had no bird, only a single bent string capped with a red knot ([Wikipedia: Mahjong tiles][wp-tiles]). The early-1870s Glover set's 1 Bam is plain and stylized ([Sloper FAQ 11e][sl11e]). A designer-brand history traces the motif from string to crane, sprout, peacock, and sparrow ([The Mahjong Line, Watson][tml-watson]). **Confidence: High** for the visual evolution, since independent descriptions of early sets agree. Why artists settled on a bird in particular is undocumented.
- **Popular explanations (Low, folk):**
  - *The sparrow pun.* The game's old Chinese name 麻雀 means "sparrow." Sloper doubts that this has anything to do with the bird on the tile ([FAQ 7e][sl7e]).
  - *The "grain-protection" legend.* In this story, farmers strung captured sparrows together to claim rewards, so the 1 of "strings" became a single bird ([UpToGo, 2025][uptogo]). Tam Sai-po, writing in the Macau Cultural Institute's journal, dismisses the related origin story as mostly speculation ([Tam 2014][tam]).
  - *The nickname 幺雞 yāojī, "little chicken."* 幺 means "one" or "small," and the nickname is common in Mandarin-speaking play ([UpToGo][uptogo]). **Confidence: Medium-Low**, from a single popular source.

### 2.4 Craks

- **American names:** Craks (the American spelling Sloper records), also Cracks, Characters, Wan, and Ten Thousand ([Sloper FAQ 6][sl6]; [Sloper, Shanghai manual][slbasic]; [I Love Mahj][ilm-tiles]).
- **Chinese name:** 萬 wàn (simplified 万), "myriad," meaning ten thousand ([Wikipedia: Mahjong tiles][wp-tiles]; [Sloper FAQ 6][sl6]).
- **Tile face:** the rank is written as a Chinese numeral on top, with 萬 in red below it ([Wikipedia: Mahjong tiles][wp-tiles]). Sloper's low-vision tips mention covering "the upper Chinese numeral" with an Arabic sticker ([FAQ 7s][sl7s]).
- **Why "characters":** this is the only suit whose value is written out as a Chinese numeral instead of shown by a count of symbols. The money cards worked the same way ([WOPC][wopc]). "Craks" is short for "characters" ([Mahjong Treasures][mt-history]; [Oh My Mahjong][omm-pregame]). **Confidence: High.**
- **The numerals 1 to 9** (general reference; check the stylized forms against a real set): 一 yī, 二 èr, 三 sān, 四 sì, 五 wǔ, 六 liù, 七 qī, 八 bā, 九 jiǔ.
- **Variation between sets:** 1920s sets mostly use the simpler 万, and sets from the 1970s on mostly use the full 萬 ([Sloper FAQ 7e][sl7e]; [Stanwick, Part 1][st-part1]).
- **Designer folklore (Low):** a 2021 blog post from a designer brand ties lightning-bolt Craks to an "explosive" origin story and cites no sources ([The Mahjong Line, Wolf][tml-wolf]).

### 2.5 Dots

- **American names:** Dots, Circles, Balls ([Sloper, Shanghai manual][slbasic]). The Japanese name is Pinzu ([Sloper FAQ 6][sl6]).
- **Chinese names:** 筒子 tǒngzi, which appears in Shanghai novels of the 1890s ([Stanwick and Xu][st-terms]); 餅 bǐng, "cake(s)" ([Sloper FAQ 6][sl6]; [Stanwick and Xu][st-terms]); and the nickname 大餅 dàbǐng, "big pancake" ([Wikipedia: Mahjong tiles][wp-tiles]). The Himly set writes the suit as 同 tóng, "copper cash" ([Stanwick and Xu][st-terms]).
- **What they depict:** copper "cash" coins ([Wikipedia: Mahjong tiles][wp-tiles]; [Sloper FAQ 18][sl18]; [WOPC][wopc]). Each coin is drawn as circles nested one inside another. The 5 usually has a red center coin, and the 1 Dot is often a single ornate, flower-like coin ([Stanwick, Part 1][st-part1]). **Confidence: High.**
- **Folk (Low):** the grain-protection legend reads 筒 as the end of a gun barrel ([Tam 2014][tam], who rejects the story).

### 2.6 Winds

- **Chinese:** 東 dōng (East), 南 nán (South), 西 xī (West), 北 běi (North) ([Wikipedia: Mahjong tiles][wp-tiles]). Early texts name them with 風, "wind," as in 東風, "east wind" ([Stanwick and Xu][st-terms]). The group's Chinese name is "Four Joyous Tiles," 四喜牌 sìxǐpái ([Wikipedia: Mahjong tiles][wp-tiles]).
- **American usage:** tiles carry the letters N, E, W, S, and the card lists the winds as "NEWS." The traditional Chinese order is E, S, W, N ([Sloper FAQ 18][sl18]). On the card, NEWS is four single tiles, not a kong, so jokers can't be used in it ([Sloper FAQ 16, 2026 card][sl16]). American play has no prevailing wind, and the wind indicator that comes with many sets gets used as a marker for the "bettor" ([Sloper FAQ 7d][sl7d]).
- **Symbolism:** each wind is traditionally paired with a season: East with spring, South with summer, West with autumn, North with winter. Sloper reports this as tradition ("it is said") ([FAQ 18][sl18]). **Confidence: Medium.**
- **Early variants:** some early sets used ranks or Confucian virtues in place of the winds ([Sloper FAQ 11e][sl11e]).

### 2.7 Dragons as a group

- **The English name.** "Dragons" is a Western term that most Asian players don't use ([Sloper FAQ 6][sl6]). Wikipedia credits Babcock with coining it ([Wikipedia: Mahjong tiles][wp-tiles]). **Confidence: Medium-Low**, from a single secondary source. The 1922 *Pung Chow* rulebook already speaks of Red, Green, and White Dragons ([Harr][harr]), so the term was standard by then.
- **Chinese group names:** 三元牌 sānyuánpái, "three fundamental tiles," also called 箭牌 jiànpái, "arrow tiles." English writers sometimes say "cardinal tiles" ([Wikipedia: Mahjong tiles][wp-tiles]).
- **How the dragons developed.** White Dragons came first, out of spare or replacement tiles; red ones appeared around 1870 and green ones by 1890 ([Wikipedia: Mahjong tiles][wp-tiles]). The early-1870s Glover set has 中 tiles and blank tiles but no 發 ([Sloper FAQ 11e][sl11e]). Some early sets, up through the 1920s, used 龍 lóng ("dragon") and 鳳 fèng ("phoenix") tiles in place of 中 and 發 ([Sloper FAQ 7e][sl7e]; [FAQ 11e][sl11e]). No source I found connects those tiles to the English name "Dragons." A link is possible but unproven.
- **The archery theory (contested, Low):** 中 = hit the target, 發 = shoot, 白 = miss.
  - *For it:* the Chinese nickname "arrow tiles" ([Wikipedia][wp-tiles]); 中 can be read zhòng, "to hit the mark" ([Wiktionary 中][wikt-zhong]); and Stanwick notes that early sets wrote 發 with a component he glosses as "arrow" ([Stanwick, Part 1][st-part1]).
  - *Against it:* no early document explains the tiles this way. A related Chinese folk tale (rewards for scaring sparrows: 中 a hit, 發 a payout, 白 a miss) is dismissed as speculation by Tam ([Tam 2014][tam]).
  - *Advice:* present it as a story people tell, not as history.
- **Designer folklore (Low):** a designer-brand blog says the dragons were adapted from tiles meaning "Fire!" and "Hit!" and that Soap was a fireworks target ([The Mahjong Line, Wolf][tml-wolf]). It cites no sources and contradicts Sloper.

### 2.8 Red Dragon

- **Chinese name:** 中 zhōng, "middle; center" ([Wiktionary 中][wikt-zhong]); in full, 紅中 hóngzhōng, "red center" ([Wikipedia: Mahjong tiles][wp-tiles]).
- **Symbolism:** Sloper suggests the "center" can be read as a fifth direction alongside the four winds ([FAQ 18][sl18]).
- **Index:** some sets mark the tile "C," for the old romanization *chung* ([Sloper FAQ 7e][sl7e]).
- **Confidence:** High for the meaning; Medium for the fifth-direction reading.

### 2.9 Green Dragon

- **Chinese name:** 發 fā (simplified 发), conventionally read as in 發財 fācái, "to strike it rich" ([Wikipedia: Mahjong tiles][wp-tiles]). An alternate name is 青發 ([Wikipedia][wp-tiles]).
- **Meaning:** Sloper says the character means "get," which expands to "get rich," and that is why Western authors call this tile "fortune" ([FAQ 18][sl18]).
- **Index:** often marked "F," from the Cantonese reading Sloper spells "faht" ([FAQ 7e][sl7e]).
- **Confidence:** High.

### 2.10 White Dragon, alias Soap

- **Chinese names:** 白 bái, whose meanings include "white" and "clear; pure; plain; blank" ([Wiktionary 白][wikt-bai]). The tile is also called 白板 báibǎn, "white board" ([Wikipedia: Mahjong tiles][wp-tiles]), a name already in print in an 1891 novel ([Stanwick and Xu][st-terms]).
- **Index:** sets that mark it with "B" or "P" are simply writing "white" in romanized Chinese ([Sloper FAQ 18][sl18]). Sloper also warns that the character 白 looks a lot like 百, "hundred" ([FAQ 7e][sl7e]).
- **How the face changed:** it was originally blank. A rectangular frame was added when solid one-color plastic tiles made it hard to tell a blank face from the back ([Sloper FAQ 18][sl18]; [FAQ 7e][sl7e]). Older sets and Japanese sets use plain blanks ([Sloper FAQ 7b][sl7b]).
- **Why "Soap":** Sloper says American players thought the blank tile looked like a bar of soap ([FAQ 7e][sl7e]), and Wikipedia agrees ([Wikipedia: Mahjong tiles][wp-tiles]). A hand-carved set that can't date from earlier than 1923 shows its White Dragon as a wrapped bar of soap, which suggests the nickname is old ([Mahjong Treasures][mt-soap]). **Confidence: Medium-High.** The sources are consistent, but I found no early written use of the nickname. The competing "fireworks target" story ([Wolf][tml-wolf]) is **Low**.
- **Soap as zero: the rule.** Soap is the only tile ever used as zero, and when it serves as zero it belongs to no suit ([Sloper FAQ 16, 2026 card][sl16]; [Sloper, 2016 card FAQ][sl2016]). Retail manuals repeat the rule ([Cirquejong manual][cirque]). **Confidence: High.**
- **Soap as zero: the reason.** I found no official explanation. The plausible one is visual: Soap is the plain, "empty" tile. Sloper muses that the dragons can be thought of as a "zeroth" rank of the suits but advises not reading much into it ([FAQ 18][sl18]). **Confidence: Low.** Year hands first appeared on the card in 1955 ([Sloper timeline][sl11h]). I did not find when Soap first stood in for zero.

### 2.11 Flowers (and Seasons)

- **Chinese name:** 花牌 huāpái, "flower tiles" ([Sloper FAQ 6][sl6]).
- **The usual eight designs:**
  - Four flowers, the "Four Gentlemen": 梅 méi (plum blossom), 蘭 lán (orchid), 菊 jú (chrysanthemum), 竹 zhú (bamboo).
  - Four seasons: 春 chūn (spring), 夏 xià (summer), 秋 qiū (autumn), 冬 dōng (winter).
  - Sources: [Stanwick and Xu][st-terms]; [Wikipedia: American mahjong][wp-am].
- **Numbers on the tiles:** in Chinese-style play each flower and season is numbered 1 to 4 and tied to a seat, with 1 for East through 4 for North ([Wikipedia: American mahjong][wp-am]; [Sloper FAQ 7e-F][sl7ef]).
- **Other subjects:** some sets use the Four Arts, the Four Occupations, animals, or scenes from legends instead ([Sloper FAQ 7e-F][sl7ef]).
- **History:** seasons appear in the earliest sets and flowers came later. The Glover set has seasons but no flowers ([Sloper FAQ 11e][sl11e]), and a 1905 *Shen Bao* report from Beijing described a new 140-tile set with four flower tiles ([Stanwick and Xu][st-terms]). A 1922 American rulebook calls these tiles "Mandarins" ([Harr][harr]).
- **Why there are eight:** Sloper offers, with hedging, that the eight tiles fill out the set for symmetry: winds, dragons, and flowers together make 36, the same as one suit ([FAQ 18][sl18]). **Confidence: Low-Medium.**

### 2.12 Jokers

- **American jokers:** the tiles usually carry the English word "Joker" ([Sloper FAQ 7b][sl7b]). One standard American joker design is a circle of gold squiggles that Sloper thinks is meant to be a dragon ([Sloper FAQ 7e-J][sl7ej]).
- **Wild tiles in Chinese sets:** these existed before American jokers. They include 百搭 bǎidā, "a hundred uses"; 聽用 tīngyòng, "multipurpose"; and 飛, "flying" ([Wikipedia: Mahjong tiles][wp-tiles]; [Sloper FAQ 7e-J][sl7ej]). Some early regional sets had wild tiles that worked only within one suit ([Stanwick and Xu, Flowers and Kings][st-kings]).
- **The name:** the English word matches the wild card in Western decks. I found no source on why the NMJL chose it, so that link is my inference (**Low**).
- **Dates and counts:** see Section 5.

---

## 3. Which dragon goes with which suit

- **The pairing:** Craks go with the Red Dragon, Bams with the Green Dragon, and Dots with the White Dragon (Soap) ([Sloper FAQ 16, 2026 card][sl16]; [Sloper FAQ 7s][sl7s]; [Cirquejong manual][cirque]). The NMJL prints the pairing on the back of the card ([Sloper, 2016 card FAQ][sl2016]). **Confidence: High.**
- **How the card uses it:**
  - *Matching dragons* are the dragon that goes with a hand's suit. *Opposite ("Opp") dragons* are a dragon that does not match.
  - In hands that require three suits, the dragons can count as one of the suits ([Mah Jongg Insider, Feb. 2026][ins-0202]). **Confidence: Medium** (a newsletter, consistent with Sloper).
  - When Soap is used as a zero it has no suit and does not count as Dots ([Sloper FAQ 16][sl16]; [Mah Jongg Insider, Apr. 2026][ins-0427]).
- **The reason:** I found no NMJL or historian explanation. The evident logic is color: the 萬 on Craks is red and Bams are mostly green, which leaves Soap for Dots. Teaching guides present it this way, with mnemonics such as soap bubbles for Dots ([Oh My Mahjong][omm-pregame]), and a retail manual frames the rule in terms of color ([Cirquejong manual][cirque]). **Confidence: Low** (inference and mnemonic).
- **Not a Chinese tradition.** Stanwick and Xu's survey of early sets turns up wild tiles tied to particular suits but no link between dragons and suits ([Stanwick and Xu, Flowers and Kings][st-kings]). When this pairing entered American play is an open question.
- **Pitfall for the tutorial.** Some manuals overgeneralize, for example "if you use Bams with Dragons, the Dragons must be green" ([Cirquejong manual][cirque]). That is wrong for card hands that call for opposite dragons ([Mah Jongg Insider][ins-0202]). Teach the pairing as vocabulary and let each hand say "matching" or "opposite."

---

## 4. Why all eight Flowers are interchangeable

- **The fact.** In American play any flower counts the same as any other, and the numbers or season names printed on them are ignored ([Sloper FAQ 7e-F][sl7ef]; [Oh My Mahjong][omm-pregame]: "a flower is a flower is a flower"). **Confidence: High.**
- **The documented history:**
  - In the 1930s the American game dropped the chow and made flowers wild ([Sloper timeline][sl11h]). From its founding in 1937, the NMJL treated flowers as wild tiles ([Sloper column 509][sl509]). Wikipedia dates flowers' service as jokers from the 1930s to 1960 ([Wikipedia: Mahjong tiles][wp-tiles]).
  - Once flowers were wild, which seat a flower belonged to stopped mattering. Sloper says the NMJL made flowers wild, so the numbers no longer matter ([FAQ 7e-F][sl7ef]).
  - Jokers took over the wild role in 1961, and the flower count settled at eight in 1971. Flowers stayed a single interchangeable group, written "F" on the card ([Sloper column 509][sl509]; [Sloper timeline][sl11h]).
  - **Confidence: Medium-High.**
- **Contrast with Chinese play.** There, flowers are bonus tiles tied to seats ([Wikipedia: American mahjong][wp-am]; [Sloper FAQ 7e-F][sl7ef]). American play also has no prevailing wind ([Sloper FAQ 7d][sl7d]), so seat-based bonuses had no role. That last connection is my inference.
- **Consequence for play.** Because there are eight flowers, flowers are the only tile that can form a quint without jokers ([Sloper, Shanghai manual: American][slamer]). **Confidence: High.**
- **Historical oddity.** When the card required more than eight flowers, players pieced sets together and stuck flower decals on other tiles. Some groups also "planted" flowers at fixed spots in the wall ([Sloper column 509][sl509]).

---

## 5. Jokers: when they arrived and how the count changed

- **When.** Joker tiles came into the American game in 1961. Before that there were none, and flowers served as the wild tiles ([Sloper FAQ 19][sl19]; [Sloper timeline][sl11h]; [Sloper column 509][sl509]). Heinz says the American rules kept changing until they settled in the early 1960s ([OPB interview][heinz-opb]). **Confidence: High.**
- **Counts the NMJL card required** (compiled by Sloper; [column 509][sl509]):
  - 1937 to 1942: 8 flowers, all wild; no jokers.
  - 1943 to 1960, flowers only: 12 (1943), 14 (1944 to 1945), 16 (1946), 18 (1947 to 1948), 20 (1949), 24 (1950 to 1955), 22 (1956 to 1957), 20 (1958 to 1960).
  - Flowers and jokers: 14F and 2J (1960 to 1962); 12F and 4J (1962 to 1966); 8F and 6J (1966 to 1967); 10F and 6J (1967 to 1968); 6F and 8J (1968 to 1971); 8F and 8J (1971 to the present).
  - The set has stood at 152 tiles since 1971 ([Sloper timeline][sl11h]).
  - **Confidence: Medium-High.** It comes from one compiler, but Sloper is the standard reference and his FAQ and timeline agree. The overlapping year labels are his and reflect card years.
  - Some sets from the 1940s carried two jokers, though they were uncommon ([Sloper column 509][sl509]).
- **Why jokers were introduced.** I found no NMJL rationale. The timeline suggests that jokers replaced flowers as the dedicated wild tile, and the flower count then fell back to the standard eight ([Sloper column 509][sl509]). **Confidence: Low-Medium** (inference).
- **Later joker rules:**
  - Jokers can't be used for singles or pairs. Sloper dates this rule to about 1984 ("may have been," judging from old cards) ([Sloper timeline][sl11h]; [Sloper FAQ 19][sl19]).
  - Jokers can't be passed during the Charleston ([Wikipedia: American mahjong][wp-am]).
- **Physical traces in old sets.** Vintage sets often have jokers or flowers made with stickers ([Sloper FAQ 7b][sl7b]). Sloper notes that modern vinyl sets may be the only ones with all eight jokers built in, with no stickers needed ([Sloper FAQ 7c][sl7c]).

---

## 6. Vocabulary glossary

| Term | Meaning in American play | Origin or note | Conf. | Sources |
|---|---|---|---|---|
| Mah Jongg (the game) | The NMJL's spelling (two words, double g). "Mahjong" is the generic spelling. | Joseph Babcock coined the spelling "Mah-Jongg" as a name he could trademark, and the trademark filing is dated 1923. Within a few years "mahjong" became the generic word, and Babcock's heirs apparently let the trademark lapse. Merriam-Webster derives the word from the trademark and gives 1920 as its first known use. | High | [Sloper FAQ 11][sl11]; [timeline][sl11h]; [Merriam-Webster][mw] |
| 麻將 / 麻雀 | Chinese names: májiàng in Mandarin; máquè, "sparrow," the older name still used in Cantonese. | See Section 7.2. The sources compete on which came first and why. | Medium | [Wiktionary 麻將][wikt-majiang]; [Stanwick and Xu][st-terms]; [Tam][tam] |
| "Mah Jongg!" | What a player calls out on completing a hand. | Sloper records it as the American win call. A 1922 rulebook gives "Mah-Jongg" or "Mah-Diao" as the call. | High | [Sloper FAQ 6][sl6]; [Harr][harr] |
| Mahj | Informal short form for the game. | Used by the NMJL itself. | High | [Sloper FAQ 6][sl6]; [Jewish Museum Milwaukee][jmm] |
| Maajh | An older American name for the game. | Title of Viola Cecil's 1938 NMJL rulebook. The NMJL site still says "American Maajh." | High | [Sloper timeline][sl11h]; [NMJL][nmjl-league] |
| Pung | Three identical tiles. Jokers may be used. | From Chinese 碰 pèng (Cantonese pung3), the call for claiming a discard to complete three of a kind. Peng appears in a 1783 card-game text, and Babcock's 1920 rules use "Pung." | High | [Sloper FAQ 6][sl6]; [Wiktionary pung][wikt-pung]; [Wikipedia: Mahjong][wp-mj]; [Stanwick and Xu][st-terms]; [Sloper on Babcock][slbab] |
| Kong | Four identical tiles. | From 槓 gàng (Cantonese gong3), whose basic meaning is "lever, pole, crowbar." The excerpts of Babcock's Red Book that Sloper reproduces say "four of a kind" rather than "kong." Why a word for a bar came to mean four of a kind is undocumented. | Medium | [Wiktionary kong][wikt-kong]; [Wiktionary 槓][wikt-gang]; [Sloper FAQ 6][sl6]; [Sloper on Babcock][slbab] |
| Quint | Five identical tiles. Except with flowers, a quint needs jokers. | Ordinary English word. The NMJL rulebook defines it as an exposure. | High | [Sloper FAQ 19][sl19]; [Shanghai manual][slamer]; [NMJL][nmjl-game] |
| Sextet | Six identical tiles. Except with flowers, a sextet needs jokers. | Earlier cards even allowed sextuplets and septuplets. | High | [Sloper FAQ 19][sl19]; [Shanghai manual][slamer] |
| Chow | A run of three tiles in one suit. Not used in American play. | Dropped in the 1930s. Wikipedia gives the Chinese call as 吃 chī ("eat"), while Wiktionary traces the English word to the pidgin "chow-chow" (the sources disagree). | Medium-Low (origin) | [Sloper timeline][sl11h]; [Shanghai manual][slbasic]; [Wikipedia: Mahjong][wp-mj]; [Wiktionary chow][wikt-chow] |
| Pair, single | Two identical tiles; one tile. | Jokers may never stand in for either (since about 1984). | High | [Sloper FAQ 19][sl19]; [timeline][sl11h] |
| Exposure (exposed) | A pung, kong, quint, or sextet laid face up during play, usually after claiming a discard. | NMJL rulebook definition as quoted by Sloper. Only groups of three or more can be exposed during play. | High | [Sloper FAQ 19][sl19]; [Shanghai manual][slamer] |
| Concealed ("C") | A hand marked C on the card must be completed without exposing any part of it before going Mah Jongg. | Card notation. | High | [Sloper FAQ 16][sl16]; [FAQ 19][sl19] |
| Redeeming a joker | Swapping the real tile for a joker in someone's exposure. | Not the same as claiming a discard. | Medium | [Sloper FAQ 19][sl19] |
| Wall | The face-down tiles stacked two high. With 152 tiles, each side is 19 stacks long. | | High | [Shanghai manual][slbasic] |
| Rack | The stand that holds a player's tiles. American players use racks, while many Asian players stand their tiles on end. | Racks go back to the 1920s: a "Dragon Racks" trademark was filed in 1923 and a game-rack patent granted in 1925. | High | [Sloper FAQ 7d][sl7d]; [timeline][sl11h] |
| Pusher | A ruler or arm used to push a section of wall toward the center. | Sloper notes that some American players call rulers "pushers." When arms built into racks first appeared is not documented here. | Medium | [Sloper FAQ 7d][sl7d] |
| East, dealer | The dealer is called East and rolls the dice to decide where the wall is broken. | American play has no prevailing wind. | High | [Shanghai manual][slbasic]; [Sloper FAQ 7d][sl7d] |
| Bettor | A non-playing fifth person who bets on which player will win the hand. | Sets' wind indicators are often reused as the bettor's marker. | Medium | [Sloper FAQ 7d][sl7d] |
| NEWS | How the card lists the four winds. | Traditional Chinese order is E, S, W, N. On the card, NEWS is four singles, so no jokers. | High | [Sloper FAQ 18][sl18]; [FAQ 16][sl16] |
| Honors | Winds and dragons together. | Standard English mahjong term. | High | [Sloper FAQ 6][sl6]; [Shanghai manual][slbasic] |
| Like tiles; Like Numbers | "Like" tiles are identical tiles; a pair is two like tiles. "Like Numbers" is a card section of hands that use the same number across different suits. | | Medium | [Sloper FAQ 19][sl19]; [FAQ 16][sl16]; [Mah Jongg Insider][ins-0202] |
| Consecutive Run | Card section of hands built on numbers in sequence. The card abbreviates it "Consec. Nos." or "Run." | | High | [Sloper FAQ 16][sl16] |
| Singles and Pairs | Card section of hands made only of singles and pairs, so no jokers can be used. | Sloper's timeline records the section being labeled "Singles & Pairs - No Bonus" with a 1995 change to the jokerless bonus. | Medium-High | [Sloper FAQ 16][sl16]; [timeline][sl11h] |
| Section names | The 2026 card's sections: 2026, 2468, Any Like Numbers, Quints, Consecutive Run, 13579, Winds-Dragons, 369, Singles and Pairs. | The year section has existed since 1955. | High | [Sloper FAQ 16][sl16]; [timeline][sl11h] |
| Matching / opposite dragons | The dragon paired with a suit, or one that is not. | See Section 3. | High / Medium | [Sloper FAQ 16][sl16]; [Mah Jongg Insider][ins-0202] |
| Soap | The White Dragon. It also serves as zero (0). | See Section 2.10. | High | [Sloper FAQ 7e][sl7e]; [FAQ 16][sl16] |
| F | A flower tile. All eight are interchangeable. | See Section 4. | High | [Sloper FAQ 7e-F][sl7ef] |
| Charleston | A required series of passes before play begins, three tiles at a time: right, across, left. A second Charleston (left, across, right) is optional and happens only if all players agree. | **The name's origin is undocumented.** A 2011 article reports that even the League doesn't know where it came from, and that the Charleston was already part of the game by 1937. Sloper compares the passing to the 1920s dance, which is an analogy, not evidence. | Low (origin); High (procedure) | [Wikipedia: American mahjong][wp-am]; [NMJL][nmjl-game]; [Jewish Journal][jj]; [Sloper column 45][sl45] |
| Courtesy pass | After the Charleston, an optional exchange of zero to three tiles with the player across the table. | | Medium-High | [Wikipedia: American mahjong][wp-am] |
| Blind pass ("stealing") | On the last pass of each Charleston, a player may pass along tiles just received without looking at them. | Sloper's FAQ refers to "stealing" and "blind passing." | Medium | [Wikipedia: American mahjong][wp-am]; [Sloper FAQ 19][sl19] |
| Hot tile | A tile another player clearly needs, or one otherwise dangerous to discard. | "Hot wall" and "cold wall" are table rules, not NMJL rules. | High | [Sloper FAQ 19][sl19] |
| Dead hand; death challenge | Any player may call another player's hand dead, for example when no card hand fits that player's exposures, the hand has become unwinnable, a concealed hand has been exposed, or the tile count is wrong. | | High | [Sloper FAQ 19][sl19] |
| Jokerless | A hand won without jokers. It must be announced and doubles the score. The bonus does not apply to Quints, and the Singles and Pairs section is marked "No Bonus." | | Medium-High | [Sloper FAQ 19][sl19]; [Shanghai manual][slamer]; [timeline][sl11h] |
| Self-pick | Winning on a tile you drew yourself ("I picked it"). | | Medium | [Sloper FAQ 6][sl6] |

---

## 7. Short history

### 7.1 Origins in China

- **When and where.** Mahjong as we know it took shape in the mid-to-late 1800s. It is not an ancient game ([Sloper FAQ 11][sl11]). Heinz places its origin "in the area around Shanghai" ([OPB][heinz-opb]). A review of her book paraphrases this as southern China in the mid-19th century ([Library Journal][lj-heinz]), and Wikipedia notes rival claims for Ningbo and Fujian ([Wikipedia: Mahjong][wp-mj]).
- **Earliest evidence:**
  - The earliest surviving sets date from the 1870s: the Himly set (c. 1868 to 1876) and the Glover sets (1872 to 1875). Glover's 1875 description is the first written account of a tile set in any language ([Sloper timeline][sl11h]).
  - The Shanghai newspaper *Shen Bao* used 麻雀 for the tile game in 1884, and the written form 麻將 first appears in 1913 ([Stanwick and Xu][st-terms]).
  - The game was widely played in China by 1911 ([Sloper timeline][sl11h]).
- **Ancestors:** money-suited card games, as described in Section 2.1 ([Sloper FAQ 11b][sl11b]).
- **Inventor (disputed, Low):** Ningbo's mahjong museum credits Chen Yumen (1817 to 1878), and Sloper personally leans toward accepting this ([Sloper FAQ 11c][sl11c]). Wikipedia calls the documentary story behind the claim "probably forged" ([Wikipedia: Mahjong][wp-mj]).
- **Myths.** 1920s promoters sold the game as ancient. Ads called it a game played by Confucius ([Library Journal][lj-heinz]), and a 1922 American rulebook traces it to the court of the King of Wu in 472 BC ([Harr][harr]). Sloper calls this "marketing hype that started in the 1920s" ([FAQ 11][sl11]). **Confidence: High** that these are myths.

### 7.2 The name

- **The Chinese name.** 麻雀 máquè means "sparrow," and 麻將 májiàng is the Mandarin form. Three explanations compete:
  - *Linguistic (Medium):* Wiktionary derives 麻將 from 麻雀 plus a Wu-dialect diminutive suffix ([Wiktionary 麻將][wikt-majiang]). Stanwick and Xu trace the Shanghainese *mo ziang* to a Ningbo pronunciation, which northern speakers then rendered as májiàng; they present this as hypothesis ([Stanwick and Xu][st-terms]).
  - *Card-game descent (Medium):* Tam Sai-po argues that 麻雀 and 麻將 are sound-alike descendants of 馬吊 *madiao*, so the bird meaning is incidental ([Tam 2014][tam]). Stanwick and Xu also mention a chain of homophones running from 马吊 to 麻雀 ([Stanwick and Xu][st-terms]).
  - *The sound of sparrows (Folk, Low):* shuffling tiles sound like sparrows squabbling. This is widely repeated ([Sloper FAQ 11][sl11]; [FAQ 18][sl18]; [Wikipedia: Mahjong][wp-mj]) but has no documentary support.
- **Literal glosses.** "Hemp sparrow" or "flax sparrow" for 麻雀 ([Sloper FAQ 18][sl18]); W. H. Wilkinson recorded "hemp sparrow" in 1895 ([Wikipedia: Mahjong][wp-mj]). Sloper is unsure what to make of 麻將 ("hemp general"?) ([FAQ 11][sl11]).
- **The English names.** Babcock wanted a name he could trademark and chose "Mah-Jongg." Rival brands sold the game as Ma Chong, Ma Chiang, Pung Chow, and Pe-Ling ([Sloper FAQ 11][sl11]).

### 7.3 The 1920s American craze

- **Babcock:**
  - Joseph Park Babcock (1893 to 1949) was a Standard Oil employee posted to Soochow (Suzhou) in 1912 ([Sloper timeline][sl11h]; [Wikipedia: Babcock][wp-babcock]).
  - His rules, *Rules of Mah-Jongg*, the "Red Book," first appeared in 1920 and added English index numbers to the tiles ([Sloper on Babcock][slbab]).
  - He began exporting sets on October 26, 1920. He filed the "Mah-Jongg" trademark on February 23, 1923, and his patent was granted in 1925 ([Sloper timeline][sl11h]).
  - Minor discrepancy: the Strong Museum dates the Red Book to 1923, which is the second edition ([Strong Museum][strong]).
- **Others in the business:**
  - Abercrombie & Fitch began selling sets in 1920 and reportedly sold about 12,000 ([Wikipedia: Mahjong][wp-mj]; **Medium**, from one secondary source).
  - Hammond's company ran the publicity campaign, and George Parker of Parker Brothers struck a deal with Dyas and Babcock in 1923 ([Sloper timeline][sl11h]).
  - L. L. Harr's *Pung Chow* rulebook came out in 1922 ([Harr][harr]).
  - Heinz calls Babcock not the only importer but "the most influential" ([OPB][heinz-opb]).
- **The peak, 1923 to 1924.** The game was played at the Harding White House ([OPB][heinz-opb]). In April 1924, mahjong ranked sixth among Chinese imports and made the cover of *Life* ([Sloper timeline][sl11h]). In 1924 a committee issued the "American Official Laws of Mah-Jongg" to settle competing rules ([Sloper timeline][sl11h]; [Wikipedia: Babcock][wp-babcock]).
- **Marketing and decline.** The game was marketed as an ancient, elite Chinese pastime even as anti-Chinese laws were in force ([OPB][heinz-opb]). It faded by the Depression ([Library Journal][lj-heinz]; [Strong Museum][strong]).

### 7.4 The NMJL (1937) and the annual card

- **The founding.** In 1937, enthusiasts met in New York City to standardize the game so that everyone would play the same hands and rules ([NMJL][nmjl-league]). Viola Cecil was president and Dorothy Meyerson vice president, and in fall 1937 nearly 400 women met at the Essex House hotel ([Heinz excerpt, Tablet][heinz-tablet]).
- **Membership.** The NMJL says it began with 32 members and now has more than 350,000 ([NMJL][nmjl-league]). That isn't necessarily a contradiction of Heinz: 32 founding members and about 400 at the hotel meeting can both be true. Membership passed 35,000 by 1941 ([Heinz excerpt][heinz-tablet]).
- **Goals.** The founders wanted a "simplified, faster, and more enticing" game, with standard scoring and fewer winning hands ([Heinz excerpt][heinz-tablet]).
- **Early rulebooks:** Meyerson's *That's It* (1937) and Cecil's *Maajh* (1938) ([Sloper timeline][sl11h]; [Wikipedia: Mahjong][wp-mj]).
- **The card.** A new card comes out every year. Volunteers design it from August to November, and orders typically open in late March. Proceeds go to charities ([Jewish Museum Milwaukee, 2016][jmm]; [NMJL][nmjl-league]). Heinz says that "No other form of Mahjong in the world requires a card" ([OPB][heinz-opb]).
- **Has there been a card every year since 1937?** Sloper's table of card requirements begins with 1937 ([column 509][sl509]), and a retailer says the card has been issued every year without a break, but cites no source ([Oh My Mahjong][omm-history]). **Confidence: Medium.**
- **Leadership.** Ruth Unger led the League for more than 50 years until her death in 2015, and her sons David and Larry now run it ([Jewish Museum Milwaukee][jmm]).

### 7.5 How and why the American game diverged

| When | Change | Source |
|---|---|---|
| 1920s | Babcock's simplified rules, regional variants, and the 1924 Official Laws | [Sloper timeline][sl11h] |
| 1930s | The chow is dropped and flowers become wild | [Sloper timeline][sl11h] |
| 1937 | NMJL founded; the card limits winning hands to its list | [NMJL][nmjl-league]; [Sloper FAQ 19][sl19] |
| 1943 to 1960 | Required wild-flower counts climb as high as 24 | [Sloper column 509][sl509] |
| 1955 | The year hand appears | [Sloper timeline][sl11h] |
| 1961 | Jokers introduced | [Sloper FAQ 19][sl19] |
| 1971 | 8 flowers and 8 jokers; 152 tiles | [Sloper timeline][sl11h] |
| About 1984 | Jokers barred from singles and pairs | [Sloper timeline][sl11h] |
| 1999 | American Mah-Jongg Association formed | [Sloper timeline][sl11h] |
| 2024 | "No picking or looking ahead" dropped from the card | [Sloper timeline][sl11h] |

- **Why it diverged.** Women players in the 1930s reshaped the game, and the NMJL made their changes official. Sloper says the American game "was designed by women, to be enjoyed by women" ([Sloper FAQ 19][sl19]). The founders were after simplicity, speed, and standard rules ([Heinz excerpt][heinz-tablet]). Heinz says the rules kept changing for about 20 years before settling in the early 1960s ([OPB][heinz-opb]). **Confidence: High.**
- **The Charleston.** Its origin and the source of its name are undocumented. One source places it before 1937 ([Jewish Journal][jj]). **Confidence: Low.**
- **Another American branch.** After World War II, the Wright-Patterson style, played largely by military officers' wives, existed alongside the NMJL game ([Library Journal][lj-heinz]).

---

## 8. What the tiles look like: notes for custom art

### 8.1 Indices and materials

- **Western indices.** Arabic numerals and Roman letters were added to tiles when Babcock began importing sets around 1920. Sets made for Chinese players had none, and players simply counted the bamboo sticks ([Sloper FAQ 7e][sl7e]; [Sloper on Babcock][slbab]).
  - **Disagreement over the date:** Babcock claimed to have added the indices in July 1919. A writer of the 1920s (Foster) recorded a claim of English numerals on a set as early as 1914 and called adding them "an intermittent practice" ([Stanwick, Part 1][st-part1]).
  - Without indices, players have to read Chinese characters to tell the Craks and Winds apart ([Sloper FAQ 7b][sl7b]). Sloper notes that those are the tiles that most need big indices ([FAQ 7s][sl7s]).
- **Materials of vintage American sets:**
  - 1920s Chinese imports were bone backed with bamboo ([Sloper FAQ 7c][sl7c]).
  - 1930s American sets were mostly Bakelite, usually a yellow-orange "butterscotch," along with Catalin ([FAQ 7c][sl7c]).
  - Two-tone vinyl tiles probably date from the 1950s. Modern sets are white vinyl plastic with brightly painted stamped faces ([FAQ 7c][sl7c]).
- **Dragons in older American sets.** These often show pictures instead of Chinese characters ([Sloper FAQ 7b][sl7b]). Examples include smoke-breathing creatures, winged green dragons aimed at Western buyers, and in one set a "White Dragon" that is actually a snake ([Mahjong Treasures, dragons][mt-dragons]).
- **Tile proportions.** A typical American tile measures about 30 x 21 x 13 mm; large-format sets run about 35 x 25 mm ([Sloper FAQ 7s][sl7s]). That gives tile art a face ratio of roughly 0.7 (width to height).

### 8.2 Tile-by-tile recognition checklist

| Tile | Traditional face | Common American additions | Keep for recognizability | Expect variation | Sources |
|---|---|---|---|---|---|
| Bams 2 to 9 | Sticks (strings of coins) in fixed counts. Green, with red accents on the 5, 7, and 9 in many sets. | Arabic numeral in the corner | The stick motif and an exact count. Chinese players identified these tiles by counting sticks. | Stick colors (green, blue, red) and layout details | [Wikipedia][wp-tiles]; [Sloper 7e][sl7e]; [Sloper 7s][sl7s] |
| 1 Bam | A bird: sparrow-like in Chinese sets, peacock in Japanese sets | "1" index | A single bird plus the index | Species and pose; rare bamboo-shoot versions | [Wikipedia][wp-tiles]; [Sloper 7e][sl7e] |
| Craks 1 to 9 | Chinese numeral on top, red 萬 below | Arabic numeral (essential for non-readers) | Red 萬 under a Chinese numeral | Simple 万 versus full 萬 | [Wikipedia][wp-tiles]; [Sloper 7e][sl7e]; [Sloper 7s][sl7s] |
| Dots 1 to 9 | Coins drawn as nested circles in fixed counts. Red center coin on the 5; an ornate single coin on the 1. | Arabic numeral | The coin motif and an exact count | Decoration of the 1 Dot; coin colors | [Stanwick, Part 1][st-part1] |
| Winds | 東 南 西 北, in black or blue | Letters E, S, W, N (essential) | The character plus the letter | Character color | [Oh My Mahjong][omm-pregame]; [Wikipedia][wp-tiles]; [Sloper 7b][sl7b] |
| Red Dragon | 中 in red | Sometimes a pictorial red dragon; "C" or an added "R" | Red color plus 中 or a clearly distinct red figure | Character versus picture | [Sloper 7e][sl7e]; [Sloper 7s][sl7s] |
| Green Dragon | 發 in green | Sometimes a pictorial green dragon; "F" or an added "G" | Green color plus 發 | Some sets use the same dragon picture in both colors, which is hard to tell apart | [Sloper 7e][sl7e]; [Sloper 7s][sl7s] |
| White Dragon (Soap) | Blank, or a rectangular frame | Sometimes an outline dragon; "B," "P," or 白 | The frame or blank face | Frame style and color | [Sloper 18][sl18]; [Sloper 7e][sl7e] |
| Flowers | Flowers, seasons, or other themed art; numbers 1 to 4 or season abbreviations such as SPR, SUM, AUT, WIN | Nothing standard; Sloper suggests adding an "F" sticker | A picture tile that is clearly not a suit or honor tile | Very wide | [Sloper 7e-F][sl7ef]; [Sloper 7s][sl7s] |
| Joker | In American sets, the word "Joker" | Artwork varies (for example, a gold squiggle dragon) | The word JOKER | The art | [Sloper 7b][sl7b]; [Sloper 7e-J][sl7ej] |

### 8.3 Accessibility

- **Red/green color blindness.** This is the obvious risk for telling the Red and Green Dragons apart, and for any color cues separating Craks (red) from Bams (green). Character dragons can be told apart by 中 versus 發. Pictorial sets that draw the same dragon in both colors are hard. Players work around this with "R" and "G" stickers, sets with the color names printed on the dragons, or small marks such as a red-filled dot ([Sloper FAQ 7s][sl7s]).
- **The card's ink colors.**
  - The NMJL card prints hands in three ink colors. The number of colors in a hand tells you how many suits it uses; the colors do not name particular suits. Blue marks suitless tiles such as flowers, winds, and zeros ([Sloper FAQ 16][sl16]).
  - For color-blind players, Sloper relays the idea of underlining the green symbols and overlining the red ones ([FAQ 7s][sl7s]).
  - The app's cheat sheet should therefore not rely on red and green alone.
- **Low vision:**
  - The NMJL sells a large-print card ([NMJL store][nmjl-store]).
  - Large-index sets exist. Readers praise one large-numeral set because "the wind or number easily covers half the tile" and the dragons have their color names printed on them.
  - Advice for buyers: pick very white tiles with a crisp imprint, and avoid backs with glare or busy patterns. A braille mahjong set and stick-on braille are also available.
  - Sources: [Sloper FAQ 7s][sl7s].
- **Designer sets:**
  - Some add accessibility, such as printed color names and big numerals ([Sloper FAQ 7s][sl7s]).
  - Some replace traditional symbols outright; one brand's Craks use lightning bolts ([The Mahjong Line, Wolf][tml-wolf]).
  - Heinz warns that "the recognizable tiles are what keep the game connected as a form of Mahjong." She also notes that a shared tile design is "a point of contention right now, with some American Mahjong manufacturers" ([OPB][heinz-opb]).

### 8.4 Recommendations for the app's tile art

These follow from the findings above. They are recommendations, not sourced facts.

1. **Keep each suit's visual language:** sticks for Bams, nested-circle coins for Dots, and Chinese numeral over red 萬 for Craks. Stick and coin counts must be exact, and arrangements should stay close to traditional layouts. Check the specific layouts against a physical reference set, since I did not find a sourced layout spec.
2. **Show both the traditional face and a Western index, as American sets do.** Give Craks and Winds the most prominent indices.
3. **Never use color as the only cue.** Pair 中 and 發 with "R" and "G" (or "C" and "F") and consider a distinct shape for each. On the cheat sheet, add patterns or labels alongside red and green ink.
4. **Draw Soap as a framed rectangle.** In year-hand lessons, add a small "0" helper label so learners see it standing in for zero.
5. **Give the 1 Bam a bird with a clear "1" index.** The tutorial can explain why the 1 Bam is a bird.
6. **Vary the flower art but mark every flower with a consistent "F."** That teaches interchangeability.
7. **Print the word "JOKER" on jokers.**
8. **Use original art.** Avoid echoing any designer brand's motifs, given the current disputes Heinz mentions.
9. **Screen-reader labels.** The Unicode Mahjong Tiles block (U+1F000 to U+1F02F, added in Unicode 5.1 in 2008) gives standard names such as "MAHJONG TILE WHITE DRAGON" that can be adapted for screen-reader labels ([codepoints.net][unicode]).

---

## 9. Where sources disagree

1. **What a myriad counted:** 10,000 coins ([Wikipedia][wp-tiles]), myriads of strings ([Sloper 18][sl18]), or 10,000 strings of 1,000 coins ([WOPC][wopc]).
2. **When indices first appeared:** 1914 (a claim Foster recorded), July 1919 (Babcock's claim), or 1920 (first Red Book) ([Stanwick, Part 1][st-part1]; [Sloper on Babcock][slbab]).
3. **Who invented mahjong:** Chen Yumen, whom Sloper inclines to accept ([11c][sl11c]), versus a story Wikipedia calls "probably forged" ([Wikipedia: Mahjong][wp-mj]). Ningbo versus Fujian; Shanghai area ([Heinz][heinz-opb]) versus "southern China" ([LJ review][lj-heinz]).
4. **Origin of the Chinese name:** sparrow plus a Wu-dialect suffix ([Wiktionary][wikt-majiang]; [Stanwick and Xu][st-terms]), a sound-alike descent from 馬吊 ([Tam][tam]), or the folk "sparrow chatter" story ([Sloper 11][sl11]).
5. **Why the 1 Bam is a bird:** a stylized string that evolved ([Sloper 7e][sl7e]; [Wikipedia][wp-tiles]; [Watson][tml-watson]), the sparrow pun (Sloper doubts it), or the grain-protection legend ([UpToGo][uptogo], which Tam rejects).
6. **Why Soap is called Soap:** it looked like a bar of soap ([Sloper 7e][sl7e]; [Wikipedia][wp-tiles]) versus a "fireworks target" ([Wolf][tml-wolf], unsourced).
7. **What the dragons mean:** the literal readings (center, get rich, white) versus the archery or "arrow tiles" theory, versus the sparrow-reward folk tale ([Wikipedia][wp-tiles]; [Tam][tam]).
8. **Etymology of "chow":** Chinese 吃 chī ([Wikipedia: Mahjong][wp-mj]) versus pidgin "chow-chow" ([Wiktionary][wikt-chow]).
9. **When flowers stopped being wild:** "1930s to 1960" ([Wikipedia][wp-tiles]) versus "from 1937" until jokers arrived on the 1960 to 1961 card ([Sloper 509][sl509]; [FAQ 19][sl19]). These are compatible but worded differently.
10. **Wind character color:** black ([Oh My Mahjong][omm-pregame]) versus blue ([Wikipedia][wp-tiles]). Both occur, depending on the set.
11. **Year of the Red Book:** 1920 first edition ([Sloper][slbab]) versus 1923 ([Strong Museum][strong], which is the second edition).
12. **Dragon rules in a retail manual:** "the dragons must match" ([Cirquejong][cirque]) conflicts with card hands that call for opposite dragons ([Insider][ins-0202]).

---

## 10. Open questions and weak spots

- **Why and when the dragons were paired with suits,** and when Soap first stood in for zero. No NMJL or historian source was found. The color logic is inference.
- **Where the name "Charleston" comes from,** and the year it entered the game. The best source is a 2011 newspaper article saying the League itself doesn't know.
- **The "X" marking on the card.** I could not verify its meaning (it is commonly read as "exposed hands allowed") within the search budget. "C" for concealed is verified.
- **The 2021 backlash against a designer set,** which I had planned to cite as a design caution. I could not source it before the web search budget ran out. Heinz's 2026 remark about disputes over tile designs is the only sourced caution here.
- **Primary NMJL texts were not consulted.** The rulebook (*Mah Jongg Made Easy*) and the back of the card were not checked directly; NMJL rules are cited through Sloper.
- **Dot and Bam layouts,** meaning exactly where each coin and stick sits, have no sourced spec. Use a physical reference set.
- **Glosses for 條 ("strip") and 筒 ("tube"),** and the claim that Babcock coined "Bamboo" and "Dragons," each rest on a single secondary source or on general knowledge.
- **No statistics on color-blindness rates** were gathered.
- **Licensing, outside my scope.** The NMJL sells the card each year and reproducing its hands in an app may need the League's permission. That is worth checking separately.
- **Possible follow-up searches:** the 1920s Babcock text, for whether he matched dragons to suits; NMJL bulletins; reporting on the 2021 controversy; and an early printed use of the nickname "Soap."

---

## Sources

**Official (NMJL)**
- NMJL home page: https://www.nationalmahjonggleague.org/
- NMJL, "The League" (history): https://www.nationalmahjonggleague.org/league.aspx
- NMJL, "The Game": https://www.nationalmahjonggleague.org/game.aspx
- NMJL store (large-print card): https://www.nationalmahjonggleague.org/store.aspx

**Expert reference: Tom Sloper, sloperama.com**
- FAQ 6, terminology: https://sloperama.com/mjfaq/mjfaq06.html
- FAQ 7b, is my set complete: https://www.sloperama.com/majexchange/tutorial.html
- FAQ 7c, tile materials: https://sloperama.com/majexchange/id.html
- FAQ 7d, racks, pushers, dice, indicators: https://sloperama.com/mjfaq/bits.html
- FAQ 7e, mystery tiles: https://sloperama.com/mjfaq/special.html
- FAQ 7e-F, flowers: https://sloperama.com/mjfaq/specialf.html
- FAQ 7e-J, jokers: https://sloperama.com/mjfaq/specialj.html
- FAQ 7s, sight-impaired and color-blind players: https://www.sloperama.com/mjfaq/mjfaq7s.html
- FAQ 11, history and the name: https://sloperama.com/mjfaq/mjfaq11.html
- FAQ 11b, precursor games: https://sloperama.com/mjfaq/mjfaq11b.html
- FAQ 11c, who created mahjong: https://sloperama.com/mjfaq/mjfaq11c.html
- FAQ 11e, earliest sets: https://sloperama.com/mjfaq/mjfaq11e.html
- FAQ 11h, history timeline: https://sloperama.com/mjfaq/mjfaq11h.html
- FAQ 16, the 2026 card: https://sloperama.com/mjfaq/2026.html
- FAQ on the 2016 card: https://sloperama.com/mjfaq/2016.html
- FAQ 18, symbolism: https://sloperama.com/mjfaq/mjfaq18.html
- FAQ 19, American rules: https://sloperama.com/mjfaq/mjfaq19.html
- Column 509, flower and joker counts: https://sloperama.com/mahjongg/column509a.html
- Column 45, the Charleston analogy: https://sloperama.com/mahjongg/column045.html
- Babcock's Red Book excerpts: https://sloperama.com/cctheory/babcock.html
- Shanghai game manual, basics: https://sloperama.com/shanghai/Images/mjbasic.htm
- Shanghai game manual, American: https://sloperama.com/shanghai/Images/mjamer-1.htm

**Historians and scholarship**
- Annelise Heinz, book excerpt in *Tablet* (May 3, 2021): https://www.tabletmag.com/sections/community/articles/how-mahjong-became-jewish
- Annelise Heinz, OPB *Think Out Loud* interview (July 9, 2026): https://www.opb.org/article/2026/07/09/uo-professor-shares-history-of-mahjong/
- *Library Journal* review of Heinz's book (2021): https://www.libraryjournal.com/review/mahjong-a-chinese-game-and-the-making-of-modern-american-culture-2108892
- Stanwick and Xu, "Máquè/Májiàng/Mahjong Terms 1780 to 1920": https://www.themahjongtileset.co.uk/?p=3975
- Stanwick, "Mahjong(g), before and after Mahjong(g): Part 1": https://www.themahjongtileset.co.uk/tile-set-history/mahjongg-before-and-after-mahjongg-part-1
- Stanwick and Xu, "Flowers and Kings": https://www.themahjongtileset.co.uk/?p=2465
- The Mahjong Tile Set, bamboo set gallery: https://themahjongtileset.co.uk/?p=1550 (consulted; no specific claim relies on it)
- Tam Sai-po, *Revista de Cultura* / 文化雜誌 no. 26 (Macau, 2014): https://www.icm.gov.mo/rc/viewer/pdfViewerParts/10093/2508
- The Strong National Museum of Play, "Chow, Pong, and Kong" (2022): https://www.museumofplay.org/blog/chow-pong-and-kong-mahjong/
- Jewish Museum Milwaukee, "Behind the Card" (2016): https://jewishmuseummilwaukee.org/?p=241447

**Reference works**
- Wikipedia, Mahjong tiles: https://en.wikipedia.org/wiki/Mahjong_tiles
- Wikipedia, American mahjong: https://en.wikipedia.org/wiki/American_mahjong
- Wikipedia, Mahjong: https://en.wikipedia.org/wiki/Mahjong
- Wikipedia, Madiao: https://en.wikipedia.org/wiki/Madiao
- Wikipedia, Joseph Park Babcock: https://en.wikipedia.org/wiki/Joseph_Park_Babcock
- World of Playing Cards (Pollett), Chinese regional cards: https://wopc.co.uk/China/regional-cards-China-and-hong-kong
- Merriam-Webster, mah-jongg: https://www.merriam-webster.com/dictionary/mah-jongg
- Wiktionary: pung, https://en.wiktionary.org/wiki/pung ; kong, https://en.wiktionary.org/wiki/kong ; chow, https://en.wiktionary.org/wiki/chow ; 麻將, https://en.wiktionary.org/wiki/%E9%BA%BB%E5%B0%87 ; 中, https://en.wiktionary.org/wiki/%E4%B8%AD ; 白, https://en.wiktionary.org/wiki/%E7%99%BD ; 索, https://en.wiktionary.org/wiki/%E7%B4%A2 ; 槓, https://en.wiktionary.org/wiki/%E6%A7%93
- Jyutjyu (words.hk), 索子: https://jyutjyu.com/en/word/%E7%B4%A2%E5%AD%90
- codepoints.net, U+1F006 MAHJONG TILE WHITE DRAGON: https://codepoints.net/U+1F006

**Press**
- *Jewish Journal*, "The Charleston" (2011): https://jewishjournal.com/uncategorized/86628/

**Primary historical text**
- L. L. Harr, *Pung Chow* (1922), Project Gutenberg: https://www.gutenberg.org/ebooks/27318

**Collector, retail, and newsletter sources (weaker; used for support or as examples)**
- Mahjong Treasures, "A Brief History of Mahjong": https://www.mahjongtreasures.com/a-brief-history-of-mahjong/
- Mahjong Treasures, "One of a Kind Treasure" (the soap tile): https://www.mahjongtreasures.com/2021/01/01/one-of-a-kind-treasure/
- Mahjong Treasures, "Dragons in Chinese Art and Mahjong Part 3": https://www.mahjongtreasures.com/2014/03/31/dragons-in-chinese-art-and-mahjong-part-3/
- Oh My Mahjong, tile guide: https://ohmymahjong.com/blogs/the-game-of-mahjong/mahjong-pre-game-get-to-know-your-tiles-setting-up
- Oh My Mahjong, history page: https://ohmymahjong.com/pages/america-s-embrace-the-history-of-american-mahjong
- I Love Mahj, tile counts: https://ilovemahj.com/mah-jongg-question/641/what-tiles-are-used-in-american-mah-jongg-and-how-many-of-each-are-there
- The Mahjong Line, Tony Watson on tile design history (2021): https://themahjongline.com/blogs/mahjong-tales/mahjong-tile-set-design-tony-watson
- The Mahjong Line, Yvonne Liu Wolf, "Putting the BAM in Mahjong" (2021): https://themahjongline.com/blogs/mahjong-tales/putting-the-bam-in-mahjong
- The Mah Jongg Insider, Feb. 2026: https://mahjong.beehiiv.com/p/0202klp8
- The Mah Jongg Insider, Apr. 2026: https://mahjong.beehiiv.com/p/0427vxd6
- Cirquejong retail set manual: https://scene7.samsclub.com/is/content/samsclub/0085007654811_PDF
- UpToGo (Taiwan), "麻雀一番" (2025): https://uptogo.com.tw/?p=135620

[nmjl-home]: https://www.nationalmahjonggleague.org/
[nmjl-league]: https://www.nationalmahjonggleague.org/league.aspx
[nmjl-game]: https://www.nationalmahjonggleague.org/game.aspx
[nmjl-store]: https://www.nationalmahjonggleague.org/store.aspx
[sl6]: https://sloperama.com/mjfaq/mjfaq06.html
[sl7b]: https://www.sloperama.com/majexchange/tutorial.html
[sl7c]: https://sloperama.com/majexchange/id.html
[sl7d]: https://sloperama.com/mjfaq/bits.html
[sl7e]: https://sloperama.com/mjfaq/special.html
[sl7ef]: https://sloperama.com/mjfaq/specialf.html
[sl7ej]: https://sloperama.com/mjfaq/specialj.html
[sl7s]: https://www.sloperama.com/mjfaq/mjfaq7s.html
[sl11]: https://sloperama.com/mjfaq/mjfaq11.html
[sl11b]: https://sloperama.com/mjfaq/mjfaq11b.html
[sl11c]: https://sloperama.com/mjfaq/mjfaq11c.html
[sl11e]: https://sloperama.com/mjfaq/mjfaq11e.html
[sl11h]: https://sloperama.com/mjfaq/mjfaq11h.html
[sl16]: https://sloperama.com/mjfaq/2026.html
[sl2016]: https://sloperama.com/mjfaq/2016.html
[sl18]: https://sloperama.com/mjfaq/mjfaq18.html
[sl19]: https://sloperama.com/mjfaq/mjfaq19.html
[sl509]: https://sloperama.com/mahjongg/column509a.html
[sl45]: https://sloperama.com/mahjongg/column045.html
[slbab]: https://sloperama.com/cctheory/babcock.html
[slbasic]: https://sloperama.com/shanghai/Images/mjbasic.htm
[slamer]: https://sloperama.com/shanghai/Images/mjamer-1.htm
[st-terms]: https://www.themahjongtileset.co.uk/?p=3975
[st-part1]: https://www.themahjongtileset.co.uk/tile-set-history/mahjongg-before-and-after-mahjongg-part-1
[st-kings]: https://www.themahjongtileset.co.uk/?p=2465
[tam]: https://www.icm.gov.mo/rc/viewer/pdfViewerParts/10093/2508
[uptogo]: https://uptogo.com.tw/?p=135620
[heinz-tablet]: https://www.tabletmag.com/sections/community/articles/how-mahjong-became-jewish
[heinz-opb]: https://www.opb.org/article/2026/07/09/uo-professor-shares-history-of-mahjong/
[lj-heinz]: https://www.libraryjournal.com/review/mahjong-a-chinese-game-and-the-making-of-modern-american-culture-2108892
[strong]: https://www.museumofplay.org/blog/chow-pong-and-kong-mahjong/
[jmm]: https://jewishmuseummilwaukee.org/?p=241447
[jj]: https://jewishjournal.com/uncategorized/86628/
[wopc]: https://wopc.co.uk/China/regional-cards-China-and-hong-kong
[wp-tiles]: https://en.wikipedia.org/wiki/Mahjong_tiles
[wp-am]: https://en.wikipedia.org/wiki/American_mahjong
[wp-mj]: https://en.wikipedia.org/wiki/Mahjong
[wp-madiao]: https://en.wikipedia.org/wiki/Madiao
[wp-babcock]: https://en.wikipedia.org/wiki/Joseph_Park_Babcock
[wikt-pung]: https://en.wiktionary.org/wiki/pung
[wikt-kong]: https://en.wiktionary.org/wiki/kong
[wikt-chow]: https://en.wiktionary.org/wiki/chow
[wikt-majiang]: https://en.wiktionary.org/wiki/%E9%BA%BB%E5%B0%87
[wikt-zhong]: https://en.wiktionary.org/wiki/%E4%B8%AD
[wikt-bai]: https://en.wiktionary.org/wiki/%E7%99%BD
[wikt-suo]: https://en.wiktionary.org/wiki/%E7%B4%A2
[wikt-gang]: https://en.wiktionary.org/wiki/%E6%A7%93
[jyutjyu]: https://jyutjyu.com/en/word/%E7%B4%A2%E5%AD%90
[mw]: https://www.merriam-webster.com/dictionary/mah-jongg
[mt-history]: https://www.mahjongtreasures.com/a-brief-history-of-mahjong/
[mt-soap]: https://www.mahjongtreasures.com/2021/01/01/one-of-a-kind-treasure/
[mt-dragons]: https://www.mahjongtreasures.com/2014/03/31/dragons-in-chinese-art-and-mahjong-part-3/
[omm-pregame]: https://ohmymahjong.com/blogs/the-game-of-mahjong/mahjong-pre-game-get-to-know-your-tiles-setting-up
[omm-history]: https://ohmymahjong.com/pages/america-s-embrace-the-history-of-american-mahjong
[ilm-tiles]: https://ilovemahj.com/mah-jongg-question/641/what-tiles-are-used-in-american-mah-jongg-and-how-many-of-each-are-there
[tml-watson]: https://themahjongline.com/blogs/mahjong-tales/mahjong-tile-set-design-tony-watson
[tml-wolf]: https://themahjongline.com/blogs/mahjong-tales/putting-the-bam-in-mahjong
[ins-0202]: https://mahjong.beehiiv.com/p/0202klp8
[ins-0427]: https://mahjong.beehiiv.com/p/0427vxd6
[cirque]: https://scene7.samsclub.com/is/content/samsclub/0085007654811_PDF
[harr]: https://www.gutenberg.org/ebooks/27318
[unicode]: https://codepoints.net/U+1F006
