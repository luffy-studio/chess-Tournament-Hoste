# Changelog: Royal Chess Championship Platform

## [2.5.0] - November 2026

### Grandmaster Suite — Soft Ivory Luxury Refinement & Live Arena Engine
- **Sole Creator & Architect**: **Sarvagya Sharma**
- **Soft Ivory Luxury Palette (Phase 1)**:
  - Replaced chocolate/dark brown heaviness with a warm, natural, editorial aesthetic inspired by vintage chess salons:
    - Dominant Primary Background: `#FAF6F2` (Soft Ivory)
    - Secondary Surfaces & Card Hairlines: `#DED1BD` (Warm Beige)
    - Primary Action Accent: `#B08401` (Mustard Gold)
    - Secondary Badges & Special Highlights: `#D49E8D` (Dusty Rose)
    - Selective Typography & Navigational Elements: `#683B2B` (Deep Brown)
  - Applied uniformly across all 9 pages and 12 shared UI components (`RoyalCard`, `RoyalButton`, `RoyalHeader`, `RoyalFooter`, `RoyalInput`, `RoyalChip`, `StandingsTable`, `StatusBadge`, `ModeBadge`, `ConnectionBadge`, `RoyalLoading`, `RoyalEmpty`).
  - WCAG AAA contrast achieved for primary body typography (`#683B2B` on `#FAF6F2` > 7.5:1).
- **Live Chess Draw Offer System (Phase 2)**:
  - Added real-time "Offer Draw" button with anti-spam state protection (single offer per player, clears on game end or next move).
  - Synchronized WebSocket protocol (`arena:drawOffered`, `arena:respondDraw`, `arena:drawDeclined`).
  - Opponent received prompt: *"Your opponent has offered a draw"* with **Accept Draw** and **Reject Offer** actions.
  - If accepted: game immediately terminates with `DRAW`, triggers premium agreement modal (*"Game Drawn — Both players have agreed to a draw"*), persists `½ – ½` to Prisma database, recalculates scores, and broadcasts tournament update.
  - If rejected: notification dismissed, rejection toast sent to challenger (*"Draw offer rejected."*), and clock/board position continues undisturbed.
- **Automatic 50s Disconnection & Abandonment Detection (Phase 3)**:
  - Server-authoritative disconnect countdown: `ArenaManager` starts a 50-second timer whenever an active player's WebSocket disconnects.
  - Live broadcast of countdown ticks (`arena:disconnectCountdown`) to connected opponent: *"Opponent disconnected — Waiting for opponent to reconnect... 50s -> 49s..."*.
  - Seamless reconnection cancellation: if the disconnected player reconnects within 50s, timer aborts and board state resumes normally.
  - Automatic forfeit on 50s expiry: server ends match with `endReason: 'abandonment'`, awards victory to the connected player, updates tournament database, and displays premium modal popup: *"Victory! Your opponent abandoned the match."*.
- **Live Arena & Tournament Integration (Phase 4)**:
  - Deterministic tournament match rooms: `tournament-{tournamentId}-match-{matchId}`.
  - Added "Enter Live Arena" / "Watch Live" buttons on fixtures in `AdminTournamentPage`, `ParticipantPage`, and `TournamentPublicPage`.
- **Verification**:
  - Full engine test suite: 23/23 tests passed (`vitest run`).
  - Monorepo production build: 0 errors (`npm run build`).

## [2.4.0] - November 2026

### Complete "Royal Noir" Universal Visual Design Overhaul
- **Central Theme Architecture**:
  - Implemented `frontend/src/theme/royalNoir.ts`, declaring all official tokens: `#0A0A0C` (Base background), `rgba(42,33,8,0.7) → #0A0A0C` (Radial glow), `#F3EAD3` (Primary cream text), `#B8AD8E` (Secondary warm brown text), `#9A8F74` (Muted/metadata text), `#D4AF37` (Brand gold), `linear-gradient(135deg, #F0D77A, #B8912A)` (Primary button gradient), `rgba(255, 255, 255, 0.04)` (Card surface), `18px` card radius, and `rgba(212, 175, 55, 0.2)` card hairline borders.
  - Tailored `frontend/src/index.css` with `.rn-glow`, `.rn-btn-primary`, `.rn-btn-secondary`, `.rn-chip`, accessible 2px gold focus rings, and custom gold-tinted scrollbars.
  - Extended `frontend/tailwind.config.js` with `rn` palette and typography presets (*Cinzel*, *Playfair Display*, *Inter*).
