# 会话交接

## 当前已验证

- 现在明确可用的部分：Harness 文件结构已建立；项目标准脚本见 `package.json`。
- 这轮实际跑过的验证：`bash -n harness/init.sh`；`python3 -m json.tool harness/feature_list.json >/dev/null`；`find harness -maxdepth 1 -type f | sort && test -f AGNETS.md`；`git diff --check`；`GetDiagnostics`。

## 本轮改动

- 新增了哪些代码或行为：无业务代码改动；新增 Agent Harness 工件。
- 基础设施或 harness 发生了哪些变化：根目录新增 `AGNETS.md`，`harness/` 新增状态、验证、交接、质量评审文件。

## 仍损坏或未验证

- 已知缺陷：暂无阻塞级缺陷；`App.spec.tsx` admin mock 调用次数问题在完整 `bash harness/init.sh` 中未复现。
- 未验证路径：首页左右双栏视觉仍需人工浏览器宽度回归。
- 下一轮会话需要注意的风险：Vite 大 chunk warning 仍存在但不阻塞；若 admin mock 失败再次出现，重新打开 `test-001`。

## 下一步最佳动作

- 最高优先级未完成功能：`visual-001` 或 `test-001`，取决于用户是否继续 UI 调整或要求恢复测试绿灯。
- 为什么它是下一步：UI 是当前活跃体验问题；测试 blocker 会影响 harness 标准入口。
- 什么结果才算 passing：目标行为验证通过，证据写入 `feature_list.json` 或 `claude-progress.md`。
- 这一步中哪些东西不要动：不要提交 `.trae/`；不要把首页改成上下堆叠。

## 命令

- 启动命令：`npm run dev:all`
- 停止命令：`npm run dev:stop`
- 验证命令：`npm run test`、`npm run build`、`git diff --check`
- Harness 命令：`bash harness/init.sh`
