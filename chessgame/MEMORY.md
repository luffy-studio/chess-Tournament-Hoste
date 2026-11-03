# Project Overview

* **Architecture summary**: Full-stack Monorepo separated into frontend (React) and backend (Node.js/Express) connected via REST APIs and WebSockets.
* **Tech stack**: 
  * Frontend: React 18, Vite, TailwindCSS, Socket.IO Client, Axios, React Hot Toast.
  * Backend: Node.js, Express, Socket.IO, Prisma ORM, Zod, JWT.
  * Database: SQLite (currently for dev, `dev.db`), Prisma Schema.
* **Database structure**: 
  * `User`: Admin credentials.
  * `Tournament`: Stores core state (`id`, `mode`, `status`, `currentRound`).
  * `Participant`: Players enrolled (`id`, `name`, `score`).
  * `Match`: Round history (`id`, `round`, `whiteId`, `blackId`, `result`).
  * `WebhookEndpoint` & `WebhookEvent`: Event-driven integrations.
* **API structure**:
  * `/api/auth`: Login.
  * `/api/tournaments`: CRUD & control (`/start`, `/next-round`).
  * `/api/tournaments/:id/participants`: CRUD.
  * `/api/tournaments/:id/matches`: CRUD & results.
  * `/api/webhooks`: Register and manage webhooks.
* **Deployment details**: Configured as an npm workspace. `frontend` builds to static files, `backend` is a standard Node application.

# Tournament Engine

* **Pairing algorithm details**: 
  * *Current*: Basic memory-based implementation migrated to backend (`generateRoundRobinMatches`, `generateNextSwissRound`). Uses basic score bucketing and random shuffling for Swiss, and basic circle algorithm for Round Robin.
  * *Target*: Full FIDE-compliant engine supporting Floaters, Color Balancing, and strict score groups.
* **Scoring system**: Win = 1, Draw = 0.5, Loss = 0.
* **Tie-break system**: *Not fully implemented yet.* Target: Buchholz, Median Buchholz, Cut 1 Buchholz, Sonneborn-Berger, Direct Encounter.
* **FIDE compliance status**: *In Progress / Pending Upgrade*.

# File Index

* `backend/src/index.ts`: Express server and Socket.IO initialization.
* `backend/src/utils/tournamentUtils.ts`: Core pairing logic (pending migration to `core/tournament-engine`).
* `backend/src/routes/*.ts`: REST API controllers.
* `backend/prisma/schema.prisma`: Database schema.
* `frontend/src/ChessTournamentComplete.tsx`: Primary UI orchestrator for tournament management.
* `frontend/src/utils/useTournamentApi.ts`: React hook linking UI to backend.

# Features Implemented

* **Feature name**: Monorepo Restructuring, **Date added**: June 2026, **Files modified**: `package.json`, structural moves.
* **Feature name**: PostgreSQL/SQLite Database & Prisma setup, **Date added**: June 2026, **Files modified**: `schema.prisma`.
* **Feature name**: Webhook Architecture, **Date added**: June 2026, **Files modified**: `webhookService.ts`, `webhooks.ts`.
* **Feature name**: JWT Auth & Security, **Date added**: June 2026, **Files modified**: `auth.ts`, `authMiddleware.ts`.
* **Feature name**: Real-time WebSockets, **Date added**: June 2026, **Files modified**: `index.ts`, `useTournamentApi.ts`.

# Bugs Fixed

* **Description**: Backend typescript inference errors on `req.params`. **Files modified**: `matches.ts`, `participants.ts`. **Date fixed**: June 2026.
* **Description**: Webhook JSON/Array SQLite limitations. **Files modified**: `schema.prisma`, `webhookService.ts`, `webhooks.ts`. **Date fixed**: June 2026.

# Webhooks

* **Event names**: `tournament.created`, `tournament.started`, `player.registered`, `player.removed`, `result.submitted`.
* **Payload structures**: JSON object of the affected Prisma model.
* **Security model**: HMAC `sha256` signature via `X-Chess-Signature` header.

# Future Roadmap

* **Pending tasks**:
  * Build isolated `/core/tournament-engine`.
  * Implement advanced FIDE pairing logic (Swiss & Berger).
  * Implement Tie-Break engine.
  * Implement Pairing Validations and Audit Reports.
  * Frontend integration for tie-breaks and simulations.

# Decisions Log

* **Monorepo Architecture**: Selected to allow sharing types and simplifying deployment of both frontend and backend logic.
* **Prisma ORM**: Selected for type-safe database queries. Dropped direct PostgreSQL requirement for local SQLite during active dev to streamline tests.
* **Tournament Engine Isolation**: Decided to move all tournament logic out of API routes and frontend into a standalone `core/tournament-engine` to allow FIDE compliance checks, unit testing, and audibility without HTTP overhead.

## Version History
* v1.0.0 - Base monolithic React app.
* v1.1.0 - Full-stack migration with Webhooks and WebSockets.
* v1.2.0 (Planned) - FIDE Compliant Engine and Tie-breaks.
