// locais.js — QuadraJá — carrega arenas e reservas da API

// Protege rota — redireciona se não logado
// requireAuth('login.html');
console.log("script carregou");
alert("locais.js carregou");
// ── Dados do usuário do localStorage (salvo no login) ─────────
const nome  = localStorage.getItem('qj_user_nome')  || 'visitante';
const email = localStorage.getItem('qj_user_email') || '';
document.getElementById('userName').textContent   = nome.split(' ')[0];
document.getElementById('userAvatar').textContent = nome[0]?.toUpperCase() || '?';

// ── Limpa seleção visual ao voltar (bfcache) ──────────────────
window.addEventListener('pageshow', () => {
  document.querySelectorAll('.arena-card').forEach(c => {
    c.style.borderColor = '';
    c.style.background  = '';
  });
});

// ── Estado ────────────────────────────────────────────────────
let currentFilter = 'all';
let arenasData    = [];

// ── Carregar arenas da API ────────────────────────────────────
async function carregarArenas() {
  try {
    console.log('⏳ Carregando arenas...');
    const resp = await api.get('/arenas');
    console.log('✅ Resposta da API:', resp);

    // Trata tanto array direto quanto objeto com array dentro
    arenasData = Array.isArray(resp) ? resp : (resp.data || resp.arenas || []);

    console.log(`📊 ${arenasData.length} arenas carregadas`);

    // Valida se cada arena tem um ID
    arenasData.forEach((a, i) => {
      if (!a.id) {
        console.warn(`⚠️ Arena ${i} sem ID:`, a);
      } else {
        console.log(`✓ Arena ${i}: ID=${a.id}, Nome=${a.nome}`);
      }
    });

    renderArenas(arenasData);
  } catch (err) {
    document.getElementById('arenaList').innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚠️</span>
        <h3>Erro ao carregar arenas</h3>
        <p>${err.message}</p>
        <button class="btn-primary" style="max-width:200px;margin-top:8px" onclick="carregarArenas()">Tentar novamente</button>
      </div>`;
    document.getElementById('countLabel').textContent = '';
  }
}

function renderArenas(arenas) {
  const list  = document.getElementById('arenaList');
  const query = document.getElementById('searchInput').value.toLowerCase();
  const favs  = getFavs();

  const filtradas = arenas.filter(a => {
    const matchNome   = a.nome.toLowerCase().includes(query);
    const tipoQuadra  = a.quadras?.[0]?.tipo || '';
    const matchFilter = currentFilter === 'all' || tipoQuadra === currentFilter;
    return matchNome && matchFilter;
  });

  document.getElementById('countLabel').textContent =
    `${filtradas.length} ${filtradas.length === 1 ? 'local encontrado' : 'locais encontrados'}`;

  if (!filtradas.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><p>Nenhuma arena encontrada.</p></div>`;
    return;
  }

  // Status visual: usa campo `ativa` e pode ser enriquecido depois pelo admin
  list.innerHTML = filtradas.map(a => {
    // ⚠️ Validação crítica: garante que temos ID
    if (!a.id) {
      console.warn('❌ Arena sem ID:', a);
      return '';
    }

    const totalQuadras  = a._count?.quadras || a.quadras?.length || 0;
    const quadrasAtivas = a.quadras?.filter(q => q.status === 'ATIVA').length || 0;
    const isFav         = favs.includes(a.id);

    let statusChip = '<span class="chip chip-green">Aberta</span>';
    if (!a.ativa)            statusChip = '<span class="chip chip-red">Fechada</span>';
    else if (quadrasAtivas === 0) statusChip = '<span class="chip chip-yellow">Lotada</span>';

    const tipoIcon = a.quadras?.[0]?.tipo === 'AREIA' ? '🏖' : '🏟';
    const preco    = a.quadras?.[0]?.valorHora || '—';

    // Usa <a> direto — sem JS para navegação, impossível falhar
    const url = `./quadras.html?arenaId=${a.id}&arena=${encodeURIComponent(a.nome)}`;
    
    console.log(`🔗 URL gerada para ${a.nome}:`, url);
    
    return `
      <a class="arena-card" href="${url}" style="text-decoration:none;display:flex">
        <div class="arena-image">${tipoIcon}</div>
        <div class="arena-info">
          <div class="arena-row1">
            <strong>${a.nome}</strong>
            ${statusChip}
            <button class="fav-btn" data-id="${a.id}"
              onclick="event.preventDefault();event.stopPropagation();toggleFavById('${a.id}',this)"
              title="${isFav?'Remover dos favoritos':'Adicionar aos favoritos'}">${isFav?'⭐':'☆'}</button>
          </div>
          <p class="arena-addr">📍 ${a.endereco}${a.cidade ? ' · ' + a.cidade : ''}</p>
          <div class="arena-row2">
            <span class="arena-price">R$${preco}<span>/h</span></span>
            <span class="arena-courts">🏐 ${totalQuadras} quadra${totalQuadras !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </a>`;
  }).join('');
}


