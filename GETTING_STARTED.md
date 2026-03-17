# 🚀 Guia de Início Rápido — QuadraJá MVP

**Para quem quer entrar e CLICAR rapidão**

---

## ⚡ 30 Segundos para Ver Funcionando

### Opção 1: Sem instalar nada
```bash
# Clique duas vezes em:
quadraja/html/login.html
```
✅ Abre direto no navegador. Pronto!

---

### Opção 2: Com servidor local (recomendado)

**Windows (PowerShell):**
```powershell
cd C:\Users\diego\OneDrive\Área de Trabalho\QuadraJa
npx serve .
# Ou se tiver Python:
python -m http.server 8000
```

**Mac/Linux:**
```bash
cd ~/Desktop/QuadraJa
npx serve .
# Ou
python3 -m http.server 8000
```

Acesse: `http://localhost:8000/html/login.html`

---

## 🎬 Fluxo de Demo (5 minutos)

### 1️⃣ LOGIN (30 segundos)

```
Email:   teste@email.com
Senha:   123456
```

Ou clique em **Google** / **Apple** para mock-login.

**O que testar:**
- ✅ Campo vazio = erro (⚠️ obrigatório)
- ✅ Email inválido = erro (⚠️ use @)
- ✅ Senha < 6 = erro
- ✅ Válido = animação ✓ Entrando!

---

### 2️⃣ ESCOLHER ARENA (1 minuto)

Clique em qualquer card (Arena Centro, Norte, etc.)

**O que testar:**
- ✅ Busca por nome (digita "Centro")
- ✅ Filtros (clica "Areia", "Piso", "Coberta")
- ✅ Estrela ⭐ para favoritar
- ✅ Card ficam destacado ao clicar

---

### 3️⃣ SELECIONAR QUADRA (1 minuto)

Veja a **planta SVG** — cada quadra é um retângulo:
- 🟢 Verde = disponível (clicável)
- 🔴 Vermelho = ocupada
- ⚫ Cinza = manutenção (não clica)

**O que testar:**
- ✅ Clicar em quad SVG → destaca card abaixo
- ✅ Clicar em card → destaca SVG
- ✅ Número de quadras muda por arena
  - Arena Centro = 6
  - Arena Norte = 2
  - Arena Coberta Sul = 4
  - Beach Sport Lapa = 3

---

### 4️⃣ AGENDAR HORÁRIOS (2 minutos)

#### Modo Avulso (padrão):

1. **Clique em um dia** no calendário (está desbloqueado hoje e futuros)
2. **Selecione múltiplos horários** (clique em 10:00, 14:00, 15:00...)
3. **Resumo atualiza** com preço total

**O que testar:**
- ✅ Dias passados = cinzentos (não clica)
- ✅ Dados passados = cinzentos
- ✅ Horários ocupados = riscados
- ✅ Preço = `horarios.length × preco`
- ✅ Botão "Ir para pagamento" só ativa com slots

#### Modo Mensal:

1. **Toggle** "Mensal 🔁"
2. **Escolha dia** (Seg, Ter, Qua, etc.)
3. **Escolha horário fixo**
4. **Preço fixo** = R$280

**O que testar:**
- ✅ Se já existe plano mensal terça 19h, outra terça 19h fica bloqueada
- ✅ Preço sempre R$280 (não muda)

---

### 5️⃣ PAGAMENTO (1 minuto)

Escolha de método:

**PIX:**
- QR code mock aparece
- Timer de 15 minutos (14:59)
- Botão "📋 Copiar código PIX"

**Cartão de Crédito/Débito:**
- Número do cartão com máscara (0000 0000 0000 0000)
- Validade MM/AA
- CVV é validado

**O que testar:**
- ✅ Máscara de entrada funciona
- ✅ Timer PIX decrementa
- ✅ Clicar "Pagar" = animação ⏳ Processando...
- ✅ Depois = ✓ Pago! (redireção em 600ms)

---

### 6️⃣ CONFIRMAÇÃO (30 segundos)

Vê:
- 🏐 Código único (ex: QJ-A3K7-2024)
- 📋 Botão copiar
- 📍 Endereço da arena
- 🗺️ Link Google Maps
- 📤 Compartilhar (Web Share)

