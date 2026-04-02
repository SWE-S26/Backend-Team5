import { raw, Router } from 'express';
import { PaymentController } from './payment.controller';
import apiVersions from '../../shared/middleware/apiVersions';

const paymentRouter = Router();
const paymentPublicRouter = Router();
export const paymentController = new PaymentController();

paymentPublicRouter.post(
  apiVersions.v1 + '/webhook/stripe',
  paymentController.handleWebhook.bind(paymentController),
);

paymentRouter.get(
  apiVersions.v1 + '/plans',
  paymentController.getPaymentPlans.bind(paymentController),
);

paymentRouter.delete(
  apiVersions.v1 + '/subscriptions',
  paymentController.cancelSubscription.bind(paymentController),
);

paymentRouter.get(
  apiVersions.v1 + '/subscriptions',
  paymentController.getSubscription.bind(paymentController),
);

paymentRouter.patch(
  apiVersions.v1 + '/subscriptions',
  paymentController.updateSubscription.bind(paymentController),
);

paymentRouter.post(
  apiVersions.v1 + '/subscriptions',
  paymentController.createSubscription.bind(paymentController),
);

paymentRouter.post(
  apiVersions.v1 + '/user',
  paymentController.createPayingUser.bind(paymentController),
);

export { paymentPublicRouter };
export default paymentRouter;
