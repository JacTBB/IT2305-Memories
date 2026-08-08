# IT2305 Memories

A class memories website for IT2305. Browse photos, react to your favourites, and relive the moments.

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

## Photo CDN

Photos and videos are served from `https://cdn.jactbb.com/it2305-memories` and are **not** stored in this repository. To upload new media, use the upload script:

```bash
node scripts/upload-images.mjs
```

Place files in `public/` before running. The script reads MinIO credentials from `.env.local`.

Uploading to the bucket alone doesn't make new media show up on the site — `src/lib/slides.ts` is a generated list of everything currently in the bucket. After uploading, regenerate it:

```bash
node scripts/generate-slides.mjs
```

This lists the bucket, classifies each file as `image` or `video` by extension, and rewrites `slides.ts`. Known non-memory assets (`next.svg`, `vercel.svg`, `SIT.png`) are excluded automatically — edit the `EXCLUDE` set in the script to exclude others.
