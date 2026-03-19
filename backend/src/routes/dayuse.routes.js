// src/routes/dayuse.routes.js
export async function dayuseRoutes(fastify) {

  // GET /api/dayuses?arenaId=xxx — dayuses futuros para clientes
  fastify.get('/', async (request, reply) => {
    const { arenaId } = request.query;
    if (!arenaId) return reply.code(400).send({ error: 'arenaId obrigatório.' });

    const dayuses = await fastify.prisma.dayuse.findMany({
      where: {
        arenaId,
        active: true,
        date:   { gte: new Date() },
      },
      include: {
        courts: { include: { court: { select: { id: true, label: true, name: true } } } },
      },
      orderBy: { date: 'asc' },
    });
    return reply.send(dayuses);
  });

  // GET /api/dayuses/popup?arenaId=xxx — próximo dayuse para popup
  fastify.get('/popup', async (request, reply) => {
    const next = await fastify.prisma.dayuse.findFirst({
      where: {
        arenaId:    request.query.arenaId,
        active:     true,
        showPopup:  true,
        date:       { gte: new Date() },
      },
      include: {
        courts: { include: { court: { select: { id: true, label: true } } } },
      },
      orderBy: { date: 'asc' },
    });
    return reply.send(next || null);
  });

  // POST /api/dayuses — criar dayuse (admin)
  fastify.post('/', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const { arenaId, name, description, date, startTime, endTime, pricePerPerson, maxPeople, courtIds, showPopup } = request.body;

    if (!name || !date || !startTime || !endTime || !pricePerPerson || !courtIds?.length) {
      return reply.code(400).send({ error: 'Campos obrigatórios: name, date, startTime, endTime, pricePerPerson, courtIds.' });
    }

    const dayuse = await fastify.prisma.dayuse.create({
      data: {
        arenaId, name, description,
        date:          new Date(date),
        startTime, endTime,
        pricePerPerson: Number(pricePerPerson),
        maxPeople:      maxPeople ? Number(maxPeople) : null,
        showPopup:      showPopup !== false,
        courts: {
          create: courtIds.map(courtId => ({ courtId })),
        },
      },
      include: { courts: { include: { court: true } } },
    });

    return reply.code(201).send(dayuse);
  });

  // PATCH /api/dayuses/:id
  fastify.patch('/:id', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const { name, pricePerPerson, active, showPopup, courtIds } = request.body;

    const dayuse = await fastify.prisma.dayuse.update({
      where: { id: request.params.id },
      data: {
        ...(name           !== undefined && { name }),
        ...(pricePerPerson !== undefined && { pricePerPerson: Number(pricePerPerson) }),
        ...(active         !== undefined && { active }),
        ...(showPopup      !== undefined && { showPopup }),
        ...(courtIds && {
          courts: { deleteMany: {}, create: courtIds.map(courtId => ({ courtId })) },
        }),
      },
      include: { courts: { include: { court: true } } },
    });
    return reply.send(dayuse);
  });

  // DELETE /api/dayuses/:id — desativar
  fastify.delete('/:id', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    await fastify.prisma.dayuse.update({ where: { id: request.params.id }, data: { active: false } });
    return reply.send({ ok: true });
  });
}
