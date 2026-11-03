# READ ME FIRST — AI-Oriented Overview

This document gives an AI (and humans) a concise, structured map of the project’s purpose, architecture, file structure, data contracts, flows, and extension points. It is the single best place to start understanding and modifying the codebase.

---

## TL;DR
- What: A web app to run chess tournaments (Swiss and Round-robin).
- Who: Admin manages everything; participants get a read-only view.
- Core features:
  - Setup wizard, pairing generation, score entry, standings
  - BYE handling, CSV exports
  - On-hold participant visibility
  - Add participants mid-tournament (queued for next Swiss round)
  - Full admin roster control (add/edit/remove instantly)
- Entry point: `src/App.tsx` → `src/ChessTournamentComplete.tsx`

---

## Purpose and Core Concepts
- Run and manage local chess tournaments end-to-end.
- Support two modes:
  - Swiss: rounds generated from current standings.
  - Round-robin: all rounds pre-generated; navigate among them.
- Admin only:
  - Start/reset tournament, record results, export CSVs
  - Manage roster (add instantly, edit names, remove)
  - Queue newcomers for next round (Swiss) via Add Panel
  - Put 1 participant “On Hold” (pre-start odd-count handling) and add back later
- Participants: Read-only view of pairings/standings and on-hold banner

---

