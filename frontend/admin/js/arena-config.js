// admin/js/arena-config.js
window.addEventListener('arenaLoaded', carregarConfigArena);

async function carregarConfigArena() {
  const arenaId = getArenaId();
  try {
    // Busca dados completos da arena pelo slug
    const arenas = await api.get('/arenas');
    const arena  = arenas.find(a => a.id === arenaId) || arenas[0];
    if (!arena) { toast('Arena não encontrada.', 'error'); return; }

    document.getElementById('aNome').value      = arena.nome || '';
    document.getElementById('aTelefone').value  = arena.telefone || '';
    document.getElementById('aEmail').value     = arena.email || '';
    document.getElementById('aEndereco').value  = arena.endereco || '';
    document.getElementById('aCidade').value    = arena.cidade || '';
    document.getElementById('aEstado').value    = arena.estado || '';
    document.getElementById('aAbertura').value  = arena.horarioAbertura || '07:00';
    document.getElementById('aFechamento').value= arena.horarioFechamento || '22:00';
    document.getElementById('aAntecedMin').value= arena.antecedenciaMinima || 2;
    document.getElementById('aCancelH').value   = arena.horasCancelamento || 4;
    document.getElementById('aProdutos').checked= arena.produtosHabilitados || false;
    document.getElementById('aDayuse').checked  = arena.dayuseHabilitado || false;

    window._arenaIdConfig = arenaId;
  } catch (err) { toast('Erro ao carregar arena: ' + err.message, 'error'); }
}

async function salvarArena() {
  const id = window._arenaIdConfig || getArenaId();
  try {
    await api.patch(`/api/admin/arena/${id}`, {
      nome:                document.getElementById('aNome').value.trim(),
      telefone:            document.getElementById('aTelefone').value.trim(),
      email:               document.getElementById('aEmail').value.trim(),
      endereco:            document.getElementById('aEndereco').value.trim(),
      cidade:              document.getElementById('aCidade').value.trim(),
      estado:              document.getElementById('aEstado').value.trim().toUpperCase(),
      horarioAbertura:     document.getElementById('aAbertura').value,
      horarioFechamento:   document.getElementById('aFechamento').value,
      antecedenciaMinima:  parseInt(document.getElementById('aAntecedMin').value),
      horasCancelamento:   parseInt(document.getElementById('aCancelH').value),
      produtosHabilitados: document.getElementById('aProdutos').checked,
      dayuseHabilitado:    document.getElementById('aDayuse').checked,
    });
    // Update stored arena name
    localStorage.setItem('qj_arena_nome', document.getElementById('aNome').value.trim());
    toast('Configurações salvas!', 'success');
  } catch (err) { toast('Erro: ' + err.message, 'error'); }
}

window.salvarArena = salvarArena;
