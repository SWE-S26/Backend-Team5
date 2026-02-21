import * as fs from "fs";
import * as path from "path";
import YAML from "yaml";

/**
 * @param callingDirectory - The directory where the function is called
 * @param relativeDirPath - The path of directory which contains the yml docs,
 * perfered to make the relativeDirPaths with value "./docs"
 * Loads YAML files from a directory, make sure
 */
export const loadYamlFilesFromDir = (
	callingDirectory: string,
	relativeDirPath: string,
): Object => {
	const absolutePath = path.resolve(callingDirectory, relativeDirPath);
	if (!fs.existsSync(absolutePath)) {
		console.warn(`Directory not found: ${absolutePath}, skipping...`);
		return {};
	}

	const files = fs
		.readdirSync(absolutePath)
		.filter((file) => file.endsWith(".yml"));

	const merged: Object = {};
	for (const file of files) {
		const fileContent = fs.readFileSync(path.join(absolutePath, file), "utf8");
		const doc = YAML.parse(fileContent);
		Object.assign(merged, doc);
	}

	return merged;
};

/**
 * Removes security requirements from auth endpoints
 */
export const removeSecurityFromAuthEndpoints = (
	paths: Record<string, any>,
): void => {
	for (const [route, methods] of Object.entries(paths)) {
		if (!methods || typeof methods !== "object") continue;
		for (const [method, operationRaw] of Object.entries(methods)) {
			const operation = operationRaw as any;
			if (
				operation &&
				typeof operation === "object" &&
				"tags" in operation &&
				Array.isArray(operation.tags) &&
				operation.tags.some((tag: string) => tag.includes("No JWT required"))
			) {
				operation.security = [];
			}
		}
	}
};
