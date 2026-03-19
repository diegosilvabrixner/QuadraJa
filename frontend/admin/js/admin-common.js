// admin/js/admin-common.js — QuadraJá Admin
// Carrega após api.js — contém helpers comuns a todas as páginas admin

// ── Guard: só admin acessa ────────────────────────────────────
(function() {
  const user = getUser();
  if (!user || !['ADMIN_ARENA','SUPER_ADMIN'].includes(user.perfil)) {
    window.location.href = '../../html/login.html';
  }
  // Preenche sidebar com nome do usuário
  document.addEventListener('DOMContentLoaded', () => {
    const nome = localStorage.getItem('qj_user_nome') || user.nome || '';
    const el   = document.getElementById('sidebarUserName');
    const av   = document.getElementById('sidebarAvatar');
    if (el) el.textContent  = nome.split(' ')[0];
    if (av) av.textContent  = nome[0]?.toUpperCase() || 'A';
    marcaNavAtivo();
    carregarArenaAtual();
  });
})();

// ── Arena atual ────────────────────────────────────────────────
let arenaAtual = null;

async function carregarArenaAtual() {
  const arenaId = localStorage.getItem('qj_arena_id');
  if (!arenaId) {
    // Busca a primeira arena do admin
    try {
      const arenas = await api.get('/arenas');
      if (arenas?.length) {
        arenaAtual = arenas[0];
        localStorage.setItem('qj_arena_id',   arenaAtual.id);
        localStorage.setItem('qj_arena_nome', arenaAtual.nome);
      }
    } catch {}
  } else {
    arenaAtual = { id: arenaId, nome: localStorage.getItem('qj_arena_nome') || '' };
  }

  const el = document.getElementById('topbarArena');
  if (el && arenaAtual) el.textContent = '🏟 ' + arenaAtual.nome;
  window.dispatchEvent(new CustomEvent('arenaLoaded', { detail: arenaAtual }));
}

function getArenaId() {
  return localStorage.getItem('qj_arena_id') || '';
}

// ── Marca nav item ativo ───────────────────────────────────────
function marcaNavAtivo() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

// ── Toast admin ────────────────────────────────────────────────
function toast(msg, type='') {
  let el = document.getElementById('adminToast');
  if (!el) {
    el = document.createElement('div');
    el.id        = 'adminToast';
    el.className = 'admin-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className   = `admin-toast ${type}`;
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => el.classList.remove('show'), 3500);
}

// ── Modal helpers ──────────────────────────────────────────────
function abrirModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function fecharModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Formatadores ───────────────────────────────────────────────
function formatBRL(val) {
  return (val||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}
function formatStatus(s) {
  const map = {
    ATIVA:'Ativa', MANUTENCAO:'Manutenção', INATIVA:'Inativa',
    CONFIRMADA:'Confirmada', CANCELADA:'Cancelada',
    CONCLUIDA:'Concluída', AGUARDANDO_PAGAMENTO:'Aguardando pagamento',
    APROVADO:'Aprovado', PENDENTE:'Pendente', RECUSADO:'Recusado',
    ATIVO:'Ativo', FERIAS:'Férias', AFASTADO:'Afastado', DESLIGADO:'Desligado',
  };
  return map[s] || s;
}
function badgeStatus(s) {
  const map = {
    ATIVA:'green', CONFIRMADA:'green', APROVADO:'green', ATIVO:'green',
    MANUTENCAO:'yellow', AGUARDANDO_PAGAMENTO:'yellow', FERIAS:'yellow', PENDENTE:'yellow',
    INATIVA:'gray', CANCELADA:'red', RECUSADO:'red', DESLIGADO:'red', AFASTADO:'red',
    CONCLUIDA:'blue',
  };
  return `<span class="badge badge-${map[s]||'gray'}">${formatStatus(s)}</span>`;
}

// ── Logout ─────────────────────────────────────────────────────
function adminLogout() {
  clearToken();
  localStorage.removeItem('qj_arena_id');
  localStorage.removeItem('qj_arena_nome');
  window.location.href = '../../html/login.html';
}

// Expõe
window.toast         = toast;
window.abrirModal    = abrirModal;
window.fecharModal   = fecharModal;
window.formatBRL     = formatBRL;
window.formatDate    = formatDate;
window.formatDateTime = formatDateTime;
window.badgeStatus   = badgeStatus;
window.adminLogout   = adminLogout;
window.getArenaId    = getArenaId;
