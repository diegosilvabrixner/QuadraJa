// src/middleware/error.js
// Handler global de erros — registrado no app.js

export function registerErrorHandler(fastify) {
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error({
      url:    request.url,
      method: request.method,
      error:  error.message,
      stack:  error.stack,
    });

    // Zod — validação de schema
    if (error.name === 'ZodError') {
      const messages = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      return reply.code(400).send({ error: `Dados inválidos: ${messages}` });
    }

    // Prisma — registro duplicado (unique constraint)
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'campo';
      return reply.code(409).send({
        error: `Já existe um registro com este ${field}. Verifique os dados.`,
      });
    }

    // Prisma — registro não encontrado
    if (error.code === 'P2025') {
      return reply.code(404).send({ error: 'Registro não encontrado.' });
    }

    // JWT inválido (capturado antes do middleware, mas por segurança)
    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      return reply.code(401).send({ error: 'Token inválido.' });
    }

    // Erro com statusCode definido (ex: reply.code(400).send())
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }

    // Fallback — erro interno
    return reply.code(500).send({
      error: process.env.NODE_ENV === 'production'
        ? 'Erro interno do servidor.'
        : error.message,
    });
  });

  // 404 — rota não encontrada
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: `Rota não encontrada: ${request.method} ${request.url}`,
    });
  });
}
