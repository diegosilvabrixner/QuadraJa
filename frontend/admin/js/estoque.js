// admin/js/estoque.js
let prodAjuste = null;
window.addEventListener('arenaLoaded', carregarEstoque);

async function carregarEstoque() {
  const tbody = document.getElementById('estoqueTbody');
  try {
    const prods = await api.get(`/products/admin?arenaId=${getArenaId()}`);
    tbody.innerHTML = prods.map(p => {
      const baixo = p.trackStock && p.estoqueAtual <= p.estoqueMinimo;
      return `<tr>
        <td><strong>${p.nome}</strong></td>
        <td style="font-size:18px;font-weight:900;color:${baixo?'var(--red)':'var(--accent)'}">${p.estoqueAtual} <span style="font-size:12px;font-weight:500;color:var(--text-muted)">${p.unidade}</span></td>
        <td style="color:var(--text-muted)">${p.estoqueMinimo} ${p.unidade}</td>
        <td>${baixo?'<span class="badge badge-red">⚠ Baixo</span>':'<span class="badge badge-green">OK</span>'}</td>
        <td style="font-size:12px;color:var(--text-muted)">${formatDate(p.atualizadoEm)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="abrirAjuste('${p.id}','${p.nome}')">📦 Ajustar</button>
          <button class="btn btn-secondary btn-sm" onclick="verHistorico('${p.id}')">📋 Histórico</button>
        </td>
      </tr>`;
    }).join('');
  } catch (err) { toast(err.message, 'error'); }
}

function abrirAjuste(id, nome) {
  prodAjuste = id;
  document.getElementById('movProdNome').textContent = nome;
  document.getElementById('movQtd').value    = '';
  document.getElementById('movCusto').value  = '';
  document.getElementById('movMotivo').value = '';
  abrirModal('modalMovimento');
}

async function salvarMovimento() {
  const tipo   = document.getElementById('movTipo').value;
  const qtd    = parseInt(document.getElementById('movQtd').value);
  const custo  = parseFloat(document.getElementById('movCusto').value)||null;
  const motivo = document.getElementById('movMotivo').value.trim();
  if (!qtd||qtd<1) { toast('Quantidade inválida.','error'); return; }
  try {
    const r = await api.post(`/products/${prodAjuste}/stock`, { tipo, quantidade:qtd, custoUnitario:custo, motivo });
    toast(`Estoque atualizado! Novo total: ${r.novoEstoque}`,'success');
    fecharModal('modalMovimento');
    carregarEstoque();
  } catch (err) { toast(err.message,'error'); }
}

async function verHistorico(id) {
  const hist = await api.get(`/products/${id}/stock/history`);
  const msg  = hist.slice(0,5).map(h=>`${h.tipo} ${h.quantidade>0?'+':''}${h.quantidade} — ${h.motivo||'—'} (${formatDate(h.criadoEm)})`).join('\n');
  alert(msg || 'Sem histórico.');
}

window.abrirAjuste   = abrirAjuste;
window.salvarMovimento = salvarMovimento;
window.verHistorico  = verHistorico;
