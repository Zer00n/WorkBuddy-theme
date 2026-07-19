# WorkBuddy 主题工具

自定义 WorkBuddy 暗色主题，支持更换背景图并自动适配配色。

## 快速使用

### 1. 自定义开发主题

将 `wbtheme-command.md` 直接扔到 WorkBuddy 里安装技能即可。

### 2. 环境准备

- 安装 [Node.js](https://nodejs.org/)
- 关闭 WorkBuddy（否则 `app.asar` 被占用，重打包会失败或写入不完整）

### 3. 应用主题

> ⚠️ **必须用根目录的增强版 `wb-theme-patch.js`**，不要从 `银狼/`、`樱花树/` 等主题文件夹里运行旧脚本（见下文「常见问题」）。

```powershell
# 运行 patch 脚本（路径替换为你的 WorkBuddy 安装目录）
node wb-theme-patch.js "D:\Programs\WorkBuddy"

# 清除缓存
Remove-Item -Recurse -Force "$env:USERPROFILE\.workbuddy\app\session\Cache"

# 启动 WorkBuddy 验证
```

### 4. 切换整套主题（如 银狼 / 樱花树）

每个主题文件夹（`银狼/`、`樱花树/` 等）都是一套**完整主题包**（含 `theme-config.json`、`wb-skin.css`、`wb-hero-dark.webp`、`wb-theme-patch.js`）。

换主题时：

1. 把目标主题文件夹里的 `theme-config.json`、`wb-skin.css`、`wb-hero-dark.webp` **复制覆盖到根目录**；
2. **不要覆盖根目录的 `wb-theme-patch.js`**（根目录是增强版，各主题文件夹里的是旧版）；
3. 完全退出 WorkBuddy；
4. 运行根目录增强脚本：`node wb-theme-patch.js "D:\Programs\WorkBuddy"`；
5. 清缓存、重启。

### 5. 仅更换背景图

替换根目录的 `wb-hero-dark.webp` 为你的图片，重新运行上面的 patch 脚本即可。

## ⚠️ 背景图不生效？先看这里（已修复）

### 现象

运行 patch 后，界面**配色变了，但背景图不显示**，且脚本全程无报错、正常打印“完成”。

### 根因

旧版 `wb-theme-patch.js` 在重打包（第 6 步）时，只遍历 `entries`——
而 `entries` 是解包前从**原始 asar 头**枚举的快照。皮肤层文件
`renderer/assets/wb-skin.css`、`renderer/assets/wb-hero-dark.webp`
是在枚举**之后**才被拷贝进 `work/renderer/assets/` 的，从没被加进 `entries`，
于是 `createPackageFromStreams` 把它们整体丢弃。

`index.html` 里虽然正确注入了
`<link rel="stylesheet" href="./assets/wb-skin.css">`，
但文件在 `app.asar` 中并不存在 → 浏览器请求 404 → 背景静默失效。
由于配色层改的是原有的 CSS 文件（在 `entries` 内），所以颜色会生效、唯独背景图丢失，
正好对应“配色变了但没图”的现象。

### 修复（当前根目录脚本已包含）

在拷贝皮肤文件之后，把这两个文件**补登记进 `entries`**（`unpacked:false`），
重打包即会包含它们。已用 `@electron/asar` API 做单元验证：产物 `listPackage`
明确包含 `renderer/assets/wb-skin.css` 与 `renderer/assets/wb-hero-dark.webp`。

### 另一个常见报错：ENOENT（文件找不到）

如果你从 `银狼/`、`樱花树/` 等**主题文件夹**里直接运行 `node wb-theme-patch.js`，
用的是**旧版脚本**——它直接调 `npx @electron/asar extract`，
在 Windows 上会因找不到非本平台外部文件（如 `x64-linux`）整体抛 `ENOENT` 报错。

增强版根目录脚本改用 `@electron/asar` 的 JS API 做「容错解包 + 精确重打包」：
普通文件直接从 asar 内读取；外部解包文件从 `app.asar.unpacked` 拷贝；
非本平台/缺失的外部文件直接跳过，不再整体报错。

### 额外提醒：安装目录的 app.asar 可能被覆盖

若你更新过 WorkBuddy，安装目录的 `app.asar` 会被新版本替换，连配色层都可能被还原。
遇到“改了主题但完全没效果”，请确认：关闭 WorkBuddy 后重新跑一次 patch 脚本。

## 文件说明

| 文件 | 说明 |
|------|------|
| `theme-config.json` | 主题色值配置（darkTokens） |
| `wb-skin.css` | 皮肤层样式（背景图 + 毛玻璃） |
| `wb-theme-patch.js` | 自动 patch 脚本（**增强版，请从根目录运行**） |
| `wb-hero-dark.webp` | 当前背景图 |
| `银狼/`、`樱花树/` … | 各套完整主题包（切换时复制其 3 个内容文件到根目录） |

## 可用背景主题

项目 `assets/` 目录下提供多种风格背景图：

| 文件 | 风格 | 主色调 |
|------|------|--------|
| `003.png` | 赛博朋克城市 | 青绿 / 深海蓝 |
| `002.jpg` | 夜樱星空 | 粉色 / 深紫 |
| `004.jpg` | 富士山河口湖 | 灰蓝 / 冷白 |
| `005.png` | 红发制服（亮底） | 暗红 / 黑 |
| `006.png` | 星空能量（蓝紫） | 蓝紫 / 深空 |
| `007.png` | 水彩红发（暖调） | 珊瑚 / 暖棕 |
| `008.jpg` | 朋克少女 | 紫罗兰 / 黑 |
| `010.jpg` | 和服精灵 | 正红 / 纯黑 |
| `011.jpg` | RADWIMPS 霓虹灯 | 霓虹蓝 / 纯黑 |

## 回滚

恢复备份文件（每次 patch 前脚本会自动备份为 `app.asar.bak`）：

```powershell
Copy-Item "app.asar.bak" "app.asar" -Force
```
