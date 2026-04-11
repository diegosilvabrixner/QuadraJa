// frontend/js/quadras.js — QuadraJá — carrega quadras de uma arena

// ── Parâmetros da URL ─────────────────────────────────────────
const params     = new URLSearchParams(location.search);
const arenaId    = params.get('arenaId') || localStorage.getItem('qj_selectedArenaId');
const arenaName  = params.get('arena') || localStorage.getItem('qj_selectedArenaName') || 'Arena';

if (params.get('arenaId')) {
  localStorage.setItem('qj_selectedArenaId', arenaId);
  localStorage.setItem('qj_selectedArenaName', arenaName);
} else if (arenaId && arenaName) {
  history.replaceState(null, '', `${location.pathname}?arenaId=${arenaId}&arena=${encodeURIComponent(arenaName)}`);
}

console.log('📍 Arena ID:', arenaId);
console.log('📍 Arena Name:', arenaName);

// Se não tiver arenaId, volta para locais.html
if (!arenaId) {
  console.error('❌ Falta arenaId na URL!');
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:20px;background:#0a0e20;color:#fff;font-family:Outfit,sans-serif">
      <div>
        <h2>Arena não encontrada</h2>
        <p>Falta de dados necessários para exibir as quadras.</p>
        <a href="./locais.html" style="color:#00d4ff;text-decoration:underline">← Voltar para Locais</a>
      </div>
    </div>`;
  return;
}

// ── Atualiza título ──────────────────────────────────────────
document.title = `${arenaName} — QuadraJá`;
document.getElementById('arenaTitle').textContent = arenaName;

// ── Estado ────────────────────────────────────────────────────
let quadrasData = [];

function normalizeStatus(status) {
  if (status === 'ATIVA') return 'available';
  if (status === 'MANUTENCAO') return 'maintenance';
  return 'occupied';
}

function getCourtIcon(tipo) {
  if (tipo === 'AREIA') return '🏖';
  if (tipo === 'PISO') return '🏟';
  return '🏠';
}

function getStatusInfo(status) {
  const normalized = normalizeStatus(status);
  if (normalized === 'available') return { label: 'Livre', chip: 'chip-green' };
  if (normalized === 'maintenance') return { label: 'Manutenção', chip: 'chip-yellow' };
  return { label: 'Ocupada', chip: 'chip-red' };
}

function getCourtDescription(court) {
  const tipo = court.tipo === 'AREIA' ? 'Areia' : court.tipo === 'PISO' ? 'Piso' : (court.tipo || 'Quadra');
  const cobertura = court.cobertura ? ` · ${court.cobertura}` : '';
  return `${tipo}${cobertura}`;
}

function buildCourtUrl(courtId, price) {
  const params = new URLSearchParams({
    arenaId,
    arena: arenaName,
    court: courtId,
    preco: price || 0,
  });
  return `horarios.html?${params}`;
}

function renderQuadras(quadras) {
  if (!quadras?.length) {
    document.getElementById('courtList').innerHTML = `<div class="empty-state"><span class="empty-icon">🚫</span><p>Nenhuma quadra disponível.</p></div>`;
    return;
  }

  renderSVG(quadras);
  renderCards(quadras);
  bindSVGEvents();
}

function renderCards(quadras) {
  const list = document.getElementById('courtList');

  list.innerHTML = quadras.map(court => {
    const status = normalizeStatus(court.status);
    const info = getStatusInfo(court.status);
    const disabled = status !== 'available';
    const price = Number(court.valorHora || 0).toFixed(2);
    const title = court.codigo || court.nome || court.id || 'Quadra';
    const desc = getCourtDescription(court);

    return `
      <div class="court-card ${disabled ? 'disabled' : ''}" data-id="${court.codigo || court.id || ''}" data-price="${price}" ${disabled ? '' : 'tabindex="0"'}>
        <div class="court-card-icon">${getCourtIcon(court.tipo)}</div>
        <div class="court-card-info">
          <div class="court-card-top">
            <strong>${title}</strong>
            <span class="chip ${info.chip}">${info.label}</span>
          </div>
          <p>${desc}</p>
        </div>
        <div class="court-card-price ${disabled ? 'muted' : ''}">
          R$${price}<small>/h</small>
        </div>
      </div>`;
  }).join('');
}

function renderSVG(quadras) {
  const svg = document.getElementById('floorPlan');
  if (!svg) return;

  const svgCells = svg.querySelector('#svgCells');
  if (!svgCells) return;

  const cols = quadras.length <= 3 ? quadras.length : Math.ceil(quadras.length / 2);
  const rows = Math.ceil(quadras.length / cols);
  const cW = 130;
  const cH = 80;
  const gap = 10;
  const pad = 10;
  const svgW = pad * 2 + cols * (cW + gap) - gap;
  const svgH = pad * 2 + rows * (cH + gap) - gap;

  const colors = { available: '#00E5A0', occupied: '#FF6B6B', maintenance: '#4A5E7A' };

  const cells = quadras.map((court, index) => {
    const status = normalizeStatus(court.status);
    const color = colors[status] || colors.occupied;
    const label = court.codigo || court.nome || court.id || 'Quadra';
    const x = pad + (index % cols) * (cW + gap);
    const y = pad + Math.floor(index / cols) * (cH + gap);
    const cx = x + cW / 2;
    const cy = y + cH / 2;
    const clickable = status === 'available';

    return `
      <g class="court" data-id="${court.codigo || court.id || ''}" data-status="${status}" data-price="${Number(court.valorHora || 0).toFixed(2)}"
         ${clickable ? 'tabindex="0"' : ''} style="cursor:${clickable ? 'pointer' : 'not-allowed'}">
        <rect x="${x}" y="${y}" width="${cW}" height="${cH}" rx="5"
              fill="${color}" fill-opacity="${status === 'maintenance' ? 0.1 : 0.12}"
              stroke="${color}" stroke-width="1.5"/>
        <line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + cH}"
              stroke="${color}" stroke-width="1.2" stroke-dasharray="4 3"/>
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="${color}"
              font-size="13" font-weight="800" font-family="Outfit,sans-serif">${label}</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="${color}"
              font-size="8" font-family="Outfit,sans-serif">${getCourtDescription(court)}</text>
      </g>`;
  }).join('');

  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svgCells.innerHTML = `<rect x="1" y="1" width="${svgW - 2}" height="${svgH - 2}" rx="8" fill="#0D1A2A" stroke="#1E2D42" stroke-width="1.5"/>` + cells;
}

function selectCourt(id, price) {
  document.querySelectorAll('.court').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.court-card').forEach(c => c.classList.remove('active'));

  document.querySelector(`.court[data-id="${id}"]`)?.classList.add('selected');
  document.querySelector(`.court-card[data-id="${id}"]`)?.classList.add('active');

  setTimeout(() => {
    const params = new URLSearchParams({
      arenaId,
      arena: arenaName,
      court: id,
      preco: price || 0,
    });
    window.location.href = `horarios.html?${params}`;
  }, 250);
}

function bindSVGEvents() {
  document.querySelectorAll('.court').forEach(court => {
    if (court.dataset.status === 'maintenance') return;
    court.addEventListener('click', () => selectCourt(court.dataset.id, court.dataset.price));
    court.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCourt(court.dataset.id, court.dataset.price);
      }
    });
  });

  document.querySelectorAll('.court-card:not(.disabled)').forEach(card => {
    card.addEventListener('click', () => selectCourt(card.dataset.id, card.dataset.price));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCourt(card.dataset.id, card.dataset.price);
      }
    });
  });
}

// ── Carregar quadras da API ──────────────────────────────────
async function carregarQuadras() {
  try {
    console.log('⏳ Carregando quadras para arena:', arenaId);
    const resp = await api.get(`/arenas/${arenaId}/quadras`);
    quadrasData = Array.isArray(resp) ? resp : (resp.quadras || resp.data || []);
    console.log('✅ Resposta da API:', resp);
    console.log('📊 Quadras carregadas:', quadrasData.length);

    if (!quadrasData.length) {
      document.getElementById('courtList').innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🚫</span>
          <h3>Nenhuma quadra disponível</h3>
          <p>Esta arena não tem quadras cadastradas no momento.</p>
          <a href="./locais.html" style="color:var(--accent);text-decoration:underline">← Voltar</a>
        </div>`;
      return;
    }

    renderQuadras(quadrasData);
  } catch (err) {
    console.error('❌ Erro ao carregar quadras:', err);
    document.getElementById('courtList').innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚠️</span>
        <h3>Erro ao carregar quadras</h3>
        <p>${err.message}</p>
        <button class="btn-primary" style="max-width:200px;margin-top:8px" onclick="carregarQuadras()">Tentar novamente</button>
        <a href="./locais.html" style="display:block;color:var(--accent);text-decoration:underline;margin-top:8px">← Voltar</a>
      </div>`;
  }
}

// ── Init ──────────────────────────────────────────────────────
if (arenaId) {
  document.addEventListener('DOMContentLoaded', carregarQuadras);
  window.carregarQuadras = carregarQuadras;
}

console.log('✅ quadras.js carregado');
