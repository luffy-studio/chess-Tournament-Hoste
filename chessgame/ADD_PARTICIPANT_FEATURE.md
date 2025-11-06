# Add Participant Mid-Tournament Feature

## Overview
You can now add new participants **after the tournament has started**! They will join in the next round with a score of 0.

---

## 🎯 How It Works

### 1. **During Active Tournament**
- Admin sees "Add Participant (Next Round)" panel
- Enter new participant name
- Click "Add" to queue them

### 2. **Queue Management**
- Names are added to a queue
- View all queued participants
- Remove from queue if needed

### 3. **Integration on Next Round**
- When you click "Generate Next Round" (Swiss only)
- All queued participants are added to the player list
- They start with 0 points
- Automatically paired based on standings

---

## 🚀 Features

### ✅ **Works Mid-Tournament**
- Add participants even after rounds have started
- No need to restart tournament

### ✅ **Queue System**
- Queue multiple participants at once
- Review before adding
- Remove from queue if needed

### ✅ **Swiss System Only**
- Feature works with Swiss pairing
- Round-robin mode disabled (can't modify pre-set rounds)

### ✅ **Automatic Pairing**
- New participants automatically paired in next round
- Starts with 0 score
- Fair pairing based on standings

### ✅ **Visual Feedback**
- See queued participants
- Clear labels and buttons
- Disabled state for round-robin

---

## 📋 Step-by-Step Guide

### Adding a New Participant

#### Step 1: Tournament Running
```
✓ Tournament already started
✓ Currently in Round 2 or later
✓ Admin logged in
```

#### Step 2: Use Add Panel
```
1. Find "Add Participant (Next Round)" panel
2. Type participant name
3. Click "Add" button
```

#### Step 3: Review Queue
```
Queued for next round:
┌──────────────────────┐
│ Isha         [Remove]│
│ Jay          [Remove]│
└──────────────────────┘
```

#### Step 4: Generate Next Round
```
1. Click "Generate Next Round"
2. Queued participants added automatically
3. They appear in standings with 0 points
4. Paired against opponents with similar scores
```

---

## 🎨 Visual Design

### Add Panel (Swiss Mode)
```
┌───────────────────────────────────────┐
│ Add Participant (Next Round)          │
│ ┌─────────────────────┐               │
│ │ Enter name...       │  [Add]        │
│ └─────────────────────┘               │
│                                       │
│ Queued for next round:                │
│ ┌─────────────────────────────────┐   │
│ │ Isha                    [Remove]│   │
│ │ Jay                     [Remove]│   │
│ └─────────────────────────────────┘   │
│ These names will be added when you    │
│ generate the next round (Swiss only). │
└───────────────────────────────────────┘
```

### Add Panel (Round-Robin - Disabled)
```
┌───────────────────────────────────────┐
│ Add Participant    Not supported in   │
│ (Next Round)       Round-robin        │
│ ┌─────────────────────┐               │
│ │ [disabled]          │  [disabled]   │
│ └─────────────────────┘               │
└───────────────────────────────────────┘
```

---

## 💡 Use Cases

### 1. **Late Arrival**
```
Scenario: Player arrives after Round 1
Solution: Add them to queue, join in Round 2
```

### 2. **Held Participant Returns**
```
Scenario: Player was on hold, now ready to play
Solution: Add them back via the panel
```

### 3. **Last-Minute Registration**
```
Scenario: Someone wants to join ongoing tournament
Solution: Queue them, they join next round
```

### 4. **Replacing Dropout**
```
Scenario: Player dropped out, replacement arrives
Solution: Add replacement to queue
```

---

## 🔧 Technical Details

### State Management
```typescript
const [newParticipantName, setNewParticipantName] = useState<string>("");
const [participantQueue, setParticipantQueue] = useState<string[]>([]);
```

### Queue Operations
```typescript
// Add to queue
handleAddToQueue() {
  - Validate name is not empty
  - Check for duplicates
  - Add to queue array
}

// Remove from queue
handleRemoveFromQueue(index) {
  - Filter out item at index
  - Update queue state
}
```

### Integration Logic
```typescript
nextRoundSwiss() {
  if (participantQueue.length > 0) {
    - Get max player ID
    - Create new participant objects
    - Add to players list
    - Clear queue
    - Recalculate standings
    - Generate pairings with new players
  }
}
```

---

## 📊 Scoring for New Participants

### Initial State
- **Score:** 0.0
- **Wins:** 0
- **Position:** Bottom of standings

### First Round
- Paired against other 0-score players (or lowest)
- Can win, draw, or lose like any other player

### Subsequent Rounds
- Normal Swiss pairing based on accumulated score
- Fully integrated into tournament

---

## ⚠️ Limitations

### Round-Robin Mode
- **Cannot add participants** mid-tournament
- All rounds are pre-generated
- Would break the complete rotation

### Why Swiss Only?
- Swiss generates rounds dynamically
- Round-robin has fixed schedule
- Adding players would require regenerating all rounds

---

## 🎯 Example Workflow

### Scenario: Add "Isha" to Ongoing Tournament

```
Initial State:
- 8 participants
- Currently Round 2
- Isha arrives late

Step 1: Admin clicks Add Panel
Step 2: Types "Isha"
Step 3: Clicks "Add"

Result:
┌──────────────────────┐
│ Queued: Isha        │
└──────────────────────┘

Step 4: Complete Round 2 matches
Step 5: Click "Generate Next Round"

System Actions:
✓ Adds Isha to players (ID: 9)
✓ Isha starts with 0 points
✓ Pairs Isha against another 0-score player
✓ Clears queue
✓ Creates Round 3 pairings

Round 3:
Board 1: Alice (2.0) vs Bob (2.0)
Board 2: Carol (1.5) vs David (1.5)
...
Board 5: Isha (0.0) vs Frank (0.0)  ← New player!

Standings After Add:
1. Alice    2.0
2. Bob      2.0
...
9. Isha     0.0  ← New player at bottom
```

---

## 🧪 Testing

### Test Cases
1. ✅ Add single participant
2. ✅ Add multiple participants
3. ✅ Remove from queue
4. ✅ Queue persists until next round
5. ✅ New players appear in standings
6. ✅ New players get paired correctly
7. ✅ Disabled in round-robin mode
8. ✅ Duplicate names prevented

### Manual Testing
```
1. Start Swiss tournament with 8 players
2. Complete Round 1
3. Add "NewPlayer" to queue
4. Verify queue shows "NewPlayer"
5. Generate Round 2
6. Verify "NewPlayer" in standings with 0.0
7. Verify "NewPlayer" has a pairing
8. Verify queue is cleared
```

---

## 📝 UI Elements

### Components
- **AddParticipantPanel.tsx** - Main panel component

### Props
```typescript
interface AddParticipantPanelProps {
  mode: Mode;                    // Tournament mode
  newName: string;               // Current input
  queue: string[];               // Queued names
  onNewNameChange: (v: string) => void;
  onAddToQueue: () => void;
  onRemoveFromQueue: (index: number) => void;
}
```

---

## 🎨 Styling

### Colors
- Background: White (`bg-white`)
- Border: Standard (`border`)
- Input: Standard rounded (`rounded-xl`)
- Button: Black (`bg-black text-white`)
- Disabled: Opacity 50% (`opacity-50`)

### Layout
- Full-width section
- Flex input + button
- List of queued items
- Responsive design

---

## 🔄 Data Flow

```
User Types Name
    ↓
Clicks Add Button
    ↓
Name Added to Queue
    ↓
Queue Displayed
    ↓
Admin Generates Next Round
    ↓
Queue Processed
    ↓
New Participants Added to Players
    ↓
Standings Recalculated
    ↓
Pairings Generated
    ↓
Queue Cleared
    ↓
UI Updated
```

---

## 🚨 Edge Cases Handled

### Empty Name
- Button disabled if name is empty
- Trim whitespace automatically

### Duplicate Names
- Check if name already in queue
- Prevent duplicate additions

### Round-Robin Mode
- Panel disabled
- Clear message shown
- No queue operations allowed

### Mid-Round Addition
- Queue preserved during round
- Only integrated on next round generation

---

## 🎓 Best Practices

### For Admins
1. ✅ Add participants between rounds (not during)
2. ✅ Review queue before generating next round
3. ✅ Inform new participants of their starting position
4. ✅ Explain they start with 0 points

### For Organizers
1. ✅ Use Swiss format for flexible additions
2. ✅ Communicate late-join policy to participants
3. ✅ Consider fairness of mid-tournament additions
4. ✅ Document who joined when for records

---

## 📈 Future Enhancements

- [ ] Add participants with custom starting scores
- [ ] Batch add multiple names at once
- [ ] Import participants from CSV
- [ ] Set which round they join (not just next)
- [ ] Add participant notes/comments
- [ ] Email notifications for new additions
- [ ] Undo last addition

---

## Summary

**Feature:** Add Participants Mid-Tournament  
**Status:** ✅ Implemented  
**Mode Support:** Swiss Only  
**Version:** 2.2.0  
**Complexity:** Medium  
**Impact:** High  

---

**Last Updated:** November 6, 2025  
**Author:** AI Assistant
