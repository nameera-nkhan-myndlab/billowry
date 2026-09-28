import { withMethods } from '../../../lib/apiHandler';
import { listClients, createClient } from '../../../lib/billowry';
import { validateClient } from '../../../lib/validation';

export default withMethods({
  GET: async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    res.status(200).json(await listClients(search));
  },
  POST: async (req, res) => {
    const input = validateClient(req.body);
    res.status(201).json(await createClient(input));
  },
});