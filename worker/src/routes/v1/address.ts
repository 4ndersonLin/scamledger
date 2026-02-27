import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { AddressService } from '../../services/address-service.js';
import { sanitizeMiddleware } from '../../middleware/sanitize.js';
import type { Chain } from '@cryptoscam/shared';

const address = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get address detail via API
address.get('/address/:chain/:address', async (c) => {
  const chain = c.req.param('chain');
  const addr = c.req.param('address');

  const addressService = new AddressService(c.env);
  const detail = await addressService.getAddressDetail(chain, addr);

  if (!detail) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Address not found',
        },
      },
      404,
    );
  }

  const rateLimitInfo = c.get('rateLimitInfo');
  return c.json({
    success: true,
    data: detail,
    meta: rateLimitInfo
      ? {
          rate_limit: {
            limit: rateLimitInfo.limit,
            remaining: rateLimitInfo.remaining,
            reset: rateLimitInfo.reset,
          },
        }
      : undefined,
  });
});

interface BatchAddressLookup {
  chain: Chain;
  address: string;
}

// Batch address lookup
address.post('/address/batch', sanitizeMiddleware, async (c) => {
  const body = c.get('sanitizedBody');

  if (!Array.isArray(body)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must be an array of {chain, address} objects',
        },
      },
      400,
    );
  }

  if (body.length > 50) {
    return c.json(
      {
        success: false,
        error: {
          code: 'BATCH_TOO_LARGE',
          message: 'Batch size must not exceed 50',
        },
      },
      400,
    );
  }

  const addressService = new AddressService(c.env);
  const results = [];

  for (const item of body as BatchAddressLookup[]) {
    if (!item.chain || !item.address) {
      results.push({ chain: item.chain ?? null, address: item.address ?? null, found: false });
      continue;
    }

    const detail = await addressService.getAddressDetail(item.chain, item.address);
    if (detail) {
      results.push({ ...detail, found: true });
    } else {
      results.push({ chain: item.chain, address: item.address, found: false });
    }
  }

  const rateLimitInfo = c.get('rateLimitInfo');
  return c.json({
    success: true,
    data: results,
    meta: rateLimitInfo
      ? {
          rate_limit: {
            limit: rateLimitInfo.limit,
            remaining: rateLimitInfo.remaining,
            reset: rateLimitInfo.reset,
          },
        }
      : undefined,
  });
});

export { address };
