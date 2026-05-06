# Voyage Atlas / 旅行足迹地图

`Voyage Atlas` 是一个基于 React 19、Vite 7 与 TypeScript 5 的旅行记录应用原型。它把地图选区、多人旅行记录、旅行图片、攻略搜索、攻略收藏 / 关联、行前规划、时间线回看、行程集合、旅行故事、统计中心、旅行成就、年度回顾、地图回放、管理员后台以及云端主数据能力整合到同一个浏览器端体验里。

`Voyage Atlas` is a React 19 + Vite 7 + TypeScript 5 travel log prototype that unifies map capture, multi-companion records, guides, pre-trip planning, timelines, trip collections, trip stories, stats, travel achievements, annual reviews, map replay, an admin backoffice, and a cloud-backed data layer into a single browser experience.

## 当前能力 / Current Capabilities

- 国内 / 国际地图切换，并支持点击区域快速创建旅行记录
- 地图回放：首页地图卡片内嵌的控制条，自动或手动沿国家级路径回放旅途轨迹
- 账号认证：未登录默认进入 `/login`，注册页为 `/register`，旧 `/auth` 会自动兼容到 `/login`
- 旅行记录支持城市、起止日期、游记描述、多图上传，以及标签、心情、天气、交通方式、预算级别等轻量元数据
- 多旅伴管理：切换当前记录用户、区分颜色、限制仅本人可编辑自己的记录
- 旅行记录详情：查看图片、编辑游记、关联或解除攻略、轻量调整所属行程
- 攻略搜索：关键词搜索、范围筛选、搜索历史、正文摘要展示
- 攻略阅读增强：正文目录、原文视图、站点级正文清洗与"回到顶部"
- 攻略收藏与关联：同一用户在"收藏"与"关联到某条记录"两个语义下独立去重
- 愿望地图：地图选区和攻略搜索结果可加入想去地点，支持编辑、筛选、排序、去重提示、已导入标记和一键转新行程；首页地图区分已访问、愿望和两者都有的区域，并显示愿望城市提示
- 行程集合二期：创建、编辑、删除行程，封面管理，从时间线批量整理记录，并提供独立详情页 `/trips/:id`
- 行前规划工作台：`/trips/:id` 内新增“行前规划”Tab，支持从愿望地图导入规划项、管理攻略来源、备注、优先级、预计日期，并可在旅行后转成正式旅行记录
- Story Studio `/trips/:id/story`：将单次行程自动整理为私有故事页，支持杂志风 / 纪念册 / 明信片模板、故事徽章、路线回放海报、智能序言、动态 SVG 长图、方形 / 竖版分享卡导出与浏览器打印 / PDF 导出
- 攻略清单化：支持从攻略搜索结果直接生成绑定到行程的“行前清单”，自动产出 `出发前 / 旅途中 / 已完成` 三段事项，并提供行程详情内嵌面板与独立放大页 `/trips/:id/checklist`
- 行程时间线：按当前用户聚合、按年份与国内 / 国际筛选，与地图、详情面板联动
- 统计中心 `/stats`：总览 KPI、旅行成就、趋势、排行、国内 / 世界热力图与行程明细，支持钻取到行程详情
- 旅行成就：按当前统计筛选实时计算成就状态、进度、证据与首次解锁时间，支持成就详情弹窗
- 年度回顾 `/yearbook/:year`：年度摘要、高光、年度成就、热力分布、照片与关联攻略，可打印 / 导出 PDF，并继续钻取到行程详情
- 管理员后台 `/admin`：`admin` 角色专用的只读概览，含行前规划统计与明细巡检，后端 `GET /api/admin/overview` 最终裁决权限
- 数据备份：应用内仅保留导出当前聚合快照为 JSON 的能力
- 云端主数据：旅行记录、旅伴、攻略收藏 / 关联与搜索历史默认由主业务 API + MySQL 承载

Summary: Every shipped capability above lives under the current bilingual design rules and a single MySQL-backed data layer, including wishlist planning, trip-bound planning, printable trip stories, guide-to-checklist planning, and persistent travel-achievement unlock moments.

## 技术栈 / Tech Stack

