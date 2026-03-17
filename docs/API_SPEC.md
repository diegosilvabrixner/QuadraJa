# 📡 Especificação de API — QuadraJá Backend

**Endpoints esperados do backend | para development planning**

---

## 🔗 Base URL

```
Development:  http://localhost:3000
Staging:      https://api-staging.quadraja.com
Production:   https://api.quadraja.com
```

---

## 🔐 Autenticação

### POST `/auth/register`

Cadastro de novo usuário.

**Request:**
```json
{
  "name": "Diego Silva",
  "email": "diego@email.com",
  "phone": "(11) 99999-0000",
  "birthDate": "1990-01-15",
  "password": "Teste@123"
}
```

**Response (201):**
```json
{
  "id": "user-uuid-123",
  "name": "Diego Silva",
  "email": "diego@email.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Errors:**
- `400` Email já existe
- `422` Idade < 18

---

### POST `/auth/login`

Login com email/senha.

**Request:**
```json
{
  "email": "diego@email.com",
  "password": "Teste@123"
}
```

**Response (200):**
```json
{
  "id": "user-uuid-123",
  "name": "Diego Silva",
  "email": "diego@email.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Errors:**
- `401` Email/senha inválidos
- `429` Rate limit (max 5 tentativas/5min)

---

### POST `/auth/login/google`

Login com Google (OAuth).

**Request:**
```json
{
  "idToken": "google-token-xyz"
}
```

**Response (200):**
```json
{
  "id": "user-uuid-123",
  "name": "Diego Silva",
  "email": "diego@gmail.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

---

### POST `/auth/refresh`

Renovar token expirado.

**Headers:**
```
Authorization: Bearer {expired_token}
```

**Response (200):**
```json
{
  "token": "new-token-xyz",
  "expiresIn": 86400
}
```

---

## 🏟 Arenas

### GET `/api/arenas`

Lista todas as arenas.

**Query params:**
- `search` (string) — filtro por nome
- `limit` (number) — default: 50
- `offset` (number) — default: 0

**Response (200):**
```json
{
  "data": [
    {
      "id": "arena-1",
      "name": "Arena Centro",
      "address": "Rua das Palmeiras, 240",
      "distance": 1.2,
      "rating": 4.8,
      "reviewCount": 47,
      "imageUrl": "https://...",
      "courtCount": 6,
      "operatingHours": {
        "start": "07:00",
        "end": "21:00"
      }
    }
  ],
  "total": 4,
  "limit": 50,
  "offset": 0
}
```

---

### GET `/api/arenas/:id`

Detalhes de uma arena.

**Response (200):**
```json
{
  "id": "arena-1",
  "name": "Arena Centro",
  "address": "Rua das Palmeiras, 240",
  "phone": "(11) 3000-1111",
  "email": "contato@arenacentro.com.br",
  "distance": 1.2,
  "rating": 4.8,
  "reviewCount": 47,
  "imageUrl": "https://...",
  "courts": [
    {
      "id": "court-1",
      "label": "Quadra A1",
      "type": "areia",
      "coverage": "coberta",
      "pricePerHour": 80,
      "capacity": 12
    }
  ],
  "operatingHours": {
    "start": "07:00",
    "end": "21:00"
  },
  "amenities": ["Vestiário", "Chuveiro", "Estacionamento", "Lanchonete"]
}
```

---

### GET `/api/arenas/:id/courts`

Quadras de uma arena.

**Response (200):**
```json
{
  "arenaId": "arena-1",
  "arenaName": "Arena Centro",
  "courts": [
    {
      "id": "court-1",
      "label": "Quadra A1",
      "type": "areia",
      "coverage": "coberta",
      "pricePerHour": 80,
      "capacity": 12,
      "status": "available"
    },
    {
      "id": "court-2",
      "label": "Quadra A2",
      "type": "areia",
      "coverage": "descoberta",
      "pricePerHour": 80,
      "capacity": 12,
      "status": "occupied"
    }
  ]
}
```

---

## 🏐 Quadras

### GET `/api/courts/:id`

Detalhes de uma quadra.

**Response (200):**
```json
{
  "id": "court-1",
  "label": "Quadra A1",
  "arenaId": "arena-1",
  "type": "areia",
  "coverage": "coberta",
  "pricePerHour": 80,
  "capacity": 12,
  "status": "available",
  "lastMaintenance": "2026-03-01",
  "nextMaintenance": null
}
```

---

### GET `/api/courts/:id/slots`

Horários disponíveis de uma quadra em uma data.

**Query params:**
- `date` (required, string YYYY-MM-DD) — a data
- `type` (string) — `avulso` ou `mensal`, default: `avulso`
- `weekday` (string) — se `type=mensal`, qual dia (Ter, Qua, etc.)

**Response (200):**
```json
{
  "courtId": "court-1",
  "date": "2026-03-15",
  "pricePerHour": 80,
  "slots": [
    {
      "time": "07:00",
      "available": true,
      "occupied": false
    },
    {
      "time": "08:00",
      "available": true,
      "occupied": false
    },
    {
      "time": "09:00",
      "available": false,
      "occupied": true,
      "reservedBy": "Another User"
    }
  ],
  "minimumAdvance": 120  // minutos
}
```

---

## 📅 Reservas

### GET `/api/reservations`

Lista reservas do user autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Query params:**
- `status` (string) — `confirmada`, `concluida`, `cancelada`
- `type` (string) — `avulso`, `mensal`
- `limit` (number) — default: 20
- `offset` (number) — default: 0

**Response (200):**
```json
{
  "data": [
    {
      "id": "QJ-1234567890",
      "courtId": "court-1",
      "arenaId": "arena-1",
      "arenaName": "Arena Centro",
      "courtLabel": "Quadra A1",
      "type": "avulso",
      "date": "2026-03-15",
      "slots": ["10:00", "11:00", "14:00"],
      "totalPrice": 240,
      "status": "confirmada",
      "paidAt": "2026-03-15T14:32:00Z",
      "paymentMethod": "pix",
      "cancelledAt": null,
      "refundAmount": null,
      "rating": null
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

---

### POST `/api/reservations`

Criar nova reserva.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request (Avulso):**
```json
{
  "courtId": "court-1",
  "type": "avulso",
  "date": "2026-03-15",
  "slots": ["10:00", "11:00", "14:00"],
  "paymentMethod": "pix"
}
```

**Request (Mensal):**
```json
{
  "courtId": "court-1",
  "type": "mensal",
  "weekday": "Ter",
  "time": "19:00",
  "validFrom": "2026-03-15",
  "validUntil": "2026-04-15",
  "paymentMethod": "card_credit"
}
```

**Response (201):**
```json
{
  "id": "QJ-1234567890",
  "courtId": "court-1",
  "type": "avulso",
  "date": "2026-03-15",
  "slots": ["10:00", "11:00", "14:00"],
  "totalPrice": 240,
  "status": "awaiting_payment",
  "paymentData": {
    "method": "pix",
    "brcode": "00020126580014br.gov.bcb...",
    "qrCode": "https://...",
    "expiresAt": "2026-03-15T14:45:00Z"
  }
}
```

**Errors:**
- `409` Slot já reservado (double-booking)
- `422` Horário inválido (no passado, < 2h antecedência)
- `422` Usuário já tem reserva neste slot (mensal)

---

### PATCH `/api/reservations/:id/confirm`

Confirmar pagamento.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "paymentId": "stripe-payment-123"
}
```

**Response (200):**
```json
{
  "id": "QJ-1234567890",
  "status": "confirmada",
  "paidAt": "2026-03-15T14:35:00Z",
  "confirmationCode": "QUADRAJA-2024-15MAR"
}
```

---

### PATCH `/api/reservations/:id/cancel`

Cancelar uma reserva.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "QJ-1234567890",
  "status": "cancelada",
  "cancelledAt": "2026-03-15T14:40:00Z",
  "refundEligible": true,
  "refundAmount": 240,
  "refundStatus": "processing",
  "refundEstimatedAt": "2026-03-20"
}
```

**Errors:**
- `403` User não é o proprietário da reserva
- `409` Reserva já foi concluída (não pode cancelar)
- `422` < 4 horas da reserva (sem direito a estorno)

---

## 💳 Pagamentos

### POST `/api/payments/pix/create`

Criar pagamento PIX.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "reservationId": "QJ-1234567890",
  "amount": 240
}
```

**Response (201):**
```json
{
  "id": "payment-pix-123",
  "method": "pix",
  "amount": 240,
  "brcode": "00020126580014br.gov.bcb...",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "expiresAt": "2026-03-15T14:45:00Z",
  "status": "pending"
}
```

---

### POST `/api/payments/card/charge`

Cobrar cartão de crédito/débito.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "reservationId": "QJ-1234567890",
  "amount": 240,
  "cardToken": "stripe-token-xyz",
  "cardLast4": "4242",
  "type": "credit"
}
```

**Response (201):**
```json
{
  "id": "payment-card-123",
  "method": "card_credit",
  "amount": 240,
  "status": "succeeded",
  "transactionId": "stripe-charge-123",
  "last4": "4242"
}
```

**Errors:**
- `402` Cartão recusado
- `402` Fundos insuficientes
- `422` Token inválido

---

### GET `/api/payments/:id/status`

Status de um pagamento.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "payment-pix-123",
  "status": "succeeded",
  "amount": 240,
  "confirmedAt": "2026-03-15T14:37:00Z"
}
```

---

## 👤 Usuário

### GET `/api/me`

Dados do user autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "user-uuid-123",
  "name": "Diego Silva",
  "email": "diego@email.com",
  "phone": "(11) 99999-0000",
  "birthDate": "1990-01-15",
  "createdAt": "2026-03-01",
  "favoriteArenas": ["arena-1", "arena-3"],
  "totalReservations": 5,
  "totalSpent": 1240
}
```

---

### PATCH `/api/me`

Atualizar dados do user.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "Diego Silva",
  "phone": "(11) 98888-9999"
}
```

**Response (200):** Same as GET /api/me

---

### GET `/api/me/favorites`

Arenas favoritas do user.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "arena-1",
      "name": "Arena Centro",
      "distance": 1.2,
      "rating": 4.8
    }
  ],
  "total": 2
}
```

