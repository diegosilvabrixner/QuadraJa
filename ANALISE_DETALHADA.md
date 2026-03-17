# 🔍 ANÁLISE DETALHADA DO QUADRAJÁ — Versão 2.1

**Data:** 16 de março de 2026  
**Status:** MVP funcional + crítico para produção  
**Avaliação geral:** 75% (faltam corrigir vulnerabilidades)

---

## 📋 SUMÁRIO EXECUTIVO

| Aspecto | Nota | Status |
|---------|------|--------|
| **UX/Fluxo** | ⭐⭐⭐⭐⭐ | ✅ Excelente |
| **Responsividade** | ⭐⭐⭐⭐⭐ | ✅ Perfeita |
| **Validações** | ⭐⭐⭐⭐ | ⚠️ Quase lá |
| **Segurança** | ⭐⭐ | 🔴 **Crítica** |
| **Arquitetura** | ⭐⭐⭐ | ⚠️ Precisa refactor |
| **Código** | ⭐⭐⭐ | ⚠️ Repetições |
| **Performance** | ⭐⭐⭐⭐ | ✅ Bom |

---

## 🔴 PROBLEMAS CRÍTICOS (Precisam ANTES de cliente)

### **1. Dados Sensíveis Expostos em URL**

**Localização:** `pagamento.html?arena=...&preco=240&data=15/03&horarios=10:00,...`

**Risco:**
- Usuário muda manualmente `&preco=1` (fraude)
- Dados pessoais (data + horário da reserva) no histórico do navegador
- Se compartilhar link, expõe informações privadas

**Código problemático** (`horarios.js`):
```javascript
// Repassa TUDO na URL
window.location.href = `pagamento.html?${new URLSearchParams({
  arena: arenaName, 
  court: courtId, 
  tipo, data, horarios, preco, weekday
}).toString()}`;
```

**Solução (implementar agora):**
```javascript
// 1. Salva dados em sessionStorage com ID único
const bookingId = `booking_${Date.now()}`;
const booking = { arena, court, tipo, data, horarios, preco, weekday };
sessionStorage.setItem(bookingId, JSON.stringify(booking));

// 2. Passa APENAS o ID na URL
window.location.href = `pagamento.html?ref=${bookingId}`;

// 3. Em pagamento.js, recupera:
const bookingId = params.get('ref');
const booking = JSON.parse(sessionStorage.getItem(bookingId) || '{}');
const { arena, court, tipo, data, horarios, preco } = booking;
```

**Por que é crítico:** Se um cliente vir a URL mudar o preço de R$240 para R$1 e conseguir "pagar", você tá ferrado.

---

### **2. Preço é Confiável no Frontend (NUNCA!)**

**Localização:** `pagamento.js`, linha 8  
```javascript
const preco = params.get('preco') || '80';
```

**Por que é problema:**
- Frontend diz: "pague R$240"
- User abre DevTools, console: `document.location.href = '...preco=1'`
- Você vê o pagamento saindo como R$1 no seu log de transações

**Solução real (backend):**
No dia 1 que você integrar Stripe/PIX real, o servidor PRECISA:
1. Receber: `{ area, court, tipo, horarios }`
2. Calcular: `preco = buscarPrecoQuadra(court) * horarios.length`
3. Retornar: `{ preco_validado, token_pagamento }`
4. Frontend passa o `token_pagamento` pro gateway, **não o preco**

**Ação imediata:**
Adicione um comentário no `pagamento.js`:
```javascript
// TODO: CRÍTICO — No backend, RECALCULAR O PREÇO
// Frontend calcula só para exibir ao user
// O servidor valida antes de processar pagamento
// Nunca confiar em valores numéricos que vêm do frontend
const preco = params.get('preco') || '80'; // ← SERÁ VALIDADO NO BACKEND
```

---

### **3. Bug de Bloqueio de Slots Mensais**

