# Automated Test Results: Royal Chess Championship

> **Engine Validation & Compliance Report**
> Test Runner: Vitest v1.6.1 | Execution Environment: Node.js v22.19.0
> Date: November 2026

---

## Summary

| Test Suite | Tests | Status | Duration |
|---|---|---|---|
| `swiss.test.ts` | 8 | ✅ PASS | 10ms |
| `roundrobin.test.ts` | 6 | ✅ PASS | 5ms |
| `tiebreaks.test.ts` | 5 | ✅ PASS | 17ms |
| `validator.test.ts` | 3 | ✅ PASS | 6ms |
| `audit.test.ts` | 1 | ✅ PASS | 5ms |
| **Total** | **23** | **ALL PASS (100%)** | **796ms** |

---

## Detailed Test Verification

### 1. Swiss Pairing Engine (`swiss.test.ts`)
- **2 players**: Exactly 1 match generated, valid color assignments, no BYEs.
- **3 players (Odd count)**: Correctly assigns BYE to the lowest-scored player in the field.
- **Single BYE Policy**: Verifies that a participant who previously received a BYE will not receive a second BYE when alternative pairings exist.
- **Color Balancing & History**: Verifies that players who previously played White prefer Black in subsequent rounds to maintain color parity.
- **Candidate Preference Optimization**: Verifies that candidate pairing prioritizes complementary color preferences so both players alternate colors in Round 2.
- **Multi-Round Color Alternation**: Simulates 3 consecutive Swiss tournament rounds; verifies that no participant ever plays 3 consecutive same colors and that all color differences remain $\le 2$.
- **No Repeat Opponents**: Strictly avoids rematching participants who have already played each other in previous rounds.
- **Single Player Edge Case**: Correctly generates a single BYE round for an isolated participant.

### 2. Round Robin Engine (`roundrobin.test.ts`)
- **4 Players (Berger Table)**: Generates exactly 3 rounds with 2 boards each (6 total fixtures).
- **Duplicate Prevention**: Mathematically verifies that every pair meets exactly once in single round-robin.
- **Uniform Play Counts**: Verifies that every participant plays exactly $(n - 1)$ games.
- **Odd Count Support**: Adds virtual BYEs; verifies that all participants receive exactly 1 BYE.
- **Double Round Robin**: Generates $n(n - 1)$ games with reversed colors in the second leg.

### 3. Tie-Break & Ranking Calculations (`tiebreaks.test.ts`)
- **Score Computation**: Win = 1.0, Draw = 0.5, Loss = 0.0.
- **Buchholz Score**: Correctly computes the sum of opponents' tournament scores.
- **Sonneborn-Berger (SB)**: Correctly computes sum of defeated opponents' scores + half of drawn opponents' scores.
- **Win Statistics**: Tracks both total wins and wins with Black pieces.
- **Standings Comparator**: Correctly applies hierarchical ranking criteria (Points $\to$ Direct Encounter $\to$ Sonneborn-Berger $\to$ Buchholz $\to$ Wins).

### 4. Pairing Validator (`validator.test.ts`)
- **Clean Rounds**: Validates legitimate round pairings with zero errors or warnings.
- **Self-Pair Prevention**: Throws fatal validation error if a player is paired with themselves.
- **Repeat Match Detection**: Flags repeat encounters as non-fatal warnings when force-paired.

### 5. FIDE Compliance & Audit Engine (`audit.test.ts`)
- Generates round-by-round compliance checklists:
  - No duplicate encounters
  - No 3 consecutive same colors
  - Color difference $\le 2$
  - Single BYE policy
- Tracks floater directions (up-float / down-float) and score differentials.
