import { BYE_ID } from '../types';

/**
 * Simple shuffle utility.
 */
export function shuffle<T>(arr: T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Gets participant name by ID. If null or BYE_ID, returns "BYE".
 */
export function nameOf(id: any, players: any[] = []): string {
  if (id === null || id === undefined || id === BYE_ID || id === "BYE" || id === -1) {
    return "BYE";
  }
  const found = players.find((p) => String(p.id) === String(id));
  return found ? found.name : `ID:${id}`;
}

/**
 * Build Swiss-ish pairs from standings: players with same score get bracketed together.
 * Inside each bracket we shuffle, and if odd-sized, we float the last player down.
 * Returns a list of pairs; BYE produced only if total count is odd.
 */
export function buildScoreBracketPairsFromStandings(
  standings: any[],
  playerCount: number
): { a: any; b: any }[] {
  const byScore = new Map<number, any[]>();
  standings.forEach(({ id, score }) => {
    const key = Math.round(score * 2) / 2; // keep .0 / .5 steps
    if (!byScore.has(key)) byScore.set(key, []);
    byScore.get(key)!.push(id);
  });

  const bracketKeys = Array.from(byScore.keys()).sort((a, b) => b - a);

  const orderedPairs: { a: any; b: any }[] = [];
  let carry: any = null;

  for (const key of bracketKeys) {
    const bucket = shuffle(byScore.get(key)!);

    const work: any[] = carry !== null ? [carry, ...bucket] : bucket.slice();
    carry = null;

    for (let i = 0; i < work.length; i += 2) {
      if (i + 1 < work.length) {
        orderedPairs.push({ a: work[i], b: work[i + 1] });
      } else {
        carry = work[i];
      }
    }
  }

  // Remaining carry -> BYE if odd field size
  if (carry !== null && playerCount % 2 === 1) {
    orderedPairs.push({ a: carry, b: BYE_ID });
    carry = null;
  }

  return orderedPairs;
}

/** Round-robin (circle method): returns array of rounds, each a list of [a,b] ids. */
export function roundRobinSchedule(playerIds: any[]): any[][][] {
  const ids = playerIds.slice();
  const hadBye = ids.length % 2 === 1;
  if (hadBye) ids.push(BYE_ID);

  const n = ids.length;
  const rounds: any[][][] = [];
  const half = n / 2;

  for (let r = 0; r < n - 1; r++) {
    const pairs: any[][] = [];
    const seen = new Set<any>();
    for (let i = 0; i < half; i++) {
      const a = ids[i];
      const b = ids[n - 1 - i];
      if (a === b) throw new Error("Round-robin self-pair detected");
      if (seen.has(a) || seen.has(b)) throw new Error("Round-robin duplicate in same round");
      seen.add(a);
      seen.add(b);
      pairs.push([a, b]);
    }
    rounds.push(pairs);
    // rotate keeping first fixed
    const fixed = ids[0];
    const rest = ids.slice(1);
    rest.unshift(rest.pop()!);
    ids.splice(0, ids.length, fixed, ...rest);
  }

  return rounds;
}
