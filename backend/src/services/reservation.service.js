// src/services/reservation.service.js
import { prisma } from '../config/database.js';

const WEEKDAYS = ['DOMINGO','SEGUNDA','TERCA','QUARTA','QUINTA','SEXTA','SABADO'];

// ── Verificar disponibilidade ─────────────────────────────────
export async function checkAvailability({ courtId, type, date, startTime, weekDay }) {
  if (type === 'AVULSO' && date && startTime) {
    const conflict = await prisma.reservation.findFirst({
      where: {
        courtId,
        date:      new Date(date),
        startTime,
        status: { in: ['PENDENTE_PAGAMENTO', 'CONFIRMADA'] },
      },
    });
    if (conflict) {
      const err = new Error('Este horário já está reservado. Escolha outro.');
      err.statusCode = 409;
      throw err;
    }
  }

  if (type === 'MENSAL' && weekDay && startTime) {
    const conflict = await prisma.reservation.findFirst({
      where: {
        courtId,
        type:    'MENSAL',
        weekDay,
        startTime,
        status: { in: ['PENDENTE_PAGAMENTO', 'CONFIRMADA'] },
      },
    });
    if (conflict) {
      const err = new Error(`Este horário já tem um plano mensal ativo para ${weekDay}.`);
      err.statusCode = 409;
      throw err;
    }
  }
}

// ── Calcular valor da reserva ─────────────────────────────────
export function calcReservationAmount({ type, court, dayuse, slots, numberOfPeople }) {
  if (type === 'AVULSO') {
    return court.pricePerHour * (slots?.length || 1);
  }
  if (type === 'MENSAL') {
    return court.priceMonthly * (slots?.length || 1);
  }
  if (type === 'DAYUSE' && dayuse) {
    return dayuse.pricePerPerson * (numberOfPeople || 1);
  }
  return 0;
}

// ── Slots ocupados para uma data/quadra ───────────────────────
export async function getOccupiedSlots(courtId, dateStr) {
  const date     = new Date(dateStr);
  const weekDay  = WEEKDAYS[date.getDay()];

  const reservas = await prisma.reservation.findMany({
    where: {
      courtId,
      status: { in: ['PENDENTE_PAGAMENTO', 'CONFIRMADA'] },
      OR: [
        { type: 'AVULSO', date },
        { type: 'MENSAL', weekDay },
        { type: 'DAYUSE', dayuse: { date, active: true } },
      ],
    },
    select: { startTime: true, endTime: true, type: true },
  });

  return reservas
    .filter(r => r.startTime)
    .map(r => r.startTime);
}

// ── Calcular horas entre dois horários ────────────────────────
export function calcHours(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
}

// ── Verificar política de cancelamento ───────────────────────
export function checkCancellationPolicy(reservation, arena) {
  // Sem data definida (mensal ou dayuse sem data) — sempre pode cancelar com estorno
  if (!reservation.date || !reservation.startTime) {
    return { semEstorno: false };
  }

  const [h, m] = reservation.startTime.split(':').map(Number);
  const slotTime = new Date(reservation.date);
  slotTime.setHours(h, m, 0, 0);

  const hoursUntil = (slotTime.getTime() - Date.now()) / 3600000;
  const semEstorno = hoursUntil < (arena.cancellationHours || 4);

  return { semEstorno, hoursUntil: Math.max(0, hoursUntil) };
}
