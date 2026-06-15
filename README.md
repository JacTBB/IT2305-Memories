# IT2305 Memories

A class memories website for **IT2305 — The Skibidi Class**. Browse photos, react to your favourites, and relive the moments.

## Features

- **Photo carousel** — auto-advancing slideshow on the homepage with shuffle and fullscreen lightbox
- **Download** — save any photo directly from the lightbox
- **Surprise Me** — opens a random photo from the full collection
- **Timeline** — all dated photos in chronological order with date section headers
- **Polaroid / scrapbook view** — toggle the timeline into a scattered polaroid card layout
- **Emoji reactions** — react with ❤️ 😂 🔥 😮 😢 on any photo from the carousel, timeline grid, or lightbox; no login required
- **Discord login** — OAuth via NextAuth (for future authenticated features)

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Drizzle ORM |
| Auth | NextAuth v5 — Discord OAuth |
| Photos | MinIO S3-compatible CDN (`cdn.jactbb.com`) |

## Getting started

```bash
npm install
npm run dev
```

Create a `.env.local` file (not committed) with the following:

```env
# Database
AUTH_DRIZZLE_URL=

# NextAuth
AUTH_SECRET=
AUTH_DISCORD_ID=
AUTH_DISCORD_SECRET=
AUTH_URL=http://localhost:3000

# MinIO CDN
MINIO_ENDPOINT=
MINIO_PORT=
MINIO_REGION=
MINIO_ACCESSKEY=
MINIO_SECRETKEY=
```

## Photo CDN

Photos are served from `https://cdn.jactbb.com/it2305-memories` and are **not** stored in this repository. To upload new photos, use the upload script:

```bash
node scripts/upload-images.mjs
```

Place photos in `public/` before running. The script reads MinIO credentials from `.env.local`.
