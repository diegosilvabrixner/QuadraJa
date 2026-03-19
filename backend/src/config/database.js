// src/config/database.js
// Singleton do Prisma Client
// Evita múltiplas conexões em desenvolvimento (hot reload)

import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDev ? ['query', 'warn', 'error'] : ['error'],
  });

if (env.isDev) globalForPrisma.prisma = prisma;

// Fecha conexão graciosamente ao encerrar o processo
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
