// admin/js/dayuse.js
let modoEdDayuse = null;
let quadrasDisponiveis = [];

window.addEventListener('arenaLoaded', carregarDayuses);

async function carregarDayuses() {
  const arenaId = getArenaId();
  const tbody   = document.getElementById('dayuseTbody');

  // Carrega quadras para o formulário
  try {
    quadrasDisponiveis = await api.get(`/arenas/${arenaId}/quadras`);
    renderQuadrasCheck(quadrasDisponiveis, []);
  } catch {}

  try {
    const dayuses = await api.get(`/api/dayuses?arenaId=${arenaId}`);
    if (!dayuses?.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">Nenhum dayuse cadastrado.</td></tr>';
      return;
    }
    tbody.innerHTML = dayuses.map(d => {
      const quadraNomes = d.quadras?.map(q => q.quadra?.codigo || q.codigo).join(', ') || '—';
      return `<tr>
        <td><strong>${d.nome}</strong></td>
        <td>${new Date(d.data).toLocaleDateString('pt-BR')}</td>
        <td>${d.horaInicio} – ${d.horaFim}</td>
        <td><strong class="text-accent">${formatBRL(d.valorPorPessoa)}</strong><span style="color:var(--text-muted)">/pessoa</span></td>
        <td style="font-size:12px;color:var(--text-muted)">${quadraNomes}</td>
        <td>${d.ativo ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>'}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-secondary btn-sm" onclick='editarDayuse(${JSON.stringify(d)})'>✏️</button>
            <button class="btn btn-danger btn-sm" onclick="cancelarDayuse('${d.id}')">✗</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  } catch (err) { toast('Erro: ' + err.message, 'error'); }
}

function renderQuadrasCheck(quadras, selecionadas) {
  const container = document.getElementById('dyQuadrasCheck');
  container.innerHTML = quadras.map(q => `
    <label style="display:flex;align-items:center;gap:6px;padding:6px 10px;
                  background:var(--card);border:1px solid var(--border);border-radius:8px;cursor:pointer">
      <input type="checkbox" value="${q.id}" ${selecionadas.includes(q.id)?'checked':''}/>
      <span style="font-size:13px;font-weight:600">${q.codigo}</span>
    </label>`).join('');
}

function editarDayuse(d) {
  modoEdDayuse = d.id;
  document.getElementById('modalDayuseTitle').textContent = 'Editar Dayuse';
  document.getElementById('dyNome').value   = d.nome;
  document.getElementById('dyData').value   = new Date(d.data).toISOString().slice(0,10);
  document.getElementById('dyValor').value  = d.valorPorPessoa;
  document.getElementById('dyInicio').value = d.horaInicio;
  document.getElementById('dyFim').value    = d.horaFim;
  document.getElementById('dyMax').value    = d.maximoPessoas || '';
  document.getElementById('dyPopup').checked= d.exibirPopup;
  const sels = (d.quadras||[]).map(q => q.quadraId || q.id);
  renderQuadrasCheck(quadrasDisponiveis, sels);
  abrirModal('modalDayuse');
}

async function salvarDayuse() {
  const nome      = document.getElementById('dyNome').value.trim();
  const data      = document.getElementById('dyData').value;
  const valor     = parseFloat(document.getElementById('dyValor').value);
  const horaInicio= document.getElementById('dyInicio').value;
  const horaFim   = document.getElementById('dyFim').value;
  const maxPessoas= parseInt(document.getElementById('dyMax').value)||null;
  const exibirPopup = document.getElementById('dyPopup').checked;
  const courtIds  = [...document.querySelectorAll('#dyQuadrasCheck input:checked')].map(i => i.value);

  if (!nome || !data || isNaN(valor) || !courtIds.length) {
    toast('Preencha nome, data, valor e pelo menos uma quadra.', 'error');
    return;
  }

  try {
    const body = { arenaId: getArenaId(), nome, data, valorPorPessoa: valor, horaInicio, horaFim, maxPessoas, exibirPopup, courtIds };
    if (modoEdDayuse) await api.patch(`/api/dayuses/${modoEdDayuse}`, body);
    else              await api.post('/api/dayuses', body);
    toast('Dayuse salvo!', 'success');
    fecharModal('modalDayuse');
    carregarDayuses();
  } catch (err) { toast(err.message, 'error'); }
}

async function cancelarDayuse(id) {
  if (!confirm('Desativar este dayuse?')) return;
  try {
    await api.delete(`/api/dayuses/${id}`);
    toast('Dayuse desativado.', 'success');
    carregarDayuses();
  } catch (err) { toast(err.message, 'error'); }
}

window.editarDayuse  = editarDayuse;
window.salvarDayuse  = salvarDayuse;
window.cancelarDayuse= cancelarDayuse;
