import fs from 'fs';
import path from 'path';
import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
// import logger from '../../../shared/logger/logger';

import authDocsRegistry from '../../auth/auth.registry';
import adminDocsRegistry from '../../admin/admin.registry';
import engagementDocsRegistry from '../../engagement/engagement.registry';
import feedDocsRegistry from '../../feed/feed.registry';
import followingDocsRegistry from '../../following/following.registry';
import messagingDocsRegistry from '../../messaging/messaging.registry';
import notificationsDocsRegistry from '../../notifications/notifications.registry';
import paymentDocsRegistry from '../../payment/payment.registry';
import playlistsDocsRegistry from '../../playlists/playlists.registry';
import playbackDocsRegistry from '../../playback/playback.registry';
import profileDocsRegistry from '../../profile/profile.registry';
import tracksDocsRegistry from '../../tracks/tracks.registry';
interface DocumentationRegistry {
  moduleName: string;
  registry: OpenAPIRegistry;
  paths: Record<string, any>;
  responses: Record<string, any>;
  schemas: Record<string, any>;
}

const registries: DocumentationRegistry[] = [
  authDocsRegistry,
  adminDocsRegistry,
  engagementDocsRegistry,
  feedDocsRegistry,
  followingDocsRegistry,
  messagingDocsRegistry,
  notificationsDocsRegistry,
  paymentDocsRegistry,
  playlistsDocsRegistry,
  playbackDocsRegistry,
  profileDocsRegistry,
  tracksDocsRegistry,
];

const outputDir = path.resolve(__dirname, '..', '..');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const allSchemas: Record<string, any> = {};

for (const { moduleName, registry } of registries) {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const document = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: `${moduleName} API`,
      version: '1.0.0',
    },
  });

  const schemas = document.components?.schemas ?? {};

  Object.assign(allSchemas, schemas);

  if (process.env.MODE !== 'DEV') {
    continue;
  }

  // logger.info(`Generating ${moduleName}Schemas.json...`);

  const filePath = path.join(
    outputDir,
    `${moduleName}/docs/${moduleName}Schemas.json`,
  );

  fs.writeFileSync(filePath, JSON.stringify(schemas, null, 2));

  // logger.info(`Generated ${moduleName}Schemas.json  @${outputDir}`);
}

export default allSchemas;
