# Participant Manager Feature

## Overview
The **Participant Manager** gives admins **full control** to add, edit, or remove participants **during an active tournament**. This is perfect for handling late arrivals, name corrections, or unexpected changes.

---

## 🎯 Key Features

### ✅ **Add Participants Instantly**
- Add new participants directly during the tournament
- No need to queue them for next round
- They appear immediately with 0 score

### ✅ **Edit Participant Names**
- Fix typos or name mistakes
- Update names during tournament
- Changes reflect everywhere instantly

### ✅ **Remove Participants**
- Remove participants who drop out
- Clears their pairings (sets results to null)
- Confirmation prompt prevents accidents

### ✅ **Live Updates**
- All changes take effect immediately
- Standings update automatically
- No tournament restart needed

---

## 📋 How to Use

### Adding a New Participant

#### Step 1: Access the Manager
```
1. Log in as admin
2. Start a tournament
3. Scroll to "Manage Participants" section
```

#### Step 2: Enter Name
```
┌────────────────────────────────────────┐
│ Add New Participant                    │
│ ┌────────────────────┐                 │
│ │ Enter name...      │  [👤 Add]      │
│ └────────────────────┘                 │
└────────────────────────────────────────┘
```

#### Step 3: Click Add
```
✓ Participant added immediately
✓ Appears in participant list
✓ Shows with 0 score in standings
✓ Can be paired in current or next round
```

---

### Editing a Participant Name

#### Step 1: Find Participant
```
Current Participants (8)
┌────────────────────────────────────────┐
│ #1  Aditi              [✏️] [🗑️]       │
│ #2  Bhavesh            [✏️] [🗑️]       │
│ #3  Chirag             [✏️] [🗑️]       │
└────────────────────────────────────────┘
```

#### Step 2: Click Edit (✏️)
```
┌────────────────────────────────────────┐
│ ┌──────────────┐  [💾] [✖️]            │
│ │ Aditi        │  Save  Cancel         │
│ └──────────────┘                       │
└────────────────────────────────────────┘
```

#### Step 3: Type New Name & Save
```
✓ Name updated everywhere
✓ Pairings reflect new name
✓ Standings show updated name
✓ CSV exports use new name
```

---

### Removing a Participant

#### Step 1: Click Remove (🗑️)
```
Confirmation Dialog:
┌────────────────────────────────────────┐
│ Remove Aditi from tournament?          │
│ This will affect pairings.             │
│                                        │
│          [Cancel]  [OK]                │
└────────────────────────────────────────┘
```

#### Step 2: Confirm
```
✓ Participant removed from list
✓ Their pairings cleared (results → null)
✓ Removed from standings
✓ Count updated
```

---

## 🎨 Visual Design

### Main Panel
```
┌──────────────────────────────────────────────────────┐
│ Manage Participants                                  │
│ Add, edit, or remove participants during tournament  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Add New Participant                                  │
│ ┌────────────────────────────┐                      │
│ │ Enter participant name     │  [👤 Add]            │
│ └────────────────────────────┘                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Current Participants (8)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ #1  Aditi                      [✏️] [🗑️]        │ │
│ │ #2  Bhavesh                    [✏️] [🗑️]        │ │
│ │ #3  Chirag                     [✏️] [🗑️]        │ │
│ │ #4  Diya                       [✏️] [🗑️]        │ │
│ │ #5  Eshan                      [✏️] [🗑️]        │ │
│ │ #6  Fiza                       [✏️] [🗑️]        │ │
│ │ #7  Gautam                     [✏️] [🗑️]        │ │
│ │ #8  Himani                     [✏️] [🗑️]        │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ⚠️ Warning: Adding or removing participants during   │
│ a tournament may affect pairings and results.        │
│ Changes take effect immediately.                     │
└──────────────────────────────────────────────────────┘
```

---

## 💡 Use Cases

### 1. **Late Arrival**
```
Scenario: Player arrives after tournament started
Action: Add them via Participant Manager
Result: Joins immediately, can play current/next round
```

### 2. **Name Typo**
```
Scenario: Organizer misspelled "Bhavesh" as "Bhavsh"
Action: Click Edit, fix spelling, Save
Result: Name corrected everywhere
```

### 3. **Duplicate Entry**
```
Scenario: Same participant entered twice by mistake
Action: Click Remove on duplicate entry
Result: Duplicate removed, tournament continues
```

### 4. **Emergency Dropout**
```
Scenario: Participant has emergency, must leave
Action: Click Remove, confirm
Result: Removed from tournament, pairings cleared
```

### 5. **Wrong Participant Added**
```
Scenario: Added wrong person to tournament
Action: Remove wrong person, Add correct person
Result: Roster corrected
```

---

## 🔧 Technical Details

### State Management
```typescript
// Players state
const [players, setPlayers] = useState<Participant[] | null>(null);
```

### Add Handler
```typescript
const handleAddParticipantDirect = (name: string) => {
  if (!players) return;
  const maxId = Math.max(...players.map(p => p.id));
  const newParticipant: Participant = {
    id: maxId + 1,
    name,
  };
  setPlayers([...players, newParticipant]);
};
```

### Edit Handler
```typescript
const handleEditParticipant = (id: number, newName: string) => {
  if (!players) return;
  setPlayers(players.map(p => 
    p.id === id ? { ...p, name: newName } : p
  ));
};
```

### Remove Handler
```typescript
const handleRemoveParticipant = (id: number) => {
  if (!players) return;
  // Remove from players
  setPlayers(players.filter(p => p.id !== id));
  // Clear pairings for removed participant
  setPairings(pairings.map(m => {
    if (m.whiteId === id || m.blackId === id) {
      return { ...m, result: null };
    }
    return m;
  }));
};
```

