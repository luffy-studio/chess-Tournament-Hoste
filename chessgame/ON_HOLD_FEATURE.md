# On Hold Feature

## Overview
The **On Hold** feature allows admins to temporarily remove a participant from the tournament without deleting them. This is useful when a participant needs to step away temporarily but may return later.

---

## 🎯 How It Works

### 1. **Before Tournament Starts (Setup Phase)**
- When you have an **odd number** of participants, the last person is marked as "unpaired"
- Admin can click **"Move to Hold"** to place that participant on hold
- This removes them from the active participant list
- Tournament can then start with an even number of players

### 2. **During Tournament**
- If someone is on hold, **everyone** (admin and participants) can see who it is
- A prominent **amber-colored banner** displays the participant's name
- Admin can click **"Add Back to Tournament"** to reinstate them

### 3. **Adding Back**
- Participant is added back to the name list
- They can participate when the tournament is reset or in next rounds

---

## 🚀 Features

### ✅ **Visible to Everyone**
- Both **admins** and **participants** can see who's on hold
- Transparency in tournament management
- Everyone knows who's temporarily not playing

### ✅ **Visual Prominence**
- **Amber/orange colored** banner stands out
- Icon indicator (user circle)
- Clear labeling: "Participant On Hold"

### ✅ **Admin Controls**
- Only admins can move participants to/from hold
- "Move to Hold" button during setup
- "Add Back to Tournament" button during tournament

### ✅ **Prevents Odd Numbers**
- Automatically suggests holding someone when count is odd
- Ensures even pairings in Swiss/Round-Robin

---

## 📋 Step-by-Step Guide

### Moving Someone to Hold (Setup Phase)

#### Step 1: Enter Participants
```
1. Log in as admin
2. Enter participant names (one per line)
3. Notice if you have odd number of participants
```

#### Step 2: See Unpaired Notice
```
┌───────────────────────────────┐
│ Unpaired (odd count)          │
│ Himani                        │
│ [Move to Hold]                │
└───────────────────────────────┘
```

#### Step 3: Move to Hold
```
1. Click "Move to Hold" button
2. Participant moves to "On Hold" section
3. Participant list now has even number
```

#### Step 4: See Hold Status
```
┌───────────────────────────────┐
│ On Hold                       │
│ Himani                        │
│ [Add Back]                    │
└───────────────────────────────┘
```

---

### During Tournament (All Users)

#### What Participants See
```
┌─────────────────────────────────────────────────────────┐
│  👤  Participant On Hold                                │
│      Himani                                             │
│      This participant is temporarily not participating  │
│      in matches                                         │
└─────────────────────────────────────────────────────────┘
```

