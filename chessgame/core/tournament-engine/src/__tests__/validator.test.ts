import { describe, it, expect } from 'vitest';
import { validatePairings } from '../validations/pairingValidator';
import { buildPlayerHistory } from '../pairing/swiss';

describe('Pairing Validator', () => {
  it('validates a clean first round without errors', () => {
    const pairings = [
      { whiteId: 'p1', blackId: 'p2', board: 1 },
      { whiteId: 'p3', blackId: 'p4', board: 2 },
    ];
    const historyMap = buildPlayerHistory(
      [
        { id: 'p1', score: 0, rating: 1500 },
        { id: 'p2', score: 0, rating: 1400 },
        { id: 'p3', score: 0, rating: 1300 },
        { id: 'p4', score: 0, rating: 1200 },
      ],
      []
    );
    const result = validatePairings(pairings, historyMap);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects self-pair violations as fatal errors', () => {
    const pairings = [{ whiteId: 'p1', blackId: 'p1', board: 1 }];
    const historyMap = buildPlayerHistory([{ id: 'p1', score: 0, rating: 1500 }], []);
    const result = validatePairings(pairings, historyMap);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('paired against themselves');
  });

  it('flags repeat pairings as warnings', () => {
    const historyMap = buildPlayerHistory(
      [
        { id: 'p1', score: 1, rating: 1500 },
        { id: 'p2', score: 0, rating: 1400 },
      ],
      [{ round: 1, whiteId: 'p1', blackId: 'p2', result: 'W' }]
    );
    const pairings = [{ whiteId: 'p1', blackId: 'p2', board: 1 }];
    const result = validatePairings(pairings, historyMap);
    expect(result.warnings.some((w) => w.includes('Repeat pairing'))).toBe(true);
  });
});
