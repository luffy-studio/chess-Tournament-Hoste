export interface RoundRobinPairing {
  round: number;
  board: number;
  whiteId: string | null;
  blackId: string | null;
}

/**
 * Generates Round Robin matches using the Berger Table algorithm.
 * Supports odd numbers of players by introducing a virtual BYE player.
 * Supports Double Round Robin by playing a second leg with reversed colors.
 */
export function generateRoundRobinPairings(
  playerIds: string[],
  doubleRoundRobin: boolean = false
): RoundRobinPairing[] {
  const ids = [...playerIds];
  const hadBye = ids.length % 2 === 1;
  const BYE_ID = "BYE";

  if (hadBye) {
    ids.push(BYE_ID);
  }

  const n = ids.length;
  const roundsCount = n - 1;
  const pairings: RoundRobinPairing[] = [];

  // Generate First Leg (Single Round Robin)
  for (let r = 0; r < roundsCount; r++) {
    let board = 1;

    for (let i = 0; i < n; i++) {
      const oppIndex = (r - i + n - 1) % (n - 1);
      const isFixedOpponent = oppIndex === i;

      if (isFixedOpponent) {
        // Player i plays against the fixed last player (n - 1)
        const opponent = n - 1;

        // FIDE color rule for Berger fixed board
        const isWhite = (i + r) % 2 === 0;
        const playerA = ids[i];
        const playerB = ids[opponent];

        if (i < opponent) {
          const whitePlayer = isWhite ? playerA : playerB;
          const blackPlayer = isWhite ? playerB : playerA;

          pairings.push({
            round: r + 1,
            board: board++,
            whiteId: whitePlayer === BYE_ID ? null : whitePlayer,
            blackId: blackPlayer === BYE_ID ? null : blackPlayer,
          });
        }
      } else {
        // Player i plays against player oppIndex
        if (i < oppIndex) {
          const opponent = oppIndex;
          const isWhite = (i + opponent + r) % 2 !== 0;
          const playerA = ids[i];
          const playerB = ids[opponent];

          const whitePlayer = isWhite ? playerA : playerB;
          const blackPlayer = isWhite ? playerB : playerA;

          pairings.push({
            round: r + 1,
            board: board++,
            whiteId: whitePlayer === BYE_ID ? null : whitePlayer,
            blackId: blackPlayer === BYE_ID ? null : blackPlayer,
          });
        }
      }
    }
  }

  // Generate Second Leg (Double Round Robin)
  if (doubleRoundRobin) {
    const singleRoundCount = roundsCount;
    for (const match of [...pairings]) {
      pairings.push({
        round: match.round + singleRoundCount,
        board: match.board,
        whiteId: match.blackId, // swap colors
        blackId: match.whiteId, // swap colors
      });
    }
  }

  // Sort pairings by round then by board
  return pairings.sort((a, b) => a.round - b.round || a.board - b.board);
}