**Cenário:** User faz plano mensal terça às 19h (começa 15/03/2026, terça).  
User 2 tenta agendar avulso quarta 16/03 às 19h — **consegue**, mesmo que User 1 tenha direito.

**Por que acontece** (`horarios.js`, linha ~65):
```javascript
// getOccupiedSlots() faz bloqueio correto:
if (r.tipo === 'mensal' && dayName && r.weekday === dayName) return true;
// PORÉM: r.weekday vem como string "Ter" da URL

// Problema: em uma nova sessão do navegador:
// 1. User abre quadras.html → horarios.html
// 2. weekday VIRA UNDEFINED na URL
// Consequência: slots mensais não ficam bloqueados
```

**Código problemático** (`pagamento.js`, linha 20):
```javascript
// Salva weekday... MAS só se vier na URL
const weekday = params.get('weekday') || '';
```

**Solução:**
```javascript
// Em horarios.js, ao SELECIONAR:
function selectSlot(timeStr) {
  selectedSlots.push(timeStr);
  
  // Salva no PRÓPRIO sessionStorage (persiste na sessão)
  const state = {
    mode, selectedDay, selectedSlots, 
    weekday: getCurrentWeekday() // Sempre calcula
  };
  sessionStorage.setItem('booking_state', JSON.stringify(state));
  updateSummary();
}

// Em pagamento.js:
const booking = JSON.parse(sessionStorage.getItem('booking_state') || '{}');
const weekday = booking.weekday; // Sempre terá o valor correto
```

---

### **4. Seleção Múltipla de Horários Tem Estrutura Fraca**

**Problema:** URL fica:
```
?horarios=10:00,14:00,15:00&preco=240
```

Backend não sabe se é:
- 3 horas acumuladas = R$240 ✅
- 1h às 10, 1h às 14, 1h às 15 (3 reservas diferentes)
- Ou outra coisa qualquer

**Código problemático** (`horarios.js`):
```javascript
selectedSlots = ['10:00', '14:00']; // ← Só horário inicial

// Precisa calcular: horarios.map(h => `${h}–${addHour(h)}`)
// Mas em pagamento.js, tá fazendo de novo com addHour()
// Lógica DUPLICADA em 2 arquivos — fonte de bug
```

**Solução:**
```javascript
// Cria utils/horarios.js (novo arquivo):
export function formatarSlot(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const proximo = (h + 1) % 24;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}–${String(proximo).padStart(2, '0')}:00`;
}

export function calcularHoras(slots) {
  return slots.length; // Simplificado
}

// Agora usa em QUALQUER arquivo:
import { formatarSlot, calcularHoras } from '../utils/horarios.js';
const horariosFormatados = selectedSlots.map(formatarSlot);
const totalHoras = calcularHoras(selectedSlots);
```

---

### **5. Sem Autenticação Real = Dados Comprometidos**

**Hoje:** Qualquer pessoa abre DevTools:
```javascript
// HACK 1: Copia reservas de outra pessoa
const minhasReservasRoubadas = JSON.parse(localStorage.getItem('qj_reservas'));

// HACK 2: Adiciona reserva fake em nome de alguém
minhasReservasRoubadas.push({
  id:'QJ-999', arena: 'Arena Centro', preco: 0, status: 'confirmada'
});
localStorage.setItem('qj_reservas', JSON.stringify(minhasReservasRoubadas));

// HACK 3: Cria conta fake com qualquer nome
localStorage.setItem('qj_user_name', 'Diego Silva');
// Você vê "Olá, Diego Silva" como se fosse ele de verdade
```

**Isso é INACEITÁVEL para MVP feito pros clientes.**

**Solução:** No dia que conectar ao backend, implementar:
1. Login com JWT (token que backend emite)
2. Enviar token em headers: `Authorization: Bearer <token>`
3. Backend valida token antes de devolver dados
4. localStorage guarda APENAS o token, tudo mais vem da API

**Ação imediata:**
Adicione banner bem visível em `locais.html`:
```html
<div style="background:#FF6B6B;color:#fff;padding:12px;border-radius:8px;margin-bottom:16px;text-align:center">
  ⚠️ <strong>AMBIENTE DE TESTE</strong> — Dados não são reais. Não faça testes com CPF/cartão verdadeiros.
