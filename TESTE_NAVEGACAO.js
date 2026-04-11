// 🧪 SCRIPT DE TESTE — Cole no Console do Navegador (F12)
// Para diagnosticar o problema de navegação

console.log('='.repeat(60));
console.log('🧪 INICIANDO DIAGNÓSTICO DE NAVEGAÇÃO QUADSRAJA');
console.log('='.repeat(60));

// ─────────────────────────────────────────────────────────────
// TESTE 1: Verificar página atual
// ─────────────────────────────────────────────────────────────
console.log('\n📄 INFORMAÇÃO DA PÁGINA:');
console.log('  URL:', window.location.href);
console.log('  Pathname:', window.location.pathname);
console.log('  Search:', window.location.search);

// ─────────────────────────────────────────────────────────────
// TESTE 2: Se está em quadras.html, ler parâmetros
// ─────────────────────────────────────────────────────────────
if (window.location.pathname.includes('quadras')) {
  console.log('\n📍 PÁGINA: quadras.html');
  const params = new URLSearchParams(location.search);
  const arenaId = params.get('arenaId');
  const arenaName = params.get('arena');
  
  console.log('  Parâmetro arenaId:', arenaId ? `✓ ${arenaId}` : '❌ NÃO ENCONTRADO');
  console.log('  Parâmetro arena:', arenaName ? `✓ ${arenaName}` : '⚠️ NÃO ENCONTRADO');
  
  if (!arenaId) {
    console.error('❌ ERRO: Não conseguir ler arenaId!');
  } else {
    console.log('✅ Parâmetros lidos corretamente!');
  }
}

// ─────────────────────────────────────────────────────────────
// TESTE 3: Se está em locais.html, testar carregamento de arenas
// ─────────────────────────────────────────────────────────────
if (window.location.pathname.includes('locais')) {
  console.log('\n📍 PÁGINA: locais.html');
  
  if (typeof arenasData !== 'undefined') {
    console.log(`  ✓ arenasData definida`);
    console.log(`  Total de arenas:', arenasData.length);
    
    if (arenasData.length === 0) {
      console.warn('⚠️ Nenhuma arena carregada!');
    } else {
      console.log('\n  Primeiras 3 arenas:');
      arenasData.slice(0, 3).forEach((a, i) => {
        console.log(`    [${i}] ${a.nome}`);
        console.log(`        ID: ${a.id ? '✓ ' + a.id : '❌ SEM ID'}`);
        console.log(`        Quadras: ${a.quadras?.length || 0}`);
      });
    }
  } else {
    console.error('❌ arenasData não está definida!');
  }
}

// ─────────────────────────────────────────────────────────────
// TESTE 4: Verificar API
// ─────────────────────────────────────────────────────────────
console.log('\n🌐 TESTE DE API:');
(async function() {
  try {
    const resp = await fetch('http://localhost:3001/api/arenas');
    const data = await resp.json();
    
    if (resp.ok) {
      console.log('  ✅ API respondendo (GET /api/arenas)');
      console.log(`  Arenas retornadas: ${Array.isArray(data) ? data.length : '?'}`);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`  Primeira arena:`);
        console.log(`    Nome: ${data[0].nome}`);
        console.log(`    ID: ${data[0].id ? '✓' : '❌'}`);
        console.log(`    Quadras: ${data[0].quadras?.length || 0}`);
      }
    } else {
      console.error(`  ❌ Erro na API: ${resp.status}`);
    }
  } catch (err) {
    console.error('  ❌ Não conseguir conectar à API:', err.message);
    console.error('     Verifique se o backend está rodando em http://localhost:3001');
  }
})();

// ─────────────────────────────────────────────────────────────
// TESTE 5: Verificar localStorage
// ─────────────────────────────────────────────────────────────
console.log('\n💾 INFORMAÇÃO DE ARMAZENAMENTO:');
const token = localStorage.getItem('qj_token');
const user = localStorage.getItem('qj_user_nome');
console.log('  Token:', token ? '✓ Presente' : '❌ Ausente');
console.log('  Usuário:', user ? `✓ ${user}` : '❌ Ausente');

// ─────────────────────────────────────────────────────────────
// TESTE 6: Testar navegação manual
// ─────────────────────────────────────────────────────────────
console.log('\n🔗 TESTE DE NAVEGAÇÃO:');
console.log('Execute no console para testar:');
console.log('  navTestarArena(): Simula click em uma arena da lista');
console.log('  navTestarFavorito(): Simula click em um favorito');

window.navTestarArena = function() {
  if (typeof arenasData !== 'undefined' && arenasData.length > 0) {
    const a = arenasData[0];
    const url = `./quadras.html?arenaId=${a.id}&arena=${encodeURIComponent(a.nome)}`;
    console.log('🔗 Redirecionando para:', url);
    window.location.href = url;
  } else {
    console.error('❌ Nenhuma arena disponível');
  }
};

window.navTestarFavorito = function() {
  if (typeof arenasData !== 'undefined' && arenasData.length > 0) {
    const a = arenasData[0];
    const url = `./quadras.html?arenaId=${a.id}&arena=${encodeURIComponent(a.nome)}`;
    console.log('🔗 Redirecionando para:', url);
    window.location.href = url;
  } else {
    console.error('❌ Nenhuma arena disponível');
  }
};

console.log('\n' + '='.repeat(60));
console.log('✅ DIAGNÓSTICO COMPLETO');
console.log('='.repeat(60));
