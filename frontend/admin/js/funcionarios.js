// admin/js/funcionarios.js
let modoEdFunc = null;
window.addEventListener('arenaLoaded', carregarFuncionarios);

async function carregarFuncionarios() {
  try {
    const { funcionarios, totais } = await api.get(`/financial/payroll?arenaId=${getArenaId()}`);

    // KPIs folha
    document.getElementById('kpiFolha').innerHTML = `
      <div class="kpi-card"><div class="kpi-label">Salários</div><div class="kpi-value kpi-yellow">${formatBRL(totais?.salarioBase)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Encargos (INSS+FGTS)</div><div class="kpi-value kpi-red">${formatBRL((totais?.inss||0)+(totais?.fgts||0))}</div></div>
      <div class="kpi-card"><div class="kpi-label">Benefícios</div><div class="kpi-value kpi-blue">${formatBRL(totais?.beneficios)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Custo total folha</div><div class="kpi-value kpi-red">${formatBRL(totais?.custoTotal)}</div></div>`;

    const tbody = document.getElementById('funcTbody');
    tbody.innerHTML = (funcionarios||[]).map(f => `
      <tr>
        <td><strong>${f.nome}</strong></td>
        <td style="color:var(--text-muted)">${f.cargo}</td>
        <td>${formatBRL(f.salarioBase)}</td>
        <td style="color:var(--red)">${formatBRL((f.inss||0)+(f.fgts||0))}</td>
        <td>${formatBRL(f.beneficios)}</td>
        <td><strong class="text-accent">${formatBRL(f.custoTotal)}</strong></td>
        <td>${badgeStatus(f.status)}</td>
        <td><button class="btn btn-secondary btn-sm" onclick='editarFuncionario(${JSON.stringify(f)})'>✏️</button></td>
      </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">Nenhum funcionário.</td></tr>';
  } catch (err) { toast('Erro: '+err.message,'error'); }
}

function editarFuncionario(f) {
  modoEdFunc = f.id;
  document.getElementById('modalFuncTitle').textContent = 'Editar Funcionário';
  document.getElementById('fNome').value    = f.nome;
  document.getElementById('fCargo').value   = f.cargo;
  document.getElementById('fStatus').value  = f.status;
  document.getElementById('fSalario').value = f.salarioBase;
  document.getElementById('fVT').value      = f.valeTransporte||0;
  document.getElementById('fVR').value      = f.valeRefeicao||0;
  if (f.dataAdmissao) document.getElementById('fAdmissao').value = f.dataAdmissao.slice(0,10);
  abrirModal('modalFunc');
}

async function salvarFuncionario() {
  const nome    = document.getElementById('fNome').value.trim();
  const cargo   = document.getElementById('fCargo').value.trim();
  const status  = document.getElementById('fStatus').value;
  const salario = parseFloat(document.getElementById('fSalario').value);
  const vt      = parseFloat(document.getElementById('fVT').value)||0;
  const vr      = parseFloat(document.getElementById('fVR').value)||0;
  const admissao= document.getElementById('fAdmissao').value;
  if (!nome||!cargo||isNaN(salario)) { toast('Preencha nome, cargo e salário.','error'); return; }
  try {
    if (modoEdFunc) {
      await api.patch(`/admin/funcionarios/${modoEdFunc}`, { nome, cargo, status, salarioBase:salario, valeTransporte:vt, valeRefeicao:vr });
    } else {
      await api.post('/admin/funcionarios', { arenaId:getArenaId(), nome, cargo, status, salarioBase:salario, valeTransporte:vt, valeRefeicao:vr, dataAdmissao:admissao });
    }
    toast('Funcionário salvo!','success');
    fecharModal('modalFunc');
    carregarFuncionarios();
  } catch (err) { toast(err.message,'error'); }
}

window.editarFuncionario = editarFuncionario;
window.salvarFuncionario = salvarFuncionario;
