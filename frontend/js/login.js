// login.js — QuadraJá — chama API real

const form       = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const pwInput    = document.getElementById('password');
const emailWrap  = document.getElementById('emailWrap');
const pwWrap     = document.getElementById('passwordWrap');
const emailErr   = document.getElementById('emailError');
const pwErr      = document.getElementById('passwordError');
const loginBtn   = document.getElementById('loginBtn');
const togglePw   = document.getElementById('togglePw');

togglePw.addEventListener('click', () => {
  const show = pwInput.type === 'password';
  pwInput.type = show ? 'text' : 'password';
  togglePw.textContent = show ? '🙈' : '👁';
});

emailInput.addEventListener('input', () => clearError(emailWrap, emailErr));
pwInput.addEventListener('input',    () => clearError(pwWrap, pwErr));

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

function isEmailValid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

function showError(wrap, errEl, msg) {
  wrap.classList.add('error');
  wrap.style.animation   = 'shake 0.35s ease';
  wrap.style.borderColor = 'var(--red)';
  errEl.innerHTML        = '⚠ ' + msg;
  errEl.style.display    = 'flex';
  setTimeout(() => { wrap.style.animation = ''; }, 400);
}

function clearError(wrap, errEl) {
  wrap.classList.remove('error');
  wrap.style.borderColor = '';
  errEl.style.display    = 'none';
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  let valid = true;

  if (!emailInput.value.trim()) {
    showError(emailWrap, emailErr, 'O e-mail é obrigatório'); valid = false;
  } else if (!isEmailValid(emailInput.value)) {
    showError(emailWrap, emailErr, 'Digite um e-mail válido'); valid = false;
  }

  if (!pwInput.value) {
    showError(pwWrap, pwErr, 'A senha é obrigatória'); valid = false;
  } else if (pwInput.value.length < 6) {
    showError(pwWrap, pwErr, 'Mínimo 6 caracteres'); valid = false;
  }

  if (!valid) return;

  loginBtn.disabled      = true;
  loginBtn.textContent   = 'Entrando...';
  loginBtn.style.opacity = '0.8';

  try {
    const data = await api.post('/auth/login', {
      email: emailInput.value.trim().toLowerCase(),
      senha: pwInput.value,
    });

    setToken(data.token);
    localStorage.setItem('qj_user_nome',   data.usuario.nome);
    localStorage.setItem('qj_user_email',  data.usuario.email);
    localStorage.setItem('qj_user_id',     data.usuario.id);
    localStorage.setItem('qj_user_perfil', data.usuario.perfil);

    loginBtn.textContent      = '✓ Bem-vindo!';
    loginBtn.style.background = 'linear-gradient(135deg,#00E5A0,#00C98A)';

    setTimeout(() => {
      const perfil = data.usuario.perfil;
      if (perfil === 'ADMIN_ARENA' || perfil === 'SUPER_ADMIN') {
        window.location.href = '../admin/dashboard.html';
      } else {
        window.location.href = 'locais.html';
      }
    }, 600);

  } catch (err) {
    loginBtn.disabled      = false;
    loginBtn.textContent   = 'Entrar';
    loginBtn.style.opacity = '1';
    showError(emailWrap, emailErr, err.message || 'Erro ao fazer login. Tente novamente.');
  }
});

// Shake animation
const s = document.createElement('style');
s.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}`;
document.head.appendChild(s);
