import deepmerge from "deepmerge";

import ymlCompilledSwaggerDoc from "./documentationIntegrator/ymlCompiler";
import zodGeneratedSchemas from "./documentationIntegrator/zodSchemasGenerator";
import { OpenAPIObject } from "@asteasolutions/zod-to-openapi/dist/types";

const combinedSwaggerDoc: OpenAPIObject = deepmerge(
	{},
	ymlCompilledSwaggerDoc,
) as OpenAPIObject;

combinedSwaggerDoc.components = combinedSwaggerDoc.components || {};
combinedSwaggerDoc.components.schemas = deepmerge.all([
	combinedSwaggerDoc.components.schemas || {},
	zodGeneratedSchemas,
]) as { [schema: string]: any };

export default combinedSwaggerDoc;
