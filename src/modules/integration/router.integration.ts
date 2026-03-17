import { Router } from 'express';
const router = Router();

router.use('/get-health', (req, res) => {
  res.json({ status: 'I am working!' });
});

import devSwagger from './documentationIntegrator/swagger.dev';

router.use(devSwagger);

import authRoutes from '../auth/auth.routes';
router.use('/auth', authRoutes);

import publicIntegrationRouter from './router.public.integration';
router.use('/public', publicIntegrationRouter);

import { requireAuth } from '../../shared/middleware/requireAuth';
router.use(requireAuth);

import adminRoutes from '../admin/admin.routes';
router.use('/admin', adminRoutes);

import engagementRouter from '../engagement/engagement.routes';
router.use('/engagement', engagementRouter);

import feedRoutes from '../feed/feed.routes';
router.use('/feed', feedRoutes);

import followingRoutes from '../following/following.routes';
router.use('/following', followingRoutes);

import messagingRoutes from '../messaging/messaging.routes';
router.use('/messages', messagingRoutes);

import notificationsRoutes from '../notifications/notifications.routes';
router.use('/notifications', notificationsRoutes);

import paymentRoutes from '../payment/payment.routes';
router.use('/payment', paymentRoutes);

import playbackRoutes from '../playback/playback.routes';
router.use('/playback', playbackRoutes);

import playlistsRouter from '../playlists/playlists.routes';
router.use('/playlists', playlistsRouter);

import profileRouter from '../profile/profile.routes';
router.use('/profile', profileRouter);

import tracksRouter from '../tracks/tracks.routes';
router.use('/tracks', tracksRouter);

export default router;
