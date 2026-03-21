// src/routes/auth.routes.js
import bcrypt from 'bcryptjs';
import { z }  from 'zod';

export async function authRoutes(fastify) {

  // POST /api/auth/register
  fastify.post('/register', async (request, reply) => {
    const schema = z.object({
      nome:          z.string().min(3, 'Nome precisa ter pelo menos 3 caracteres'),
      email:         z.string().email('E-mail inválido'),
      telefone:      z.string().min(10, 'Telefone inválido'),
      senha:         z.string().min(8, 'Senha precisa ter pelo menos 8 caracteres'),
      dataNascimento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data no formato DD/MM/AAAA'),
      cpf:           z.string().optional(),
    });

    const body = schema.parse(request.body);

    const existing = await fastify.prisma.usuario.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) return reply.code(409).send({ error: 'Este e-mail já está cadastrado.' });

    if (body.cpf) {
      const cpfClean = body.cpf.replace(/\D/g, '');
      const cpfEx = await fastify.prisma.usuario.findUnique({ where: { cpf: cpfClean } });
      if (cpfEx) return reply.code(409).send({ error: 'CPF já cadastrado.' });
    }

    const [d, m, y] = body.dataNascimento.split('/').map(Number);
    const birth = new Date(y, m - 1, d);
    const age   = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 18) return reply.code(400).send({ error: 'É necessário ter pelo menos 18 anos.' });

    const senhaHash = await bcrypt.hash(body.senha, 12);

    const usuario = await fastify.prisma.usuario.create({
      data: {
        nome:          body.nome.trim(),
        email:         body.email.trim().toLowerCase(),
        telefone:      body.telefone.replace(/\D/g, ''),
        cpf:           body.cpf ? body.cpf.replace(/\D/g, '') : null,
        dataNascimento: birth,
        senhaHash,
      },
    });

    const token = fastify.jwt.sign(
      { id: usuario.id, email: usuario.email, perfil: usuario.perfil, nome: usuario.nome },
      { expiresIn: '30d' }
    );

    return reply.code(201).send({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    });
  });

  // POST /api/auth/login
  fastify.post('/login', async (request, reply) => {
    // LOG temporário — remover após confirmar que o login funciona
    fastify.log.info({ body: request.body, headers: request.headers['content-type'] }, 'LOGIN REQUEST');

    const body = request.body || {};
    const { email, password, senha } = body;
    const pw = senha || password; // aceita ambos (senha = PT, password = EN)

    if (!email || !pw) {
      fastify.log.warn({ email, pw: !!pw, body }, 'Login rejeitado: campos vazios');
      return reply.code(400).send({ error: 'E-mail e senha são obrigatórios.' });
    }

    const usuario = await fastify.prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!usuario) return reply.code(401).send({ error: 'E-mail ou senha incorretos.' });

    const valid = await bcrypt.compare(pw, usuario.senhaHash);
    if (!valid) return reply.code(401).send({ error: 'E-mail ou senha incorretos.' });

    if (!usuario.ativo) return reply.code(403).send({ error: 'Conta desativada. Entre em contato com o suporte.' });

    const token = fastify.jwt.sign(
      { id: usuario.id, email: usuario.email, perfil: usuario.perfil, nome: usuario.nome },
      { expiresIn: '30d' }
    );

    return reply.send({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    });
  });

  // GET /api/auth/me
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const usuario = await fastify.prisma.usuario.findUnique({
      where: { id: request.user.id },
      select: { id: true, nome: true, email: true, telefone: true, perfil: true, avatarUrl: true },
    });
    if (!usuario) return reply.code(404).send({ error: 'Usuário não encontrado.' });
    return reply.send(usuario);
  });

  // PATCH /api/auth/me
  fastify.patch('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { nome, telefone } = request.body;
    const updated = await fastify.prisma.usuario.update({
      where: { id: request.user.id },
      data: {
        ...(nome     ? { nome: nome.trim() }                   : {}),
        ...(telefone ? { telefone: telefone.replace(/\D/g,'') } : {}),
      },
      select: { id: true, nome: true, email: true, telefone: true },
    });
    return reply.send(updated);
  });
}
