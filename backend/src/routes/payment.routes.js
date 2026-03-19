// src/routes/payment.routes.js
import { MercadoPagoConfig, Payment } from 'mercadopago';

function getMPClient() {
  const token = process.env.NODE_ENV === 'production'
    ? process.env.MP_ACCESS_TOKEN
    : process.env.MP_ACCESS_TOKEN_TEST;

  if (!token) return null; // MP não configurado ainda
  return new Payment(new MercadoPagoConfig({ accessToken: token }));
}

export async function paymentRoutes(fastify) {

  // POST /api/payments/pix — criar cobrança PIX
  fastify.post('/pix', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { reservaId } = request.body;

    const reservation = await fastify.prisma.reservation.findFirst({
      where: { id: reservaId, userId: request.user.id },
    });
    if (!reservation) return reply.code(404).send({ error: 'Reserva não encontrada.' });
    if (reservation.status !== 'PENDENTE_PAGAMENTO') {
      return reply.code(400).send({ error: 'Reserva não está aguardando pagamento.' });
    }

    const user = await fastify.prisma.user.findUnique({ where: { id: request.user.id } });
    const mp   = getMPClient();

    // Se MP não configurado — retorna QR Code de teste
    if (!mp) {
      const mockPayment = await fastify.prisma.payment.create({
        data: {
          reservationId:   reservaId,
          method:          'PIX',
          status:          'PENDENTE',
          amount:          reservation.totalAmount,
          gatewayProvider: 'mock',
          gatewayId:       `mock-${Date.now()}`,
          pixCopyPaste:    '00020126580014BR.GOV.BCB.PIX0136quadraja-mock@test.com5204000053039865802BR5925QuadraJa6009SAO PAULO6304TEST',
          pixExpiresAt:    new Date(Date.now() + 30 * 60 * 1000),
        },
      });
      return reply.send({
        paymentId:    mockPayment.id,
        qrCodeBase64: null, // sem imagem no mock
        pixCopyPaste: mockPayment.pixCopyPaste,
        expiraEm:     mockPayment.pixExpiresAt,
        mock:         true,
      });
    }

    // Criação real no MP
    try {
      const mpPayment = await mp.create({
        body: {
          transaction_amount: reservation.totalAmount,
          description:        `Reserva QuadraJá #${reservaId.slice(0, 8)}`,
          payment_method_id:  'pix',
          payer: {
            email:      user.email,
            first_name: user.name.split(' ')[0],
            last_name:  user.name.split(' ').slice(1).join(' ') || 'Cliente',
            ...(user.cpf ? { identification: { type: 'CPF', number: user.cpf } } : {}),
          },
          external_reference:   reservaId,
          notification_url:     `${process.env.APP_URL}/webhooks/mercadopago`,
          date_of_expiration:   new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      });

      const qrData = mpPayment.point_of_interaction?.transaction_data;

      const payment = await fastify.prisma.payment.create({
        data: {
          reservationId:   reservaId,
          method:          'PIX',
          status:          'PENDENTE',
          amount:          reservation.totalAmount,
          gatewayProvider: 'mercadopago',
          gatewayId:       String(mpPayment.id),
          pixQrCode:       qrData?.qr_code_base64   || null,
          pixCopyPaste:    qrData?.qr_code           || null,
          pixExpiresAt:    new Date(mpPayment.date_of_expiration),
        },
      });

      return reply.send({
        paymentId:    payment.id,
        qrCodeBase64: payment.pixQrCode,
        pixCopyPaste: payment.pixCopyPaste,
        expiraEm:     payment.pixExpiresAt,
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(502).send({ error: 'Erro ao criar pagamento. Tente novamente.' });
    }
  });

  // GET /api/payments/:reservationId/status — polling do frontend
  fastify.get('/:reservationId/status', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const payment = await fastify.prisma.payment.findFirst({
      where: { reservationId: request.params.reservationId },
      select: { status: true, paidAt: true, method: true },
    });

    if (!payment) return reply.code(404).send({ error: 'Pagamento não encontrado.' });

    return reply.send(payment);
  });
}
