#!/usr/bin/env node
// 用法: node wb-theme-patch.js "D:\Programs\WorkBuddy"
// 依赖: @electron/asar (脚本会自动从本地 node_modules 或 npx 缓存中加载；如都没有请先 `npm i @electron/asar`)
//
// 说明: 部分 WorkBuddy 安装包的 app.asar 头信息里把原生模块(如 ripgrep)记录成了
//       非本平台的外部解包路径(例如 x64-linux)，而 Windows 上实际只有 x64-win32，
//       直接用 `asar extract` 会因找不到这些文件而整体报错(ENOENT)。
//       本脚本改用 @electron/asar 的 JS API 做"容错解包 + 精确重打包"：
//       - 普通文件直接从 asar 内读取
//       - 外部解包文件从 app.asar.unpacked 拷贝，非本平台/缺失的外部文件直接跳过
//       - 重打包时用 createPackageFromStreams 按原始 unpacked 标志精确还原布局
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = process.argv[2];
if (!root) { console.error('用法: node wb-theme-patch.js <安装目录>'); process.exit(1); }

const asarPath = path.join(root, 'resources', 'app.asar');
const unpackedDir = asarPath + '.unpacked';
const work = path.join(root, 'resources', 'work-extract');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'theme-config.json'), 'utf8'));

// 容错加载 @electron/asar (ESM)
async function resolveAsar() {
  // 1) 本地 node_modules
  try { return await import('@electron/asar'); } catch (_) {}
  // 2) npx 缓存 (之前 `npx @electron/asar` 下载过)
  const npmCache = path.join(os.homedir(), 'AppData', 'Local', 'npm-cache', '_npx');
  if (fs.existsSync(npmCache)) {
    for (const d of fs.readdirSync(npmCache)) {
      const p = path.join(npmCache, d, 'node_modules', '@electron', 'asar', 'lib', 'asar.js');
      if (fs.existsSync(p)) return await import('file://' + p.replace(/\\/g, '/'));
    }
  }
  console.error('未找到 @electron/asar，请先运行: npm i @electron/asar');
  process.exit(1);
}

// 块内替换：仅在目标主题选择器的 {...} 范围内改值
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

// 平台匹配：当前只保留本平台(x64-win32)需要的外部文件，丢弃其它平台(x64-linux/darwin/mas)
function isForeignPlatform(rel) {
  return /(^|[/\\])(x64|ia32|arm64|universal)-(linux|darwin|mas)([/\\]|$)/.test(rel);
}

