import fs from 'fs';
import path from 'path';
import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';

import userDocsRegistry from '../../user/user.registry';

interface DocumentationRegistry {
  moduleName: string;
  registry: OpenAPIRegistry;
  paths: Record<string, any>;
  responses: Record<string, any>;
  schemas: Record<string, any>;
}

const registries: DocumentationRegistry[] = [userDocsRegistry];

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

  console.log(outputDir);

  const filePath = path.join(
    outputDir,
    `${moduleName}/docs/${moduleName}Schemas.json`,
  );

  fs.writeFileSync(filePath, JSON.stringify(schemas, null, 2));

  console.log(`Generated ${moduleName}Schemas.json  @${outputDir}`);
}

export default allSchemas;
