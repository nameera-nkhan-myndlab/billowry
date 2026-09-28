import { withMethods } from '../../../../lib/apiHandler';
import { getInvoice, updateInvoice, deleteInvoice } from '../../../../lib/billowry';
import { parseId, validateInvoice } from '../../../../lib/validation';

export default withMethods({
  GET: async (req, res) => {
    res.status(200).json(await getInvoice(parseId(req.query.id)));
  },
  PUT: async (req, res) => {
    const id = parseId(req.query.id);
    res.status(200).json(await updateInvoice(id, validateInvoice(req.body, true)));
  },
  DELETE: async (req, res) => {
    res.status(200).json(await deleteInvoice(parseId(req.query.id)));
  },
});