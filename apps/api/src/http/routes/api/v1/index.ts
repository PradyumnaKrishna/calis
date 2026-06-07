import {Hono} from 'hono';
import {exerciseRoutes} from './exercises';
import {questionnaireRoutes} from './questionnaires';

export const v1Routes = new Hono();

v1Routes.route('/', exerciseRoutes);
v1Routes.route('/', questionnaireRoutes);
