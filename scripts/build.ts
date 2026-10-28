/**
 * Build the playable page: bundle the engine and screen code into one script, inline it with the
 * styles, and write two files:
 *   dist/mahjong.html        the page published as the private Claude artifact (no <html> wrapper;
 *                            the artifact host adds one)
 *   dist/mahjong-local.html  the same page wrapped as a full document, for local testing
 * Preact (the small screen library) loads from the jsDelivr CDN, as the artifact host prefers.
 *
 *   npm run build
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { build, transform, type Plugin } from 'esbuild';

const PREACT_VERSION = '10.29.8';
export const PREACT_URL = `https://cdn.jsdelivr.net/npm/preact@${PREACT_VERSION}/dist/preact.min.umd.js`;
export const HOOKS_URL = `https://cdn.jsdelivr.net/npm/preact@${PREACT_VERSION}/hooks/dist/hooks.umd.js`;
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap';

/** Map `preact` and `preact/hooks` imports to the globals the CDN scripts define. */
const cdnGlobals: Plugin = {
  name: 'cdn-globals',
  setup(b) {
    b.onResolve({ filter: /^preact(\/hooks)?$/ }, (args) => ({ path: args.path, namespace: 'cdn-global' }));
    b.onLoad({ filter: /.*/, namespace: 'cdn-global' }, (args) => ({
      contents: args.path === 'preact' ? 'module.exports = window.preact;' : 'module.exports = window.preactHooks;',
      loader: 'js',
    }));
  },
};

async function main(): Promise<void> {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { dependencies?: Record<string, string> };
  if (pkg.dependencies?.preact !== PREACT_VERSION) throw new Error(`package.json pins preact ${pkg.dependencies?.preact}; the page loads ${PREACT_VERSION}.`);

  const js = await build({
    entryPoints: ['src/ui/main.tsx'],
    bundle: true,
    format: 'iife',
    minify: true,
    write: false,
    target: ['es2020', 'safari15', 'chrome100', 'firefox100'],
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    legalComments: 'none',
    plugins: [cdnGlobals],
  });
  const script = (js.outputFiles[0] as { text: string }).text.replace(/<\/script/gi, '<\\/script');
  const css = (await transform(readFileSync('src/ui/styles.css', 'utf8'), { loader: 'css', minify: true })).code;

  const fragment = [
    '<title>Mah Jongg Practice</title>',
    '<meta name="claude:viewport-fit-sides" content="cover">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link rel="stylesheet" href="${FONT_URL}">`,
    `<style>${css}</style>`,
    '<div id="app"><div class="boot">Shuffling the tiles…</div></div>',
    `<script src="${PREACT_URL}"></script>`,
    `<script src="${HOOKS_URL}"></script>`,
    `<script>if(window.preact&&window.preactHooks){${script}}else{document.getElementById("app").innerHTML='<div class="boot">The game could not load its screen library. Check your connection, then reload.</div>'}</script>`,
  ].join('\n');

  // Mirrors the wrapper the artifact host adds: charset, viewport with viewport-fit=cover, a small reset.
  const local = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n${fragment}\n</body></html>\n`;

  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/mahjong.html', `${fragment}\n`);
  writeFileSync('dist/mahjong-local.html', local);
  console.log(`dist/mahjong.html: ${(fragment.length / 1024).toFixed(1)} KB (script ${(script.length / 1024).toFixed(1)} KB, styles ${(css.length / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
