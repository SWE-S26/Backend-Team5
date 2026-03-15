import * as fs from 'fs';
import * as path from 'path';
import combinedSwaggerDoc from '../src/modules/integration/swagger.integration';

const swaggerUiDist = require('swagger-ui-dist');
const outputDir = path.resolve(__dirname, '../swagger-static');

// Clean and recreate output dir
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

// Copy swagger-ui-dist assets
const distPath = swaggerUiDist.getAbsoluteFSPath();
const filesToCopy = [
  'swagger-ui.css',
  'swagger-ui-bundle.js',
  'swagger-ui-standalone-preset.js',
  'favicon-32x32.png',
];

for (const file of filesToCopy) {
  fs.copyFileSync(path.join(distPath, file), path.join(outputDir, file));
}

// Write the OpenAPI spec as JSON
fs.writeFileSync(
  path.join(outputDir, 'swagger.json'),
  JSON.stringify(combinedSwaggerDoc, null, 2),
);

console.log('✅ OpenAPI spec written to swagger.json');

// Generate index.html
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Beatza API Documentation</title>
  <link rel="stylesheet" href="./swagger-ui.css" />
  <link rel="icon" type="image/png" href="./favicon-32x32.png" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="./swagger-ui-bundle.js"></script>
  <script src="./swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: "./swagger.json",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        deepLinking: true,
        tryItOutEnabled: false, // Disable "Try it out" on static site
      });
    };
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outputDir, 'index.html'), html);
console.log(`✅ Swagger static site built at: ${outputDir}`);
