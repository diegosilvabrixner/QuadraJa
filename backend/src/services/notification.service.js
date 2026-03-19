// src/services/notification.service.js
// Stubs de notificação — prontos para integrar Resend (email) e Twilio (SMS)
// Por enquanto apenas loga no console

import { env } from '../config/env.js';

// ── E-mail ────────────────────────────────────────────────────
export async function enviarEmailConfirmacao({ email, nome, reserva, arena }) {
  if (!env.RESEND_API_KEY) {
    console.log(`[EMAIL - MOCK] Confirmação para ${email}:
      Olá ${nome}! Sua reserva em ${arena} foi confirmada.
      Data: ${reserva.data} | Horário: ${reserva.horario}
      Código: ${reserva.id}`);
    return;
  }

  // Integração real com Resend
  // const { Resend } = await import('resend');
  // const resend = new Resend(env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: env.EMAIL_FROM,
  //   to: email,
  //   subject: `Reserva confirmada — ${arena}`,
  //   html: `<h1>Olá ${nome}!</h1><p>Sua reserva foi confirmada...</p>`
  // });
}

export async function enviarEmailCancelamento({ email, nome, reserva, arena, comEstorno }) {
  if (!env.RESEND_API_KEY) {
    console.log(`[EMAIL - MOCK] Cancelamento para ${email}: ${comEstorno ? 'COM' : 'SEM'} estorno`);
    return;
  }
  // Implementar com Resend quando necessário
}

// ── SMS ───────────────────────────────────────────────────────
export async function enviarSMSLembrete({ phone, nome, arena, data, horario }) {
  if (!env.TWILIO_ACCOUNT_SID) {
    console.log(`[SMS - MOCK] Lembrete para ${phone}:
      Olá ${nome}! Seu jogo em ${arena} é amanhã às ${horario}. Não esqueça!`);
    return;
  }

  // Integração real com Twilio
  // const twilio = require('twilio')(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  // await twilio.messages.create({
  //   body: `Olá ${nome}! Seu jogo em ${arena} é hoje às ${horario}. Boa partida!`,
  //   from: env.TWILIO_PHONE_NUMBER,
  //   to: `+55${phone.replace(/\D/g, '')}`,
  // });
}

export async function enviarSMSConfirmacao({ phone, nome, arena, codigo }) {
  if (!env.TWILIO_ACCOUNT_SID) {
    console.log(`[SMS - MOCK] Confirmação para ${phone}: código ${codigo}`);
    return;
  }
  // Implementar com Twilio quando necessário
}
