import {serveStatic} from '@hono/node-server/serve-static';
import {Hono} from 'hono';
import {cors} from 'hono/cors';
import {env} from './config/env';
import {apiRoutes} from './http/routes/api';

export function createApp() {
  const app = new Hono();

  app.use(
    '/api/*',
    cors({
      origin: env.corsOrigin,
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
    }),
  );

  app.route('/api', apiRoutes);
  app.use('/media/*', serveStatic({root: './public'}));

  app.notFound((c) => c.json({error: {message: 'Not found'}}, 404));

  app.onError((error, c) => {
    console.error(error);
    return c.json({error: {message: 'Internal server error'}}, 500);
  });

  return app;
}
