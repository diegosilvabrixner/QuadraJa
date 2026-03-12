// screen-02-locais.js — QuadraJá · Seleção de Local

const searchInput = document.getElementById('searchInput');
const arenaCards  = document.querySelectorAll('.arena-card');
const filterChips = document.querySelectorAll('.fchip');
const countLabel  = document.querySelector('.section-label');

let currentFilter = 'all';

// ── Busca ─────────────────────────────────────────────
searchInput.addEventListener('input', () => applyFilters());

// ── Filtros por tipo ───────────────────────────────────
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    applyFilters();
  });
});

function applyFilters() {
  const query = searchInput.value.toLowerCase();
  let visible = 0;

  arenaCards.forEach(card => {
    const name = card.querySelector('strong').textContent.toLowerCase();
    const type = card.dataset.type;

    const matchesSearch = name.includes(query);
    const matchesFilter = currentFilter === 'all' || type === currentFilter;

    if (matchesSearch && matchesFilter) {
      card.classList.remove('hidden');
      visible++;
    } else {
      card.classList.add('hidden');
    }
  });

  countLabel.textContent = `${visible} ${visible === 1 ? 'local encontrado' : 'locais encontrados'}`;
}

// ── Navegar para quadras ao clicar ────────────────────
arenaCards.forEach(card => {
  card.addEventListener('click', () => {
    const name = card.querySelector('strong').textContent;
    // Em produção: window.location.href = `screen-03-quadras.html?arena=${encodeURIComponent(name)}`;
    card.style.borderColor = 'var(--accent)';
    card.style.background  = 'var(--accent-dim)';
    setTimeout(() => {
      card.style.borderColor = '';
      card.style.background  = '';
    }, 600);
    console.log('Arena selecionada:', name);
  });

  // Acessibilidade — Enter e Space
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

// ── Bottom nav ─────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});
