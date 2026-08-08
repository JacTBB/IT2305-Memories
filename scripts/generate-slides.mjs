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
const EXCLUDE = new Set(['next.svg', 'vercel.svg', 'SIT.png']);
const HERO_ORDER = ['Hero1.jpg', 'Hero2.jpg', 'Hero3.jpg', 'Hero4.jpg'];

const stream = client.listObjectsV2(BUCKET, '', true);
const objects = [];
stream.on('data', (obj) => objects.push(obj.name));
stream.on('error', (err) => { console.error('ERROR', err); process.exit(1); });
stream.on('end', () => {
  const media = objects
    .filter((name) => !EXCLUDE.has(name) && !HERO_ORDER.includes(name))
    .map((name) => {
      const ext = path.extname(name).toLowerCase();
      if (IMAGE_EXTS.has(ext)) return { name, type: 'image' };
      if (VIDEO_EXTS.has(ext)) return { name, type: 'video' };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const entries = [
    ...HERO_ORDER.map((name) => ({ name, type: 'image' })),
    ...media,
  ];

  const lines = entries.map(({ name, type }) => {
    const encoded = name.replace(/ /g, '%20');
    return `  { src: getImageUrl('${encoded}'), type: '${type}' },`;
  });

  const output = `import { getImageUrl } from '@/lib/minio';

export interface Slide {
  src: string;
  type: 'image' | 'video';
}

export const slides: Slide[] = [
${lines.join('\n')}
];
`;

  const outPath = path.join(__dirname, '..', 'src', 'lib', 'slides.ts');
  fs.writeFileSync(outPath, output);
  console.log(`Wrote ${entries.length} entries (${media.filter(m => m.type === 'video').length} videos) to ${outPath}`);
});
