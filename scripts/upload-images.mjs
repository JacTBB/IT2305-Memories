import { Client } from 'minio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envVars = fs.readFileSync(envPath, 'utf-8')
  .split('\n')
  .filter(line => line.includes('=') && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...rest] = line.split('=');
    acc[key.trim()] = rest.join('=').trim();
    return acc;
  }, {});

const client = new Client({
  endPoint: envVars.MINIO_ENDPOINT,
  port: parseInt(envVars.MINIO_PORT),
  useSSL: envVars.MINIO_PORT === '443',
  region: envVars.MINIO_REGION,
  accessKey: envVars.MINIO_ACCESSKEY,
  secretKey: envVars.MINIO_SECRETKEY,
});

const BUCKET = 'it2305-memories';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

const files = fs.readdirSync(PUBLIC_DIR).filter(f =>
  IMAGE_EXTS.has(path.extname(f).toLowerCase())
);

console.log(`Uploading ${files.length} files to ${BUCKET}...`);

for (const file of files) {
  const filePath = path.join(PUBLIC_DIR, file);
  const ext = path.extname(file).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';

  try {
    await client.fPutObject(BUCKET, file, filePath, { 'Content-Type': contentType });
    console.log(`  ✓ ${file}`);
  } catch (err) {
    console.error(`  ✗ ${file}: ${err.message}`);
  }
}

console.log('Done.');
