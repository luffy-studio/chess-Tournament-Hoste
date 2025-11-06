# Hold Participant Feature

## Overview
When you have an odd number of participants, the last person will be unpaired. You can now move them to a "Hold" area to manage them separately.

---

## How It Works

### 1. **Odd Count Detection**
- System automatically detects when participant count is odd
- Shows "Unpaired (odd count)" box with the last participant's name

### 2. **Move to Hold**
- Click **"Move to Hold"** button
- Person is removed from the main list
- Now you have an even number of participants
- Held person shown in "On Hold" box

### 3. **Add Back**
- Click **"Add Back"** button in the "On Hold" box
- Person is added back to the main list
- They become part of the tournament again

---

## Visual Layout

### When Odd Count (Before Hold)
```
┌─────────────────────────────────────┐
│ Participants                        │
│ ┌─────────────────────────────────┐ │
│ │ Aditi                           │ │
│ │ Bhavesh                         │ │
│ │ Chirag                          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Unpaired (odd count)          │   │
│ │ Chirag                        │   │
│ │ [Move to Hold]                │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

### After Moving to Hold
```
┌─────────────────────────────────────┐
│ Participants                        │
│ ┌─────────────────────────────────┐ │
│ │ Aditi                           │ │
│ │ Bhavesh                         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ On Hold                       │   │
│ │ Chirag                        │   │
│ │ [Add Back]                    │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Use Cases

### 1. **Last-Minute Dropout**
- Someone can't participate
- Move them to hold instead of deleting
- Easy to add back if they change their mind

### 2. **Late Arrival**
- Start tournament with even participants
- Keep late person in hold
- Add them in next round

### 3. **Trial Run**
- Test tournament setup with even numbers
- Keep extra person in hold for backup

### 4. **Bye Management**
- Some organizers prefer no BYE rounds
- Put extra person on hold
- Tournament runs without BYE

---

## Technical Details

### State Management
```typescript
const [holdName, setHoldName] = useState<string>("");
```

### Functions
```typescript
// Move last person to hold
handleMoveLastToHold() {
  - Get last person from list
  - Remove from main list
  - Store in holdName state
}

// Add held person back
handleAddHoldBack() {
  - Get holdName
  - Add to main list
  - Clear holdName state
}
```

### Props Added to SetupWizard
- `holdName: string` - Name of held participant
- `onMoveLastToHold: () => void` - Handler to move to hold
- `onAddHoldBack: () => void` - Handler to add back

---

## User Flow

### Admin Creates Tournament
1. Enter participant names
2. System detects odd count
3. Shows unpaired participant
4. Admin decides: keep for BYE or move to hold
5. If moved to hold: tournament has even participants
6. Start tournament
7. Can add held person back later

---

## Benefits

### ✅ **Flexibility**
- Choose between BYE or holding participant
- Reversible action

### ✅ **Clear Visualization**
- See who's unpaired
- See who's on hold
- One-click management

### ✅ **No Data Loss**
- Name preserved in hold
- Easy to restore
- No re-typing needed

### ✅ **Better UX**
- Visual feedback
- Clear labels
- Simple buttons

---

## Example Scenarios

### Scenario 1: 9 Participants
```
Initial: 9 names (odd)
↓
Last person: "Isha" shown as unpaired
↓
Click "Move to Hold"
↓
Now: 8 names (even) + "Isha" in hold
↓
Start tournament with 8 players
```

### Scenario 2: Add Back Later
```
Tournament running with 8 players
↓
"Isha" still in hold
↓
Click "Add Back" before next round
↓
Now: 9 names (odd)
↓
"Isha" gets BYE in next round
```

### Scenario 3: Change Mind
```
Moved "Isha" to hold
↓
Decide to keep everyone
↓
Click "Add Back"
↓
Back to 9 participants with BYE
```

---

## Implementation Files

### Modified Files
1. **SetupWizard.tsx**
   - Added hold UI boxes
   - Added move/add buttons
   - Detects odd count

2. **ChessTournamentComplete.tsx**
   - Added holdName state
   - Added handler functions
   - Passes props to SetupWizard

---

## Visual Design

### Unpaired Box
- **Background:** Light gray (`bg-zinc-50`)
- **Border:** Standard border
- **Label:** "Unpaired (odd count)"
- **Name:** Truncated if long
- **Button:** "Move to Hold"

### On Hold Box
- **Background:** Light gray (`bg-zinc-50`)
- **Border:** Standard border
- **Label:** "On Hold"
- **Name:** Truncated if long
- **Button:** "Add Back"

---

## Keyboard Shortcuts
Not implemented yet - future enhancement!

---

## Future Enhancements
- [ ] Drag & drop to move to hold
- [ ] Multiple participants on hold
- [ ] History of hold actions
- [ ] Undo/redo functionality
- [ ] Keyboard shortcuts
- [ ] Hold reason notes

---

## Testing

### Test Cases
1. ✅ Odd count shows unpaired box
2. ✅ Move to hold removes from list
3. ✅ Add back restores to list
4. ✅ Hold persists across re-renders
5. ✅ Works with any odd number
6. ✅ Empty hold shows nothing

### Manual Testing
```
1. Enter 9 names
2. Verify last name shown as unpaired
3. Click "Move to Hold"
4. Verify 8 names remain
5. Verify "On Hold" box shows
6. Click "Add Back"
7. Verify 9 names restored
```

---

## Summary

**Feature:** Hold Participant Management  
**Status:** ✅ Implemented  
**Version:** 2.1.0  
**Complexity:** Low  
**Impact:** High (Better UX)  

---

**Last Updated:** November 6, 2025  
**Author:** AI Assistant
