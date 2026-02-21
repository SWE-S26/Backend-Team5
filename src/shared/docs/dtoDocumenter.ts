// dtoDocumenter.ts
import { z as extendedZod, ZodTypeAny } from "zod";
import {
	extendZodWithOpenApi,
	OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

const isZodSchema = (value: unknown): value is ZodTypeAny => {
	return typeof value === "object" && value !== null && "_def" in value;
};

/**
 *
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
				registry.register(key, value as ZodTypeAny);
			}
		});

	return registry;
};

extendZodWithOpenApi(extendedZod);

/**@description This is for using .openapi("DTO_registered_name") for swagger documentation */
export default extendedZod;