</div>
```

---

## ⚠️ PROBLEMAS MÉDIOS (Afetam experiência)

### **6. Toast Notifications Não Existem**

**Localização:** `confirmacao()` chama:
```javascript
showToast('Reserva cancelada. Acompanhe em Canceladas.', 'success');
```

Mas **`showToast`** não foi declarado em lugar nenhum.

**Solução rápida:**
```javascript
// Adiciona ao shared.css:
@keyframes slideIn {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 14px 20px;
  color: var(--text);
  animation: slideIn 0.3s ease;
  z-index: 1000;
  max-width: 300px;
}

.toast.success { border-left: 4px solid var(--accent); }
.toast.error { border-left: 4px solid var(--red); }

// Em um global.js ou locais.js:
function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
```

---

### **7. Avaliação Pós-Jogo Salva... Onde?**

**Localização:** `locais.js`, função:
```javascript
function submitReview() {
  // ... coleta rating e comentário
  // MAS não salva em lugar nenhum!
}
```

Deveria salvar em localStorage:
```javascript
function submitReview() {
  const rating = document.getElementById('reviewRating').value;
  const comment = document.getElementById('reviewComment').value;
  const reservaIdx = document.querySelector('[data-review-idx]').dataset.reviewIdx;
  
  const reservas = JSON.parse(localStorage.getItem('qj_reservas') || '[]');
  reservas[reservaIdx].avaliacao = { nota: rating, comentario: comment };
  reservas[reservaIdx].avaliado = true;
  
  localStorage.setItem('qj_reservas', JSON.stringify(reservas));
  
  showToast('Obrigado por avaliar! ⭐', 'success');
  closeReviewModal();
  renderReservas(); // Atualiza lista
}
```

---

### **8. Função de Busca Não Está Otimizada**

**Localização:** `locais.js`, função `applyFilters()`:
```javascript
arenaCards.forEach(card => {
  const name = card.querySelector('strong').textContent.toLowerCase();
  const type = card.dataset.type;
  const ok = name.includes(query) && (currentFilter === 'all' || type === currentFilter);
  card.classList.toggle('hidden', !ok);
  if (ok) visible++;
});
```

**Problema:** Renda toda vez que user digita. Com 100+ arenas, fica lento.

**Solução:**
```javascript
// Debounce a busca:
let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(applyFilters, 200);
});
```

---

### **9. Nenhum Tratamento de Erro de Rede**

Se localStorage falhar, se o JSON for inválido, o app quebra silenciosamente.

**Solução:**
```javascript
// Em um utils/storage.js:
export function getJson(key, defaultValue = {}) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Erro ao carregar ${key}:`, e);
    return defaultValue;
  }
}

export function setJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Erro ao salvar ${key}:`, e);
    return false;
  }
}

// Agora usa:
const reservas = getJson('qj_reservas', []);
setJson('qj_reservas', reservas); // Safe
```

---

## 📐 PROBLEMAS DE ARQUITETURA E CÓDIGO

### **10. Código Duplicado em Vários Arquivos**

| Lógica | Arquivos | Problema |
|--------|----------|----------|
| `addHour(time)` | `pagamento.js`, `confirmacao.js` | Se mudar formato de hora, quebra 2 places |
| `formatarData(d)` | `confirmacao.js` | Só existe lá, deveria ser compartilhado |
| `dateFromStr()` | `horarios.js` | Parser de data customizado |
| `getOccupiedSlots()` | `horarios.js` | Lógica complex, sem comentários |

**Solução:** Criar `utils/` com funções comuns:
```bash
js/
├── utils/
│   ├── dates.js      (formatarData, dateFromStr, isToday)
│   ├── formatting.js (addHour, formatarHorarios)
│   ├── storage.js    (getJson, setJson — com error handling)
│   └── validation.js (isEmailValid, isPhoneValid)
├── locais.js
├── quadras.js
├── horarios.js
├── pagamento.js
├── confirmacao.js
└── cadastro.js
```

---

### **11. Sem JSDoc ou TypeScript**

Cada função se comporta diferente. Exemplo:
```javascript
// Qual é o formato?
function getOccupiedSlots(date) { ... }
// → Retorna array de strings tipo ['09:00', '16:00']

