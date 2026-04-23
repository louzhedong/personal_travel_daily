# 登录注册说明

## 当前能力

- 前端认证入口已经拆分为两个独立路由：
  - `/login`
  - `/register`
- 旧入口 `/auth` 会自动兼容到 `/login`
- 登录成功后进入主页面 `/`
- 刷新页面后会通过会话接口自动恢复登录状态
- 退出登录需要二次确认
- 删除旅行记录需要二次确认

## 默认账号

本地执行 `npm run db:seed` 后，会自动写入默认演示账号：

- 用户名：`demo`
- 密码：`demo123456`
- 昵称：`Voyage Atlas`

如果需要修改默认账号密码，可调整环境变量：

- `APP_DEFAULT_ACCOUNT_PASSWORD`

对应配置见：

- [env.ts](file:///Users/bytedance/project/personal_travel_daily/server/appApi/env.ts)

## 前端路由行为

- 未登录访问应用时，会进入 `/login`
- 直接访问 `/register` 时，会进入注册页
- 访问 `/auth` 时，会被规范到 `/login`
- 退出登录后，会回到 `/login`

对应实现见：

- [App.tsx](file:///Users/bytedance/project/personal_travel_daily/src/modules/App.tsx)
- [AuthPage.tsx](file:///Users/bytedance/project/personal_travel_daily/src/modules/auth/AuthPage.tsx)

## 后端认证接口

主业务 API 提供以下认证接口：

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`

接口实现位于：

- [auth.ts](file:///Users/bytedance/project/personal_travel_daily/server/appApi/routes/auth.ts)

## 会话与跨刷新行为

- 浏览器侧使用 cookie 会话
- 前端请求默认携带 `credentials: 'include'`
- 页面初始化时会先调用会话接口判断当前是否已登录
- 本地开发时优先通过同源 `/api` 代理访问主业务 API，失败后再回退到直连端口

相关实现见：

- [httpClient.ts](file:///Users/bytedance/project/personal_travel_daily/src/lib/api/httpClient.ts)
- [vite.config.ts](file:///Users/bytedance/project/personal_travel_daily/vite.config.ts)
- [buildApp.ts](file:///Users/bytedance/project/personal_travel_daily/server/appApi/buildApp.ts)

## 数据权限边界

- 当前账号只能编辑自己的旅行记录
- 当前账号只能删除自己的旅行记录
- 其他旅伴的记录仍可查看，但不会开放编辑和删除

## 本地联调建议

推荐直接使用一键启动：

```bash
npm run dev:all
```

或 Docker MySQL 方案：

```bash
npm run dev:all:docker
```

启动脚本会自动执行：

- `db:generate`
- `db:migrate:deploy`
- `db:seed`

默认地址：

- 前端：`http://127.0.0.1:5173/`
- 登录页：`http://127.0.0.1:5173/login`
- 注册页：`http://127.0.0.1:5173/register`
- 主业务 API：`http://127.0.0.1:8788/health`
- 攻略 API：`http://127.0.0.1:8383/health`

## 验收建议

建议至少验证下面 6 个点：

1. 未登录进入应用时是否跳到 `/login`
2. `/register` 是否可以注册新账号
3. 登录后刷新页面是否仍保持登录
4. `/auth` 是否自动跳到 `/login`
5. 退出登录是否需要二次确认
6. 删除旅行记录是否需要二次确认
