const fs = require('fs');
const path = require('path');

const root = process.cwd();
const src = path.join(root, '.github', 'hooks');
const dest = path.join(root, '.git', 'hooks');

if (!fs.existsSync(dest)) {
    console.log('No .git directory found — skipping hook install.');
    process.exit(0);
}

for (const file of fs.readdirSync(src)) {
    const from = path.join(src, file);
    const to = path.join(dest, file);

    if (fs.existsSync(to)) {
        console.log(`Updated hook: ${file}`);
    }

    fs.copyFileSync(from, to);
    fs.chmodSync(to, 0o755);
    console.log(`Installed git hook: ${file}`);
}
