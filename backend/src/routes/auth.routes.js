// src/routes/auth.routes.js
import bcrypt from 'bcryptjs';
import { z }  from 'zod';

export async function authRoutes(fastify) {

  // ── POST /api/auth/register ──────────────────────────
  fastify.post('/register', async (request, reply) => {
    const schema = z.object({
      name:      z.string().min(3, 'Nome precisa ter pelo menos 3 caracteres'),
      email:     z.string().email('E-mail inválido'),
      phone:     z.string().min(10, 'Telefone inválido'),
      password:  z.string().min(8, 'Senha precisa ter pelo menos 8 caracteres'),
      birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data no formato DD/MM/AAAA'),
      cpf:       z.string().optional(),
    });

    const body = schema.parse(request.body);

    // Verificar e-mail duplicado
    const existing = await fastify.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return reply.code(409).send({ error: 'Este e-mail já está cadastrado.' });

    // Verificar CPF duplicado
    if (body.cpf) {
      const cpfClean = body.cpf.replace(/\D/g, '');
      const cpfEx = await fastify.prisma.user.findUnique({ where: { cpf: cpfClean } });
      if (cpfEx) return reply.code(409).send({ error: 'CPF já cadastrado.' });
    }

    // Calcular idade
    const [d, m, y] = body.birthDate.split('/').map(Number);
    const birth = new Date(y, m - 1, d);
    const age   = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 18) return reply.code(400).send({ error: 'É necessário ter pelo menos 18 anos.' });

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await fastify.prisma.user.create({
      data: {
        name:         body.name,
        email:        body.email,
        phone:        body.phone,
        cpf:          body.cpf?.replace(/\D/g, '') || null,
        birthDate:    birth,
        passwordHash,
      },
    });

    const token = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      { expiresIn: '30d' }
    );

    return reply.code(201).send({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });

  // ── POST /api/auth/login ─────────────────────────────
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ error: 'E-mail e senha são obrigatórios.' });
    }

    const user = await fastify.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (!user) {
      return reply.code(401).send({ error: 'E-mail ou senha incorretos.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: 'E-mail ou senha incorretos.' });
    }

    if (!user.active) {
      return reply.code(403).send({ error: 'Conta desativada. Entre em contato com o suporte.' });
    }

    const token = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      { expiresIn: '30d' }
    );

    return reply.send({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });

  // ── GET /api/auth/me ─────────────────────────────────
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, createdAt: true },
    });
    if (!user) return reply.code(404).send({ error: 'Usuário não encontrado.' });
    return reply.send(user);
  });

  // ── PATCH /api/auth/me — editar perfil ───────────────
  fastify.patch('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name, phone } = request.body;
    const updated = await fastify.prisma.user.update({
      where: { id: request.user.id },
      data: {
        ...(name  ? { name }  : {}),
        ...(phone ? { phone } : {}),
      },
      select: { id: true, name: true, email: true, phone: true },
    });
    return reply.send(updated);
  });
}
