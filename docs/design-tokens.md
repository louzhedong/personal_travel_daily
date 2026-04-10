# 视觉 Token 说明

本文档说明当前项目中在 `src/styles/index.css` 的 `:root` 下维护的视觉 Token，以及它们对应的 UI 组件，方便后续统一调整页面风格。

当前产品形态已经从“单纯的旅行记录页”演进为一个带品牌化首页、地图交互和旅伴管理的旅行产品原型，因此本文档除了基础 token，也补充说明品牌色与图标系统的落点。

## 圆角

- `--radius-card`
  - 用途：页面主卡片圆角
  - 组件：`Hero` 区块、地图模块、统计模块、多用户模块、记录列表模块

- `--radius-panel`
  - 用途：次级面板和弹窗面板圆角
  - 组件：弹窗卡片、`MarkerForm` 外层、状态提示区域

- `--radius-control`
  - 用途：按钮和表单控件圆角
  - 组件：切换按钮、主次按钮、自定义下拉、输入框、缩放按钮

- `--radius-badge`
  - 用途：胶囊型标签圆角
  - 组件：地图图例标签、用户 chip、当前用户 badge

## 阴影

- `--shadow-card`
  - 用途：主卡片阴影
  - 组件：所有 `.card` 模块

- `--shadow-panel`
  - 用途：次级面板阴影
  - 组件：状态提示区、`MarkerForm`

- `--shadow-modal`
  - 用途：弹窗阴影
  - 组件：地图点击后的录入弹窗

## 字号层级

- `--heading-main`
  - 用途：页面主标题字号
  - 组件：首页 Hero 标题

- `--heading-section`
  - 用途：模块标题字号
  - 组件：地图模块、多用户管理、记录列表、表单标题

- `--heading-modal`
  - 用途：弹窗标题字号
  - 组件：录入弹窗标题

## 控件尺寸

- `--control-height`
  - 用途：标准表单控件与主按钮高度
  - 组件：输入框、自定义下拉、日期控件、主按钮、次按钮

- `--control-height-sm`
  - 用途：较紧凑的按钮高度
  - 组件：地图切换按钮、幽灵按钮、品牌化缩放按钮

## 品牌色

- `--brand-blue`
  - 用途：主品牌色，承担探索、路线与地图语义
  - 组件：Hero 品牌副标、地图切换激活态、统计卡蓝色主题、地图控件

- `--brand-teal`
  - 用途：旅行氛围与自然感辅助色
  - 组件：Hero 路线渐变、统计卡青绿色主题、地图切换渐变

- `--brand-orange`
  - 用途：目的地、亮点和行动点缀色
  - 组件：Hero 航线高光、旅伴管理标题徽章、统计卡橙色主题

- `--brand-ink`
  - 用途：品牌主文案深色
  - 组件：Hero 标题、提示卡标题、模块主标题

## 动态 CSS 变量

以下变量不是全局设计 Token，而是组件运行时写入的局部变量：

- `--tone-color`
  - 用途：用户色、图例色、地图标记点颜色
  - 组件：`TravelMap` 图例、地图用户点、`UserManager` 用户 chip / 当前用户 badge / 色板 / 颜色主题卡

- `--label-font-size`
  - 用途：地图国家/省份标签字号
  - 组件：`TravelMap`

- `--label-stroke-width`
  - 用途：地图标签描边宽度
  - 组件：`TravelMap`

- `--tooltip-left`
  - 用途：hover 浮层横向位置
  - 组件：`TravelMap`

- `--tooltip-top`
  - 用途：hover 浮层纵向位置
  - 组件：`TravelMap`

## 维护建议

- 调整页面整体视觉时，优先修改 `:root` 里的全局 Token
- 组件局部动态值优先用 CSS 变量传递，不要重新回到大量内联样式
- 新增模块时，优先复用现有的 `card`、`panel-card`、`field-control`、`primary-button`、`ghost-button` 等基础类
- 品牌色的新增场景，优先复用 `--brand-blue / teal / orange / ink`，避免引入新的语义不明颜色
- 图标优先复用 `TravelIcon` 和 `travel-icon-badge` 体系，不要在同一产品中混用多套图标风格

## 当前主要品牌化组件

- Hero 首屏
  - 相关类：`hero`、`hero-map-watermark`、`hero-illustration`、`hero-highlight-chip`、`hero-tip-card`
  - 作用：构建品牌首页氛围、地图线稿底纹、经纬网格、航线点亮

- 统计卡
  - 相关类：`stat-card`、`stat-card-*`、`stat-card-header`、`stat-caption`
  - 作用：把数字信息升级为更像“目的地卡片”的品牌化摘要

- 地图模块头部
  - 相关类：`map-heading-title-row`、`map-segmented-header`、`map-caption`
  - 作用：统一地图标题、说明胶囊与视图切换按钮

- 地图控件
  - 相关类：`toggle-group`、`toggle-slider`、`map-zoom-button`
  - 作用：统一地图视图切换与缩放按钮的控件语言

- 旅伴管理
  - 相关类：`user-manager-card`、`user-manager-group`、`user-avatar-badge`、`color-swatch-card`
  - 作用：统一旅伴身份、在线状态、色板主题和表单条布局