## Quickstart (Dev)
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`

---

## File Structure (Key Files Only)

- `src/`
  - `App.tsx` — App entry; renders the complete tournament container
  - `ChessTournamentComplete.tsx` — Main orchestrator component (state + coordination)
  - `ChessTournamentRefactored.tsx` — Alternate/refactored variant (kept for reference/examples)
  - `ChessTournament.tsx` — Legacy variant (not primary)
  - `types.ts` — Centralized types and constants (Participant, Match, Standing, Mode, BYE_ID)
  - `components/`
    - `Header.tsx` — Role selector, new tournament, logout; displays mode
    - `LoginModal.tsx` — Admin auth modal (username/password)
    - `SetupWizard.tsx` — Pre-start: names list, mode, rounds, bye points, hold controls
    - `SummaryCards.tsx` — Round number, participant count, current leader
    - `RoundControls.tsx` — Next round (Swiss) / navigation (Round-robin)
    - `RoundDisplay.tsx` — Participant-facing “current round” banner
    - `PairingsBoard.tsx` — Pairings table; admin score entry via `ScoreToggle`
    - `StandingsTable.tsx` — Standings (score, computed wins)
    - `ScoreToggle.tsx` — Admin W/D/L input control
    - `AddParticipantPanel.tsx` — Queue newcomers for next Swiss round (Swiss-only)
    - `ParticipantManager.tsx` — Admin-only instant Add/Edit/Remove during tournament
    - `OnHoldDisplay.tsx` — Amber banner: who is on hold (visible to all), admin can add back
    - `NoTournamentMessage.tsx` — Participant view when no tournament exists
    - `Footer.tsx` — Export CSV buttons and scoring legend
  - `utils/`
    - `tournamentUtils.ts` — Core logic: `shuffle`, `nameOf`, `buildScoreBracketPairsFromStandings`, `roundRobinSchedule`
    - `csvUtils.ts` — `rowsToCSV`, `downloadCSV`
  - `main.tsx` — React/Vite bootstrap

- Root documentation (key):
  - `ADD_PARTICIPANT_FEATURE.md` — Queue next-round additions (Swiss)
  - `ON_HOLD_FEATURE.md` + `ON_HOLD_QUICK_GUIDE.md` — On-hold design and visual guide
  - `PARTICIPANT_MANAGER_FEATURE.md` — Instant roster control (add/edit/remove)
  - `FEATURES_SUMMARY.md` — Overview of all major features (v2.4.0)
  - `QUICK_START.md` — Operational quick reference

---

## Data Contracts (Types)
Defined in `src/types.ts`:
- `UserRole` = "admin" | "participant"
- `Mode` = "swiss" | "roundrobin"
- `Result` = "W" | "D" | "L" | null
- `Match` { id, board, whiteId, blackId, result }
- `Standing` { id, score }
- `Participant` { id, name }
- `BYE_ID = -1` (virtual participant)

Notes:
- IDs are numeric and unique per participant. BYE is represented by `-1`.
- Standings are computed as a sorted array of `{ id, score }` (desc by score, tiebreak by id).

---

## Core State (Main Container: ChessTournamentComplete.tsx)
- Auth:
  - `isAdminAuthenticated`, `loginUsername`, `loginPassword`, `loginError`
  - Admin credentials are static for now (username: admin, password: chess2025)
- Role:
  - `userRole` — controls admin tools visibility
- Setup:
  - `mode` — swiss/roundrobin
  - `namesText` — raw input (one name per line) pre-start
  - `byePoints` — points awarded on BYE (0, 0.5, 1)
  - `roundsPlanned` — planned count (RR auto)
  - `holdName` — at most one held participant name pre-start
- Runtime:
  - `players: Participant[] | null` — active roster (includes BYE in RR when odd)
  - `pairings: Match[]` — flattened list of all rounds; chunked by `matchesPerRound`
  - `currentRound` — 1-based index for display/navigation
- Additions:
  - `newParticipantName` — input for queued additions
  - `participantQueue: string[]` — queued names (Swiss only, applied on next-round generation)

Derived:
- `matchesPerRound` — floor(players.length / 2)
- `standings = useScores(pairings, players, byePoints)` — memoized total scores
- `rounds` — chunked view of `pairings` by round

---

## Algorithms and Rules

### Scoring (`useScores` hook)
- Sum of results over all played matches; BYE adds `byePoints` automatically to the non-BYE opponent.
- Result mapping: W=1 to white, L=1 to black, D=0.5 to both, null=0.
- Standings sorted by score desc, then id asc.

### Pairing — Swiss
- `buildScoreBracketPairsFromStandings(standings, playerCount)` forms score brackets and pairs within, with basic alternation for colors.
- When generating a new Swiss round:
  - If `participantQueue` non-empty: convert names to new `Participant` objects, append to `players`, clear queue, recompute pairings from updated standings.
  - Else: pair from current standings directly.

### Pairing — Round-robin
- `roundRobinSchedule(ids)` produces a full schedule up-front (all rounds). If odd, BYE is included.
- Navigation is purely via `currentRound`; pairings are precomputed.

### BYE Handling
- `BYE_ID = -1` is injected in RR when odd and used implicitly in Swiss when needed.
- BYE matches never accept manual scores; result description shows BYE and auto-awarded points.

---

## Admin Capabilities
- Authentication via `LoginModal` (static credentials for now)
- Setup via `SetupWizard`: input participants, choose mode, set `roundsPlanned`, `byePoints`, and manage pre-start hold
- Generate Swiss rounds via `RoundControls`; navigate RR via Prev/Next
- Score entry via `PairingsBoard` + `ScoreToggle`
- Exports via `Footer`:
  - Results CSV: `[round,board,white_name,black_name,white_id,black_id,result]`
  - Standings CSV: `[rank,participant_id,participant,score]`
  - Boards-by-round CSV: per-participant per-round board index (or BYE)
- Roster management:
  - `AddParticipantPanel` (Swiss only): queue names to join on next round
  - `ParticipantManager`: add instantly, edit names, or remove participants during tournament
  - `OnHoldDisplay`: shows who is held; admin can add back (pre-start hold lives in `holdName`)

---

## Participant Experience
- If no tournament: `NoTournamentMessage`
- During tournament: read-only view of current round info, pairings, and standings
- Visibility: On-Hold banner is shown to all users for transparency

---

## UI Flow (High Level)

```
App.tsx → ChessTournamentComplete.tsx
  ├─ Header (role switch, new tournament, logout)
  ├─ [Admin + no players] SetupWizard (names, mode, rounds, bye, hold)
  ├─ [Participant + no players] NoTournamentMessage
  ├─ [players] SummaryCards (Round, Participants, Leader)
  ├─ [players + holdName] OnHoldDisplay (visible to all)
  ├─ [Admin] AddParticipantPanel (queue next-round additions; Swiss only)
  ├─ [Admin] ParticipantManager (instant add/edit/remove)
  ├─ [Admin] RoundControls (Swiss: generate; RR: prev/next)
  ├─ [Participant] RoundDisplay (current round info)
  ├─ PairingsBoard (admin scores vs participant results)
  ├─ StandingsTable (carry-forward standings)
  └─ Footer (exports, scoring legend)
