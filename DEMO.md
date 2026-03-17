# 🎬 Roteiro de Demonstração — QuadraJá MVP

**Para apresentações a clientes/investidores | ~10-15 minutos**

---

## 📋 Checklist Pré-Demo

- [ ] Navegador limpo (sem histórico)
- [ ] localStorage limpo
- [ ] 2 abas abertas (uma para demo, outra de backup)
- [ ] Internet estável
- [ ] Áudio/vídeo funcionando (se virtual)
- [ ] Tela maximizada
- [ ] DevTools fechado(s)

---

## ⏱️ Timeline (10 min)

```
00:00 — 01:00   Login + Cadastro
01:00 — 02:30   Busca & Filtros
02:30 — 04:00   Seleção de Quadra (planta SVG)
04:00 — 06:00   Agendamento (Avulso + Mensal)
06:00 — 07:30   Pagamento
07:30 — 08:30   Confirmação
08:30 — 09:30   Minhas Reservas + Cancelamento
09:30 — 10:00   Perguntas & Casos de Uso
```

---

## 1️⃣ LOGIN & CADASTRO (1 minuto)

**Mensagem:** "Começamos com uma experiência de login simples e intuitiva"

### Tela: Login

```
🎯 Objetivo: Mostrar que o login é intuitive
⏱️ Tempo: 30 segundos
```

**Passo 1:** Mostre a tela de login

```
"Aqui você vê: Email, Senha, Toggle visibilidade,
Botões de OAuth (Google/Apple), e link para cadastro.
Tudo é responsivo, funciona em qualquer dispositivo."
```

**Passo 2:** Tente digitar email inválido (ex: "diego@")
- Campo fica vermelho com erro: "⚠️ Digite um e-mail válido"

**Passo 3:** Corrija para `teste@email.com`
- Erro some, campo fica normal

**Passo 4:** Deixe senha em branco
- Erro: "⚠️ A senha é obrigatória"

**Passo 5:** Digite `123456`
- Validação passa ✓

**Passo 6:** Clique "Entrar"
- Botão muda pra: "✓ Entrando!" (com animação)
- Redireciona para Hub principal

---

### Tela: Cadastro (Opcional - se tiver tempo)

```
🎯 Objetivo: Mostrar força de senha, validação de idade
⏱️ Tempo: 30 segundos (pular se tiver pouco tempo)
```

**Passo 1:** Na tela de login, clique "Cadastre-se grátis"

**Passo 2:** Preencha:
```
Nome:           Diego Silva
Email:          diego2@email.com
Telefone:       (11) 99999-0000        ← Mostra máscara automática
Data:           01/01/2001             ← Valida 18+ automaticamente
Senha:          Test@123               ← Mostra força em 5 níveis
Conf. Senha:    Test@123
☑ Termos de Uso
☑ Confirmo 18+
```

**Passo 3:** Clique em "Termos de Uso"
- Modal abre com texto real

**Passo 4:** Fecha modal, clica "Cadastrar"
- Mostra confirmação e volta para login

---

## 2️⃣ BUSCA & FILTROS (1.5 minuto)

**Mensagem:** "O hub principal mostra todas as arenas com informações essenciais"

### Tela: Locais (Principal)

```
🎯 Objetivo: Mostrar busca, filtros, favoritos reais
⏱️ Tempo: 1.5 minutos
```

**Passo 1:** Mostrar o Hub
```
"No topo, saudação personalizada: 'Olá, visitante 👋'
Abaixo, campo de busca + 4 filtros: Todos, Areia, Piso, Coberta
Então, lista de 4 arenas com cards informativos"
```

**Passo 2:** Clique em busca, digite "centro"
- Mostra apenas "Arena Centro"
- Contador muda: "1 local encontrado"

**Passo 3:** Limpe a busca
- Volta a mostrar 4

**Passo 4:** Clique filtro "Areia"
- Mostra: Arena Centro, Beach Sport Lapa (2 no total)

**Passo 5:** Clique filtro "Piso"
- Mostra: Arena Centro, Arena Norte, Arena Coberta Sul

