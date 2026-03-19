// src/config/env.js
// Valida e exporta todas as variáveis de ambiente
// Falha na inicialização se algo crítico estiver faltando

import 'dotenv/config';

function required(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`❌ Variável de ambiente obrigatória não definida: ${name}`);
    process.exit(1);
  }
  return val;
}

function optional(name, defaultValue = '') {
  return process.env[name] || defaultValue;
}

export const env = {
  // Servidor
  NODE_ENV:     optional('NODE_ENV', 'development'),
  PORT:         parseInt(optional('PORT', '3001')),
  isProd:       process.env.NODE_ENV === 'production',
  isDev:        process.env.NODE_ENV !== 'production',

  // Banco de dados
  DATABASE_URL: required('DATABASE_URL'),

  // JWT
  JWT_SECRET:   required('JWT_SECRET'),

  // URLs
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5500'),
  APP_URL:      optional('APP_URL', 'http://localhost:3001'),

  // Mercado Pago
  MP_ACCESS_TOKEN: optional('MP_ACCESS_TOKEN', ''),
  MP_ACCESS_TOKEN_TEST: optional('MP_ACCESS_TOKEN_TEST', ''),
  MP_PUBLIC_KEY:   optional('MP_PUBLIC_KEY', ''),
  MP_PUBLIC_KEY_TEST: optional('MP_PUBLIC_KEY_TEST', ''),
  MP_WEBHOOK_SECRET: optional('MP_WEBHOOK_SECRET', ''),

  // E-mail (Resend)
  RESEND_API_KEY: optional('RESEND_API_KEY', ''),
  EMAIL_FROM:     optional('EMAIL_FROM', 'noreply@quadraja.com.br'),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID:  optional('TWILIO_ACCOUNT_SID', ''),
  TWILIO_AUTH_TOKEN:   optional('TWILIO_AUTH_TOKEN', ''),
  TWILIO_PHONE_NUMBER: optional('TWILIO_PHONE_NUMBER', ''),

  // Helpers
  get mpToken() {
    return this.isProd ? this.MP_ACCESS_TOKEN : this.MP_ACCESS_TOKEN_TEST;
  },
  get mpConfigured() {
    return !!(this.isProd ? this.MP_ACCESS_TOKEN : this.MP_ACCESS_TOKEN_TEST);
  },
};
