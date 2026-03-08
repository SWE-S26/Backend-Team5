import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
const docsRoot = __dirname;

/**
 * Load all component and path YAMLs
 */
const baseDoc = YAML.parse(
  fs.readFileSync(path.join(docsRoot, '../configurations.yml'), 'utf8'),
);

export default baseDoc;
