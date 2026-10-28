/**
 * Browser check of the built page (dist/mahjong-local.html, served from a local web server): plays whole
 * games by tapping the screen like a person would, at Mac and iPhone sizes (including iPhone screens with
 * the browser's toolbars showing), and saves screenshots along the way. It fails on any page error, a page
 * wider than the screen, a stuck game, a game that never ends, or a reload that doesn't resume the game.
 *
 * Needs Playwright with Chromium (installed in Claude's build environment, not part of npm install):
 *   npm run build && node scripts/ui-check.cjs [screenshot-folder] [games-per-size]
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');

/**
 * Serve the built page from a local web server. Opened as a plain file instead, headless Chromium sometimes
 * loses the browser storage across a reload, which would make the resume check fail for no fault of the app.
 */
function serveDist() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const name = path.basename(decodeURIComponent((req.url || '/').split('?')[0])) || 'mahjong-local.html';
      fs.readFile(path.join(ROOT, 'dist', name), (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'dist', 'ui-check'));
const GAMES = Number(process.argv[3] || 1);
const PREACT = fs.readFileSync(path.join(ROOT, 'node_modules/preact/dist/preact.min.umd.js'));
const HOOKS = fs.readFileSync(path.join(ROOT, 'node_modules/preact/hooks/dist/hooks.umd.js'));

const SIZES = [
  { name: 'iphone-portrait', viewport: { width: 390, height: 844 }, dpr: 3, touch: true },
  { name: 'iphone-landscape', viewport: { width: 844, height: 390 }, dpr: 3, touch: true },
  { name: 'iphone-se', viewport: { width: 375, height: 667 }, dpr: 2, touch: true },
  // what a phone browser leaves for the page with its toolbars showing
  { name: 'iphone-safari', viewport: { width: 390, height: 664 }, dpr: 3, touch: true },
  { name: 'iphone-se-safari', viewport: { width: 375, height: 548 }, dpr: 2, touch: true },
  { name: 'mac', viewport: { width: 1280, height: 800 }, dpr: 2, touch: false },
];

function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

async function shot(page, name, shots) {
  if (shots.has(name)) return;
  shots.add(name);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

async function noOverflow(page, where) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  if (o.sw > o.cw + 1) throw new Error(`${where}: the page is wider than the screen (${o.sw} > ${o.cw})`);
}

/** Tap n rack tiles that are not jokers (after putting back any already chosen). */
async function pickTiles(page, n, r) {
  for (const t of await page.$$('.rack-tile[aria-pressed="true"]')) await t.click();
  const tiles = await page.$$('.rack-tile:not([aria-label^="Joker"])');
  const chosen = new Set();
  while (chosen.size < Math.min(n, tiles.length)) chosen.add(Math.floor(r() * tiles.length));
  for (const i of chosen) await tiles[i].click();
}

/** After a move, wait until the table shows it (the step counter changes), so the next look is fresh. */
async function settled(page, before) {
  await page
    .waitForFunction((b) => document.querySelector('.app')?.getAttribute('data-step') !== b, before, { timeout: 4000 })
    .catch(() => {});
}

async function clickButton(page, text) {
  // (dimmed buttons stay tappable: they explain why the move isn't allowed)
  const b = page.locator('.actions .btn', { hasText: text }).first();
  if ((await b.count()) === 0) return false;
  await b.click();
  return true;
}

