import { withMethods } from '../../../lib/apiHandler';
import { getClient, updateClient, deleteClient } from '../../../lib/billowry';
import { parseId, validateClient } from '../../../lib/validation';

export default withMethods({
  GET: async (req, res) => {
    res.status(200).json(await getClient(parseId(req.query.id)));
  },
  PUT: async (req, res) => {
    const id = parseId(req.query.id);
    res.status(200).json(await updateClient(id, validateClient(req.body)));
  },
  DELETE: async (req, res) => {
    res.status(200).json(await deleteClient(parseId(req.query.id)));
  },
});