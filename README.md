# QuadraJá 🏐

SaaS de agendamento de quadras de vôlei.

## Estrutura

```
quadraja/
├── backend/               ← Node.js + Fastify + Prisma
│   ├── src/
│   │   ├── config/        ← env, db, mercadopago
│   │   ├── middleware/    ← auth JWT, role guard
│   │   ├── routes/        ← todas as rotas da API
│   │   └── services/      ← lógica de negócio
│   ├── prisma/
│   │   ├── schema.prisma  ← modelo do banco
│   │   └── seed.js        ← dados iniciais
│   ├── .env               ← variáveis de ambiente (NÃO commitar)
│   └── package.json
│
└── frontend/              ← HTML + CSS + JS puro
    ├── html/              ← uma página por tela
    ├── css/               ← estilos
    ├── js/                ← lógica + api.js (comunicação com backend)
    └── assets/            ← logo, imagens
```

## Início rápido

```bash
# 1. Backend
cd backend
cp .env.example .env        # editar com suas credenciais
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev

# 2. Frontend (outro terminal)
cd frontend
npx serve . -l 5500

# Acesse: http://localhost:5500/html/login.html
```

## Credenciais de teste (após seed)

| Tipo | E-mail | Senha |
|------|--------|-------|
| Admin | admin@arenacentro.com.br | senha123 |
| Cliente | lucas@email.com | senha123 |
