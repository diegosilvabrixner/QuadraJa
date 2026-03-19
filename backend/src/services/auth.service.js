// src/services/auth.service.js
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';

// ── Registrar novo usuário ────────────────────────────────────
export async function registerUser({ name, email, phone, password, birthDate, cpf }) {
  // Verificar e-mail
  const emailExists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (emailExists) {
    const err = new Error('Este e-mail já está cadastrado.');
    err.statusCode = 409;
    throw err;
  }

  // Verificar CPF
  if (cpf) {
    const cpfClean = cpf.replace(/\D/g, '');
    const cpfExists = await prisma.user.findUnique({ where: { cpf: cpfClean } });
    if (cpfExists) {
      const err = new Error('CPF já cadastrado.');
      err.statusCode = 409;
      throw err;
    }
  }

  // Verificar idade mínima
  const birth = parseBirthDate(birthDate);
  const age   = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (age < 18) {
    const err = new Error('É necessário ter pelo menos 18 anos para criar uma conta.');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name:         name.trim(),
      email:        email.trim().toLowerCase(),
      phone:        phone.replace(/\D/g, ''),
      cpf:          cpf ? cpf.replace(/\D/g, '') : null,
      birthDate:    birth,
      passwordHash,
    },
  });

  return sanitize(user);
}

// ── Login ─────────────────────────────────────────────────────
export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    const err = new Error('E-mail ou senha incorretos.');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('E-mail ou senha incorretos.');
    err.statusCode = 401;
    throw err;
  }

  if (!user.active) {
    const err = new Error('Conta desativada. Entre em contato com o suporte.');
    err.statusCode = 403;
    throw err;
  }

  return sanitize(user);
}

// ── Buscar perfil ─────────────────────────────────────────────
export async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err = new Error('Usuário não encontrado.');
    err.statusCode = 404;
    throw err;
  }
  return sanitize(user);
}

// ── Atualizar perfil ──────────────────────────────────────────
export async function updateUser(id, { name, phone }) {
  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name  ? { name: name.trim() }             : {}),
      ...(phone ? { phone: phone.replace(/\D/g, '') } : {}),
    },
  });
  return sanitize(updated);
}

// ── Helpers ───────────────────────────────────────────────────
function parseBirthDate(str) {
  // Aceita "DD/MM/AAAA" ou "AAAA-MM-DD"
  if (str.includes('/')) {
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(str);
}

function sanitize(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}
