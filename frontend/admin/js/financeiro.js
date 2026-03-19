// admin/js/financeiro.js
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('mesDRE').value = new Date().toISOString().slice(0,7);
});
window.addEventListener('arenaLoaded', carregarDRE);

async function carregarDRE() {
  const mes = document.getElementById('mesDRE')?.value || new Date().toISOString().slice(0,7);
  try {
    const d = await api.get(`/financial/dre?arenaId=${getArenaId()}&month=${mes}`);

    document.getElementById('receitasList').innerHTML = `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted)">Reservas avulsas</span><strong>${formatBRL(d.receitas?.avulso)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted)">Mensalidades</span><strong>${formatBRL(d.receitas?.mensal)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted)">Dayuse</span><strong>${formatBRL(d.receitas?.dayuse)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0">
        <span style="color:var(--text-muted)">Produtos</span><strong>${formatBRL(d.receitas?.produtos)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid var(--accent)">
        <strong>Total receitas</strong><strong class="text-accent" style="font-size:18px">${formatBRL(d.receitas?.total)}</strong></div>`;

    const desp = d.despesas||[];
    document.getElementById('despesasList').innerHTML = desp.length
      ? desp.map(e=>`
          <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
            <div><span style="font-size:12px;color:var(--text-dim)">${e.codigoConta}</span><br>
              <span style="font-size:13px">${e.descricao}</span>
            </div>
            <div style="text-align:right">
              <strong class="${e.realizado>(e.orcado||0)?'kpi-red':''}">${formatBRL(e.realizado)}</strong>
              ${e.orcado?`<br><span style="font-size:11px;color:var(--text-muted)">Meta: ${formatBRL(e.orcado)}</span>`:''}
            </div>
          </div>`).join('')
      : '<div class="empty-admin">Nenhuma despesa</div>';

    const r = d.resultado || 0;
    const el = document.getElementById('resultadoLiquido');
    el.textContent = `${formatBRL(r)} (${d.margem}%)`;
    el.style.color = r >= 0 ? 'var(--accent)' : 'var(--red)';

    // Tabela despesas detalhadas
    const resp = await api.get(`/financial/expenses?arenaId=${getArenaId()}&month=${mes}`);
    const tbody = document.getElementById('despesasTbody');
    tbody.innerHTML = (resp||[]).map(e=>`
      <tr>
        <td style="color:var(--text-muted)">${e.codigoConta}</td>
        <td>${e.descricao}</td>
        <td><span class="badge badge-gray">${e.categoria}</span></td>
        <td><strong>${formatBRL(e.valor)}</strong></td>
        <td style="color:var(--text-muted);font-size:12px">${formatDateTime(e.criadoEm)}</td>
      </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Nenhuma despesa lançada</td></tr>';
  } catch (err) { toast('Erro: '+err.message,'error'); }
}

async function salvarDespesa() {
  const codigo   = document.getElementById('dCodigo').value.trim()||'9.9.9';
  const valor    = parseFloat(document.getElementById('dValor').value);
  const descricao= document.getElementById('dDescricao').value.trim();
  const categoria= document.getElementById('dCategoria').value;
  const mes      = document.getElementById('dMes').value || document.getElementById('mesDRE').value;
  if (!descricao||isNaN(valor)) { toast('Preencha descrição e valor.','error'); return; }
  try {
    await api.post('/financial/expenses', { arenaId:getArenaId(), codigoConta:codigo, categoria, descricao, valor, mesReferencia:mes });
    toast('Despesa lançada!','success');
    fecharModal('modalDespesa');
    carregarDRE();
  } catch (err) { toast(err.message,'error'); }
}

window.carregarDRE  = carregarDRE;
window.salvarDespesa= salvarDespesa;
