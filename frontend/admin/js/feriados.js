// admin/js/feriados.js
window.addEventListener('arenaLoaded', carregarFeriados);

async function carregarFeriados() {
  const tbody = document.getElementById('feriadosTbody');
  try {
    // Endpoint de feriados a implementar no backend — placeholder
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px">Nenhum bloqueio cadastrado.</td></tr>';
  } catch (err) { toast('Erro: ' + err.message, 'error'); }
}

function toggleHoras() {
  const diaInteiro = document.getElementById('fDiaInteiro').checked;
  document.getElementById('horasGroup').style.display = diaInteiro ? 'none' : '';
}

async function salvarFeriado() {
  const data      = document.getElementById('fData').value;
  const descricao = document.getElementById('fDesc').value.trim();
  const tipo      = document.getElementById('fTipo').value;
  const diaInteiro= document.getElementById('fDiaInteiro').checked;
  const horaInicio= document.getElementById('fInicio').value || null;
  const horaFim   = document.getElementById('fFim').value   || null;

  if (!data || !descricao) { toast('Data e descrição são obrigatórios.', 'error'); return; }

  try {
    await api.post('/api/feriados', {
      arenaId: getArenaId(), data, descricao, tipo,
      diaInteiro, horaInicio, horaFim,
    });
    toast('Bloqueio cadastrado!', 'success');
    fecharModal('modalFeriado');
    carregarFeriados();
  } catch (err) { toast(err.message, 'error'); }
}

window.toggleHoras  = toggleHoras;
window.salvarFeriado = salvarFeriado;
