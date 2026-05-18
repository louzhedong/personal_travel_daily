# 干净状态检查清单

结束会话前逐项检查：

- [ ] 标准启动路径仍然可用，或已记录无法启动的具体 blocker。
- [ ] 标准验证路径仍然可运行，或已在 `feature_list.json` 记录失败证据。
- [ ] 当前进度已经记录到 `harness/claude-progress.md`。
- [ ] 功能状态真实反映了 passing、blocked 和未验证边界。
- [ ] 没有任何半成品步骤处于未记录状态。
- [ ] 新增文件位置符合约束：除 `AGNETS.md` 外，Harness 文件都在 `harness/` 下。
- [ ] 没有把 `.trae/` 目录纳入提交。
- [ ] 下一轮会话无需人工猜测即可继续。
