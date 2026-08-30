# IT2305 Memories

A class memories website for IT2305. Browse photos, react to your favourites, and relive the moments.

## Features

- **Photo carousel** — auto-advancing slideshow on the homepage with shuffle and fullscreen lightbox
- **Download** — save any photo directly from the lightbox
- **Surprise Me** — opens a random photo from the full collection
- **Timeline** — all dated photos in chronological order with date section headers
- **Polaroid / scrapbook view** — toggle the timeline into a scattered polaroid card layout
- **Emoji reactions** — react with ❤️ 😂 🔥 😮 😢 on any photo from the carousel, timeline grid, or lightbox; no login required
- **People filter** — browse photos by classmate using face recognition, from the timeline's People row or the homepage hero carousel's "Filter by person" dropdown
- **Discord login** — OAuth via NextAuth (for future authenticated features)
- **Future Memories (Telegram)** — schedule any class photo to be DM'd to yourself on Telegram at a future date

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

## Face recognition (People)

Photos can be filtered by who's in them. Faces are detected and matched **client-side** with [face-api.js](https://github.com/justadudewhohacks/face-api.js) (model weights ship as static files in `public/models`, no external API or key needed) and clustered server-side into candidate "people" (`src/lib/faces/cluster.ts`, complete-linkage on face descriptors).

**Setup:** apply the face-related migrations before using it:
```bash
npm run migrate
```

**Admin workflow**, at `/admin/faces` (requires `session.user.role === 'admin'`):
1. Index photos and cluster faces into candidate people.
2. Name a cluster, or merge it into an existing person.
3. Open "Review photos" to confirm/reject each matched photo — confirmed photos strengthen future matching for that person; rejected ones are permanently excluded from being re-suggested.
4. Pick a cover photo (★) to set which face represents that person in the People filter and admin grid.

Clusters still needing review are sorted to the front of the admin grid, and unconfirmed photos to the top of each review dialog, so there's always a clear next thing to review.

## Future Memories (Telegram delivery)

Logged-in users can schedule a class photo to be sent to their own Telegram at a future date/time, from `/dashboard/memories` or the "Send to Future Me" button in the photo lightbox.

**Setup:**

1. Create a bot via [@BotFather](https://t.me/BotFather) (`/newbot`) and copy the token it gives you.
2. Add to `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=your-bot-token
   NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
   ```
3. Apply the `scheduled_memory`/`memory_subscription` table migrations:
   ```bash
   npm run migrate
   ```

That's it — the bot and its delivery worker (`src/telegram-bot.js`) start automatically inside `server.js` alongside the web server, both in `npm run dev` and in production. There's no separate process to run.

**How it works:** scheduling a memory generates a `t.me/<bot>?start=snap_{id}_{token}` deep-link (or `sub_{id}_{token}` for a recurring subscription). Opening it and hitting Start links the user's Telegram chat to that row. Every 60s, `server.js` checks for memories whose delivery time has passed and subscriptions whose frequency/day/time-of-day matches right now, and sends the photo via the Bot API — no Telegram-side scheduling needed since photos are already public on the CDN (no image encryption/decryption required, unlike a private photo-upload app).

Since this now runs inside the same process as the web server, a bug in bot/worker code can in principle affect the whole site (and vice versa) — `startTelegramService()` guards against a missing `TELEGRAM_BOT_TOKEN` and against transient DB errors crashing the process, but this is a deliberate simplicity-over-isolation tradeoff, not a hard requirement. Splitting it back into a standalone process is straightforward if that tradeoff ever stops being worth it — call `startTelegramService()` from its own script instead of from `server.js`.
