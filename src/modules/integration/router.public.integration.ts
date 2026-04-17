import { Router } from 'express';
import { engagementPublicRouter } from '../engagement/engagement.routes';
import { paymentPublicRouter } from '../payment/payment.routes';
import { tracksPublicRouter } from '../tracks/tracks.routes';

const publicIntegrationRouter = Router();

publicIntegrationRouter.use('/engagement', engagementPublicRouter);
publicIntegrationRouter.use('/payment', paymentPublicRouter);
publicIntegrationRouter.use('/tracks', tracksPublicRouter);

export default publicIntegrationRouter;
