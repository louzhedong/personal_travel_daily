# 视觉 Token 与字体规范 / Visual Tokens and Typography Guide

这份文档是项目级视觉规范，覆盖颜色、圆角、阴影、间距与字体层级。当前重点是统一各页面字号，避免首页、Atlas、统计、后台、提醒、照片整理等模块各自定义字体大小。

This document is the project-level visual guide for color, radius, shadow, spacing, and typography. The latest focus is a unified type scale so Home, Atlas, Stats, Admin, Reminders, Photo Curation, and other modules do not invent independent font sizes.

## 1. 文件分层 / File Layers

- `src/styles/base.css`: 全局变量、reset、基础字体和元素样式。所有字号 token 的唯一来源。
- `src/styles/layout.css`: 页面壳层、卡片、弹窗、通用标题和网格布局。
- `src/styles/home.css`: 首页头部、欢迎区和主视觉。
- `src/styles/features/*.css`: 单功能页面样式，必须复用 `base.css` 中的字体 token。
- `src/styles/components/*.css`: 组件级样式，按钮、表单、地图、侧栏等必须复用通用字号。
- `src/styles/visual-system.css`: 全站视觉收口层，统一所有页面的浅色纸张底、弱边界、低阴影、editorial 标题和控件状态。
- `src/styles/responsive.css`: 响应式断点下的覆盖规则，不应新增独立字号体系。

Summary: `base.css` owns tokens; page and component CSS files consume them.

## 2. 字体家族 / Font Families

- `--font-display`: 用于页面大标题、章节标题、指标数字，强调旅行杂志内页的 editorial 气质。
- `--font-body`: 用于正文、列表、表单、按钮和辅助说明，保证中文与英文都清晰。
- 不新增远程字体依赖；当前使用系统字体 fallback，避免加载成本和字体闪烁。

Summary: Display text creates identity; body text preserves readability.

## 3. 字号阶梯 / Type Scale

所有 CSS 字号必须使用以下 token，不再直接写 `font-size: 13px`、`font-size: 1.2rem` 或页面私有 `clamp()`。

All CSS font sizes must use these tokens. Do not write raw `px`, `rem`, or page-private `clamp()` values.

| Token | Value | 中文用途 | English Usage |
| --- | ---: | --- | --- |
| `--text-2xs` | `11px` | 地图 SVG 标签、极弱辅助信息、密集表格脚注 | Map labels, very small hints, dense footnotes |
| `--text-xs` | `12px` | eyebrow、小徽标、状态说明、元信息 | Eyebrows, badges, status copy, metadata |
| `--text-sm` | `13px` | 次级说明、筛选项、列表补充信息 | Secondary copy, filters, list details |
| `--text-body` | `14px` | 默认正文、按钮、输入、列表主体 | Default body, buttons, inputs, list content |
| `--text-md` | `15px` | 较重要正文、侧栏小标题 | Emphasized body, sidebar small titles |
| `--text-lg` | `16px` | 页面说明、空状态说明、正文引导 | Page descriptions, empty states, lead body |
| `--text-lead` | `17px` | 首页/主视觉说明文案 | Hero lead copy |
| `--title-xs` | `18px` | 弹窗标题、小面板标题 | Modal titles, small panel titles |
| `--title-sm` | `20px` | 通用 section 标题、卡片标题 | Section titles, card titles |
| `--title-md` | `24px` | 页面二级标题、索引项标题 | Page subheads, index item titles |
| `--title-lg` | `28px` | 小型 hero 副标题、强调标题 | Small hero subtitles, emphasized titles |
| `--title-xl` | `32px` | 页面内主 section 标题 | Major in-page section titles |
| `--metric-sm` | `28px` | 小指标数字 | Small metric numbers |
| `--metric-md` | `38px` | 标准指标数字 | Standard metric numbers |
| `--metric-lg` | `48px` | 年度回顾/封面级指标数字，需低于 display 标题层级 | Yearbook or cover metric numbers, intentionally below display titles |
| `--display-sm` | `clamp(34px, 4vw, 48px)` | 常规页面主标题 | Standard page hero title |
| `--display-md` | `clamp(42px, 7vw, 76px)` | 沉浸页/故事页主标题 | Immersive or story page title |
| `--display-lg` | `clamp(52px, 7.6vw, 92px)` | 首页、Atlas 等封面级标题 | Cover-level Home and Atlas titles |

Summary: Use text tokens for reading, title tokens for hierarchy, metric tokens for numbers, and display tokens for editorial covers.

## 4. 行高与字距 / Line Height and Tracking

- `--leading-tight`: `1.08`，只用于 display 标题和大型数字。
- `--leading-title`: `1.18`，用于标题、卡片标题、section 标题。
- `--leading-body`: `1.62`，用于默认正文和列表。
- `--leading-loose`: `1.8`，用于 hero lead、页面说明和长段落。
- `--tracking-kicker`: `0.18em`，用于 `.hero-kicker`、eyebrow、编号标签。
- `--tracking-tight`: `-0.055em`，用于中文 display/title 标题的紧凑杂志感。

Summary: Tight leading belongs to titles; loose leading belongs to explanatory copy.

## 5. 模块用法 / Module Rules

