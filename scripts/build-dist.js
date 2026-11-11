const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy core web app files to dist/ for GitHub Pages, Firebase Hosting, and AWS S3 + CloudFront
copyRecursive(path.join(rootDir, 'index.html'), path.join(distDir, 'index.html'));
copyRecursive(path.join(rootDir, 'version.json'), path.join(distDir, 'version.json'));
copyRecursive(path.join(rootDir, 'src'), path.join(distDir, 'src'));
copyRecursive(path.join(rootDir, 'public'), path.join(distDir, 'public'));

// Create .nojekyll for GitHub Pages
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');

const versionData = JSON.parse(fs.readFileSync(path.join(rootDir, 'version.json'), 'utf8'));
console.log(`[PRIME TAXI Build] Built dist/ successfully for v${versionData.version} (Build #${versionData.buildNumber})`);
