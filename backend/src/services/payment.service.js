// src/services/payment.service.js
import { prisma } from '../config/database.js';
import { getMPPaymentClient, getMPRefundClient, mpConfigured } from '../config/mercadopago.js';

// ── Criar pagamento PIX ───────────────────────────────────────
export async function criarPIX({ reservaId, valor, user }) {
  const mp = getMPPaymentClient();

  // Modo mock — MP não configurado
  if (!mp) {
    const payment = await prisma.payment.create({
      data: {
        reservationId:   reservaId,
        method:          'PIX',
        status:          'PENDENTE',
        amount:          valor,
        gatewayProvider: 'mock',
        gatewayId:       `mock-${Date.now()}`,
        pixCopyPaste:    '00020126580014BR.GOV.BCB.PIX0136quadraja-mock@test.com520400005303986' +
                         '5802BR5925QuadraJa Arena Centro6009SAO PAULO6304TEST',
        pixExpiresAt:    new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    return {
      paymentId:    payment.id,
      qrCodeBase64: null,
      pixCopyPaste: payment.pixCopyPaste,
      expiraEm:     payment.pixExpiresAt,
      mock:         true,
    };
  }

  // Criação real no Mercado Pago
  const mpResult = await mp.create({
    body: {
      transaction_amount: valor,
      description:        `Reserva QuadraJá #${reservaId.slice(0, 8).toUpperCase()}`,
      payment_method_id:  'pix',
      payer: {
        email:      user.email,
        first_name: user.name.split(' ')[0],
        last_name:  user.name.split(' ').slice(1).join(' ') || 'Cliente',
        ...(user.cpf ? { identification: { type: 'CPF', number: user.cpf } } : {}),
      },
      external_reference:  reservaId,
      notification_url:    `${process.env.APP_URL}/webhooks/mercadopago`,
      date_of_expiration:  new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
  });

  const qrData = mpResult.point_of_interaction?.transaction_data;

  const payment = await prisma.payment.create({
    data: {
      reservationId:   reservaId,
      method:          'PIX',
      status:          'PENDENTE',
      amount:          valor,
      gatewayProvider: 'mercadopago',
      gatewayId:       String(mpResult.id),
      gatewayRawData:  mpResult,
      pixQrCode:       qrData?.qr_code_base64 || null,
      pixCopyPaste:    qrData?.qr_code        || null,
      pixExpiresAt:    new Date(mpResult.date_of_expiration),
    },
  });

  return {
    paymentId:    payment.id,
    qrCodeBase64: payment.pixQrCode,
    pixCopyPaste: payment.pixCopyPaste,
    expiraEm:     payment.pixExpiresAt,
    mock:         false,
  };
}

// ── Processar confirmação de pagamento (via webhook) ──────────
export async function confirmarPagamento(gatewayId) {
  const payment = await prisma.payment.findFirst({
    where: { gatewayId: String(gatewayId) },
  });

  if (!payment) throw new Error(`Payment não encontrado para gateway ID ${gatewayId}`);

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'APROVADO', paidAt: new Date() },
    }),
    prisma.reservation.update({
      where: { id: payment.reservationId },
      data:  { status: 'CONFIRMADA' },
    }),
  ]);

  return payment.reservationId;
}

// ── Processar recusa de pagamento ─────────────────────────────
export async function recusarPagamento(gatewayId) {
  await prisma.payment.updateMany({
    where: { gatewayId: String(gatewayId) },
    data:  { status: 'RECUSADO' },
  });
}

// ── Confirmar pagamento mock (apenas dev) ─────────────────────
export async function confirmarMock(reservationId) {
  const payment = await prisma.payment.findFirst({
    where: { reservationId },
  });
  if (!payment) throw new Error('Pagamento não encontrado.');

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'APROVADO', paidAt: new Date() },
    }),
    prisma.reservation.update({
      where: { id: reservationId },
      data:  { status: 'CONFIRMADA' },
    }),
  ]);
}

// ── Estornar pagamento ────────────────────────────────────────
export async function estornarPagamento(gatewayId, valor) {
  if (!mpConfigured) {
    // Mock — apenas atualiza o banco
    await prisma.payment.updateMany({
      where: { gatewayId },
      data:  { status: 'REEMBOLSADO', refundedAt: new Date() },
    });
    return { mock: true };
  }

  const refund = await getMPRefundClient().create({
    payment_id: Number(gatewayId),
    body: { amount: valor },
  });

  await prisma.payment.updateMany({
    where: { gatewayId },
    data:  { status: 'REEMBOLSADO', refundedAt: new Date() },
  });

  return refund;
}