- **Universal Reusable Components**:
  - `RoyalHeader`: Unified navigation featuring "CHESS" in cream + "ARENA" in gold bold (*Cinzel*), route links with active bottom gold bars, pill action buttons, and mobile drawer.
  - `RoyalFooter`: Universal footer with circular gold "EST. 2026" heraldic seal, *Playfair Display italic* tagline, and quick navigation ledger.
  - `RoyalButton`: Primary gold gradient pill button (`#1A1405` dark text) and secondary gold border pill button supporting both buttons and React Router `<Link>`.
  - `RoyalCard`: `rounded-[18px]`, `bg-white/[0.04]`, `border border-[#D4AF37]/20` with optional interactive hover elevation and glow.
  - `RoyalChip`: Pill filter chips transitioning from subtle gold border to solid gold `#D4AF37`.
  - `RoyalInput`: Form inputs with `#0A0A0C` background, 25% gold border, cream text, and *Cinzel* kicker labels.
  - `RoyalLoading` & `RoyalEmpty`: Standardized loading and empty states with crown/pawn emblems and *Playfair Display italic* headings.
  - `ConfirmDialog`: Redesigned modal with `#0A0A0C` surface and gold/garnet pill buttons.
- **Application Pages Redesigned**:
  - `TournamentListPage` (`/`): Editorial hero with *Playfair Display italic* headline, statistical metrics cards, filter chips, and tournament grid in `RoyalCard`.
  - `TournamentPublicPage` (`/tournaments/:id`): Championship hero card, metrics bar, tab switcher (*Live Standings*, *Current Pairings*, *All Rounds*, *Announcements*), standings table with subtle gold dividers and rank highlight, and Champion Podium banner.
  - `CreateTournamentPage` (`/admin/tournaments/new`): 3-step Arbiter Genesis wizard with gold step indicator, specifications cards, CSV roster uploader, and review grid.
  - `ParticipantPage` (`/participant`): Personal competitor dossier, tournament selector, player search, player card with ratings and scores, active round board assignment with large gold *Cinzel* board number, and personal match history ledger.
  - `AdminLoginPage` (`/admin`): Chamber of Arbitration sign-in, token request, and reset forms inside a centered `RoyalCard`.
  - `AdminDashboardPage` (`/admin/dashboard`): Arbiter console with minimalist stats in gold *Cinzel*, tournament cards, and venue LAN connectivity card.
  - `AdminTournamentPage` (`/admin/tournaments/:id`): Tournament arbiter console with round status banner, next round progression button, board pairings with quick score buttons (1-0, ½-½, 0-1), participant roster editor, FIDE Dutch audit checklist with floater names, and report exports.
  - `OnlineArenaPage` (`/arena`, `/arena/:roomId`): Real-time multiplayer chess arena with Royal Noir chessboard colors (`#3A2C10` walnut frame, `#D9C08A` beechwood light squares, `#1B1B1F` matte noir dark squares), digital clocks in gold *Cinzel* numerals, move notation in `RoyalCard`, and challenge generator.
  - `NotFoundPage` (`*`): Dedicated editorial 404 page (*Locus Inexistens*) with gold crown emblem, italic *Playfair Display* heading, and navigation pill buttons.
- **Quality & Verification**:
  - TypeScript compilation & Vite build verified: 0 errors (`✓ built in 8.02s`).
  - Unit tests verified: 23/23 engine tests passing (`vitest run`).
  - Backend verified: healthy with 12ms DB latency on port 5000.

## [2.3.0] - November 2026

### Added & Enhanced (Security, Performance & Reliability Audit)
- **Access Control & IDOR Prevention**:
  - Implemented strict resource scoping in `backend/src/routes/participants.ts` and `backend/src/routes/matches.ts`: ensures participant updates, participant deletions, and match result modifications verify that the resource actually belongs to the given `tournamentId`. Prevents Insecure Direct Object Reference (IDOR) attacks across tournaments.
  - Secured `backend/src/routes/webhooks.ts`: enforced `authMiddleware` and `requireAdmin` across all webhook registration, inspection, and log endpoints; masked stored secrets in API responses.
