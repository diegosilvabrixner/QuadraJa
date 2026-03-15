// horarios.js — QuadraJá v2

// ── Parâmetros da URL ─────────────────────────────────
const params    = new URLSearchParams(location.search);
const arenaName = params.get('arena') || 'Arena Centro';
const courtId   = params.get('court') || 'A1';
const preco     = parseInt(params.get('preco') || '80');

// ── Estado ────────────────────────────────────────────
let mode          = 'avulso';
let selectedDay   = null;
let selectedSlots = [];   // MULTI seleção

// ── Horários fixamente ocupados (mock) ────────────────
const SLOTS_ALL = ['07:00','08:00','09:00','10:00','11:00','12:00',
                   '14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

// Ocupados do localStorage (reservas já confirmadas)
function getOccupiedSlots(date) {
  const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
  return reservas
    .filter(r => r.arena === arenaName && r.court === courtId && r.data === date)
    .flatMap(r => r.horariosList || []);
}

// Mock de alguns horários sempre ocupados
const MOCK_OCCUPIED = ['09:00', '16:00'];

// ── Toggle Avulso / Mensal ─────────────────────────────
document.querySelectorAll('.ttab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ttab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.type;
    selectedSlots = [];
    document.getElementById('panelAvulso').style.display = mode==='avulso' ? '' : 'none';
    document.getElementById('panelMensal').style.display = mode==='mensal' ? '' : 'none';
    updateSummary();
  });
});

// ── Calendário ────────────────────────────────────────
const today = new Date();
let calYear  = today.getFullYear();
let calMonth = today.getMonth();

function buildCalendar() {
  const cal = document.getElementById('miniCal');
  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const monthName   = new Date(calYear, calMonth).toLocaleString('pt-BR', {month:'long', year:'numeric'});

  cal.innerHTML = `
    <div class="cal-nav">
      <button id="calPrev">‹</button>
      <span>${monthName}</span>
      <button id="calNext">›</button>
    </div>
    <div class="cal-days-header">
      ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>`<span>${d}</span>`).join('')}
    </div>
    <div class="cal-days" id="calDays"></div>
  `;

  const daysEl = cal.querySelector('#calDays');
  for (let i=0; i<firstDay; i++) {
    const e = document.createElement('button'); e.className='cal-day inactive'; daysEl.appendChild(e);
  }
  for (let d=1; d<=daysInMonth; d++) {
    const btn  = document.createElement('button');
    btn.className = 'cal-day';
    btn.textContent = d;
    const date = new Date(calYear, calMonth, d);
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (isPast) btn.classList.add('inactive');
    if (d===today.getDate() && calMonth===today.getMonth() && calYear===today.getFullYear())
      btn.classList.add('today');
    if (!isPast) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cal-day').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        selectedDay = `${String(d).padStart(2,'0')}/${String(calMonth+1).padStart(2,'0')}/${calYear}`;
        selectedSlots = [];
        buildSlots('slotsGrid', selectedDay);
        updateSummary();
      });
    }
    daysEl.appendChild(btn);
  }
  cal.querySelector('#calPrev').addEventListener('click', () => {
    calMonth--; if(calMonth<0){calMonth=11;calYear--;} buildCalendar();
  });
  cal.querySelector('#calNext').addEventListener('click', () => {
    calMonth++; if(calMonth>11){calMonth=0;calYear++;} buildCalendar();
  });
}

// ── Slots — seleção múltipla ──────────────────────────
function buildSlots(containerId='slotsGrid', date=null) {
  const grid = document.getElementById(containerId);
  const occupied = date ? [...MOCK_OCCUPIED, ...getOccupiedSlots(date)] : MOCK_OCCUPIED;

  grid.innerHTML = '';
  SLOTS_ALL.forEach(time => {
    const isOccupied = occupied.includes(time);
    const btn = document.createElement('button');
    btn.className = 'slot' + (isOccupied ? ' occupied' : '');
    btn.textContent = time;
    btn.dataset.time = time;
    btn.title = isOccupied ? 'Horário indisponível' : 'Clique para selecionar';

    if (!isOccupied) {
      btn.addEventListener('click', () => {
        const idx = selectedSlots.indexOf(time);
        if (idx === -1) {
          selectedSlots.push(time);
          btn.classList.add('active');
        } else {
          selectedSlots.splice(idx, 1);
          btn.classList.remove('active');
        }
        updateSummary();
      });
    }
    grid.appendChild(btn);
  });
}

// ── Weekday (mensal) ──────────────────────────────────
document.querySelectorAll('.wday').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wday').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    selectedSlots = [];
    buildSlots('slotsGridMensal');
    updateSummary();
  });
});

// ── Resumo ────────────────────────────────────────────
function updateSummary() {
  const box     = document.getElementById('summaryBox');
  const dateEl  = document.getElementById('summaryDate');
  const timeEl  = document.getElementById('summaryTime');
  const priceEl = document.getElementById('summaryPrice');
  const btn     = document.getElementById('continueBtn');
  const weekday = document.querySelector('.wday.active')?.dataset.day;

  const ready = selectedSlots.length > 0 && (mode==='avulso' ? selectedDay : weekday);
  box.style.display = ready ? 'flex' : 'none';
  btn.disabled = !ready;

  if (ready) {
    dateEl.textContent = mode==='avulso' ? selectedDay : `Toda ${weekday}`;
    const sortedSlots = [...selectedSlots].sort();
    timeEl.textContent = sortedSlots.map(t=>`${t}–${addHour(t)}`).join('  ·  ');

    const total = mode==='avulso'
      ? preco * selectedSlots.length
      : 280 * selectedSlots.length;
    priceEl.textContent = mode==='avulso'
      ? `R$ ${total},00  (${selectedSlots.length}h)`
      : `R$ ${total},00/mês  (${selectedSlots.length} horário${selectedSlots.length>1?'s':''})`;
  }
}

function addHour(t) {
  const [h,m] = t.split(':').map(Number);
  return `${String(h+1).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ── Continuar ─────────────────────────────────────────
document.getElementById('continueBtn').addEventListener('click', () => {
  const weekday = document.querySelector('.wday.active')?.dataset.day;
  const total   = mode==='avulso' ? preco*selectedSlots.length : 280*selectedSlots.length;
  const p = new URLSearchParams({
    arena:   arenaName,
    court:   courtId,
    tipo:    mode,
    data:    selectedDay || '',
    horarios: selectedSlots.sort().join(','),
    preco:   total,
  });
  window.location.href = `pagamento.html?${p}`;
});

// ── Init ──────────────────────────────────────────────
buildCalendar();
buildSlots('slotsGrid');
buildSlots('slotsGridMensal');
