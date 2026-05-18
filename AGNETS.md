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
