import { Router } from 'express';
import { engagementPublicRouter } from '../engagement/engagement.routes';
import { paymentPublicRouter } from '../payment/payment.routes';
import { tracksPublicRouter } from '../tracks/tracks.routes';
import { playlistsPublicRouter } from '../playlists/playlists.routes';
import { profilePublicRouter } from '../profile/profile.routes';

const publicIntegrationRouter = Router();

publicIntegrationRouter.use('/engagement', engagementPublicRouter);
publicIntegrationRouter.use('/payment', paymentPublicRouter);
publicIntegrationRouter.use('/tracks', tracksPublicRouter);
publicIntegrationRouter.use('/playlists', playlistsPublicRouter);
publicIntegrationRouter.use('/profile', profilePublicRouter);

export default publicIntegrationRouter;
