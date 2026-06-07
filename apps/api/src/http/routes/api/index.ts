import {Hono} from 'hono';
import {healthRoutes} from './health';
import {v1Routes} from './v1';

export const apiRoutes = new Hono();

apiRoutes.route('/', healthRoutes);
apiRoutes.route('/v1', v1Routes);