- **Secure Password Reset Engine**:
  - `POST /api/auth/forgot-password`: Generates cryptographically secure 32-byte random tokens (`crypto.randomBytes(32)`), hashes tokens with SHA-256 for secure database storage, sets strict 10-minute expiry, and invalidates any existing unused tokens for that user.
  - `POST /api/auth/reset-password`: Validates token hash, enforces single-use policy by marking token as used in a database transaction, rejects expired tokens, and hashes new passwords using `bcryptjs` (salt rounds: 10).
  - `POST /api/auth/change-password`: Enables authenticated admins to safely update their credentials with current password verification.
- **Input Validation & Sanitization**:
  - Built reusable Zod validation middleware (`backend/src/middleware/validate.ts`) for request bodies, query parameters, and URL parameters with descriptive validation error responses.
  - Implemented recursive text sanitization (`sanitizeMiddleware`) stripping `<script>` tags, inline event handlers, and javascript URIs to neutralize stored and reflected XSS vulnerabilities.
  - Enforced 2MB JSON body size limits on Express parsers to prevent payload flooding.
- **Configurable CORS Allowlist**:
  - Replaced wildcard CORS with an explicit origin validator reading from `CORS_ALLOWED_ORIGINS`.
  - Disallows unauthenticated wildcards in production while dynamically supporting local development and private network RFC-1918 subnets (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) in offline LAN venue mode.
- **Granular API Rate Limiting**:
  - Sensitive auth limiter (20 requests / 15 min per IP) on `/api/auth/login`, `/register`, `/forgot-password`, `/reset-password`.
  - General API limiter (1000 requests / 15 min per IP) returning standardized HTTP 429 JSON responses with correlation request IDs.
- **Centralized Error Handling**:
  - Implemented global `errorHandler` middleware catching custom `AppError`, Zod validation errors, Prisma database codes (`P2002`, `P2025`, `P2003`), and JWT errors.
  - Returns unified JSON response structure `{ error, code, details, requestId }`.
  - Conceals internal stack traces, database schema specifics, and file paths when running in production (`NODE_ENV === 'production'`).
- **Database Optimization & Indexing**:
  - Audited and updated `schema.prisma` with targeted compound and single-column indexes:
    - `Tournament`: `[status]`, `[createdAt]`
    - `Participant`: `[tournamentId]`, `[tournamentId, score]`, `[name]`
    - `Match`: `[tournamentId]`, `[tournamentId, round]`, `[whiteId]`, `[blackId]`, `[result]`
    - `Round`: `[tournamentId]`, `[tournamentId, roundNumber]`
    - `Announcement`: `[tournamentId]`, `[createdAt]`
    - `MatchAuditLog`: `[tournamentId]`, `[matchId]`, `[createdAt]`
    - `PairingAuditLog`: `[tournamentId]`, `[tournamentId, round]`, `[createdAt]`
    - `WebhookEvent`: `[endpointId]`, `[status]`
    - `PasswordResetToken`: `[tokenHash]`, `[userId]`
  - Eliminated N+1 queries by leveraging Prisma's eager `include` and `select` projections.
- **Structured Logging & Health Monitoring**:
  - Built `requestLogger` middleware attaching unique `X-Request-Id` UUIDs, measuring response latency in milliseconds, and redacting sensitive fields (`password`, `token`, `secret`, `authorization`).
  - Added comprehensive health endpoints in `backend/src/routes/health.ts`:
    - `GET /api/health`: Database connection ping with latency (1ms), uptime, memory statistics, and service health status.
    - `GET /api/health/live`: Lightweight liveness probe.
    - `GET /api/health/ready`: Readiness probe verifying database readiness.
- **Deployment & Rollback Strategy**:
  - Production multi-stage `Dockerfile` and `docker-compose.yml`.
  - Added standalone `scripts/healthCheck.js` verification script for CI/CD and deployment gating.
  - Authored comprehensive `DEPLOYMENT_AND_ROLLBACK.md` runbook covering zero-downtime Blue-Green deployments and rapid rollback procedures.
  - Implemented graceful shutdown handlers on `SIGTERM` and `SIGINT` ensuring in-flight HTTP connections, active Socket.IO clients, and Prisma connections close cleanly.
