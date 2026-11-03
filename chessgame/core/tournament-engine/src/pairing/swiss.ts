import { FIDE_RULES } from '../fide-rules/rules';

export interface PlayerInput {
  id: string;
  score: number;
  rating: number;
}

export interface MatchInput {
  round: number;
  whiteId: string | null;
  blackId: string | null;
  result: "W" | "L" | "D" | null;
}

export interface PlayerHistory {
  id: string;
  opponents: Set<string>;
  colors: ("W" | "B")[];
  colorDifference: number; // White - Black
  consecutiveSameColor: number; // positive for White, negative for Black
  hasHadBye: boolean;
}

export interface PairingResult {
  whiteId: string | null;
  blackId: string | null;
  board: number;
  whiteScore?: number;
  blackScore?: number;
  whiteRating?: number;
  blackRating?: number;
}

/**
 * Builds the historical state of each player based on previous matches.
 */
export function buildPlayerHistory(
  players: PlayerInput[],
  matches: MatchInput[]
): Map<string, PlayerHistory> {
  const historyMap = new Map<string, PlayerHistory>();

  // Initialize
  for (const p of players) {
    historyMap.set(p.id, {
      id: p.id,
      opponents: new Set<string>(),
      colors: [],
      colorDifference: 0,
      consecutiveSameColor: 0,
      hasHadBye: false,
    });
  }

  // Sort matches by round to process chronologically
  const sortedMatches = [...matches].sort((a, b) => a.round - b.round);

  for (const m of sortedMatches) {
    if (m.whiteId) {
      const whiteHist = historyMap.get(m.whiteId);
      if (whiteHist) {
        if (m.blackId) {
          whiteHist.opponents.add(m.blackId);
          whiteHist.colors.push("W");
          whiteHist.colorDifference += 1;
        } else {
          // Paired with null means BYE
          whiteHist.hasHadBye = true;
        }
      }
    }

    if (m.blackId) {
      const blackHist = historyMap.get(m.blackId);
      if (blackHist) {
        if (m.whiteId) {
          blackHist.opponents.add(m.whiteId);
          blackHist.colors.push("B");
          blackHist.colorDifference -= 1;
        } else {
          // Paired with null means BYE
          blackHist.hasHadBye = true;
        }
      }
    }
  }

  // Compute consecutive colors
  for (const hist of historyMap.values()) {
    if (hist.colors.length === 0) {
      hist.consecutiveSameColor = 0;
      continue;
    }
    const lastColor = hist.colors[hist.colors.length - 1];
    let count = 0;
    for (let i = hist.colors.length - 1; i >= 0; i--) {
      if (hist.colors[i] === lastColor) {
        count++;
      } else {
        break;
      }
    }
    hist.consecutiveSameColor = lastColor === "W" ? count : -count;
  }

  return historyMap;
}

/**
 * Determines color assignment and check compatibility for pairing X and Y.
 * Returns the color assignment for X and Y, or null if incompatible under FIDE rules.
 */
