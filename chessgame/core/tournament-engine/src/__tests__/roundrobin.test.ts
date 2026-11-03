import { describe, it, expect } from 'vitest';
import { generateRoundRobinPairings } from '../pairing/roundrobin';

describe('Round Robin Engine (Berger Tables)', () => {
  describe('4 players (Even field)', () => {
    it('should generate 3 rounds with 2 matches each (6 total)', () => {
      const pairings = generateRoundRobinPairings(['p1', 'p2', 'p3', 'p4']);
      expect(pairings).toHaveLength(6);
      const rounds = new Set(pairings.map((p) => p.round));
      expect(rounds.size).toBe(3);
    });

    it('should have no duplicate fixtures', () => {
      const pairings = generateRoundRobinPairings(['p1', 'p2', 'p3', 'p4']);
      const seen = new Set<string>();
      for (const p of pairings) {
        const fixtureKey = [p.whiteId, p.blackId].sort().join('-vs-');
        expect(seen.has(fixtureKey)).toBe(false);
        seen.add(fixtureKey);
      }
    });

    it('should give every participant exactly 3 games', () => {
      const pairings = generateRoundRobinPairings(['p1', 'p2', 'p3', 'p4']);
      const counts: Record<string, number> = {};
      for (const p of pairings) {
        if (p.whiteId) counts[p.whiteId] = (counts[p.whiteId] || 0) + 1;
        if (p.blackId) counts[p.blackId] = (counts[p.blackId] || 0) + 1;
      }
      for (const id of ['p1', 'p2', 'p3', 'p4']) {
        expect(counts[id]).toBe(3);
      }
    });
  });

  describe('3 players (Odd field with BYE)', () => {
    it('should generate 3 rounds with virtual BYEs', () => {
      const pairings = generateRoundRobinPairings(['p1', 'p2', 'p3']);
      const rounds = new Set(pairings.map((p) => p.round));
      expect(rounds.size).toBe(3);
    });

    it('each real player should receive exactly one BYE', () => {
      const pairings = generateRoundRobinPairings(['p1', 'p2', 'p3']);
      const byeCount: Record<string, number> = {};
      for (const p of pairings) {
        if (p.whiteId && !p.blackId) byeCount[p.whiteId] = (byeCount[p.whiteId] || 0) + 1;
        if (p.blackId && !p.whiteId) byeCount[p.blackId] = (byeCount[p.blackId] || 0) + 1;
      }
      for (const id of ['p1', 'p2', 'p3']) {
        expect(byeCount[id]).toBe(1);
      }
    });
  });

  describe('Double Round Robin', () => {
    it('should generate n*(n-1) matches and reverse colors in second leg', () => {
      const pairings = generateRoundRobinPairings(['p1', 'p2'], true);
      expect(pairings).toHaveLength(2); // 2 players = 2 matches (1 White each)
      const sorted = pairings.sort((a, b) => a.round - b.round);
      expect(sorted[0].whiteId).toBe(sorted[1].blackId);
      expect(sorted[0].blackId).toBe(sorted[1].whiteId);
    });
  });
});
