# 🤝 Guia de Contribuição — Para o Backend

**Para quando o backend sair**

---

## Visão Geral

Este MVP frontend está **pronto para ser integrado com o backend**.

Quando você começar a desenvolver a API, use este guia para entender:
- Qual dados o frontend espera receber
- Qual estrutura de resposta devem ser
- Qual endpoints precisam ser criados

---

## 📋 Fluxo de Integração

### Fase 1: Separar dados do Frontend

**Hoje:** Dados estão hardcoded em `js/quadras.js`:
```javascript
const ARENA_DATA = {
  'Arena Centro': { courts: [...] },
  // ...
};
```

**Amanhã:** Virará um fetch:
```javascript
async function loadArenas() {
  const response = await fetch(`${API_URL}/api/arenas`);
  return response.json();
}
```

---

### Fase 2: Implementar autenticação

**Hoje:** Login é fake (qualquer email passa)

**Amanhã:** Login retorna JWT
```javascript
async function login(email, senha) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, senha })
  });
  const { token } = await response.json();
  localStorage.setItem('token', token);
}
```

---

### Fase 3: Usar endpoints reais

**Hoje:** Dados em localStorage

**Amanhã:** Chamadas à API
```javascript
// Buscar reservas
const response = await fetch(`${API_URL}/reservations`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Criar reserva
const response = await fetch(`${API_URL}/reservations`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ arena, court, tipo, data, horarios, preco })
});
```

---

## 🔌 Endpoints Esperados

Veja [API_SPEC.md](./docs/API_SPEC.md) para a lista completa.

Principais:

### Autenticação
```
POST   /auth/register
POST   /auth/login
POST   /auth/login/google
POST   /auth/login/apple
POST   /auth/refresh
```

### Arenas
```
GET    /api/arenas
GET    /api/arenas/:id
GET    /api/arenas/:id/courts
```

### Quadras
```
GET    /api/courts/:id
GET    /api/courts/:id/slots?date=2026-03-15
```

### Reservas
```
GET    /api/reservations
POST   /api/reservations
GET    /api/reservations/:id
PATCH  /api/reservations/:id/cancel
```

### Pagamento
```
POST   /api/payments/pix/create
POST   /api/payments/card/charge
GET    /api/payments/:id/status
```

---

## 💾 Estrutura de Dados

### User
```json
{
  "id": "uuid-123",
  "name": "Diego Silva",
  "email": "diego@email.com",
  "phone": "(11) 99999-0000",
  "birthDate": "1990-01-15",
  "createdAt": "2026-03-16T10:00:00Z",
  "favoriteArenas": ["arena-1", "arena-2"]
}
```

### Arena
```json
{
  "id": "arena-1",
  "name": "Arena Centro",
  "address": "Rua das Palmeiras, 240",
  "distance": 1.2,
  "rating": 4.8,
  "reviewCount": 47,
  "courts": ["court-1", "court-2", "..."],
  "operatingHours": {
    "start": "07:00",
    "end": "21:00"
  },
  "imageUrl": "https://..."
}
```

### Court
```json
{
  "id": "court-1",
  "label": "Quadra A1",
  "arenaId": "arena-1",
  "type": "areia|piso",
  "coverage": "coberta|descoberta",
  "pricePerHour": 80,
  "capacity": 12,
  "status": "available|maintenance"
}
```

### Reservation (Avulso)
```json
{
  "id": "QJ-1234567890",
  "userId": "user-1",
  "courtId": "court-1",
  "type": "avulso",
  "date": "2026-03-15",
  "slots": ["10:00", "11:00"],
  "totalPrice": 160,
  "status": "confirmada|concluida|cancelada",
  "paidAt": "2026-03-15T14:32:00Z",
  "cancelledAt": null,
  "refundAmount": null,
  "paymentMethod": "pix|card_credit|card_debit"
}
```

