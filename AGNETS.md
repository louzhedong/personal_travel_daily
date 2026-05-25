# AGNETS.md

这个仓库面向长时运行的 coding agent 工作流。目标不是尽快产出代码，而是让每一轮会话结束后，下一个会话仍然能无猜测地继续工作。

> 注意：本文件按用户要求命名为 `AGNETS.md`。Harness 的其他工件全部放在 `harness/` 下，避免根目录文件过多。

## 开工流程

写代码前先做这些事：

1. 用 `pwd` 确认当前目录是仓库根目录。
2. 读取 `harness/claude-progress.md`，了解最新已验证状态、blocker 和下一步。
3. 读取 `harness/feature_list.json`，选择优先级最高且未 passing 的功能；同一时间只能有一个 `in_progress`。
4. 用 `git log --oneline -5` 看最近提交。
5. 运行 `bash harness/init.sh`。如果基础验证失败，先确认是否属于 `claude-progress.md` 中记录的已知 blocker。
6. 开始新功能前，先跑相关 smoke test 或最小定向验证。

## 工作规则

- 一次只做一个功能，除非用户明确要求批量处理。
- 不要因为“代码已经写了”就把功能标记为完成。
- 除非为了消除当前 blocker 的窄范围修复，否则不要扩大到其他功能。
- 实现过程中不要悄悄改弱验证规则。
- 优先依赖仓库里的持久化文件，而不是聊天记录。
- 用户明确拒绝过的方案必须写入进度或质量文档，后续 agent 不得重复尝试。

## 当前项目硬约束

- 页面遵循“旅行杂志内页”排版：浅色、去卡片化、弱边界、充足留白。
- 首页必须保持左右双栏布局：左侧地图/记录，右侧面板；禁止为了解决遮挡改成上下堆叠。
- 首页容器宽度当前为 `1320px`，右侧栏控制在 `320–360px`。
- 字号必须使用 `src/styles/base.css` 中的全局 token，严禁在 `src/styles` 新增裸 `px/rem/clamp()` 字号。
- `.trae/` 目录不得提交。
- PR 描述和技术文档必须保持完整中英双语正文对齐。

## 必需文件

- `harness/feature_list.json`：功能状态的唯一事实来源。
- `harness/claude-progress.md`：会话进度、已验证状态和 blocker。
- `harness/init.sh`：统一初始化与验证入口。
- `harness/session-handoff.md`：较长会话结束时的交接摘要。
- `harness/clean-state-checklist.md`：每轮结束前的干净状态检查。
- `harness/evaluator-rubric.md`：会话或里程碑评审评分表。
- `harness/quality-document.md`：产品领域和架构层质量快照。

## 完成定义

一个功能只有在以下条件都满足时才算完成：

- 目标行为已经实现。
- 要求的验证真的跑过。
- 证据记录在 `harness/feature_list.json` 或 `harness/claude-progress.md`。
- 已知风险和未验证边界被明确记录。
- 仓库仍然能按标准启动路径重新开始工作。

## 收尾

结束会话前：

1. 更新 `harness/claude-progress.md`。
2. 更新 `harness/feature_list.json`。
3. 记录仍未解决的风险或 blocker。
4. 跑 `git diff --check` 和相关验证；如果验证失败，记录失败命令、失败原因和下一步。
5. 保证下一轮会话可以直接运行 `bash harness/init.sh` 并理解当前状态。

## CodeGraph (本地语义索引 / Local Semantic Index)

