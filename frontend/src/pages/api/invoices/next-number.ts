import { withMethods } from '../../../lib/apiHandler';
import { nextInvoiceNumber } from '../../../lib/billowry';

export default withMethods({
  GET: async (_req, res) => {
    res.status(200).json(await nextInvoiceNumber());
  },
});