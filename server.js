import dotenv from 'dotenv';
import next from 'next';
import { getSession } from 'next-auth/react';
import { createServer } from 'node:http';

dotenv.config({ path: '.env.local' });
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, async () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      // Dynamic import so this only resolves (and reads process.env) after
      // dotenv.config() above has already populated it.
      const { startTelegramService } = await import('./src/telegram-bot.js');
      startTelegramService();
    });
});
