# Harness 工程目录

本目录按 learn-harness-engineering 中文教程建立，用于让长时运行的 coding agent 在多轮会话中保持状态、验证和交接连续性。

## 文件说明

- `init.sh`：统一初始化、测试、构建和 diff check 入口。
- `feature_list.json`：机器可读的功能状态和验证证据。
- `claude-progress.md`：当前已验证状态、blocker 和会话记录。
- `session-handoff.md`：长会话结束时的交接摘要。
- `clean-state-checklist.md`：收尾检查清单。
- `evaluator-rubric.md`：单轮或里程碑评审表。
- `quality-document.md`：产品领域和架构层质量快照。

## 常用命令

```bash
bash harness/init.sh
RUN_START_COMMAND=1 bash harness/init.sh
```

## 约束

根目录只放用户指定的 `AGNETS.md`；其余 Harness 工件都放在本目录。
