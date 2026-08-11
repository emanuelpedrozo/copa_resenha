# 🏆 Copa Resenha

**Futebol virtual. Resenha real.** Aplicação mobile-first para organizar campeonatos de EA Sports FC/FIFA entre amigos.

## Stack e arquitetura

- Next.js 14, React, TypeScript e Tailwind CSS
- PostgreSQL e Prisma ORM
- Sessões JWT em cookie `httpOnly` e senhas com bcrypt (12 rounds)
- Regras de competição isoladas em `src/lib/tournament.ts`
- API Routes para operações autenticadas
- Docker Compose com app, PostgreSQL, healthcheck e volumes persistentes

O modelo suporta pontos corridos e mata-mata, jogos únicos ou ida e volta, BYEs, pênaltis, comprovantes, contestações, notificações e auditoria. A classificação é derivada apenas de partidas confirmadas.

## Desenvolvimento local

Requisitos: Node 20+, npm e PostgreSQL 16+.

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Acesse `http://localhost:3000`.

Credenciais de desenvolvimento:

- Administrador: `admin@coparesenha.local`
- Senha: `Resenha@2026`
- Participantes: username em minúsculas (`emanuel`, `joao` etc.) com a mesma senha

## Docker

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

O PostgreSQL fica no volume `postgres_data` e os uploads no volume `uploads`.

## Comandos

```bash
npm test             # regras críticas
npm run build        # build de produção
npm run db:generate  # gera o Prisma Client
npm run db:migrate   # cria/aplica migration local
npm run db:seed      # dados demonstrativos
```

## Variáveis

Consulte `.env.example`. Em produção, gere `AUTH_SECRET` com pelo menos 32 bytes aleatórios. O upload aceita JPG, JPEG, PNG e WEBP até o limite de `MAX_UPLOAD_MB`; `UPLOAD_DIR` aponta para o armazenamento local. A camada deve ser substituída por um adapter para S3/R2/MinIO quando necessário.

## Produção, backup e administrador

- Use TLS no proxy reverso e nunca publique o PostgreSQL diretamente.
- Execute `npx prisma migrate deploy` antes de iniciar uma nova versão.
- Faça backup com `pg_dump "$DATABASE_URL" > backup.sql` e preserve também o volume de uploads.
- O seed cria um administrador apenas para desenvolvimento. Em produção, crie-o por rotina segura e remova/troque a senha inicial imediatamente.
- Não monte `.env` na imagem nem registre tokens, senhas ou conteúdo dos comprovantes em logs.

## Estado do MVP

Esta entrega estabelece a fundação executável, o dashboard responsivo, autenticação, modelo completo de persistência, seed e regras centrais testadas. O restante dos fluxos de edição (wizard administrativo, telas de envio/confirmação e chave interativa) deve consumir esses serviços em incrementos seguintes.
