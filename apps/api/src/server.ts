import {serve} from '@hono/node-server';
import {createApp} from './app';
import {env} from './config/env';
import {prisma} from './models/client';

const app = createApp();

serve(
  {
    fetch: app.fetch,
    port: env.port,
  },
  (info) => {
    console.log(`Calis API listening on http://localhost:${info.port}`);
  },
);

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
