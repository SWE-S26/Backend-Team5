import { z, ZodTypeAny } from 'zod';
import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import { Types } from 'mongoose';

extendZodWithOpenApi(z);

// ─── Registry Helper ──────────────────────────────────────────────────────────

const isZodSchema = (value: unknown): value is ZodTypeAny =>
  typeof value === 'object' && value !== null && '_def' in value;

/**
 * @param schemaGroups - pass the DTOs of request bodies and response bodies
 * @returns registry that is to be exported to the central registry in docs folder
 */
export const createModuleSchemasRegistry = (
  ...schemaGroups: Record<string, ZodTypeAny>[]
): OpenAPIRegistry => {
  const registry = new OpenAPIRegistry();

  schemaGroups
    .flatMap((group) => Object.entries(group))
    .forEach(([key, value]) => {
      if (isZodSchema(value)) {
        registry.register(key, value);
      }
    });

  return registry;
};

// ─── Custom Extensions ────────────────────────────────────────────────────────

/**
 * Validates that a string is a valid MongoDB ObjectId (24-char hex string).
 * Uses mongoose's `Types.ObjectId.isValid` under the hood.
 *
 * @example
 * extendedZod.mongoId() // ZodEffects<ZodString, string, string>
 */
const mongoId = () =>
  z
    .string()
    .refine(
      (val) =>
        Types.ObjectId.isValid(val) && String(new Types.ObjectId(val)) === val,
      {
        message: 'Invalid MongoDB ObjectId',
      },
    );

// ─── Extended Zod ─────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for `z` with two extras:
 *  - OpenAPI support via `.openapi("SchemaName")`
 *  - `mongoId()` for ObjectId validation
 *
 * @description Use `.openapi("DTO_registered_name")` for swagger documentation.
 */
const extendedZod = {
  ...z,
  mongoId,
} as const;

export type ExtendedZod = typeof extendedZod;

export default extendedZod;
