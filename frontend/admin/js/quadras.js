// admin/js/quadras.js
let modoEdicao = null; // null = novo, id = editar

window.addEventListener('arenaLoaded', carregarQuadras);

async function carregarQuadras() {
  const arenaId = getArenaId();
  if (!arenaId) return;

  try {
    const quadras = await api.get(`/arenas/${arenaId}/quadras`);
    const tbody   = document.getElementById('quadrasTbody');

    if (!quadras?.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-admin">Nenhuma quadra cadastrada.</td></tr>';
      return;
    }

    tbody.innerHTML = quadras.map(q => `
      <tr>
        <td><strong>${q.codigo}</strong></td>
        <td>${q.nome}</td>
        <td>${q.tipo}</td>
        <td><strong class="text-accent">${formatBRL(q.valorHora)}</strong></td>
        <td>${formatBRL(q.valorMensal)}</td>
        <td>${badgeStatus(q.status)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick='editarQuadra(${JSON.stringify(q)})'>✏️ Editar</button>
            <button class="btn btn-secondary btn-sm" onclick="verHistoricoStatus('${q.id}')">📋 Histórico</button>
          </div>
        </td>
      </tr>`).join('');
  } catch (err) {
    toast('Erro ao carregar quadras: ' + err.message, 'error');
  }
}

function editarQuadra(q) {
  modoEdicao = q.id;
  document.getElementById('modalQuadraTitle').textContent = 'Editar Quadra';
  document.getElementById('qCodigo').value      = q.codigo;
  document.getElementById('qNome').value        = q.nome;
  document.getElementById('qTipo').value        = q.tipo;
  document.getElementById('qStatus').value      = q.status;
  document.getElementById('qValorHora').value   = q.valorHora;
  document.getElementById('qValorMensal').value = q.valorMensal;
  document.getElementById('qDescricao').value   = q.descricao || '';
  abrirModal('modalQuadra');
}

async function salvarQuadra() {
  const arenaId   = getArenaId();
  const codigo    = document.getElementById('qCodigo').value.trim();
  const nome      = document.getElementById('qNome').value.trim();
  const tipo      = document.getElementById('qTipo').value;
  const status    = document.getElementById('qStatus').value;
  const valorHora = parseFloat(document.getElementById('qValorHora').value);
  const valorMensal = parseFloat(document.getElementById('qValorMensal').value);
  const descricao = document.getElementById('qDescricao').value.trim();

  if (!codigo || !nome || !valorHora || !valorMensal) {
    toast('Preencha todos os campos obrigatórios.', 'error');
    return;
  }

  try {
    if (modoEdicao) {
      await api.patch(`/admin/quadras/${modoEdicao}`, { nome, tipo, status, valorHora, valorMensal, descricao });
      toast('Quadra atualizada com sucesso!', 'success');
    } else {
      await api.post(`/admin/quadras`, { arenaId, codigo, nome, tipo, status, valorHora, valorMensal, descricao });
      toast('Quadra criada com sucesso!', 'success');
    }
    fecharModal('modalQuadra');
    carregarQuadras();
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

async function verHistoricoStatus(quadraId) {
  abrirModal('modalHistoricoStatus');
  const body = document.getElementById('historicoStatusBody');
  body.innerHTML = '<div class="empty-admin">Carregando...</div>';

  try {
    const hist = await api.get(`/admin/quadras/${quadraId}/historico-status`);
    if (!hist?.length) {
      body.innerHTML = '<div class="empty-admin"><div class="icon">📋</div>Sem alterações registradas.</div>';
      return;
    }
    body.innerHTML = hist.map(h => `
      <div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          ${badgeStatus(h.statusAntes)} → ${badgeStatus(h.statusDepois)}
          <span style="font-size:11px;color:var(--text-muted)">${formatDateTime(h.alteradoEm)}</span>
        </div>
        <div style="font-size:12px;color:var(--text-muted)">
          Por: ${h.alteradoPorNome || h.alteradoPor} ${h.motivo ? '· ' + h.motivo : ''}
        </div>
      </div>`).join('');
  } catch (err) {
    body.innerHTML = `<div class="empty-admin">Erro: ${err.message}</div>`;
  }
}

window.editarQuadra       = editarQuadra;
window.salvarQuadra       = salvarQuadra;
window.verHistoricoStatus = verHistoricoStatus;