// ── Toggle favorito por ID (chamado inline nos cards) ────────
function toggleFavById(arenaId, btn) {
  const favs = getFavs();
  const idx  = favs.indexOf(arenaId);
  if (idx === -1) { favs.push(arenaId); btn.textContent = '⭐'; }
  else            { favs.splice(idx,1);  btn.textContent = '☆'; }
  saveFavs(favs);
}
window.toggleFavById = toggleFavById;
// ── Busca e filtros ───────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', () => renderArenas(arenasData));
document.querySelectorAll('.fchip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.fchip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    renderArenas(arenasData);
  });
});

// ── Favoritos ─────────────────────────────────────────────────
function getFavs()  { return JSON.parse(localStorage.getItem('qj_favoritos') || '[]'); }
function saveFavs(f){ localStorage.setItem('qj_favoritos', JSON.stringify(f.filter(Boolean))); }

// ── Bottom Nav ────────────────────────────────────────────────
const mainList   = document.getElementById('mainList');
const pReservas  = document.getElementById('pageReservas');
const pFavoritos = document.getElementById('pageFavoritos');
const pPerfil    = document.getElementById('pagePerfil');

function showPage(name) {
  [mainList, pReservas, pFavoritos, pPerfil].forEach(p => p && (p.style.display = 'none'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${name}"]`)?.classList.add('active');
  switch (name) {
    case 'locais':    mainList.style.display   = ''; break;
    case 'reservas':  pReservas.style.display  = ''; renderReservas(); checkPendingReviews(); break;
    case 'favoritos': pFavoritos.style.display = ''; renderFavoritos(); break;
    case 'perfil':    pPerfil.style.display    = ''; renderPerfil(); break;
  }
}
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

// ── Reservas — carrega da API ─────────────────────────────────
async function renderReservas() {
  const list = document.getElementById('reservasList');
  list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted)">Carregando...</div>';

  const activeFilter = document.querySelector('.res-filter.active')?.dataset.filter || 'todas';

  try {
    const query = activeFilter !== 'todas' ? `?status=${activeFilter.toUpperCase()}` : '';
    const { reservas } = await api.get(`/reservas${query}`);

    if (!reservas?.length) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📅</span>
          <h3>Nenhuma reserva ainda</h3>
          <p>Escolha uma arena e faça sua primeira reserva!</p>
          <button class="btn-primary" style="max-width:240px;margin-top:8px" onclick="showPage('locais')">Explorar arenas</button>
        </div>`;
      return;
    }

    list.innerHTML = reservas.map(r => {
      const status     = r.status?.toLowerCase() || 'confirmada';
      const chipMap    = { confirmada:['chip-green','✓ Confirmada'], concluida:['chip-yellow','✓ Concluída'], cancelada:['chip-red','✗ Cancelada'] };
      const [chipCls, chipTxt] = chipMap[status] || ['chip-green','Confirmada'];
      const dataFmt = r.data ? new Date(r.data).toLocaleDateString('pt-BR') : (r.tipo==='MENSAL'?'Plano mensal':'—');
      const horaFmt = r.horaInicio ? `${r.horaInicio}–${addHour(r.horaInicio)}` : '—';

      return `
        <div class="card reserva-card" style="margin-bottom:12px" data-id="${r.id}">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:42px;height:42px;background:var(--accent-dim);border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🏐</div>
            <div style="flex:1;min-width:0">
              <strong style="font-size:14px;display:block">${r.quadra?.arena?.nome || '—'} · Quadra ${r.quadra?.codigo || '—'}</strong>
              <p style="color:var(--text-muted);font-size:12px;margin-top:3px">${dataFmt} · ${horaFmt}</p>
              <div style="margin-top:6px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                <span class="chip ${chipCls}">${chipTxt}</span>
                <strong style="color:var(--accent);font-size:15px">R$${r.valorTotal?.toFixed(2)||'—'}</strong>
              </div>
              ${r.avaliacao ? `<p style="font-size:12px;margin-top:6px">${'⭐'.repeat(r.avaliacao.nota)}</p>` : ''}
            </div>
          </div>
          ${status==='confirmada' ? `<button class="btn-cancelar" onclick="cancelarReserva('${r.id}')">Cancelar reserva</button>` : ''}
          ${status==='concluida'&&!r.avaliacao ? `<button class="btn-avaliar" onclick="abrirAvaliacao('${r.id}','${r.quadra?.arena?.nome||''}','${r.quadra?.codigo||''}','${dataFmt}')">⭐ Avaliar arena</button>` : ''}
        </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>Erro: ${err.message}</p></div>`;
  }
}

function addHour(t) {
  const [h,m] = t.split(':').map(Number);
  return `${String(h+1).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ── Cancelamento ──────────────────────────────────────────────
let cancelandoId = null;

function cancelarReserva(id) {
  cancelandoId = id;
  document.getElementById('modalCancelamento').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharModalCancelamento() {
  cancelandoId = null;
  document.getElementById('modalCancelamento').classList.remove('open');
  document.body.style.overflow = '';
}

async function confirmarCancelamento() {
  if (!cancelandoId) return;
  try {
    const r = await api.patch(`/reservas/${cancelandoId}/cancelar`, { motivo: 'Cancelado pelo cliente' });
    fecharModalCancelamento();
    showToast(r.comEstorno ? 'Reserva cancelada — estorno em 5 dias úteis.' : 'Reserva cancelada sem estorno.', 'success');
    renderReservas();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Favoritos ─────────────────────────────────────────────────
function renderFavoritos() {
  const list = document.getElementById('favoritosList');
  const favIds = getFavs();
  if (!favIds.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">⭐</span><h3>Nenhum favorito</h3><p>Toque em ☆ em qualquer arena.</p></div>`;
    return;
  }
  const favArenas = arenasData.filter(a => favIds.includes(a.id));
  if (!favArenas.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">⭐</span><h3>Nenhum favorito</h3></div>`;
    return;
  }
  list.innerHTML = favArenas.map(a => `
    <a class="arena-card" style="margin-bottom:12px;cursor:pointer;text-decoration:none"
       href="./quadras.html?arenaId=${a.id}&arena=${encodeURIComponent(a.nome)}">
      <div class="arena-image">${a.quadras?.[0]?.tipo==='AREIA'?'🏖':'🏟'}</div>
      <div class="arena-info">
        <div class="arena-row1"><strong>${a.nome}</strong><span class="chip chip-green">Aberta</span></div>
        <p class="arena-addr">📍 ${a.endereco}</p>
      </div>
    </a>`).join('');
}

// ── Perfil ────────────────────────────────────────────────────
async function renderPerfil() {
  const semConta = !getToken();
  document.getElementById('perfilSemConta').style.display  = semConta ? '' : 'none';
  document.getElementById('perfilComConta').style.display  = semConta ? 'none' : '';

  if (semConta) return;

  document.getElementById('perfilNome').textContent  = localStorage.getItem('qj_user_nome') || '—';
  document.getElementById('perfilEmail').textContent = localStorage.getItem('qj_user_email') || '—';
  document.getElementById('perfilAvatar').textContent = (localStorage.getItem('qj_user_nome')||'?')[0].toUpperCase();
  document.getElementById('perfilFavCount').textContent = getFavs().filter(Boolean).length;

  try {
    const { total } = await api.get('/reservas?limit=1');
    document.getElementById('perfilReservasCount').textContent = total || 0;
  } catch { document.getElementById('perfilReservasCount').textContent = '—'; }
}


// ── Avaliação pós-jogo ────────────────────────────────────────
let avaliacaoReservaId = null;
let notaSelecionada    = 0;

function abrirAvaliacao(reservaId, arena, quadra, data) {
  avaliacaoReservaId = reservaId;
  document.getElementById('avalArena').textContent  = arena;
  document.getElementById('avalQuadra').textContent = 'Quadra ' + quadra;
  document.getElementById('avalData').textContent   = data;
  setAvalStars(0);
  document.getElementById('avalComentario').value = '';
  document.getElementById('modalAvaliacao').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharAvaliacao() {
  document.getElementById('modalAvaliacao').classList.remove('open');
  document.body.style.overflow = '';
}

function setAvalStars(n) {
  notaSelecionada = n;
  document.querySelectorAll('.aval-star').forEach((s,i) => {
    s.textContent = i < n ? '⭐' : '☆';
    s.classList.toggle('active', i < n);
  });
  document.getElementById('btnEnviarAvaliacao').disabled = n === 0;
}

async function confirmarAvaliacao() {
  if (!avaliacaoReservaId || !notaSelecionada) return;
  try {
    await api.post(`/reservas/${avaliacaoReservaId}/avaliacao`, {
      nota:       notaSelecionada,
      comentario: document.getElementById('avalComentario').value.trim(),
    });
    fecharAvaliacao();
    showToast('Avaliação enviada! Obrigado ⭐', 'success');
    renderReservas();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function checkPendingReviews() {
  // Verificado via API — sem dependência de localStorage
}

// ── Filtro de reservas ────────────────────────────────────────
function setResFilter(btn) {
  document.querySelectorAll('.res-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderReservas();
}

// ── Logout ────────────────────────────────────────────────────
function logout() {
  clearToken();
  window.location.href = 'login.html';
}

// ── Expõe globais ─────────────────────────────────────────────
window.showPage                = showPage;
window.setResFilter            = setResFilter;
window.cancelarReserva         = cancelarReserva;
window.fecharModalCancelamento = fecharModalCancelamento;
window.confirmarCancelamento   = confirmarCancelamento;
window.abrirAvaliacao          = abrirAvaliacao;
window.fecharAvaliacao         = fecharAvaliacao;
window.setAvalStars            = setAvalStars;
window.confirmarAvaliacao      = confirmarAvaliacao;
window.logout                  = logout;

// ── Init ──────────────────────────────────────────────────────
carregarArenas();