本仓库已接入 [@colbymchenry/codegraph](https://github.com/colbymchenry/codegraph)（v0.9.x）。索引数据库位于 `.codegraph/codegraph.db`，已在 `.gitignore` 中忽略，不会入库。

### 何时调用 / When to call

- **优先**：探索类问题（"X 如何实现"、"Y 在哪里"、"修改 Z 影响范围"）必须先用 `codegraph_search` / `codegraph_callers` / `codegraph_callees` / `codegraph_impact`。
- **避免**：主会话直接调用 `codegraph_explore`、`codegraph_context`（返回大量源码，会污染上下文）。需深度探索时改 spawn 子 agent。
- **降级**：仅当 codegraph 返回 `no result` 或对应文件不在 `Additional relevant files` 时，才回退 grep / Read。

### 维护 / Maintenance

- 大规模重构后：`codegraph sync` 增量同步，或 `codegraph index` 全量重建。
- 状态查看：`codegraph status`。
- 当前规模（参考）：673 文件 / 6,476 节点 / 13,142 边 / 113 framework route。

### Agent 接入 / Wiring

| Agent | 状态 | 配置位置 |
|---|---|---|
| Codex CLI | ✅ 已配置 | `~/.codex/config.toml` (`[mcp_servers.codegraph]`) |
| Trae | ⏳ 手动 | 在 Trae IDE → MCP 面板添加：`command=codegraph`, `args=["serve","--mcp"]` |
| Claude Code / Cursor / opencode | ➖ 未启用 | 需要时跑 `codegraph install --target=claude,cursor,opencode --location=local --yes` |

## 第二批 G1–G5 约束 / Batch-2 G1–G5 Constraints

第二批 5 大功能落地于 `.trae/documents/five-major-features-batch-2-plan.md`，实施顺序 G2 → G1 → G3 → G5 → G4，所有子模块共享下列硬约束：

- **DTO 目录化 / DTO Directory**：新增领域必须在 `server/appApi/dto/<feature>.ts` 与 `src/lib/api/dto/<feature>.ts` 双侧分文件维护，并由 `dto/index.ts` barrel 统一 re-export，禁止把跨领域 schema 揉进单文件。
- **私密为主 / Privacy First**：不引入第三方协作账号；G4 旅伴投稿采用 `slug + token-hash` 单向写入沙盒 `var/contribution-inbox/`，token 仅哈希入库，明文只在创建时一次性返回。
- **路由四处同步 / Router Four-Point Sync**：新增前端路由必须同时更新 `src/modules/app/router.ts`（AppRoute 联合 / `createXxxRoute` 工厂 / `parsePathname` 规则 / `pathnameFor` 实现）+ `routeRenderers.tsx` 注册表（`RegisteredAuthenticatedRoute` 排除公开路由）+ `routeGuards.ts`（公开路由放行）+ `App.tsx`（`renderPublicRoute` 分支）。
- **视觉 Shell 收口 / Visual Shell**：所有新页面外层必须使用 `--page-frame`（1180px 窄页框，与旅行杂志默认内容页一致）容器，shell 选择器（`*-shell`）统一在 `src/styles/visual-system.css` 注册。仅首页 / 工作台类宽幅页面（admin / stats / atlas / journey / live-trip 等）保留 `--page-frame-wide`（1320px）。新页面禁止内联 `max-width`，禁止默认走 wide-frame——否则在常规视口下卡片会贴边、缺少视觉边距。 / All new pages MUST use `--page-frame` (1180px narrow page frame, aligned with the travel-magazine default content frame). Only dashboards / workbenches (admin / stats / atlas / journey / live-trip, etc.) keep `--page-frame-wide` (1320px). New pages must not inline `max-width` or default to the wide frame — otherwise cards touch the viewport edges and lose horizontal breathing room at typical viewports.
- **统计而非 LLM / Statistics over LLM**：G3 事件回想仅做 facet 索引（不引入 FTS5/RRF/向量）；G5 节奏画像基于纯统计指纹，手写 SVG 雷达图（参考 `tripStoryExport.ts` / `memoryCapsuleExport.ts`），不调用 LLM。
- **提醒体系扩展 / Reminder Extension**：`trip_reconciliation_due` 已并入 `REMINDER_TYPES` + `REMINDER_LABELS` + `generateAccountReminders` + `upsertReminderState` + 导航 kind `tripReconciliation`，新增提醒类型必须沿用同一管线。