**O que testar:**
- ✅ Copiar código funciona
- ✅ Google Maps abre
- ✅ Compartilhar = native share ou clipboard

---

### 7️⃣ MINHAS RESERVAS

Volta para locais → aba **Reservas**

Vê a reserva que acabou de fazer com status **✓ Confirmada**

**O que testar:**
- ✅ Reserva aparece na lista
- ✅ Detalhes estão corretos (arena, quadra, horários)
- ✅ Botão "Cancelar reserva" funciona
- ✅ Modal aviso aparece (com/sem estorno)

---

## 🎯 Testes Rápidos

### Testar Busca & Filtros

Na aba **Locais**:
```
Digita:      "centro"      → mostra só "Arena Centro"
Digita:      "beach"       → mostra "Beach Sport Lapa"
Clica filtro: "Areia"      → mostra só arenas com areia
Clica filtro: "Piso"       → mostra só piso
```

### Testar Cadastro

Clique em **"Cadastre-se grátis"** no login:

```
Nome:               Diego Silva
Email:              diego2@email.com
Telefone:           (11) 99999-0000   ← mascara
Data nascimento:    01/01/2001        ← valida 18+
Senha:              Teste@123         ← força: Muito Forte
Confirmar senha:    Teste@123
☑ Termos de Uso
☑ Confirmo ter 18+
(opcional) ☑ Receber promoções
```

Clique em **"Termos de Uso"** — abre modal com texto.

### Testar Cancelamento

Em **Minhas Reservas**:
- Clique "Cancelar reserva"
- Modal aparece com avisos:
  - Se **< 4 horas**: 🔴 **"Sem estorno"** (em vermelho)
  - Se **≥ 4 horas**: 🟢 **"Com estorno"** (em verde)
- Botão confirma cancelamento
- Reserva muda para **✗ Cancelada** na aba "Canceladas"

---

## 📱 Testar Responsividade

### Chrome DevTools

```
F12 → Ctrl+Shift+M (toggle device mode)
```

Teste em:
- **iPhone 12** (390px)
- **iPhone SE** (375px)
- **Samsung Galaxy S20** (360px)
- **iPad** (768px)
- **Desktop** (1920px)

Tudo deve funcionar perfeito!

---

## 🔍 Inspetor — Vendo localStorage

Abra DevTools (*F12*):

```
Application → Local Storage → http://localhost:8000/
```

Veja os dados salvos:
- `qj_user_name` — seu nome
- `qj_user_email` — seu email
- `qj_favoritos` — arenas favoritadas
- `qj_reservas` — suas reservas

Limpe localStorage:
```javascript
// No console (F12):
localStorage.clear()

// Depois F5 para recarregar
```

---

## 🐛 Se Algo Quebrar

### "Página em branco"
- Abra DevTools (F12 → Console)
- Procure por erros em vermelho
- Tira screenshot e manda

### "localStorage não carrega"
```javascript
// Console:
localStorage.clear()
location.reload()
```

### "Planta SVG não aparece"
- Abra `quadras.html`
- F12 → Console
- Procure por `Uncaught ReferenceError`
- Provavelmente `ARENA_DATA` não tá carregando

---

## ✅ Checklist de Demo

Para clientes/investidores:

- [ ] Login funciona
- [ ] Busca + filtros funcionam
- [ ] Planta SVG mostra quadras
- [ ] Seleção múltipla de horários
- [ ] Modo Avulso + Mensal
- [ ] Pagamento PIX (com timer)
- [ ] Confirmação com código
- [ ] Cancelamento com 4h check
- [ ] Responsividade (mobile/desktop)
- [ ] Favoritos (estrela)
- [ ] Avaliação pós-jogo

---

## 🎓 Dúvidas?

Verifique a documentação adicional:
- **[README.md](README.md)** — Visão geral do produto
- **[ANALISE_DETALHADA.md](ANALISE_DETALHADA.md)** — Análise técnica
- **[API_SPEC.md](./docs/API_SPEC.md)** — Endpoints que o backend vai ter
- **[vercel.json](vercel.json)** — Deploy no Vercel

---

**Pronto?** Clica em `html/login.html` e vem testar! 🚀
