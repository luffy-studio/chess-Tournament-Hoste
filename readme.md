ECHO is on.
# ♔ Royal Chess Championship Platform (React + Tailwind)

An **interactive web platform** to manage offline chess tournaments with live standings, auto-pairing, score entry, and exportable reports.

Built for simplicity and flexibility — perfect for clubs, schools, or local organizers who want a professional, digital-first scoreboard without complex backend setups.

---

## 🚀 Features

### 🎯 Tournament Modes
- **Swiss System** — pairs players each round based on current scores.
- **Round Robin** — generates all rounds in advance using the circle method.

### 🧩 Core Functionalities
- Add all **participant names** manually (one per line).
- Automatically create **pairings** for each round.
- Track **wins (1 point)**, **draws (0.5)**, **losses (0)**, and **BYE points**.
- Instantly view **live standings** after every update.
- Generate new rounds dynamically (Swiss) or navigate through preset rounds (Round Robin).

### 📊 Exports
Easily export your tournament data as CSV files:
- **Results.csv** → round, board, players, result (e.g., 1–0, 0.5–0.5, BYE)
- **Standings.csv** → player ranks and total scores
- **Boards_by_round.csv** → player board numbers per round

### 🧠 Scoring Logic
| Outcome | Points (White) | Points (Black) |
|----------|----------------|----------------|
| Win      | 1.0            | 0.0            |
| Draw     | 0.5            | 0.5            |
| Loss     | 0.0            | 1.0            |
| BYE      | Configurable (default 1.0) | – |

### 💾 Offline-Friendly
- No server or database required — everything runs locally in the browser.
- Export CSV files for permanent offline storage or sharing.

---

## 🧰 Tech Stack
- **React (TypeScript)** — UI and logic
- **Tailwind CSS** — styling and layout
- **Lucide Icons** — clean and minimal SVG icons

---

## 🧪 Developer Notes
- Includes **built-in DEV tests** for pairing logic and CSV generation.
- Fully modular: pairing logic and CSV utilities are standalone and reusable.
- Easy to extend for advanced rules (e.g., color balancing, tie-breakers, opponent history).

---

## 📦 Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chess-tournament-platform.git
   cd chess-tournament-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

4. Open in your browser:
   ```
   http://localhost:5173
   ```

---

## 🏁 Future Enhancements
- ✅ Avoid repeat pairings in Swiss system
- ✅ Add color balancing logic (alternate white/black)
- 🕒 Add persistent storage (localStorage or cloud sync)
- 🧮 Tie-breaker implementation (Buchholz, Sonneborn-Berger, etc.)

---

## 👑 Credits
Developed by **Sarvagya Sharma** — a forward-thinking student passionate about **AI, software design, and tournament automation**.

---

### License
MIT © 2025 Sarvagya Sharma