# 🔍 Diagnóstico: Problema de Navegação Locais → Quadras

## ✅ Problemas Identificados e Corrigidos

### **1. Caminhos de URL Inconsistentes** ❌ → ✅
**Arquivo:** `frontend/js/locais.js`

#### Antes (linha 251):
```javascript
onclick="window.location.href='/html/quadras.html?arenaId=${a.id}&arena=...'"
```
**Problema:** Caminho absoluto `/html/quadras.html` está incorreto quando a navegação é relativa.

#### Depois:
```javascript
href="./quadras.html?arenaId=${a.id}&arena=${encodeURIComponent(a.nome)}"
```
**Solução:** Caminho relativo `./` funciona a partir de `/html/`, além de usar `<a>` tag que é mais confiável.

---

### **2. Falta de Inicialização do quadras.js** ❌ → ✅
**Arquivo:** `frontend/js/quadras.js` (RECRIADO)

#### Antes:
- Arquivo vazio ou incompleto
- Não lia parâmetro `arenaId` da URL
- Não carregava dados da API

#### Depois:
- ✅ Lê `arenaId` via `URLSearchParams`
- ✅ Valida se `arenaId` existe
- ✅ Carrega quadras via `GET /arenas/{arenaId}/quadras`
- ✅ Renderiza quadras com botão "Reservar"
- ✅ Adiciona debug logs para diagnóstico

---

### **3. Falta de Validação de Dados** ❌ → ✅
**Arquivo:** `frontend/js/locais.js`

#### Melhorias Adicionadas:
```javascript
// Valida se cada arena tem um ID
arenasData.forEach((a, i) => {
  if (!a.id) {
    console.warn(`⚠️ Arena ${i} sem ID:`, a);
  } else {
    console.log(`✓ Arena ${i}: ID=${a.id}, Nome=${a.nome}`);
  }
});

// No render, garante ID antes de usar
if (!a.id) {
  console.warn('❌ Arena sem ID:', a);
  return '';
}
```

---

## 🧪 Como Testar

### **Teste 1: Verificar se locais carregam com IDs**
1. Abra `http://localhost:3000/html/locais.html`
2. Abra F12 (DevTools) → Console
3. Procure por logs:
   ```
   ✅ Resposta da API: [Array]
   📊 X arenas carregadas
   ✓ Arena 0: ID=abc123..., Nome=Arena Centro
   ```

### **Teste 2: Clicar em uma Arena**
1. Na página de locais, clique em qualquer arena
2. Verifique a URL que aparece na barra:
   ```
   http://localhost:3000/html/quadras.html?arenaId=abc123&arena=Arena+Centro
   ```
3. Procure por logs no console:
   ```
   📍 Arena ID: abc123
   📍 Arena Name: Arena Centro
   ⏳ Carregando quadras para arena: abc123
   ✅ Resposta da API: [Array]
   📊 X quadras carregadas
   ```

### **Teste 3: Verificar Favoritos**
1. Clique em ☆ para adicionar uma arena aos favoritos
2. Vá para aba "Favoritos"
3. Clique em um favorito
4. Verifique se a URL está correta com `arenaId`

---

## 🔧 Árvore de Navegação

```
locais.html (URL não tem parâmetros)
  ↓ (ao clicar em arena)
quadras.html?arenaId=UUID&arena=NomeArena
  ├─ Lê parâmetro arenaId via URLSearchParams
  ├─ Valida se arenaId existe
  ├─ Faz GET /api/arenas/UUID/quadras
  └─ Renderiza quadras com botão "Reservar"
      ↓ (ao clicar em "Reservar")
    horarios.html?arenaId=UUID&courtId=UUID&preco=XX
```

---

## 📊 Estrutura de Resposta da API

### GET `/api/arenas` (de locais.html)
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nome": "Arena Centro",
    "endereco": "Rua X, 100",
    "cidade": "São Paulo",
    "ativa": true,
    "quadras": [
      {
        "id": "...",
        "codigo": "A1",
        "tipo": "AREIA",
        "valorHora": 80,
        "status": "ATIVA"
      }
    ],
    "_count": {
      "quadras": 3
    }
  }
]
```

### GET `/api/arenas/{arenaId}/quadras` (de quadras.html)
```json
[
  {
    "id": "uuid",
    "arenaId": "uuid",
    "codigo": "A1",
    "nome": "Quadra 1",
    "tipo": "AREIA",
    "valorHora": 80,
    "valorMensal": 2000,
    "status": "ATIVA",
    "descricao": "Quadra coberta com telas..."
  }
]
```

---

## ⚠️ Se ainda não funcionar:

### 1️⃣ **Backend respondendo sem array?**
Se a API retorna dados em formato diferente, `quadras.js` trata:
```javascript
quadrasData = Array.isArray(resp) ? resp : (resp.quadras || resp.data || []);
```

### 2️⃣ **Verificar console do navegador (F12)**
- Procure por logs: `⏳`, `✅`, `❌`
- Se houver erro, a mensagem aparecerá em vermelho

### 3️⃣ **Limpar localStorage e cache**
```javascript
// No console, execute:
localStorage.clear();
location.reload();
```

### 4️⃣ **Verificar backend**
```bash
# Backend rodando em porta 3001?
curl http://localhost:3001/api/arenas
```

---

## 📁 Arquivos Corrigidos

| Arquivo | O que foi corrigido |
|---------|-------------------|
| `locais.js` | ✅ Validação de IDs, debug logs, padronização de caminhos relativos |
| `locais.js` (favoritos) | ✅ Mudou `/html/quadras.html` para `./quadras.html` |
| `quadras.js` | ✅ Recriado com leitura de `arenaId`, validação e renderização |

---

## 🎯 Próximos passos:

1. Teste a navegação locais → quadras
2. Verifique os logs no console
3. Se vier erro 404, certifique-se que a API está respondendo
4. Se vier erro de ID undefined, o backend está retornando dados sem o campo `id`

