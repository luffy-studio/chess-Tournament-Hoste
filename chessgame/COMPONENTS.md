# Component Documentation

## Complete Component Structure

All components have been properly extracted and organized for maximum readability and maintainability.

---

## 📁 File Structure

```
src/
├── types.ts                           # Type definitions
├── utils/
│   ├── tournamentUtils.ts            # Tournament logic
│   └── csvUtils.ts                   # CSV utilities
├── components/
│   ├── LoginModal.tsx                # Authentication modal
│   ├── Header.tsx                    # App header with role selector
│   ├── SetupWizard.tsx               # Tournament setup form
│   ├── NoTournamentMessage.tsx       # Waiting message for participants
│   ├── SummaryCards.tsx              # Tournament stats cards
│   ├── RoundControls.tsx             # Admin round controls
│   ├── RoundDisplay.tsx              # Participant round info
│   ├── PairingsBoard.tsx             # Match pairings display
│   ├── StandingsTable.tsx            # Leaderboard table
│   ├── ScoreToggle.tsx               # Score entry buttons
│   └── Footer.tsx                    # Footer with exports
├── ChessTournamentComplete.tsx       # Main app (ACTIVE)
├── ChessTournamentRefactored.tsx     # Previous version
├── ChessTournament.tsx               # Original (reference)
└── App.tsx                           # Entry point
```

---

## 📦 Component Details

### 1. **LoginModal** (`components/LoginModal.tsx`)

**Purpose:** Admin authentication interface

**Props:**
- `username: string` - Current username input
- `password: string` - Current password input
- `error: string` - Error message to display
- `onUsernameChange: (value: string) => void` - Username change handler
- `onPasswordChange: (value: string) => void` - Password change handler
- `onSubmit: (e: React.FormEvent) => void` - Form submit handler
- `onCancel: () => void` - Cancel button handler

**Features:**
- Full-screen modal overlay
- Username and password inputs
- Error display
- Login and Cancel buttons
- Form validation

---

### 2. **Header** (`components/Header.tsx`)

**Purpose:** App header with role selector and controls

**Props:**
- `userRole: UserRole` - Current user role
- `isAdminAuthenticated: boolean` - Admin auth status
- `mode: Mode` - Tournament mode
- `hasPlayers: boolean` - Whether tournament is active
- `onRoleChange: (role: UserRole) => void` - Role switch handler
- `onNewTournament: () => void` - New tournament handler
- `onLogout: () => void` - Logout handler

**Features:**
- App title and branding
- Admin/Participant toggle
- New Tournament button (admin only)
- Logout button (admin only)
- Tournament status display

---

### 3. **SetupWizard** (`components/SetupWizard.tsx`)

**Purpose:** Tournament creation form

**Props:**
- `namesText: string` - Participant names (one per line)
- `mode: Mode` - Tournament format
- `roundsPlanned: number` - Number of rounds
- `byePoints: number` - Points for BYE
- `onNamesChange: (v: string) => void` - Names change handler
- `onModeChange: (v: Mode) => void` - Mode change handler
- `onRoundsPlannedChange: (v: number) => void` - Rounds change handler
- `onByePointsChange: (v: number) => void` - BYE points handler
- `onStart: () => void` - Start tournament handler

**Features:**
- Textarea for participant names
- Swiss vs Round-robin selector
- Rounds configuration
- BYE points selector
- Start Tournament button

---

### 4. **NoTournamentMessage** (`components/NoTournamentMessage.tsx`)

**Purpose:** Message shown to participants when no tournament exists

**Props:** None (stateless)

**Features:**
- Eye icon
- "No Active Tournament" heading
- Waiting message

---

### 5. **SummaryCards** (`components/SummaryCards.tsx`)

**Purpose:** Display tournament statistics

**Props:**
- `currentRound: number` - Current round number
- `mode: Mode` - Tournament mode
- `participantsCount: number` - Number of participants
- `leaderName: string` - Name of current leader

**Features:**
- Three cards: Round, Participants, Leader
- Icons for visual appeal
- Responsive grid layout
- Mode-specific descriptions

---

### 6. **RoundControls** (`components/RoundControls.tsx`)

**Purpose:** Admin controls for round navigation

