// pagamento.js — QuadraJá v2

// ── Parâmetros da URL ─────────────────────────────────
const params     = new URLSearchParams(location.search);
const arenaName  = params.get('arena')   || 'Arena Centro';
const courtId    = params.get('court')   || 'A1';
const tipo       = params.get('tipo')    || 'avulso';
const data       = params.get('data')    || '—';
const horarios   = params.get('horarios')|| '—';   // "10:00,11:00,15:00"
const preco      = params.get('preco')   || '80';

const weekday      = params.get('weekday')  || '';
const horariosList = horarios !== '—' ? horarios.split(',') : [];

// ── Preenche resumo ───────────────────────────────────
const bookingDesc = document.querySelector('.booking-details p');
const bookingChip = document.querySelector('.booking-details .chip');
const priceTotal  = document.querySelector('.price-total');
const payBtn      = document.getElementById('payBtn');

if (bookingDesc) {
  const horariosFormatados = horariosList
    .sort()
    .map(h => `${h}–${addHour(h)}`)
    .join('  ·  ');
  bookingDesc.textContent = data !== '—'
    ? `${data}  ·  ${horariosFormatados}`
    : `${tipo==='mensal'?'Plano mensal':'Avulso'}  ·  ${horariosFormatados}`;
}
if (bookingChip) bookingChip.textContent = tipo==='mensal' ? 'Mensal' : `Avulso · ${horariosList.length}h`;
if (priceTotal)  priceTotal.textContent  = `R$ ${preco}`;
if (payBtn)      payBtn.textContent      = `Pagar R$ ${preco},00 →`;

function addHour(t) {
  const [h,m] = t.split(':').map(Number);
  return `${String(h+1).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ── Métodos de pagamento ──────────────────────────────
const paymentOptions = document.querySelectorAll('.payment-option');
const pixPanel  = document.getElementById('pixPanel');
const cardPanel = document.getElementById('cardPanel');

paymentOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    paymentOptions.forEach(o => {
      o.classList.remove('active');
      o.querySelector('.pm-check').textContent = '';
    });
    opt.classList.add('active');
    opt.querySelector('.pm-check').textContent = '✓';
    const method = opt.dataset.method;
    pixPanel.style.display  = method === 'pix'                            ? 'flex' : 'none';
    cardPanel.style.display = (method==='credit'||method==='debit') ? 'flex' : 'none';
  });
});

// ── Countdown PIX ─────────────────────────────────────
let seconds = 14*60 + 59;
const timerEl = document.getElementById('pixTimer');
const countdown = setInterval(() => {
  seconds--;
  if (seconds <= 0) {
    clearInterval(countdown);
    timerEl.textContent = '00:00';
    timerEl.style.color = 'var(--red)';
    return;
  }
  const m = String(Math.floor(seconds/60)).padStart(2,'0');
  const s = String(seconds%60).padStart(2,'0');
  timerEl.textContent = `${m}:${s}`;
}, 1000);

// ── Copiar PIX ────────────────────────────────────────
document.getElementById('copyPixBtn').addEventListener('click', async () => {
  const code = 'quadraja-pix-mock-' + Date.now();
  try { await navigator.clipboard.writeText(code); } catch {}
  const btn = document.getElementById('copyPixBtn');
  btn.textContent = '✓ Código copiado!';
  btn.style.borderColor = 'var(--accent)';
  btn.style.color = 'var(--accent)';
  setTimeout(() => { btn.textContent = '📋 Copiar código PIX'; btn.style.borderColor=''; btn.style.color=''; }, 2500);
});

// ── Máscaras cartão ───────────────────────────────────
const cardNumberInput = document.getElementById('cardNumber');
const cardExpiryInput = document.getElementById('cardExpiry');
if (cardNumberInput) {
  cardNumberInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g,'').slice(0,16);
    e.target.value = v.replace(/(.{4})/g,'$1 ').trim();
  });
}
if (cardExpiryInput) {
  cardExpiryInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g,'').slice(0,4);
    if (v.length>=2) v = v.slice(0,2)+'/'+v.slice(2);
    e.target.value = v;
  });
}

// ── Confirmar pagamento → salva no localStorage ───────
payBtn.addEventListener('click', () => {
  payBtn.textContent = '⏳ Processando...';
  payBtn.disabled = true;
  payBtn.style.opacity = '0.7';

  setTimeout(() => {
    clearInterval(countdown);

    // Salva reserva no localStorage
    const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
    const novaReserva = {
      id:           'QJ-' + Date.now(),
      arena:        arenaName,
      court:        courtId,
      tipo,
      data,
      weekday,           // dia da semana para bloqueio mensal
      horarios:     horariosList.sort().map(h=>`${h}–${addHour(h)}`).join(', '),
      horariosList,
      preco,
      status:       'confirmada',
      pagoEm:       new Date().toLocaleString('pt-BR'),
    };
    reservas.push(novaReserva);
    localStorage.setItem('qj_reservas', JSON.stringify(reservas));

    // Redireciona para confirmação
    const p = new URLSearchParams({
      arena:   arenaName,
      court:   courtId,
      tipo,
      data,
      weekday,
      horarios: horarios,
      preco,
      id:      novaReserva.id,
    });
    payBtn.textContent = '✓ Pago!';
    payBtn.style.background = 'linear-gradient(135deg,#00E5A0,#00C98A)';
    setTimeout(() => { window.location.href = `confirmacao.html?${p}`; }, 600);
  }, 2000);
});
