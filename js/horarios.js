// screen-04-horarios.js — QuadraJá · Horários

// ── State ─────────────────────────────────────────────
let mode        = 'avulso';
let selectedDay = null;
let selectedSlot = null;

const SLOTS_AVULSO  = ['07:00','08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const SLOTS_OCCUPIED = ['09:00','11:00','16:00']; // simulação
const PRICE_AVULSO  = 80;
const PRICE_MENSAL  = 280;

// ── Toggle Avulso / Mensal ─────────────────────────────
document.querySelectorAll('.ttab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ttab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.type;
    document.getElementById('panelAvulso').style.display = mode === 'avulso' ? '' : 'none';
    document.getElementById('panelMensal').style.display = mode === 'mensal' ? '' : 'none';
    selectedSlot = null;
    updateSummary();
  });
});

// ── Mini Calendar ──────────────────────────────────────
const today = new Date();
let calYear  = today.getFullYear();
let calMonth = today.getMonth();

function buildCalendar() {
  const cal = document.getElementById('miniCal');
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthName = new Date(calYear, calMonth).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

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

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('button');
    empty.className = 'cal-day inactive';
    daysEl.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn  = document.createElement('button');
    btn.className = 'cal-day';
    btn.textContent = d;

    const date = new Date(calYear, calMonth, d);
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (isPast) { btn.classList.add('inactive'); }

    if (d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()) {
      btn.classList.add('today');
    }

    if (!isPast) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cal-day').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDay = `${String(d).padStart(2,'0')}/${String(calMonth+1).padStart(2,'0')}/${calYear}`;
        buildSlots();
        updateSummary();
      });
    }

    daysEl.appendChild(btn);
  }

  cal.querySelector('#calPrev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    buildCalendar();
  });
  cal.querySelector('#calNext').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    buildCalendar();
  });
}

// ── Slots ──────────────────────────────────────────────
function buildSlots(containerId = 'slotsGrid', slots = SLOTS_AVULSO) {
  const grid = document.getElementById(containerId);
  grid.innerHTML = '';
  slots.forEach(time => {
    const btn = document.createElement('button');
    btn.className = 'slot' + (SLOTS_OCCUPIED.includes(time) ? ' occupied' : '');
    btn.textContent = time;
    if (!SLOTS_OCCUPIED.includes(time)) {
      btn.addEventListener('click', () => {
        document.querySelectorAll(`#${containerId} .slot`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSlot = time;
        updateSummary();
      });
    }
    grid.appendChild(btn);
  });
}

// ── Weekday selection (mensal) ─────────────────────────
document.querySelectorAll('.wday').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wday').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    buildSlots('slotsGridMensal', SLOTS_AVULSO);
    updateSummary();
  });
});

// ── Summary ────────────────────────────────────────────
function updateSummary() {
  const summaryBox  = document.getElementById('summaryBox');
  const summaryDate = document.getElementById('summaryDate');
  const summaryTime = document.getElementById('summaryTime');
  const summaryPrice = document.getElementById('summaryPrice');
  const continueBtn = document.getElementById('continueBtn');

  const selectedWeekday = document.querySelector('.wday.active')?.dataset.day;

  const ready = selectedSlot && (mode === 'avulso' ? selectedDay : selectedWeekday);

  summaryBox.style.display = ready ? 'flex' : 'none';
  continueBtn.disabled = !ready;

  if (ready) {
    summaryDate.textContent  = mode === 'avulso' ? selectedDay : `Toda ${selectedWeekday}`;
    summaryTime.textContent  = selectedSlot ? `${selectedSlot} – ${addHour(selectedSlot)}` : '—';
    summaryPrice.textContent = mode === 'avulso' ? `R$ ${PRICE_AVULSO},00` : `R$ ${PRICE_MENSAL},00/mês`;
  }
}

function addHour(time) {
  const [h, m] = time.split(':').map(Number);
  return `${String(h + 1).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ── Continue button ────────────────────────────────────
document.getElementById('continueBtn').addEventListener('click', () => {
  const params = new URLSearchParams({
    court:   new URLSearchParams(location.search).get('court') || 'A1',
    tipo:    mode,
    data:    selectedDay || '',
    horario: selectedSlot,
    preco:   mode === 'avulso' ? '80' : '280',
  });
  window.location.href = `pagamento.html?${params}`;
});

// ── Init ───────────────────────────────────────────────
buildCalendar();
buildSlots();
