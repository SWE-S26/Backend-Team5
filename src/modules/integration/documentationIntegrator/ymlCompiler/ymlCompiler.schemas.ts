import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

const docsRoot = __dirname;

const commonSchemas = YAML.parse(
  fs.readFileSync(
    path.join(docsRoot, '../../../../shared/docs/yml/common.schemas.yml'),
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

const authSchemas = authDocsRegistry.schemas;
const adminSchemas = adminDocsRegistry.schemas;
const engagementSchemas = engagementDocsRegistry.schemas;
const feedSchemas = feedDocsRegistry.schemas;
const followingSchemas = followingDocsRegistry.schemas;
const messagingSchemas = messagingDocsRegistry.schemas;
const notificationsSchemas = notificationsDocsRegistry.schemas;
const paymentSchemas = paymentDocsRegistry.schemas;
const playlistsSchemas = playlistsDocsRegistry.schemas;
const playbackSchemas = playbackDocsRegistry.schemas;
const profileSchemas = profileDocsRegistry.schemas;
const tracksSchemas = tracksDocsRegistry.schemas;

const allSchemas = {
  ...commonSchemas,
  ...authSchemas,
  ...adminSchemas,
  ...engagementSchemas,
  ...feedSchemas,
  ...followingSchemas,
  ...messagingSchemas,
  ...notificationsSchemas,
  ...paymentSchemas,
  ...playlistsSchemas,
  ...playbackSchemas,
  ...profileSchemas,
  ...tracksSchemas,
};

export default allSchemas;
