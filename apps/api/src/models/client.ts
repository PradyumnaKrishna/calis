import {PrismaLibSQL} from '@prisma/adapter-libsql';
import {PrismaClient} from '@prisma/client';
import {env} from '../config/env';

const adapter = new PrismaLibSQL({url: env.databaseUrl});

export const prisma = new PrismaClient({adapter});
