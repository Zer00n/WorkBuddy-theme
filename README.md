# WorkBuddy 主题工具

自定义 WorkBuddy 暗色主题，支持更换背景图并自动适配配色。

## 快速使用

### 1. 环境准备
- 安装 [Node.js](https://nodejs.org/)
- 关闭 WorkBuddy

### 2. 应用主题
```powershell
# 运行 patch 脚本（路径替换为你的 WorkBuddy 安装目录）
node wb-theme-patch.js "D:\Programs\WorkBuddy"

# 清除缓存
Remove-Item -Recurse -Force "$env:USERPROFILE\.workbuddy\app\session\Cache"

# 启动 WorkBuddy 验证
```

### 3. 更换背景图
替换 `wb-hero-dark.webp` 为你的图片，重新运行 patch 脚本即可。

## 文件说明

| 文件 | 说明 |
|------|------|
| `theme-config.json` | 主题色值配置（darkTokens） |
| `wb-skin.css` | 皮肤层样式（背景图 + 毛玻璃） |
| `wb-theme-patch.js` | 自动 patch 脚本 |
| `wb-hero-dark.webp` | 当前背景图 |

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

恢复备份文件：
```powershell
Copy-Item "app.asar.bak" "app.asar" -Force
```
