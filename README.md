# Voyage Atlas / 旅行足迹地图

`Voyage Atlas` 是一个基于 React 19、Vite 7 与 TypeScript 5 的旅行记录应用原型。它把地图选区、多人旅行记录、旅行图片、攻略搜索、攻略收藏/关联、时间线回看和云端主数据能力整合到同一个浏览器端体验里。

## 当前能力

- 国内 / 国际地图切换，并支持点击区域快速创建旅行记录
- 旅行记录支持城市、起止日期、游记描述和多图上传
- 多旅伴管理：切换当前记录用户、区分颜色、限制仅本人可编辑自己的记录
- 旅行记录详情：查看图片、编辑游记、关联或解除攻略
- 攻略搜索：支持关键词搜索、范围筛选、搜索历史、正文摘要展示
- 攻略阅读增强：支持正文目录、原文视图、站点级正文清洗，以及主页面右下角回到顶部按钮
- 攻略收藏与关联：同一用户在“收藏”和“关联到某条记录”两个语义下独立去重
- 行程时间线：按当前用户聚合、按年份筛选、按国内/国际筛选，并与地图和详情面板联动
- 数据备份：从旅行记录模块入口打开弹窗，导出当前聚合快照作为 JSON 备份
- 云端主数据：旅行记录、旅伴、攻略收藏/关联与搜索历史默认由主业务 API + MySQL 承载

## 技术栈

- React 19
- TypeScript 5
- Vite 7
- Vitest + Testing Library
- `d3-geo`
- IndexedDB
- Node.js 20.19+

## 本地启动

项目依赖 Node.js `20.19+`。如果系统 Node 版本较低，优先使用仓库自带的 Node 20。

### 推荐方式

macOS / Linux：

```bash
npm run dev:all
```

如果你想强制使用 Docker MySQL 方案：

```bash
npm run dev:all:docker
```

Windows：

```powershell
.\start-local-dev.cmd
```

其中：

- `npm run dev:all` 会尝试启动 MySQL、`guide-api`、`app-api` 和前端，并把日志写入 `.tools/dev-logs/`
- `npm run dev:all:docker` 会优先停止 Homebrew MySQL，并切换到 `docker compose` 的 `mysql + adminer`
- `start-local-dev.cmd` 会使用仓库内置的 Node 20 启动前端和 `guide-api`

停止 macOS / Linux 下一键联调进程：

```bash
npm run dev:stop
npm run dev:stop:docker
```

### 手动启动前端

```powershell
$env:PATH="$PWD\.tools\node-v20.19.0-win-x64;$env:PATH"
$env:npm_config_cache="$PWD\.npm-cache"
npm run dev
```

默认地址：

- `http://localhost:5173/`

### 启动本地攻略 API

```powershell
$env:PATH="$PWD\.tools\node-v20.19.0-win-x64;$env:PATH"
npm run dev:guide-api
```

默认地址：

- `http://localhost:8787/health`
- `http://localhost:8787/api/guides/search`
- `http://localhost:8787/api/guides/document`

### 启动本地 MySQL

方式一：Docker

```bash
docker compose up -d mysql adminer
```

方式二：Homebrew MySQL

```bash
brew install mysql
brew services start mysql
```

如果是第一次在本机初始化 Homebrew MySQL，还需要执行：

```bash
mkdir -p /opt/homebrew/var/mysql
/opt/homebrew/opt/mysql/bin/mysqld --initialize-insecure --user="$(whoami)" --basedir=/opt/homebrew/opt/mysql --datadir=/opt/homebrew/var/mysql
brew services restart mysql
```

默认地址：

- MySQL: `127.0.0.1:3306`
- Adminer: `http://localhost:8080/`

默认账号：

- MySQL root: `root / password`
- MySQL app user: `travel_app / travel_app_password`

### 初始化 Prisma

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

说明：

- `db:generate`：生成 Prisma Client
- `db:migrate`：生成并应用正式 migration，作为当前默认开发流程
- `db:migrate:deploy`：在已有 migration 历史的环境中应用迁移
- `db:migrate:status`：查看当前数据库与 migration 历史是否一致
- `db:push`：仅保留给快速实验场景，不再作为默认主流程
- `db:seed`：写入默认账户

如果你的本地数据库是在 migration 引入前就已经建好的，可以先执行：

```bash
npm run db:migrate:status
```

当前仓库已经包含首份基线 migration：`server/prisma/migrations/20260422_init/migration.sql`

### 启动本地主业务 API

```powershell
$env:PATH="$PWD\.tools\node-v20.19.0-win-x64;$env:PATH"
npm run dev:app-api
```

默认地址：

- `http://localhost:8788/health`
- `http://localhost:8788/api/app/health`
- `http://localhost:8788/api/app/bootstrap`

如果 MySQL 尚未启动，`/api/app/bootstrap` 会返回 `503 DATABASE_UNAVAILABLE`。

## 环境变量

复制环境变量模板：

```powershell
Copy-Item .env.example .env.local
```

示例：

```bash
DATABASE_URL="mysql://travel_app:travel_app_password@127.0.0.1:3306/personal_travel_daily"
APP_API_HOST=0.0.0.0
APP_API_PORT=8788
APP_API_CORS_ORIGIN=*
APP_DEFAULT_ACCOUNT_ID=acct_default
APP_DEFAULT_ACCOUNT_NAME=Voyage Atlas
VITE_IMGBB_API_KEY=your_imgbb_api_key
VITE_APP_API_BASE_URL=/api/app
VITE_GUIDE_SEARCH_PROVIDER=remote
VITE_GUIDE_SEARCH_API_BASE_URL=/api/guides
VITE_GUIDE_SEARCH_API_KEY=
VITE_GUIDE_CONTENT_MODE=summary
GUIDE_POI_GEOAPIFY_API_KEY=your_geoapify_api_key
```

