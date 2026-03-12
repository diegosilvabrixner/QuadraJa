// screen-06-confirmacao.js — QuadraJá · Confirmação

// ── Ler parâmetros da URL ──────────────────────────────
const params   = new URLSearchParams(location.search);
const cCourt   = params.get('court')   || 'A1';
const cTipo    = params.get('tipo')    || 'avulso';
const cData    = params.get('data')    || '—';
const cHorario = params.get('horario') || '—';
const cPreco   = params.get('preco')   || '80';

// Atualizar detalhes da confirmação
const courtEl  = document.querySelector('.confirm-row strong');
const dateEl   = document.querySelectorAll('.confirm-row strong')[1];
const timeEl   = document.querySelectorAll('.confirm-row p')[1];
const priceEl  = document.querySelectorAll('.confirm-row strong')[2];
const paidEl   = document.querySelectorAll('.confirm-row p')[2];

if (courtEl)  courtEl.textContent  = `Quadra ${cCourt} · Arena Centro`;
if (dateEl)   dateEl.textContent   = cData !== '—' ? formatDate(cData) : (cTipo === 'mensal' ? 'Plano mensal' : '—');
if (timeEl)   timeEl.textContent   = cHorario !== '—' ? `${cHorario} – ${addHour(cHorario)} (1 hora)` : '—';
if (priceEl)  priceEl.textContent  = `R$ ${cPreco},00`;
if (paidEl)   paidEl.textContent   = `Pago via PIX · Aprovado agora`;

function formatDate(d) {
  if (!d || d === '—') return '—';
  const [day, month, year] = d.split('/');
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const date = new Date(year, month - 1, day);
  const weekdays = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  return `${weekdays[date.getDay()]}, ${day} de ${months[month-1]} de ${year}`;
}
function addHour(t) {
  if (!t || t === '—') return '—';
  const [h, m] = t.split(':').map(Number);
  return `${String(h+1).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ── Copiar código de reserva ───────────────────────────
document.getElementById('copyCodeBtn').addEventListener('click', async () => {
  const code = document.getElementById('bookingCode').textContent;
  try {
    await navigator.clipboard.writeText(code);
    const btn = document.getElementById('copyCodeBtn');
    btn.textContent = '✓';
    btn.style.borderColor = 'var(--accent)';
    setTimeout(() => {
      btn.textContent = '📋';
      btn.style.borderColor = '';
    }, 2000);
  } catch {
    alert('Código: ' + code);
  }
});

// ── Nova reserva ───────────────────────────────────────
document.getElementById('newReservationBtn').addEventListener('click', () => {
  window.location.href = 'locais.html';
});

// ── Compartilhar ───────────────────────────────────────
document.getElementById('shareBtn').addEventListener('click', async () => {
  const data = {
    title: 'Reserva QuadraJá',
    text: '🏐 Reservei a Quadra A1 na Arena Centro para sábado às 10h! Usa o app QuadraJá para reservar também.',
    url: 'https://quadraja.com.br',
  };
  if (navigator.share) {
    try { await navigator.share(data); }
    catch (e) { if (e.name !== 'AbortError') console.error(e); }
  } else {
    await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
    const btn = document.getElementById('shareBtn');
    btn.textContent = '✓ Link copiado!';
    setTimeout(() => { btn.textContent = '📤 Compartilhar'; }, 2000);
  }
});

// ── Gerar código único aleatório ───────────────────────
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'QJ-2025-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += Math.floor(Math.random() * 10);
  return code;
}
document.getElementById('bookingCode').textContent = generateCode();