### Component Props
```typescript
interface ParticipantManagerProps {
  participants: Participant[];
  onAddParticipant: (name: string) => void;
  onEditParticipant: (id: number, newName: string) => void;
  onRemoveParticipant: (id: number) => void;
}
```

---

## 📊 Behavior Details

### Adding Participants
- **ID Assignment:** Auto-increments from max existing ID
- **Initial Score:** 0.0 points
- **Visibility:** Appears immediately in all views
- **Pairing:** Available for current/next round pairings

### Editing Names
- **In-Place Editing:** Edit directly in the list
- **Enter to Save:** Press Enter key to save quickly
- **Cancel Option:** Cancel button to discard changes
- **Validation:** Cannot save empty names

### Removing Participants
- **Confirmation:** Requires confirmation dialog
- **Pairing Cleanup:** Clears results where participant played
- **Standings:** Automatically removed from standings
- **Permanent:** Cannot undo (must re-add if mistake)

---

## ⚠️ Important Notes

### Impact on Tournament
- ✅ Adding: Minimal impact, new participant starts fresh
- ⚠️ Editing: Name changes everywhere, no scoring impact
- 🚨 Removing: May affect pairings, clears match results

### Best Practices
1. **Add early:** Add late arrivals before they miss too many rounds
2. **Edit carefully:** Double-check names before saving
3. **Remove cautiously:** Confirm you're removing correct person
4. **Communicate:** Tell participants about roster changes

### Limitations
- Cannot remove participants with completed matches (results set to null)
- Cannot undo removals (must re-add)
- Editing doesn't preserve match history if name was involved
- No bulk operations (must add/edit/remove one at a time)

---

## 🎯 Difference from Other Features

### vs. Add Participant Panel
| Feature | Participant Manager | Add Participant Panel |
|---------|-------------------|----------------------|
| When to use | Instant changes | Queue for next round |
| Availability | Immediately | Next round only |
| Best for | Late arrivals, fixes | Planned additions |
| Edit/Remove | ✅ Yes | ❌ No |

### vs. On Hold
| Feature | Participant Manager | On Hold |
|---------|-------------------|---------|
| Add/Remove | Permanent | Temporary |
| Visibility | Changes roster | Shows banner |
| Best for | Roster changes | Temporary absence |
| Reversible | No (must re-add) | Yes (add back) |

---

## 🧪 Testing

### Test Cases
1. ✅ Add participant with valid name
2. ✅ Add participant, verify in standings
3. ✅ Edit participant name, verify update
4. ✅ Remove participant, verify removal
5. ✅ Remove participant with matches, verify clearing
6. ✅ Try to add empty name (should be disabled)
7. ✅ Cancel edit operation
8. ✅ Confirm remove dialog works

### Manual Testing
```
1. Start tournament with 8 participants
2. Click "Manage Participants"
3. Add "Isha" → Verify appears in list
4. Check standings → Isha should show 0.0
5. Click Edit on "Aditi"
6. Change to "Aditi K" → Save
7. Verify name updated in pairings
8. Click Remove on "Isha"
9. Confirm removal
10. Verify Isha removed from standings
```

---

## 🎨 UI Elements

### Icons
- **Add:** `UserPlus` (👤➕)
- **Edit:** `Edit2` (✏️)
- **Remove:** `Trash2` (🗑️)
- **Save:** `Save` (💾)
- **Cancel:** `X` (✖️)

### Colors
```css
/* Add Button */
bg-black text-white

/* Edit Mode */
border-green-600 bg-green-50 text-green-700

/* Remove Button */
border-red-600 bg-red-50 text-red-700

/* Warning Box */
bg-amber-50 border-amber-200 text-amber-800
```

---

## 🔄 Data Flow

```
Admin Adds Participant
    ↓
Name Entered
    ↓
Click Add Button
    ↓
Generate New ID (max + 1)
    ↓
Create Participant Object
    ↓
Add to Players Array
    ↓
UI Updates Everywhere
    ↓
Participant Visible
    ↓
Can Be Paired

Admin Edits Participant
    ↓
Click Edit Icon
    ↓
Name Field Becomes Editable
    ↓
Type New Name
    ↓
Click Save / Press Enter
    ↓
Update Player in Array
    ↓
UI Reflects Changes
    ↓
All References Updated

Admin Removes Participant
    ↓
Click Remove Icon
    ↓
Confirmation Dialog
    ↓
Click OK
    ↓
Filter Out from Players
    ↓
Clear Match Results (if any)
    ↓
UI Updates
    ↓
Participant Gone
```

---

## 📈 Future Enhancements

- [ ] Bulk add multiple participants from CSV
- [ ] Undo/Redo for changes
- [ ] Participant history tracking
- [ ] Merge duplicate participants
- [ ] Archive removed participants
- [ ] Search/filter participant list
- [ ] Drag-and-drop reordering
- [ ] Participant profiles (rating, age, etc.)

---

## 🆚 Comparison Table

| Operation | Before Manager | With Manager |
|-----------|---------------|--------------|
| Add late arrival | Restart tournament | Add instantly |
| Fix name typo | Manual in database | Edit in UI |
| Remove dropout | Delete + re-pair | Remove button |
| Update roster | Start over | Live editing |
| Time to change | Minutes | Seconds |

---

## Summary

**Feature:** Participant Manager  
**Access:** Admin Only (during tournament)  
**Operations:** Add, Edit, Remove  
**Impact:** Immediate, live updates  
**Version:** 2.4.0  
**Complexity:** Medium  
**Value:** High  

**Key Benefit:** Complete control over tournament roster during active play

---

**Last Updated:** November 6, 2025  
**Author:** AI Assistant
