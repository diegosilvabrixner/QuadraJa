// locais.js — QuadraJá v2

// ── 1. Limpa seleção ao voltar (bfcache / botão nativo) ──
window.addEventListener('pageshow', () => {
  document.querySelectorAll('.arena-card').forEach(c => {
    c.style.borderColor = '';
    c.style.background  = '';
  });
  renderFavStars(); // atualiza estrelas ao voltar
});

// ── Usuário ───────────────────────────────────────────
const nome  = localStorage.getItem('qj_user_name')  || 'visitante';
const email = localStorage.getItem('qj_user_email') || '';
document.getElementById('userName').textContent   = nome;
document.getElementById('userAvatar').textContent = nome[0].toUpperCase();

// ── Favoritos helpers ─────────────────────────────────
function getFavs() { return JSON.parse(localStorage.getItem('qj_favoritos') || '[]'); }
function saveFavs(f) { localStorage.setItem('qj_favoritos', JSON.stringify(f)); }

function toggleFav(arenaName, btn) {
  let favs = getFavs();
  const idx = favs.indexOf(arenaName);
  if (idx === -1) {
    favs.push(arenaName);
    btn.textContent = '⭐';
    btn.title = 'Remover dos favoritos';
  } else {
    favs.splice(idx, 1);
    btn.textContent = '☆';
    btn.title = 'Adicionar aos favoritos';
  }
  saveFavs(favs);
}

function renderFavStars() {
  const favs = getFavs();
  document.querySelectorAll('.fav-btn').forEach(btn => {
    const name = btn.dataset.arena;
    btn.textContent = favs.includes(name) ? '⭐' : '☆';
    btn.title = favs.includes(name) ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  });
}

// Injeta botão de favorito em cada card
document.querySelectorAll('.arena-card').forEach(card => {
  const arenaName = card.dataset.arena;
  const favs      = getFavs();

  const btn = document.createElement('button');
  btn.className    = 'fav-btn';
  btn.dataset.arena = arenaName;
  btn.textContent  = favs.includes(arenaName) ? '⭐' : '☆';
  btn.title        = favs.includes(arenaName) ? 'Remover dos favoritos' : 'Adicionar aos favoritos';

  btn.addEventListener('click', e => {
    e.stopPropagation();
    toggleFav(arenaName, btn);
  });

  // Insere na .arena-row1, depois do chip de status
  const row1 = card.querySelector('.arena-row1');
  if (row1) row1.appendChild(btn);
});

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
    const ok   = name.includes(query) && (currentFilter === 'all' || type === currentFilter);
    card.classList.toggle('hidden', !ok);
    if (ok) visible++;
  });
  countLabel.textContent = `${visible} ${visible === 1 ? 'local encontrado' : 'locais encontrados'}`;
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
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
  });
});

// ── Bottom Nav ────────────────────────────────────────
const mainList   = document.getElementById('mainList');
const pReservas  = document.getElementById('pageReservas');
const pFavoritos = document.getElementById('pageFavoritos');
const pPerfil    = document.getElementById('pagePerfil');

