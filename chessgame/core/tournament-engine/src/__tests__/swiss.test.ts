import { describe, it, expect } from 'vitest';
import { generateSwissRound, buildPlayerHistory, determineColors } from '../pairing/swiss';

describe('Swiss Pairing Engine', () => {
  describe('2 players', () => {
    it('should generate 1 match with no BYE', () => {
      const players = [
        { id: 'p1', score: 0, rating: 1500 },
        { id: 'p2', score: 0, rating: 1400 },
      ];
      const pairings = generateSwissRound(players, []);
      expect(pairings).toHaveLength(1);
      expect(pairings[0].blackId).not.toBeNull();
      expect(pairings[0].whiteId).not.toBeNull();
    });
  });

  describe('3 players (Odd count BYE allocation)', () => {
    it('should assign BYE to lowest scored player', () => {
      const players = [
        { id: 'p1', score: 1, rating: 1500 },
        { id: 'p2', score: 0.5, rating: 1400 },
        { id: 'p3', score: 0, rating: 1300 },
      ];
      const pairings = generateSwissRound(players, []);
      const byePairing = pairings.find((p) => p.blackId === null);
      expect(byePairing).toBeDefined();
      expect(byePairing?.whiteId).toBe('p3'); // lowest score gets BYE
    });

    it('should not give BYE to same player twice when alternatives exist', () => {
      const players = [
        { id: 'p1', score: 1, rating: 1500 },
        { id: 'p2', score: 0.5, rating: 1400 },
        { id: 'p3', score: 1, rating: 1300 }, // p3 had BYE in round 1
      ];
      const previousMatches = [
        { round: 1, whiteId: 'p3', blackId: null, result: 'W' as const }, // p3 had BYE
        { round: 1, whiteId: 'p1', blackId: 'p2', result: 'W' as const },
      ];
      const pairings = generateSwissRound(players, previousMatches);
      const byePairing = pairings.find((p) => p.blackId === null);
      expect(byePairing).toBeDefined();
      expect(byePairing?.whiteId).not.toBe('p3'); // p3 must NOT receive a second BYE
    });
  });

  describe('Color balancing & alternation', () => {
    it('should balance colors across rounds', () => {
      const historyMap = buildPlayerHistory(
        [
          { id: 'p1', score: 1, rating: 1500 },
          { id: 'p2', score: 1, rating: 1400 },
        ],
        [{ round: 1, whiteId: 'p1', blackId: 'p2', result: 'D' as const }]
      );

      // p1 was White, p2 was Black. If they were to play again, colors would prefer p2 White, p1 Black
      const colors = determineColors('p1', 'p2', historyMap);
      expect(colors).not.toBeNull();
      expect(colors?.whiteId).toBe('p2');
      expect(colors?.blackId).toBe('p1');
    });

    it('should prioritize pairing candidates that satisfy color alternation in Round 2', () => {
      const players = [
        { id: 'p1', score: 1, rating: 1600 },
        { id: 'p2', score: 1, rating: 1550 },
        { id: 'p3', score: 0, rating: 1400 },
        { id: 'p4', score: 0, rating: 1350 },
      ];
      // In Round 1:
      // p1 was White vs p3 (Black) -> p1 won
      // p2 was Black vs p4 (White) -> p2 won
      const round1Matches = [
        { round: 1, whiteId: 'p1', blackId: 'p3', result: 'W' as const },
        { round: 1, whiteId: 'p4', blackId: 'p2', result: 'L' as const },
      ];

      // Round 2 pairings:
      // p1 (score 1, played W) should play p2 (score 1, played B)
      // Since p1 played W, p1 should now be Black. Since p2 played B, p2 should now be White!
      const round2Pairings = generateSwissRound(players, round1Matches);

      const topMatch = round2Pairings.find(
        (p) => (p.whiteId === 'p1' && p.blackId === 'p2') || (p.whiteId === 'p2' && p.blackId === 'p1')
      );
      expect(topMatch).toBeDefined();
      expect(topMatch?.whiteId).toBe('p2'); // p2 was Black, now White!
      expect(topMatch?.blackId).toBe('p1'); // p1 was White, now Black!
    });

    it('should maintain balanced colors across 3 consecutive Swiss rounds', () => {
      const players = [
        { id: 'p1', score: 0, rating: 1800 },
        { id: 'p2', score: 0, rating: 1700 },
        { id: 'p3', score: 0, rating: 1600 },
        { id: 'p4', score: 0, rating: 1500 },
      ];

      // Round 1
      const r1 = generateSwissRound(players, []);
      expect(r1).toHaveLength(2);

      // Simulate results: top seeds win
      const r1Matches = r1.map((p) => ({
        round: 1,
        whiteId: p.whiteId,
        blackId: p.blackId,
        result: 'W' as const,
      }));

      // Update scores
      for (const m of r1Matches) {
        const winner = players.find((p) => p.id === m.whiteId);
        if (winner) winner.score += 1;
      }

      // Round 2
      const r2 = generateSwissRound(players, r1Matches);
      expect(r2).toHaveLength(2);

      const r2Matches = r2.map((p) => ({
        round: 2,
        whiteId: p.whiteId,
        blackId: p.blackId,
        result: 'W' as const,
      }));

      for (const m of r2Matches) {
        const winner = players.find((p) => p.id === m.whiteId);
        if (winner) winner.score += 1;
      }

      // Round 3
      const allMatches = [...r1Matches, ...r2Matches];
      const r3 = generateSwissRound(players, allMatches);
      expect(r3).toHaveLength(2);

      // Verify no player plays the same color 3 times in a row
      const fullHistory = buildPlayerHistory(players, [...allMatches, ...r3.map((p) => ({
        round: 3,
        whiteId: p.whiteId,
        blackId: p.blackId,
        result: null,
      }))]);

      for (const hist of fullHistory.values()) {
        expect(Math.abs(hist.consecutiveSameColor)).toBeLessThanOrEqual(2);
        expect(Math.abs(hist.colorDifference)).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('No repeat opponents', () => {
    it('should avoid repeat matchups when valid alternative pairings exist', () => {
      const players = [
        { id: 'p1', score: 1, rating: 1600 },
        { id: 'p2', score: 1, rating: 1500 },
        { id: 'p3', score: 0, rating: 1400 },
        { id: 'p4', score: 0, rating: 1300 },
      ];
      const previousMatches = [
        { round: 1, whiteId: 'p1', blackId: 'p2', result: 'W' as const },
        { round: 1, whiteId: 'p3', blackId: 'p4', result: 'L' as const },
      ];
      const pairings = generateSwissRound(players, previousMatches);

      // p1 and p2 should NOT play each other again
      const repeat = pairings.find(
        (p) =>
          (p.whiteId === 'p1' && p.blackId === 'p2') ||
          (p.whiteId === 'p2' && p.blackId === 'p1')
      );
      expect(repeat).toBeUndefined();
    });
  });

  describe('Edge case: 1 player', () => {
    it('should assign a BYE to the single player', () => {
      const players = [{ id: 'solo', score: 0, rating: 1200 }];
      const pairings = generateSwissRound(players, []);
      expect(pairings).toHaveLength(1);
      expect(pairings[0].whiteId).toBe('solo');
      expect(pairings[0].blackId).toBeNull();
    });
  });
});
