import {Hono} from 'hono';
import {questionnaireRoutes} from './questionnaires';

export const v1Routes = new Hono();

v1Routes.route('/', questionnaireRoutes);
