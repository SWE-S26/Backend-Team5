import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

const docsRoot = __dirname;

const commonResponses = YAML.parse(
  fs.readFileSync(
    path.join(docsRoot, '../../../../shared/docs/yml/common.responses.yml'),
    'utf8',
  ),
);

import userDocsRegistry from '../../../user/user.registry';
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

const userResponses = userDocsRegistry.responses;
const authResponses = authDocsRegistry.responses;
const adminResponses = adminDocsRegistry.responses;
const engagementResponses = engagementDocsRegistry.responses;
const feedResponses = feedDocsRegistry.responses;
const followingResponses = followingDocsRegistry.responses;
const messagingResponses = messagingDocsRegistry.responses;
const notificationsResponses = notificationsDocsRegistry.responses;
const paymentResponses = paymentDocsRegistry.responses;
const playlistsResponses = playlistsDocsRegistry.responses;
const playbackResponses = playbackDocsRegistry.responses;
const profileResponses = profileDocsRegistry.responses;
const tracksResponses = tracksDocsRegistry.responses;

const allResponses = {
  ...commonResponses,
  ...userResponses,
  ...authResponses,
  ...adminResponses,
  ...engagementResponses,
  ...feedResponses,
  ...followingResponses,
  ...messagingResponses,
  ...notificationsResponses,
  ...paymentResponses,
  ...playlistsResponses,
  ...playbackResponses,
  ...profileResponses,
  ...tracksResponses,
};

export default allResponses;
