# User Roles Documentation

## Overview
The Chess Tournament Platform now supports two distinct user roles:

1. **Admin** - Full control over tournament creation and management
2. **Participant** - View-only access to tournament boards and standings

## Role Toggle
Users can switch between Admin and Participant views using the role selector in the top-right header.

---

## Admin Role Features

### Full Access
- **Create Tournaments**: Set up new tournaments with participant names, format (Swiss/Round-robin), rounds, and bye points
- **Manage Rounds**: Generate next rounds (Swiss) or navigate through rounds (Round-robin)
- **Enter Scores**: Input match results using the interactive score toggle buttons
- **Export Data**: Download CSV files for results, standings, and board assignments
- **View Statistics**: See all tournament metrics including current round, participant count, and leader

### Admin Interface Elements
- Setup wizard for tournament creation
- Score entry buttons (Win/Draw/Loss)
- "Generate Next Round" button (Swiss mode)
- Round navigation buttons (Round-robin mode)
- "New Tournament" button
- CSV export buttons

---

## Participant Role Features

### Read-Only Access
- **View Pairings**: See current round board assignments with player names
- **View Results**: See match results displayed as scores (1–0, ½–½, 0–1, BYE)
- **View Standings**: See live leaderboard with ranks, scores, and win counts
- **Round Information**: See current round number and tournament mode

### Participant Interface
- Clean, simplified view focused on information display
- Current round indicator
- Read-only board display showing:
  - Board number
  - Participant A (White)
  - Result/Score
  - Participant B (Black)
- Standings table with ranks and scores

### Waiting State
When no tournament is active, participants see:
- Eye icon indicator
- "No Active Tournament" message
- "Waiting for the admin to create a tournament..." text

---

## UI Differences

| Feature | Admin | Participant |
|---------|-------|-------------|
| Create Tournament | ✅ Yes | ❌ No |
| Enter Scores | ✅ Yes (Interactive buttons) | ❌ No (View only) |
| Generate Rounds | ✅ Yes | ❌ No |
| Navigate Rounds | ✅ Yes | ❌ No (Auto-syncs) |
| View Boards | ✅ Yes | ✅ Yes |
| View Standings | ✅ Yes | ✅ Yes |
| Export CSV | ✅ Yes | ❌ No |
| Reset Tournament | ✅ Yes | ❌ No |

---

## Visual Indicators

### Role Badge
- **Admin**: Black background with UserCog icon
- **Participant**: Black background with Eye icon
- Active role is highlighted in black, inactive in white

### Header Display
- Admin Panel: "Admin Panel • [Mode]"
- Participant View: "Participant View • [Mode]"

---

## Typical Workflow

### Admin Workflow
1. Select "Admin" role
2. Create tournament with participant names
3. Choose tournament format (Swiss/Round-robin)
4. Configure bye points and rounds
5. Start tournament
6. Enter match results for each round
7. Generate/navigate to next round
8. Export results when tournament completes

### Participant Workflow
1. Select "Participant" role
2. Wait for admin to create tournament
3. View current round pairings
4. Check match results as they're entered
5. Monitor live standings
6. Track personal performance

---

## Technical Implementation

### State Management
- `userRole`: Tracks current role ("admin" | "participant")
- Role switching is instant and preserves tournament state
- All users see the same tournament data

### Conditional Rendering
- Components check `userRole === "admin"` before showing admin-only features
- Participant view filters out interactive elements
- Score display changes based on role (buttons vs. text)

### Security Note
This is a client-side implementation suitable for offline/local tournaments. For production use with remote participants, implement:
- Server-side authentication
- Role-based access control (RBAC)
- Secure API endpoints
- Real-time data synchronization

---

## Future Enhancements
- [ ] Multi-user support with separate admin/participant logins
- [ ] Real-time updates via WebSocket
- [ ] Participant authentication
- [ ] Tournament access codes
- [ ] Personal player dashboards
- [ ] Match notifications
