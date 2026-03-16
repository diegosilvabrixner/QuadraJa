// horarios.js — QuadraJá v2

// ── Parâmetros da URL ─────────────────────────────────
const params    = new URLSearchParams(location.search);
const arenaName = params.get('arena') || 'Arena Centro';
const courtId   = params.get('court') || 'A1';
const preco     = parseInt(params.get('preco') || '80');

// ── Estado ────────────────────────────────────────────
let mode          = 'avulso';
let selectedDay   = null;
let selectedSlots = [];

const SLOTS_ALL    = ['07:00','08:00','09:00','10:00','11:00','12:00',
                      '14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
const MOCK_OCCUPIED = ['09:00', '16:00'];

// ── Helpers de data/hora ──────────────────────────────
const now   = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

function dateFromStr(str) {
  // "DD/MM/AAAA" → Date
  if (!str) return null;
  const [d, m, y] = str.split('/').map(Number);
  return new Date(y, m - 1, d);
}

function isToday(dateStr) {
  const d = dateFromStr(dateStr);
  return d && d.getTime() === today.getTime();
}

// Retorna true se o slot já passou ou é dentro da próxima hora (hora atual + 2h de antecedência)
function isSlotPast(timeStr, dateStr) {
  const d = dateFromStr(dateStr);
  if (!d) return false;
  if (d < today) return true;           // dia passado
  if (d > today) return false;          // dia futuro — tudo ok
  // É hoje: bloqueia slots cujo horário já passou OU está a menos de 2h
  const [h, m] = timeStr.split(':').map(Number);
  const slotTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
  const minFuture = new Date(now.getTime() + 2 * 60 * 60 * 1000); // agora + 2h
  return slotTime <= minFuture;
}

// ── Slots ocupados por reservas salvas ────────────────
function getOccupiedSlots(date) {
  const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
  return reservas
    .filter(r => r.arena === arenaName && r.court === courtId && r.data === date)
    .flatMap(r => r.horariosList || []);
}

// ── Toggle Avulso / Mensal ─────────────────────────────
document.querySelectorAll('.ttab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ttab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.type;
    selectedSlots = [];
    document.getElementById('panelAvulso').style.display = mode === 'avulso' ? '' : 'none';
    document.getElementById('panelMensal').style.display = mode === 'mensal' ? '' : 'none';
    updateSummary();
  });
});

// ── Calendário ────────────────────────────────────────
let calYear  = now.getFullYear();
let calMonth = now.getMonth();

function buildCalendar() {
  const cal         = document.getElementById('miniCal');
  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthName   = new Date(calYear, calMonth).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  cal.innerHTML = `
    <div class="cal-nav">
      <button id="calPrev">‹</button>
      <span>${monthName}</span>
      <button id="calNext">›</button>
    </div>
    <div class="cal-days-header">
      ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => `<span>${d}</span>`).join('')}
    </div>
    <div class="cal-days" id="calDays"></div>
  `;

  const daysEl = cal.querySelector('#calDays');

  for (let i = 0; i < firstDay; i++) {
    const e = document.createElement('button');
    e.className = 'cal-day inactive';
    daysEl.appendChild(e);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn  = document.createElement('button');
    const date = new Date(calYear, calMonth, d);

    // ── BLOQUEIA dias passados (incluindo hoje se for o fim do dia) ──
    // Bloqueia o dia inteiro apenas se já passou das 21:00 hoje
    // (último slot disponível). Caso contrário hoje é selecionável.
    const isPastDay = date < today;
    const isTodayFull = date.getTime() === today.getTime() && now.getHours() >= 21;

    btn.className = 'cal-day' + (isPastDay || isTodayFull ? ' inactive' : '');
    btn.textContent = d;

    if (date.getTime() === today.getTime() && !isTodayFull) btn.classList.add('today');

    if (!isPastDay && !isTodayFull) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cal-day').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDay   = `${String(d).padStart(2,'0')}/${String(calMonth+1).padStart(2,'0')}/${calYear}`;
        selectedSlots = [];
        buildSlots('slotsGrid', selectedDay);
        updateSummary();
      });
    }

    daysEl.appendChild(btn);
  }

  cal.querySelector('#calPrev').addEventListener('click', () => {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } buildCalendar();
  });
  cal.querySelector('#calNext').addEventListener('click', () => {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } buildCalendar();
  });
}

// ── Slots com bloqueio de horários passados ───────────
function buildSlots(containerId = 'slotsGrid', date = null) {
  const grid     = document.getElementById(containerId);
  const occupied = date
    ? [...MOCK_OCCUPIED, ...getOccupiedSlots(date)]
    : MOCK_OCCUPIED;

  grid.innerHTML = '';
  SLOTS_ALL.forEach(time => {
    const isOccupied = occupied.includes(time);
    const isPast     = date ? isSlotPast(time, date) : false;
    const unavailable = isOccupied || isPast;

    const btn = document.createElement('button');
    btn.className  = 'slot' + (unavailable ? ' occupied' : '');
    btn.textContent = time;
    btn.dataset.time = time;

    if (isPast && !isOccupied) {
      btn.title = 'Horário indisponível — já passou ou falta menos de 2h';
      btn.style.opacity = '0.35';
    } else if (isOccupied) {
      btn.title = 'Horário já reservado';
    }

    if (!unavailable) {
      btn.addEventListener('click', () => {
        const idx = selectedSlots.indexOf(time);
        if (idx === -1) { selectedSlots.push(time);     btn.classList.add('active'); }
        else            { selectedSlots.splice(idx, 1); btn.classList.remove('active'); }
        updateSummary();
      });
    }
    grid.appendChild(btn);
  });
}

// ── Weekday (mensal) ──────────────────────────────────
document.querySelectorAll('.wday').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wday').forEach(b => b.classList.remove('active'));
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

  const ready = selectedSlots.length > 0 && (mode === 'avulso' ? selectedDay : weekday);
  box.style.display = ready ? 'flex' : 'none';
  btn.disabled      = !ready;

  if (ready) {
    dateEl.textContent = mode === 'avulso' ? selectedDay : `Toda ${weekday}`;
    const sorted = [...selectedSlots].sort();
    timeEl.textContent = sorted.map(t => `${t}–${addHour(t)}`).join('  ·  ');
    const total = mode === 'avulso' ? preco * selectedSlots.length : 280 * selectedSlots.length;
    priceEl.textContent = mode === 'avulso'
      ? `R$ ${total},00  (${selectedSlots.length}h)`
      : `R$ ${total},00/mês  (${selectedSlots.length} horário${selectedSlots.length > 1 ? 's' : ''})`;
  }
}

function addHour(t) {
  const [h, m] = t.split(':').map(Number);
  return `${String(h + 1).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ── Continuar ─────────────────────────────────────────
document.getElementById('continueBtn').addEventListener('click', () => {
  const weekday = document.querySelector('.wday.active')?.dataset.day;
  const total   = mode === 'avulso' ? preco * selectedSlots.length : 280 * selectedSlots.length;
  const p = new URLSearchParams({
    arena:    arenaName,
    court:    courtId,
    tipo:     mode,
    data:     selectedDay || '',
    horarios: selectedSlots.sort().join(','),
    preco:    total,
  });
  window.location.href = `pagamento.html?${p}`;
});

// ── Init ──────────────────────────────────────────────
buildCalendar();
buildSlots('slotsGrid');
buildSlots('slotsGridMensal');
