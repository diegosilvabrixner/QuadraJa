// src/routes/admin.routes.js
// Rotas exclusivas do painel administrativo
// Todas requerem perfil ADMIN_ARENA ou SUPER_ADMIN

export async function adminRoutes(fastify) {

  // ═══════════════════════════════════════════════
  // QUADRAS — CRUD + histórico
  // ═══════════════════════════════════════════════

  // POST /admin/quadras — criar nova quadra
  fastify.post('/quadras', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const {
      arenaId, codigo, nome, descricao,
      tipo, status = 'ATIVA',
      valorHora, valorMensal,
      abertura, fechamento,
    } = request.body;

    if (!arenaId || !codigo || !nome || !tipo || !valorHora || !valorMensal) {
      return reply.code(400).send({ error: 'Campos obrigatórios: arenaId, codigo, nome, tipo, valorHora, valorMensal.' });
    }

    // Garante que o admin é dono dessa arena
    const arena = await fastify.prisma.arena.findFirst({
      where: { id: arenaId, donoId: request.user.id },
    });
    if (!arena && request.user.perfil !== 'SUPER_ADMIN') {
      return reply.code(403).send({ error: 'Sem permissão para esta arena.' });
    }

    // Verifica código duplicado
    const existe = await fastify.prisma.quadra.findFirst({
      where: { arenaId, codigo: codigo.toUpperCase() },
    });
    if (existe) return reply.code(409).send({ error: `Código "${codigo}" já existe nesta arena.` });

    const quadra = await fastify.prisma.quadra.create({
      data: {
        arenaId,
        codigo:      codigo.toUpperCase(),
        nome:        nome.trim(),
        descricao:   descricao?.trim() || null,
        tipo,
        status,
        valorHora:   Number(valorHora),
        valorMensal: Number(valorMensal),
        abertura:    abertura || null,
        fechamento:  fechamento || null,
      },
    });

    // Log de auditoria
    await fastify.prisma.logAcao.create({
      data: {
        usuarioId:  request.user.id,
        emailAtor:  request.user.email,
        acao:       'QUADRA_CRIADA',
        entidade:   'Quadra',
        entidadeId: quadra.id,
        depois:     quadra,
        ip:         request.ip,
      },
    });

    return reply.code(201).send(quadra);
  });

  // PATCH /admin/quadras/:id — editar quadra (com log de preço e status)
  fastify.patch('/quadras/:id', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const {
      nome, descricao, tipo, status,
      valorHora, valorMensal,
      abertura, fechamento, motivo,
    } = request.body;

    const atual = await fastify.prisma.quadra.findUnique({
      where: { id: request.params.id },
    });
    if (!atual) return reply.code(404).send({ error: 'Quadra não encontrada.' });

    const data = {};
    if (nome        !== undefined) data.nome        = nome.trim();
    if (descricao   !== undefined) data.descricao   = descricao?.trim() || null;
    if (tipo        !== undefined) data.tipo        = tipo;
    if (status      !== undefined) data.status      = status;
    if (valorHora   !== undefined) data.valorHora   = Number(valorHora);
    if (valorMensal !== undefined) data.valorMensal = Number(valorMensal);
    if (abertura    !== undefined) data.abertura    = abertura || null;
    if (fechamento  !== undefined) data.fechamento  = fechamento || null;

    const quadraAtualizada = await fastify.prisma.quadra.update({
      where: { id: request.params.id },
      data,
    });

    // Log de histórico de status (se status mudou)
    if (status !== undefined && status !== atual.status) {
      await fastify.prisma.historicoStatusQuadra.create({
        data: {
          quadraId:    request.params.id,
          statusAntes: atual.status,
          statusDepois: status,
          alteradoPor: request.user.id,
          motivo:      motivo || null,
        },
      });
    }

    // Log de histórico de preço (se preço mudou)
    if (
      (valorHora   !== undefined && Number(valorHora)   !== atual.valorHora) ||
      (valorMensal !== undefined && Number(valorMensal) !== atual.valorMensal)
    ) {
      await fastify.prisma.historicoPrecoQuadra.create({
        data: {
          quadraId:         request.params.id,
          valorHoraAntes:   atual.valorHora,
          valorHoraDepois:  valorHora   !== undefined ? Number(valorHora)   : atual.valorHora,
          valorMensalAntes: atual.valorMensal,
          valorMensalDepois: valorMensal !== undefined ? Number(valorMensal) : atual.valorMensal,
          alteradoPor:      request.user.id,
          motivo:           motivo || null,
        },
      });
    }

    // Log de auditoria geral
    await fastify.prisma.logAcao.create({
      data: {
        usuarioId:  request.user.id,
        emailAtor:  request.user.email,
        acao:       'QUADRA_EDITADA',
        entidade:   'Quadra',
        entidadeId: request.params.id,
        antes:      atual,
        depois:     quadraAtualizada,
        ip:         request.ip,
      },
    });

    return reply.send(quadraAtualizada);
  });

  // GET /admin/quadras/:id/historico-status
  fastify.get('/quadras/:id/historico-status', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const historico = await fastify.prisma.historicoStatusQuadra.findMany({
      where:   { quadraId: request.params.id },
      orderBy: { alteradoEm: 'desc' },
      take:    50,
      include: {
        alteradoPorUsuario: {
          select: { id: true, nome: true, email: true },
        },
      },
    });

    // Formata para o frontend
    const resultado = historico.map(h => ({
      ...h,
      alteradoPorNome: h.alteradoPorUsuario?.nome || h.alteradoPor,
    }));

    return reply.send(resultado);
  });

  // GET /admin/quadras/:id/historico-precos
  fastify.get('/quadras/:id/historico-precos', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const historico = await fastify.prisma.historicoPrecoQuadra.findMany({
      where:   { quadraId: request.params.id },
      orderBy: { alteradoEm: 'desc' },
      take:    50,
    });
    return reply.send(historico);
  });

  // ═══════════════════════════════════════════════
  // FUNCIONÁRIOS — CRUD completo
  // ═══════════════════════════════════════════════

  // GET /admin/funcionarios?arenaId=xxx
  fastify.get('/funcionarios', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const { arenaId, status } = request.query;
    if (!arenaId) return reply.code(400).send({ error: 'arenaId obrigatório.' });

    const funcionarios = await fastify.prisma.funcionario.findMany({
      where: {
        arenaId,
        ...(status ? { status } : {}),
      },
      orderBy: { nome: 'asc' },
    });

    return reply.send(funcionarios);
  });

  // POST /admin/funcionarios — cadastrar
  fastify.post('/funcionarios', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const {
      arenaId, nome, cargo, email, telefone, cpf,
      status = 'ATIVO',
      salarioBase, valeTransporte = 0, valeRefeicao = 0, outrosBeneficios = 0,
      inss = 0.20, fgts = 0.08,
      dataAdmissao, observacoes,
    } = request.body;

    if (!arenaId || !nome || !cargo || !salarioBase || !dataAdmissao) {
      return reply.code(400).send({ error: 'Campos obrigatórios: arenaId, nome, cargo, salarioBase, dataAdmissao.' });
    }

    const funcionario = await fastify.prisma.funcionario.create({
      data: {
        arenaId,
        nome:             nome.trim(),
        cargo:            cargo.trim(),
        email:            email?.trim()?.toLowerCase() || null,
        telefone:         telefone?.replace(/\D/g, '') || null,
        cpf:              cpf?.replace(/\D/g, '')      || null,
        status,
        salarioBase:      Number(salarioBase),
        valeTransporte:   Number(valeTransporte),
        valeRefeicao:     Number(valeRefeicao),
        outrosBeneficios: Number(outrosBeneficios),
        inss:             Number(inss),
        fgts:             Number(fgts),
        dataAdmissao:     new Date(dataAdmissao),
        observacoes:      observacoes?.trim() || null,
      },
    });

    await fastify.prisma.logAcao.create({
      data: {
        usuarioId:  request.user.id,
        emailAtor:  request.user.email,
        acao:       'FUNCIONARIO_CADASTRADO',
        entidade:   'Funcionario',
        entidadeId: funcionario.id,
        depois:     funcionario,
        ip:         request.ip,
      },
    });

    return reply.code(201).send(funcionario);
  });

  // PATCH /admin/funcionarios/:id — editar
  fastify.patch('/funcionarios/:id', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const {
      nome, cargo, email, telefone, status,
      salarioBase, valeTransporte, valeRefeicao,
      outrosBeneficios, inss, fgts,
      dataDemissao, observacoes,
    } = request.body;

    const atual = await fastify.prisma.funcionario.findUnique({
      where: { id: request.params.id },
    });
    if (!atual) return reply.code(404).send({ error: 'Funcionário não encontrado.' });

    const data = {};
    if (nome             !== undefined) data.nome             = nome.trim();
    if (cargo            !== undefined) data.cargo            = cargo.trim();
    if (email            !== undefined) data.email            = email?.toLowerCase() || null;
    if (telefone         !== undefined) data.telefone         = telefone?.replace(/\D/g,'') || null;
    if (status           !== undefined) data.status           = status;
    if (salarioBase      !== undefined) data.salarioBase      = Number(salarioBase);
    if (valeTransporte   !== undefined) data.valeTransporte   = Number(valeTransporte);
    if (valeRefeicao     !== undefined) data.valeRefeicao     = Number(valeRefeicao);
    if (outrosBeneficios !== undefined) data.outrosBeneficios = Number(outrosBeneficios);
    if (inss             !== undefined) data.inss             = Number(inss);
    if (fgts             !== undefined) data.fgts             = Number(fgts);
    if (dataDemissao     !== undefined) data.dataDemissao     = dataDemissao ? new Date(dataDemissao) : null;
    if (observacoes      !== undefined) data.observacoes      = observacoes?.trim() || null;

    const atualizado = await fastify.prisma.funcionario.update({
      where: { id: request.params.id },
      data,
    });

    await fastify.prisma.logAcao.create({
      data: {
        usuarioId:  request.user.id,
        emailAtor:  request.user.email,
        acao:       'FUNCIONARIO_ALTERADO',
        entidade:   'Funcionario',
        entidadeId: request.params.id,
        antes:      atual,
        depois:     atualizado,
        ip:         request.ip,
      },
    });

    return reply.send(atualizado);
  });

  // DELETE (desativar) /admin/funcionarios/:id
  fastify.delete('/funcionarios/:id', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    await fastify.prisma.funcionario.update({
      where: { id: request.params.id },
      data:  { status: 'DESLIGADO', dataDemissao: new Date() },
    });
    return reply.send({ ok: true });
  });

  // ═══════════════════════════════════════════════
  // ARENA — configurações
  // ═══════════════════════════════════════════════

  // PATCH /admin/arena/:id — atualizar configurações
  fastify.patch('/arena/:id', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const {
      nome, descricao, telefone, email,
      horarioAbertura, horarioFechamento,
      horasCancelamento, antecedenciaMinima, antecedenciaMaxima,
      multaCancelamento, produtosHabilitados, dayuseHabilitado,
    } = request.body;

    const atual = await fastify.prisma.arena.findUnique({ where: { id: request.params.id } });
    if (!atual) return reply.code(404).send({ error: 'Arena não encontrada.' });

    const data = {};
    const campos = {
      nome, descricao, telefone, email,
      horarioAbertura, horarioFechamento,
      horasCancelamento, antecedenciaMinima, antecedenciaMaxima,
      multaCancelamento, produtosHabilitados, dayuseHabilitado,
    };
    for (const [k, v] of Object.entries(campos)) {
      if (v !== undefined) data[k] = v;
    }

    const atualizada = await fastify.prisma.arena.update({
      where: { id: request.params.id },
      data,
    });

    // Log cada campo alterado
    const logs = [];
    for (const [campo, valorDepois] of Object.entries(data)) {
      const valorAntes = atual[campo];
      if (String(valorAntes) !== String(valorDepois)) {
        logs.push(
          fastify.prisma.logConfiguracaoArena.create({
            data: {
              arenaId:    request.params.id,
              campo,
              valorAntes: String(valorAntes ?? ''),
              valorDepois: String(valorDepois),
              alteradoPor: request.user.id,
              motivo:     request.body.motivo || null,
            },
          })
        );
      }
    }
    if (logs.length) await fastify.prisma.$transaction(logs);

    return reply.send(atualizada);
  });

  // GET /admin/arena/:id/logs-config — histórico de configurações
  fastify.get('/arena/:id/logs-config', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const logs = await fastify.prisma.logConfiguracaoArena.findMany({
      where:   { arenaId: request.params.id },
      orderBy: { alteradoEm: 'desc' },
      take:    100,
    });
    return reply.send(logs);
  });
}
