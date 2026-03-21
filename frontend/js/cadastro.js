// cadastro.js — QuadraJá

document.getElementById('cadastroForm').addEventListener('submit', async e => {
  e.preventDefault();

  const nome      = document.getElementById('nome').value.trim();
  const email     = document.getElementById('email').value.trim();
  const telefone  = document.getElementById('telefone').value;
  const senha     = document.getElementById('senha').value;
  const confirmar = document.getElementById('confirmarSenha').value;
  const nascimento= document.getElementById('nascimento').value;
  const termosOk  = document.getElementById('checkTermos').checked;
  const idadeOk   = document.getElementById('checkIdade').checked;

  let valid = true;

  const clearAll = () => {
    ['nome','email','telefone','senha','confirmarSenha','nascimento'].forEach(id => {
      clearError(id + 'Wrap', id.charAt(0).toUpperCase() + id.slice(1) + 'Error');
    });
  };
  clearAll();

  if (!nome || nome.trim().split(' ').length < 2) {
    showError('nomeWrap','nomeError','Digite seu nome completo'); valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('emailWrap','emailError','Digite um e-mail válido'); valid = false;
  }
  const telNumeros = telefone.replace(/\D/g,'');
  if (!telNumeros || telNumeros.length < 10) {
    showError('telefoneWrap','telefoneError','Digite um telefone com DDD'); valid = false;
  }
  if (!senha || senha.length < 8) {
    showError('senhaWrap','senhaError','Mínimo 8 caracteres'); valid = false;
  }
  if (senha !== confirmar) {
    showError('confirmarWrap','confirmarError','As senhas não coincidem'); valid = false;
  }
  // Aceita DD/MM/AAAA
  if (!nascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(nascimento)) {
    showError('nascimentoWrap','nascimentoError','Data inválida — use DD/MM/AAAA'); valid = false;
  }
  if (!termosOk) { showCheckError('checkTermosBox','termosError','Aceite os Termos de Uso'); valid = false; }
  if (!idadeOk)  { showCheckError('checkIdadeBox','idadeError','Confirme que tem 18 anos ou mais'); valid = false; }

  if (!valid) return;

  const btn = document.getElementById('cadastroBtn');
  btn.disabled    = true;
  btn.textContent = 'Criando conta...';

  try {
    // Perfil padrão CLIENTE — definido no backend
    await api.post('/auth/register', {
      nome,
      email:          email.toLowerCase(),
      telefone:       telNumeros,
      senha,
      dataNascimento: nascimento,   // DD/MM/AAAA — backend aceita esse formato
    });

    btn.textContent      = '✓ Conta criada!';
    btn.style.background = 'linear-gradient(135deg,#00E5A0,#00C98A)';

    // Redireciona para LOGIN (não para locais — usuário precisa fazer login)
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);

  } catch (err) {
    btn.disabled    = false;
    btn.textContent = 'Criar minha conta';
    // Mostra erro do servidor (ex: "E-mail já cadastrado")
    showError('emailWrap','emailError', err.message || 'Erro ao criar conta. Tente novamente.');
  }
});

// ── Helpers ──────────────────────────────────────────────────
function showError(wrapId, errId, msg) {
  const wrap = document.getElementById(wrapId);
  const err  = document.getElementById(errId);
  if (wrap) { wrap.classList.add('error'); wrap.style.borderColor='var(--red)'; }
  if (err)  { err.innerHTML = '⚠ ' + msg; err.style.display = 'flex'; }
}
function clearError(wrapId, errId) {
  const wrap = document.getElementById(wrapId);
  const err  = document.getElementById(errId);
  if (wrap) { wrap.classList.remove('error'); wrap.style.borderColor = ''; }
  if (err)  { err.style.display = 'none'; }
}
function showCheckError(checkBoxId, errId, msg) {
  document.getElementById(checkBoxId)?.classList.add('error');
  const err = document.getElementById(errId);
  if (err) { err.innerHTML = '⚠ ' + msg; err.style.display = 'flex'; }
}

// ── Máscara telefone ──────────────────────────────────────────
document.getElementById('telefone')?.addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g,'').slice(0,11);
  if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3');
  else                v = v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3');
  e.target.value = v.trim().replace(/-$/,'');
});

// ── Máscara data DD/MM/AAAA ───────────────────────────────────
document.getElementById('nascimento')?.addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g,'').slice(0,8);
  if (v.length > 4) v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
  else if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
  e.target.value = v;
});

// ── Toggle senha ──────────────────────────────────────────────
document.getElementById('toggleSenha')?.addEventListener('click', () => {
  const i = document.getElementById('senha');
  i.type = i.type === 'password' ? 'text' : 'password';
  document.getElementById('toggleSenha').textContent = i.type === 'password' ? '👁' : '🙈';
});
document.getElementById('toggleConfirmar')?.addEventListener('click', () => {
  const i = document.getElementById('confirmarSenha');
  i.type = i.type === 'password' ? 'text' : 'password';
  document.getElementById('toggleConfirmar').textContent = i.type === 'password' ? '👁' : '🙈';
});

// ── Força da senha ────────────────────────────────────────────
document.getElementById('senha')?.addEventListener('input', () => {
  const val  = document.getElementById('senha').value;
  const bar  = document.getElementById('strengthBar');
  const fill = document.getElementById('strengthFill');
  const lbl  = document.getElementById('strengthLabel');
  if (!val) { bar.style.display = 'none'; lbl.textContent = ''; return; }
  bar.style.display = 'block';
  let score = 0;
  if (val.length >= 8)  score++;
  if (val.length >= 12) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const lvls = [
    { w:'20%', color:'#FF6B6B', text:'Muito fraca',  tc:'#FF6B6B' },
    { w:'40%', color:'#FF9F43', text:'Fraca',         tc:'#FF9F43' },
    { w:'60%', color:'#FFD166', text:'Razoável',      tc:'#FFD166' },
    { w:'80%', color:'#00B894', text:'Forte',         tc:'#00B894' },
    { w:'100%',color:'#00E5A0', text:'Muito forte',   tc:'#00E5A0' },
  ];
  const l = lvls[Math.min(score, 4)];
  fill.style.width = l.w; fill.style.background = l.color;
  lbl.textContent  = l.text; lbl.style.color = l.tc;
});

// ── Modais ────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); document.body.style.overflow=''; }
function acceptAndClose(modalId, checkId) {
  const chk = document.getElementById(checkId);
  if (chk) chk.checked = true;
  clearError('checkTermosBox','termosError');
  closeModal(modalId);
}
window.openModal     = openModal;
window.closeModal    = closeModal;
window.acceptAndClose = acceptAndClose;
