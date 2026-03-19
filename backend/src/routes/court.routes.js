// src/routes/court.routes.js
export async function courtRoutes(fastify) {

  // GET /api/courts/:id/occupied-slots?date=2025-07-18
  // Retorna slots bloqueados (avulso + mensal) para uma data
  fastify.get('/:id/occupied-slots', async (request, reply) => {
    const { date } = request.query; // "2025-07-18"
    if (!date) return reply.code(400).send({ error: 'Parâmetro date obrigatório (YYYY-MM-DD).' });

    const targetDate = new Date(date);
    const weekdays   = ['DOMINGO','SEGUNDA','TERCA','QUARTA','QUINTA','SEXTA','SABADO'];
    const weekDay    = weekdays[targetDate.getDay()];

    // Busca reservas confirmadas ou pendentes
    const reservas = await fastify.prisma.reservation.findMany({
      where: {
        courtId: request.params.id,
        status:  { in: ['PENDENTE_PAGAMENTO', 'CONFIRMADA'] },
        OR: [
          // Avulso — data exata
          { type: 'AVULSO', date: targetDate },
          // Mensal — mesmo dia da semana
          { type: 'MENSAL', weekDay },
          // Dayuse — data exata com dayuse ativo
          {
            type: 'DAYUSE',
            dayuse: { date: targetDate, active: true },
          },
        ],
      },
      select: { startTime: true, endTime: true, type: true, dayuseId: true },
    });

    // Formata os slots ocupados
    const occupied = reservas
      .filter(r => r.startTime)
      .map(r => r.startTime);

    // Dayuse nesta data — retorna também para colorir diferente no frontend
    const dayuses = await fastify.prisma.dayuse.findMany({
      where: {
        active: true,
        date:   targetDate,
        courts: { some: { courtId: request.params.id } },
      },
      select: { startTime: true, endTime: true, pricePerPerson: true, name: true },
    });

    return reply.send({ occupied, dayuses });
  });

  // GET /api/courts/:id — detalhes de uma quadra
  fastify.get('/:id', async (request, reply) => {
    const court = await fastify.prisma.court.findUnique({
      where:   { id: request.params.id },
      include: { arena: { select: { name: true, cancellationHours: true } } },
    });
    if (!court) return reply.code(404).send({ error: 'Quadra não encontrada.' });
    return reply.send(court);
  });
}
