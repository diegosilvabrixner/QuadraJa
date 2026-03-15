// quadras.js — QuadraJá v2

// ── Nome da arena via URL ─────────────────────────────
const params = new URLSearchParams(location.search);
const arenaName = params.get('arena') || 'Arena Centro';
document.getElementById('arenaTitle').textContent = arenaName;

// ── Carregar ocupações do localStorage ────────────────
const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
const ocupadasHoje = reservas
  .filter(r => r.arena === arenaName)
  .map(r => r.court);

// Marca quadras já reservadas como ocupadas
ocupadasHoje.forEach(courtId => {
  // SVG
  const svgEl = document.querySelector(`.court[data-id="${courtId}"]`);
  if (svgEl) {
    svgEl.dataset.status = 'occupied';
    const rect = svgEl.querySelector('rect');
    const lines = svgEl.querySelectorAll('line');
    const texts = svgEl.querySelectorAll('text');
    if (rect)  { rect.setAttribute('fill','#FF6B6B'); rect.setAttribute('stroke','#FF6B6B'); }
    lines.forEach(l => l.setAttribute('stroke','#FF6B6B'));
    texts.forEach((t,i) => {
      t.setAttribute('fill','#FF6B6B');
      if (i===1) t.textContent = 'Reservada';
    });
  }
  // Card
  const card = document.querySelector(`.court-card[data-id="${courtId}"]`);
  if (card && !card.classList.contains('disabled')) {
    card.classList.add('disabled');
    const chip = card.querySelector('.chip');
    if (chip) { chip.className='chip chip-red'; chip.textContent='Reservada'; }
  }
});

// ── Seleção e navegação ───────────────────────────────
function selectCourt(id, price) {
  // Feedback visual
  document.querySelectorAll('.court').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.court-card').forEach(c => c.classList.remove('active'));

  const svgEl = document.querySelector(`.court[data-id="${id}"]`);
  if (svgEl) svgEl.classList.add('selected');
  const card = document.querySelector(`.court-card[data-id="${id}"]`);
  if (card) card.classList.add('active');

  setTimeout(() => {
    const p = new URLSearchParams({ arena: arenaName, court: id, preco: price || '80' });
    window.location.href = `horarios.html?${p}`;
  }, 350);
}

// SVG courts
document.querySelectorAll('.court').forEach(court => {
  if (court.dataset.status !== 'available') return;
  court.addEventListener('click', () => selectCourt(court.dataset.id));
  court.addEventListener('keydown', e => {
    if (e.key==='Enter'||e.key===' ') { e.preventDefault(); selectCourt(court.dataset.id); }
  });
});

// Court cards
document.querySelectorAll('.court-card:not(.disabled)').forEach(card => {
  card.addEventListener('click', () => selectCourt(card.dataset.id, card.dataset.price));
  card.addEventListener('keydown', e => {
    if (e.key==='Enter'||e.key===' ') { e.preventDefault(); selectCourt(card.dataset.id, card.dataset.price); }
  });
});
