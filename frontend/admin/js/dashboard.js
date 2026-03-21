// admin/js/dashboard.js

const mesInput = document.getElementById('mesRef');
mesInput.value = new Date().toISOString().slice(0, 7); // AAAA-MM

window.addEventListener('arenaLoaded', () => { carregarDashboard(); carregarPerfil(); });
mesInput.addEventListener('change', () => carregarDashboard());

async function carregarDashboard() {
  const arenaId = getArenaId();
  const mes     = mesInput.value;
  if (!arenaId || !mes) return;

  try {
    const d = await api.get(`/financial/dashboard?arenaId=${arenaId}&month=${mes}`);

    document.getElementById('kpiFaturamento').textContent  = formatBRL(d.receita);
    document.getElementById('kpiLucro').textContent        = formatBRL(d.lucro);
    document.getElementById('kpiMargem').textContent       = `margem ${d.margem}%`;
    document.getElementById('kpiReservas').textContent     = d.reservas;
    document.getElementById('kpiMensalistas').textContent  = d.mensalistas;
    document.getElementById('kpiCancelamentos').textContent= d.cancelamentos;
    document.getElementById('kpiDespesas').textContent     = formatBRL(d.despesa);

    // Ocupação por quadra
    const ocList = document.getElementById('ocupacaoList');
    if (d.ocupacaoPorQuadra?.length) {
      ocList.innerHTML = d.ocupacaoPorQuadra.map(q => `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:13px;font-weight:600">${q.label} — ${q.nome}</span>
            <span style="font-size:12px;color:var(--accent);font-weight:700">${q.ocupacao}%</span>
          </div>
          <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${Math.min(q.ocupacao,100)}%;background:linear-gradient(90deg,#00E5A0,#0099FF);border-radius:3px"></div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${q.reservas} reservas</div>
        </div>`).join('');
    } else {
      ocList.innerHTML = '<div class="empty-admin"><div class="icon">📊</div>Sem dados</div>';
    }
  } catch (err) {
    toast('Erro ao carregar dashboard: ' + err.message, 'error');
  }

  // Últimas reservas
  try {
    const { reservas } = await api.get(`/reservas?limit=8`);
    const tbody = document.getElementById('ultimasReservasTbody');
    if (reservas?.length) {
      tbody.innerHTML = reservas.map(r => `
        <tr>
          <td style="font-weight:600">${r.usuario?.nome || '—'}</td>
          <td>${r.quadra?.codigo || '—'}</td>
          <td>${r.data ? new Date(r.data).toLocaleDateString('pt-BR') : 'Mensal'}</td>
          <td>${badgeStatus(r.status)}</td>
        </tr>`).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">Nenhuma reserva</td></tr>';
    }
  } catch {}

  // Estoque baixo
  try {
    const prods = await api.get(`/products/alerts/low-stock?arenaId=${getArenaId()}`);
    const panel = document.getElementById('estoqueAlertaPanel');
    const list  = document.getElementById('estoqueAlertaList');
    if (prods?.length) {
      panel.style.display = '';
      list.innerHTML = prods.map(p => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:13px;font-weight:600">${p.nome}</span>
          <span style="font-size:12px" class="badge badge-red">Estoque: ${p.estoqueAtual} (mín: ${p.estoqueMinimo})</span>
        </div>`).join('');
    }
  } catch {}
}

// ── Perfil do admin ────────────────────────────────────────────
async function carregarPerfil() {
  try {
    const usuario = await api.get('/auth/me');
    if (!usuario) return;

    const nome  = usuario.nome || '';
    const email = usuario.email || '';

    document.getElementById('perfilNomeDisplay').textContent   = nome;
    document.getElementById('perfilEmailDisplay').textContent  = email;
    document.getElementById('perfilCargoDisplay').textContent  = usuario.perfil === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Arena';
    document.getElementById('perfilAvatarGrande').textContent  = nome[0]?.toUpperCase() || 'A';
    document.getElementById('perfilNome').value     = nome;
    document.getElementById('perfilTelefone').value = usuario.telefone || '';
  } catch {}
}

async function salvarPerfil() {
  const nome     = document.getElementById('perfilNome').value.trim();
  const telefone = document.getElementById('perfilTelefone').value.trim();

  if (!nome) { toast('Nome é obrigatório.', 'error'); return; }

  try {
    await api.patch('/auth/me', { nome, telefone });
    localStorage.setItem('qj_user_nome', nome.split(' ')[0]);
    document.getElementById('sidebarUserName').textContent    = nome.split(' ')[0];
    document.getElementById('perfilNomeDisplay').textContent  = nome;
    document.getElementById('perfilAvatarGrande').textContent = nome[0]?.toUpperCase() || 'A';
    document.getElementById('sidebarAvatar').textContent      = nome[0]?.toUpperCase() || 'A';
    toast('Perfil atualizado!', 'success');
  } catch (err) { toast('Erro: ' + err.message, 'error'); }
}

async function alterarSenha() {
  const atual     = document.getElementById('senhaAtual').value;
  const nova      = document.getElementById('novaSenha').value;
  const confirmar = document.getElementById('confirmarSenha').value;

  if (!atual || !nova || !confirmar) { toast('Preencha todos os campos de senha.', 'error'); return; }
  if (nova.length < 8)               { toast('A nova senha precisa ter pelo menos 8 caracteres.', 'error'); return; }
  if (nova !== confirmar)            { toast('As senhas não coincidem.', 'error'); return; }

  try {
    await api.post('/auth/alterar-senha', { senhaAtual: atual, novaSenha: nova });
    document.getElementById('senhaAtual').value    = '';
    document.getElementById('novaSenha').value     = '';
    document.getElementById('confirmarSenha').value= '';
    toast('Senha alterada com sucesso!', 'success');
  } catch (err) { toast('Erro: ' + err.message, 'error'); }
}

window.salvarPerfil  = salvarPerfil;
window.alterarSenha  = alterarSenha;
