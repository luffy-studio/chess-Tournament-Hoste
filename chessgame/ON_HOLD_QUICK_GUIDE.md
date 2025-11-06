# On Hold Feature - Quick Visual Guide

## 🎯 Quick Summary
Show participants who are temporarily not participating in the tournament. **Everyone can see** who's on hold, but only **admins** can manage them.

---

## 📸 What You'll See

### 1️⃣ Setup Phase - Odd Number Detected
```
┌────────────────────────────────────────────────────┐
│ Participants                                       │
│ ┌────────────────────────────────────────────────┐ │
│ │ Aditi                                          │ │
│ │ Bhavesh                                        │ │
│ │ Chirag                                         │ │
│ │ Diya                                           │ │
│ │ Eshan                                          │ │
│ │ Fiza                                           │ │
│ │ Gautam                                         │ │
│ │ Himani                                         │ │
│ │ Isha          ← 9th person (odd!)              │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ┌─────────────────────┐                           │
│ │ Unpaired (odd)      │                           │
│ │ Isha                │                           │
│ │ [Move to Hold]      │ ← Click this              │
│ └─────────────────────┘                           │
└────────────────────────────────────────────────────┘
```

---

### 2️⃣ Setup Phase - After Moving to Hold
```
┌────────────────────────────────────────────────────┐
│ Participants                                       │
│ ┌────────────────────────────────────────────────┐ │
│ │ Aditi                                          │ │
│ │ Bhavesh                                        │ │
│ │ Chirag                                         │ │
│ │ Diya                                           │ │
│ │ Eshan                                          │ │
│ │ Fiza                                           │ │
│ │ Gautam                                         │ │
│ │ Himani           ← Now 8 (even!)               │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ┌─────────────────────┐                           │
│ │ 🟠 On Hold          │ ← Amber colored            │
│ │ Isha                │                           │
│ │ [Add Back]          │                           │
│ └─────────────────────┘                           │
└────────────────────────────────────────────────────┘
```

---

### 3️⃣ During Tournament - Participant View
```
┌────────────────────────────────────────────────────────────┐
│ Round: 2    Participants: 8    Leader: Aditi              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 👤  Participant On Hold                                    │
│                                                            │
│     Isha                                                   │
│     This participant is temporarily not participating      │
│     in matches                                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
      ↑
      Amber/Orange colored - visible to everyone!

┌────────────────────────────────────────────────────────────┐
│ Current Round: 2                                           │
│ View the pairings and standings below                      │
└────────────────────────────────────────────────────────────┘
```

---

### 4️⃣ During Tournament - Admin View
```
┌────────────────────────────────────────────────────────────┐
│ Round: 2    Participants: 8    Leader: Aditi              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 👤  Participant On Hold                                    │
│                                                            │
│     Isha                                                   │
│     This participant is temporarily not participating      │
│     in matches                                             │
│                                        [Add Back to Tour.] │← Admin only!
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Mode: SWISS            [Generate Next Round →]             │
└────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### Unpaired Notice (Gray)
- Background: `#fafafa` (zinc-50)
- Text: Dark gray
- Button: White with border

### On Hold (Amber/Orange)
- Background: `#fffbeb` (amber-50)
- Border: `#fde68a` (amber-200)
- Icon Background: `#fde68a` (amber-200)
- Icon: `#b45309` (amber-700)
- Title: `#78350f` (amber-900)
- Name: `#92400e` (amber-800)
- Description: `#b45309` (amber-700)
- Button Border: `#d97706` (amber-600)

**Why amber?** It stands out as a "warning" or "attention" color without being alarming (like red). Perfect for "on hold" status!

---

## 🚦 How to Use (Quick Steps)

### As Admin - Setup Phase
1. **Enter participants** (one per line)
2. If **odd number**, see "Unpaired" notice
3. Click **"Move to Hold"**
4. Person moves to amber "On Hold" section
5. **Start tournament** with even number

### As Admin - During Tournament
1. See **amber hold banner** at top
2. To add back: Click **"Add Back to Tournament"**
3. Person returns to setup list
4. Can rejoin in future tournament

### As Participant - During Tournament
1. See **amber hold banner** at top
2. Know who's not playing
3. **No action buttons** (view only)

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🌍 **Visible to All** | Both admin and participants see the banner |
| 🎨 **Eye-catching** | Amber color makes it stand out |
| 🔐 **Admin Control** | Only admins can move to/from hold |
| 👁️ **Transparent** | Everyone knows who's on hold |
| 🔄 **Reversible** | Easy to add back to tournament |

---

## 📋 When to Use

| Situation | Action |
|-----------|--------|
| 9 participants | Move 9th to hold → Start with 8 |
| Late arrival | Move to hold → Add back when they arrive |
| Emergency leave | Note as on hold → Add back if they return |
| Equipment issue | Hold temporarily → Add back when fixed |
| Feeling unwell | Hold for break → Add back when ready |

---

## ⚠️ Important Notes

- ✅ **Hold before tournament starts** for best results
- ✅ Only **one participant** can be on hold at a time
- ✅ Adding back during tournament won't affect current rounds
- ✅ Best used with **Swiss format** (flexible rounds)
- ❌ Cannot hold participants **during** Round-Robin (breaks schedule)

---

## 🎯 Pro Tips

1. **Communicate:** Tell the held participant they're on hold
2. **Document:** Note why someone is on hold
3. **Plan ahead:** Decide on hold before starting tournament
4. **Be fair:** Use hold for temporary situations, not exclusions
5. **Add back early:** During breaks between rounds

---

## 🔍 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Don't see "Move to Hold" | Need odd number of participants |
| Can't add back | Must be admin (and logged in) |
| Hold not showing | Check if holdName state is set |
| Want to hold during tournament | Not supported - plan before starting |

---

## 📊 Visual Flow

```
Setup with 9 Names
        ↓
   [Odd Count]
        ↓
"Unpaired" Notice Shows Last Person
        ↓
   Click "Move to Hold"
        ↓
Last Person → On Hold (Amber Box)
        ↓
Names List → Now 8 People
        ↓
   Start Tournament
        ↓
🟠 Hold Banner Appears (Top of Page)
        ↓
Visible to ALL Users
        ↓
Admin: Can Click "Add Back"
        ↓
Person Returns to Setup List
```

---

## Summary

**What:** Show participants temporarily not playing  
**Who Sees:** Everyone (admin + participants)  
**Who Controls:** Admins only  
**Color:** 🟠 Amber (orange/yellow)  
**When:** Before & during tournament  
**Why:** Transparency & flexibility  

---

**Version:** 2.3.0  
**Last Updated:** November 6, 2025
