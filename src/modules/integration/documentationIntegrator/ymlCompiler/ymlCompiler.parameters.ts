import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

const docsRoot = __dirname;

const commonParameters = YAML.parse(
  fs.readFileSync(
    path.join(docsRoot, '../../../../shared/docs/yml/common.parameters.yml'),
    'utf8',
  ),
);

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

const authParameters = authDocsRegistry.parameters;
const adminParameters = adminDocsRegistry.parameters;
const engagementParameters = engagementDocsRegistry.parameters;
const feedParameters = feedDocsRegistry.parameters;
const followingParameters = followingDocsRegistry.parameters;
const messagingParameters = messagingDocsRegistry.parameters;
const notificationsParameters = notificationsDocsRegistry.parameters;
const paymentParameters = paymentDocsRegistry.parameters;
const playlistsParameters = playlistsDocsRegistry.parameters;
const playbackParameters = playbackDocsRegistry.parameters;
const profileParameters = profileDocsRegistry.parameters;
const tracksParameters = tracksDocsRegistry.parameters;

const allParameters = {
  ...commonParameters,
  ...authParameters,
  ...adminParameters,
  ...engagementParameters,
  ...feedParameters,
  ...followingParameters,
  ...messagingParameters,
  ...notificationsParameters,
  ...paymentParameters,
  ...playlistsParameters,
  ...playbackParameters,
  ...profileParameters,
  ...tracksParameters,
};

export default allParameters;
