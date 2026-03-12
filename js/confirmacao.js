// screen-06-confirmacao.js — QuadraJá · Confirmação

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
  // Em produção: window.location.href = 'screen-02-locais.html';
  console.log('Nova reserva → ir para locais');
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
