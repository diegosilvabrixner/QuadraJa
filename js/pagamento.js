// screen-05-pagamento.js — QuadraJá · Pagamento

// ── Ler parâmetros da URL ──────────────────────────────
const params  = new URLSearchParams(location.search);
const pCourt  = params.get('court')  || 'A1';
const pTipo   = params.get('tipo')   || 'avulso';
const pData   = params.get('data')   || '—';
const pHorario= params.get('horario')|| '—';
const pPreco  = params.get('preco')  || '80';

// Atualizar resumo no HTML
const bookingDesc = document.querySelector('.booking-details p');
const bookingChip = document.querySelector('.booking-details .chip');
const priceEl     = document.querySelector('.price-total');
const payBtnText  = () => document.getElementById('payBtn');

if (bookingDesc) bookingDesc.textContent = pData !== '—'
  ? `${pData} · ${pHorario} – ${addHourStr(pHorario)}`
  : `${pTipo === 'mensal' ? 'Plano mensal' : 'Avulso'} · ${pHorario}`;
if (bookingChip) bookingChip.textContent = pTipo === 'mensal' ? 'Mensal' : 'Avulso · 1 hora';
if (priceEl)     priceEl.textContent = `R$ ${pPreco}`;
document.querySelectorAll('#payBtn').forEach(b => b.textContent = `Pagar R$ ${pPreco},00 →`);

function addHourStr(t) {
  if (!t || t === '—') return '—';
  const [h, m] = t.split(':').map(Number);
  return `${String(h+1).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

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
    clearInterval(countdown);
    payBtn.textContent = '✓ Pago!';
    payBtn.style.background = 'linear-gradient(135deg,#00E5A0,#00C98A)';
    setTimeout(() => {
      window.location.href = `confirmacao.html${location.search}`;
    }, 600);
  }, 2200);
});
