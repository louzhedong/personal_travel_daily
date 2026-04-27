# 登录注册交互手册 / Auth Quick Reference

这份文档是"交互手册 / Quick Reference"，面向快速上手与联调，只保留登录、注册、会话恢复、退出的关键路径与 API 调用清单。完整技术方案、架构图、时序图请查阅 [`auth-technical-design.md`](./auth-technical-design.md)。

This document is a quick reference covering the key paths and API call list for login, register, session restore, and logout. For full design, architecture diagrams, and sequence diagrams, see [`auth-technical-design.md`](./auth-technical-design.md).

## 当前能力 / Current Capabilities

- 前端认证入口已拆分为 `/login` 与 `/register`，旧入口 `/auth` 自动规范到 `/login`。
- The frontend has standalone `/login` and `/register` routes, and legacy `/auth` is auto-redirected to `/login`.
- 登录成功后进入主页面 `/`；刷新页面会通过会话接口自动恢复登录状态。
- 退出登录与删除旅行记录都需要二次确认。

## 默认演示账号 / Default Demo Account

本地执行 `npm run db:seed` 后，会自动写入默认演示账号：

| 项 / Item | 值 / Value |
| --- | --- |
| 用户名 / Username | `demo` |
| 密码 / Password | `demo123456` |
| 昵称 / Nickname | `Voyage Atlas` |
| 角色 / Role | `admin` |

如需修改默认密码，可调整环境变量 `APP_DEFAULT_ACCOUNT_PASSWORD`。

## 前端路由速查 / Frontend Route Cheatsheet

| 路径 / Path | 行为 / Behavior |
| --- | --- |
| `/login` | 登录页；未登录默认落这里 |
| `/register` | 注册页 |
| `/auth` | 兼容旧入口，规范到 `/login` |
| `/` | 已登录主应用 |
| `/admin` | 管理员后台；普通用户回退到 `/` |

## API 调用清单 / API Call List

主业务 API 提供以下认证接口：

- `POST /api/auth/register`：新建账号，初始化默认同行人，成功后自动写 cookie 登录。
- `POST /api/auth/login`：校验用户名密码，成功后写入新 session。
- `GET /api/auth/session`：前端初始化时恢复登录态的标准入口。
- `POST /api/auth/logout`：删除当前 session 并清 cookie。
- `GET /api/admin/overview`：管理员后台聚合视图，需要 `role === 'admin'`。

完整契约见 [`app-api-contract.md`](./app-api-contract.md)。

## 会话与跨刷新 / Session and Refresh Behavior

- 浏览器侧使用 Cookie Session；cookie 名 `voyage_atlas_session`，`HttpOnly + SameSite=Lax`。
- 前端请求默认携带 `credentials: 'include'`。
- 页面初始化时先调用 `GET /api/auth/session` 判断当前是否已登录。
- 本地开发优先通过同源 `/api` 代理访问主业务 API，失败后再回退到直连端口。

## 数据权限边界 / Data Permission Boundary

- 当前账号只能编辑、删除自己的旅行记录。
- 其他旅伴的记录仍可查看，但不开放编辑和删除。

## 本地联调 / Local Setup

推荐一键启动：

```bash
npm run dev:all
```

该命令会自动执行 `db:generate`、`db:migrate:deploy`、`db:seed`。

默认地址：

- 前端：`http://127.0.0.1:5173/`
- 登录页：`http://127.0.0.1:5173/login`
- 注册页：`http://127.0.0.1:5173/register`
- 主业务 API：`http://127.0.0.1:8788/health`
- 攻略 API：`http://127.0.0.1:8383/health`

## 验收清单 / Acceptance Checklist

1. 未登录进入应用是否自动跳到 `/login`
2. `/register` 是否可以注册新账号并自动登录
3. 登录后刷新页面是否仍保持登录
4. `/auth` 是否自动跳到 `/login`
5. 退出登录是否需要二次确认，并清掉 cookie
6. 删除旅行记录是否需要二次确认
7. 默认种子账号 `demo` 是否是 `admin`，普通用户访问 `/api/admin/overview` 是否返回 `403`

Summary: follow this quick reference to get an auth flow running locally; fall back to the full design doc when investigating edge cases.