```

---

## Key Invariants and Edge Cases
- Only one `holdName` at a time (pre-start; used to fix odd counts)
- `AddParticipantPanel` disabled in Round-robin (fixed schedule)
- Adding/removing participants mid-tournament may affect pairings; UI warns admin
- BYE matches are informational (no manual result entry)
- Names are deduplicated on setup via Set; IDs are sequential from 1

---

## Extensibility Guide
- To add new tournament formats: extend `Mode`, implement pairing generator in `tournamentUtils.ts`, then integrate control buttons and display logic in `ChessTournamentComplete.tsx`.
- To add tiebreakers: extend `useScores` (or compute separate tiebreak fields) and adjust sorting/UI in `StandingsTable`.
- To support multiple on-hold participants: change `holdName` → `holdList: string[]` and update `SetupWizard` + `OnHoldDisplay`.
- To persist data: add storage (localStorage or backend API) around `players`, `pairings`, `currentRound`, and `standings` inputs.
- To improve auth: replace static credentials with real auth and guard admin-only routes/features.

---

## CSV Schemas
- Results (`results.csv`):
  - Columns: `round, board, white_name, black_name, white_id, black_id, result`
  - Result values: `1-0`, `0-1`, `0.5-0.5`, or `BYE(<id>)`
- Standings (`standings.csv`):
  - Columns: `rank, participant_id, participant, score`
- Boards by round (`boards_by_round.csv`):
  - Columns: `participant_id, participant, Round 1, Round 2, ...`
  - Values: board number or `BYE`

---

## Testing Hints (Manual)
1. Start Swiss with 8 names → verify round 1 pairings
2. Enter results → verify standings update
3. Queue a new name via Add Panel → generate next round → verify they join with 0 score
4. Add a name instantly via Participant Manager → verify immediate appearance in standings and roster
5. Edit a name → verify updated in pairings, standings, and exports
6. Remove a participant → confirm results nullified where they played
7. Try Round-robin → verify all rounds pre-generated and navigation works
8. Hold flow pre-start (odd count) → move last to hold → verify OnHoldDisplay in tournament view; add back

---

## Known Constraints
- Round-robin cannot accept queued mid-tournament additions (pre-set schedule)
- Single `holdName` design (not a list) to match odd-count handling
- No persistent storage (state is in-memory)

---

## Glossary
- BYE: Automatic point assignment when opponent is missing or odd participant count
- Standings: Sorted list of participants by total score
- Score Bracket: Grouping by identical scores for Swiss pairing

---

## Pointers to Deeper Docs
- On Hold design: `ON_HOLD_FEATURE.md`, `ON_HOLD_QUICK_GUIDE.md`
- Add mid-tournament (Swiss queue): `ADD_PARTICIPANT_FEATURE.md`
- Instant roster control: `PARTICIPANT_MANAGER_FEATURE.md`
- Everything at a glance: `FEATURES_SUMMARY.md`
- Operations quick reference: `QUICK_START.md`

---

## Security (Current)
- Static admin credentials: `admin` / `chess2025` (dev/demo only)
- Admin-only UI sections guarded by `userRole` + `isAdminAuthenticated`

---

## TODO / Future Enhancements

### High Priority
- [ ] Add **localStorage persistence** so tournament state survives page reloads
- [ ] Implement **undo/redo** for participant changes (edit/remove)
- [ ] Support **multiple participants on hold** (change `holdName` to `holdList: string[]`)
- [ ] Add **search/filter** to participant list in ParticipantManager
- [ ] Improve **mobile responsiveness** (some horizontal scrolling on small screens)

### Medium Priority
- [ ] Add **tiebreakers** (Buchholz, Sonneborn-Berger) to standings
- [ ] Implement **real authentication** (replace static admin credentials)
- [ ] Add **bulk CSV import** for participants
- [ ] Support **participant profiles** (rating, age, club, etc.)
- [ ] Add **tournament history/archive** feature
- [ ] Implement **drag-and-drop reordering** for participants
- [ ] Add **match history** view per participant

### Low Priority / Nice-to-Have
- [ ] Add **tournament templates** (save/load configurations)
- [ ] Implement **real-time sync** across devices (WebSocket/Firebase)
- [ ] Add **analytics dashboard** (win rates, performance graphs)
- [ ] Support **team tournaments** (team scoring)
- [ ] Add **email notifications** for pairings/results
- [ ] Implement **printable pairing sheets** (PDF export)
- [ ] Add **dark mode** toggle
- [ ] Support **custom scoring systems** (not just 1/0.5/0)
- [ ] Add **arbiter notes** field per match
- [ ] Implement **accelerated Swiss** pairing option

### Technical Debt
- [ ] Add **unit tests** (Jest/Vitest) for core logic
- [ ] Add **E2E tests** (Playwright/Cypress) for key flows
- [ ] Improve **TypeScript strictness** (enable strict mode)
- [ ] Add **error boundaries** for better error handling
- [ ] Implement **code splitting** for better load times
- [ ] Add **performance monitoring** (bundle size, render times)
- [ ] Document **accessibility** compliance (WCAG)
- [ ] Add **internationalization** (i18n) support

### Known Issues
- [ ] Fix horizontal scroll on mobile for ParticipantManager
- [ ] Improve pairing algorithm to avoid repeat opponents in Swiss
- [ ] Add validation for duplicate participant names
- [ ] Handle edge case: removing participant mid-round (clear current pairings)

---

## Final Notes for AI Agents
- Main orchestrator is `ChessTournamentComplete.tsx`; prefer modifying there for behavior changes.
- Tournament logic is intentionally separate in `utils/` — update these when altering pairing/scoring.
- Types are centralized in `types.ts` — extend them thoughtfully and update all dependent components.
- UI is modular; prefer adding self-contained components under `components/` and injecting them into the main container.
- Mind the mode (Swiss vs Round-robin) when introducing new features; some actions are intentionally mode-gated.
