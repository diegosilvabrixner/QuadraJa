// screen-05-pagamento.js — QuadraJá · Pagamento

const paymentOptions = document.querySelectorAll('.payment-option');
const pixPanel  = document.getElementById('pixPanel');
const cardPanel = document.getElementById('cardPanel');
const payBtn    = document.getElementById('payBtn');

// ── Selecionar método ──────────────────────────────────
paymentOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    paymentOptions.forEach(o => {
      o.classList.remove('active');
      o.querySelector('.pm-check').textContent = '';
    });
    opt.classList.add('active');
    opt.querySelector('.pm-check').textContent = '✓';

    const method = opt.dataset.method;
    pixPanel.style.display  = method === 'pix' ? 'flex' : 'none';
    cardPanel.style.display = (method === 'credit' || method === 'debit') ? 'flex' : 'none';
  });
});

// ── PIX Countdown timer ────────────────────────────────
let seconds = 14 * 60 + 59;
const timerEl = document.getElementById('pixTimer');

const countdown = setInterval(() => {
  seconds--;
  if (seconds <= 0) {
    clearInterval(countdown);
    timerEl.textContent = '00:00';
    timerEl.style.color = 'var(--red)';
    return;
  }
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  timerEl.textContent = `${m}:${s}`;
}, 1000);

// ── Copiar código PIX ──────────────────────────────────
document.getElementById('copyPixBtn').addEventListener('click', async () => {
  const fakeCode = '00020126580014BR.GOV.BCB.PIX0136quadraja@arena.com.br5204000053039865802BR5925QuadraJa Arena Centro6009SAO PAULO62070503***630477A1';
  try {
    await navigator.clipboard.writeText(fakeCode);
    const btn = document.getElementById('copyPixBtn');
    btn.textContent = '✓ Código copiado!';
    btn.style.borderColor = 'var(--accent)';
    btn.style.color = 'var(--accent)';
    setTimeout(() => {
      btn.textContent = '📋 Copiar código PIX';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2500);
  } catch { alert('Código: ' + fakeCode.slice(0, 30) + '...'); }
});

// ── Máscara cartão ─────────────────────────────────────
const cardNumberInput = document.getElementById('cardNumber');
const cardExpiryInput = document.getElementById('cardExpiry');
if (cardNumberInput) {
  cardNumberInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  });
}
if (cardExpiryInput) {
  cardExpiryInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2);
    e.target.value = v;
  });
}

// ── Pay button ─────────────────────────────────────────
payBtn.addEventListener('click', () => {
  payBtn.textContent = '⏳ Processando...';
  payBtn.disabled = true;
  payBtn.style.opacity = '0.7';

  setTimeout(() => {
    // Em produção: verificar webhook do gateway e redirecionar
    // window.location.href = 'screen-06-confirmacao.html';
    clearInterval(countdown);
    payBtn.textContent = '✓ Pago!';
    payBtn.style.background = 'linear-gradient(135deg,#00E5A0,#00C98A)';
    console.log('Pagamento realizado → ir para confirmação');
  }, 2200);
});
