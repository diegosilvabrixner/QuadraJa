// src/services/stock.service.js
import { prisma } from '../config/database.js';

// ── Ajustar estoque de um produto ─────────────────────────────
export async function ajustarEstoque({ productId, type, quantity, reason, unitCost, createdBy }) {
  // type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'PERDA'
  const delta = type === 'ENTRADA' ? Math.abs(quantity) : -Math.abs(quantity);

  const [movement, product] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: { productId, type, quantity: delta, reason, unitCost, createdBy },
    }),
    prisma.product.update({
      where: { id: productId },
      data:  { stockQuantity: { increment: delta } },
    }),
  ]);

  // Verifica se ficou abaixo do mínimo
  const belowMin = product.stockQuantity <= product.minStock;

  return { movement, newStock: product.stockQuantity, belowMin };
}

// ── Baixar estoque de um pedido (ao confirmar) ────────────────
export async function baixarEstoquePedido(orderId) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: { product: true },
  });

  for (const item of items) {
    if (!item.product.trackStock) continue;

    if (item.product.stockQuantity < item.quantity) {
      const err = new Error(`Estoque insuficiente para "${item.product.name}". Disponível: ${item.product.stockQuantity}.`);
      err.statusCode = 409;
      throw err;
    }

    await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type:      'SAIDA',
          quantity:  -item.quantity,
          reason:    `Pedido #${orderId.slice(0, 8)}`,
          unitCost:  item.product.costPrice,
        },
      }),
      prisma.product.update({
        where: { id: item.productId },
        data:  { stockQuantity: { decrement: item.quantity } },
      }),
    ]);
  }
}

// ── Produtos com estoque abaixo do mínimo ─────────────────────
export async function getProdutosBaixoEstoque(arenaId) {
  const products = await prisma.product.findMany({
    where:   { arenaId, trackStock: true, status: 'ATIVO' },
    include: { category: true },
    orderBy: { stockQuantity: 'asc' },
  });
  return products.filter(p => p.stockQuantity <= p.minStock);
}

// ── Histórico de movimentação ─────────────────────────────────
export async function getHistoricoEstoque(productId, limit = 50) {
  return prisma.stockMovement.findMany({
    where:   { productId },
    orderBy: { createdAt: 'desc' },
    take:    limit,
  });
}

// ── Recalcular preço de venda com novo custo/markup ───────────
export function calcSellingPrice(costPrice, markup) {
  return +(costPrice * (1 + markup / 100)).toFixed(2);
}

// ── CMV do mês (Custo das Mercadorias Vendidas) ───────────────
export async function getCMV(arenaId, start, end) {
  const movements = await prisma.stockMovement.findMany({
    where: {
      type:      'SAIDA',
      createdAt: { gte: start, lte: end },
      product:   { arenaId },
    },
    select: { quantity: true, unitCost: true },
  });

  return movements.reduce((total, m) => {
    return total + (Math.abs(m.quantity) * (m.unitCost || 0));
  }, 0);
}
