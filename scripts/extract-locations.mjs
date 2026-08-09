import { Client } from 'minio';
import exifr from 'exifr';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
const BASE_URL = 'https://cdn.jactbb.com/it2305-memories';
const CACHE_PATH = path.join(__dirname, '..', 'media-locations.json');

// Only these formats reliably carry EXIF GPS on this bucket (verified: plain
// .webp uploads and .mp4/.mov videos do not, so we don't waste requests on them).
const GPS_CANDIDATE_EXTS = new Set(['.jpg', '.jpeg']);

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1&accept-language=en`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'IT2305-Memories-Site/1.0 (class memories site, location tagging)' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const addr = data.address || {};
  const place = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state;
  const country = addr.country;
  if (place && country && place !== country) return `${place}, ${country}`;
  return place || country || null;
}

async function main() {
  const objects = [];
  await new Promise((resolve, reject) => {
    const stream = client.listObjectsV2(BUCKET, '', true);
    stream.on('data', (o) => objects.push(o.name));
    stream.on('error', reject);
    stream.on('end', resolve);
  });

  const candidates = objects.filter((name) => GPS_CANDIDATE_EXTS.has(path.extname(name).toLowerCase()));
  const cache = loadCache();

  let processed = 0;
  let found = 0;

  for (const name of candidates) {
    const stem = name.slice(0, name.length - path.extname(name).length);
    if (cache[stem] !== undefined) continue; // already resolved (or confirmed no-location) in a prior run

    const url = BASE_URL + '/' + encodeURIComponent(name).replace(/%2F/g, '/');
    try {
      const res = await fetch(url);
      const buf = Buffer.from(await res.arrayBuffer());
      const gps = await exifr.gps(buf).catch(() => null);

      if (gps) {
        const place = await reverseGeocode(gps.latitude, gps.longitude);
        cache[stem] = place; // may be null if geocoding found nothing
        if (place) found++;
        await sleep(1100); // respect Nominatim's 1 req/sec usage policy
      } else {
        cache[stem] = null;
      }
    } catch (err) {
      console.error(`  failed on ${name}: ${err.message}`);
      cache[stem] = null;
    }

    processed++;
    if (processed % 10 === 0) {
      saveCache(cache);
      console.log(`  ${processed}/${candidates.length} processed, ${found} located so far...`);
    }
  }

  saveCache(cache);
  console.log(`Done. ${processed} newly processed, ${found} newly located. Cache has ${Object.keys(cache).length} entries total.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
