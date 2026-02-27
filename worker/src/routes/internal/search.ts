import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { SearchService } from '../../services/search-service.js';
import { validateSearchParams, DEFAULT_PAGE_SIZE } from '@cryptoscam/shared';
import type { SearchParams, Chain, ScamType } from '@cryptoscam/shared';

const search = new Hono<{ Bindings: Env; Variables: Variables }>();

// Search addresses
search.get('/search', async (c) => {
  const query = c.req.query();

  // Build params with type coercion for numeric fields
  const rawParams: Record<string, unknown> = {
    ...query,
  };
  if (query.page) {
    rawParams.page = parseInt(query.page, 10);
  }
  if (query.limit) {
    rawParams.limit = parseInt(query.limit, 10);
  }

  // Validate
  const validation = validateSearchParams(rawParams);
  if (!validation.valid) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search parameters',
          details: validation.errors,
        },
      },
      400,
    );
  }

  const params: SearchParams = {
    q: query.q,
    chain: query.chain as Chain | undefined,
    scam_type: query.scam_type as ScamType | undefined,
    date_from: query.date_from,
    date_to: query.date_to,
    sort: query.sort as SearchParams['sort'],
    page: query.page ? parseInt(query.page, 10) : 1,
    limit: query.limit ? parseInt(query.limit, 10) : DEFAULT_PAGE_SIZE,
  };

  const searchService = new SearchService(c.env);
  const result = await searchService.searchAddresses(params);

  return c.json({ success: true, data: result.data, meta: result.meta });
});

export { search };
