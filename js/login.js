// ═══════════════════════════════════════════════════
// screen-01-login.js — QuadraJá
// Tela: Login — Lógica e interações
// ═══════════════════════════════════════════════════

const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn      = document.getElementById('loginBtn');
const loginForm     = document.getElementById('loginForm');
const togglePwBtn   = document.getElementById('togglePw');
const googleBtn     = document.getElementById('googleBtn');
const appleBtn      = document.getElementById('appleBtn');

// ── Toggle mostrar senha ─────────────────────────────
togglePwBtn.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePwBtn.textContent = isPassword ? '🙈' : '👁';
});

// ── Validação em tempo real ───────────────────────────
function isEmailValid(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function updateLoginBtn() {
  const ready = isEmailValid(emailInput.value) && passwordInput.value.length >= 6;
  loginBtn.style.opacity  = ready ? '1' : '0.5';
  loginBtn.style.cursor   = ready ? 'pointer' : 'default';
  loginBtn.disabled       = !ready;
}

emailInput.addEventListener('input', updateLoginBtn);
passwordInput.addEventListener('input', updateLoginBtn);
updateLoginBtn(); // estado inicial

// Highlight input wrap ao focar
document.querySelectorAll('.input-wrap input').forEach(input => {
  input.addEventListener('focus', () => {
    input.closest('.input-wrap').style.borderColor = 'var(--accent)';
  });
  input.addEventListener('blur', () => {
    input.closest('.input-wrap').style.borderColor = 'var(--border)';
  });
});

// ── Submit ────────────────────────────────────────────
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!isEmailValid(emailInput.value)) {
    showError(emailInput, 'E-mail inválido');
    return;
  }
  if (passwordInput.value.length < 6) {
    showError(passwordInput, 'Senha muito curta');
    return;
  }

  // Simula loading
  loginBtn.classList.add('loading');
  loginBtn.textContent = 'Entrando...';

  setTimeout(() => {
    showSuccess();
    setTimeout(() => {
      window.location.href = 'locais.html';
    }, 800);
  }, 1800);
});

// ── OAuth ─────────────────────────────────────────────
googleBtn.addEventListener('click', () => {
  googleBtn.textContent = '⏳ Conectando...';
  setTimeout(() => { googleBtn.innerHTML = '<img src="..." width="20"/> Google'; }, 2000);
});
appleBtn.addEventListener('click', () => {
  appleBtn.textContent = '⏳ Conectando...';
  setTimeout(() => { appleBtn.textContent = '🍎 Apple'; }, 2000);
});

// ── Helpers ───────────────────────────────────────────
function showError(inputEl, message) {
  const wrap = inputEl.closest('.input-wrap');
  wrap.style.borderColor = 'var(--red)';
  wrap.style.animation   = 'shake 0.3s ease';

  let errEl = wrap.parentElement.querySelector('.err-msg');
  if (!errEl) {
    errEl = document.createElement('span');
    errEl.className = 'err-msg';
    errEl.style.cssText = 'color:var(--red);font-size:12px;margin-top:4px;display:block;';
    wrap.after(errEl);
  }
  errEl.textContent = '⚠ ' + message;

  inputEl.addEventListener('input', () => {
    wrap.style.borderColor = 'var(--border)';
    wrap.style.animation   = '';
    if (errEl) errEl.remove();
  }, { once: true });
}

function showSuccess() {
  loginBtn.style.background = 'linear-gradient(135deg, #00E5A0, #00C98A)';
  loginBtn.textContent = '✓ Bem-vindo!';
  setTimeout(() => {
    loginBtn.style.background = '';
    loginBtn.textContent = 'Entrar';
  }, 2000);
}

// Animação shake (inline para evitar dependência de CSS extra)
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%,60%  { transform: translateX(-6px); }
    40%,80%  { transform: translateX(6px); }
  }
`;
document.head.appendChild(style);
