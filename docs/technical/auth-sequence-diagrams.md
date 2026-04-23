# 登录注册与会话管理时序图

本文档用于评审场景，聚焦“登录注册 + 会话管理”的关键时序，不展开所有实现细节。若需要查看完整技术设计，请同时阅读：

- [认证模块架构图](file:///Users/bytedance/project/personal_travel_daily/docs/technical/auth-architecture-diagram.md)
- [登录注册 + 会话 + 管理员权限技术方案](file:///Users/bytedance/project/personal_travel_daily/docs/technical/auth-technical-design.md)
- [登录注册说明](file:///Users/bytedance/project/personal_travel_daily/docs/technical/auth-login-register.md)

## 参与方

- `Browser`：浏览器与用户交互界面
- `Frontend App`：前端 React 应用
- `App API Route`：`server/appApi/routes/auth.ts`
- `Auth Service`：`server/appApi/services/authService.ts`
- `Session Helper`：`server/appApi/auth/session.ts`
- `DB`：MySQL + Prisma（`accounts` / `auth_sessions`）

## 1. 注册并自动登录

适用场景：

- 用户首次在 `/register` 提交昵称、用户名、密码
- 注册成功后无需再手动登录，直接进入已登录态

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Frontend as Frontend App
    participant Route as App API Route
    participant Service as Auth Service
    participant Session as Session Helper
    participant DB

    User->>Browser: 在 /register 填写 nickname / username / password
    Browser->>Frontend: 提交注册表单
    Frontend->>Route: POST /api/auth/register
    Route->>Route: 校验请求体
    Route->>Service: registerAccount(body)
    Service->>DB: 查询 username 是否已存在
    DB-->>Service: 不存在
    Service->>Service: hashPassword(password)
    Service->>DB: 创建 Account(role=member)
    Service->>DB: 创建默认同行人与初始业务空间
    Service->>Session: createSessionToken()
    Session-->>Service: sessionToken
    Service->>Session: hashSessionToken(sessionToken)
    Session-->>Service: tokenHash
    Service->>Session: getSessionExpiresAt()
    Session-->>Service: expiresAt
    Service->>DB: 创建 AuthSession(tokenHash, expiresAt)
    DB-->>Service: session 已落库
    Service-->>Route: account + sessionToken + expiresAt
    Route->>Browser: Set-Cookie(voyage_atlas_session=token)
    Route-->>Frontend: 200 { account }
    Frontend->>Frontend: 写入当前账号状态
    Frontend-->>Browser: 跳转到 /
```

评审重点：

- 注册与 session 创建在同一条成功主链路上
- 数据库存储的是 `tokenHash`，不是明文 token
- 用户注册成功后自动登录，减少一次重复操作

## 2. 登录并创建新会话

适用场景：

- 已有账号在 `/login` 输入用户名和密码

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Frontend as Frontend App
    participant Route as App API Route
    participant Service as Auth Service
    participant Session as Session Helper
    participant DB

    User->>Browser: 在 /login 输入 username / password
    Browser->>Frontend: 提交登录表单
    Frontend->>Route: POST /api/auth/login
    Route->>Route: 校验请求体
    Route->>Service: loginAccount(body)
    Service->>DB: 按 username 查询 Account
    DB-->>Service: 返回 account + passwordHash
    Service->>Service: verifyPassword(password, passwordHash)
    alt 用户名或密码错误
        Service-->>Route: throw UNAUTHORIZED
        Route-->>Frontend: 401 INVALID username/password
        Frontend-->>Browser: 展示登录失败提示
    else 校验通过
        Service->>Session: createSessionToken()
        Session-->>Service: sessionToken
        Service->>Session: hashSessionToken(sessionToken)
        Session-->>Service: tokenHash
        Service->>Session: getSessionExpiresAt()
        Session-->>Service: expiresAt
        Service->>DB: 创建 AuthSession(tokenHash, expiresAt)
        DB-->>Service: session 已落库
        Service-->>Route: account + sessionToken + expiresAt
        Route->>Browser: Set-Cookie(voyage_atlas_session=token)
        Route-->>Frontend: 200 { account }
        Frontend->>Frontend: 写入当前账号状态
        Frontend-->>Browser: 跳转到 /
    end
```

评审重点：

- 每次成功登录都会创建一条新会话
- 登录失败不暴露“用户名不存在”还是“密码错误”的细分信息
- Cookie 仍由后端统一写入，前端不手动管理 token

## 3. 刷新页面后的会话恢复

适用场景：

- 用户已经登录
- 浏览器刷新页面或重新打开页面

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant Frontend as Frontend App
    participant Route as App API Route
    participant Auth as Request Auth
    participant Session as Session Helper
    participant DB

    Browser->>Frontend: 刷新页面 / 首次加载应用
    Frontend->>Route: GET /api/auth/session (自动携带 cookie)
    Route->>Auth: getAuthenticatedAccount(request)
    Auth->>Session: readCookieValue(cookie, voyage_atlas_session)
    alt 没有 cookie
        Auth-->>Route: null
        Route-->>Frontend: 200 { account: null }
        Frontend-->>Browser: 跳转到 /login
    else 存在 cookie
        Auth->>DB: deleteExpiredAuthSessions(now)
        Auth->>Session: hashSessionToken(sessionToken)
        Session-->>Auth: tokenHash
        Auth->>DB: findAuthSessionByTokenHash(tokenHash)
        alt session 不存在或已过期
            Auth-->>Route: null
            Route-->>Frontend: 200 { account: null }
            Frontend-->>Browser: 跳转到 /login
        else session 有效
            DB-->>Auth: session + account
            Auth-->>Route: { id, name, username, role }
            Route-->>Frontend: 200 { account }
            Frontend->>Frontend: 恢复当前账号状态
            alt role = admin 且当前路径是 /admin
                Frontend-->>Browser: 继续进入 /admin
            else role = member 且当前路径是 /admin
                Frontend-->>Browser: 回退到 /
            else 普通主应用路径
                Frontend-->>Browser: 进入 /
            end
        end
    end
```

评审重点：

- `GET /api/auth/session` 是前端恢复登录态的唯一标准入口
- 服务端在恢复会话前会先清理过期 session
- 前端只负责页面分流，权限真值仍在后端

## 4. 退出登录

适用场景：

- 已登录用户点击退出登录

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Frontend as Frontend App
    participant Route as App API Route
    participant Service as Auth Service
    participant Session as Session Helper
    participant DB

    User->>Browser: 点击退出登录并确认
    Browser->>Frontend: 触发 logout
    Frontend->>Route: POST /api/auth/logout (自动携带 cookie)
    Route->>Session: readCookieValue(cookie, voyage_atlas_session)
    Session-->>Route: sessionToken
    Route->>Service: logoutAccount(sessionToken)
    Service->>Session: hashSessionToken(sessionToken)
    Session-->>Service: tokenHash
    Service->>DB: deleteAuthSessionByTokenHash(tokenHash)
    DB-->>Service: 删除成功
    Service-->>Route: ok
    Route->>Browser: Set-Cookie(voyage_atlas_session=; Expires=过去时间)
    Route-->>Frontend: 200 { success: true }
    Frontend->>Frontend: 清空当前账号状态
    Frontend-->>Browser: 跳转到 /login
```

评审重点：

- 登出同时做两件事：
  - 删除数据库 session
  - 清掉浏览器 cookie
- 即使 cookie 仍存在，只要数据库记录删掉，请求也无法恢复登录态

## 5. 管理员访问后台的会话与权限关系

适用场景：

- 登录用户访问 `/admin`

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant Frontend as Frontend App
    participant AdminRoute as GET /api/admin/overview
    participant Auth as Request Auth
    participant DB

    Browser->>Frontend: 打开 /admin
    Frontend->>Frontend: 先恢复 session
    Frontend->>AdminRoute: 请求后台数据
    AdminRoute->>Auth: requireAdminAccount(request)
    Auth->>DB: 查 session 对应 account
    alt 未登录
        Auth-->>AdminRoute: throw 401
        AdminRoute-->>Frontend: 401 UNAUTHORIZED
        Frontend-->>Browser: 跳转到 /login
    else 已登录但 role = member
        Auth-->>AdminRoute: throw 403
        AdminRoute-->>Frontend: 403 FORBIDDEN
        Frontend-->>Browser: 回退到 /
    else role = admin
        Auth-->>AdminRoute: 当前管理员账号
        AdminRoute-->>Frontend: 200 AdminOverviewResponse
        Frontend-->>Browser: 渲染后台管理页
    end
```

评审重点：

- 管理员权限依赖 `Account.role`
- 前端体验可以做“回退主页”，但真正的权限裁决必须由后端完成

## 评审建议

如果要在评审会上快速过这套方案，建议顺序如下：

1. 先讲“为什么不用 JWT，而用 Cookie Session”
2. 再讲“注册成功为什么自动登录”
3. 再讲“刷新页面为什么还能恢复登录”
4. 最后讲“管理员权限为什么必须在后端裁决”

## 源码锚点

- 路由层：
  - [auth.ts](file:///Users/bytedance/project/personal_travel_daily/server/appApi/routes/auth.ts)
- 服务层：
  - [authService.ts](file:///Users/bytedance/project/personal_travel_daily/server/appApi/services/authService.ts)
- Session 帮助函数：
  - [session.ts](file:///Users/bytedance/project/personal_travel_daily/server/appApi/auth/session.ts)
- 鉴权恢复：
  - [requestAuth.ts](file:///Users/bytedance/project/personal_travel_daily/server/appApi/auth/requestAuth.ts)
- Session 仓储：
  - [authSessionRepository.ts](file:///Users/bytedance/project/personal_travel_daily/server/appApi/repositories/authSessionRepository.ts)
- 正式技术设计：
  - [auth-technical-design.md](file:///Users/bytedance/project/personal_travel_daily/docs/technical/auth-technical-design.md)