- React 19
- TypeScript 5
- Vite 7
- Vitest + Testing Library
- `d3-geo`
- Fastify + Prisma + MySQL 8
- Node.js 20.19+

---

## **认证说明 / Authentication**

- 登录页：`/login`，注册页：`/register`，旧 `/auth` 自动规范到 `/login`
- 默认演示账号：用户名 `demo` / 密码 `demo123456`（角色 `admin`）
- 登录成功后回到主页面 `/`；退出登录与删除旅行记录都需要二次确认
- 完整交互手册：[docs/technical/auth-login-register.md](docs/technical/auth-login-register.md)
- 技术设计 + 架构图 + 时序图：[docs/technical/auth-technical-design.md](docs/technical/auth-technical-design.md)

Summary: Auth uses cookie sessions; the default seed account `demo` is an admin for local development only.

---

## **本地启动 / Local Setup**

项目依赖 Node.js `20.19+`。如果系统 Node 版本较低，优先使用仓库自带的 Node 20。

### 推荐方式 / Recommended

macOS / Linux：

```bash
npm run dev:all
```

Windows：

```powershell
.\start-local-dev.cmd
```

其中：

- `npm run dev:all` 通过 `docker compose` 启动 `mysql + adminer`，再启动 `guide-api`、`app-api` 与前端，并把日志写入 `.tools/dev-logs/`
- 启动服务前会自动执行 `db:generate`、`db:migrate:deploy` 与 `db:seed`
- `start-local-dev.cmd` 使用仓库内置 Node 20，一键启动 `mysql + adminer`、同步 Prisma、执行 seed，并启动 `guide-api`、`app-api` 与前端

停止 macOS / Linux 下一键联调进程：

```bash
npm run dev:stop
```

### 手动启动 / Manual

前端：

```powershell
$env:PATH="$PWD\.tools\node-v20.19.0-win-x64;$env:PATH"
$env:npm_config_cache="$PWD\.npm-cache"
npm run dev
```

默认地址：`http://localhost:5173/`

攻略 API：

```powershell
$env:PATH="$PWD\.tools\node-v20.19.0-win-x64;$env:PATH"
npm run dev:guide-api
```

默认地址：

- `http://localhost:8383/health`
- `http://localhost:8383/api/guides/search`
- `http://localhost:8383/api/guides/document`

本地 MySQL（仅保留 Docker Compose）：

```bash
docker compose up -d mysql adminer
```

默认地址：

- MySQL: `127.0.0.1:3306`
- Adminer: `http://localhost:8080/`

默认账号：

- MySQL root：`root / password`
- MySQL app user：`travel_app / travel_app_password`

初始化 Prisma：

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

主业务 API：

```powershell
$env:PATH="$PWD\.tools\node-v20.19.0-win-x64;$env:PATH"
npm run dev:app-api
```

默认地址：

- `http://localhost:8788/health`
- `http://localhost:8788/api/app/health`
- `http://localhost:8788/api/app/bootstrap`

如果 MySQL 尚未启动，`/api/app/bootstrap` 会返回 `503 DATABASE_UNAVAILABLE`。

### 环境变量 / Environment Variables

```bash
DATABASE_URL="mysql://travel_app:travel_app_password@127.0.0.1:3306/personal_travel_daily"
APP_API_HOST=0.0.0.0
APP_API_PORT=8788
APP_API_CORS_ORIGIN=*
APP_DEFAULT_ACCOUNT_ID=acct_default
APP_DEFAULT_ACCOUNT_NAME=Voyage Atlas
GUIDE_API_PORT=8383
VITE_IMGBB_API_KEY=your_imgbb_api_key
VITE_APP_API_BASE_URL=/api/app
VITE_GUIDE_SEARCH_PROVIDER=remote
VITE_GUIDE_SEARCH_API_BASE_URL=/api/guides
VITE_GUIDE_CONTENT_MODE=summary
```

可选：`GUIDE_POI_GEOAPIFY_API_KEY`、`GUIDE_LLM_*` 系列用于启用本地大模型增强的攻略搜索（见下一节）。

### Local LLM Guide Search

攻略 API 可调用本地 Ollama 以增强搜索和正文摘要。推荐本地配置：

```powershell
ollama pull qwen2.5:3b
ollama pull embeddinggemma
```

