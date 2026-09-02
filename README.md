# Projeto Agrícola — Fluxo de Caixa

Monorepo do sistema de gestão de fluxo de caixa.

## Estrutura

```
├── apps/
│   ├── fluxo-caixa-api/        # Backend Spring Boot 4.1 / Java 21 (docker)
│   └── fluxo-caixa-web/        # Frontend React 19 + Vite 8 (local, sem docker)
├── databases/                  # Dumps SQL de referência
├── legado/                     # Scaffolds antigos (fluxoCaixa, zip) — ignorado
├── docker-compose.yml          # Sobe mysql + api
└── .env.example                # Template usado pelo docker-compose
```

## Variáveis de ambiente

- **API** — copie `apps/fluxo-caixa-api/.env.example` → `.env` (deve ter
  `JWT_SECRET_BASE64`, `DB_PASSWORD`, `MAIL_*`). Gere a chave JWT com
  `openssl rand -base64 64`.
- **WEB** — copie `apps/fluxo-caixa-web/.env.example` → `.env` e ajuste
  `VITE_API_URL`.
- **Compose** — copie `.env.example` → `.env` na raiz (valores do MySQL e API).

## Subir com Docker (banco + API)

```bash
docker compose up --build
```

O MySQL sobe vazio e o Flyway cria o schema (migrações `V1`–`V9`).
O dump em `databases/` é para restauração manual, quando quiser importar dados:

```bash
docker compose exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" < databases/Dump20260901.sql
```

## Rodar o frontend (local)

```bash
cd apps/fluxo-caixa-web
npm install
npm run dev
```

O front acessa a API via `VITE_API_URL` (padrão `http://localhost:8080/api/v1`).

## Healthcheck

- API: `GET http://localhost:8080/actuator/health`
