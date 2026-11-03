# ♔ Royal Chess Championship — Hybrid Tournament Platform

Production-ready, multi-mode chess tournament hosting and management platform. Operates across **three distinct execution environments**:

1. **Offline Standalone Mode**: 100% offline in-browser using IndexedDB and client-side pairing engines. No internet or server required.
2. **Offline Local Network (LAN) Mode**: Run on a host laptop connected to a local Wi-Fi router or hotspot. Any phone, tablet, or laptop on the venue network can join, view live pairings, and receive WebSocket broadcasts without external internet.
3. **Online Mode**: Centralized cloud deployment (Node.js + PostgreSQL/SQLite + Socket.IO) supporting remote arbiters, live scoreboards, and participants worldwide.

---

## 🏗 Architecture Overview

```
                      ┌──────────────────────────────────────────┐
                      │    Client (React 18 + TS + Tailwind)     │
                      │  PWA Service Worker + IndexedDB Adapter  │
                      └─────────────────────┬────────────────────┘
                                            │
                       HTTP REST APIs & WebSockets (Socket.IO)
                                            │
                      ┌─────────────────────▼────────────────────┐
                      │    Backend (Node.js + Express + Prisma)  │
                      │  JWT + bcrypt + Helmet + Rate Limiters   │
                      └─────────────────────┬────────────────────┘
                                            │
                      ┌─────────────────────▼────────────────────┐
                      │  core/tournament-engine (FIDE Compliant)  │
                      │  Swiss Backtracking · Berger Round Robin │
                      │  Buchholz · Sonneborn-Berger · Audit     │
                      └──────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Install & Build All Workspaces
```bash
# From repository root:
npm install --legacy-peer-deps
npm run build
```

### 2. Run in Development
```bash
# Starts both frontend (port 5173) and backend (port 5000)
npm run dev
```

### 3. Run Automated Engine Unit Tests
```bash
npm test
```
*Runs all 23 unit tests across Swiss pairing, Round Robin, Tie-breaks, Validator, FIDE Audit engine, and multi-round color alternation.*

---

## ⚔️ Online Chess Arena (Live Multiplayer Module)

A dedicated, real-time multiplayer chess-playing environment independent from the tournament manager:

- **Direct Challenge & Matchmaking**: Create games with time controls (Rapid 10+0, Blitz 5+3, Blitz 3+2, Bullet 1+0, Untimed) and share direct room links.
- **Server-Authoritative Move Validation**: Full legal move verification using `chess.js` prevents moving out of turn, invalid moves, or client spoofing.
- **Interactive 8x8 Chessboard**:
  - Drag-or-click piece movement with legal target indicators (dots/rings).
  - Last move highlighting, pawn promotion dialog, and king-in-check indicators.
  - Automatic board flipping for Black player.
- **Real-Time Clocks**: Accurate countdown timers with increment support and server-side flag fall timeout detection.
- **Terminal Conditions**: Automatic checkmate, stalemate, threefold repetition, fifty-move rule, and insufficient material adjudication.
- **Interactive Actions**: Resign (with confirmation), Draw Offer / Accept / Decline, and live PGN/SAN notation history.
- **Live Spectators**: Zero-latency spectator view with live move updates and spectator counter.
- Accessible directly at `/arena` and `/arena/:roomId`.

---

## 📶 Three Operating Modes

### Mode A: Offline Standalone Mode
- Navigate to `http://localhost:5173/standalone` (or open the built PWA offline).
- All tournaments, participants, rounds, and pairings are persisted directly inside the browser's **IndexedDB** (`chess-tournament-db`).
- Reloading the browser or restarting the computer preserves all tournament state.
- Export full JSON backups or CSV reports at any time.

### Mode B: Offline LAN Mode (Venues, Schools, Clubs)
- Connect the host laptop to the venue Wi-Fi router or create a mobile hotspot.
- Start the server:
  ```bash
  npm run dev:backend
  ```
  The server binds to `0.0.0.0:5000` and automatically outputs your local IPv4 address:
  ```
  Server running on port 5000 (LAN accessible at 192.168.1.42:5000)
  ```
- Other devices (smartphones, tablets, laptops) on the same Wi-Fi simply open `http://192.168.1.42:5000` (or `http://192.168.1.42:5173` in dev).
- The admin dashboard displays the exact LAN URL and a copy button.
- Real-time pairings, board assignments, and standings update simultaneously across all devices via WebSockets.

### Mode C: Online Internet Mode
- Deploy the backend to Railway / Render / DigitalOcean with a persistent SQLite or PostgreSQL database.
- Deploy the frontend static build to Vercel / Netlify.
- Set environment variables:
  - `FRONTEND_URL=https://your-domain.vercel.app`
  - `VITE_API_URL=https://your-backend.railway.app/api`
- Supports global participant viewing, multi-tournament listing, and secure JWT-based admin authentication.

---

## 🔐 Security & Access Control

