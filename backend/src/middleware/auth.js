// src/middleware/auth.js
// Decorators de autenticação registrados no Fastify

export async function registerAuthMiddleware(fastify) {

  // ── authenticate — verifica JWT em qualquer rota ─────────────
  fastify.decorate('authenticate', async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({
        error: 'Não autorizado. Faça login para continuar.',
      });
    }
  });

  // ── adminOnly — só ARENA_ADMIN e SUPER_ADMIN ─────────────────
  fastify.decorate('adminOnly', async function adminOnly(request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Não autorizado.' });
    }
    if (!['ARENA_ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.code(403).send({
        error: 'Acesso restrito a administradores.',
      });
    }
  });

  // ── superAdmin — só SUPER_ADMIN (dono do SaaS) ───────────────
  fastify.decorate('superAdmin', async function superAdmin(request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Não autorizado.' });
    }
    if (request.user.role !== 'SUPER_ADMIN') {
      return reply.code(403).send({ error: 'Acesso restrito.' });
    }
  });

  // ── optionalAuth — tenta verificar JWT, não falha se ausente ─
  // Útil em rotas públicas que mudam comportamento se autenticado
  fastify.decorate('optionalAuth', async function optionalAuth(request) {
    try {
      await request.jwtVerify();
    } catch {
      request.user = null;
    }
  });
}
