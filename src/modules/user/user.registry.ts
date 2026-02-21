// user.registry.ts
import * as RequestBodies from "./dtos/user.requet.body";
import * as Responses from "./dtos/user.response";
import { createModuleSchemasRegistry } from "../../shared/docs/dtoDocumenter";
import { loadYamlFilesFromDir } from "../../shared/docs/ymlLoadingHelper";

const root = __dirname;

const userYmlDocs = loadYamlFilesFromDir(root, "./docs");

const userSchemasRegistry = createModuleSchemasRegistry(
	RequestBodies,
	Responses,
);

const userDocsRegistry = {
	moduleName: "user",
	registry: userSchemasRegistry,
	docs: userYmlDocs,
};

export default userDocsRegistry;
