# WorkBuddy 主题生成

根据背景图生成一套完整的 WorkBuddy 暗色主题。

## 输入参数

背景图路径: $ARGUMENTS

## 执行步骤

请严格按照以下步骤执行：

### 1. 读取图片

使用 Read 工具读取 `$ARGUMENTS` 指定的图片文件。如果文件不存在，尝试将扩展名在 `.jpg`/`.png`/`.webp` 之间切换查找。

### 2. 分析图片色彩

仔细观察图片，识别以下关键色彩：
- **主背景色**（最暗/最深的大面积色块）→ 用于编辑器/侧边栏背景
- **主强调色**（图片中视觉焦点的颜色）→ 用于按钮/链接/焦点边框
- **次级暗调**（比主背景稍亮的层次）→ 用于 hover/卡片/次级面板
- **边框/分隔色**（暗调之间的过渡色）→ 用于输入框边框/分隔线
- **高亮色**（主强调色的亮色变体）→ 用于链接 hover/高亮文本
- **深强调色**（主强调色的暗色变体）→ 用于按钮实际按下状态/徽章

### 3. 生成 darkTokens（theme-config.json）

根据分析的色彩，为以下所有 token 生成合理的色值。色值格式必须是 `#rrggbb` 或 `rgba(...)`。

**必须包含的 token（完整列表）：**

VS Code 内置变量：
- `--vscode-editor-background` — 主背景色（最深）
- `--vscode-sideBar-background` — 侧边栏（比主背景再深一点）
- `--vscode-panel-background` — 面板（略亮于主背景）
- `--vscode-input-background` — 输入框背景
- `--vscode-dropdown-background` — 下拉菜单背景（同输入框）
- `--vscode-editorWidget-background` — 编辑器弹窗
- `--vscode-menu-background` — 菜单背景（同输入框）
- `--vscode-textCodeBlock-background` — 代码块背景
- `--vscode-foreground` — 主文字色（浅色，可读性好）
- `--vscode-editor-foreground` — 编辑器文字（同上）
- `--vscode-descriptionForeground` — 描述文字（中灰偏暖）
- `--vscode-disabledForeground` — 禁用文字（rgba 半透明描述色）
- `--vscode-icon-foreground` — 图标色（比描述色稍亮）
- `--vscode-input-border` — 输入框边框
- `--vscode-focusBorder` — 焦点边框（主强调色）
- `--vscode-textLink-foreground` — 链接色（主强调色）
- `--vscode-textLink-activeForeground` — 链接 hover（高亮色）
- `--vscode-button-background` — 按钮背景（主强调色偏深）
- `--vscode-button-foreground` — 按钮文字（白色或亮色）
- `--vscode-button-hoverBackground` — 按钮 hover
- `--vscode-progressBar-background` — 进度条（主强调色）
- `--vscode-badge-background` — 徽章背景（同按钮）
- `--vscode-badge-foreground` — 徽章文字（同按钮文字）
- `--vscode-list-hoverBackground` — 列表 hover
- `--vscode-list-activeSelectionBackground` — 列表选中
- `--vscode-scrollbarSlider-background` — 滚动条（rgba 主强调色 0.2）
- `--vscode-scrollbarSlider-hoverBackground` — 滚动条 hover（rgba 主强调色 0.35）

WorkBuddy 自定义变量：
- `--wb-palette-gray-1` — 同 list-hover
- `--wb-palette-gray-2` — 同 input-background
- `--wb-palette-gray-3` — 同 sideBar
- `--wb-palette-gray-4` — 同 list-activeSelection
- `--wb-palette-gray-5` — 同 input-border
- `--wb-palette-brand-1` — 同 editorWidget
- `--wb-palette-brand-2` — 同 list-hover
- `--wb-palette-brand-3` — 稍亮于 brand-2
- `--wb-palette-brand-4` — 深强调色（同按钮 active）
- `--wb-palette-brand-5` — 高亮色
- `--wb-palette-brand-7` — 链接色
- `--wb-palette-brand-8` — 主强调色
- `--wb-palette-brand-9` — 按钮背景
- `--wb-palette-brand-10` — 深强调色
- `--wb-home-bg-primary` — 同 editor-background
- `--wb-home-bg-secondary` — 同 editorWidget
- `--wb-quick-action-sub-item-bg` — 同 list-activeSelection
- `--wb-bg-card-strong` — 同 codeBlock
- `--wb-bg-pill-hover` — 同 list-hover
- `--wb-task-starter-trigger-bg-hover` — 同 list-activeSelection
- `--wb-quick-action-item-bg-hover` — 同 list-activeSelection
- `--wb-quick-action-item-border-hover` — 同 input-border
- `--wb-color-text-link-default` — 同链接色
- `--wb-color-text-link-hover` — 同链接 hover
- `--cb-dropdown-bg-color` — 同 input-background
- `--cb-dropdown-item-hover-bg-color` — 同 list-activeSelection
- `--cb-hover-card-bg-color` — 同 input-border
- `--wb-button-primary-bg` — 按钮背景
- `--wb-button-primary-bg-hover` — 按钮 hover
- `--wb-button-primary-bg-active` — 按钮按下（深强调色）
- `--wb-bg-pill-active` — 同按钮背景
- `--wb-bg-pill-active-hover` — 同按钮 hover
- `--wb-control-selected-bg` — 同按钮背景
- `--wb-control-selected-bg-hover` — 同按钮 hover
- `--wb-color-border-focus` — 同焦点边框
- `--wb-checkin-bg` — 渐变: `linear-gradient(180deg, 按钮背景 0%, 链接色 100%)`
- `--wb-checkin-period-tag-fg` — 非常深的强调色调（约 15% 饱和度）
- `--wb-checkin-divider` — 同 list-activeSelection
- `--wb-checkin-tomorrow-bg` — 同 list-hover
- `--wb-checkin-tomorrow-fg` — 同高亮色
- `--wb-checkin-pop-flash` — 同主强调色
- `--wb-checkin-btn-success-bg` — 同按钮背景
- `--wb-checkin-btn-success-border` — 同按钮背景

### 4. 写入 theme-config.json

保持现有 JSON 结构，仅更新 `darkTokens` 字段。`lightTokens` 保持为空对象 `{}`。`skin` 部分保持不变。

### 5. 写入 wb-skin.css

根据图片风格调整 CSS：
- 左侧渐变覆盖层颜色使用 `sideBar-background` 对应的 rgb 值
- 渐变透明度: 起点 0.92~0.96，中点 0.45~0.55，终点 0.05~0.08
- 毛玻璃输入区底色使用 `editor-background` 对应的 rgba 值，透明度 0.65
- CSS 注释说明图片风格（如"赛博朋克城市"、"夜樱"、"富士山"等）

### 6. 替换背景图

将 `$ARGUMENTS` 指定的图片文件复制为项目根目录的 `wb-hero-dark.webp`：
```bash
cp "$ARGUMENTS" wb-hero-dark.webp
```

### 7. 输出完成报告

完成后输出配色分析表：

| 图像元素 | 提取色 | 主题用途 |
|---|---|---|
| ... | ... | ... |

并提醒用户运行 patch 脚本：
```
node D:\code\Claude\theme\wb-theme-patch.js "D:\Programs\WorkBuddy"
```
