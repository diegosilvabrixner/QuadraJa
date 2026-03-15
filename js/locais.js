// locais.js — QuadraJá v2

// ── 1. Limpa seleção visual ao entrar/voltar para a tela ──
// pageshow cobre tanto navegação normal quanto o cache do botão voltar (bfcache)
window.addEventListener('pageshow', () => {
  document.querySelectorAll('.arena-card').forEach(c => {
    c.style.borderColor = '';
    c.style.background  = '';
  });
});

// ── Usuário ───────────────────────────────────────────
const nome  = localStorage.getItem('qj_user_name')  || 'visitante';
const email = localStorage.getItem('qj_user_email') || '';
document.getElementById('userName').textContent   = nome;
document.getElementById('userAvatar').textContent = nome[0].toUpperCase();

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
const mainList  = document.getElementById('mainList');
const pReservas  = document.getElementById('pageReservas');
const pFavoritos = document.getElementById('pageFavoritos');
const pPerfil    = document.getElementById('pagePerfil');

function showPage(name) {
  [mainList, pReservas, pFavoritos, pPerfil].forEach(p => p && (p.style.display = 'none'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${name}"]`).classList.add('active');

  switch (name) {
    case 'locais':    mainList.style.display = ''; break;
    case 'reservas':  pReservas.style.display  = ''; renderReservas();  break;
    case 'favoritos': pFavoritos.style.display = ''; renderFavoritos(); break;
    case 'perfil':    pPerfil.style.display    = ''; renderPerfil();    break;
  }
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

// ── 3. Renderizar reservas ────────────────────────────
function renderReservas() {
  const list    = document.getElementById('reservasList');
  const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');

  if (!reservas.length) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📅</span>
        <h3>Nenhuma reserva ainda</h3>
        <p>Escolha uma arena e faça sua primeira reserva!</p>
        <button class="btn-primary" style="max-width:240px;margin-top:8px" onclick="showPage('locais')">
          Explorar arenas
        </button>
      </div>`;
    return;
  }

  list.innerHTML = reservas.slice().reverse().map(r => `
    <div class="card" style="margin-bottom:12px;display:flex;gap:12px;align-items:flex-start">
      <div style="width:42px;height:42px;background:var(--accent-dim);border-radius:var(--r-md);
                  display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🏐</div>
      <div style="flex:1;min-width:0">
        <strong style="font-size:14px;display:block">${r.arena} · Quadra ${r.court}</strong>
        <p style="color:var(--text-muted);font-size:12px;margin-top:3px;
                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${r.data !== '—' ? r.data + ' · ' : ''}${r.horarios}
        </p>
        <div style="margin-top:6px"><span class="chip chip-green">✓ Confirmada</span></div>
      </div>
      <strong style="color:var(--accent);font-size:15px;white-space:nowrap;flex-shrink:0">
        R$${r.preco}
      </strong>
    </div>`).join('');
}

// ── 3. Renderizar favoritos ───────────────────────────
function renderFavoritos() {
  const list = document.getElementById('favoritosList');
  const favs = JSON.parse(localStorage.getItem('qj_favoritos') || '[]');

  if (!favs.length) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🏆</span>
        <h3>Nenhum favorito ainda</h3>
        <p>Quando você favoritar uma arena ela vai aparecer aqui.</p>
        <button class="btn-primary" style="max-width:240px;margin-top:8px" onclick="showPage('locais')">
          Explorar arenas
        </button>
      </div>`;
    return;
  }
  list.innerHTML = favs.map(f => `
    <div class="card" style="margin-bottom:12px"><strong>${f}</strong></div>`).join('');
}

// ── 3. Renderizar perfil ──────────────────────────────
function renderPerfil() {
  const n = localStorage.getItem('qj_user_name')  || '';
  const e = localStorage.getItem('qj_user_email') || '';
  const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');

  document.getElementById('perfilNome').textContent   = n || 'Visitante';
  document.getElementById('perfilEmail').textContent  = e || 'E-mail não informado';
  document.getElementById('perfilAvatar').textContent = (n || 'V')[0].toUpperCase();
  document.getElementById('perfilReservasCount').textContent = reservas.length;

  const semConta = !n && !e;
  document.getElementById('perfilSemConta').style.display = semConta ? '' : 'none';
  document.getElementById('perfilComConta').style.display = semConta ? 'none' : '';
}

// ── Logout ────────────────────────────────────────────
function logout() {
  localStorage.removeItem('qj_user_name');
  localStorage.removeItem('qj_user_email');
  window.location.href = 'login.html';
}
window.logout    = logout;
window.showPage  = showPage;
