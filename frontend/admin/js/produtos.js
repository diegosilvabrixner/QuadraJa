// ── PRODUTOS ─────────────────────────────────────────────────
// admin/js/produtos.js
let modoEd = null;
window.addEventListener('arenaLoaded', carregarProdutos);

async function carregarProdutos() {
  const tbody = document.getElementById('produtosTbody');
  try {
    const prods = await api.get(`/products/admin?arenaId=${getArenaId()}`);
    if (!prods?.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">Nenhum produto.</td></tr>'; return; }
    tbody.innerHTML = prods.map(p => `
      <tr>
        <td><strong>${p.nome}</strong>${p.descricao?`<br><span style="font-size:11px;color:var(--text-muted)">${p.descricao}</span>`:''}
        </td>
        <td>${p.categoria?.nome||'—'}</td>
        <td>${formatBRL(p.custoUnitario)}</td>
        <td>${p.markup}%</td>
        <td><strong class="text-accent">${formatBRL(p.precoVenda)}</strong></td>
        <td>
          <span class="${p.estoqueAtual<=p.estoqueMinimo?'badge badge-red':'badge badge-green'}">${p.estoqueAtual} ${p.unidade}</span>
        </td>
        <td>${badgeStatus(p.status)}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-secondary btn-sm" onclick='editarProduto(${JSON.stringify(p)})'>✏️</button>
            <button class="btn btn-danger btn-sm" onclick="toggleStatus('${p.id}','${p.status}')">⏸</button>
          </div>
        </td>
      </tr>`).join('');
  } catch (err) { toast('Erro: '+err.message, 'error'); }
}

function calcPrecoVenda() {
  const c = parseFloat(document.getElementById('pCusto')?.value)||0;
  const m = parseFloat(document.getElementById('pMarkup')?.value)||0;
  const v = c * (1+m/100);
  const el = document.getElementById('pVenda');
  if (el) el.value = 'R$ ' + v.toFixed(2);
}

function editarProduto(p) {
  modoEd = p.id;
  document.getElementById('modalProdutoTitle').textContent = 'Editar Produto';
  document.getElementById('pNome').value      = p.nome;
  document.getElementById('pCusto').value     = p.custoUnitario;
  document.getElementById('pMarkup').value    = p.markup;
  document.getElementById('pEstoqueMin').value= p.estoqueMinimo;
  document.getElementById('pUnidade').value   = p.unidade;
  document.getElementById('pVisivel').checked = p.visivelClientes;
  calcPrecoVenda();
  abrirModal('modalProduto');
}

async function salvarProduto() {
  const nome     = document.getElementById('pNome').value.trim();
  const custo    = parseFloat(document.getElementById('pCusto').value);
  const markup   = parseFloat(document.getElementById('pMarkup').value);
  const estMin   = parseInt(document.getElementById('pEstoqueMin').value)||5;
  const unidade  = document.getElementById('pUnidade').value;
  const visivel  = document.getElementById('pVisivel').checked;
  const estoque  = parseInt(document.getElementById('pEstoque')?.value)||0;

  if (!nome || isNaN(custo) || isNaN(markup)) { toast('Preencha nome, custo e markup.', 'error'); return; }

  try {
    if (modoEd) {
      await api.patch(`/products/${modoEd}`, { nome, custoUnitario:custo, markup, estoqueMinimo:estMin, unidade, visivelClientes:visivel });
    } else {
      await api.post('/products', { arenaId:getArenaId(), nome, custoUnitario:custo, markup, estoqueInicial:estoque, estoqueMinimo:estMin, unidade, visivelClientes:visivel });
    }
    toast('Produto salvo!', 'success');
    fecharModal('modalProduto');
    carregarProdutos();
  } catch (err) { toast(err.message, 'error'); }
}

async function toggleStatus(id, status) {
  const novoStatus = status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
  try {
    await api.patch(`/products/${id}`, { status: novoStatus });
    toast('Status atualizado!', 'success');
    carregarProdutos();
  } catch (err) { toast(err.message, 'error'); }
}

window.calcPrecoVenda = calcPrecoVenda;
window.editarProduto  = editarProduto;
window.salvarProduto  = salvarProduto;
window.toggleStatus   = toggleStatus;