说明：

- `DATABASE_URL`：Prisma 和主业务 API 连接 MySQL 使用
- `APP_API_PORT`：主业务 API 默认端口
- `APP_DEFAULT_ACCOUNT_ID` / `APP_DEFAULT_ACCOUNT_NAME`：数据库 seed 的默认账户
- `VITE_APP_API_BASE_URL`：前端主数据请求主业务 API 时使用
- `VITE_GUIDE_SEARCH_PROVIDER=mock`：前端只使用本地 mock 数据，适合纯 UI 联调
- `VITE_GUIDE_SEARCH_PROVIDER=remote`：前端调用本地或远程攻略 API
- `VITE_GUIDE_CONTENT_MODE=summary`：优先使用摘要化正文块，适合当前 UI
- `GUIDE_POI_GEOAPIFY_API_KEY`：启用 Geoapify POI 适配器时需要配置

## 常用命令

```bash
npm run dev
npm run dev:all
npm run dev:all:docker
npm run dev:stop
npm run dev:stop:docker
npm run dev:app-api
npm run dev:guide-api
npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
npm run db:migrate:status
npm run db:push
npm run db:seed
npm run build
npm run test
```

如果你在 Windows 本地使用系统 Node 低于 20，执行这些命令前先把 PATH 切到仓库内置 Node 20。

## 项目结构

```text
.
├─ docs
├─ public
├─ server
│  ├─ appApi
│  ├─ prisma
│  ├─ adapters
│  ├─ cache
│  ├─ __tests__
│  ├─ appApiServer.ts
│  ├─ guideApiServer.mjs
│  ├─ guideFileStore.mjs
│  ├─ guideSearchEngine.mjs
│  └─ guideSeedData.mjs
├─ src
│  ├─ components
│  ├─ data
│  ├─ geo
│  ├─ lib
│  │  ├─ guides
│  │  └─ repositories
│  ├─ modules
│  │  └─ app
│  ├─ styles
│  │  └─ components
│  └─ test
├─ README.md
└─ package.json
```

## 前端架构

当前前端已经从“大一统 App”拆到更清晰的分层：

- `src/modules/App.tsx`：容器层，负责组装页面、协调 store、弹窗和跨模块联动
- `src/modules/app/useMapContext.ts`：地图范围、区域列表、当前选区和地图入口行为
- `src/modules/app/useTravelStoreActions.ts`：用户、记录、攻略收藏/关联、搜索历史等写操作
- `src/modules/app/markerNavigation.ts`：按记录 ID 统一聚焦地图并打开详情
- `src/modules/app/AppHero.tsx`、`AppContent.tsx`、`AppOverlays.tsx`：页面组合层

## 样式组织

样式已从单一 `index.css` 拆分为模块化结构：

- `src/styles/base.css`
- `src/styles/layout.css`
- `src/styles/home.css`
- `src/styles/responsive.css`
- `src/styles/components/*.css`
- `src/styles/index.css` 仅负责聚合导入

## 数据边界

- 主业务数据：默认从主业务 API 加载，并写入 MySQL
- 本地 JSON 导出：仅作为人工备份快照，不再作为应用内恢复入口
- 攻略搜索缓存：继续沿用当前攻略 API 和本地缓存仓库

## 数据模型

核心状态保存在 `TravelStore`：

```ts
interface TravelStore {
  users: UserProfile[];
  markers: VisitMarker[];
  activeUserId: string;
  savedGuides: SavedGuide[];
  guideSearchHistory: GuideSearchHistoryItem[];
}
```

其中：

- `users`：旅伴身份与配色
- `markers`：旅行记录主体
- `savedGuides`：攻略收藏或与记录的关联关系
- `guideSearchHistory`：搜索历史

## 测试

```bash
npm run test
```

当前测试覆盖重点包括：

- 地图区域交互
- 旅伴切换与新增
- 攻略搜索、收藏、关联、移除
- 时间线筛选和联动
- 数据备份与恢复
- 本地存储与仓库层行为

## 文档索引

- [Docs Index](docs/README.md)
- [项目总览](docs/project-overview.md)
- [未来 Roadmap / TODO](docs/future-roadmap.md)
- [MySQL 升级技术方案](docs/mysql-upgrade-design.md)
- [App API Contract](docs/app-api-contract.md)
- [本地联调排查文档](docs/local-dev-troubleshooting.md)
- [攻略搜索功能说明](docs/guide-search-feature.md)
- [攻略搜索/收藏/关联设计](docs/travel-guide-search-design.md)
- [Guide Search API Contract](docs/guide-search-api-contract.md)
- [视觉 Token 说明](docs/design-tokens.md)
- [地图渲染与 Hover 性能说明](docs/map-rendering-and-hover-performance.md)
- [项目 AI Prompt](docs/project-ai-prompt.md)
- [System Prompt](docs/system-prompt.md)
- [Task Prompt](docs/task-prompt.md)
- [Design Prompt](docs/design-prompt.md)
- [Changelog](CHANGELOG.md)

## 当前开发注意点

- 地图、时间线、攻略收藏和详情面板已经通过 `markerNavigation` 统一了“按记录定位”的行为，新增入口尽量复用它
- 攻略收藏和关联的去重语义已经下沉到仓库/动作层，不建议在 UI 组件里自行拼接判重逻辑
- 每次创建 PR 时，需同步更新 `CHANGELOG.md`，并补齐本次改动涉及的 README / `docs/` 文档说明
- 样式已经拆分，新增样式时优先放到对应模块文件，不要继续回堆到单文件全局样式里