async function playOneGame(page, size, r, shots, gameIndex) {
  const tag = `${size.name}`;
  for (let step = 0; step < 1500; step++) {
    if (await page.locator('.end').count()) {
      await shot(page, `${tag}-results`, shots);
      await noOverflow(page, `${tag} results`);
      return await page.locator('.end-title').innerText();
    }
    // read the table's state in one go (separate reads could straddle a computer player's move)
    const { before, phase, mine } = await page.evaluate(() => {
      const app = document.querySelector('.app');
      return { before: app.getAttribute('data-step'), phase: app.getAttribute('data-phase'), mine: app.getAttribute('data-waiting-for-you') === 'yes' };
    });
    if (phase === 'ended') {
      // the results open by themselves a moment after the game ends
      await page.waitForSelector('.end', { timeout: 2000 }).catch(() => {});
      if (!(await page.locator('.backdrop').count())) await page.locator('.actions .btn', { hasText: 'See results' }).click();
      continue;
    }
    if (!mine) {
      if (step % 40 === 20) await noOverflow(page, `${tag} step ${step}`);
      if ((await page.locator('.mine .exp-group').count()) > 0) await shot(page, `${tag}-my-exposure`, shots);
      if ((await page.locator('.cell .count').count()) > 2) await shot(page, `${tag}-midgame`, shots);
      await page.waitForTimeout(100);
      continue;
    }
    if (phase === 'charleston') {
      const blindSeg = page.locator('.seg.blind');
      let blind = 0;
      if ((await blindSeg.count()) && r() < 0.3) {
        blind = 1 + Math.floor(r() * 2);
        await blindSeg.locator('.seg-btn', { hasText: String(blind) }).click();
      }
      await pickTiles(page, 3 - blind, r);
      await shot(page, `${tag}-charleston`, shots);
      await page.locator('.actions .btn', { hasText: 'Pass' }).first().click();
      await settled(page, before);
      continue;
    }
    if (phase === 'vote') {
      await clickButton(page, r() < 0.7 ? 'Play the second Charleston' : 'Stop here');
      await settled(page, before);
      continue;
    }
    if (phase === 'courtesyOffer') {
      await shot(page, `${tag}-courtesy`, shots);
      await page.locator('.seg.offer .seg-btn').nth(Math.floor(r() * 4)).click();
      await settled(page, before);
      continue;
    }
    if (phase === 'courtesyPass') {
      const text = await page.locator('.actions').innerText();
      const n = Number(/Pass (\d) across/.exec(text)[1]);
      await pickTiles(page, n, r);
      await page.locator('.actions .btn', { hasText: 'across' }).click();
      await settled(page, before);
      continue;
    }
    if (phase === 'turn') {
      const mj = page.locator('.actions .btn', { hasText: 'Mah Jongg' });
      if ((await mj.count()) && !(await mj.getAttribute('class')).includes('is-dim')) {
        await mj.click();
        await settled(page, before);
        continue;
      }
      const ex = page.locator('.actions .btn', { hasText: 'Joker exchange (' });
      if ((await ex.count()) && r() < 0.7) {
        await ex.click();
        await shot(page, `${tag}-joker-exchange`, shots);
        await page.locator('.choice-list .btn').first().click();
        await settled(page, before);
        continue;
      }
      const change = page.locator('.mine .btn', { hasText: 'Change' });
      if ((await change.count()) && r() < 0.3) {
        await change.click();
        await shot(page, `${tag}-change-exposure`, shots);
        await page.locator('.choice-list .btn').first().click();
        await settled(page, before);
        continue;
      }
      const discard = page.locator('.actions .btn', { hasText: 'Discard' });
      const isLit = async () => !((await discard.getAttribute('class')) || '').includes('is-dim');
      if (!(await isLit())) {
        if (!shots.has(`${tag}-explain`)) {
          // tapping Discard with nothing chosen shows an explanation
          await discard.click();
          await shot(page, `${tag}-explain`, shots);
        }
        await pickTiles(page, 1, r);
        await page
          .waitForFunction(() => [...document.querySelectorAll('.actions .btn')].some((b) => b.textContent.includes('Discard') && !b.classList.contains('is-dim')), null, { timeout: 2000 })
          .catch(() => {});
      }
      await shot(page, `${tag}-turn`, shots);
      await discard.click();
      await settled(page, before);
      continue;
    }
    if (phase === 'callWindow') {
      await shot(page, `${tag}-call`, shots);
      const mj = page.locator('.actions .btn', { hasText: 'Mah Jongg' });
      if ((await mj.count()) && !(await mj.getAttribute('class')).includes('is-dim')) {
        await mj.click();
        await settled(page, before);
        continue;
      }
      const calls = page.locator('.actions .btn:not(.is-dim)', { hasText: /Pung|Kong|Quint|Sextet/ });
      if ((await calls.count()) && r() < 0.6) {
        await calls.first().click();
        await settled(page, before);
        continue;
      }
      await clickButton(page, 'Pass');
      await settled(page, before);
      continue;
    }
    await page.waitForTimeout(100);
  }
  throw new Error(`${tag} game ${gameIndex}: did not finish`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serveDist();
  const pageUrl = `http://127.0.0.1:${server.address().port}/mahjong-local.html`;
  const browser = await chromium.launch();
  const report = [];
  const only = process.env.SIZES ? process.env.SIZES.split(',') : null;
  for (const size of SIZES.filter((s) => !only || only.includes(s.name))) {
    const ctx = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.dpr, hasTouch: size.touch, isMobile: size.touch });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
      if (m.type() === 'warning') console.log(`[${size.name} page warning] ${m.text()}`);
    });
    await page.route('https://cdn.jsdelivr.net/npm/preact@*/dist/preact.min.umd.js', (rt) => rt.fulfill({ body: PREACT, contentType: 'text/javascript' }));
    await page.route('https://cdn.jsdelivr.net/npm/preact@*/hooks/dist/hooks.umd.js', (rt) => rt.fulfill({ body: HOOKS, contentType: 'text/javascript' }));
    await page.route('https://fonts.googleapis.com/**', (rt) => rt.fulfill({ body: '', contentType: 'text/css' }));
    await page.route('https://fonts.gstatic.com/**', (rt) => rt.abort());
    // fast computer players for the check
    await page.addInitScript(() => {
      try {
        if (!localStorage.getItem('mahjong-practice:prefs')) localStorage.setItem('mahjong-practice:prefs', JSON.stringify({ speed: 'fast' }));
      } catch (e) {}
    });
    await page.goto(pageUrl);
    await page.waitForSelector('.rack-tile');
    const shots = new Set();
    await shot(page, `${size.name}-start`, shots);
    await noOverflow(page, `${size.name} start`);
    const r = rand(1234 + size.viewport.width);
    const results = [];
    for (let g = 0; g < GAMES; g++) {
      try {
        results.push(await playOneGame(page, size, r, shots, g));
      } catch (e) {
        await page.screenshot({ path: path.join(OUT, `${size.name}-FAILED.png`) });
        fs.writeFileSync(path.join(OUT, `${size.name}-FAILED.html`), await page.content());
        throw e;
      }
      await page.locator('.end .btn', { hasText: 'Next game' }).click();
      await page.waitForSelector('.rack-tile');
    }
    // the cheat sheet and settings
    await page.locator('.tb-nav .btn', { hasText: 'Card' }).click();
    await shot(page, `${size.name}-cheat-sheet`, shots);
    await page.locator('#hide-concealed').check();
    await shot(page, `${size.name}-cheat-sheet-hidden`, shots);
    await page.locator('#hide-concealed').uncheck();
    await page.locator('.sheet-head .btn').click();
    await page.locator('.tb-nav .btn', { hasText: 'Settings' }).click();
    await shot(page, `${size.name}-settings`, shots);
    await page.locator('.sheet-head .btn').click();
    // a reload resumes the same game
    const before = await page.locator('.tb-game').innerText().catch(() => '');
    const rackBefore = await page.$$eval('.rack-tile', (els) => els.map((e) => e.getAttribute('aria-label')).join(','));
    fs.writeFileSync(path.join(OUT, `${size.name}-saved-before-reload.json`), (await page.evaluate(() => localStorage.getItem('mahjong-practice:game'))) || '');
    const savedBefore = await page.evaluate(() => {
      const raw = localStorage.getItem('mahjong-practice:game');
      if (!raw) return 'nothing saved';
      const g = JSON.parse(raw);
      return `saved game ${g.state.gameNumber}, phase ${g.state.phase.name}, ${g.state.actionCount} actions`;
    });
    await page.reload();
    await page.waitForSelector('.rack-tile');
    const rackAfter = await page.$$eval('.rack-tile', (els) => els.map((e) => e.getAttribute('aria-label')).join(','));
    const after = await page.locator('.tb-game').innerText().catch(() => '');
    if (rackAfter !== rackBefore || before !== after)
      throw new Error(`${size.name}: a reload did not resume the same game (${savedBefore}).\n before: ${before} ${rackBefore}\n after:  ${after} ${rackAfter}`);
    if (errors.length) throw new Error(`${size.name}: page errors: ${errors.join(' | ')}`);
    report.push({ size: size.name, results, screenshots: shots.size });
    await ctx.close();
  }
  await browser.close();
  server.close();
  console.log(JSON.stringify(report, null, 1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
