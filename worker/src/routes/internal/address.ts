import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { AddressService } from '../../services/address-service.js';

const address = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get address detail
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

  return c.json({ success: true, data: detail });
});

export { address };
