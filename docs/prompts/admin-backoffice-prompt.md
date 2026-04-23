# Admin Backoffice Prompt

当任务涉及后台管理页、管理员只读视图、后台数据聚合、`/admin` 路由或后台信息密度优化时，请优先遵循本 Prompt。

## 适用范围

- `src/modules/admin/*`
- `/admin` 页面布局与交互
- `GET /api/admin/overview`
- 管理员只读聚合接口
- 用户列表 / 详情 / tab / 表格化展示

## 先看这些文档

- [登录注册 + 会话 + 管理员权限技术方案](file:///Users/bytedance/project/personal_travel_daily/docs/technical/auth-technical-design.md)
- [认证模块架构图](file:///Users/bytedance/project/personal_travel_daily/docs/technical/auth-architecture-diagram.md)
- [App API Contract](file:///Users/bytedance/project/personal_travel_daily/docs/technical/app-api-contract.md)

## 关键代码入口

- 前端：
  - `src/modules/admin/AdminPage.tsx`
  - `src/modules/App.tsx`
  - `src/lib/api/adminApi.ts`
  - `src/styles/admin.css`
- 后端：
  - `server/appApi/routes/admin.ts`
  - `server/appApi/services/adminService.ts`
  - `server/appApi/repositories/adminOverviewRepository.ts`
  - `server/appApi/serializers/adminSerializer.ts`
  - `server/appApi/auth/requestAuth.ts`

## 硬约束

1. 后台页入口固定为 `/admin`。
2. 后台接口必须由后端管理员鉴权保护。
3. 当前后台页默认是只读管理视图，不要擅自加入写操作。
4. 后台页优先使用“管理台型”布局，而不是内容消费型大卡片布局。
5. 涉及删除、退出登录等敏感操作，仍需遵守二次确认约定。

## 执行原则

1. 页面布局优先保证信息密度、扫描效率、低跳动。
2. 优先使用：
   - 左侧列表
   - 右侧详情
   - tab
   - 表格
3. 不要把所有账号和所有明细同时全部纵向摊开。
4. 若新增后台字段，先确认是否应由聚合接口返回，而不是前端多次请求拼接。
5. 只要后台数据结构变化，就同步更新：
   - `adminSerializer.ts`
   - `src/lib/api/types.ts`
   - `docs/technical/app-api-contract.md`

## 禁止事项

- 不要把管理员真值只做在前端。
- 不要直接复用普通用户 bootstrap 数据结构来硬凑后台视图。
- 不要在后台页引入与主业务页完全不同的一套视觉语言。
- 不要为了短期方便把业务聚合逻辑塞进 React 组件里。

## 推荐改动路径

### 页面布局优化

- `src/modules/admin/AdminPage.tsx`
- `src/styles/admin.css`

### 后台字段扩展

- `server/appApi/repositories/adminOverviewRepository.ts`
- `server/appApi/services/adminService.ts`
- `server/appApi/serializers/adminSerializer.ts`
- `src/lib/api/types.ts`
- `src/lib/api/adminApi.ts`

### 权限与路由分流

- `server/appApi/auth/requestAuth.ts`
- `server/appApi/routes/admin.ts`
- `src/modules/App.tsx`

## 完成后检查

- `/admin` 是否仍只允许管理员进入
- 左侧列表切换用户后，右侧详情是否同步更新
- tab 切换是否正常
- 大屏与窄屏布局是否仍稳定
- `App.spec.tsx` 与 `AdminPage.spec.tsx` 是否需要同步更新
- 接口契约文档是否需要更新
