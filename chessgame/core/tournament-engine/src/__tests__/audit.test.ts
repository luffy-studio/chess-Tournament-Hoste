import { describe, it, expect } from 'vitest';
import { generateAuditReport } from '../audits/auditEngine';
import { buildPlayerHistory } from '../pairing/swiss';
import { computeAllTiebreaks } from '../tiebreaks/calculations';

describe('Audit Engine & FIDE Compliance', () => {
  it('generates a full FIDE compliance report for a round', () => {
    const players = [
      { id: 'p1', score: 1, rating: 1500 },
      { id: 'p2', score: 0, rating: 1400 },
    ];
    const matches = [
      { round: 1, whiteId: 'p1', blackId: 'p2', result: 'W' as const },
    ];
    const historyMap = buildPlayerHistory(players, matches);
    const tiebreaksMap = computeAllTiebreaks(players, matches);

    const pairings = [{ whiteId: 'p1', blackId: 'p2', board: 1, whiteScore: 1, blackScore: 0 }];
    const report = generateAuditReport(2, pairings, historyMap, tiebreaksMap);

    expect(report.round).toBe(2);
    expect(report.fideComplianceReport).toBeDefined();
    expect(report.fideComplianceReport.checklist.length).toBeGreaterThanOrEqual(4);
    expect(report.pairingAuditReport.boards).toHaveLength(1);
    expect(report.colorBalanceReport.length).toBeGreaterThan(0);
    expect(report.tiebreakCalculationReport.length).toBeGreaterThan(0);
  });
});
