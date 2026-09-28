import type { NextApiRequest, NextApiResponse } from 'next';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Handlers = Partial<Record<string, (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void>>;

export function route(handlers: Handlers) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const h = handlers[(req.method || 'GET').toUpperCase()];
    if (!h) {
      res.setHeader('Allow', Object.keys(handlers).join(', '));
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    try {
      await h(req, res);
    } catch (err: any) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      console.error('API error', req.method, req.url, err?.name, err?.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function parseId(raw: unknown): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, 'Invalid id');
  return n;
}