// login.js — QuadraJá v2

const form        = document.getElementById('loginForm');
const emailInput  = document.getElementById('email');
const pwInput     = document.getElementById('password');
const emailWrap   = document.getElementById('emailWrap');
const pwWrap      = document.getElementById('passwordWrap');
const emailErr    = document.getElementById('emailError');
const pwErr       = document.getElementById('passwordError');
const loginBtn    = document.getElementById('loginBtn');
const togglePw    = document.getElementById('togglePw');
const googleBtn   = document.getElementById('googleBtn');
const appleBtn    = document.getElementById('appleBtn');

// ── Toggle senha ──────────────────────────────────────
togglePw.addEventListener('click', () => {
  const show = pwInput.type === 'password';
  pwInput.type       = show ? 'text' : 'password';
  togglePw.textContent = show ? '🙈' : '👁';
});

// ── Limpa erro ao digitar ─────────────────────────────
emailInput.addEventListener('input', () => clearError(emailWrap, emailErr));
pwInput.addEventListener('input',    () => clearError(pwWrap, pwErr));

// ── Focus highlight ───────────────────────────────────
[emailInput, pwInput].forEach(inp => {
  inp.addEventListener('focus', () => {
    if (!inp.closest('.input-wrap').classList.contains('error'))
      inp.closest('.input-wrap').style.borderColor = 'var(--accent)';
  });
  inp.addEventListener('blur', () => {
    if (!inp.closest('.input-wrap').classList.contains('error'))
      inp.closest('.input-wrap').style.borderColor = '';
  });
});

// ── Validação ─────────────────────────────────────────
function isEmailValid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

function showError(wrap, errEl, msg) {
  wrap.classList.add('error');
  wrap.style.animation = 'shake 0.35s ease';
  wrap.style.borderColor = 'var(--red)';
  errEl.innerHTML = '⚠ ' + msg;
  errEl.style.display = 'flex';
  setTimeout(() => { wrap.style.animation = ''; }, 400);
}

function clearError(wrap, errEl) {
  wrap.classList.remove('error');
  wrap.style.borderColor = '';
  errEl.style.display = 'none';
}

// ── Submit ────────────────────────────────────────────
form.addEventListener('submit', e => {
  e.preventDefault();
  let valid = true;

  // Valida e-mail
  if (!emailInput.value.trim()) {
    showError(emailWrap, emailErr, 'O e-mail é obrigatório');
    valid = false;
  } else if (!isEmailValid(emailInput.value)) {
    showError(emailWrap, emailErr, 'Digite um e-mail válido (ex: nome@email.com)');
    valid = false;
  }

  // Valida senha
  if (!pwInput.value) {
    showError(pwWrap, pwErr, 'A senha é obrigatória');
    valid = false;
  } else if (pwInput.value.length < 6) {
    showError(pwWrap, pwErr, 'A senha precisa ter pelo menos 6 caracteres');
    valid = false;
  }

  if (!valid) return;

  // Loading
  loginBtn.disabled = true;
  loginBtn.classList.add('loading');
  loginBtn.textContent = 'Entrando';

  setTimeout(() => {
    loginBtn.textContent = '✓ Entrando!';
    loginBtn.style.background = 'linear-gradient(135deg,#00E5A0,#00C98A)';
    setTimeout(() => { window.location.href = 'locais.html'; }, 600);
  }, 1400);
});

// ── OAuth ─────────────────────────────────────────────
googleBtn.addEventListener('click', () => {
  googleBtn.textContent = '⏳ Aguarde...';
  googleBtn.disabled = true;
  setTimeout(() => { window.location.href = 'locais.html'; }, 1000);
});
appleBtn.addEventListener('click', () => {
  appleBtn.textContent = '⏳ Aguarde...';
  appleBtn.disabled = true;
  setTimeout(() => { window.location.href = 'locais.html'; }, 1000);
});
