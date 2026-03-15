// locais.js — QuadraJá v2

// ── Usuário ───────────────────────────────────────────
const nome  = localStorage.getItem('qj_user_name')  || 'visitante';
const email = localStorage.getItem('qj_user_email') || '';
document.getElementById('userName').textContent    = nome;
document.getElementById('userAvatar').textContent  = nome[0].toUpperCase();
const perfilNome   = document.getElementById('perfilNome');
const perfilEmail  = document.getElementById('perfilEmail');
const perfilAvatar = document.getElementById('perfilAvatar');
if (perfilNome)   perfilNome.textContent   = localStorage.getItem('qj_user_name') || 'Visitante';
if (perfilEmail)  perfilEmail.textContent  = email;
if (perfilAvatar) perfilAvatar.textContent = nome[0].toUpperCase();

// ── Busca e filtros ───────────────────────────────────
const searchInput = document.getElementById('searchInput');
const arenaCards  = document.querySelectorAll('.arena-card');
const filterChips = document.querySelectorAll('.fchip');
const countLabel  = document.getElementById('countLabel');
let currentFilter = 'all';

searchInput.addEventListener('input', applyFilters);
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
    const ok = name.includes(query) && (currentFilter === 'all' || type === currentFilter);
    card.classList.toggle('hidden', !ok);
    if (ok) visible++;
  });
  countLabel.textContent = `${visible} ${visible===1?'local encontrado':'locais encontrados'}`;
}

// ── Navegar para quadras ──────────────────────────────
arenaCards.forEach(card => {
  card.addEventListener('click', () => {
    const name   = card.querySelector('strong').textContent;
    const courts = card.dataset.courts || '4';
    card.style.borderColor = 'var(--accent)';
    card.style.background  = 'var(--accent-dim)';
    setTimeout(() => {
      window.location.href = `quadras.html?arena=${encodeURIComponent(name)}&courts=${courts}`;
    }, 300);
  });
  card.addEventListener('keydown', e => {
    if (e.key==='Enter'||e.key===' ') { e.preventDefault(); card.click(); }
  });
});

// ── Bottom Nav ────────────────────────────────────────
const mainContent  = document.querySelector('.screen');
const pReservas    = document.getElementById('pageReservas');
const pFavoritos   = document.getElementById('pageFavoritos');
const pPerfil      = document.getElementById('pagePerfil');
const allPages     = [mainContent, pReservas, pFavoritos, pPerfil];

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Esconde tudo
    allPages.forEach(p => p.style.display = 'none');

    switch(btn.dataset.page) {
      case 'locais':
        mainContent.style.display = '';
        break;
      case 'reservas':
        pReservas.style.display = '';
        renderReservas();
        break;
      case 'favoritos':
        pFavoritos.style.display = '';
        renderFavoritos();
        break;
      case 'perfil':
        pPerfil.style.display = '';
        break;
    }
  });
});

// ── Renderizar reservas do localStorage ───────────────
function renderReservas() {
  const list = document.getElementById('reservasList');
  const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
  if (!reservas.length) {
    list.innerHTML = `<div class="empty-state"><span class="icon">📅</span><p>Você ainda não tem reservas.<br>Escolha uma arena para começar!</p></div>`;
    return;
  }
  list.innerHTML = reservas.map(r => `
    <div class="card" style="margin-bottom:12px;display:flex;gap:12px;align-items:flex-start">
      <div style="width:42px;height:42px;background:var(--accent-dim);border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🏐</div>
      <div style="flex:1">
        <strong style="font-size:14px">${r.arena} · Quadra ${r.court}</strong>
        <p style="color:var(--text-muted);font-size:12px;margin-top:3px">${r.data} · ${r.horarios}</p>
        <div style="margin-top:6px"><span class="chip chip-green">✓ Confirmada</span></div>
      </div>
      <strong style="color:var(--accent);font-size:15px;white-space:nowrap">R$${r.preco}</strong>
    </div>
  `).join('');
}

// ── Renderizar favoritos ──────────────────────────────
function renderFavoritos() {
  const list = document.getElementById('favoritosList');
  const favs = JSON.parse(localStorage.getItem('qj_favoritos') || '[]');
  if (!favs.length) {
    list.innerHTML = `<div class="empty-state"><span class="icon">🏆</span><p>Nenhuma arena favoritada ainda.</p></div>`;
    return;
  }
  list.innerHTML = favs.map(f => `
    <div class="card" style="margin-bottom:12px">
      <strong>${f}</strong>
    </div>
  `).join('');
}

// ── Logout ────────────────────────────────────────────
function logout() {
  localStorage.removeItem('qj_user_name');
  localStorage.removeItem('qj_user_email');
  window.location.href = 'login.html';
}
window.logout = logout;
