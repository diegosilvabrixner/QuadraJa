// quadras.js — QuadraJá v2

// ── 5. Dados de quadras por arena ─────────────────────
const ARENA_DATA = {
  'Arena Centro': {
    courts: [
      { id:'A1', label:'Quadra A1', tipo:'Areia', cobertura:'Coberta',    status:'available', preco:80 },
      { id:'A2', label:'Quadra A2', tipo:'Areia', cobertura:'Descoberta', status:'available', preco:80 },
      { id:'A3', label:'Quadra A3', tipo:'Areia', cobertura:'Descoberta', status:'available', preco:80 },
      { id:'B1', label:'Quadra B1', tipo:'Piso',  cobertura:'Coberta',    status:'occupied',  preco:70 },
      { id:'B2', label:'Quadra B2', tipo:'Piso',  cobertura:'Descoberta', status:'maintenance', preco:70 },
      { id:'B3', label:'Quadra B3', tipo:'Piso',  cobertura:'Coberta',    status:'available', preco:70 },
    ]
  },
  'Arena Norte': {
    courts: [
      { id:'A1', label:'Quadra A1', tipo:'Piso', cobertura:'Coberta',    status:'available', preco:70 },
      { id:'A2', label:'Quadra A2', tipo:'Piso', cobertura:'Descoberta', status:'available', preco:70 },
    ]
  },
  'Arena Coberta Sul': {
    courts: [
      { id:'A1', label:'Quadra A1', tipo:'Areia', cobertura:'Coberta', status:'available',   preco:90 },
      { id:'A2', label:'Quadra A2', tipo:'Areia', cobertura:'Coberta', status:'available',   preco:90 },
      { id:'B1', label:'Quadra B1', tipo:'Piso',  cobertura:'Coberta', status:'available',   preco:90 },
      { id:'B2', label:'Quadra B2', tipo:'Piso',  cobertura:'Coberta', status:'maintenance', preco:90 },
    ]
  },
  'Beach Sport Lapa': {
    courts: [
      { id:'A1', label:'Quadra A1', tipo:'Areia', cobertura:'Descoberta', status:'available', preco:75 },
      { id:'A2', label:'Quadra A2', tipo:'Areia', cobertura:'Descoberta', status:'available', preco:75 },
      { id:'A3', label:'Quadra A3', tipo:'Areia', cobertura:'Descoberta', status:'available', preco:75 },
    ]
  },
};

// ── Parâmetros ────────────────────────────────────────
const params    = new URLSearchParams(location.search);
const arenaName = params.get('arena') || 'Arena Centro';
document.getElementById('arenaTitle').textContent = arenaName;

const arenaData = ARENA_DATA[arenaName] || ARENA_DATA['Arena Centro'];
const courts    = arenaData.courts;

// ── 2. Slots reservados por quadra (não bloqueia a quadra inteira)
// Apenas marca quais slots estão ocupados — a quadra continua selecionável
const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');

// { courtId: [array de horarios já reservados] }
const slotsPorQuadra = {};
reservas
  .filter(r => r.arena === arenaName && r.status !== 'cancelada')
  .forEach(r => {
    if (!slotsPorQuadra[r.court]) slotsPorQuadra[r.court] = [];
    (r.horariosList || []).forEach(h => {
      if (!slotsPorQuadra[r.court].includes(h)) slotsPorQuadra[r.court].push(h);
    });
  });

// ── Renderiza SVG dinamicamente ───────────────────────
function renderSVG() {
  const cols = courts.length <= 3 ? courts.length : Math.ceil(courts.length / 2);
  const rows = Math.ceil(courts.length / cols);
  const cW = 130, cH = 80, gap = 10, pad = 10;
  const svgW = pad*2 + cols*(cW+gap) - gap;
  const svgH = pad*2 + rows*(cH+gap) - gap;

  const colors = { available:'#00E5A0', occupied:'#FF6B6B', maintenance:'#4A5E7A' };
  const labels = { available:'Livre', occupied:'Ocupada', maintenance:'Manutenção' };

  let cells = courts.map((c, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col*(cW+gap);
    const y = pad + row*(cH+gap);
    const cx = x + cW/2;
    const cy = y + cH/2;
    const color = colors[c.status];
    const label = labels[c.status];
    const clickable = c.status !== 'maintenance';

    return `
      <g class="court" data-id="${c.id}" data-status="${c.status}" data-price="${c.preco}"
         ${clickable ? 'tabindex="0"' : ''} style="cursor:${clickable?'pointer':'not-allowed'}">
        <rect x="${x}" y="${y}" width="${cW}" height="${cH}" rx="5"
              fill="${color}" fill-opacity="${c.status==='maintenance'?0.1:0.12}"
              stroke="${color}" stroke-width="1.5"/>
        <line x1="${cx}" y1="${y}" x2="${cx}" y2="${y+cH}"
              stroke="${color}" stroke-width="1.2" stroke-dasharray="4 3"/>
        <text x="${cx}" y="${cy-4}" text-anchor="middle" fill="${color}"
              font-size="13" font-weight="800" font-family="Outfit,sans-serif">${c.id}</text>
        <text x="${cx}" y="${cy+12}" text-anchor="middle" fill="${color}"
              font-size="8" font-family="Outfit,sans-serif">${c.tipo} · ${label}</text>
        ${slotsPorQuadra[c.id]?.length ? `
        <text x="${x+cW-5}" y="${y+14}" text-anchor="end" fill="${color}"
              font-size="8" font-family="Outfit,sans-serif" opacity="0.7">
          ${slotsPorQuadra[c.id].length}h reservada${slotsPorQuadra[c.id].length>1?'s':''}
        </text>` : ''}
      </g>`;
  }).join('');

  document.getElementById('floorPlan').setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  document.getElementById('svgCells').innerHTML =
    `<rect x="1" y="1" width="${svgW-2}" height="${svgH-2}" rx="8" fill="#0D1A2A" stroke="#1E2D42" stroke-width="1.5"/>` + cells;
}

