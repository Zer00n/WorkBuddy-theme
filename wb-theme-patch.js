#!/usr/bin/env node
// 用法: node wb-theme-patch.js "D:\Programs\WorkBuddy"
// 依赖: npm i -g @electron/asar ; theme-config.json / wb-skin.css / 图片与本脚本同目录
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path');

const root = process.argv[2];
if (!root) { console.error('用法: node wb-theme-patch.js <安装目录>'); process.exit(1); }
const asar = path.join(root, 'resources', 'app.asar');
const work = path.join(root, 'resources', 'work-extract');
const cfg  = JSON.parse(fs.readFileSync(path.join(__dirname, 'theme-config.json'), 'utf8'));

// 1. 备份 + 解包
fs.copyFileSync(asar, asar + '.bak');
fs.rmSync(work, { recursive: true, force: true });
execSync(`npx @electron/asar extract "${asar}" "${work}"`, { stdio: 'inherit' });

// 2. 从 index.html 动态解析 CSS 文件名（规避 hash 漂移）
const htmlPath = path.join(work, 'renderer', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
const cssFiles = [...html.matchAll(/href="\.\/(assets\/[^"]+\.css)"/g)].map(m => m[1]);
console.log('定位到 CSS:', cssFiles);

// 3. 块内替换：仅在目标主题选择器的 {...} 范围内改值
function patchBlocks(css, themeName, tokens) {
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockRe = new RegExp(
    `((?:body)?\\[data-vscode-theme-name="${esc(themeName)}"\\][^{]*\\{)([^}]*)(\\})`, 'g');
  let hits = 0;
  css = css.replace(blockRe, (_, head, body, tail) => {
    for (const [token, val] of Object.entries(tokens)) {
      const tokenRe = new RegExp(`(${esc(token)}\\s*:\\s*)[^;}]+`, 'g');
      if (tokenRe.test(body)) { body = body.replace(tokenRe, `$1${val}`); hits++; }
    }
    return head + body + tail;
  });
  return { css, hits };
}

let totalHits = 0;
for (const rel of cssFiles) {
  const p = path.join(work, 'renderer', rel);
  let css = fs.readFileSync(p, 'utf8');
  for (const [name, tokens] of [['IDE Light', cfg.lightTokens], ['IDE Night', cfg.darkTokens]]) {
    const r = patchBlocks(css, name, tokens);
    css = r.css; totalHits += r.hits;
    if (r.hits) console.log(`  ${rel} :: ${name} 替换 ${r.hits} 项`);
  }
  fs.writeFileSync(p, css);
}
if (totalHits === 0) { console.error('警告: 0 项命中，检查主题名/CSS 定位'); process.exit(1); }

// 4. 皮肤层：拷文件 + 注入 link（幂等）
const assetsDir = path.join(work, 'renderer', 'assets');
for (const f of [cfg.skin.cssFile, ...cfg.skin.assets])
  fs.copyFileSync(path.join(__dirname, f), path.join(assetsDir, f));
if (!html.includes(cfg.skin.linkTag))
  html = html.replace('</head>', `  ${cfg.skin.linkTag}\n</head>`);
fs.writeFileSync(htmlPath, html);

// 5. 重打包 + 清缓存提示
execSync(`npx @electron/asar pack "${work}" "${asar}"`, { stdio: 'inherit' });
console.log('\n完成。请手动清理 %USERPROFILE%\\.workbuddy\\app\\session\\Cache 后启动验证。');
console.log('回滚: 恢复 app.asar.bak');