**Passo 6:** Clique filtro "Todos"
- Volta a mostrar 4

**Passo 7:** Clique estrela ⭐ em "Arena Centro"
- Vira preta ☆ → depois ⭐ (togglea)

```
"Os favoritos ficam salvos e você pode visualizá-los
em uma aba separada chamada 'Favoritos'."
```

---

## 3️⃣ SELEÇÃO DE QUADRA (1.5 minuto)

**Mensagem:** "Este é o diferencial — uma planta SVG interativa"

### Tela: Quadras

```
🎯 Objetivo: Mostrar SVG dinâmico + cards sincronizados
⏱️ Tempo: 1.5 minutos
```

**Passo 1:** Clique em "Arena Centro"
- Redireciona para quadras.html
- Mostra título "Arena Centro - Escolha sua quadra"

**Passo 2:** Mostrar planta SVG
```
"Aqui você vê a planta da arena com todas as quadras.
Cada cor representa um status:
  🟢 Verde = Disponível (clicável)
  🔴 Vermelho = Ocupada naquele momento
  ⚫ Cinza = Em manutenção (não clica)"
```

**Passo 3:** Clique em uma quadra verde (ex: A1)
- Card em baixo fica destacado
- SVG também fica destacado

**Passo 4:** Clique em um card (ex: A2)
- SVG também ficaz destacado
- Mostra sincronização

**Passo 5:** Mude para outra arena (voltar + clicar Arena Norte)
```
"Note que o número de quadras muda:
Arena Centro = 6 quadras
Arena Norte = 2 quadras
Arena Coberta Sul = 4 quadras
Beach Sport Lapa = 3 quadras

Cada arena tem sua própria planta, atualizada dinamicamente."
```

**Passo 6:** Volte para "Arena Centro" + quadra "A1"
- Clique pra continuar

---

## 4️⃣ AGENDAMENTO (2 minutos)

**Mensagem:** "Duas formas de agendar: avulso (uma vez) ou mensal (recorrente)"

### Tela: Horários

```
🎯 Objetivo: Mostrar calendário + slots + dual mode
⏱️ Tempo: 2 minutos
```

**Passo 1:** Mostrar a tela com toggle
```
"Vê o toggle no topo: Avulso ↔ Mensal 🔁
Nós estamos em Avulso agora.
O calendário mostra apenas datas futuras:
  - Dias passados = bloqueados
  - Hoje = desbloqueado (se ainda tiver horários)
  - Futuros = todos disponíveis"
```

**Passo 2:** Clique em um dia futuro (ex: 20/03)
- Calendário destaca o dia
- Mostra slots disponíveis (07:00 até 21:00, sem lunch 12:00-14:00)

**Passo 3:** Clique em múltiplos horários
```
"Selecione 3 horários:
  ✓ 10:00
  ✓ 14:00
  ✓ 15:00

O resumo atualiza:
  Quadra: A1 · Arena Centro
  Data: 20 de março de 2026
  Horários: 10:00–11:00 · 14:00–15:00 · 15:00–16:00
  Total: R$240,00 (3h × R$80)"
```

**Passo 4:** Mude para "Mensal 🔁"
```
"Modo mensal é diferente:
  1º Escolha um dia da semana (fixa)
  2º Escolha um horário (fixo)
  3º Preço é sempre R$280"
```

**Passo 5:** Clique em "Qua" (Quarta)
- Mostra slots disponíveis

**Passo 6:** Clique em "19:00"
- Resumo muda:
```
Quadra: A1 · Arena Centro
Dia fixo: Quarta
Horário: 19:00
Total: R$280,00 MENSAL
```

**Passo 7:** Clique "Ir para pagamento"

```
"Note que o botão só ativa depois que você
seleciona horários — evita erros."
```

---

## 5️⃣ PAGAMENTO (1.5 minuto)

**Mensagem:** "3 formas de pagar — PIX, Crédito, Débito"

### Tela: Pagamento

```
🎯 Objetivo: Mostrar 3 métodos de pagamento
⏱️ Tempo: 1.5 minutos
```

