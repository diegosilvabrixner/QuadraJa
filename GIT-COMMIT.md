## Como criar o repositório e fazer o primeiro commit

### 1. Iniciar o repositório (rode dentro da pasta QuadraJa)

```bash
git init
git add .
git commit -m "feat: estrutura inicial do projeto QuadraJá

- Backend: Fastify + Prisma + PostgreSQL
  - Autenticação JWT (register/login)
  - CRUD completo de arenas e quadras
  - Reservas avulsas e mensais com validação de conflito
  - Pagamento PIX via Mercado Pago (+ modo mock para dev)
  - Webhook para confirmação automática de pagamento
  - Produtos com controle de estoque e histórico
  - Dayuse com popup para clientes
  - DRE, despesas, folha de pagamento
  - Logs de auditoria em todas as operações

- Frontend Cliente: HTML + CSS + JS puro
  - Login e cadastro conectados à API real
  - Listagem de arenas carregada do banco
  - Quadras dinâmicas por arena (sem dados hardcoded)
  - Agendamento avulso e mensal
  - Pagamento com QR Code PIX real
  - Histórico de reservas com filtros
  - Cancelamento com verificação de 4h
  - Avaliação pós-jogo

- Frontend Admin: Painel completo
  - Dashboard com KPIs do mês
  - Gestão de quadras com histórico de status
  - Visualização e confirmação de reservas
  - CRUD de produtos com cálculo de markup/margem
  - Controle de estoque com movimentações
  - DRE com orçado vs realizado
  - Folha de pagamento com encargos automáticos"
```

### 2. Criar repositório no GitHub

```bash
# Via GitHub CLI (se tiver instalado)
gh repo create quadraja --private --push --source=.

# Ou manualmente:
# 1. Vá em https://github.com/new
# 2. Crie um repositório chamado "quadraja" (privado)
# 3. Copie a URL do repositório
git remote add origin https://github.com/SEU_USUARIO/quadraja.git
git push -u origin main
```

### 3. Variáveis de ambiente (NUNCA commitar o .env)

O arquivo `.gitignore` já está configurado para ignorar `.env`.
Certifique-se de que o `.env` **não** está na listagem do `git status`.

```bash
git status  # .env não deve aparecer
```

---

## Branches recomendadas

```
main         ← produção estável
development  ← desenvolvimento ativo
feat/xxx     ← nova funcionalidade
fix/xxx      ← correção de bug
```

```bash
# Criar branch de desenvolvimento
git checkout -b development
```

---

## Convenção de commits

```
feat:     nova funcionalidade
fix:      correção de bug
refactor: refatoração sem mudança de comportamento
style:    formatação, CSS
docs:     documentação
chore:    tarefas de build, dependências
```
