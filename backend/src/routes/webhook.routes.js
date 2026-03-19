// src/routes/webhook.routes.js
import crypto from 'crypto';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function webhookRoutes(fastify) {

  // POST /webhooks/mercadopago
  fastify.post('/mercadopago', async (request, reply) => {
    // Verificar assinatura
    const signature  = request.headers['x-signature'];
    const requestId  = request.headers['x-request-id'];
    const body       = request.body;

    if (signature && process.env.MP_WEBHOOK_SECRET) {
      if (!validarAssinatura(signature, requestId, body?.data?.id)) {
        fastify.log.warn('Webhook MP: assinatura inválida');
        return reply.code(401).send({ error: 'Assinatura inválida.' });
      }
    }

    if (body?.type !== 'payment' || !body?.data?.id) {
      return reply.code(200).send('OK');
    }

    try {
      const token = process.env.NODE_ENV === 'production'
        ? process.env.MP_ACCESS_TOKEN
        : process.env.MP_ACCESS_TOKEN_TEST;

      const mpClient   = new Payment(new MercadoPagoConfig({ accessToken: token }));
      const mpPayment  = await mpClient.get({ id: body.data.id });

      const reservaId = mpPayment.external_reference;
      const status    = mpPayment.status;

      if (status === 'approved') {
        await fastify.prisma.$transaction([
          fastify.prisma.payment.updateMany({
            where: { gatewayId: String(body.data.id) },
            data:  { status: 'APROVADO', paidAt: new Date() },
          }),
          fastify.prisma.reservation.update({
            where: { id: reservaId },
            data:  { status: 'CONFIRMADA' },
          }),
        ]);
        fastify.log.info(`✅ Pagamento aprovado — reserva ${reservaId}`);
      }

      if (status === 'rejected' || status === 'cancelled') {
        await fastify.prisma.payment.updateMany({
          where: { gatewayId: String(body.data.id) },
          data:  { status: 'RECUSADO' },
        });
        fastify.log.info(`❌ Pagamento recusado — reserva ${reservaId}`);
      }

      return reply.code(200).send('OK');
    } catch (err) {
      fastify.log.error('Erro no webhook MP:', err);
      return reply.code(500).send('Erro interno');
    }
  });

  // POST /webhooks/mock-confirm/:reservationId — confirma pagamento sem MP (desenvolvimento)
  fastify.post('/mock-confirm/:reservationId', async (request, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.code(404).send({ error: 'Not found' });
    }

    const { reservationId } = request.params;

    const payment = await fastify.prisma.payment.findFirst({
      where: { reservationId },
    });

    if (!payment) return reply.code(404).send({ error: 'Pagamento não encontrado.' });

    await fastify.prisma.$transaction([
      fastify.prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'APROVADO', paidAt: new Date() },
      }),
      fastify.prisma.reservation.update({
        where: { id: reservationId },
        data:  { status: 'CONFIRMADA' },
      }),
    ]);

    return reply.send({ confirmado: true });
  });
}

function validarAssinatura(signature, requestId, dataId) {
  try {
    const parts  = signature.split(',');
    const ts     = parts.find(p => p.startsWith('ts='))?.split('=')[1];
    const v1     = parts.find(p => p.startsWith('v1='))?.split('=')[1];
    if (!ts || !v1) return false;
    const manifest  = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expected  = crypto
      .createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
      .update(manifest)
      .digest('hex');
    return expected === v1;
  } catch {
    return false;
  }
}