**Passo 1:** Mostrar resumo no topo
```
"Card com icon 🏐, resumo da reserva:
  Quadra A1 · Arena Centro
  20/03/2026 · 10:00–11:00, 14:00–15:00 (2h)
  Total: R$160,00"
```

**Passo 2:** Mostrar 3 métodos de pagamento
```
"⚡ PIX — Aprovação instantânea
💳 Cartão de Crédito — Visa, Master, Elo
🏦 Cartão de Débito — Auto-debit"
```

**Passo 3:** Deixe PIX selecionado

```
"PIX mostra:
  • QR Code (mock)
  • Timer de 15 minutos (14:59)
  • Botão 'Copiar Código PIX'"
```

**Passo 4:** Clique "Copiar Código PIX"
- Botão muda: "✓ Código copiado!" (em verde)
- Volta a normal em 2.5s

**Passo 5:** (Optional) Mude para "Cartão de Crédito"

```
"Mostra campos:
  • Número do cartão (máscara: 0000 0000 0000 0000)
  • Validade (MM/AA)
  • CVV
  • Nome titular
Ao digitar, a máscara se aplica automaticamente."
```

**Passo 6:** Volte para PIX + clique "Pagar R$160,00"
- Botão muda: "⏳ Processando..."
- Depois: "✓ Pago!" (com gradiente)
- Redireciona para confirmação em 600ms

---

## 6️⃣ CONFIRMAÇÃO (1 minuto)

**Mensagem:** "Confirmação com código único, endereço e compartilhamento"

### Tela: Confirmação

```
🎯 Objetivo: Mostrar sucesso visual + código + ações
⏱️ Tempo: 1 minuto
```

**Passo 1:** Animação de entrada
```
"Anéis pulsando + checkmark no centro
Título: 'Reserva confirmada! Seu jogo está garantido 🏐'"
```

**Passo 2:** Mostrar código
```
"Código único: QJ-A3K7-2024
Card com aviso: 'Apresente este código na recepção'
Botão 📋 para copiar código"
```

**Passo 3:** Clique "📋" para copiar
- Muda para "✓" por 2s

**Passo 4:** Mostrar cards de detalhes

```
Card 1: Quadra
  🏟 Arena Centro · Quadra A1

Card 2: Data & Horários
  📅 Quarta, 20 de março de 2026
      10:00–11:00 · 14:00–15:00 (2h)

Card 3: Preço
  💰 R$160,00 · Pago via PIX · Aprovado agora

Card 4: Endereço
  📍 Rua das Palmeiras, 240 · Centro
  Botão "Mapa →" abre Google Maps
```

**Passo 5:** Mostrar ações bottom
```
"+ Nova reserva    → Volta para Locais
📤 Compartilhar    → Compartilha no WhatsApp/sociais"
```

**Passo 6:** Clique "+ Nova reserva"
- Volta para Locais

---

## 7️⃣ MINHAS RESERVAS + CANCELAMENTO (1 minuto)

**Mensagem:** "Histórico de reservas com filtros e cancelamento com validação"

### Tela: Locais → Aba "Reservas"

```
🎯 Objetivo: Mostrar histórico + cancelamento com 4h check
⏱️ Tempo: 1 minuto
```

**Passo 1:** Clique aba "Reservas" no bottom navigation

```
"Mostra a reserva que acabou de fazer:
  🏐 Arena Centro · Quadra A1
  20/03/2026 · 10:00–11:00, 14:00–15:00
  R$160,00
  ✓ Confirmada
  Botão: Cancelar reserva"
```

**Passo 2:** Clique "Cancelar reserva"

```
"Modal aparece com:
  Arena: Arena Centro · Quadra A1
  Data: 20/03/2026
  Horários: 10:00–11:00, 14:00–15:00
  Preço: R$160,00"
```

**Passo 3:** Mostrar lógica das 4 horas

```
"Se faltam MENOS de 4 horas:
  🔴 Banner vermelho
  'Cancelamento será processado MAS SEM REEMBOLSO'
  'Faltam apenas 1h30min para a reserva'

Se faltam MAIS de 4 horas:
  🟢 Banner verde
  'Estorno integral em 5 dias úteis'
  Botão: 'Confirmar cancelamento (com estorno)'"
```

