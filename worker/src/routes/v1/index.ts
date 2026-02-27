import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { apiKeyAuthMiddleware } from '../../middleware/api-key-auth.js';
import { v1RateLimit } from '../../middleware/rate-limit.js';
import { reports } from './reports';
import { search } from './search';
import { address } from './address';
import { stats } from './stats';

const v1Routes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply API key auth and rate limiting to all v1 routes
v1Routes.use('*', apiKeyAuthMiddleware);
v1Routes.use('*', v1RateLimit);

v1Routes.route('/', reports);
v1Routes.route('/', search);
v1Routes.route('/', address);
v1Routes.route('/', stats);

export { v1Routes };