- 首页 / Home: `h1` 使用 `--display-md`，副标题使用 `--title-lg`，lead copy 使用 `--text-lead`。
- Atlas / Travel Atlas: 页面标题使用 `--display-lg`，地图 legend 标题使用 `--title-xl`，指标数字使用 `--metric-md`。
- 统计中心 / Stats Center: 页面标题使用 `--display-sm`，图表标题使用 `--title-sm` 或 `--title-md`，图例说明使用 `--text-sm`。
- 后台 / Admin: 页面标题使用 `--display-sm`，表格/列表主体使用 `--text-body`，状态说明使用 `--text-xs` 或 `--text-sm`。
- 侧栏 / Sidebar: 侧栏标题使用 `--title-sm`，小标题使用 `--text-md`，描述使用 `--text-sm`。
- 表单 / Forms: label 使用 `--text-body`，输入与按钮使用 `--text-body`，帮助文本使用 `--text-xs`。
- 地图 / Maps: SVG 地名与计数优先使用 `--text-2xs` 或 `--text-xs`，浮层正文使用 `--text-sm`。
- 年度回顾 / Annual Review: 封面标题使用 `--display-md` 或 `--display-lg`，大数字使用 `--metric-lg`。

Summary: Modules may choose semantic levels, but must not invent sizes.

## 6. 全站视觉规范 / Global Visual System

- 所有页面必须使用浅色纸张底：`--surface-paper`、`--surface-wash`、`--surface-mist` 组合网格纹理，不再回到蓝灰 SaaS 背景。
- Hero 区统一为 editorial spread：弱网格、右上虚线圆、低饱和 clay/route/blueprint 氛围光，标题使用 `--font-display` 和紧凑字距。
- 功能页头部统一为“右对齐操作条 + 统一 hero 卡片”：topbar 只承载操作，按钮高度使用 `--control-height-sm`；hero 标题统一使用 `--page-hero-title`，说明统一使用 `--page-hero-copy`。
- 页面卡片、面板、section、弹窗统一使用 `--surface-glass` 或 `--surface-sheet`，边框优先 `--line-hair`，阴影优先 `--shadow-card`。
- 大卡片内边距统一使用 `--space-card-y` / `--space-card-x`，紧凑统计卡使用 `--space-card-compact`；连续卡片之间使用 `--space-card-gap`，不要让卡片内容贴边或上下粘连。
- 后台、提醒等模块卡片标题统一使用 `--title-sm`，指标数字才能使用 `--title-lg` / `--title-xl`。
- 按钮默认是浅色纸面 + 细边框；hover/focus 使用黑底白字作为主要强调，不再使用大面积蓝色渐变。
- 表单、select、date picker、dialog 统一弱边界和纸张底，focus 使用 `--line-strong` 与低透明黑色 focus ring。
- 彩色状态只作为轻量 tint：`--surface-tint-blue`、`--surface-tint-route`、`--surface-tint-clay`；不要整块高饱和铺色。
- 首页仍遵守单独约束：桌面必须保持 1320px 左右双栏，地图操作区右对齐且不换行。
- Atlas 仍保留地图册内页特例：1040px 版心、路线图、经纬网格和索引式信息结构。

Summary: Every route now converges through `visual-system.css`; page CSS may define layout, but the visual language must stay light, restrained, and editorial.

## 7. 禁止事项 / Do Not

- 不要在 CSS 中新增裸字号：`font-size: 13px`、`font-size: 1rem`、`font-size: clamp(...)`。
- 不要为单个页面创建私有字号阶梯。
- 不要用加粗和放大同时表达同一层级，优先选正确 token。
- 不要让正文小于 `--text-xs`，除非是地图或极密集元信息。
- 不要在响应式文件中新增独立字号，只能调整布局或复用 display token。
- 不要新增蓝灰 SaaS 背景、强渐变按钮或强投影卡片；优先扩展 `visual-system.css` 中的全局规则。

Summary: New CSS should be token-driven and semantically named.

## 8. 颜色、圆角、阴影与间距 / Color, Radius, Shadow, Spacing

- 页面主色用于地图强调、按钮高亮、激活状态。
- 信息卡、筛选 chips、标签和状态徽标应复用同一套主/辅色阶。
- 大卡片、面板与弹窗使用 `--radius-card` 或 `--radius-panel`。
- 表单控件与小标签使用 `--radius-control` 或 `--radius-badge`。
- 外层卡片采用轻阴影 + 低对比边框，避免多层强阴影。
- 面板内部优先使用 `--space-card-y` / `--space-card-x`，紧凑卡片使用 `--space-card-compact`，连续卡片组使用 `--space-card-gap`；页面块与块之间优先保持 20px 左右节奏。
- 长列表面板必须设置最大高度并在内部滚动，例如质量问题、审计日志、后台明细列表。

Summary: Typography is now tokenized; existing color, radius, shadow, and spacing rules remain intentionally restrained.

## 9. 维护流程 / Maintenance Workflow

- 新增页面前，先从本文件选择语义层级，再写 CSS。
- 如果现有 token 不够，先更新 `src/styles/base.css` 和本文档，再在页面中使用。
- 提交前运行 `grep -R "font-size: .*px\\|font-size: .*rem\\|font-size: clamp" src/styles`，确认没有新增裸字号。
- 视觉回归检查至少覆盖首页、Atlas、统计中心、设置、提醒和后台页面。

Summary: Extend tokens deliberately; never patch typography ad hoc.
