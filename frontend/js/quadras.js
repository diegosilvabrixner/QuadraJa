// quadras.js — QuadraJá — carrega quadras da API

//requireAuth('login.html');

const params    = new URLSearchParams(location.search);
//const arenaId   = params.get('arenaId') || '';
const arenaId   = '563c0c97-f5f7-4c88-94e8-44092702f6d0'; // temporário para desenvolvimento
const arenaName = params.get('arena')   || 'Arena';
console.log('arenaId:', arenaId);
console.log('arenaName:', arenaName);

document.getElementById('arenaTitle').textContent = arenaName;
//if (!arenaId) { window.location.href = 'locais.html'; }

// ── Carregar quadras da API ───────────────────────────────────
async function carregarQuadras() {
  try {
    const quadras = await api.get(`/arenas/${arenaId}/quadras`);

    // Reservas salvas para marcar slots (ainda via localStorage por ora)
    const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
    const slotsPorQuadra = {};
    reservas
      .filter(r => r.arena === arenaName && r.status !== 'cancelada')
      .forEach(r => {
        if (!slotsPorQuadra[r.court]) slotsPorQuadra[r.court] = [];
        (r.horariosList||[]).forEach(h => {
          if (!slotsPorQuadra[r.court].includes(h)) slotsPorQuadra[r.court].push(h);
        });
      });

    renderSVG(quadras);
    renderCards(quadras, slotsPorQuadra);
    bindSVGEvents(quadras);

  } catch (err) {
    document.getElementById('courtList').innerHTML =
      `<div class="empty-state"><span class="empty-icon">⚠️</span><h3>Erro ao carregar quadras</h3><p>${err.message}</p></div>`;
  }
}

// ── SVG dinâmico ─────────────────────────────────────────────
function renderSVG(quadras) {
  const cols = quadras.length <= 3 ? quadras.length : Math.ceil(quadras.length / 2);
  const rows = Math.ceil(quadras.length / cols);
  const cW=130, cH=82, gap=10, pad=10;
  const svgW = pad*2 + cols*(cW+gap) - gap;
  const svgH = pad*2 + rows*(cH+gap) - gap;

  const cores   = { ATIVA:'#00E5A0', MANUTENCAO:'#4A5E7A', INATIVA:'#FF6B6B' };
  const labels  = { ATIVA:'Livre',   MANUTENCAO:'Manutenção', INATIVA:'Inativa' };

  const cells = quadras.map((q, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = pad + col*(cW+gap), y = pad + row*(cH+gap);
    const cx = x + cW/2, cy = y + cH/2;
    const cor = cores[q.status] || '#4A5E7A';
    const label = labels[q.status] || q.status;
    const clickable = q.status === 'ATIVA';
    return `
      <g class="court" data-id="${q.id}" data-codigo="${q.codigo}" data-status="${q.status}" data-preco="${q.valorHora}"
         ${clickable?'tabindex="0"':''} style="cursor:${clickable?'pointer':'not-allowed'}">
        <rect x="${x}" y="${y}" width="${cW}" height="${cH}" rx="5"
              fill="${cor}" fill-opacity="${q.status==='MANUTENCAO'?0.08:0.12}" stroke="${cor}" stroke-width="1.5"/>
        <line x1="${cx}" y1="${y}" x2="${cx}" y2="${y+cH}" stroke="${cor}" stroke-width="1.2" stroke-dasharray="4 3"/>
        <text x="${cx}" y="${cy-4}" text-anchor="middle" fill="${cor}" font-size="13" font-weight="800" font-family="Outfit,sans-serif">${q.codigo}</text>
        <text x="${cx}" y="${cy+12}" text-anchor="middle" fill="${cor}" font-size="8" font-family="Outfit,sans-serif">${q.tipo} · ${label}</text>
      </g>`;
  }).join('');

  const svg = document.getElementById('floorPlan');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  document.getElementById('svgCells').innerHTML =
    `<rect x="1" y="1" width="${svgW-2}" height="${svgH-2}" rx="8" fill="#0D1A2A" stroke="#1E2D42" stroke-width="1.5"/>` + cells;
}

// ── Cards ────────────────────────────────────────────────────
function renderCards(quadras, slotsPorQuadra) {
  const list = document.getElementById('courtList');
  list.innerHTML = quadras.map(q => {
    const reservados = slotsPorQuadra[q.codigo] || [];
    const disabled   = q.status !== 'ATIVA' || reservados.length >= 14;

    let chipCls='chip-green', chipTxt='Livre';
    if (q.status==='MANUTENCAO')  { chipCls='chip-yellow'; chipTxt='Manutenção'; }
    else if (q.status==='INATIVA'){ chipCls='chip-red';    chipTxt='Inativa'; }
    else if (disabled)            { chipCls='chip-red';    chipTxt='Sem horários'; }
    else if (reservados.length)   { chipCls='chip-blue';   chipTxt=`${reservados.length}h reservada${reservados.length>1?'s':''}`; }

    const icon = q.tipo==='AREIA' ? '🏖' : '🏟';
    const desc = q.status==='MANUTENCAO' ? `${q.tipo} · Indisponível`
               : `${q.tipo} · até 12 jogadores`;

    return `
      <div class="court-card ${disabled?'disabled':''}" data-id="${q.id}" data-codigo="${q.codigo}" data-preco="${q.valorHora}" ${disabled?'':'tabindex="0"'}>
        <div class="court-card-icon">${icon}</div>
        <div class="court-card-info">
          <div class="court-card-top"><strong>${q.nome}</strong><span class="chip ${chipCls}">${chipTxt}</span></div>
          <p>${desc}</p>
        </div>
        <div class="court-card-price ${disabled?'muted':''}">R$${q.valorHora}<small>/h</small></div>
      </div>`;
  }).join('');

  document.querySelectorAll('.court-card:not(.disabled)').forEach(card => {
    card.addEventListener('click', () => selectCourt(card.dataset.id, card.dataset.codigo, card.dataset.preco));
    card.addEventListener('keydown', e => {
      if (e.key==='Enter'||e.key===' ') { e.preventDefault(); selectCourt(card.dataset.id, card.dataset.codigo, card.dataset.preco); }
    });
  });
}

function selectCourt(id, codigo, preco) {
  document.querySelectorAll('.court').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.court-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.court[data-id="${id}"]`)?.classList.add('selected');
  document.querySelector(`.court-card[data-id="${id}"]`)?.classList.add('active');

  setTimeout(() => {
    const p = new URLSearchParams({ arenaId, arena: arenaName, quadraId: id, quadra: codigo, preco });
    window.location.href = `horarios.html?${p}`;
  }, 350);
}

function bindSVGEvents(quadras) {
  document.querySelectorAll('.court').forEach(el => {
    if (el.dataset.status !== 'ATIVA') return;
    el.addEventListener('click',   () => selectCourt(el.dataset.id, el.dataset.codigo, el.dataset.preco));
    el.addEventListener('keydown', e => {
      if (e.key==='Enter'||e.key===' ') { e.preventDefault(); selectCourt(el.dataset.id, el.dataset.codigo, el.dataset.preco); }
    });
  });
}

carregarQuadras();
