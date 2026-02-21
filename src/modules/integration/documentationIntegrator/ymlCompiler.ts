import * as fs from "fs";
import * as path from "path";
import YAML from "yaml";
import deepmerge from "deepmerge";

import { removeSecurityFromAuthEndpoints } from "../../../shared/docs/ymlLoadingHelper";
const docsRoot = __dirname;

/**
 * Load all component and path YAMLs
 */
const baseDoc = YAML.parse(
	fs.readFileSync(path.join(docsRoot, "./configurations.yml"), "utf8"),
);

const commonResponses = YAML.parse(
	fs.readFileSync(
		path.join(docsRoot, "../../../shared/docs/yml/common.respones.yml"),
		"utf8",
	),
);

const commonSchemas = YAML.parse(
	fs.readFileSync(
		path.join(docsRoot, "../../../shared/docs/yml/common.schemas.yml"),
		"utf8",
	),
);

const commonParameters = YAML.parse(
	fs.readFileSync(
		path.join(docsRoot, "../../../shared/docs/yml/common.parameters.yml"),
		"utf-8",
	),
);

import userDocsRegistry from "../../user/user.registry";
import { OpenAPIObject } from "@asteasolutions/zod-to-openapi/dist/types";
const userDocs = userDocsRegistry.docs;

// Merge all paths
const allPaths = {
	// ...authDocs,
	// ...agentDocs,
	...userDocs,
};

// Remove security from auth endpoints
removeSecurityFromAuthEndpoints(allPaths);

// Deep merge everything into final Swagger doc
const finalSwaggerDoc: OpenAPIObject = deepmerge.all([
	baseDoc,
	{ paths: allPaths },
	{
		components: {
			responses: commonResponses,
			schemas: commonSchemas,
			parameters: commonParameters,
		},
	},
]) as OpenAPIObject;

export default finalSwaggerDoc;
