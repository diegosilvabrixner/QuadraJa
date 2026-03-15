// confirmacao.js — QuadraJá v2

// ── Parâmetros ────────────────────────────────────────
const params     = new URLSearchParams(location.search);
const arenaName  = params.get('arena')   || 'Arena Centro';
const courtId    = params.get('court')   || 'A1';
const tipo       = params.get('tipo')    || 'avulso';
const data       = params.get('data')    || '—';
const horarios   = params.get('horarios')|| '—';
const preco      = params.get('preco')   || '80';
const reservaId  = params.get('id')      || gerarCodigo();

const horariosList = horarios !== '—' ? horarios.split(',') : [];

function addHour(t) {
  const [h,m] = t.split(':').map(Number);
  return `${String(h+1).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ── Preenche os detalhes ──────────────────────────────
document.getElementById('bookingCode').textContent  = reservaId.replace('QJ-','QJ-').slice(0,12).toUpperCase();
document.getElementById('confArena').textContent    = arenaName;
document.getElementById('confQuadra').textContent   = `Quadra ${courtId}`;
document.getElementById('confPreco').textContent    = `R$ ${preco},00`;

if (data !== '—') {
  document.getElementById('confData').textContent = formatarData(data);
} else {
  document.getElementById('confData').textContent = tipo==='mensal' ? 'Plano Mensal' : '—';
}

const horariosFormatados = horariosList
  .sort()
  .map(h => `${h} – ${addHour(h)}`)
  .join('  ·  ');
document.getElementById('confHorarios').textContent =
  `${horariosFormatados}  (${horariosList.length}h)`;

// Endereço fictício por arena
const enderecos = {
  'Arena Centro':      'Rua das Palmeiras, 240 · Centro',
  'Arena Norte':       'Av. Paulista, 1800 · Bela Vista',
  'Arena Coberta Sul': 'Rua Augusta, 900 · Consolação',
  'Beach Sport Lapa':  'Largo da Lapa, 12 · Lapa',
};
document.getElementById('confEndereco').textContent = enderecos[arenaName] || arenaName;

// ── Formatador de data ────────────────────────────────
function formatarData(d) {
  if (!d || d==='—') return '—';
  const [day,month,year] = d.split('/');
  const months = ['janeiro','fevereiro','março','abril','maio','junho',
                  'julho','agosto','setembro','outubro','novembro','dezembro'];
  const date    = new Date(year, month-1, day);
  const weekdays = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  return `${weekdays[date.getDay()]}, ${day} de ${months[month-1]} de ${year}`;
}

// ── Copiar código ─────────────────────────────────────
document.getElementById('copyCodeBtn').addEventListener('click', async () => {
  const code = document.getElementById('bookingCode').textContent;
  try { await navigator.clipboard.writeText(code); } catch {}
  const btn = document.getElementById('copyCodeBtn');
  btn.textContent = '✓';
  btn.style.borderColor = 'var(--accent)';
  setTimeout(() => { btn.textContent = '📋'; btn.style.borderColor=''; }, 2000);
});

// ── Mapa ──────────────────────────────────────────────
document.getElementById('btnMapa').addEventListener('click', () => {
  const query = encodeURIComponent(enderecos[arenaName] || arenaName);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
});

// ── Nova reserva ──────────────────────────────────────
document.getElementById('newReservationBtn').addEventListener('click', () => {
  window.location.href = 'locais.html';
});

// ── Compartilhar ──────────────────────────────────────
document.getElementById('shareBtn').addEventListener('click', async () => {
  const msg = `🏐 Reservei a Quadra ${courtId} na ${arenaName} — ${data} · ${horariosFormatados}!\n\nUse o QuadraJá para reservar também: https://quadraja.com.br`;
  if (navigator.share) {
    try { await navigator.share({ title:'Reserva QuadraJá', text: msg }); } catch {}
  } else {
    try { await navigator.clipboard.writeText(msg); } catch {}
    const btn = document.getElementById('shareBtn');
    btn.textContent = '✓ Copiado!';
    setTimeout(() => { btn.textContent = '📤 Compartilhar'; }, 2000);
  }
});

// ── Gerador de código (fallback) ──────────────────────
function gerarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'QJ-';
  for (let i=0; i<4; i++) code += chars[Math.floor(Math.random()*chars.length)];
  code += Math.floor(Math.random()*10);
  return code;
}
