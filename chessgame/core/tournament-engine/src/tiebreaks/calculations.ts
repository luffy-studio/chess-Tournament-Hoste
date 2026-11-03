export interface PlayerScoreState {
  id: string;
  score: number;
  opponents: string[]; // actual opponent IDs (non-null)
  results: { opponentId: string; outcome: "W" | "L" | "D" }[];
  roundScores: number[]; // cumulative score after each round
  wins: number;
  winsBlack: number;
  playedRounds: number;
}

export interface ComputedTiebreaks {
  id: string;
  score: number;
  buchholz: number;
  medianBuchholz: number;
  cut1Buchholz: number;
  sonnebornBerger: number;
  progressiveScore: number;
  mostWins: number;
  mostWinsBlack: number;
}

/**
 * Computes all FIDE tie-breaks for each participant.
 */
export function computeAllTiebreaks(
  players: { id: string }[],
  matches: { whiteId: string | null; blackId: string | null; result: string | null; round: number }[],
  byePoints: number = 1.0
): Map<string, ComputedTiebreaks> {
  const scoreStates = new Map<string, PlayerScoreState>();

  // Initialize
  for (const p of players) {
    scoreStates.set(p.id, {
      id: p.id,
      score: 0,
      opponents: [],
      results: [],
      roundScores: [],
      wins: 0,
      winsBlack: 0,
      playedRounds: 0,
    });
  }

  // Find max round to size roundScores
  let maxRound = 0;
  for (const m of matches) {
    if (m.round > maxRound) maxRound = m.round;
  }

  // Process matches and compute basic scores and win counts
  const sortedMatches = [...matches].sort((a, b) => a.round - b.round);

  for (let r = 1; r <= maxRound; r++) {
    const roundMatches = sortedMatches.filter((m) => m.round === r);

    for (const m of roundMatches) {
      const wId = m.whiteId;
      const bId = m.blackId;
      const res = m.result;

      if (wId) {
        const wState = scoreStates.get(wId);
        if (wState) {
          wState.playedRounds++;
          if (bId) {
            wState.opponents.push(bId);
            if (res === "W") {
              wState.score += 1;
              wState.wins += 1;
              wState.results.push({ opponentId: bId, outcome: "W" });
            } else if (res === "L") {
              wState.results.push({ opponentId: bId, outcome: "L" });
            } else if (res === "D") {
              wState.score += 0.5;
              wState.results.push({ opponentId: bId, outcome: "D" });
            }
          } else {
            // Bye
            wState.score += byePoints;
          }
        }
      }

      if (bId) {
        const bState = scoreStates.get(bId);
        if (bState) {
          bState.playedRounds++;
          if (wId) {
            bState.opponents.push(wId);
            if (res === "L") {
              bState.score += 1;
              bState.wins += 1;
              bState.winsBlack += 1;
              bState.results.push({ opponentId: wId, outcome: "W" });
            } else if (res === "W") {
              bState.results.push({ opponentId: wId, outcome: "L" });
            } else if (res === "D") {
              bState.score += 0.5;
              bState.results.push({ opponentId: wId, outcome: "D" });
            }
          } else {
            // Bye
            bState.score += byePoints;
          }
        }
      }
    }

    // Capture cumulative scores at end of this round
    for (const p of players) {
      const state = scoreStates.get(p.id);
      if (state) {
        state.roundScores.push(state.score);
      }
    }
  }

  // Calculate tie-break metrics
  const computed = new Map<string, ComputedTiebreaks>();

  for (const p of players) {
    const state = scoreStates.get(p.id);
    if (!state) continue;

    // Fetch opponent scores
    const opponentScores = state.opponents.map((oppId) => {
      const oppState = scoreStates.get(oppId);
      return oppState ? oppState.score : 0;
    });

    // Buchholz: sum of opponent scores
    const buchholz = opponentScores.reduce((sum, s) => sum + s, 0);

    // Median Buchholz: exclude highest and lowest
    let medianBuchholz = 0;
    if (opponentScores.length >= 3) {
      const sorted = [...opponentScores].sort((a, b) => a - b);
      // remove first and last
      const sliced = sorted.slice(1, -1);
      medianBuchholz = sliced.reduce((sum, s) => sum + s, 0);
    } else {
      medianBuchholz = buchholz; // fallback
    }

    // Cut 1 Buchholz: exclude lowest
    let cut1Buchholz = 0;
    if (opponentScores.length >= 1) {
      const sorted = [...opponentScores].sort((a, b) => a - b);
      const sliced = sorted.slice(1);
      cut1Buchholz = sliced.reduce((sum, s) => sum + s, 0);
    } else {
      cut1Buchholz = buchholz; // fallback
    }

    // Sonneborn-Berger
    let sonnebornBerger = 0;
    for (const res of state.results) {
      const oppState = scoreStates.get(res.opponentId);
      if (oppState) {
        if (res.outcome === "W") {
          sonnebornBerger += oppState.score;
        } else if (res.outcome === "D") {
          sonnebornBerger += 0.5 * oppState.score;
        }
      }
    }

    // Progressive score: sum of roundScores
    const progressiveScore = state.roundScores.reduce((sum, s) => sum + s, 0);

    computed.set(p.id, {
      id: p.id,
      score: state.score,
      buchholz,
      medianBuchholz,
      cut1Buchholz,
      sonnebornBerger,
      progressiveScore,
      mostWins: state.wins,
      mostWinsBlack: state.winsBlack,
    });
  }

  return computed;
}

/**
 * Comparator to rank players based on scores, head-to-head (Direct Encounter), and tie-breaks.
 */
export function getStandingsComparator(
  tiebreaksMap: Map<string, ComputedTiebreaks>,
  matches: { whiteId: string | null; blackId: string | null; result: string | null }[]
): (aId: string, bId: string) => number {
  return (aId: string, bId: string) => {
    const a = tiebreaksMap.get(aId);
    const b = tiebreaksMap.get(bId);

    if (!a || !b) return 0;

    // 1. Primary: Score
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // 2. Direct Encounter (Head-to-head)
    // Check if they played each other
    const match = matches.find(
      (m) =>
        (m.whiteId === aId && m.blackId === bId) ||
        (m.whiteId === bId && m.blackId === aId)
    );
    if (match && match.result) {
      if (match.whiteId === aId) {
        if (match.result === "W") return -1; // a wins
        if (match.result === "L") return 1; // b wins
      } else {
        if (match.result === "W") return 1; // b wins
        if (match.result === "L") return -1; // a wins
      }
    }

    // 3. Secondary: Sonneborn-Berger
    if (b.sonnebornBerger !== a.sonnebornBerger) {
      return b.sonnebornBerger - a.sonnebornBerger;
    }

    // 4. Tertiary: Buchholz
    if (b.buchholz !== a.buchholz) {
      return b.buchholz - a.buchholz;
    }

    // 5. Most Wins
    if (b.mostWins !== a.mostWins) {
      return b.mostWins - a.mostWins;
    }

    // 6. Most Wins with Black
    if (b.mostWinsBlack !== a.mostWinsBlack) {
      return b.mostWinsBlack - a.mostWinsBlack;
    }

    // 7. Progressive Score
    if (b.progressiveScore !== a.progressiveScore) {
      return b.progressiveScore - a.progressiveScore;
    }

    // 8. Fallback to rating or ID order
    return aId.localeCompare(bId);
  };
}
