# Quick Start Guide

## Getting Started

### Installation
```bash
cd chessgame
npm install
npm run dev
```

Open your browser to `http://localhost:5173`

---

## Using the Platform

### 1. Choose Your Role

When you open the app, you'll see a **role selector** in the top-right corner:

- **Admin Button** (with gear icon) - For tournament organizers
- **Participant Button** (with eye icon) - For players viewing the tournament

Click your preferred role to switch views.

---

## Admin Guide

### Step 0: Login

1. Click the **"Admin"** button in the top-right corner
2. A login modal will appear
3. Enter credentials:
   - **Username:** `admin`
   - **Password:** `chess2025`
4. Click **"Login"**

🔒 **Note:** You must be logged in to access admin features.

### Step 1: Create a Tournament

1. Make sure you're in **Admin** mode (gear icon active)
2. Enter participant names (one per line) in the text area
3. Choose tournament format:
   - **Swiss**: Dynamic pairing based on scores
   - **Round-robin**: All rounds pre-generated
4. Set bye points (default: 1.0)
5. Set number of planned rounds (optional for Swiss)
6. Click **"Start Tournament"**

### Step 2: Enter Match Results

1. For each board, you'll see three buttons:
   - **A wins (1–0)** - White player wins
   - **Draw (0.5–0.5)** - Draw
   - **B wins (0–1)** - Black player wins
2. Click the appropriate result button
3. Results update the standings instantly

### Step 3: Generate Next Round

**For Swiss System:**
- Click **"Generate Next Round"** button
- System automatically pairs players based on current scores

**For Round-robin:**
- Use **"Prev"** and **"Next"** buttons to navigate rounds
- All rounds are pre-set at tournament start

### Step 4: Export Data

At the bottom of the page, click:
- **Export Results CSV** - All match results
- **Export Standings CSV** - Final rankings
- **Export Boards CSV** - Board assignments per round

---

## Participant Guide

### Step 1: Switch to Participant View

Click the **Participant** button (eye icon) in the top-right

### Step 2: View Current Round

You'll see:
- **Current Round Number** at the top
- **Tournament Mode** (Swiss or Round-robin)

### Step 3: Check Your Board Assignment

The board display shows:
- Board #
- **Participant A (White)** - Player with white pieces
- **Result** - Match outcome (1–0, ½–½, 0–1, or –)
- **Participant B (Black)** - Player with black pieces

### Step 4: Monitor Standings

On the right side, see the **live leaderboard** with:
- Rank (#)
- Player name
- Total score
- Number of wins

---

## Understanding Results

| Display | Meaning |
|---------|---------|
| 1–0 | White wins |
| 0–1 | Black wins |
| ½–½ | Draw |
| BYE | Player gets bye (no opponent) |
| – | Match not yet played |

---

## Tips & Tricks

### For Admins
- ✅ Always logout when leaving your device unattended
- ✅ Change the default password in `src/ChessTournament.tsx`
- ✅ Start with 8 participants for best experience
- ✅ Swiss format works best for 4+ rounds
- ✅ Round-robin is perfect for smaller groups (4-8 players)
- ✅ Export data after each round as backup

### For Participants
- ✅ Refresh page to see latest updates
- ✅ Check standings to see your current rank
- ✅ Look for your name in the board pairings
- ✅ Note whether you're playing White or Black

---

## Common Scenarios

### Scenario: Late Arrival
**Admin**: Add player name to the list before starting tournament

### Scenario: Player Withdraws
**Admin**: Player receives BYE points for remaining rounds (manual handling)

### Scenario: Dispute Result
**Admin**: Click the result buttons again to change the outcome

### Scenario: Viewing on Mobile
**Both**: Layout adapts for mobile screens, scroll horizontally if needed

---

## Keyboard Shortcuts

Currently not implemented. Future feature!

---

## Troubleshooting

### "No Active Tournament" message
- **Cause**: Admin hasn't created tournament yet
- **Solution**: Switch to Admin mode and create tournament

### Standings not updating
- **Cause**: Results not entered yet
- **Solution**: Admin needs to enter match results

### Can't see score buttons
- **Cause**: You're in Participant mode
- **Solution**: Switch to Admin mode to enter scores

### Can't access Admin panel
- **Cause**: Not logged in
- **Solution**: Click Admin button, login with `admin` / `chess2025`

### Login failed
- **Check**: Username is `admin` (lowercase)
- **Check**: Password is `chess2025` (case-sensitive)
- **Check**: No extra spaces in username/password

---

## Need Help?

Check out:
- `README.md` - Full documentation
- `ROLES.md` - Detailed role permissions
- Built-in tests run on page load (check console)

---

## Example Tournament

Here's a quick 4-player Swiss tournament:

1. **Admin**: Add names (Alice, Bob, Carol, David)
2. **Admin**: Select Swiss, 3 rounds, Start Tournament
3. **Round 1**: Enter results
4. **Admin**: Generate Next Round
5. **Round 2**: Enter results
6. **Admin**: Generate Next Round
7. **Round 3**: Enter results
8. **Admin**: Export CSV files
9. **Participants**: View final standings

Done! 🎉