function showPage(name) {
  [mainList, pReservas, pFavoritos, pPerfil].forEach(p => p && (p.style.display = 'none'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${name}"]`).classList.add('active');
  switch (name) {
    case 'locais':    mainList.style.display   = ''; break;
    case 'reservas':  pReservas.style.display  = ''; renderReservas(); checkPendingReviews(); break;
    case 'favoritos': pFavoritos.style.display = ''; renderFavoritos(); break;
    case 'perfil':    pPerfil.style.display    = ''; renderPerfil();    break;
  }
}
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

// ── CANCELAMENTO ─────────────────────────────────────
function cancelarReserva(idx) {
  const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
  const r        = reservas[idx];
  if (!r) return;

  // Calcula horas até o início da reserva
  const horasFaltando = horasAteReserva(r);
  const semEstorno    = horasFaltando !== null && horasFaltando < 4;

  const modal = document.getElementById('modalCancelamento');
  document.getElementById('cancelArena').textContent   = `${r.arena} · Quadra ${r.court}`;
  document.getElementById('cancelData').textContent    = r.data !== '—' ? r.data : 'Plano mensal';
  document.getElementById('cancelHorario').textContent = r.horarios;
  document.getElementById('cancelPreco').textContent   = `R$ ${r.preco}`;

  const avisoEstorno = document.getElementById('avisoSemEstorno');
  const btnConfirmar = document.getElementById('btnConfirmarCancelamento');

  const avisoComEstorno = document.getElementById('avisoComEstorno');
  if (semEstorno) {
    avisoEstorno.style.display    = '';
    avisoComEstorno.style.display = 'none';
    document.getElementById('cancelHorasFaltando').textContent =
      horasFaltando < 1
        ? 'menos de 1 hora'
        : `${Math.floor(horasFaltando)}h${Math.round((horasFaltando % 1) * 60) > 0 ? Math.round((horasFaltando % 1) * 60) + 'min' : ''}`;
    btnConfirmar.textContent = 'Cancelar mesmo assim (sem estorno)';
    btnConfirmar.style.background = 'var(--red)';
    btnConfirmar.style.color = '#fff';
  } else {
    avisoEstorno.style.display    = 'none';
    avisoComEstorno.style.display = '';
    btnConfirmar.textContent = 'Confirmar cancelamento (com estorno)';
    btnConfirmar.style.background = '';
    btnConfirmar.style.color = '';
  }

  modal.classList.add('open');
  modal._reservaIdx = idx;
  document.body.style.overflow = 'hidden';
}

function horasAteReserva(r) {
  // Mensal e avulso sem data retornam null
  if (!r.data || r.data === '—') return null;

  const parts = r.data.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;

  const primeiroSlot = (r.horariosList || []).sort()[0];
  if (!primeiroSlot) return null;

  const [h, min] = primeiroSlot.split(':').map(Number);
  const reservaDate = new Date(y, m - 1, d, h, min);
  return (reservaDate - Date.now()) / (1000 * 60 * 60);
}

function fecharModalCancelamento() {
  document.getElementById('modalCancelamento').classList.remove('open');
  document.body.style.overflow = '';
}

function confirmarCancelamento() {
  const modal = document.getElementById('modalCancelamento');
  const idx   = modal._reservaIdx;
  const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');

  // Marca como cancelada (não remove — mantém histórico e aparece no filtro)
  reservas[idx].status      = 'cancelada';
  reservas[idx].canceladaEm = new Date().toLocaleString('pt-BR');

  localStorage.setItem('qj_reservas', JSON.stringify(reservas));
  fecharModalCancelamento();

  // Muda o filtro ativo para "Canceladas" para o usuário ver o resultado
  const btn = document.querySelector('.res-filter[data-filter="cancelada"]');
  if (btn) {
    document.querySelectorAll('.res-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  renderReservas();
  showToast('Reserva cancelada. Acompanhe em Canceladas.', 'success');
}

// ── Renderizar reservas ────────────────────────────────
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

  // Status calculado em runtime
  function getStatus(r) {
    // Status explícito sempre tem precedência (cancelada, etc.)
    if (r.status === 'cancelada') return 'cancelada';

    const horas = horasAteReserva(r);

    // Mensal não tem data fixa — usa o status salvo, ou 'confirmada' como default
    if (horas === null) return r.status || 'confirmada';

    // Avulso/mensal com data: verifica se já passou
    if (horas < 0) return 'concluida';
    return 'confirmada';
  }

  const activeFilter = document.querySelector('.res-filter.active')?.dataset.filter || 'todas';

  const filtered = reservas
    .slice()
    .reverse()
    .map((r, i) => ({ r, realIdx: reservas.length - 1 - i, status: getStatus(r) }))
    .filter(({ status }) => activeFilter === 'todas' || status === activeFilter);

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state" style="padding-top:32px">
        <span class="empty-icon">🔍</span>
        <p>Nenhuma reserva com este status.</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(({ r, realIdx, status }) => {
    const chipMap = {
      confirmada: ['chip-green',  '✓ Confirmada'],
      concluida:  ['chip-yellow', '✓ Concluída'],
      cancelada:  ['chip-red',    '✗ Cancelada'],
    };
    const [chipClass, chipText] = chipMap[status] || ['chip-green', 'Confirmada'];

    // Exibe botão de cancelar só em confirmadas futuras
    const cancelBtn = status === 'confirmada'
      ? `<button class="btn-cancelar" onclick="cancelarReserva(${realIdx})">Cancelar reserva</button>`
      : '';

    // Botão avaliar se concluída e ainda não avaliada
    const avaliarBtn = (status === 'concluida' && !r.avaliado)
      ? `<button class="btn-avaliar" onclick="abrirAvaliacao(${realIdx})">⭐ Avaliar arena</button>`
      : '';

    const estrelas = r.avaliacao ? '⭐'.repeat(r.avaliacao.nota) : '';

    return `
    <div class="card reserva-card" style="margin-bottom:12px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div style="width:42px;height:42px;background:var(--accent-dim);border-radius:var(--r-md);
                    display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🏐</div>
        <div style="flex:1;min-width:0">
          <strong style="font-size:14px;display:block">${r.arena} · Quadra ${r.court}</strong>
          <p style="color:var(--text-muted);font-size:12px;margin-top:3px">
            ${r.tipo === 'mensal' ? 'Plano mensal · ' : (r.data !== '—' ? r.data + ' · ' : '')}${r.horarios}
          </p>
          <div style="margin-top:6px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <span class="chip ${chipClass}">${chipText}</span>
            <strong style="color:var(--accent);font-size:15px">R$${r.preco}</strong>
          </div>
          ${estrelas ? `<p style="font-size:13px;margin-top:6px">${estrelas} <span style="color:var(--text-muted);font-size:11px">${r.avaliacao.comentario || ''}</span></p>` : ''}
        </div>
      </div>
      ${cancelBtn}
      ${avaliarBtn}
    </div>`;
  }).join('');
}

// ── Renderizar favoritos ──────────────────────────────
function renderFavoritos() {
  const list = document.getElementById('favoritosList');
  const favs = getFavs();

  if (!favs.length) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⭐</span>
        <h3>Nenhum favorito ainda</h3>
        <p>Toque na estrela ☆ em qualquer arena para salvá-la aqui.</p>
        <button class="btn-primary" style="max-width:240px;margin-top:8px" onclick="showPage('locais')">
          Explorar arenas
        </button>
      </div>`;
    return;
  }

  // Busca dados do card para montar o card de favorito
  list.innerHTML = favs.map(name => {
    const card = document.querySelector(`.arena-card[data-arena="${name}"]`);
    if (!card) return `<div class="card" style="margin-bottom:12px"><strong>${name}</strong></div>`;
    const chip  = card.querySelector('.chip')?.outerHTML || '';
    const addr  = card.querySelector('.arena-addr')?.textContent || '';
    const price = card.querySelector('.arena-price')?.textContent || '';
    const icon  = card.querySelector('.arena-image')?.textContent || '🏟';
    return `
      <div class="arena-card" style="margin-bottom:12px;cursor:pointer"
           onclick="window.location.href='quadras.html?arena=${encodeURIComponent(name)}&courts=${card.dataset.courts}'">
        <div class="arena-image">${icon}</div>
        <div class="arena-info">
          <div class="arena-row1"><strong>${name}</strong>${chip}</div>
          <p class="arena-addr">${addr}</p>
          <div class="arena-row2"><span class="arena-price">${price}</span></div>
        </div>
      </div>`;
  }).join('');
}

// ── Renderizar perfil ─────────────────────────────────
function renderPerfil() {
  const n        = localStorage.getItem('qj_user_name')  || '';
  const e        = localStorage.getItem('qj_user_email') || '';
  const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
  const semConta = !n && !e;

  document.getElementById('perfilNome').textContent           = n || 'Visitante';
  document.getElementById('perfilEmail').textContent          = e || 'E-mail não informado';
  document.getElementById('perfilAvatar').textContent         = (n || 'V')[0].toUpperCase();
  document.getElementById('perfilReservasCount').textContent  = reservas.length;
  document.getElementById('perfilSemConta').style.display     = semConta ? '' : 'none';
  document.getElementById('perfilComConta').style.display     = semConta ? 'none' : '';
}

// ── Toast ─────────────────────────────────────────────
function showToast(msg, type = '') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className   = `toast ${type}`;
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 3000);
}


// ── Filtro de status de reservas ──────────────────────
function setResFilter(btn) {
  document.querySelectorAll('.res-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderReservas();
}
window.setResFilter = setResFilter;
// ── Logout ────────────────────────────────────────────
function logout() {
  localStorage.removeItem('qj_user_name');
  localStorage.removeItem('qj_user_email');
  window.location.href = 'login.html';
}

window.logout                  = logout;
window.showPage                = showPage;
window.cancelarReserva         = cancelarReserva;
window.fecharModalCancelamento = fecharModalCancelamento;
window.confirmarCancelamento   = confirmarCancelamento;

// ── Avaliação pós-jogo ────────────────────────────────
function abrirAvaliacao(idx) {
  const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
  const r = reservas[idx];
  if (!r) return;

  document.getElementById('avalArena').textContent   = r.arena;
  document.getElementById('avalQuadra').textContent  = `Quadra ${r.court}`;
  document.getElementById('avalData').textContent    = r.data !== '—' ? r.data : 'Plano mensal';
  document.getElementById('avalHorario').textContent = r.horarios;

  // Reset estrelas
  setAvalStars(0);
  document.getElementById('avalComentario').value = '';

  const modal = document.getElementById('modalAvaliacao');
  modal._reservaIdx = idx;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharAvaliacao() {
  document.getElementById('modalAvaliacao').classList.remove('open');
  document.body.style.overflow = '';
}

let notaSelecionada = 0;
function setAvalStars(n) {
  notaSelecionada = n;
  document.querySelectorAll('.aval-star').forEach((s, i) => {
    s.textContent = i < n ? '⭐' : '☆';
    s.classList.toggle('active', i < n);
  });
  document.getElementById('btnEnviarAvaliacao').disabled = n === 0;
}

function confirmarAvaliacao() {
  const modal    = document.getElementById('modalAvaliacao');
  const idx      = modal._reservaIdx;
  const comentario = document.getElementById('avalComentario').value.trim();

  const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
  reservas[idx].avaliado  = true;
  reservas[idx].avaliacao = { nota: notaSelecionada, comentario };
  localStorage.setItem('qj_reservas', JSON.stringify(reservas));

  fecharAvaliacao();
  renderReservas();
  showToast(`Avaliação enviada! Obrigado pelo feedback ⭐`, 'success');
}

// Expor funções de avaliação
window.abrirAvaliacao     = abrirAvaliacao;
window.fecharAvaliacao    = fecharAvaliacao;
window.setAvalStars       = setAvalStars;
window.confirmarAvaliacao = confirmarAvaliacao;

// ── Mostrar modal de avaliação pendente ao entrar na aba Reservas ──
function checkPendingReviews() {
  const reservas  = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
  // Encontra a mais recente concluída e não avaliada
  const pending = reservas
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => {
      const horas = horasAteReserva(r);
      return horas !== null && horas < 0 && !r.avaliado && r.status !== 'cancelada';
    });
  // Abre avaliação automaticamente se houver pendente
  if (pending.length > 0) {
    setTimeout(() => abrirAvaliacao(pending[0].i), 400);
  }
}