- **Frontend Integration**:
  - Enhanced Axios interceptor in `frontend/src/utils/api.ts` to capture 401 (session expiry with auto-redirect), 403 (access denied), 404, 422, 429 (rate limiting toast), and 500 responses.
  - Upgraded `frontend/src/pages/AdminLoginPage.tsx` with an interactive, secure Password Reset interface supporting token request and single-use confirmation.

## [2.2.0] - November 2026

### Fixed & Enhanced
- **Universal Clipboard Utility & Copy Experience**:
  - Resolved `Uncaught TypeError: Cannot read properties of undefined (reading 'writeText') at copyMatchLink` caused by `navigator.clipboard` being undefined in non-secure (HTTP / LAN IP) contexts.
  - Implemented `copyToClipboard()` in `frontend/src/utils/clipboard.ts`:
    - Checks `window.isSecureContext` and `navigator?.clipboard?.writeText`.
    - Automatically falls back to off-screen `<textarea>` + `document.execCommand('copy')` in LAN/HTTP environments.
    - Prevents rapid duplicate executions with 300ms debouncing.
    - Displays non-intrusive toast notifications via `react-hot-toast` with error handling that never crashes the application.
  - Created reusable, accessible `CopyButton` component (`frontend/src/components/CopyButton.tsx`) with temporary "Copied!" state, checkmark icon, multiple visual variants (`primary`, `secondary`, `subtle`, `icon-only`), and size options.
  - Replaced all clipboard interactions across the application:
    - LAN Host URL in `AdminDashboardPage`
    - Online Arena match link and challenge link in `OnlineArenaPage`
    - Live public tournament share in `TournamentPublicPage`
    - Public viewer link and CSV export share in `AdminTournamentPage`
    - Personalized player dashboard link in `ParticipantPage`
- **Socket.IO Real-Time Connection & LAN Resolution**:
  - Resolved `WebSocket connection to 'ws://localhost:5000/socket.io/?...' failed: WebSocket is closed before the connection is established`:
    - Changed transport order to `transports: ['polling', 'websocket']`, ensuring a reliable HTTP session handshake before upgrading to raw WebSocket.
    - Replaced hardcoded `localhost:5000` with dynamic host detection in `frontend/src/utils/api.ts` (`getApiBaseUrl()`, `getSocketBaseUrl()`) so mobile and LAN devices connecting via `http://192.168.x.x:5173` automatically route to `http://192.168.x.x:5000`.
    - Centralized socket lifecycle in `frontend/src/utils/socket.ts` (`createAppSocket()`) with automatic exponential backoff reconnection.
    - Backend configured with extended ping timeouts (`pingTimeout: 60000`, `pingInterval: 25000`, `allowUpgrades: true`).
    - Implemented truthful `ConnectionBadge` reflecting genuine connection states (`connected`, `connecting`, `reconnecting`, `disconnected`).
- **Premium Minimalist UI Refinement**:
  - Restrained dark zinc aesthetic (`bg-zinc-950`, `bg-zinc-900`, `border-zinc-800`) with refined amber accents.
  - Fixed mobile responsive layout across all pages, ensuring $\ge 44$px touch targets and overflow protection.

## [2.1.0] - November 2026

### Added
- **Online Chess Arena (Live Real-Time Multiplayer Module)**:
  - Independent interactive live chess playing environment (`/arena` and `/arena/:roomId`).
  - Server-authoritative move validation powered by `chess.js` preventing out-of-turn moves, illegal moves, or client spoofing.
  - Interactive 8x8 chessboard with coordinates, legal move target indicators, piece capture display, and king-in-check indicators.
  - Real-time countdown clocks with increment support (Rapid 10+0, Blitz 5+3, Blitz 3+2, Bullet 1+0, Untimed) and server-adjudicated flag fall.
  - Terminal condition detection: checkmate, stalemate, threefold repetition, fifty-move rule, and insufficient material.
  - In-game actions: Resign (with confirmation), Draw Offer/Accept/Decline, Board Flip, and Live PGN/SAN move history list.
  - Public match lobby and spectator mode allowing spectators to watch games live with zero delay.
- **Board-Wise Participant and Round Visibility**:
  - Full board details rendered across Arbiter Console, Public View, and Participant Portal:
    - Board Number & Round Number
    - White Player Name, ID badge (`ID: ...`), Rating, and piece icon (♔)
    - Black Player Name, ID badge (`ID: ...`), Rating, and piece icon (♚)
    - Match Status badge (`Completed`, `In Progress`, `BYE (1.0 Pt)`)
    - Result (`1-0`, `0-1`, `½-½`)
    - Last Updated timestamp (`Updated: HH:MM`)