---

### POST `/api/me/favorites/:arenaId`

Adicionar arena aos favoritos.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (201):**
```json
{
  "added": true,
  "arenaId": "arena-1"
}
```

---

### DELETE `/api/me/favorites/:arenaId`

Remover arena dos favoritos.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (204):** No content

---

## ⭐ Avaliações

### POST `/api/reservations/:id/rating`

Avaliar arena após jogo.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "rating": 5,
  "comment": "Quadra perfeita! Recomendo."
}
```

**Response (201):**
```json
{
  "id": "rating-uuid-123",
  "reservationId": "QJ-1234567890",
  "rating": 5,
  "comment": "Quadra perfeita! Recomendo.",
  "createdAt": "2026-03-16T10:00:00Z"
}
```

---

### GET `/api/arenas/:id/ratings`

Avaliações de uma arena.

**Query params:**
- `limit` (number) — default: 10
- `offset` (number) — default: 0

**Response (200):**
```json
{
  "data": [
    {
      "id": "rating-uuid-123",
      "userName": "Diego Silva",
      "rating": 5,
      "comment": "Quadra perfeita!",
      "createdAt": "2026-03-16T10:00:00Z"
    }
  ],
  "average": 4.8,
  "total": 47,
  "limit": 10,
  "offset": 0
}
```

---

## 🔄 Webhook

### POST `/webhooks/stripe`

Webhook da Stripe para confirmação de pagamento.

*Implementar em production com secret de assinatura Stripe*

**Body (Stripe event):**
```json
{
  "id": "evt_123",
  "type": "charge.succeeded",
  "data": {
    "object": {
      "id": "ch_123",
      "amount": 24000,
      "status": "succeeded",
      "metadata": {
        "reservationId": "QJ-1234567890"
      }
    }
  }
}
```

---

## 📝 Erros Padrão

Todos os erros devem retornar este formato:

```json
{
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Email formato inválido",
    "details": {
      "field": "email",
      "value": "diego@"
    }
  }
}
```

**Códigos comuns:**
- `INVALID_EMAIL` — Email com formato inválido
- `EMAIL_ALREADY_EXISTS` — Email já cadastrado
- `INVALID_PASSWORD` — Senha < 6 caracteres
- `INVALID_AGE` — Idade < 18
- `DOUBLE_BOOKING` — Slot já reservado
- `INSUFFICIENT_ADVANCE` — Reserva < 2h (mesma dia)
- `UNAUTHORIZED` — Token inválido/expirado
- `NOT_FOUND` — Recurso não encontrado
- `RATE_LIMIT_EXCEEDED` — Muitas requisições

---

## 🧪 Rate Limiting

```
Login: 5 tentativas / 5 minutos
API: 100 requisições / 1 minuto por user
```

**Header de resposta:**
```
Retry-After: 300
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1710576300
```

---

## ✅ CORS

```
Access-Control-Allow-Origin: https://quadraja.com.br, http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

**Desenvolvedor:** Diego  
**Última atualização:** 16/03/2026  
**Status:** Pronto para implementação