`.env.local` 建议片段：

```env
GUIDE_LLM_ENABLED=true
GUIDE_LLM_BASE_URL=http://127.0.0.1:11434
GUIDE_LLM_CHAT_MODEL=qwen2.5:3b
GUIDE_LLM_EMBED_MODEL=embeddinggemma
GUIDE_LLM_TIMEOUT_MS=20000
GUIDE_LLM_SEARCH_MODE=smart
GUIDE_LLM_INDEX_TTL_HOURS=168
```

判断本地 LLM 是否生效：`POST /api/guides/search` 返回 `provider: "guide-api-local-llm"`，并附带 `matchReason` / `semanticScore` / `queryInterpretation`。

Summary: Prefer `npm run dev:all` on macOS / Linux or `start-local-dev.cmd` on Windows; the optional local LLM path augments search quality.

---

## **测试 / Testing**

```bash
npm run test
```

重点覆盖：

- 地图区域交互与地图回放序列
- 旅伴切换、新增
- 攻略搜索、收藏、关联、移除
- 时间线筛选与联动
- 行程集合 CRUD 与详情回看
- 行前规划 CRUD、攻略搜索加入规划与转旅行记录
- 攻略提炼为行前清单与行程详情联动
- Story Studio 长图 / 分享卡导出与数据备份（导出）
- 主业务 API 契约与仓库层行为

Summary: Run `npm run test` to cover critical flows across the map, timeline, guides, trips, backup, and the app-api contract.

### 常用命令 / Common Commands

```bash
npm run dev
npm run dev:all
npm run dev:stop
npm run dev:app-api
npm run dev:guide-api
npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
npm run db:migrate:status
npm run db:seed
npm run build
npm run test
```

---

## **进一步阅读 / Further Reading**

文档统一入口：[docs/README.md](docs/README.md)

常用跳转：

- [项目总览 / Project Overview](docs/technical/project-overview.md)
- [未来 Roadmap / Product Roadmap](docs/technical/future-roadmap.md)
- [攻略提炼为行前清单 / Guide-to-Checklist Workflow](docs/technical/guide-to-checklist-workflow.md)
- [App API Contract](docs/technical/app-api-contract.md)
- [Guide Search API Contract](docs/technical/guide-search-api-contract.md)
- [登录注册交互手册](docs/technical/auth-login-register.md)
- [认证与会话技术方案（含架构图与时序图）](docs/technical/auth-technical-design.md)
- [本地联调排查](docs/technical/local-dev-troubleshooting.md)
- [CHANGELOG](CHANGELOG.md)

## 项目结构与数据边界 / Layout and Data Boundaries

```text
.
├─ docs           # 文档入口见 docs/README.md
├─ server         # appApi / prisma / adapters / cache / 攻略 API 入口
├─ src            # components / data / geo / lib / modules / styles / test
├─ README.md
└─ package.json
```

- 主业务数据：默认从主业务 API 加载，并写入 MySQL
- 本地 JSON 导出：仅作为人工备份快照，不再作为应用内恢复入口
- 攻略搜索缓存：继续沿用当前攻略 API 和本地缓存仓库

Summary: MySQL is the only source of truth; local exports are backup-only; guide caches remain auxiliary.

## 开发注意点 / Development Notes

- 新增"按记录跳转"入口优先复用 `src/modules/app/markerNavigation.ts`
- 收藏 / 关联去重语义下沉到仓库和动作层，不要在 UI 组件里自行拼接判重
- 通用纯逻辑放到 `src/lib`；页面 / 模块组装放到 `src/modules`；组件只保留 UI、交互和必要局部状态
- 每次创建 PR 同步更新 `CHANGELOG.md`，并补齐涉及的 README / `docs/` 说明
- PR 默认 Ready for review；PR 标题 / 正文 / CHANGELOG / 面向协作的文档必须保持中英双语（中文在前）
- 新增样式放到对应模块的 `src/styles/components/*.css`；全局硬约束（例如隐藏滚动条）保留在 `src/styles/base.css`，不要随意覆盖

Summary: Reuse shared helpers, respect layering, keep bilingual docs in sync, and never break the global invariants in `base.css`.
