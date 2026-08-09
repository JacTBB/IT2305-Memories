import { Client } from 'minio';
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

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm']);
const HERO_ORDER = ['Hero1.jpg', 'Hero2.jpg', 'Hero3.jpg', 'Hero4.jpg'];

const excludePath = path.join(__dirname, '..', 'excluded-media.json');
const EXCLUDE = new Set(JSON.parse(fs.readFileSync(excludePath, 'utf-8')));

const locationsPath = path.join(__dirname, '..', 'media-locations.json');
const LOCATIONS = fs.existsSync(locationsPath) ? JSON.parse(fs.readFileSync(locationsPath, 'utf-8')) : {};

function stemOf(name) {
  return name.slice(0, name.length - path.extname(name).length);
}

// Some photos were uploaded as both .jpg and .webp (same shot, two formats) —
// when that happens for an image, keep only the .webp copy. Video files are
// left alone since a .jpg + .mov pair with the same stem is an iPhone Live
// Photo (still frame + its video), not a duplicate.
function dedupeImageVariants(items) {
  const byStem = new Map();
  for (const item of items) {
    const stem = item.name.slice(0, item.name.length - path.extname(item.name).length);
    if (!byStem.has(stem)) byStem.set(stem, []);
    byStem.get(stem).push(item);
  }

  const result = [];
  for (const group of byStem.values()) {
    const images = group.filter((g) => g.type === 'image');
    const videos = group.filter((g) => g.type === 'video');
    result.push(...videos);
    if (images.length <= 1) {
      result.push(...images);
      continue;
    }
    const webp = images.find((g) => g.name.toLowerCase().endsWith('.webp'));
    result.push(webp ?? images[0]);
  }
  return result;
}

const stream = client.listObjectsV2(BUCKET, '', true);
const objects = [];
stream.on('data', (obj) => objects.push(obj.name));
stream.on('error', (err) => { console.error('ERROR', err); process.exit(1); });
stream.on('end', () => {
  const media = dedupeImageVariants(
    objects
      .filter((name) => !EXCLUDE.has(name) && !HERO_ORDER.includes(name))
      .map((name) => {
        const ext = path.extname(name).toLowerCase();
        if (IMAGE_EXTS.has(ext)) return { name, type: 'image' };
        if (VIDEO_EXTS.has(ext)) return { name, type: 'video' };
        return null;
      })
      .filter(Boolean),
  ).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const entries = [
    ...HERO_ORDER.filter((name) => !EXCLUDE.has(name)).map((name) => ({ name, type: 'image' })),
    ...media,
  ];

  // Everything without a specific GPS-derived location is assumed to be Singapore
  // (where the class is based) — the only photos with real GPS traces are the
  // one-week Japan trip; nothing else in the bucket carries location metadata.
  const lines = entries.map(({ name, type }) => {
    const encoded = name.replace(/ /g, '%20');
    const location = LOCATIONS[stemOf(name)] || 'Singapore';
    return `  { src: getImageUrl('${encoded}'), type: '${type}', location: '${location.replace(/'/g, "\\'")}' },`;
  });

  const output = `import { getImageUrl } from '@/lib/minio';

export interface Slide {
  src: string;
  type: 'image' | 'video';
  location?: string;
}

export const slides: Slide[] = [
${lines.join('\n')}
];
`;

  const outPath = path.join(__dirname, '..', 'src', 'lib', 'slides.ts');
  fs.writeFileSync(outPath, output);
  console.log(`Wrote ${entries.length} entries (${media.filter(m => m.type === 'video').length} videos) to ${outPath}`);
});