- **Strict Round Completion and "Start Next Round" Workflow**:
  - Round state banners: `Round Not Started`, `Round In Progress`, `Awaiting Results (X pending)`, `Round Completed — Ready for Next Round`, `Tournament Completed`.
  - Backend validation in `POST /api/tournaments/:id/next-round`: enforces that all matches in the current round are completed before generating the next round.
  - UI button disablement with clear notice of remaining pending boards.
  - Automatic transition to "Finalize & Complete" when all planned rounds are completed.
- **Strict Tournament Winner Validation & Co-Champion Support**:
  - Backend validation in `PATCH /api/tournaments/:id/complete`: verifies all matches are completed across all rounds.
  - Recalculates final standings with full FIDE tiebreak hierarchy (Buchholz, Sonneborn-Berger, Cut-1, Most Wins, Black Wins).
  - Unbreakable tie detection: identifies co-champions if all tiebreak metrics are identical rather than picking arbitrarily.
  - Records `winnerId`, `winnerName`, and `championDetails` in the database.
  - Displays Official Tournament Champion banner/podium across all views.
- **FIDE Color Allocation Engine Optimization**:
  - Enhanced candidate sorting in Swiss pairing with color compatibility penalty scoring.
  - Prioritizes opponents who allow both players to alternate colors with 0 penalty.
  - Equal-preference tiebreaker that assigns White to previous Black player and Black to previous White player.
  - Added unit tests verifying alternating colors over 3+ consecutive rounds.

### Fixed
- Fixed odd participant BYE scoring: BYE matches now automatically receive a 1.0 point win without requiring manual arbiter score toggles.
- Fixed unvalidated next round clicks that could generate rounds prematurely while matches were in progress.

---

## [2.0.0] - November 2026

### Added
- **Tri-Mode Architecture**:
  - Offline Standalone mode with browser-side IndexedDB persistence (`chess-tournament-db`).
  - Offline LAN mode binding to `0.0.0.0` with dynamic host IP discovery and QR link generation.
  - Online Internet mode with real-time Socket.IO synchronization.
- **Frontend Routing & Portals**:
  - `TournamentListPage` — Public directory of all available tournaments.
  - `TournamentPublicPage` — Live scoreboard, pairings, round history, and announcements with auto-scroll.
  - `AdminLoginPage` — Secure administrator authentication.
  - `AdminDashboardPage` — Hub for managing multiple tournaments, LAN setup, and server status.
  - `CreateTournamentPage` — 3-step wizard with text and CSV participant ingestion.
  - `AdminTournamentPage` — Comprehensive arbiter console with round navigation, result entry, confirmation, round reopening, and audit logs.
  - `ParticipantPage` — Dedicated personal portal for players to find their board, opponent, colors, and match history.
- **Security & Authorization**:
  - `bcryptjs` password hashing (salt rounds: 10).
  - JWT `authMiddleware` and `requireAdmin` role enforcement on all write/administrative API routes.
  - Rate limiting via `express-rate-limit` (general 100/15min, auth 10/15min).
  - Helmet HTTP security headers.
  - Socket.IO connection token validation.
- **Tournament Engine & Testing**:
  - 21 automated unit tests with Vitest covering Swiss pairing, Round Robin (Berger tables), all 7 tie-breakers (Buchholz, Cut-1, Median, SB, Progressive, Wins, Black Wins), validator, and FIDE compliance audits.
  - Dedicated `/export` endpoint for complete tournament disaster-recovery JSON dumps.
  - Official match result confirmation workflow and audit logs (`MatchAuditLog`).
- **PWA Support**:
  - Service worker caching with `vite-plugin-pwa` and Workbox.
  - Offline manifest with standalone display mode and shortcut actions.

### Fixed
- Fixed unauthenticated routes where any client could start rounds or submit results.
- Fixed plain-text password comparison in auth routes.
- Fixed single-tournament UI limitation by implementing React Router v6 multi-tournament directory.
- Fixed state loss on page refresh via IndexedDB storage adapter and local caching.
- Resolved module-runner and peer dependency conflicts across the monorepo.