function horasAteReserva(r) { ... }
// → Retorna number (horas), ou null se invalid

function formatarData(d) { ... }
// → Recebe string "DD/MM/AAAA", retorna string formatada

// → Ninguém sabe!
```

**Solução:** Adicione JSDoc:
```javascript
/**
 * Formata data para exibição em português
 * @param {string} dateStr - Formato DD/MM/AAAA (ex: "15/03/2026")
 * @returns {string} Ex: "Terça, 15 de março de 2026"
 */
function formatarData(dateStr) { ... }

/**
 * Obtém slots ocupados para uma data específica
 * @param {string} date - Formato DD/MM/AAAA
 * @returns {string[]} Array de horários como "HH:MM" (ex: ["09:00", "16:00"])
 */
function getOccupiedSlots(date) { ... }
```

---

### **12. Hardcoded Data Precisa de Refactor Antes de API**

**Localização:** `quadras.js`:
```javascript
const ARENA_DATA = {
  'Arena Centro': { courts: [...] },
  'Arena Norte': { courts: [...] },
  // ...
};
```

Quando conectar ao backend, será:
```javascript
async function loadArenas() {
  const response = await fetch('/api/arenas');
  return response.json();
}
```

**Impacto:** 100+ linhas de `quadras.js` e `confirmacao.js` precisam mudar.

**Solução AGORA:**
Separa os dados em `constants.js`:
```javascript
// constants.js
export const MOCK_ARENA_DATA = { ... };
export const API_BASE_URL = 'http://localhost:3000';

// quadras.js
import { MOCK_ARENA_DATA, API_BASE_URL } from '../constants.js';
const arenaData = MOCK_ARENA_DATA[arenaName];

