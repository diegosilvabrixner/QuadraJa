// src/routes/arena.routes.js
export async function arenaRoutes(fastify) {

  fastify.get('/', async (request, reply) => {
    const arenas = await fastify.prisma.arena.findMany({
      where: { ativa: true },
      include: {
        quadras: { where: { status: 'ATIVA' }, select: { id: true, codigo: true, tipo: true, valorHora: true } },
        _count:  { select: { quadras: true } },
      },
      orderBy: { nome: 'asc' },
    });
    return reply.send(arenas);
  });

  fastify.get('/:slug', async (request, reply) => {
    const arena = await fastify.prisma.arena.findUnique({
      where: { slug: request.params.slug },
      include: { quadras: { orderBy: { codigo: 'asc' } }, horarios: true },
    });
    if (!arena) return reply.code(404).send({ error: 'Arena não encontrada.' });
    return reply.send(arena);
  });

  // GET /api/arenas/:id/quadras — alias em português
  fastify.get('/:id/quadras', async (request, reply) => {
    const quadras = await fastify.prisma.quadra.findMany({
      where:   { arenaId: request.params.id },
      orderBy: { codigo: 'asc' },
    });
    return reply.send(quadras);
  });

  // GET /api/arenas/:id/courts — alias em inglês (retrocompatibilidade)
  fastify.get('/:id/courts', async (request, reply) => {
    const quadras = await fastify.prisma.quadra.findMany({
      where:   { arenaId: request.params.id },
      orderBy: { codigo: 'asc' },
    });
    return reply.send(quadras);
  });
}
