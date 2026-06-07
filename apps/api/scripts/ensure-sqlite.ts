import {Database} from 'bun:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

const databasePath = resolve(import.meta.dir, '../prisma/.data/calis.sqlite');

mkdirSync(dirname(databasePath), {recursive: true});
new Database(databasePath).close();
