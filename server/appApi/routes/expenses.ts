import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  createTripExpenseBodySchema,
  createTripExpenseDraftFromPlanningBodySchema,
  tripExpenseListQuerySchema,
  tripExpenseParamsSchema,
  tripExpensePlanningParamsSchema,
  updateTripExpenseBodySchema,
} from '../schemas/expenses.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  createExpenseDraftFromPlanningItem,
  createTripExpenseResource,
  deleteTripExpenseResource,
  listTripExpenses,
  updateTripExpenseResource,
} from '../services/expenseService.js';
import { getTripSettlement } from '../services/expenses/settlementService.js';

export async function registerExpenseRoutes(app: FastifyInstance) {
  app.get('/api/expenses', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(tripExpenseListQuerySchema, request.query);
    return listTripExpenses(account.id, query.tripId);
  });

  app.get('/api/expenses/settlement', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(tripExpenseListQuerySchema, request.query);
    return getTripSettlement(account.id, query.tripId);
  });

  app.post('/api/expenses', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createTripExpenseBodySchema, request.body);
    return createTripExpenseResource(account.id, body);
  });

  app.patch('/api/expenses/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripExpenseParamsSchema, request.params);
    const body = parseWithSchema(updateTripExpenseBodySchema, request.body);
    return updateTripExpenseResource(account.id, params.id, body);
  });

  app.delete('/api/expenses/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripExpenseParamsSchema, request.params);
    return deleteTripExpenseResource(account.id, params.id);
  });

  app.post('/api/expenses/from-planning/:tripId/:itemId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripExpensePlanningParamsSchema, request.params);
    const body = parseWithSchema(createTripExpenseDraftFromPlanningBodySchema, request.body);
    return createExpenseDraftFromPlanningItem(account.id, params.tripId, params.itemId, body);
  });
}
