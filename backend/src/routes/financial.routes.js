// src/routes/financial.routes.js
export async function financialRoutes(fastify) {

  // GET /api/financial/dashboard?arenaId=xxx&month=2025-07
  fastify.get('/dashboard', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const { arenaId, month } = request.query;
    if (!arenaId) return reply.code(400).send({ error: 'arenaId obrigatório.' });
    const { inicio, fim } = rangoMes(month);

    const [pagamentos, cancelamentos, mensalistas, quadras] = await Promise.all([
      fastify.prisma.pagamento.aggregate({
        _sum:   { valor: true },
        _count: { id: true },
        where: {
          status: 'APROVADO',
          pagoEm: { gte: inicio, lte: fim },
          reserva: { quadra: { arenaId } },
        },
      }),
      fastify.prisma.reserva.count({
        where: {
          quadra: { arenaId },
          status: 'CANCELADA',
          canceladaEm: { gte: inicio, lte: fim },
        },
      }),
      fastify.prisma.reserva.count({
        where: {
          quadra: { arenaId },
          tipo:   'MENSAL',
          status: { in: ['CONFIRMADA', 'CONCLUIDA'] },
        },
      }),
      fastify.prisma.quadra.findMany({
        where: { arenaId },
        include: {
          _count: {
            select: {
              reservas: {
                where: {
                  status: { in: ['CONFIRMADA', 'CONCLUIDA'] },
                  data:   { gte: inicio, lte: fim },
                },
              },
            },
          },
        },
      }),
    ]);

    const despesas = await fastify.prisma.despesa.aggregate({
      _sum:  { valor: true },
      where: { arenaId, mesReferencia: inicio },
    });

    const receita = pagamentos._sum.valor || 0;
    const despesa = despesas._sum.valor    || 0;

    return reply.send({
      receita,
      despesa,
      lucro:        receita - despesa,
      margem:       receita > 0 ? +((receita - despesa) / receita * 100).toFixed(1) : 0,
      reservas:     pagamentos._count.id,
      cancelamentos,
      mensalistas,
      ocupacaoPorQuadra: quadras.map(q => ({
        label:   q.codigo,
        nome:    q.nome,
        reservas: q._count.reservas,
        ocupacao: +((q._count.reservas / (22 * 14)) * 100).toFixed(1),
      })),
    });
  });

  // GET /api/financial/dre?arenaId=xxx&month=2025-07
  fastify.get('/dre', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const { arenaId, month } = request.query;
    if (!arenaId) return reply.code(400).send({ error: 'arenaId obrigatório.' });
    const { inicio, fim } = rangoMes(month);

    const receitaTipo = async (tipo) => {
      const r = await fastify.prisma.pagamento.aggregate({
        _sum:  { valor: true },
        where: {
          status: 'APROVADO',
          pagoEm: { gte: inicio, lte: fim },
          reserva: { quadra: { arenaId }, tipo },
        },
      });
      return r._sum.valor || 0;
    };

    const [avulso, mensal, dayuse, produtos, despesas, orcamentos] = await Promise.all([
      receitaTipo('AVULSO'),
      receitaTipo('MENSAL'),
      receitaTipo('DAYUSE'),
      fastify.prisma.pagamentoPedido.aggregate({
        _sum:  { valor: true },
        where: { status: 'APROVADO', pagoEm: { gte: inicio, lte: fim }, pedido: { arenaId } },
      }),
      fastify.prisma.despesa.groupBy({
        by:      ['categoria', 'codigoConta', 'descricao'],
        _sum:    { valor: true },
        where:   { arenaId, mesReferencia: inicio },
        orderBy: { codigoConta: 'asc' },
      }),
      fastify.prisma.orcamento.findMany({
        where: { arenaId, mesReferencia: inicio },
      }),
    ]);

    const totalReceita = avulso + mensal + dayuse + (produtos._sum.valor || 0);
    const totalDespesa = despesas.reduce((s, e) => s + (e._sum.valor || 0), 0);

    return reply.send({
      receitas: {
        avulso, mensal, dayuse,
        produtos: produtos._sum.valor || 0,
        total:    totalReceita,
      },
      despesas: despesas.map(e => {
        const orc = orcamentos.find(o => o.codigoConta === e.codigoConta);
        return {
          categoria:   e.categoria,
          codigoConta: e.codigoConta,
          descricao:   e.descricao,
          realizado:   e._sum.valor || 0,
          orcado:      orc?.valorOrcado || 0,
        };
      }),
      resultado: totalReceita - totalDespesa,
      margem:    totalReceita > 0 ? +((totalReceita - totalDespesa) / totalReceita * 100).toFixed(1) : 0,
    });
  });

  // GET /api/financial/expenses?arenaId=xxx&month=2025-07
  fastify.get('/expenses', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const { arenaId, month } = request.query;
    if (!arenaId) return reply.code(400).send({ error: 'arenaId obrigatório.' });
    const { inicio } = rangoMes(month);

    const despesas = await fastify.prisma.despesa.findMany({
      where:   { arenaId, mesReferencia: inicio },
      orderBy: { codigoConta: 'asc' },
    });
    return reply.send(despesas);
  });

  // POST /api/financial/expenses — lançar despesa
  fastify.post('/expenses', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const { arenaId, categoria, codigoConta, descricao, valor, mesReferencia, observacoes } = request.body;

    if (!arenaId || !categoria || !descricao || !valor || !mesReferencia) {
      return reply.code(400).send({ error: 'Campos obrigatórios: arenaId, categoria, descricao, valor, mesReferencia.' });
    }

    const despesa = await fastify.prisma.despesa.create({
      data: {
        arenaId,
        categoria,
        codigoConta:    codigoConta || '9.9.9',
        descricao:      descricao.trim(),
        valor:          Number(valor),
        mesReferencia:  new Date(mesReferencia + '-01'),
        observacoes:    observacoes?.trim() || null,
        lancadoPor:     request.user.id,
      },
    });

    await fastify.prisma.logAcao.create({
      data: {
        usuarioId:  request.user.id,
        emailAtor:  request.user.email,
        acao:       'DESPESA_LANCADA',
        entidade:   'Despesa',
        entidadeId: despesa.id,
        depois:     despesa,
        ip:         request.ip,
      },
    });

    return reply.code(201).send(despesa);
  });

  // GET /api/financial/payroll?arenaId=xxx
  fastify.get('/payroll', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const { arenaId } = request.query;
    if (!arenaId) return reply.code(400).send({ error: 'arenaId obrigatório.' });

    const funcionarios = await fastify.prisma.funcionario.findMany({
      where:   { arenaId, status: { in: ['ATIVO', 'FERIAS'] } },
      orderBy: { nome: 'asc' },
    });

    const comCalculos = funcionarios.map(f => {
      const inss       = +(f.salarioBase * f.inss).toFixed(2);
      const fgts       = +(f.salarioBase * f.fgts).toFixed(2);
      const beneficios = +(f.valeTransporte + f.valeRefeicao + f.outrosBeneficios).toFixed(2);
      const custoTotal = +(f.salarioBase + inss + fgts + beneficios).toFixed(2);
      return { ...f, inss, fgts, beneficios, custoTotal };
    });

    const totais = comCalculos.reduce((acc, f) => ({
      salarioBase: acc.salarioBase + f.salarioBase,
      inss:        acc.inss        + f.inss,
      fgts:        acc.fgts        + f.fgts,
      beneficios:  acc.beneficios  + f.beneficios,
      custoTotal:  acc.custoTotal  + f.custoTotal,
    }), { salarioBase: 0, inss: 0, fgts: 0, beneficios: 0, custoTotal: 0 });

    return reply.send({ funcionarios: comCalculos, totais });
  });
}

function rangoMes(month) {
  const now = new Date();
  const [y, m] = month
    ? month.split('-').map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  return {
    inicio: new Date(y, m - 1, 1),
    fim:    new Date(y, m, 0, 23, 59, 59),
  };
}
