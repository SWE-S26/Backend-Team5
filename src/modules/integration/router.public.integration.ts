import { Router } from 'express';
import { engagementPublicRouter } from '../engagement/engagement.routes';
import { paymentPublicRouter } from '../payment/payment.routes';

const publicIntegrationRouter = Router();

publicIntegrationRouter.use('/engagement', engagementPublicRouter);
publicIntegrationRouter.use('/payment', paymentPublicRouter);

export default publicIntegrationRouter;
