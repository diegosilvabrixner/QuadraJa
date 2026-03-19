// src/routes/product.routes.js
export async function productRoutes(fastify) {

  // GET /api/products?arenaId=xxx — catálogo público para clientes
  fastify.get('/', async (request, reply) => {
    const { arenaId } = request.query;
    if (!arenaId) return reply.code(400).send({ error: 'arenaId obrigatório.' });

    const products = await fastify.prisma.produto.findMany({
      where: {
        arenaId,
        status:         'ATIVO',
        visivelClientes: true,
        OR: [
          { controlaEstoque: false },
          { qtdEstoque: { gt: 0 } },
        ],
      },
      include: { categoria: true },
      orderBy: [{ categoria: { ordem: 'asc' } }, { nome: 'asc' }],
    });
    return reply.send(products);
  });

  // GET /api/products/admin?arenaId=xxx — todos os produtos para o admin
  fastify.get('/admin', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const { arenaId } = request.query;
    if (!arenaId) return reply.code(400).send({ error: 'arenaId obrigatório.' });

    const products = await fastify.prisma.produto.findMany({
      where:   { arenaId },
      include: { categoria: true, _count: { select: { itensPedido: true } } },
      orderBy: { nome: 'asc' },
    });
    return reply.send(products);
  });

  // GET /api/products/alerts/low-stock?arenaId=xxx
  fastify.get('/alerts/low-stock', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const { arenaId } = request.query;
    if (!arenaId) return reply.code(400).send({ error: 'arenaId obrigatório.' });

    const products = await fastify.prisma.produto.findMany({
      where:   { arenaId, controlaEstoque: true, status: 'ATIVO' },
      include: { categoria: true },
    });
    return reply.send(products.filter(p => p.qtdEstoque <= p.estoqueMinimo));
  });

  // POST /api/products — criar produto
  fastify.post('/', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const {
      arenaId, categoriaId, nome, descricao,
      custo, markup, estoqueInicial = 0, estoqueMinimo = 5,
      unidade = 'un', visivelClientes = true,
    } = request.body;

    if (!arenaId || !nome || custo === undefined || markup === undefined) {
      return reply.code(400).send({ error: 'Campos obrigatórios: arenaId, nome, custo, markup.' });
    }

    const precoVenda = Number(custo) * (1 + Number(markup) / 100);

    const produto = await fastify.prisma.produto.create({
      data: {
        arenaId,
        categoriaId:     categoriaId || null,
        nome:            nome.trim(),
        descricao:       descricao?.trim() || null,
        custo:           Number(custo),
        markup:          Number(markup),
        precoVenda:      +precoVenda.toFixed(2),
        qtdEstoque:      Number(estoqueInicial),
        estoqueMinimo:   Number(estoqueMinimo),
        unidade,
        visivelClientes,
      },
    });

    // Movimento de entrada inicial
    if (estoqueInicial > 0) {
      await fastify.prisma.movimentoEstoque.create({
        data: {
          produtoId:    produto.id,
          tipo:         'ENTRADA',
          quantidade:   Number(estoqueInicial),
          estoqueAntes: 0,
          estoqueDepois: Number(estoqueInicial),
          motivo:       'Estoque inicial',
          custoUnitario: Number(custo),
          valorTotal:   Number(custo) * Number(estoqueInicial),
          registradoPor: request.user.id,
        },
      });
    }

    await fastify.prisma.logAcao.create({
      data: {
        usuarioId:  request.user.id,
        emailAtor:  request.user.email,
        acao:       'PRODUTO_CRIADO',
        entidade:   'Produto',
        entidadeId: produto.id,
        depois:     produto,
        ip:         request.ip,
      },
    });

    return reply.code(201).send(produto);
  });

  // PATCH /api/products/:id — editar produto
  fastify.patch('/:id', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const {
      nome, descricao, status, visivelClientes,
      custo, markup, estoqueMinimo, categoriaId, motivo,
    } = request.body;

    const atual = await fastify.prisma.produto.findUnique({ where: { id: request.params.id } });
    if (!atual) return reply.code(404).send({ error: 'Produto não encontrado.' });

    const data = {};
    if (nome            !== undefined) data.nome            = nome.trim();
    if (descricao       !== undefined) data.descricao       = descricao?.trim() || null;
    if (status          !== undefined) data.status          = status;
    if (visivelClientes !== undefined) data.visivelClientes = visivelClientes;
    if (estoqueMinimo   !== undefined) data.estoqueMinimo   = Number(estoqueMinimo);
    if (categoriaId     !== undefined) data.categoriaId     = categoriaId || null;

    // Recalcula preço de venda se custo ou markup mudou
    if (custo !== undefined || markup !== undefined) {
      const novoCusto   = custo   !== undefined ? Number(custo)   : atual.custo;
      const novoMarkup  = markup  !== undefined ? Number(markup)  : atual.markup;
      data.custo        = novoCusto;
      data.markup       = novoMarkup;
      data.precoVenda   = +(novoCusto * (1 + novoMarkup / 100)).toFixed(2);

      // Log histórico de preço
      if (novoCusto !== atual.custo || novoMarkup !== atual.markup) {
        await fastify.prisma.logAcao.create({
          data: {
            usuarioId:  request.user.id,
            emailAtor:  request.user.email,
            acao:       'PRECO_ALTERADO',
            entidade:   'Produto',
            entidadeId: request.params.id,
            antes:      { custo: atual.custo, markup: atual.markup, precoVenda: atual.precoVenda },
            depois:     { custo: novoCusto, markup: novoMarkup, precoVenda: data.precoVenda },
            ip:         request.ip,
          },
        });
      }
    }

    const atualizado = await fastify.prisma.produto.update({
      where: { id: request.params.id },
      data,
    });

    return reply.send(atualizado);
  });

  // POST /api/products/:id/stock — ajuste de estoque
  fastify.post('/:id/stock', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const { tipo, quantidade, motivo, custoUnitario } = request.body;
    // tipo: ENTRADA | SAIDA | AJUSTE | PERDA | DEVOLUCAO | INVENTARIO

    if (!tipo || !quantidade || quantidade < 1) {
      return reply.code(400).send({ error: 'tipo e quantidade obrigatórios.' });
    }

    const produto = await fastify.prisma.produto.findUnique({ where: { id: request.params.id } });
    if (!produto) return reply.code(404).send({ error: 'Produto não encontrado.' });

    const delta       = tipo === 'ENTRADA' ? Math.abs(quantidade) : -Math.abs(quantidade);
    const estoqueAntes = produto.qtdEstoque;
    const estoqueDepois = estoqueAntes + delta;

    if (estoqueDepois < 0) {
      return reply.code(400).send({ error: `Estoque insuficiente. Atual: ${estoqueAntes}.` });
    }

    const [movimento] = await fastify.prisma.$transaction([
      fastify.prisma.movimentoEstoque.create({
        data: {
          produtoId:    request.params.id,
          tipo,
          quantidade:   delta,
          estoqueAntes,
          estoqueDepois,
          motivo:       motivo || null,
          custoUnitario: custoUnitario ? Number(custoUnitario) : null,
          valorTotal:    custoUnitario ? Number(custoUnitario) * Math.abs(quantidade) : null,
          registradoPor: request.user.id,
        },
      }),
      fastify.prisma.produto.update({
        where: { id: request.params.id },
        data:  { qtdEstoque: { increment: delta } },
      }),
    ]);

    return reply.send({
      movimento,
      novoEstoque:  estoqueDepois,
      abaixoMinimo: estoqueDepois <= produto.estoqueMinimo,
    });
  });

  // GET /api/products/:id/stock/history
  fastify.get('/:id/stock/history', { preHandler: [fastify.adminOnly] }, async (request, reply) => {
    const historico = await fastify.prisma.movimentoEstoque.findMany({
      where:   { produtoId: request.params.id },
      orderBy: { registradoEm: 'desc' },
      take:    100,
    });
    return reply.send(historico);
  });
}
