# Data Sync Prompt

当任务涉及导出、导入、数据备份、快照合并、客户端持久化迁移或本地数据恢复时，请优先遵循本 Prompt。

## 适用范围

- `src/components/DataSync.tsx`
- `src/lib/storage.ts`
- 导出 JSON 快照
- 导入并合并已有数据
- 旧版本地数据迁移

## 先看这些文档

- [项目总览](../technical/project-overview.md)
- [App API Contract](../technical/app-api-contract.md)

## 关键代码入口

- `src/components/DataSync.tsx`
- `src/lib/storage.ts`
- `src/modules/app/useTravelStoreActions.ts`
- 相关 repository / store 初始化代码

## 硬约束

1. 导入不是“覆盖一切”，而是按现有 ID 语义进行合并。
2. 旧版本地数据迁移兼容性不能被新功能破坏。
3. 备份文件格式要保持可读、可迁移和可恢复。
4. 导入导出必须考虑旅伴、记录、攻略收藏/关联等跨模块一致性。

## 执行原则

1. 备份和恢复优先保证数据完整性，其次才是 UI 包装。
2. 新增字段时，要同步考虑导入缺省值和旧快照兼容。
3. 导入反馈要清晰说明“新增了什么、合并了什么、跳过了什么”。

## 禁止事项

- 不要在导入流程里直接丢弃无法识别的旧数据而没有兼容策略。
- 不要让快照格式只适配当前版本，完全不考虑向后兼容。
- 不要只改前端按钮，不改真实存储和合并逻辑。

## 推荐改动路径

- UI：`src/components/DataSync.tsx`
- 存储与迁移：`src/lib/storage.ts`
- 写操作编排：`src/modules/app/useTravelStoreActions.ts`

## 完成后检查

- 导出快照是否仍可成功生成
- 导入后是否按 ID 合并已有数据
- 旧版本地数据迁移是否仍可运行
- 新增字段在导入旧快照时是否有合理默认值
