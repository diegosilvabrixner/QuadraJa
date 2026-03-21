// redefinir-senha.js — QuadraJá

const params = new URLSearchParams(location.search);
const token  = params.get('token');

// Se veio com token na URL, mostra o formulário de nova senha
if (token) {
  document.getElementById('stepEmail').style.display  = 'none';
  document.getElementById('stepSenha').style.display  = '';
} 

// ── Passo 1: solicitar recuperação ────────────────────────────
document.getElementById('formEmail').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('emailInput').value.trim();
  const btn   = document.getElementById('btnEnviar');
  const errEl = document.getElementById('emailError');
  const wrap  = document.getElementById('emailWrap');

  errEl.style.display = 'none';
  wrap.classList.remove('error');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    wrap.classList.add('error');
    wrap.style.borderColor = 'var(--red)';
    errEl.innerHTML = '⚠ Digite um e-mail válido';
    errEl.style.display = 'flex';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Enviando...';

  try {
    await api.post('/auth/esqueci-senha', { email: email.toLowerCase() });
    document.getElementById('stepEmail').style.display   = 'none';
    document.getElementById('stepSucesso').style.display = '';
    document.getElementById('msgSucesso').textContent    =
      'Se o e-mail estiver cadastrado, as instruções chegam em breve. Verifique sua caixa de entrada e spam.';
  } catch (err) {
    btn.disabled    = false;
    btn.textContent = 'Enviar instruções';
    wrap.classList.add('error');
    errEl.innerHTML = '⚠ ' + (err.message || 'Erro. Tente novamente.');
    errEl.style.display = 'flex';
  }
});

// ── Passo 2: redefinir senha com token ────────────────────────
document.getElementById('formSenha').addEventListener('submit', async e => {
  e.preventDefault();
  const novaSenha    = document.getElementById('novaSenha').value;
  const confirmar    = document.getElementById('confirmarSenha').value;
  const btn          = document.getElementById('btnRedefinir');
  const senhaErr     = document.getElementById('senhaError');
  const confirmarErr = document.getElementById('confirmarError');

  senhaErr.style.display = confirmarErr.style.display = 'none';

  if (novaSenha.length < 8) {
    senhaErr.innerHTML     = '⚠ Mínimo 8 caracteres';
    senhaErr.style.display = 'flex';
    return;
  }
  if (novaSenha !== confirmar) {
    confirmarErr.innerHTML     = '⚠ As senhas não coincidem';
    confirmarErr.style.display = 'flex';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Salvando...';

  try {
    const res = await api.post('/auth/redefinir-senha', { token, novaSenha });
    document.getElementById('stepSenha').style.display   = 'none';
    document.getElementById('stepSucesso').style.display = '';
    document.getElementById('msgSucesso').textContent    = res.mensagem;
  } catch (err) {
    btn.disabled    = false;
    btn.textContent = 'Redefinir senha';
    senhaErr.innerHTML     = '⚠ ' + (err.message || 'Link inválido ou expirado.');
    senhaErr.style.display = 'flex';
  }
});

// ── Toggle senha ──────────────────────────────────────────────
document.getElementById('toggleNovaSenha')?.addEventListener('click', () => {
  const i = document.getElementById('novaSenha');
  const show = i.type === 'password';
  i.type = show ? 'text' : 'password';
  document.getElementById('toggleNovaSenha').textContent = show ? '🙈' : '👁';
});
