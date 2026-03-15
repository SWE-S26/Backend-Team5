#!/usr/bin/env ts-node

/**
 * create-component.ts
 *
 * A CLI script to scaffold a new module/component for a Node.js backend project.
 *
 * Usage:
 *   ts-node scripts/create-component.ts <module-name>
 *   npm run create:component <module-name>
 *
 * Example:
 *   npm run create:component users
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileTemplate {
  /** Relative path from the module root */
  relativePath: string;
  /** Function that returns the initial file content */
  content: (moduleName: string) => string;
}

const MODULES_ROOT = path.resolve(process.cwd(), 'src', 'modules');

/**
 * Defines every file to generate, along with its starter content.
 * To extend the scaffolder, simply add a new entry here.
 */
const FILE_TEMPLATES: FileTemplate[] = [
  // ── Docs / components ──────────────────────────────────────────────────────
  {
    relativePath: 'docs/components/{name}.parameters.yml',
    content: (n) =>
      `# OpenAPI parameter definitions for the ${n} module, starting writing normally like paths`,
  },
  {
    relativePath: 'docs/components/{name}.responses.yml',
    content: (n) =>
      `# OpenAPI parameter definitions for the ${n} module, starting writing normally like paths`,
  },
  {
    relativePath: 'docs/components/{name}.schemas.yml',
    content: (n) =>
      `# OpenAPI parameter definitions for the ${n} module, starting writing normally like paths`,
  },
  {
    relativePath: 'docs/paths/{name}.get.yml',
    content: (n) =>
      `# GET\n/api/${n}/example:
  get:
    tags:
      - ${n}
    summary: Get agent profile by ID.
    description: Returns the agent profile associated with the provided ID.
    parameters:
      - $ref: '#/components/parameters/IdPathParam'
    responses:
      200:
        description: Successfully retrieved agent profile.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GetUserByIdResponseDTO'

      401:
        $ref: '#/components/responses/Unauthorized'
      404:
        $ref: '#/components/responses/NotFound'
      500:
        $ref: '#/components/responses/ServerError'`,
  },
  {
    relativePath: 'docs/paths/{name}.post.yml',
    content: (n) =>
      `# POST\n/api/${n}/example:
  post:
    tags:
      - ${n}
    summary: create agent profile by ID.
    description: Returns the agent profile associated with the provided ID.
    parameters:
      - $ref: '#/components/parameters/IdPathParam'
    responses:
      201:
        description: Successfully created agent profile.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GetUserByIdResponseDTO'

      401:
        $ref: '#/components/responses/Unauthorized'
      404:
        $ref: '#/components/responses/NotFound'
      500:
        $ref: '#/components/responses/ServerError'`,
  },
  {
    relativePath: 'docs/paths/{name}.patch.yml',
    content: (n) =>
      `# PATCH\n/api/${n}/example:
  patch:
    tags:
      - ${n}
    summary: patch agent profile by ID.
    description: Returns the agent profile associated with the provided ID.
    parameters:
      - $ref: '#/components/parameters/IdPathParam'
    responses:
      200:
        description: Successfully retrieved agent profile.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GetUserByIdResponseDTO'

      401:
        $ref: '#/components/responses/Unauthorized'
      404:
        $ref: '#/components/responses/NotFound'
      500:
        $ref: '#/components/responses/ServerError'`,
  },
  {
    relativePath: 'docs/paths/{name}.put.yml',
    content: (n) =>
      `# POST\n/api/${n}/example:
  put:
    tags:
      - ${n}
    summary: Get agent profile by ID.
    description: Returns the agent profile associated with the provided ID.
    parameters:
      - $ref: '#/components/parameters/IdPathParam'
    responses:
      200:
        description: Successfully retrieved agent profile.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GetUserByIdResponseDTO'

      401:
        $ref: '#/components/responses/Unauthorized'
      404:
        $ref: '#/components/responses/NotFound'
      500:
        $ref: '#/components/responses/ServerError'`,
  },
  {
    relativePath: 'docs/paths/{name}.delete.yml',
    content: (n) =>
      `# DELETE\n/api/${n}/example:
  delete:
    tags:
      - ${n}
    summary: Get agent profile by ID.
    description: Returns the agent profile associated with the provided ID.
    parameters:
      - $ref: '#/components/parameters/IdPathParam'
    responses:
      204:
        description: Successfully retrieved agent profile.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GetUserByIdResponseDTO'

      401:
        $ref: '#/components/responses/Unauthorized'
      404:
        $ref: '#/components/responses/NotFound'
      500:
        $ref: '#/components/responses/ServerError'`,
  },

  // ── DTOs ───────────────────────────────────────────────────────────────────
  {
    relativePath: 'dtos/{name}.mapper.ts',
    content: (n) => {
      const pascal = toPascalCase(n);
      return [
        `import { ${pascal}RequestDto } from './${n}.request';`,
        `import { ${pascal}ResponseDto } from './${n}.response';`,
        ``,
        `export class ${pascal}Mapper {`,
        `  static toResponse(entity: any): ${pascal}ResponseDto {`,
        `    // TODO: map entity fields to response DTO`,
        `    return {} as ${pascal}ResponseDto;`,
        `  }`,
        ``,
        `  static toEntity(dto: ${pascal}RequestDto): any {`,
        `    // TODO: map request DTO fields to entity`,
        `    return {};`,
        `  }`,
        `}`,
        ``,
      ].join('\n');
    },
  },
  {
    relativePath: 'dtos/{name}.request.ts',
    content: (n) => {
      const pascal = toPascalCase(n);
      return [
        `import extendedZod from "../../../shared/docs/dtoDocumenter";`,
        `import { ${pascal}IdParamDTO } from './${n}.request.params';`,
        `import { List${pascal}sQueryDto } from './${n}.request.query';`,
        `import { Create${pascal}RequestBodyDTO } from './${n}.request.body';`,
        ``,
        `export const Create${pascal}RequestDTO = extendedZod.object({`,
        `  params: ${pascal}IdParamDTO,`,
        `  query:  List${pascal}sQueryDto,`,
        `  body: Create${pascal}RequestBodyDTO`,
        `});`,
        ``,
      ].join('\n');
    },
  },
  {
    relativePath: 'dtos/{name}.request.params.ts',
    content: (n) => {
      const pascal = toPascalCase(n);
      return [
        `import { idParamDto } from "../../../shared/dtos/commonDto";`,
        `export const ${pascal}IdParamDTO = idParamDto.extend({});`,
      ].join('\n');
    },
  },

  {
    relativePath: 'dtos/{name}.request.query.ts',
    content: (n) => {
      const pascal = toPascalCase(n);
      return [
        `import extendedZod from "../../../shared/docs/dtoDocumenter";`,
        `import { PaginationQueryDto } from "../../../shared/dtos/commonDto";`,
        `
        export const ${pascal}RoleQueryDto = extendedZod.object({
          role: extendedZod.enum(["user", "admin"]).optional(),
        });
        
        export const List${pascal}sQueryDto = PaginationQueryDto.extend(
        ${pascal}RoleQueryDto.shape,
        ).extend({
          // I have added the defualt because, I think every API would need it's default
          // for example you may fetch 8 comments easily, but not 8 posts, I am giving an example
          page: extendedZod.string().default("1"),
          limit: extendedZod.string().default("20"),
        });`,
      ].join('\n');
    },
  },
  {
    relativePath: 'dtos/{name}.request.body.ts',
    content: (n) => {
      const pascal = toPascalCase(n);
      return [
        `import extendedZod from "../../../shared/docs/dtoDocumenter";`,
        `export const Create${pascal}RequestBodyDTO = extendedZod
          .object({
            email: extendedZod.string().email(),
            password: extendedZod.string().min(6),
            name: extendedZod.string().min(2),
          })
          .openapi("Create${pascal}Request", {
            example: {
              email: "john.doe@example.com",
              password: "secret123",
              name: "John Doe",
            },
          });`,
      ].join('\n');
    },
  },
  {
    relativePath: 'dtos/{name}.response.ts',
    content: (n) => {
      const pascal = toPascalCase(n);
      return [
        `import extendedZod from "../../../shared/docs/dtoDocumenter";
        
        export const ${pascal}ResponseDto = extendedZod
          .object({
            id: extendedZod.string(),
            email: extendedZod.string(),
            name: extendedZod.string(),
            role: extendedZod.enum(["user", "admin"]),
          })
          .openapi("${pascal}Response", {
            example: {
              id: "697b7c75001e8cb1d4c0bb67",
              email: "user@example.com",
              name: "cow",
              role: "user",
            },
          });`,
      ].join('\n');
    },
  },
  /**
   *
   *
   */

  // ── Module root files ──────────────────────────────────────────────────────
  {
    relativePath: '{name}.registry.ts',
    content: (n) => {
      const pascal = toPascalCase(n);
      return [
        `import * as RequestBodies from "./dtos/${n}.request.body";`,
        `import * as Responses from "./dtos/${n}.response";`,
        `import { createModuleSchemasRegistry } from "../../shared/docs/dtoDocumenter";`,
        `import { loadYamlFile, loadYamlFilesFromDir } from "../../shared/docs/ymlLoadingHelper";`,
        ``,
        `const root = __dirname;`,
        `const ${n}YmlPaths = loadYamlFilesFromDir(root, "./docs/paths");`,
        `const ${n}YmlSchemas = loadYamlFile(root, "./docs/components/${n}.schemas.yml");`,
        `const ${n}YmlParameters = loadYamlFile(root, "./docs/components/${n}.parameters.yml");`,
        `const ${n}YmlResponses = loadYamlFile(root, "./docs/components/${n}.responses.yml");`,
        `const ${n}SchemasRegistry = createModuleSchemasRegistry(RequestBodies, Responses);`,
        `const ${n}DocsRegistry = {`,
        `  moduleName: "${n}",`,
        `  registry: ${n}SchemasRegistry,`,
        `  paths: ${n}YmlPaths,`,
        `  schemas: ${n}YmlSchemas,`,
        `  parameters: ${n}YmlParameters,`,
        `  responses: ${n}YmlResponses,`,
        `};`,
        `export default ${n}DocsRegistry;`,
        ``,
      ].join('\n');
    },
  },
  {
    relativePath: '{name}.routes.ts',
    content: (n) => {
      const pascal = toPascalCase(n);
      return [
        `import { Router } from 'express';`,
        `import { ${n}Controller } from './${n}.controller';`,
        ``,
        `export const ${n}Router = Router();`,
        `//TODO: const ${n}Controller = new ${pascal}Controller(/* TODO: inject service */);`,
        ``,
        `// ${n}Router.get('/',      (req, res) => ${n}Controller.findAll(req, res));`,
        `// ${n}Router.get('/:id',   (req, res) => ${n}Controller.findOne(req, res));`,
        `// ${n}Router.post('/',     (req, res) => ${n}Controller.create(req, res));`,
        `// ${n}Router.put('/:id',   (req, res) => ${n}Controller.replace(req, res));`,
        `// ${n}Router.patch('/:id', (req, res) => ${n}Controller.update(req, res));`,
        `// ${n}Router.delete('/:id',(req, res) => ${n}Controller.remove(req, res));`,
        ``,
      ].join('\n');
    },
  },
  {
    relativePath: '{name}.repository.ts',
    content: (n) => {
      const pascal = toPascalCase(n);
      return [
        `export class ${pascal}Repository {`,
        `  async findAll(): Promise<any[]> {`,
        `    // TODO: query your data source`,
        `    return [];`,
        `  }`,
        ``,
        `  async findById(id: string): Promise<any | null> {`,
        `    // TODO: query your data source`,
        `    return null;`,
        `  }`,
        ``,
        `  async create(data: any): Promise<any> {`,
        `    // TODO: insert into your data source`,
        `    return data;`,
        `  }`,
        ``,
        `  async update(id: string, data: any): Promise<any | null> {`,
        `    // TODO: update in your data source`,
        `    return null;`,
        `  }`,
        ``,
        `  async delete(id: string): Promise<boolean> {`,
        `    // TODO: delete from your data source`,
        `    return false;`,
        `  }`,
        `}`,
        ``,
      ].join('\n');
    },
  },
  {
    relativePath: '{name}.controller.ts',
    content: (n) => {
      const pascal = toPascalCase(n);
      return [
        `import { Request, Response } from 'express';`,
        `import { parseRequest } from "../../shared/dtos/requestParser";`,
        `import { ${pascal}Service } from './${n}.service';`,
        ``,
        `export class ${pascal}Controller {`,
        `  constructor(private readonly service: ${pascal}Service) {}`,
        ``,
        `  async findAll(_req: Request, res: Response): Promise<void> {`,
        `    //TODO: parse query params if needed`,
        `    res.json({});`,
        `  }`,
        ``,
        `  async findOne(req: Request, res: Response): Promise<void> {`,
        `    //TODO: parse query params if needed`,
        `    res.json({});`,
        `  }`,
        ``,
        `  async create(req: Request, res: Response): Promise<void> {`,
        `    //TODO: parse query params if needed`,
        `    res.json({});`,
        `  }`,
        ``,
        `  async replace(req: Request, res: Response): Promise<void> {`,
        `    //TODO: parse query params if needed`,
        `    res.json({});`,
        `  }`,
        ``,
        `  async update(req: Request, res: Response): Promise<void> {`,
        `    //TODO: parse query params if needed`,
        `    res.json({});`,
        `  }`,
        ``,
        `  async remove(req: Request, res: Response): Promise<void> {`,
        `    //TODO: parse query params if needed`,
        `    res.json({});`,
        `  }`,
        `}`,
        ``,
      ].join('\n');
    },
  },
  {
    relativePath: '{name}.service.ts',
    content: (n) => {
      const pascal = toPascalCase(n);
      return [
        `import { ${pascal}Repository } from './${n}.repository';`,
        ``,
        `export class ${pascal}Service {`,
        `  constructor(private readonly repository: ${pascal}Repository) {}`,
        ``,
        `  async findAll(): Promise<any[]> {`,
        `    return this.repository.findAll();`,
        `  }`,
        ``,
        `  async findById(id: string): Promise<any | null> {`,
        `    return this.repository.findById(id);`,
        `  }`,
        ``,
        `  async create(data: any): Promise<any> {`,
        `    return this.repository.create(data);`,
        `  }`,
        ``,
        `  async update(id: string, data: any): Promise<any | null> {`,
        `    return this.repository.update(id, data);`,
        `  }`,
        ``,
        `  async delete(id: string): Promise<boolean> {`,
        `    return this.repository.delete(id);`,
        `  }`,
        `}`,
        ``,
      ].join('\n');
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert kebab-case / snake_case / lowercase to PascalCase */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, '');
}

/** Resolve a template path, replacing `{name}` with the actual module name */
function resolvePath(
  template: string,
  moduleName: string,
  moduleRoot: string,
): string {
  return path.join(moduleRoot, template.replace(/\{name\}/g, moduleName));
}

// ─── Core operations ──────────────────────────────────────────────────────────

/**
 * Validate that a module name was passed as a CLI argument.
 * Exits the process with a helpful message if missing.
 */
function validateArguments(): string {
  const moduleName = process.argv[2]?.trim();

  if (!moduleName) {
    console.error('\n❌  No module name provided.');
    console.error(
      '   Usage: ts-node scripts/create-component.ts <module-name>',
    );
    console.error('   Example: npm run create:component users\n');
    process.exit(1);
  }

  // Only allow safe names (letters, numbers, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(moduleName)) {
    console.error(`\n❌  Invalid module name: "${moduleName}"`);
    console.error(
      '   Only letters, numbers, hyphens, and underscores are allowed.\n',
    );
    process.exit(1);
  }

  return moduleName;
}

