// admin/js/pedidos.js
window.addEventListener('arenaLoaded', carregarPedidos);

async function carregarPedidos() {
  const tbody = document.getElementById('pedidosTbody');
  try {
    // Por enquanto mostra mensagem — endpoint de pedidos admin a implementar
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px">Em breve — funcionalidade de pedidos de produtos será exibida aqui.</td></tr>';
  } catch (err) { toast('Erro: ' + err.message, 'error'); }
}
