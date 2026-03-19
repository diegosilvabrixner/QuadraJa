// prisma/seed.js — QuadraJá
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const hash = await bcrypt.hash('senha123', 12);

  // ── Usuário Admin ──────────────────────────────────────
  const admin = await prisma.usuario.upsert({
    where:  { email: 'admin@arenacentro.com.br' },
    update: {},
    create: {
      nome:            'Carlos Silva',
      email:           'admin@arenacentro.com.br',
      telefone:        '11999990001',
      senhaHash:       hash,
      perfil:          'ADMIN_ARENA',
      emailVerificado: true,
    },
  });

  // ── Usuário Cliente ────────────────────────────────────
  await prisma.usuario.upsert({
    where:  { email: 'lucas@email.com' },
    update: {},
    create: {
      nome:            'Lucas Mendes',
      email:           'lucas@email.com',
      telefone:        '11988880001',
      senhaHash:       hash,
      perfil:          'CLIENTE',
      emailVerificado: true,
    },
  });

  // ── Arena ──────────────────────────────────────────────
  const arena = await prisma.arena.upsert({
    where:  { slug: 'arena-centro' },
    update: {},
    create: {
      nome:                'Arena Centro',
      slug:                'arena-centro',
      descricao:           'A melhor arena de vôlei da região central.',
      telefone:            '11333330001',
      email:               'contato@arenacentro.com.br',
      endereco:            'Rua das Palmeiras, 240',
      cidade:              'São Paulo',
      estado:              'SP',
      cep:                 '01310-100',
      latitude:            -23.5505,
      longitude:           -46.6333,
      produtosHabilitados: true,   // ← correto
      dayuseHabilitado:    true,   // ← correto
      donoId:              admin.id,
    },
  });

  // ── Horários de funcionamento ──────────────────────────
  const horarios = [
    { diaSemana: 'SEGUNDA', abertura: '07:00', fechamento: '22:00' },
    { diaSemana: 'TERCA',   abertura: '07:00', fechamento: '22:00' },
    { diaSemana: 'QUARTA',  abertura: '07:00', fechamento: '22:00' },
    { diaSemana: 'QUINTA',  abertura: '07:00', fechamento: '22:00' },
    { diaSemana: 'SEXTA',   abertura: '07:00', fechamento: '22:00' },
    { diaSemana: 'SABADO',  abertura: '08:00', fechamento: '20:00' },
    { diaSemana: 'DOMINGO', abertura: '09:00', fechamento: '18:00' },
  ];
  for (const h of horarios) {
    await prisma.horarioArena.upsert({
      where:  { arenaId_diaSemana: { arenaId: arena.id, diaSemana: h.diaSemana } },
      update: {},
      create: { ...h, arenaId: arena.id },
    });
  }

  // ── Quadras ────────────────────────────────────────────
  // Campos corretos: valorHora, valorMensal, plantaX, plantaY, plantaW, plantaH
  const quadrasData = [
    { codigo:'A1', nome:'Quadra A1', tipo:'AREIA', status:'ATIVA',      valorHora:80, valorMensal:280, plantaX:10,  plantaY:10,  plantaW:130, plantaH:82 },
    { codigo:'A2', nome:'Quadra A2', tipo:'AREIA', status:'ATIVA',      valorHora:80, valorMensal:280, plantaX:155, plantaY:10,  plantaW:130, plantaH:82 },
    { codigo:'A3', nome:'Quadra A3', tipo:'AREIA', status:'ATIVA',      valorHora:80, valorMensal:280, plantaX:300, plantaY:10,  plantaW:130, plantaH:82 },
    { codigo:'B1', nome:'Quadra B1', tipo:'PISO',  status:'ATIVA',      valorHora:70, valorMensal:240, plantaX:10,  plantaY:108, plantaW:130, plantaH:82 },
    { codigo:'B2', nome:'Quadra B2', tipo:'PISO',  status:'MANUTENCAO', valorHora:70, valorMensal:240, plantaX:155, plantaY:108, plantaW:130, plantaH:82 },
    { codigo:'B3', nome:'Quadra B3', tipo:'PISO',  status:'ATIVA',      valorHora:70, valorMensal:240, plantaX:300, plantaY:108, plantaW:130, plantaH:82 },
  ];
  for (const q of quadrasData) {
    await prisma.quadra.upsert({
      where:  { arenaId_codigo: { arenaId: arena.id, codigo: q.codigo } },
      update: {},
      create: { ...q, arenaId: arena.id },
    });
  }

  // ── Funcionários ───────────────────────────────────────
  const funcs = [
    { nome:'Carlos Silva',  cargo:'Gerente',       salarioBase:3200, valeTransporte:200, valeRefeicao:280, dataAdmissao:new Date('2023-01-01') },
    { nome:'Ana Souza',     cargo:'Recepcionista', salarioBase:1800, valeTransporte:200, valeRefeicao:120, dataAdmissao:new Date('2023-03-01') },
    { nome:'Pedro Lima',    cargo:'Zelador',       salarioBase:1500, valeTransporte:160, valeRefeicao:120, dataAdmissao:new Date('2023-06-01') },
  ];
  for (const f of funcs) {
    const existe = await prisma.funcionario.findFirst({ where: { arenaId: arena.id, nome: f.nome } });
    if (!existe) await prisma.funcionario.create({ data: { ...f, arenaId: arena.id } });
  }

  // ── Categorias de produtos ─────────────────────────────
  const cats = {};
  for (const cat of [
    { nome:'Bebidas',      icone:'🍺', ordem:1 },
    { nome:'Alimentação',  icone:'🍔', ordem:2 },
    { nome:'Equipamentos', icone:'🏐', ordem:3 },
  ]) {
    const existente = await prisma.categoriaProduto.findFirst({ where: { arenaId: arena.id, nome: cat.nome } });
    cats[cat.nome] = existente ?? await prisma.categoriaProduto.create({ data: { ...cat, arenaId: arena.id } });
  }

  // ── Produtos ───────────────────────────────────────────
  // Campos corretos: custo, markup, precoVenda, qtdEstoque, estoqueMinimo
  const produtos = [
    { nome:'Cerveja Lata 350ml',    custo:3.00,  markup:200, qtdEstoque:48, estoqueMinimo:12, categoriaId:cats['Bebidas']?.id },
    { nome:'Água Mineral 500ml',    custo:0.80,  markup:250, qtdEstoque:60, estoqueMinimo:20, categoriaId:cats['Bebidas']?.id },
    { nome:'Isotônico 500ml',       custo:3.50,  markup:150, qtdEstoque:24, estoqueMinimo:8,  categoriaId:cats['Bebidas']?.id },
    { nome:'Coxinha',               custo:2.50,  markup:120, qtdEstoque:20, estoqueMinimo:5,  categoriaId:cats['Alimentação']?.id },
    { nome:'Bola de Vôlei',         custo:45.00, markup:80,  qtdEstoque:5,  estoqueMinimo:2,  categoriaId:cats['Equipamentos']?.id, unidade:'un' },
    { nome:'Protetor Solar FPS 50', custo:12.00, markup:100, qtdEstoque:10, estoqueMinimo:3,  categoriaId:cats['Equipamentos']?.id },
  ];
  for (const p of produtos) {
    await prisma.produto.create({
      data: { ...p, arenaId: arena.id, precoVenda: +(p.custo * (1 + p.markup / 100)).toFixed(2) },
    }).catch(() => {}); // ignora duplicatas
  }

  // ── Despesas do mês atual ──────────────────────────────
  const mesRef = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const despesas = [
    { categoria:'PESSOAL_SALARIOS',       codigoConta:'5.1.1', descricao:'Salários',        valor:6500 },
    { categoria:'PESSOAL_ENCARGOS',       codigoConta:'5.1.2', descricao:'INSS + FGTS',     valor:1820 },
    { categoria:'PESSOAL_BENEFICIOS',     codigoConta:'5.1.3', descricao:'VT + VR',          valor:880  },
    { categoria:'OPERACIONAL_ENERGIA',    codigoConta:'5.2.1', descricao:'Energia elétrica', valor:2100 },
    { categoria:'OPERACIONAL_AGUA',       codigoConta:'5.2.2', descricao:'Água',             valor:380  },
    { categoria:'ADMINISTRATIVO_ALUGUEL', codigoConta:'5.3.1', descricao:'Aluguel',          valor:4500 },
    { categoria:'ADMINISTRATIVO_SISTEMA', codigoConta:'5.3.3', descricao:'QuadraJá SaaS',   valor:349  },
  ];
  for (const d of despesas) {
    await prisma.despesa.create({
      data: { ...d, arenaId: arena.id, mesReferencia: mesRef, lancadoPor: admin.id },
    }).catch(() => {});
  }

  // ── Log de auditoria inicial ───────────────────────────
  // Campos corretos do model LogAcao: usuarioId, emailAtor, acao, entidade, entidadeId, depois
  await prisma.logAcao.create({
    data: {
      usuarioId:  admin.id,
      emailAtor:  admin.email,
      acao:       'ARENA_CRIADA',
      entidade:   'Arena',
      entidadeId: arena.id,
      depois:     { id: arena.id, nome: arena.nome },
    },
  });

  console.log(`\n✅ Seed concluído! (${new Date().toLocaleString('pt-BR')})`);
  console.log(`   Admin:   admin@arenacentro.com.br / senha123`);
  console.log(`   Cliente: lucas@email.com / senha123`);
  console.log(`   Arena:   Arena Centro (${arena.id.slice(0,8)}...)`);
  console.log(`   Quadras: A1, A2, A3 (areia) · B1, B3 (piso) · B2 (manutenção)`);
  console.log(`   Tabelas: 40 tabelas em português\n`);
}

main()
  .catch(e => { console.error('❌ Seed falhou:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
