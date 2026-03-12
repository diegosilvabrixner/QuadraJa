// screen-03-quadras.js — QuadraJá · Seleção de Quadra

let selectedCourt = null;

// ── Sincronizar planta SVG ↔ cards ─────────────────────
const svgCourts  = document.querySelectorAll('.court');
const courtCards = document.querySelectorAll('.court-card:not(.disabled)');

function selectCourt(id) {
  selectedCourt = id;

  // Reset SVG
  svgCourts.forEach(c => c.classList.remove('selected'));
  // Reset cards
  courtCards.forEach(c => c.classList.remove('active'));

  // Highlight SVG quadra
  const svgCourt = document.querySelector(`.court[data-id="${id}"]`);
  if (svgCourt && svgCourt.dataset.status === 'available') {
    svgCourt.classList.add('selected');
  }
  // Highlight card
  const card = document.querySelector(`.court-card[data-id="${id}"]:not(.disabled)`);
  if (card) card.classList.add('active');

  setTimeout(() => {
    window.location.href = `horarios.html?court=${id}`;
  }, 400);
}

// Clique nas quadras SVG
svgCourts.forEach(court => {
  if (court.dataset.status !== 'available') return;
  court.addEventListener('click', () => selectCourt(court.dataset.id));
  court.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCourt(court.dataset.id); }
  });
});

// Clique nos cards
courtCards.forEach(card => {
  card.addEventListener('click', () => selectCourt(card.dataset.id));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCourt(card.dataset.id); }
  });
});
