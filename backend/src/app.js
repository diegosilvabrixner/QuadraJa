// src/app.js
import Fastify from 'fastify';
import cors    from '@fastify/cors';
import jwt     from '@fastify/jwt';
import 'dotenv/config';

import { env }                    from './config/env.js';
import { prisma }                 from './config/database.js';
import { registerAuthMiddleware } from './middleware/auth.js';
import { registerErrorHandler }   from './middleware/error.js';

import { authRoutes }        from './routes/auth.routes.js';
import { arenaRoutes }       from './routes/arena.routes.js';
import { courtRoutes }       from './routes/court.routes.js';
import { reservationRoutes } from './routes/reservation.routes.js';
import { paymentRoutes }     from './routes/payment.routes.js';
import { productRoutes }     from './routes/product.routes.js';
import { dayuseRoutes }      from './routes/dayuse.routes.js';
import { financialRoutes }   from './routes/financial.routes.js';
import { webhookRoutes }     from './routes/webhook.routes.js';
import { adminRoutes }        from './routes/admin.routes.js';

const fastify = Fastify({
  // Logger simples — não requer pino-pretty instalado
  logger: env.isDev
    ? { level: 'info' }
    : { level: 'warn' },
});

// ── Plugins ───────────────────────────────────────────────────
await fastify.register(cors, {
  // Em dev aceita qualquer origem. Em produção, troque por env.FRONTEND_URL
  origin: env.isDev ? true : env.FRONTEND_URL,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await fastify.register(jwt, {
  secret: env.JWT_SECRET,
});

// ── Prisma disponível em todas as rotas ───────────────────────
fastify.decorate('prisma', prisma);

// ── Middleware de autenticação ────────────────────────────────
await registerAuthMiddleware(fastify);

// ── Rotas ─────────────────────────────────────────────────────
await fastify.register(authRoutes,        { prefix: '/api/auth' });
await fastify.register(arenaRoutes,       { prefix: '/api/arenas' });
await fastify.register(courtRoutes,       { prefix: '/api/courts' });
await fastify.register(reservationRoutes, { prefix: '/api/reservas' });
await fastify.register(paymentRoutes,     { prefix: '/api/pagamentos' });
await fastify.register(productRoutes,     { prefix: '/api/products' });
await fastify.register(dayuseRoutes,      { prefix: '/api/dayuses' });
await fastify.register(financialRoutes,   { prefix: '/api/financial' });
await fastify.register(webhookRoutes,     { prefix: '/webhooks' });
await fastify.register(adminRoutes,       { prefix: '/api/admin' });

// ── Health check ──────────────────────────────────────────────
fastify.get('/health', () => ({
  status: 'ok',
  env:    env.NODE_ENV,
  mp:     env.mpConfigured ? 'configurado' : 'mock (sem credenciais)',
  ts:     new Date().toISOString(),
}));

// ── Error handler ─────────────────────────────────────────────
registerErrorHandler(fastify);

// ── Start ─────────────────────────────────────────────────────
try {
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' });

  console.log(`\n🚀 QuadraJá API rodando`);
  console.log(`   URL:       http://0.0.0.0:${env.PORT}`);
  console.log(`   Ambiente:  ${env.NODE_ENV}`);
  console.log(`   Frontend:  ${env.FRONTEND_URL}`);
  console.log(`   Pagamento: ${env.mpConfigured ? '✅ Mercado Pago' : '⚠️  Mock (sem credenciais MP)'}\n`);
} catch (err) {
  fastify.log.error(err);
  await prisma.$disconnect();
  process.exit(1);
}