export function determineColors(
  xId: string,
  yId: string,
  historyMap: Map<string, PlayerHistory>
): { whiteId: string; blackId: string } | null {
  const xHist = historyMap.get(xId);
  const yHist = historyMap.get(yId);

  if (!xHist || !yHist) return { whiteId: xId, blackId: yId }; // default fallback

  // 1. Strict absolute constraints: FIDE consecutive color limit (2) and max difference (2)
  const xMustPlayBlack =
    xHist.consecutiveSameColor >= FIDE_RULES.MAX_CONSECUTIVE_SAME_COLOR ||
    xHist.colorDifference >= FIDE_RULES.MAX_COLOR_DIFFERENCE;
  const xMustPlayWhite =
    xHist.consecutiveSameColor <= -FIDE_RULES.MAX_CONSECUTIVE_SAME_COLOR ||
    xHist.colorDifference <= -FIDE_RULES.MAX_COLOR_DIFFERENCE;

  const yMustPlayBlack =
    yHist.consecutiveSameColor >= FIDE_RULES.MAX_CONSECUTIVE_SAME_COLOR ||
    yHist.colorDifference >= FIDE_RULES.MAX_COLOR_DIFFERENCE;
  const yMustPlayWhite =
    yHist.consecutiveSameColor <= -FIDE_RULES.MAX_CONSECUTIVE_SAME_COLOR ||
    yHist.colorDifference <= -FIDE_RULES.MAX_COLOR_DIFFERENCE;

  // If both must play the same color, pairing is invalid under FIDE rules
  if (xMustPlayBlack && yMustPlayBlack) return null;
  if (xMustPlayWhite && yMustPlayWhite) return null;

  // Direct forced assignments
  if (xMustPlayWhite || yMustPlayBlack) {
    return { whiteId: xId, blackId: yId };
  }
  if (xMustPlayBlack || yMustPlayWhite) {
    return { whiteId: yId, blackId: xId };
  }

  // 2. Soft Preferences (FIDE C.04.1.b)
  // Strong preference: balance overall color difference if non-zero
  // Mild preference: alternate from last round color if color difference is 0
  const xLast = xHist.colors.length > 0 ? xHist.colors[xHist.colors.length - 1] : null;
  const yLast = yHist.colors.length > 0 ? yHist.colors[yHist.colors.length - 1] : null;

  let xPref: "W" | "B" | null = null;
  if (xHist.colorDifference > 0) {
    xPref = "B";
  } else if (xHist.colorDifference < 0) {
    xPref = "W";
  } else if (xLast) {
    xPref = xLast === "W" ? "B" : "W"; // Alternate
  }

  let yPref: "W" | "B" | null = null;
  if (yHist.colorDifference > 0) {
    yPref = "B";
  } else if (yHist.colorDifference < 0) {
    yPref = "W";
  } else if (yLast) {
    yPref = yLast === "W" ? "B" : "W"; // Alternate
  }

  // 3. Mutually compatible preferences (one wants White, other wants Black)
  if (xPref === "W" && yPref === "B") {
    return { whiteId: xId, blackId: yId };
  }
  if (xPref === "B" && yPref === "W") {
    return { whiteId: yId, blackId: xId };
  }

  // 4. Conflicting preferences (both want White, or both want Black)
  // Check preference strength (higher colorDifference or consecutive same color)
  const xPrefStrength = Math.abs(xHist.colorDifference) * 10 + Math.abs(xHist.consecutiveSameColor);
  const yPrefStrength = Math.abs(yHist.colorDifference) * 10 + Math.abs(yHist.consecutiveSameColor);

  if (xPrefStrength !== yPrefStrength) {
    const strongerId = xPrefStrength > yPrefStrength ? xId : yId;
    const strongerPref = xPrefStrength > yPrefStrength ? xPref : yPref;

    if (strongerId === xId) {
      return strongerPref === "W"
        ? { whiteId: xId, blackId: yId }
        : { whiteId: yId, blackId: xId };
    } else {
      return strongerPref === "W"
        ? { whiteId: yId, blackId: xId }
        : { whiteId: xId, blackId: yId };
    }
  }

  // 5. If equal preference strength, prioritize alternating from previous round:
  // If one played White last round and the other played Black last round,
  // we can alternate BOTH players: previous Black player gets White, previous White player gets Black!
  if (xLast && yLast && xLast !== yLast) {
    if (xLast === "B" && yLast === "W") {
      return { whiteId: xId, blackId: yId };
    } else {
      return { whiteId: yId, blackId: xId };
    }
  }

  // 6. Fallback: give White to player with lower color difference (or who has played fewer Whites)
  if (xHist.colorDifference !== yHist.colorDifference) {
    return xHist.colorDifference < yHist.colorDifference
      ? { whiteId: xId, blackId: yId }
      : { whiteId: yId, blackId: xId };
  }

  // 7. Equal: default to seed / ID order
  return { whiteId: xId, blackId: yId };
}

/**
 * Calculates a penalty score for pairing first and candidate to optimize color balancing.
 * 0 = perfect alternation and color balance.
 */
export function getColorCompatibilityPenalty(
  firstId: string,
  candId: string,
  historyMap: Map<string, PlayerHistory>
): number {
  const xHist = historyMap.get(firstId);
  const yHist = historyMap.get(candId);
  if (!xHist || !yHist) return 0;

  const colors = determineColors(firstId, candId, historyMap);
  if (!colors) return 1000; // incompatible under strict FIDE rules

  let penalty = 0;
  const xAssigned = colors.whiteId === firstId ? "W" : "B";
  const yAssigned = colors.whiteId === candId ? "W" : "B";

  const xLast = xHist.colors[xHist.colors.length - 1];
  const yLast = yHist.colors[yHist.colors.length - 1];

  // Penalize repeating the same color consecutively
  if (xLast && xLast === xAssigned) {
    penalty += 25;
  }
  if (yLast && yLast === yAssigned) {
    penalty += 25;
  }

  // Penalize increasing absolute color difference
  const nextXDiff = xAssigned === "W" ? xHist.colorDifference + 1 : xHist.colorDifference - 1;
  const nextYDiff = yAssigned === "W" ? yHist.colorDifference + 1 : yHist.colorDifference - 1;

  penalty += Math.abs(nextXDiff) * 5;
  penalty += Math.abs(nextYDiff) * 5;

  return penalty;
}

/**
 * Main Swiss Pairing Generator.
 */
