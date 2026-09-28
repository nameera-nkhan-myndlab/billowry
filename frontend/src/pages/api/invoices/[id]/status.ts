import { withMethods } from '../../../../lib/apiHandler';
import { updateInvoiceStatus } from '../../../../lib/billowry';
import { parseId, validateStatus } from '../../../../lib/validation';

export default withMethods({
  PATCH: async (req, res) => {
    const id = parseId(req.query.id);
    const status = validateStatus(req.body?.status);
    res.status(200).json(await updateInvoiceStatus(id, status));
  },
});