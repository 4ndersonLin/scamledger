import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { apiRateLimit } from '../../middleware/rate-limit.js';
import { reports } from './reports';
import { search } from './search';
import { address } from './address';
import { stats } from './stats';
import { auth } from './auth';
import { keys } from './keys';

const internalRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply rate limiting to all internal routes
internalRoutes.use('*', apiRateLimit);

internalRoutes.route('/', reports);
internalRoutes.route('/', search);
internalRoutes.route('/', address);
internalRoutes.route('/', stats);
internalRoutes.route('/', auth);
internalRoutes.route('/', keys);

export { internalRoutes };
