import authDocsRegistry from '../../../auth/auth.registry';
import adminDocsRegistry from '../../../admin/admin.registry';
import engagementDocsRegistry from '../../../engagement/engagement.registry';
import feedDocsRegistry from '../../../feed/feed.registry';
import followingDocsRegistry from '../../../following/following.registry';
import messagingDocsRegistry from '../../../messaging/messaging.registry';
import notificationsDocsRegistry from '../../../notifications/notifications.registry';
import paymentDocsRegistry from '../../../payment/payment.registry';
import playlistsDocsRegistry from '../../../playlists/playlists.registry';
import playbackDocsRegistry from '../../../playback/playback.registry';
import profileDocsRegistry from '../../../profile/profile.registry';
import tracksDocsRegistry from '../../../tracks/tracks.registry';

const authPaths = authDocsRegistry.paths;
const adminPaths = adminDocsRegistry.paths;
const engagementPaths = engagementDocsRegistry.paths;
const feedPaths = feedDocsRegistry.paths;
const followingPaths = followingDocsRegistry.paths;
const messagingPaths = messagingDocsRegistry.paths;
const notificationsPaths = notificationsDocsRegistry.paths;
const paymentPaths = paymentDocsRegistry.paths;
const playlistsPaths = playlistsDocsRegistry.paths;
const playbackPaths = playbackDocsRegistry.paths;
const profilePaths = profileDocsRegistry.paths;
const tracksPaths = tracksDocsRegistry.paths;

const allPaths = {
  ...authPaths,
  ...adminPaths,
  ...engagementPaths,
  ...feedPaths,
  ...followingPaths,
  ...messagingPaths,
  ...notificationsPaths,
  ...paymentPaths,
  ...playlistsPaths,
  ...playbackPaths,
  ...profilePaths,
  ...tracksPaths,
};

export default allPaths;
