// src/config/mercadopago.js
import { MercadoPagoConfig, Payment, Refund } from 'mercadopago';
import { env } from './env.js';

function getMPConfig() {
  if (!env.mpConfigured) return null;
  return new MercadoPagoConfig({
    accessToken: env.mpToken,
    options: { timeout: 10000, idempotencyKey: undefined },
  });
}

// Retorna cliente de pagamento ou null se MP não configurado
export function getMPPaymentClient() {
  const config = getMPConfig();
  if (!config) return null;
  return new Payment(config);
}

// Retorna cliente de estorno ou null se MP não configurado
export function getMPRefundClient() {
  const config = getMPConfig();
  if (!config) return null;
  return new Refund(config);
}

export const mpConfigured = env.mpConfigured;