export function generateSwissRound(
  players: PlayerInput[],
  matches: MatchInput[]
): PairingResult[] {
  const historyMap = buildPlayerHistory(players, matches);
  let pool = [...players];

  const pairings: PairingResult[] = [];
  let boardCounter = 1;

  // 1. Assign Bye if odd number of players
  if (pool.length % 2 === 1) {
    // Bye candidate: player with the lowest score who hasn't had a bye.
    // Sort pool by score asc, then rating asc to find candidate.
    const byeCandidates = [...pool]
      .filter((p) => {
        const hist = historyMap.get(p.id);
        return hist ? !hist.hasHadBye : true;
      })
      .sort((a, b) => a.score - b.score || a.rating - b.rating);

    const byePlayer = byeCandidates[0] || pool[pool.length - 1]; // fallback to last seed

    pairings.push({
      whiteId: byePlayer.id,
      blackId: null, // null represents BYE
      board: 0, // bye is usually board 0 or special
      whiteScore: byePlayer.score,
      whiteRating: byePlayer.rating,
    });

    // Remove bye player from pairing pool
    pool = pool.filter((p) => p.id !== byePlayer.id);
  }

  // Sort pool by score desc, then rating desc, then id asc (seeding order)
  pool.sort((a, b) => b.score - a.score || b.rating - a.rating || a.id.localeCompare(b.id));

  // Backtracking variables
  let backtrackCount = 0;
  const MAX_BACKTRACK = 10000;

  function backtrackPair(
    activePool: PlayerInput[],
    currentPairs: { whiteId: string; blackId: string }[]
  ): { whiteId: string; blackId: string }[] | null {
    backtrackCount++;
    if (backtrackCount > MAX_BACKTRACK) {
      return null; // safety timeout limit
    }

    if (activePool.length === 0) {
      return currentPairs;
    }

    const first = activePool[0];
    const xHist = historyMap.get(first.id);

    // Candidates: other players who haven't played First yet
    const candidates = activePool.slice(1).filter((cand) => {
      if (!xHist) return true;
      return !xHist.opponents.has(cand.id);
    });

    // Sort candidates:
    // 1. Min score difference with First (same score group is preferred)
    // 2. Color preference compatibility: prefer opponent whose color complements First (alternates both)
    // 3. Rating descending
    candidates.sort((a, b) => {
      const scoreDiffA = Math.abs(a.score - first.score);
      const scoreDiffB = Math.abs(b.score - first.score);
      if (scoreDiffA !== scoreDiffB) return scoreDiffA - scoreDiffB;

      const penaltyA = getColorCompatibilityPenalty(first.id, a.id, historyMap);
      const penaltyB = getColorCompatibilityPenalty(first.id, b.id, historyMap);
      if (penaltyA !== penaltyB) return penaltyA - penaltyB;

      return b.rating - a.rating;
    });

    for (const cand of candidates) {
      const colors = determineColors(first.id, cand.id, historyMap);
      if (colors) {
        // Valid colors. Try this pairing
        const nextPool = activePool.filter((p) => p.id !== first.id && p.id !== cand.id);
        const result = backtrackPair(nextPool, [...currentPairs, colors]);
        if (result) return result;
      }
    }

    return null;
  }

  const matchesResult = backtrackPair(pool, []);

  if (matchesResult) {
    for (const pair of matchesResult) {
      const wPlayer = players.find((p) => p.id === pair.whiteId)!;
      const bPlayer = players.find((p) => p.id === pair.blackId)!;

      pairings.push({
        whiteId: pair.whiteId,
        blackId: pair.blackId,
        board: boardCounter++,
        whiteScore: wPlayer.score,
        blackScore: bPlayer.score,
        whiteRating: wPlayer.rating,
        blackRating: bPlayer.rating,
      });
    }
  } else {
    // Greedy fallback if backtracking fails or times out
    console.warn("Swiss pairing backtracking failed or timed out. Falling back to greedy pairing.");
    // Greedy: just pair in order of score group, bypassing color rules if needed
    const used = new Set<string>();
    for (let i = 0; i < pool.length; i++) {
      if (used.has(pool[i].id)) continue;
      const first = pool[i];
      used.add(first.id);

      let paired = false;
      // Search for opponent
      for (let j = i + 1; j < pool.length; j++) {
        const cand = pool[j];
        if (used.has(cand.id)) continue;

        const xHist = historyMap.get(first.id);
        if (xHist && xHist.opponents.has(cand.id)) continue; // still try to avoid repeats if possible

        const colors = determineColors(first.id, cand.id, historyMap) || { whiteId: first.id, blackId: cand.id };
        used.add(cand.id);

        pairings.push({
          whiteId: colors.whiteId,
          blackId: colors.blackId,
          board: boardCounter++,
          whiteScore: players.find((p) => p.id === colors.whiteId)!.score,
          blackScore: players.find((p) => p.id === colors.blackId)!.score,
          whiteRating: players.find((p) => p.id === colors.whiteId)!.rating,
          blackRating: players.find((p) => p.id === colors.blackId)!.rating,
        });

        paired = true;
        break;
      }

      if (!paired) {
        // Unpaired player gets BYE
        pairings.push({
          whiteId: first.id,
          blackId: null,
          board: 0,
          whiteScore: first.score,
          whiteRating: first.rating,
        });
      }
    }
  }

  // Sort pairings: bye first (board 0) or by board number
  return pairings.sort((a, b) => a.board - b.board);
}