(async () => {
  const asar = await resolveAsar();
  if (!fs.existsSync(asarPath)) { console.error('找不到', asarPath); process.exit(1); }

  // 1. 备份
  fs.copyFileSync(asarPath, asarPath + '.bak');
  console.log('已备份 app.asar -> app.asar.bak');

  // 2. 读头枚举全部文件（unpacked 标志会沿目录继承）
  //    注意: Windows 下 @electron/asar 的 getFile/extractFile 按 path.sep 切分路径，
  //    因此这里用 path.join 生成路径(Windows 下为反斜杠)，否则会报 "not found in this archive"。
  const header = asar.getRawHeader(asarPath).header;
  const entries = [];
  (function walk(node, dir, ancestorUnpacked) {
    for (const [name, info] of Object.entries(node.files || {})) {
      const rel = dir ? path.join(dir, name) : name;
      const unpacked = !!info.unpacked || ancestorUnpacked;
      if (info.files) { entries.push({ rel, type: 'directory', unpacked }); walk(info, rel, unpacked); }
      else if (info.link != null) { entries.push({ rel, type: 'link', unpacked, link: info.link }); }
      else { entries.push({ rel, type: 'file', unpacked, executable: !!info.executable }); }
    }
  })(header, '', false);

  // 3. 容错解包到 work
  //    注意: 某些环境下(如 WorkBuddy 自身 CLI 的安全删除 shim) fs.rmSync 在受保护目录会失败，
  //    这里忽略删除错误——解包步骤会覆盖写入所需文件，残留的少数临时文件不影响结果。
  try { fs.rmSync(work, { recursive: true, force: true }); } catch (_) {}
  fs.mkdirSync(work, { recursive: true });
  let skipped = 0;
  for (const e of entries) {
    const destFile = path.join(work, e.rel);
    if (e.type === 'directory') { fs.mkdirSync(destFile, { recursive: true }); continue; }
    if (e.type === 'link') {
      try { fs.mkdirSync(path.dirname(destFile), { recursive: true }); fs.symlinkSync(e.link, destFile); } catch (_) {}
      continue;
    }
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    if (e.unpacked) {
      const src = path.join(unpackedDir, e.rel);
      if (!fs.existsSync(src)) {
        if (isForeignPlatform(e.rel)) { skipped++; console.warn('跳过非本平台外部文件:', e.rel); continue; }
        skipped++; console.warn('跳过缺失外部文件:', e.rel); continue;
      }
      fs.copyFileSync(src, destFile);
    } else {
      const buf = asar.extractFile(asarPath, e.rel);
      fs.writeFileSync(destFile, buf);
    }
  }
  console.log(`解包完成；跳过 ${skipped} 个非本平台/缺失外部文件`);

  // 4. 定位 CSS 并打补丁
  const htmlPath = path.join(work, 'renderer', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const cssFiles = [...html.matchAll(/href="\.\/(assets\/[^"]+\.css)"/g)].map(m => m[1]);
  console.log('定位到 CSS:', cssFiles);

  // 先把皮肤层文件拷入 assets（保证存在），补丁循环里跳过它们本身
  const assetsDir = path.join(work, 'renderer', 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  const skinFiles = new Set([cfg.skin.cssFile, ...cfg.skin.assets]);
  for (const f of skinFiles) {
    const srcF = path.join(__dirname, f);
    if (fs.existsSync(srcF)) fs.copyFileSync(srcF, path.join(assetsDir, f));
  }

  // 关键修复: 把"新增的皮肤层文件"登记进 entries。
  // 下面的重打包是基于"原始 asar 头枚举"的 entries 精确还原布局的，
  // 若不补登记，下面写到 work/renderer/assets/ 的 wb-skin.css / wb-hero-dark.webp
  // 不会被写回 app.asar，导致 index.html 里的 <link> 指向 404，背景图静默失效。
  for (const f of skinFiles) {
    const rel = path.join('renderer', 'assets', f);
    if (!entries.some(e => e.rel === rel)) entries.push({ rel, type: 'file', unpacked: false });
  }

  let totalHits = 0;
  for (const rel of cssFiles) {
    if (skinFiles.has(rel)) continue; // 皮肤样式不参与 token 替换
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

  // 5. 注入皮肤 link（幂等）
  if (!html.includes(cfg.skin.linkTag))
    html = html.replace('</head>', `  ${cfg.skin.linkTag}\n</head>`);
  fs.writeFileSync(htmlPath, html);

  // 6. 重打包（精确还原 unpacked 布局）
  //    不删除旧的 app.asar.unpacked：createPackageFromStreams 会覆盖写入，
  //    且本场景下新解包文件集合与旧集合一致(仅丢弃磁盘上本就缺失的异平台文件)，不会残留。
  const streams = [];
  for (const e of entries) {
    if (e.type === 'directory') { streams.push({ path: e.rel, type: 'directory', unpacked: e.unpacked }); continue; }
    if (e.type === 'link') { streams.push({ path: e.rel, type: 'link', unpacked: e.unpacked, symlink: e.link, stat: { mode: 0 } }); continue; }
    const srcFile = path.join(work, e.rel);
    if (!fs.existsSync(srcFile)) { console.warn('重打包跳过(无内容):', e.rel); continue; }
    const st = fs.statSync(srcFile);
    streams.push({
      path: e.rel,
      type: 'file',
      unpacked: e.unpacked,
      stat: { mode: st.mode, size: st.size },
      streamGenerator: () => fs.createReadStream(srcFile),
    });
  }
  await asar.createPackageFromStreams(asarPath, streams);
  console.log('\n完成。请清理缓存后启动验证:');
  console.log('  Remove-Item -Recurse -Force "$env:USERPROFILE\\.workbuddy\\app\\session\\Cache"');
  console.log('回滚: 恢复 app.asar.bak');
})().catch(e => { console.error('失败:', e); process.exit(1); });