- **Authentication**: JWT tokens with 1-day expiration.
- **Password Protection**: Passwords hashed using `bcryptjs` (salt rounds: 10).
- **Protected APIs**:
  - `POST /api/tournaments` (Admin)
  - `POST /api/tournaments/:id/start` (Admin)
  - `POST /api/tournaments/:id/next-round` (Admin)
  - `PUT /api/tournaments/:id/matches/:id` (Admin)
  - `PATCH /api/tournaments/:id/complete` (Admin)
  - `DELETE /api/tournaments/:id` (Admin)
- **Rate Limiting**: `express-rate-limit` prevents brute-force on auth routes (10 requests / 15 min).
- **Socket Security**: Socket.IO connection handshake decodes JWT tokens and verifies credentials before granting administrative room privileges.

---

## ♟ Tournament Pairing & FIDE Engine

Located in `core/tournament-engine/`:

- **Swiss System**:
  - Strict score-bracket pairing with floater tracking.
  - FIDE Dutch color alternation rules: prevents 3 consecutive same colors, maintains color difference $\le 2$.
  - Single BYE rule: lowest-rated eligible player gets BYE; never receives multiple BYEs.
  - Prevents rematching identical opponents in subsequent rounds.
- **Round Robin**:
  - Berger tables (circle algorithm) for single and double round-robin.
  - Complete schedule generation with odd-field BYE support and color alternation.
- **Tie-Breakers**:
  - Buchholz
  - Buchholz Cut-1
  - Median Buchholz
  - Sonneborn-Berger (SB)
  - Direct Encounter (Head-to-head)
  - Progressive Score
  - Most Wins & Most Wins with Black
  - FIDE Performance Rating ($R_p$)

---

## 📡 WebSocket Event Catalog

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `joinTournament` | Client $\to$ Server | `tournamentId` | Join room for live updates |
| `tournamentUpdated` | Server $\to$ Room | Full tournament object | Complete state broadcast |
| `standings:updated` | Server $\to$ Room | `{ standings, tournamentId }` | Recalculated rankings |
| `round:generated` | Server $\to$ Room | `{ round, tournamentId }` | New round board pairings |
| `result:submitted` | Server $\to$ Room | `{ match, actorUsername }` | Board result recorded |
| `result:confirmed` | Server $\to$ Room | `{ match, actorUsername }` | Official result verified |
| `participant:registered`| Server $\to$ Room | `participant` | Player added to roster |
| `announcement:posted` | Server $\to$ Room | `announcement` | Director broadcast message |
| `tournament:completed` | Server $\to$ Room | `tournament` | Tournament finalized |

---

## 📂 Project Directory Structure

```
chessgame/
├── core/
│   └── tournament-engine/     # FIDE pairing, ratings & tie-break engine
│       ├── src/
│       │   ├── audits/        # FIDE compliance auditor
│       │   ├── fide-rules/    # Color and pairing rules
│       │   ├── pairing/       # Swiss & Berger Round Robin generators
│       │   ├── ratings/       # Performance rating (Rp)
│       │   ├── tiebreaks/     # Buchholz, SB, Progressive formulas
│       │   ├── validations/   # Self-pair & repeat check validator
│       │   └── __tests__/     # 21 unit tests (Vitest)
├── backend/                   # Express + Socket.IO + Prisma + SQLite
│   ├── prisma/
│   │   ├── schema.prisma      # Tournament, Participant, Match, AuditLog models
│   │   └── dev.db             # Local SQLite database
│   └── src/
│       ├── arena/             # Online Chess Arena manager (chess.js + timers)
│       ├── middleware/        # JWT authMiddleware & requireAdmin
│       ├── routes/            # Tournaments, Participants, Matches, Arena, Webhooks
│       └── utils/             # Broadcast & score recalculation
├── frontend/                  # React 18 + Vite + Tailwind + PWA
│   ├── src/
│   │   ├── components/        # Badges, Modals, Spinners, Tables
│   │   ├── pages/
│   │   │   ├── TournamentListPage.tsx     # Public tournament directory
│   │   │   ├── TournamentPublicPage.tsx   # Live participant scoreboard
│   │   │   ├── AdminLoginPage.tsx         # Secure admin login
│   │   │   ├── AdminDashboardPage.tsx     # Hub with LAN info & QR link
│   │   │   ├── CreateTournamentPage.tsx   # Multi-step creation wizard
│   │   │   ├── AdminTournamentPage.tsx    # Live arbiter control console
│   │   │   ├── ParticipantPage.tsx        # Personal player portal
│   │   │   └── OnlineArenaPage.tsx        # Live multiplayer chess arena
│   │   ├── storage/           # IndexedDB storage adapter
│   │   └── utils/             # Axios API client & CSV exports
├── TEST_RESULTS.md            # Automated test execution report
└── README.md
```

---

## 💾 Backup & Disaster Recovery

- **Export Standings CSV**: Under the "Reports & Export" tab in the admin dashboard.
- **Export Results CSV**: Board-by-board match histories with result flags.
- **Full JSON Snapshot**: Complete dump of tournaments, participants, matches, and audit logs via `GET /api/tournaments/:id/export`.
- **Standalone IndexedDB**: Backups can be exported and re-imported directly within the offline browser console.