**Passo 4:** Clique "Cancelar mesmo assim"
- Modal fecha
- Reserva muda de aba:
  - De "Confirmada"
  - Para "Cancelada"
- Pode ver na aba "Canceladas"

---

## 8️⃣ OUTROS (Opcional - se tiver tempo)

### Aba: Favoritos

```
"Mostra as arenas que você marcou com ⭐
Clique em qualquer uma → vai direto para quadras dessa arena"
```

### Aba: Perfil

```
"Mostra:
  Nome: Visitante
  Email: teste@email.com
  Avatar com primeira letra
  Contador de reservas
  Contador de favoritos
  Botão LOGOUT (limpa localStorage)"
```

---

## 🎯 Closing (1-2 minutos)

**Mensagem Final (customize conforme cliente):**

---

### Para Arenas (SaaS B2B):

```
"O QuadraJá permite que suas quadras funcionem 24/7.
Clientes reservam online, pagam antes de chegar.
Você recebe o dinheiro direto na conta.

Benefícios:
  ✓ Reduz administrativo em 80%
  ✓ Aumenta ocupação das quadras
  ✓ Evita no-shows (já pagou)
  ✓ Clientes satisfeitos (app fácil)

Preço? A gente conversa, mas é bem acessível.
Como funciona a integração? Fastinho!"
```

---

### Para Investidores:

```
"QuadraJá é um SaaS B2B em mercado não saturado.
700+ arenas em SP que ainda usam planilha.

TAM: 3.000+ arenas no Brasil
SAM: ~700 em SP + RJ + MG (early market)

MVP pronto, validado com UX excelente.
Model: R$299-599/mês por arena
CAC: ~R$2k (vendedor direto)
Payback: 2-3 meses

Próximas: Integração pagamentos, dashboard admin,
e expansão nacional."
```

---

### Para Devs/Tech Leads:

```
"Tech stack:
  Frontend: HTML5 + CSS3 + JS vanilla (zero deps)
  Data: localStorage (MVP), PostgreSQL + Prisma (production)
  Backend: Node.js + Fastify (fast!)
  Auth: JWT + OAuth (G/Apple)
  Payments: Stripe + PIX

MVP pronto para refactor em Next.js/React quando crescer.
Code bem estruturado, fácil onboarding.
Pronto para colaboração remota."
```

---

## ❓ Possíveis Perguntas & Respostas

### P: "Quanto custa para usar?"

**R:** "Pra arenas, a gente conversa, mas é modelo SaaS — começa em ~R$299/mês, sobe conforme features. Pra usuários final, é gratuito — a gente lucra com % de pgto ou mensalidades das arenas."

---

### P: "E se cair a internet no meio da reserva?"

**R:** "No MVP aqui não trata, mas em production vamos usar service workers (PWA) pra funcionar offline e sincronizar depois. Stripe também tem mecanismo pra isso."

---

### P: "Quando sai o app mobile?"

**R:** "Primeira fase é validar web em produção com 50-100 arenas. Depois, React Native pra iOS/Android. Estimado: Q4 2026."

---

### P: "Segurança? Dados pessoais?"

**R:** "MVP é demonstração — nada real. Em produção: HTTPS, JWT, encriptação de dados sensíveis, conformidade LGPD/PCI. Pagamentos via Stripe (nunca guardam cartão)."

---

### P: "Vocês cobram dos usuários finais?"

**R:** "Não, é grátis. Modelo é: cobrança das arenas + % no PIX/Stripe. Usuário final só paga a quadra (igual pagaria lá mesmo)."

---

## ✅ Pós-Demo

- [ ] Colete feedback no paper/nota
- [ ] Tire foto/vídeo do demo (se autorizado)
- [ ] Passe seu contato (email + WhatsApp)
- [ ] Agenda próxima reunião (roadmap + preços)
- [ ] Envie README + ANALISE_DETALHADA via email

---

**Boa apresentação! 🚀**
