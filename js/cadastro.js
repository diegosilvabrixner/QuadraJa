// cadastro.js — QuadraJá v2

// ── Helpers ───────────────────────────────────────────
function isEmailValid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
function isPhoneValid(v) { return v.replace(/\D/g,'').length >= 10; }
function isDateValid(v) {
  const [d,m,y] = v.split('/').map(Number);
  if (!d || !m || !y || y < 1900 || y > new Date().getFullYear()) return false;
  const date = new Date(y, m-1, d);
  return date.getDate()===d && date.getMonth()===m-1 && date.getFullYear()===y;
}
function getAge(v) {
  const [d,m,y] = v.split('/').map(Number);
  const birth = new Date(y, m-1, d);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (1000*60*60*24*365.25));
}

function showError(wrapId, errId, msg) {
  const wrap = document.getElementById(wrapId);
  const err  = document.getElementById(errId);
  if (wrap) { wrap.classList.add('error'); wrap.style.animation = 'shake .35s ease'; setTimeout(()=>wrap.style.animation='',400); }
  if (err)  { err.innerHTML = '⚠ '+msg; err.style.display = 'flex'; }
}
function clearError(wrapId, errId) {
  const wrap = document.getElementById(wrapId);
  const err  = document.getElementById(errId);
  if (wrap) { wrap.classList.remove('error'); wrap.style.borderColor = ''; }
  if (err)  { err.style.display = 'none'; }
}
function showCheckError(checkBoxId, errId, msg) {
  document.getElementById(checkBoxId).classList.add('error');
  const err = document.getElementById(errId);
  err.innerHTML = '⚠ '+msg; err.style.display='flex';
}
function clearCheckError(checkBoxId, errId) {
  document.getElementById(checkBoxId).classList.remove('error');
  document.getElementById(errId).style.display='none';
}

// ── Limpar erros ao digitar ───────────────────────────
document.getElementById('nome').addEventListener('input', ()=> clearError('nomeWrap','nomeError'));
document.getElementById('email').addEventListener('input', ()=> clearError('emailWrap','emailError'));
document.getElementById('telefone').addEventListener('input', ()=> clearError('telefoneWrap','telefoneError'));
document.getElementById('senha').addEventListener('input', ()=> { clearError('senhaWrap','senhaError'); updateStrength(); });
document.getElementById('confirmarSenha').addEventListener('input', ()=> clearError('confirmarWrap','confirmarError'));
document.getElementById('nascimento').addEventListener('input', ()=> clearError('nascimentoWrap','nascimentoError'));
document.getElementById('checkTermos').addEventListener('change', ()=> clearCheckError('checkTermosBox','termosError'));
document.getElementById('checkIdade').addEventListener('change',  ()=> clearCheckError('checkIdadeBox','idadeError'));

// ── Máscaras ──────────────────────────────────────────
document.getElementById('telefone').addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g,'').slice(0,11);
  if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3');
  else                v = v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3');
  e.target.value = v;
});
document.getElementById('nascimento').addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g,'').slice(0,8);
  if (v.length > 4) v = v.slice(0,2)+'/'+v.slice(2,4)+'/'+v.slice(4);
  else if (v.length > 2) v = v.slice(0,2)+'/'+v.slice(2);
  e.target.value = v;
});

// ── Toggle senhas ─────────────────────────────────────
document.getElementById('toggleSenha').addEventListener('click', () => {
  const inp = document.getElementById('senha');
  const show = inp.type==='password';
  inp.type = show ? 'text' : 'password';
  document.getElementById('toggleSenha').textContent = show ? '🙈' : '👁';
});
document.getElementById('toggleConfirmar').addEventListener('click', () => {
  const inp = document.getElementById('confirmarSenha');
  const show = inp.type==='password';
  inp.type = show ? 'text' : 'password';
  document.getElementById('toggleConfirmar').textContent = show ? '🙈' : '👁';
});

