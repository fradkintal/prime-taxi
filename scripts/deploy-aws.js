const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const awsExe = 'C:\\Users\\fradk\\scoop\\shims\\aws.exe';
const gitExe = 'C:\\Users\\fradk\\scoop\\shims\\git.exe';
const nodeExe = 'C:\\Users\\fradk\\scoop\\apps\\nodejs-lts\\current\\node.exe';

function runAws(args) {
  try {
    const out = execFileSync(awsExe, args, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { ok: true, stdout: out.trim() };
  } catch (err) {
    return { ok: false, stderr: String(err.stderr || err.message || '') };
  }
}

console.log('1. Deploying AWS Lambda Backend (prime-taxi-cloud-api)...');
const fnName = 'prime-taxi-cloud-api';
const lambdaRegion = 'eu-central-1';
const roleArn = 'arn:aws:iam::904610892841:role/papoosh-cloud-bridge-lambda-role';
const zipPath = path.join(rootDir, 'backend', 'aws-lambda', 'function.zip');

let checkFn = runAws(['lambda', 'get-function', '--function-name', fnName, '--region', lambdaRegion]);
if (!checkFn.ok) {
  console.log('Creating new Lambda function prime-taxi-cloud-api...');
  const createRes = runAws([
    'lambda', 'create-function',
    '--function-name', fnName,
    '--runtime', 'nodejs20.x',
    '--role', roleArn,
    '--handler', 'index.handler',
    '--zip-file', `fileb://${zipPath}`,
    '--timeout', '15',
    '--memory-size', '256',
    '--region', lambdaRegion
  ]);
  if (!createRes.ok) {
    console.error('Create Lambda error:', createRes.stderr);
  }
} else {
  console.log('Updating existing Lambda function code...');
  runAws([
    'lambda', 'update-function-code',
    '--function-name', fnName,
    '--zip-file', `fileb://${zipPath}`,
    '--region', lambdaRegion
  ]);
}

// Configure Function URL with CORS
let urlRes = runAws(['lambda', 'get-function-url-config', '--function-name', fnName, '--region', lambdaRegion]);
let functionUrl = '';
if (!urlRes.ok) {
  const createUrlRes = runAws([
    'lambda', 'create-function-url-config',
    '--function-name', fnName,
    '--auth-type', 'NONE',
    '--cors', 'AllowOrigins=*,AllowMethods=*,AllowHeaders=*',
    '--region', lambdaRegion
  ]);
  if (createUrlRes.ok) {
    functionUrl = JSON.parse(createUrlRes.stdout).FunctionUrl;
  }
} else {
  functionUrl = JSON.parse(urlRes.stdout).FunctionUrl;
}

// Ensure public invoke permission for Function URL
runAws([
  'lambda', 'add-permission',
  '--function-name', fnName,
  '--statement-id', 'FunctionURLAllowPublicAccess',
  '--action', 'lambda:InvokeFunctionUrl',
  '--principal', '*',
  '--function-url-auth-type', 'NONE',
  '--region', lambdaRegion
]);
runAws([
  'lambda', 'add-permission',
  '--function-name', fnName,
  '--statement-id', 'FunctionURLInvokeAllowPublicAccess',
  '--action', 'lambda:InvokeFunction',
  '--principal', '*',
  '--invoked-via-function-url',
  '--region', lambdaRegion
]);

console.log('Live AWS Lambda Function URL:', functionUrl);

// 2. Inject cloudApiUrl into src/pricing-data.js and version.json
if (functionUrl) {
  const pricingPath = path.join(rootDir, 'src', 'pricing-data.js');
  let pricingContent = fs.readFileSync(pricingPath, 'utf8');
  pricingContent = pricingContent.replace(/cloudApiUrl:\s*'[^']*'/, `cloudApiUrl: '${functionUrl}'`);
  fs.writeFileSync(pricingPath, pricingContent, 'utf8');
}

const versionPath = path.join(rootDir, 'version.json');
const versionObj = {
  version: '3.1.0',
  minVersion: '1.0.0',
  keyVersion: 3,
  buildNumber: 7,
  updatedAt: new Date().toISOString(),
  cloudApiUrl: functionUrl,
  customerAwsUrl: 'https://drllqs5t3fzo5.cloudfront.net',
  driverAwsUrl: 'https://d2gkypncorjpuw.cloudfront.net',
  adminAwsUrl: 'https://d1qjhe0ijgnja3.cloudfront.net',
  githubPagesUrl: 'https://fradkintal.github.io/prime-taxi/'
};
fs.writeFileSync(versionPath, JSON.stringify(versionObj, null, 2) + '\n', 'utf8');

// 3. Build dist/
execFileSync(nodeExe, [path.join(rootDir, 'scripts', 'build-dist.js')], { cwd: rootDir, stdio: 'inherit' });

// 4. Upload to all 3 AWS S3 + CloudFront Taxi buckets in eu-west-1
const targets = [
  {
    label: 'Customer Web',
    bucket: 'taxi-dev-storage-mobilewebbucket39e2f91a-gdqszkf6kadg',
    cfId: 'E168GY8481VAHT',
    url: 'https://drllqs5t3fzo5.cloudfront.net'
  },
  {
    label: 'Driver Portal Web',
    bucket: 'taxi-dev-storage-driverwebbucketc40e0d1f-ou2ygvzvnqte',
    cfId: 'E1ZI7D8LDXD2VS',
    url: 'https://d2gkypncorjpuw.cloudfront.net'
  },
  {
    label: 'Admin & Dispatcher Web',
    bucket: 'taxi-dev-storage-adminwebbucket98e53bc9-cymr799jwo54',
    cfId: 'E207EC9H2YUUXN',
    url: 'https://d1qjhe0ijgnja3.cloudfront.net'
  }
];

const distDir = path.join(rootDir, 'dist');
for (const t of targets) {
  console.log(`Uploading dist/ to AWS S3 (${t.label}: ${t.bucket})...`);
  runAws([
    's3', 'cp', distDir, `s3://${t.bucket}/`,
    '--recursive',
    '--region', 'eu-west-1',
    '--cache-control', 'no-cache,no-store,must-revalidate'
  ]);
  console.log(`Invalidating CloudFront (${t.cfId} -> ${t.url})...`);
  runAws([
    'cloudfront', 'create-invalidation',
    '--distribution-id', t.cfId,
    '--paths', '/*'
  ]);
}

// 5. Commit and push to GitHub
console.log('Committing and pushing v3.1.0 to GitHub...');
try {
  execFileSync(gitExe, ['add', '-A'], { cwd: rootDir, stdio: 'inherit' });
  execFileSync(gitExe, ['commit', '-m', 'v3.1.0 - Mobile & Multi-View Verified'], { cwd: rootDir, stdio: 'inherit' });
  execFileSync(gitExe, ['push', 'origin', 'main'], { cwd: rootDir, stdio: 'inherit' });
} catch (e) {
  console.log('Git push note:', e.message);
}

console.log('=== DEPLOYMENT COMPLETE ===');
console.log(JSON.stringify(versionObj, null, 2));
