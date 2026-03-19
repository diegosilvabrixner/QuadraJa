// src/routes/reservation.routes.js
import { z } from 'zod';

export async function reservationRoutes(fastify) {

  // GET /api/reservas — reservas do usuário logado (cliente) ou de uma arena (admin)
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { status, tipo, arenaId, data, page = 1, limit = 20 } = request.query;
    const isAdmin = ['ADMIN_ARENA', 'SUPER_ADMIN'].includes(request.user.perfil);

    const where = {
      // Se admin e passou arenaId, filtra por arena; se cliente, filtra por usuário
      ...(isAdmin && arenaId
        ? { quadra: { arenaId } }
        : { usuarioId: request.user.id }),
      ...(status ? { status } : {}),
      ...(tipo   ? { tipo: tipo.toUpperCase() } : {}),
      ...(data   ? { data: new Date(data) } : {}),
    };

    const [reservas, total] = await Promise.all([
      fastify.prisma.reserva.findMany({
        where,
        include: {
          usuario: { select: { id: true, nome: true, email: true, telefone: true } },
          quadra: {
            include: {
              arena: { select: { id: true, nome: true, endereco: true, slug: true } },
            },
          },
          pagamento: {
            select: { status: true, forma: true, pagoEm: true, pixCopiaCola: true },
          },
          avaliacao: { select: { nota: true, comentario: true } },
          dayuse:    { select: { nome: true, horaInicio: true, horaFim: true } },
        },
        orderBy: { criadaEm: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
      fastify.prisma.reserva.count({ where }),
    ]);

    return reply.send({ reservas, total, page: Number(page), paginas: Math.ceil(total / Number(limit)) });
  });

  // GET /api/reservas/:id — detalhes de uma reserva
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const reserva = await fastify.prisma.reserva.findUnique({
      where: { id: request.params.id },
      include: {
        usuario: { select: { id: true, nome: true, email: true, telefone: true } },
        quadra:  { include: { arena: true } },
        pagamento: true,
        avaliacao: true,
        dayuse:    true,
      },
    });

    if (!reserva) return reply.code(404).send({ error: 'Reserva não encontrada.' });

    // Só o dono ou admin pode ver
    const isAdmin = ['ADMIN_ARENA', 'SUPER_ADMIN'].includes(request.user.perfil);
    if (!isAdmin && reserva.usuarioId !== request.user.id) {
      return reply.code(403).send({ error: 'Sem permissão.' });
    }

    return reply.send(reserva);
  });

  // POST /api/reservas — criar reserva
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const schema = z.object({
      quadraId:      z.string().uuid('quadraId inválido'),
      tipo:          z.enum(['AVULSO', 'MENSAL', 'DAYUSE']),
      data:          z.string().optional(),    // "2025-07-18"
      horaInicio:    z.string().optional(),    // "10:00"
      horaFim:       z.string().optional(),    // "11:00"
      diaSemana:     z.enum(['SEGUNDA','TERCA','QUARTA','QUINTA','SEXTA','SABADO','DOMINGO']).optional(),
      dayuseId:      z.string().uuid().optional(),
      numeroPessoas: z.number().int().positive().optional(),
    });

    const body = schema.parse(request.body);

    const quadra = await fastify.prisma.quadra.findUnique({
      where:   { id: body.quadraId },
      include: { arena: true },
    });
    if (!quadra)                      return reply.code(404).send({ error: 'Quadra não encontrada.' });
    if (quadra.status !== 'ATIVA')   return reply.code(400).send({ error: 'Quadra indisponível no momento.' });

    // Antecedência mínima
    if (body.data && body.horaInicio) {
      const [h, m]   = body.horaInicio.split(':').map(Number);
      const slotTime = new Date(body.data);
      slotTime.setHours(h, m, 0, 0);
      const horasAte = (slotTime - Date.now()) / 3600000;
      if (horasAte < quadra.arena.antecedenciaMinima) {
        return reply.code(400).send({
          error: `Reserve com pelo menos ${quadra.arena.antecedenciaMinima}h de antecedência.`,
        });
      }
    }

    // Conflito avulso
    if (body.tipo === 'AVULSO' && body.data && body.horaInicio) {
      const conflito = await fastify.prisma.reserva.findFirst({
        where: {
          quadraId:  body.quadraId,
          data:      new Date(body.data),
          horaInicio: body.horaInicio,
          status:    { in: ['AGUARDANDO_PAGAMENTO', 'CONFIRMADA'] },
        },
      });
      if (conflito) return reply.code(409).send({ error: 'Horário já reservado.' });
    }

    // Conflito mensal
    if (body.tipo === 'MENSAL' && body.diaSemana && body.horaInicio) {
      const conflito = await fastify.prisma.reserva.findFirst({
        where: {
          quadraId:  body.quadraId,
          tipo:      'MENSAL',
          diaSemana: body.diaSemana,
          horaInicio: body.horaInicio,
          status:    { in: ['AGUARDANDO_PAGAMENTO', 'CONFIRMADA'] },
        },
      });
      if (conflito) return reply.code(409).send({ error: `Já existe plano mensal para ${body.diaSemana} às ${body.horaInicio}.` });
    }

    // Calcular valor
    let valorTotal = 0;
    if (body.tipo === 'AVULSO' && body.horaInicio && body.horaFim) {
      const horas = calcHoras(body.horaInicio, body.horaFim);
      valorTotal  = quadra.valorHora * horas;
    } else if (body.tipo === 'MENSAL') {
      valorTotal = quadra.valorMensal;
    } else if (body.tipo === 'DAYUSE' && body.dayuseId) {
      const dayuse = await fastify.prisma.dayuse.findUnique({ where: { id: body.dayuseId } });
      if (!dayuse || !dayuse.ativo) return reply.code(404).send({ error: 'Dayuse não disponível.' });
      valorTotal = dayuse.valorPorPessoa * (body.numeroPessoas || 1);
    }

    const reserva = await fastify.prisma.reserva.create({
      data: {
        usuarioId:     request.user.id,
        quadraId:      body.quadraId,
        tipo:          body.tipo,
        status:        'AGUARDANDO_PAGAMENTO',
        data:          body.data       ? new Date(body.data) : null,
        horaInicio:    body.horaInicio || null,
        horaFim:       body.horaFim    || null,
        diaSemana:     body.diaSemana  || null,
        dayuseId:      body.dayuseId   || null,
        numeroPessoas: body.numeroPessoas || null,
        valorTotal,
      },
    });

    // Log auditoria
    await fastify.prisma.logAcao.create({
      data: {
        usuarioId:  request.user.id,
        emailAtor:  request.user.email,
        acao:       'RESERVA_CRIADA',
        entidade:   'Reserva',
        entidadeId: reserva.id,
        depois:     reserva,
        ip:         request.ip,
      },
    });

    return reply.code(201).send(reserva);
  });

  // PATCH /api/reservas/:id/cancelar
  fastify.patch('/:id/cancelar', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const isAdmin = ['ADMIN_ARENA', 'SUPER_ADMIN'].includes(request.user.perfil);

    const reserva = await fastify.prisma.reserva.findUnique({
      where: { id: request.params.id },
      include: {
        pagamento: true,
        quadra:    { include: { arena: true } },
      },
    });

    if (!reserva) return reply.code(404).send({ error: 'Reserva não encontrada.' });

    // Só o dono ou admin pode cancelar
    if (!isAdmin && reserva.usuarioId !== request.user.id) {
      return reply.code(403).send({ error: 'Sem permissão.' });
    }

    if (reserva.status === 'CANCELADA')  return reply.code(400).send({ error: 'Reserva já cancelada.' });
    if (reserva.status === 'CONCLUIDA')  return reply.code(400).send({ error: 'Não é possível cancelar reserva concluída.' });

    // Política de cancelamento (só para clientes — admin pode sempre cancelar sem taxa)
    let semEstorno = false;
    if (!isAdmin && reserva.data && reserva.horaInicio) {
      const [h, m] = reserva.horaInicio.split(':').map(Number);
      const slot   = new Date(reserva.data);
      slot.setHours(h, m, 0, 0);
      const horasAte = (slot - Date.now()) / 3600000;
      semEstorno = horasAte < reserva.quadra.arena.horasCancelamento;
    }

    await fastify.prisma.reserva.update({
      where: { id: reserva.id },
      data: {
        status:            'CANCELADA',
        canceladaEm:       new Date(),
        motivoCancelamento: request.body?.motivo || (isAdmin ? 'Cancelado pelo admin' : 'Cancelado pelo cliente'),
        valorEstorno:      semEstorno ? 0 : reserva.valorTotal,
      },
    });

    // Log auditoria
    await fastify.prisma.logAcao.create({
      data: {
        usuarioId:  request.user.id,
        emailAtor:  request.user.email,
        acao:       'RESERVA_CANCELADA',
        entidade:   'Reserva',
        entidadeId: reserva.id,
        antes:      { status: reserva.status },
        depois:     { status: 'CANCELADA', semEstorno },
        ip:         request.ip,
      },
    });

    return reply.send({
      cancelado:    true,
      comEstorno:   !semEstorno,
      valorEstorno: semEstorno ? 0 : reserva.valorTotal,
      mensagem:     semEstorno
        ? `Cancelamento sem estorno (menos de ${reserva.quadra.arena.horasCancelamento}h para o jogo).`
        : `Estorno de ${reserva.valorTotal.toFixed(2)} será processado em até 5 dias úteis.`,
    });
  });

  // POST /api/reservas/:id/avaliacao
  fastify.post('/:id/avaliacao', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { nota, comentario } = request.body;

    if (!nota || nota < 1 || nota > 5) {
      return reply.code(400).send({ error: 'Nota deve ser entre 1 e 5.' });
    }

    const reserva = await fastify.prisma.reserva.findFirst({
      where: { id: request.params.id, usuarioId: request.user.id },
    });
    if (!reserva) return reply.code(404).send({ error: 'Reserva não encontrada.' });
    if (reserva.status !== 'CONCLUIDA') {
      return reply.code(400).send({ error: 'Só é possível avaliar reservas concluídas.' });
    }

    const quadra = await fastify.prisma.quadra.findUnique({ where: { id: reserva.quadraId } });

    const avaliacao = await fastify.prisma.avaliacao.upsert({
      where: {
        usuarioId_reservaId: { usuarioId: request.user.id, reservaId: reserva.id },
      },
      update: { nota, comentario: comentario?.trim() || null },
      create: {
        usuarioId:  request.user.id,
        arenaId:    quadra.arenaId,
        quadraId:   reserva.quadraId,
        reservaId:  reserva.id,
        nota,
        comentario: comentario?.trim() || null,
      },
    });

    return reply.code(201).send(avaliacao);
  });
}

function calcHoras(inicio, fim) {
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  return ((hf * 60 + mf) - (hi * 60 + mi)) / 60;
}
