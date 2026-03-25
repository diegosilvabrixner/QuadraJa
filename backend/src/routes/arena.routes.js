// src/routes/arena.routes.js
export async function arenaRoutes(fastify) {

  // GET /api/arenas — lista pública de arenas
  fastify.get('/', async (request, reply) => {
    const arenas = await fastify.prisma.arena.findMany({
      where: { ativa: true },
      include: {
        quadras: {
          select: { id: true, codigo: true, tipo: true, valorHora: true, status: true },
        },
        _count: { select: { quadras: true } },
      },
      orderBy: { nome: 'asc' },
    });
    return reply.send(arenas);
  });

  // GET /api/arenas/:id/quadras — quadras de uma arena pelo ID
  // IMPORTANTE: esta rota DEVE vir ANTES de /:id para o Fastify não confundir
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

  // GET /api/arenas/:id — detalhes de uma arena pelo ID ou slug
  fastify.get('/:id', async (request, reply) => {
    const param = request.params.id;

    // Tenta buscar por ID (UUID) primeiro, depois por slug
    const arena = await fastify.prisma.arena.findFirst({
      where: {
        OR: [
          { id:   param },
          { slug: param },
        ],
      },
      include: {
        quadras:  { orderBy: { codigo: 'asc' } },
        horarios: true,
      },
    });

    if (!arena) return reply.code(404).send({ error: 'Arena não encontrada.' });
    return reply.send(arena);
  });
}
