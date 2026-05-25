import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  createFinanceAccountBodySchema,
  financeAccountParamsSchema,
  financeAnnualReportQuerySchema,
  recordFxRateSnapshotBodySchema,
  updateFinanceAccountBodySchema,
} from '../schemas/finance.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  createFinanceAccount,
  deleteFinanceAccount,
  getAnnualReport,
  listFinanceAccounts,
  listRecentFxSnapshots,
  recordFxSnapshot,
  updateFinanceAccount,
} from '../services/financeService.js';
import { isFxAutoFetchEnabled } from '../services/fxService.js';

/**
 * F5 · Finance routes / 财务深耕路由
 */
export async function registerFinanceRoutes(app: FastifyInstance) {
  app.get('/api/finance/accounts', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return listFinanceAccounts(account);
  });

  app.post('/api/finance/accounts', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createFinanceAccountBodySchema, request.body ?? {});
    return createFinanceAccount(account, body);
  });

  app.patch('/api/finance/accounts/:accountResourceId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(financeAccountParamsSchema, request.params);
    const body = parseWithSchema(updateFinanceAccountBodySchema, request.body ?? {});
    return updateFinanceAccount(account, params.accountResourceId, body);
  });

  app.delete('/api/finance/accounts/:accountResourceId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(financeAccountParamsSchema, request.params);
    return deleteFinanceAccount(account, params.accountResourceId);
  });

  app.get('/api/finance/fx', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return listRecentFxSnapshots(account);
  });

  app.post('/api/finance/fx', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(recordFxRateSnapshotBodySchema, request.body ?? {});
    return recordFxSnapshot(account, body);
  });

  app.get('/api/finance/fx/auto', async (request) => {
    await requireAuthenticatedAccount(request);
    return { enabled: await isFxAutoFetchEnabled() };
  });

  app.get('/api/finance/annual', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(financeAnnualReportQuerySchema, request.query ?? {});
    return getAnnualReport(account, query);
  });
}
