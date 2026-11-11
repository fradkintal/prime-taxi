const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const versionJsonPath = path.join(rootDir, 'version.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));

const args = process.argv.slice(2);
if (args.includes('--patch')) {
  const parts = pkg.version.split('.').map(Number);
  parts[2] += 1;
  pkg.version = parts.join('.');
} else if (args.includes('--minor')) {
  const parts = pkg.version.split('.').map(Number);
  parts[1] += 1;
  parts[2] = 0;
  pkg.version = parts.join('.');
}

const nowIso = new Date().toISOString();
versionData.version = pkg.version;
versionData.buildNumber = (versionData.buildNumber || 0) + 1;
versionData.updatedAt = nowIso;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + '\n', 'utf8');

console.log(`[PRIME TAXI Version] Updated to v${versionData.version} (Build #${versionData.buildNumber})`);
