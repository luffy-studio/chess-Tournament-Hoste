# Quick Start Guide - Chess Tournament Platform

## 🚀 Getting Started

### Installation
```bash
npm install
npm run dev
```

Access at: `http://localhost:5173`

---

## 👤 Admin Access

**Username:** `admin`  
**Password:** `chess2025`

---

## ✨ What's New in v2.4.0

### 1. **See Who's On Hold** 🟠
Everyone can see participants temporarily not playing.

**Location:** Amber banner during tournament  
**Visible to:** Everyone  
**Admin action:** Click "Add Back to Tournament"

---

### 2. **Add Late Arrivals** ➕
Two ways to add participants after tournament starts:

#### Option A: Queue for Next Round
- Click "Add Participant (Next Round)" panel
- Enter names, click Add
- They join when you generate next round (Swiss only)

#### Option B: Add Instantly 👥
- Use "Manage Participants" panel
- Add directly → appears immediately
- Best for urgent late arrivals

---

### 3. **Edit Names** ✏️
Fix typos or name mistakes during tournament.

**How:**
1. Scroll to "Manage Participants"
2. Click Edit (✏️) icon next to name
3. Type new name
4. Click Save (💾) or press Enter

---

### 4. **Remove Participants** 🗑️
Remove dropouts or incorrect entries.

**How:**
1. Find participant in "Manage Participants"
2. Click Remove (🗑️) icon
3. Confirm removal
4. Their matches are cleared

---

## 🎯 Common Scenarios

### Scenario 1: Player Arrives Late
```
✅ Use "Manage Participants" → Add instantly
✅ Or use "Add Participant Panel" → Queue for next round
```

### Scenario 2: Name Typo
```
✅ "Manage Participants" → Click Edit → Fix → Save
```

### Scenario 3: Odd Number of Players
```
✅ System shows "Unpaired" notice
✅ Click "Move to Hold"
✅ Everyone sees amber hold banner
```

### Scenario 4: Player Drops Out
```
✅ "Manage Participants" → Click Remove → Confirm
```

---

## 📍 Where to Find Features

### During Setup (Before Tournament)
- **Participant List:** Main text area
- **On Hold:** Appears when odd numbers detected
- **Move to Hold:** Button below participant list

### During Tournament (Admin View)
```
Top to Bottom:
1. Summary Cards
2. 🟠 On Hold Display (if applicable)
3. ➕ Add Participant Panel (queue system)
4. 👥 Manage Participants (instant changes)
5. Round Controls
6. Pairings & Standings
7. Export Buttons
```

---

## 🎨 Visual Cues

| Color | Meaning |
|-------|---------|
| 🟠 Amber | On hold / Warning |
| ⚫ Black | Primary actions |
| 🔴 Red | Destructive (remove) |
| 🟢 Green | Confirm (save) |
| ⚪ White | Background / Cancel |

---

## ⚠️ Important Tips

1. **Save Often:** Changes are instant, but backup your data
2. **Confirm Carefully:** Removals cannot be undone
3. **Swiss Only:** Queue system only works in Swiss format
4. **Communicate:** Tell participants about roster changes
5. **Test First:** Try features with small tournaments first

---

## 📚 Full Documentation

| Topic | File |
|-------|------|
| On Hold Feature | `ON_HOLD_FEATURE.md` |
| On Hold (Quick) | `ON_HOLD_QUICK_GUIDE.md` |
| Add Participants | `ADD_PARTICIPANT_FEATURE.md` |
| Manage Participants | `PARTICIPANT_MANAGER_FEATURE.md` |
| All Features | `FEATURES_SUMMARY.md` |

---

## 🆘 Troubleshooting

### Can't see participant manager?
→ Must be logged in as admin

### Add Participant button disabled?
→ Round-robin mode doesn't support queuing

### Can't edit participant name?
→ Click Edit icon first, then type

### Removed wrong participant?
→ Re-add them using "Add" in Participant Manager

---

## 🎓 Admin Workflow

```
1. Login as admin (username: admin, password: chess2025)
2. Enter participant names (one per line)
3. If odd number → Move to hold (optional)
4. Choose Swiss or Round-Robin
5. Click "Start Tournament"

During Tournament:
6. Enter scores (Win/Draw/Loss)
7. Add late arrivals via Participant Manager
8. Edit names if needed
9. Remove dropouts if needed
10. Generate next round (Swiss) or Navigate (Round-Robin)
11. Export results when done
```

---

## 🔄 Participant Workflow

```
1. Select "Participant" view
2. See current round and pairings
3. Check standings
4. See who's on hold (if any)
5. Wait for admin to update scores
6. Watch standings update live
```

---

## 💡 Pro Tips

1. **Queue vs Instant:** Use queue for planned additions, instant for urgent ones
2. **Hold Strategy:** Use hold for odd numbers before starting
3. **Edit Early:** Fix name typos as soon as you notice them
4. **Export Often:** Download CSV backups regularly
5. **Participant View:** Switch to participant view to see what players see

---

## 🎯 Feature Decision Tree

```
Need to add someone?
├─ Are they here NOW?
│  ├─ Yes → Use Participant Manager (instant)
│  └─ No → Use Add Panel (queue for next round)
│
Need to fix a name?
└─ Use Participant Manager → Edit

Need to remove someone?
└─ Use Participant Manager → Remove

Have odd numbers?
└─ Use "Move to Hold" before starting

Someone on hold wants back?
└─ Click "Add Back" on amber banner
```

---

## 📞 Need Help?

1. Check the specific feature documentation
2. Look for amber warning messages (they explain things)
3. Test with a small tournament first
4. Remember: Most actions are instant and visible

---

## Summary

**Key Point:** As admin, you have **full control** over participants during tournament. Add, edit, or remove anytime.

**Best Practice:** Communicate changes to participants, backup data, and test features.

**Admin Power:** Complete roster management without restarting tournaments!

---

**Version:** 2.4.0  
**Updated:** November 6, 2025  
**Happy Organizing! ♟️**
