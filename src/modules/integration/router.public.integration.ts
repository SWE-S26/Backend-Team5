import { Router } from 'express';
import { engagementPublicRouter } from '../engagement/engagement.routes';

const publicIntegrationRouter = Router();

publicIntegrationRouter.use('/engagement', engagementPublicRouter);

export default publicIntegrationRouter;