// ── Renderiza lista de cards dinamicamente ────────────
function renderCards() {
  const TODOS_SLOTS = ['07:00','08:00','09:00','10:00','11:00','12:00',
                       '14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
  const list = document.getElementById('courtList');

  list.innerHTML = courts.map(c => {
    const reservados = slotsPorQuadra[c.id] || [];
    // Quadra SÓ fica bloqueada se for manutenção OU se todos os slots estiverem ocupados
    const totalSlots = TODOS_SLOTS.length;
    const allTaken   = reservados.length >= totalSlots;
    const isMaint    = c.status === 'maintenance';
    const isOccupied = c.status === 'occupied' && reservados.length === 0; // ocupação mock original
    const disabled   = isMaint || isOccupied || allTaken;

    let chipClass = 'chip-green', chipText = 'Livre';
    if (isMaint)          { chipClass = 'chip-yellow'; chipText = 'Manutenção'; }
    else if (isOccupied)  { chipClass = 'chip-red';    chipText = 'Ocupada'; }
    else if (allTaken)    { chipClass = 'chip-red';    chipText = 'Sem horários'; }
    else if (reservados.length > 0) {
      chipClass = 'chip-blue';
      chipText  = `${reservados.length}h reservada${reservados.length>1?'s':''}`;
    }

    const icon = c.tipo === 'Areia' ? '🏖' : '🏟';
    const desc = isMaint ? `${c.tipo} · Indisponível no momento`
                         : `${c.tipo} · ${c.cobertura} · até 12 jogadores`;

    return `
      <div class="court-card ${disabled?'disabled':''}"
           data-id="${c.id}" data-price="${c.preco}" ${disabled?'':' tabindex="0"'}>
        <div class="court-card-icon">${icon}</div>
        <div class="court-card-info">
          <div class="court-card-top">
            <strong>${c.label}</strong>
            <span class="chip ${chipClass}">${chipText}</span>
          </div>
          <p>${desc}</p>
        </div>
        <div class="court-card-price ${disabled?'muted':''}">
          R$${c.preco}<small>/h</small>
        </div>
      </div>`;
  }).join('');

  // Eventos nos cards habilitados
  document.querySelectorAll('.court-card:not(.disabled)').forEach(card => {
    card.addEventListener('click', () => selectCourt(card.dataset.id, card.dataset.price));
    card.addEventListener('keydown', e => {
      if (e.key==='Enter'||e.key===' ') { e.preventDefault(); selectCourt(card.dataset.id, card.dataset.price); }
    });
  });
}

// ── Seleção e navegação ───────────────────────────────
function selectCourt(id, price) {
  document.querySelectorAll('.court').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.court-card').forEach(c => c.classList.remove('active'));

  document.querySelector(`.court[data-id="${id}"]`)?.classList.add('selected');
  document.querySelector(`.court-card[data-id="${id}"]`)?.classList.add('active');

  setTimeout(() => {
    const p = new URLSearchParams({ arena: arenaName, court: id, preco: price || '80' });
    window.location.href = `horarios.html?${p}`;
  }, 350);
}

// Eventos SVG
function bindSVGEvents() {
  document.querySelectorAll('.court').forEach(court => {
    if (court.dataset.status === 'maintenance') return;
    court.addEventListener('click', () => selectCourt(court.dataset.id, court.dataset.price));
    court.addEventListener('keydown', e => {
      if (e.key==='Enter'||e.key===' ') { e.preventDefault(); selectCourt(court.dataset.id, court.dataset.price); }
    });
  });
}

// ── Init ──────────────────────────────────────────────
renderSVG();
renderCards();
bindSVGEvents();
