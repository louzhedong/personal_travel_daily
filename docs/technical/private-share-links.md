# 私密分享链接治理 / Private Share Link Governance

私密分享链接治理为行程故事、年度回顾、旅伴回忆和旅行胶囊提供可撤销、可过期、可选密码保护的只读访问能力，同时保留产品的私密个人工具定位。

Private Share Link Governance gives trip stories, annual reviews, companion memories, and capsules revocable, expiring, optionally password-protected read-only access while preserving the product as a private personal tool.

## 已落地范围 / Delivered Scope

- 新增 share token 持久化，明文 token 只在创建时返回，数据库只保存 hash。
  Adds share-token persistence; the plain token is returned only on creation, while the database stores only hashes.
- 支持有效期、访问密码、访问次数上限、撤销和匿名访问审计。
  Supports expiry, optional password, max visits, revocation, and anonymous access audit logs.
- 新增 `/share/:token` 公开只读落地页，剥离账号导航和编辑入口。
  Adds the `/share/:token` public read-only page without account navigation or editing controls.
- 账号内管理页可查看、更新和撤销分享链接。
  The authenticated management surface can list, update, and revoke share links.

## API 与数据 / APIs and Data

- `GET /api/share-links`
- `POST /api/share-links`
- `PATCH /api/share-links/:id`
- `POST /api/share-links/:id/revoke`
- `POST /api/public/share-links/:token/access`

Summary: These APIs stay account-scoped, typed through frontend/backend DTO folders, and follow the existing app-api authentication and error conventions.

## 关键文件 / Key Files

- `server/appApi/services/shareLinkService.ts`
- `server/appApi/repositories/shareLinkRepository.ts`
- `src/modules/share/PublicSharePage.tsx`
- `src/lib/api/shareLinksApi.ts`

Summary: The implementation keeps route/service/repository/serializer boundaries on the backend and page/model/API/style boundaries on the frontend.

## 验证 / Verification

- `server/__tests__/appApiRoutes.shareLinks.spec.ts`
- `src/modules/__tests__/PublicSharePage.spec.tsx`

Summary: Focused tests cover the newly added service, route, model, export, or page behavior for this capability.