// ── Força da senha ────────────────────────────────────
function updateStrength() {
  const val = document.getElementById('senha').value;
  const bar  = document.getElementById('strengthBar');
  const fill = document.getElementById('strengthFill');
  const label= document.getElementById('strengthLabel');
  if (!val) { bar.style.display='none'; label.textContent=''; return; }
  bar.style.display = 'block';

  let score = 0;
  if (val.length >= 8)   score++;
  if (val.length >= 12)  score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { w:'20%', color:'#FF6B6B', text:'Muito fraca', textColor:'var(--red)' },
    { w:'40%', color:'#FF9F43', text:'Fraca',       textColor:'#FF9F43' },
    { w:'60%', color:'#FFD166', text:'Razoável',    textColor:'var(--yellow)' },
    { w:'80%', color:'#00B894', text:'Forte',       textColor:'#00B894' },
    { w:'100%',color:'#00E5A0', text:'Muito forte', textColor:'var(--accent)' },
  ];
  const lvl = levels[Math.min(score, 4)];
  fill.style.width      = lvl.w;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.textColor;
}

// ── Submit ────────────────────────────────────────────
document.getElementById('cadastroForm').addEventListener('submit', e => {
  e.preventDefault();
  let valid = true;

  const nome       = document.getElementById('nome').value.trim();
  const email      = document.getElementById('email').value.trim();
  const telefone   = document.getElementById('telefone').value;
  const senha      = document.getElementById('senha').value;
  const confirmar  = document.getElementById('confirmarSenha').value;
  const nascimento = document.getElementById('nascimento').value;
  const termosOk   = document.getElementById('checkTermos').checked;
  const idadeOk    = document.getElementById('checkIdade').checked;

  if (!nome || nome.split(' ').length < 2) {
    showError('nomeWrap','nomeError','Digite seu nome completo (nome e sobrenome)'); valid=false;
  }
  if (!email) {
    showError('emailWrap','emailError','O e-mail é obrigatório'); valid=false;
  } else if (!isEmailValid(email)) {
    showError('emailWrap','emailError','Digite um e-mail válido (ex: nome@email.com)'); valid=false;
  }
  if (!isPhoneValid(telefone)) {
    showError('telefoneWrap','telefoneError','Digite um telefone válido com DDD'); valid=false;
  }
  if (senha.length < 8) {
    showError('senhaWrap','senhaError','A senha precisa ter pelo menos 8 caracteres'); valid=false;
  }
  if (senha !== confirmar) {
    showError('confirmarWrap','confirmarError','As senhas não coincidem'); valid=false;
  }
  if (!nascimento || !isDateValid(nascimento)) {
    showError('nascimentoWrap','nascimentoError','Digite uma data válida no formato DD/MM/AAAA'); valid=false;
  } else if (getAge(nascimento) < 18) {
    showError('nascimentoWrap','nascimentoError','Você precisa ter pelo menos 18 anos para criar uma conta'); valid=false;
  }
  if (!termosOk) {
    showCheckError('checkTermosBox','termosError','Você precisa aceitar os Termos de Uso e a Política de Privacidade'); valid=false;
  }
  if (!idadeOk) {
    showCheckError('checkIdadeBox','idadeError','Você precisa confirmar que tem 18 anos ou mais'); valid=false;
  }

  if (!valid) {
    // Scroll para o primeiro erro
    const firstErr = document.querySelector('.field-error[style*="flex"]');
    if (firstErr) firstErr.scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }

  // Salva nome no storage para exibir no app
  localStorage.setItem('qj_user_name', nome.split(' ')[0]);
  localStorage.setItem('qj_user_email', email);

  const btn = document.getElementById('cadastroBtn');
  btn.disabled = true;
  btn.textContent = 'Criando conta...';

  setTimeout(() => {
    btn.textContent = '✓ Conta criada!';
    btn.style.background = 'linear-gradient(135deg,#00E5A0,#00C98A)';
    setTimeout(() => { window.location.href = 'locais.html'; }, 700);
  }, 1400);
});

// ── Modais ────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
function acceptAndClose(modalId, checkId) {
  document.getElementById(checkId).checked = true;
  clearCheckError('checkTermosBox','termosError');
  closeModal(modalId);
}
// Expõe funções para os atributos onclick do HTML
window.openModal  = openModal;
window.closeModal = closeModal;
window.acceptAndClose = acceptAndClose;