**Props:**
- `mode: Mode` - Tournament mode
- `currentRound: number` - Current round
- `totalRounds: number` - Total number of rounds
- `onNextRound: () => void` - Next round handler
- `onPrevRound: () => void` - Previous round handler
- `onNextRoundClick: () => void` - Generate next round (Swiss)

**Features:**
- Mode display
- "Generate Next Round" button (Swiss)
- Prev/Next navigation (Round-robin)
- Disabled state handling

---

### 7. **RoundDisplay** (`components/RoundDisplay.tsx`)

**Purpose:** Show current round to participants

**Props:**
- `currentRound: number` - Current round number
- `mode: Mode` - Tournament mode

**Features:**
- Current round heading
- Mode badge
- Instructional text

---

### 8. **PairingsBoard** (`components/PairingsBoard.tsx`)

**Purpose:** Display match pairings with score entry

**Props:**
- `matches: Match[]` - Matches for current round
- `players: Participant[]` - All participants
- `userRole: UserRole` - Current user role
- `isAdminAuthenticated: boolean` - Admin auth status
- `byePoints: number` - BYE point value
- `onUpdateResult: (id: number, result: Exclude<Result, null>) => void` - Result handler

**Features:**
- Board number display
- Player names (White/Black)
- Score entry buttons (admin)
- Result display (participant)
- BYE handling
- Responsive layout

---

### 9. **StandingsTable** (`components/StandingsTable.tsx`)

**Purpose:** Display live leaderboard

**Props:**
- `standings: Standing[]` - Current standings
- `players: Participant[]` - All participants
- `pairings: Match[]` - All matches

**Features:**
- Rank column
- Participant names
- Scores (with decimals)
- Win count
- Auto-sorting by score

---

### 10. **ScoreToggle** (`components/ScoreToggle.tsx`)

**Purpose:** Win/Draw/Loss score entry buttons

**Props:**
- `value: Result` - Current result
- `onChange: (v: Exclude<Result, null>) => void` - Change handler

**Features:**
- Three-button toggle
- "A wins", "Draw", "B wins"
- Active state highlighting
- Score display (1–0, 0.5–0.5, 0–1)

---

### 11. **Footer** (`components/Footer.tsx`)

**Purpose:** Footer with scoring info and exports

**Props:**
- `byePoints: number` - BYE point value
- `userRole: UserRole` - Current user role
- `isAdminAuthenticated: boolean` - Admin auth status
- `onExportResults: () => void` - Results export handler
- `onExportStandings: () => void` - Standings export handler
- `onExportBoards: () => void` - Boards export handler

**Features:**
- Scoring rules display
- CSV export buttons (admin only)
- Responsive layout

---

## 🔧 Utilities

### **tournamentUtils.ts**

**Functions:**
- `shuffle<T>(arr: T[]): T[]` - Randomize array
- `nameOf(id: number, players: Participant[]): string` - Get player name
- `buildScoreBracketPairsFromStandings(...)` - Swiss pairing logic
- `roundRobinSchedule(playerIds: number[]): number[][][]` - Round-robin schedule

### **csvUtils.ts**

**Functions:**
- `csvEscape(v: unknown): string` - Escape CSV special characters
- `rowsToCSV(rows: (string | number)[][]): string` - Convert to CSV
- `downloadCSV(filename: string, csv: string): void` - Trigger download

---

## 📊 Component Hierarchy

```
ChessTournamentComplete (Main)
│
├── LoginModal (conditional)
│
├── Header
│   ├── Role Selector
│   ├── New Tournament Button
│   └── Logout Button
│
├── SetupWizard (admin, no tournament)
│   ├── Participant Input
│   ├── Mode Selector
│   ├── Rounds Input
│   ├── BYE Points Selector
│   └── Start Button
│
├── NoTournamentMessage (participant, no tournament)
│
├── SummaryCards (active tournament)
│   ├── Round Card
│   ├── Participants Card
│   └── Leader Card
│
├── RoundControls (admin, active tournament)
│
├── RoundDisplay (participant, active tournament)
│
├── Section (active tournament)
│   ├── PairingsBoard
│   │   └── ScoreToggle (per match)
│   └── StandingsTable
│
└── Footer (active tournament)
    └── Export Buttons (admin only)
```

