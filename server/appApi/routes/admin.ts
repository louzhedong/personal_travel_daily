import type { FastifyInstance } from 'fastify';
import { requireAdminAccount } from '../auth/requestAuth.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  adminAuditLogBodySchema,
  adminAuditLogQuerySchema,
  adminOverviewQuerySchema,
  adminQualityAutoFixBodySchema,
} from '../schemas/admin.js';
import { listAdminAuditTrail, recordAdminAuditLog } from '../services/adminAuditService.js';
import { repairAdminQualityIssue } from '../services/adminQualityAutoFixService.js';
import { getAdminOverview } from '../services/adminService.js';

export async function registerAdminRoutes(app: FastifyInstance) {
  app.get('/api/admin/overview', async (request) => {
    await requireAdminAccount(request);
    parseWithSchema(adminOverviewQuerySchema, request.query);
    return getAdminOverview();
  });

  app.get('/api/admin/audit-logs', async (request) => {
    await requireAdminAccount(request);
    const query = parseWithSchema(adminAuditLogQuerySchema, request.query);
    return listAdminAuditTrail(query);
  });

  app.post('/api/admin/audit-logs', async (request) => {
    const account = await requireAdminAccount(request);
    const body = parseWithSchema(adminAuditLogBodySchema, request.body);
    return recordAdminAuditLog(account.id, body);
  });

  app.post('/api/admin/quality-issues/auto-fix', async (request) => {
    const account = await requireAdminAccount(request);
    const body = parseWithSchema(adminQualityAutoFixBodySchema, request.body);
    const result = await repairAdminQualityIssue(body);

    await recordAdminAuditLog(account.id, {
      action: body.dryRun ? 'quality_issue_auto_fix_previewed' : 'quality_issue_auto_fixed',
      targetKind: result.targetKind,
      targetId: result.targetId,
      metadata: {
        issueId: result.issueId,
        issueType: result.issueType,
        status: result.status,
        repairable: result.repairable,
        changes: result.changes,
      },
    });

    return result;
  });
}