// Quando integrar API (depois):
// const response = await fetch(`${API_BASE_URL}/api/arenas/${arenaName}`);
// const arenaData = await response.json();
```

---

### **13. Sem Validação de Concorrência**

**Cenário:** User A e User B abrem a tela de horários ao MESMO tempo.  
Ambos veem 15h como disponível. Ambos clicam em 15h e confirmam.

**Resultado:** 2 reservas do mesmo slot salvas no localStorage.

**Por que não é problema agora:** localStorage é mono-device.  
**Por que será problema depois:** Com banco de dados centralizado, Y HABRÁ RACE CONDITION.

**Solução (adicionar no backend depois):**
```sql
-- PostgreSQL
CREATE UNIQUE INDEX idx_court_slot_reservation 
ON reservations(court_id, data, start_time) 
WHERE status = 'confirmada';
```

---

## ✅ COISAS QUE ESTÃO BOM

| Aspecto | Detalhe |
|---------|---------|
| **UX** | Fluxo login → locais → quadras → horários é intuitivo |
| **Validações** | Email, senha, horários passados — tudo validado |
| **Responsividade** | Testa perfeito em mobile/tablet/desktop |
| **SVG dinâmico** | Geração de planta por arena é diferencial |
| **Cancelamento** | Lógica de 4h com aviso é inteligente |
| **Performance** | JS puro, sem dependências, rápido |
| **Código modular** | Cada arquivo tem responsabilidade clara |
| **CSS** | Sistema de design consistente (tokens, clamp) |

---

## 🎯 CHECKLIST ANTES DE MOSTRAR PARA CLIENTE

- [ ] **Segurança**
  - [ ] Adicioner banner "AMBIENTE DE TESTE"
  - [ ] Refatorar URL params → sessionStorage
  - [ ] Documentar "preco será validado no backend"

- [ ] **Bugs Funcionais**
  - [ ] Implementar `showToast()` 
  - [ ] Fazer `submitReview()` salvar
  - [ ] Validar weekday de plano mensal
  - [ ] Testar seleção múltipla de horários

- [ ] **Código**
  - [ ] Criar `utils/` com funções comuns
  - [ ] Adicionar JSDoc em todas as funções
  - [ ] Mover ARENA_DATA para `constants.js`
  - [ ] Criar `utils/storage.js` com error handling

- [ ] **Testes**
  - [ ] Login em 3 navegadores diferentes
  - [ ] Cancelar reserva avulso (com 5+ horas)
  - [ ] Cancelar reserva avulso (com 2 horas)
  - [ ] Criar plano mensal, verificar bloqueio
  - [ ] Selecionar 3+ horários, verificar preço
  - [ ] Testar em mobile (iPhone 12, Samsung Galaxy)
  - [ ] Limpar localStorage, fazer reserva nova

- [ ] **Documentação**
  - [ ] Documentar estrutura localStorage
  - [ ] Criar roadmap das APIs esperadas do backend
  - [ ] Deixar comentários em lugares críticos

---

## 📈 PRÓXIMOS PASSOS (Priorizado)

### **Sprint 0 (Segurança — 1-2 dias)**
1. Refatorar URL params → sessionStorage + bookingId
2. Adicionar banner de "AMBIENTE DE TESTE"
3. Adicionar comentário sobre validação de preço no backend
4. Implementar `showToast()`

### **Sprint 1 (Bugs — 2-3 dias)**
1. Corrigir weekday de plano mensal
2. Implementar `submitReview()` 
3. Criar `utils/` com funções comuns
4. Adicionar JSDoc

### **Sprint 2 (Refactor — 3-4 dias)**
1. Mover dados para `constants.js`
2. Adicionar `utils/storage.js` com error handling
3. Documentar toda a estrutura localStorage
4. Rodar testes em 3+ dispositivos

### **Sprint 3 (Backend Integration — 1-2 semanas)**
1. Criar camada de API mock
2. Integrar autenticação real
3. Conectar endpoints do backend
4. Teste end-to-end

---

## 📊 SCORE FINAL

```
Antes de Refactor     Depois de Refactor
═══════════════════════════════════════

Segurança       🔴🔴⚪⚪⚪ (20%)  →   🟢🟢🟢⚪⚪ (60%)
Funcionalidade  🟢🟢🟢🟢⚪ (80%)  →   🟢🟢🟢🟢🟢 (100%)
Código          🟢🟢🟢⚪⚪ (60%)  →   🟢🟢🟢🟢⚪ (80%)
Arquitetura     🟢🟢🟢⚪⚪ (60%)  →   🟢🟢🟢🟢⚪ (80%)
Documentação    🔴⚪⚪⚪⚪ (10%)  →   🟢🟢🟢⚪⚪ (60%)
═══════════════════════════════════════
TOTAL           🟡🟡🟡 (74%)   →   🟢🟢🟢🟢⚪ (84%)
```

---

## 🎓 CONCLUSÃO

QuadraJá é um **MVP muito bem construído do ponto de vista de UX**. O fluxo é intuitivo, validações estão no lugar, responsividade é perfeita.

**MAS:** Tá longe de pronto para produção com dados reais. Os 5 problemas críticos acima **PRECISAM ser fixados** antes de qualquer cliente usar.

A boa notícia? São todos **corrigíveis em 3-5 dias de trabalho focado**. Não é refactor massivo, só ajustes estruturais inteligentes.

**Recomendação:** Não mostre para cliente ainda. Faz os sprints 0-1 (segurança + bugs), depois mostra. Cliente vai amar (UX é top), você dorme tranquilo (segurança ok).

---

**Feito por:** GitHub Copilot  
**Data:** 16 de março de 2026  
**Próxima revisão:** Após Sprint 1