---

## 🎨 Design Patterns

### 1. **Prop Drilling**
- Clean data flow from parent to children
- No context needed for this size

### 2. **Conditional Rendering**
- Components show/hide based on state
- Role-based access control

### 3. **Composition**
- Small, focused components
- Reusable pieces

### 4. **Separation of Concerns**
- UI components separate from logic
- Business logic in utilities
- Types in dedicated file

### 5. **Single Responsibility**
- Each component has one job
- Easy to understand and test

---

## 📈 Component Metrics

| Component | Lines | Props | Complexity |
|-----------|-------|-------|------------|
| LoginModal | 76 | 7 | Low |
| Header | 80 | 7 | Medium |
| SetupWizard | 76 | 9 | Low |
| NoTournamentMessage | 12 | 0 | Low |
| SummaryCards | 43 | 4 | Low |
| RoundControls | 54 | 6 | Medium |
| RoundDisplay | 23 | 2 | Low |
| PairingsBoard | 63 | 6 | Medium |
| StandingsTable | 48 | 3 | Low |
| ScoreToggle | 35 | 2 | Low |
| Footer | 39 | 6 | Low |
| **Main App** | **348** | **0** | **High** |

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Example for SetupWizard
test('calls onStart when Start Tournament clicked', () => {
  const onStart = jest.fn();
  const { getByText } = render(<SetupWizard onStart={onStart} ... />);
  fireEvent.click(getByText('Start Tournament'));
  expect(onStart).toHaveBeenCalled();
});
```

### Integration Tests
```typescript
// Example for PairingsBoard
test('shows score toggle for admin', () => {
  const { getByText } = render(
    <PairingsBoard userRole="admin" isAdminAuthenticated={true} ... />
  );
  expect(getByText('A wins (1–0)')).toBeInTheDocument();
});
```

### E2E Tests
```typescript
// Example full flow
test('admin can create tournament and enter scores', async () => {
  // 1. Login as admin
  // 2. Enter participant names
  // 3. Start tournament
  // 4. Enter match results
  // 5. Verify standings update
});
```

---

## 🚀 Performance Considerations

### Optimizations Applied
- `useMemo` for expensive calculations
- Conditional rendering to avoid wasted renders
- Props instead of context (less re-renders)
- Pure functional components

### Future Optimizations
- React.memo for expensive components
- useCallback for event handlers
- Virtual scrolling for large participant lists
- Code splitting with React.lazy

---

## 🔄 Data Flow

```
User Action
    ↓
Event Handler (in Main)
    ↓
State Update
    ↓
Props Update
    ↓
Component Re-render
    ↓
UI Update
```

---

## 💡 Usage Examples

### Creating a Tournament
```typescript
<SetupWizard
  namesText="Alice\nBob\nCarol"
  mode="swiss"
  roundsPlanned={3}
  byePoints={1}
  onNamesChange={setNamesText}
  onModeChange={setMode}
  onRoundsPlannedChange={setRoundsPlanned}
  onByePointsChange={setByePoints}
  onStart={startTournament}
/>
```

### Displaying Pairings
```typescript
<PairingsBoard
  matches={currentRoundMatches}
  players={allPlayers}
  userRole="admin"
  isAdminAuthenticated={true}
  byePoints={1}
  onUpdateResult={(id, result) => updateMatchResult(id, result)}
/>
```

---

## 📚 Related Documentation

- `REFACTORING.md` - Refactoring process details
- `ADMIN_CREDENTIALS.md` - Authentication info
- `ROLES.md` - Role permissions
- `README.md` - Project overview

---

## ✅ Checklist

- [x] All components extracted
- [x] Props interfaces defined
- [x] Components properly typed
- [x] Clean imports/exports
- [x] Reusable components
- [x] Single responsibility
- [x] Documentation complete

---

**Total Components:** 11  
**Total Utilities:** 2 files  
**Main Component Size:** 348 lines (down from 680)  
**Average Component Size:** ~45 lines  
**Code Organization:** ⭐⭐⭐⭐⭐

---

**Last Updated:** November 6, 2025  
**Version:** 2.0.0 (Fully Componentized)