/**
 * Ensure a directory exists, creating it (and any parents) if needed.
 * Uses the `recursive` flag so nested paths are safe to create in one call.
 */
async function ensureDir(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

/**
 * Write a single file with the provided content.
 * The parent directory must already exist (call ensureDir first).
 */
async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.promises.writeFile(filePath, content, 'utf8');
}

/**
 * Collect every unique directory that needs to exist for the given templates,
 * then create them all in one pass before writing any files.
 */
async function createDirectories(
  moduleName: string,
  moduleRoot: string,
): Promise<void> {
  const dirs = new Set<string>();

  // Always include the module root itself
  dirs.add(moduleRoot);

  for (const template of FILE_TEMPLATES) {
    const filePath = resolvePath(template.relativePath, moduleName, moduleRoot);
    dirs.add(path.dirname(filePath));
  }

  for (const dir of dirs) {
    await ensureDir(dir);
  }

  console.log(`  ✔ Created folder: src/modules/${moduleName}`);
}

/**
 * Iterate over every template entry and write its file to disk.
 * Groups console output by DTO vs docs vs root files for readability.
 */
async function createFiles(
  moduleName: string,
  moduleRoot: string,
): Promise<void> {
  const groups = { dto: 0, docs: 0, root: 0 };

  for (const template of FILE_TEMPLATES) {
    const filePath = resolvePath(template.relativePath, moduleName, moduleRoot);
    const content = template.content(moduleName);
    await writeFile(filePath, content);

    if (template.relativePath.startsWith('dtos/')) groups.dto++;
    else if (template.relativePath.startsWith('docs/')) groups.docs++;
    else groups.root++;
  }

  console.log(`  ✔ Created ${groups.dto} DTO files`);
  console.log(`  ✔ Created ${groups.docs} docs files`);
  console.log(`  ✔ Created ${groups.root} module root files`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 1. Validate input
  const moduleName = validateArguments();
  const moduleRoot = path.join(MODULES_ROOT, moduleName);

  console.log(`\nCreating module: ${moduleName}`);

  // 2. Guard against accidentally overwriting an existing module
  if (fs.existsSync(moduleRoot)) {
    console.error(`\n❌  Module "${moduleName}" already exists at:`);
    console.error(`   ${moduleRoot}`);
    console.error(
      '   Delete the folder manually if you want to regenerate it.\n',
    );
    process.exit(1);
  }

  try {
    // 3. Create the directory tree
    await createDirectories(moduleName, moduleRoot);

    // 4. Write all files
    await createFiles(moduleName, moduleRoot);

    // 5. Done!
    console.log(`\n✅  Module "${moduleName}" generated successfully at:`);
    console.log(`   ${moduleRoot}\n`);
  } catch (err) {
    console.error(
      '\n❌  An unexpected error occurred:',
      (err as Error).message,
    );
    process.exit(1);
  }
}

main();
