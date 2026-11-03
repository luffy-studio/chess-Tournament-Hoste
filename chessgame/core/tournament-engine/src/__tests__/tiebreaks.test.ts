import { describe, it, expect } from 'vitest';
import { computeAllTiebreaks, getStandingsComparator } from '../tiebreaks/calculations';

describe('Tie-break & Ranking Engine', () => {
  const players = [
    { id: 'p1' },
    { id: 'p2' },
    { id: 'p3' },
    { id: 'p4' },
  ];

  // Round 1: p1 beats p2, p3 draws p4
  const matches = [
    { round: 1, whiteId: 'p1', blackId: 'p2', result: 'W' },
    { round: 1, whiteId: 'p3', blackId: 'p4', result: 'D' },
  ];

  it('computes correct baseline scores', () => {
    const tb = computeAllTiebreaks(players, matches as any);
    expect(tb.get('p1')?.score).toBe(1);
    expect(tb.get('p2')?.score).toBe(0);
    expect(tb.get('p3')?.score).toBe(0.5);
    expect(tb.get('p4')?.score).toBe(0.5);
  });

  it('computes Buchholz as sum of opponent scores', () => {
    const tb = computeAllTiebreaks(players, matches as any);
    // p1 played p2 (score 0)
    expect(tb.get('p1')?.buchholz).toBe(0);
    // p2 played p1 (score 1)
    expect(tb.get('p2')?.buchholz).toBe(1);
    // p3 played p4 (score 0.5)
    expect(tb.get('p3')?.buchholz).toBe(0.5);
  });

  it('computes Sonneborn-Berger correctly (wins * opp score + 0.5 * draws * opp score)', () => {
    const tb = computeAllTiebreaks(players, matches as any);
    // p1 won against p2 (p2 score=0) -> 0
    expect(tb.get('p1')?.sonnebornBerger).toBe(0);
    // p3 drew against p4 (p4 score=0.5) -> 0.5 * 0.5 = 0.25
    expect(tb.get('p3')?.sonnebornBerger).toBe(0.25);
  });

  it('counts wins and black wins accurately', () => {
    const matches2 = [
      { round: 1, whiteId: 'p1', blackId: 'p2', result: 'L' }, // p2 wins as Black
    ];
    const tb = computeAllTiebreaks(players, matches2 as any);
    expect(tb.get('p2')?.mostWins).toBe(1);
    expect(tb.get('p2')?.mostWinsBlack).toBe(1);
    expect(tb.get('p1')?.mostWins).toBe(0);
  });

  it('ranks players using standings comparator (primary score, head-to-head, tie-breaks)', () => {
    const tb = computeAllTiebreaks(players, matches as any);
    const comparator = getStandingsComparator(tb, matches as any);
    const sorted = [...players].sort((a, b) => comparator(a.id, b.id));
    // p1 (1.0) must be first, followed by p3/p4 (0.5), and p2 (0.0) last
    expect(sorted[0].id).toBe('p1');
    expect(sorted[3].id).toBe('p2');
  });
});
