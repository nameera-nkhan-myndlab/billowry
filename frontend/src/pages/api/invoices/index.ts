import { withMethods } from '../../../lib/apiHandler';
import { listInvoices, createInvoice } from '../../../lib/billowry';
import { parseId, validateInvoice, validateStatus } from '../../../lib/validation';

export default withMethods({
  GET: async (req, res) => {
    const status = typeof req.query.status === 'string' && req.query.status ? validateStatus(req.query.status) : undefined;
    const clientId = req.query.clientId ? parseId(req.query.clientId) : undefined;
    res.status(200).json(await listInvoices({ status, clientId }));
  },
  POST: async (req, res) => {
    const input = validateInvoice(req.body, false);
    res.status(201).json(await createInvoice(input));
  },
});