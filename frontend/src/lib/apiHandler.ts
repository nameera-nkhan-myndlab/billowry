import type { NextApiRequest, NextApiResponse } from 'next';
import { HttpError } from './validation';

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export function withMethods(handlers: Partial<Record<string, Handler>>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const h = handlers[req.method || 'GET'];
    if (!h) {
      res.setHeader('Allow', Object.keys(handlers).join(', '));
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    try {
      await h(req, res);
    } catch (e: any) {
      if (e instanceof HttpError) {
        res.status(e.status).json({ error: e.message });
        return;
      }
      console.error('API error:', e?.name, e?.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}