### Reservation (Mensal)
```json
{
  "id": "QJ-plan-123",
  "userId": "user-1",
  "courtId": "court-1",
  "type": "mensal",
  "weekday": "Ter",  // Segunda, Terça, Quarta, ...
  "time": "19:00",
  "validFrom": "2026-03-15",
  "validUntil": "2026-04-15",
  "totalPrice": 280,
  "status": "ativa|expirada|cancelada",
  "sessions": [
    { date: "2026-03-15", paidAt: "..." },
    { date: "2026-03-22", paidAt: "..." },
    // ...
  ]
}
```

---

## 🔐 Autenticação

### JWT Header
```javascript
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Payload
```json
{
  "userId": "user-123",
  "email": "diego@email.com",
  "iat": 1710576000,
  "exp": 1710662400
}
```

### Refresh
Token expira em 24h. Use `/auth/refresh` para renovar.

---

## ✅ Validações que o Backend Precisa

### User
- Email único
- Email válido (regex)
- Senha mínimo 6 caracteres
- Data de nascimento (mínimo 18 anos)

### Reservation
- **CRITICAL:** Validar `UNIQUE(court_id, date, start_time)` — previne double-booking
- Horário não pode ser no passado
- Horário deve ter pelo menos 2 horas de antecedência (mesmo dia)
- Preço DEVE ser recalculado no servidor (nunca confiar no frontend)

### Payment
- Amount confere com reservation
- Stripe/PIX retorna sucesso antes de marcar como pago
- Webhook de confirmação é implementado

---

## 🧪 Testes que o Backend Precisa

```javascript
// Testes críticos:

// 1. Não deixa double-booking
POST /reservations { courtId: 1, date: "2026-03-15", time: "10:00" }
// → 201 OK
POST /reservations { courtId: 1, date: "2026-03-15", time: "10:00" }
// → 409 Conflict (já existe)

// 2. Recalcula preço (não confia no frontend)
POST /reservations { ..., preco: 1 }
// Backend calcula: 80 * 2h = 160
// Salva 160, não 1

// 3. Cancela com validação de 4h
PATCH /reservations/id/cancel
// Se < 4h: 422 Cannot refund, mark as cancelled
// Se >= 4h: 200 OK, inicia reembolso

// 4. Plano mensal bloqueia slots recorrentes
POST /reservations { type: "mensal", weekday: "Ter", time: "19:00" }
// Toda terça às 19h fica bloqueada
```

---

## 📦 Estrutura Recomendada (Backend)

```
backend/
├── src/
│   ├── auth/
│   │   ├── routes.ts
│   │   ├── controller.ts
│   │   └── service.ts
│   ├── arenas/
│   │   ├── routes.ts
│   │   └── service.ts
│   ├── courts/
│   │   ├── routes.ts
│   │   └── service.ts
│   ├── reservations/
│   │   ├── routes.ts
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   └── validator.ts
│   ├── payments/
│   │   ├── routes.ts
│   │   ├── service.ts
│   │   └── gateway.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── main.ts
├── migrations/
│   └── 001_initial_schema.sql
├── prisma/
│   └── schema.prisma
└── package.json
```

---

## 🚀 Checklist de Implementação

Backend:
- [ ] Criar migrate de usuários
- [ ] Criar migrate de arenas/quadras
- [ ] Criar migrate de reservas
- [ ] Implementar JWT
- [ ] Criar endpoints GET /arenas, GET /courts/:id
- [ ] Criar POST /reservations com validação UNIQUE
- [ ] Criar PATCH /reservations/:id/cancel
- [ ] Criar /auth/login, /auth/register
- [ ] Integrar Stripe (payment)
- [ ] Integrar PIX (nexo, modern, etc)
- [ ] Testes de double-booking
- [ ] Testes de preço (recalculo)

Frontend:
- [ ] Remover ARENA_DATA hardcoded
- [ ] Criar `api/client.js` com fetch wrapper
- [ ] Integrar autenticação real
- [ ] Conectar todos os endpoints
- [ ] Testes end-to-end

---

## 📞 Dúvidas?

Veja a análise detalhada em [ANALISE_DETALHADA.md](../ANALISE_DETALHADA.md) para entender os problemas técnicos que o backend precisa resolver.

---

**Boa sorte! 🚀**