#### What Admins See
```
┌─────────────────────────────────────────────────────────┐
│  👤  Participant On Hold                                │
│      Himani                                             │
│      This participant is temporarily not participating  │
│      in matches                                         │
│                              [Add Back to Tournament]   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Design

### Setup Phase - Unpaired Notice
```
Background: Light gray (zinc-50)
Border: Standard gray
Button: White with border
Text: Dark gray
```

### Setup Phase - On Hold
```
Background: Amber-50
Border: Amber border
Button: White with amber-600 border
Text: Amber-900 (dark amber)
```

### Tournament Phase - On Hold Banner
```
Background: Amber-50 (light amber)
Border: Amber-200
Icon Background: Amber-200 (rounded circle)
Icon: Amber-700
Title: Amber-900
Name: Large, Amber-800
Description: Amber-700
Button (Admin): White with amber-600 border, hover: amber-100
```

---

## 💡 Use Cases

### 1. **Odd Number of Participants**
```
Scenario: 9 participants registered
Problem: Can't pair 9 people evenly
Solution: Move 9th person to hold, tournament runs with 8
```

### 2. **Late Arrival Expected**
```
Scenario: Participant stuck in traffic, arriving late
Solution: Move to hold, start tournament, add back when they arrive
```

### 3. **Emergency Departure**
```
Scenario: Participant has emergency mid-tournament
Solution: Admin notes they're on hold, can add back if they return
```

### 4. **Equipment Issues**
```
Scenario: Participant's chess set broken, needs replacement
Solution: Hold them temporarily while issue is resolved
```

### 5. **Health Break**
```
Scenario: Participant feeling unwell, needs rest
Solution: Put on hold, can rejoin later if feeling better
```

---

## 🔧 Technical Details

### State Management
```typescript
const [holdName, setHoldName] = useState<string>("");
```

### Moving to Hold (Setup)
```typescript
const handleMoveLastToHold = () => {
  const lines = namesText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const unique = Array.from(new Set(lines));
  if (unique.length % 2 === 1) {
    const lastPerson = unique[unique.length - 1];
    const remaining = unique.slice(0, -1);
    setHoldName(lastPerson);
    setNamesText(remaining.join("\n"));
  }
};
```

### Adding Back
```typescript
const handleAddHoldBack = () => {
  if (holdName) {
    setNamesText(namesText ? namesText + "\n" + holdName : holdName);
    setHoldName("");
  }
};
```

### Component Props
```typescript
interface OnHoldDisplayProps {
  holdName: string;
  userRole: 'admin' | 'participant';
  isAdminAuthenticated: boolean;
  onAddBack?: () => void;
}
```

---

## 📊 Behavior Details

### When to Show
- **Setup Phase:** Shows in participant entry area
- **Tournament Phase:** Shows between summary cards and round controls
- **Condition:** Only when `holdName` is not empty

### Visibility
- **Everyone sees:** Name of participant on hold + description
- **Admin only sees:** "Add Back to Tournament" button
- **Participant view:** Information only, no action buttons

### Persistence
- Hold status persists throughout session
- Clearing hold: Only by adding participant back
- Tournament restart: Hold status can be maintained

---

## ⚠️ Limitations

### Cannot Hold During Round-Robin
- Round-robin pre-generates all rounds
- Adding/removing participants mid-tournament breaks schedule
- Hold feature best used **before** tournament starts

### Single Hold Only
- System supports **one participant on hold** at a time
- To hold multiple, would need array instead of string state
- Current design optimized for odd-number scenarios

### No Mid-Tournament Hold
- Cannot move active participant to hold during tournament
- Would break existing pairings and rounds
- Hold is **pre-tournament planning** feature

---

## 🎯 Best Practices

### For Admins
1. ✅ Use hold for odd-number situations
2. ✅ Communicate with held participant
3. ✅ Only start tournament after hold decision is final
4. ✅ Add back participants during tournament breaks
5. ✅ Document hold reasons for records

### For Organizers
1. ✅ Plan for odd numbers in advance
2. ✅ Have clear hold policies
3. ✅ Inform all participants about hold feature
4. ✅ Use hold for temporary, not permanent exclusions
5. ✅ Track held participants separately

---

## 🧪 Testing

### Test Cases
1. ✅ Add 9 participants → See unpaired notice
2. ✅ Click "Move to Hold" → Last person moved to hold
3. ✅ Start tournament → 8 participants active
4. ✅ During tournament → Hold banner visible to all
5. ✅ Admin clicks "Add Back" → Participant returns to setup list
6. ✅ Participant view → No "Add Back" button shown
7. ✅ Even number → No unpaired/hold options shown

### Manual Testing Steps
```
1. Enter odd number of participants (e.g., 9)
2. Verify "Unpaired" notice shows last person
3. Click "Move to Hold"
4. Verify "On Hold" section appears
5. Start tournament
6. Switch to participant view
7. Verify hold banner is visible
8. Verify no "Add Back" button for participants
9. Switch back to admin
10. Click "Add Back to Tournament"
11. Verify participant returns to list
```

---

## 🎨 UI Components

### Files
- **OnHoldDisplay.tsx** - Tournament phase display component
- **SetupWizard.tsx** - Setup phase hold management

### Styling Classes
```css
/* Banner */
border-amber-200       /* Border color */
bg-amber-50           /* Background */
text-amber-900        /* Title text */
text-amber-800        /* Name text */
text-amber-700        /* Description */

/* Icon */
bg-amber-200          /* Icon background */
text-amber-700        /* Icon color */

/* Button */
border-amber-600      /* Button border */
bg-white              /* Button background */
hover:bg-amber-100    /* Button hover */
```

---

## 🔄 Data Flow

```
Setup Phase:
User Enters 9 Names
    ↓
System Detects Odd Count
    ↓
Shows "Unpaired" Notice
    ↓
Admin Clicks "Move to Hold"
    ↓
Last Name → holdName state
    ↓
Name Removed from namesText
    ↓
Shows "On Hold" Section
    ↓
Tournament Started with 8 Players
    ↓
During Tournament:
    ↓
OnHoldDisplay Component Renders
    ↓
All Users See Hold Banner
    ↓
Admin Clicks "Add Back"
    ↓
holdName → Added to namesText
    ↓
holdName → Set to ""
    ↓
Banner Disappears
```

---

## 📈 Future Enhancements

- [ ] Support multiple participants on hold (array state)
- [ ] Hold participants **during** tournament (with pairing adjustment)
- [ ] Add notes/reasons for holding
- [ ] Hold history tracking
- [ ] Email notifications for held participants
- [ ] Auto-suggest who to hold (e.g., lowest rating)
- [ ] Hold queue for multiple returning participants
- [ ] Integration with "Add Participant" feature

---

## 📝 Example Scenarios

### Scenario 1: Simple Odd Number
```
Initial: 9 participants
Action: Move "Isha" to hold
Result: 8 active participants, Isha on hold
Tournament: Runs with 8 players, Isha visible on hold banner
Later: Admin adds Isha back before next tournament
```

### Scenario 2: Participant Returns
```
Initial: 10 participants, "Jay" on hold from previous tournament
Action: Admin clicks "Add Back"
Result: Jay returns to participant list (now 11 total)
Action: Move someone else to hold or add 12th participant
```

### Scenario 3: Tournament in Progress
```
Status: Round 2 of Swiss tournament, "Kiran" on hold
View (Participant): Sees "Kiran - On Hold" banner, no actions
View (Admin): Sees "Kiran - On Hold" banner with "Add Back" button
Note: Adding back won't affect current tournament until reset
```

---

## Summary

**Feature:** On Hold Participant Management  
**Status:** ✅ Fully Implemented  
**Visibility:** All Users (Admin + Participant)  
**Admin Actions:** Move to Hold, Add Back  
**Version:** 2.3.0  
**Complexity:** Low  
**Impact:** Medium  

---

**Last Updated:** November 6, 2025  
**Author:** AI Assistant
