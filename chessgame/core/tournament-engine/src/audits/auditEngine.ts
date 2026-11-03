import { PlayerHistory, PairingResult } from '../pairing/swiss';
import { ComputedTiebreaks } from '../tiebreaks/calculations';
import { validatePairings } from '../validations/pairingValidator';

export interface AuditReport {
  round: number;
  pairingAuditReport: {
    boards: {
      board: number;
      whiteId: string;
      blackId: string | null;
      whiteScore: number;
      blackScore: number;
      scoreDiff: number;
    }[];
    floaters: {
      playerId: string;
      playerName?: string;
      direction: "up" | "down";
      fromScore: number;
      toScore: number;
    }[];
  };
  colorBalanceReport: {
    playerId: string;
    playerName?: string;
    colorHistory: string;
    currentColor: "W" | "B" | "BYE";
    newColorDifference: number;
    newConsecutiveSameColor: number;
  }[];
  fideComplianceReport: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    checklist: {
      rule: string;
      status: "PASS" | "WARN" | "FAIL";
      details: string;
    }[];
  };
  tiebreakCalculationReport: {
    playerId: string;
    playerName?: string;
    score: number;
    buchholzDetails: string;
    sonnebornBergerDetails: string;
    progressiveDetails: string;
    mostWinsDetails: string;
  }[];
}

/**
 * Generates audit reports for a specific round based on pairings and history.
 */
export function generateAuditReport(
  round: number,
  pairings: PairingResult[],
  historyMap: Map<string, PlayerHistory>,
  tiebreaksMap: Map<string, ComputedTiebreaks>
): AuditReport {
  // 1. Validate pairings
  const validation = validatePairings(pairings, historyMap);

  // 2. Build FIDE Compliance Checklist
  const checklist = [
    {
      rule: "No Duplicate Encounters",
      status: validation.warnings.some((w) => w.includes("Repeat pairing")) ? "WARN" as const : "PASS" as const,
      details: validation.warnings.find((w) => w.includes("Repeat pairing")) || "No players have played each other twice.",
    },
    {
      rule: "No 3 Consecutive Same Colors",
      status: validation.warnings.some((w) => w.includes("Consecutive color")) ? "WARN" as const : "PASS" as const,
      details: validation.warnings.find((w) => w.includes("Consecutive color")) || "No player has 3 consecutive same colors.",
    },
    {
      rule: "Color Difference <= 2",
      status: validation.warnings.some((w) => w.includes("Color difference")) ? "WARN" as const : "PASS" as const,
      details: validation.warnings.find((w) => w.includes("Color difference")) || "All player color differences are within limits.",
    },
    {
      rule: "Single Bye Policy",
      status: validation.warnings.some((w) => w.includes("Duplicate bye")) ? "WARN" as const : "PASS" as const,
      details: validation.warnings.find((w) => w.includes("Duplicate bye")) || "No player has received more than one bye.",
    },
  ];

  // 3. Build Board Score Audit & Floater Tracking
  const boardsAudit: AuditReport["pairingAuditReport"]["boards"] = [];
  const floaters: AuditReport["pairingAuditReport"]["floaters"] = [];

  for (const p of pairings) {
    if (!p.whiteId) continue; // Skip invalid pairings

    const wScore = p.whiteScore ?? 0;
    const bScore = p.blackScore ?? 0;

    boardsAudit.push({
      board: p.board,
      whiteId: p.whiteId,
      blackId: p.blackId,
      whiteScore: wScore,
      blackScore: bScore,
      scoreDiff: p.blackId ? Math.abs(wScore - bScore) : 0,
    });

    if (p.blackId) {
      // Floater check: if score difference is non-zero, one player floated
      if (wScore !== bScore) {
        const higher = wScore > bScore ? p.whiteId : p.blackId;
        const lower = wScore > bScore ? p.blackId : p.whiteId;
        const hScore = Math.max(wScore, bScore);
        const lScore = Math.min(wScore, bScore);

        floaters.push({
          playerId: higher,
          direction: "down",
          fromScore: hScore,
          toScore: lScore,
        });

        floaters.push({
          playerId: lower,
          direction: "up",
          fromScore: lScore,
          toScore: hScore,
        });
      }
    }
  }

  // 4. Build Color Balance details
  const colorBalanceReport: AuditReport["colorBalanceReport"] = [];
  for (const p of pairings) {
    if (p.whiteId) {
      const wHist = historyMap.get(p.whiteId);
      if (wHist) {
        const hasOpp = !!p.blackId;
        const newDiff = wHist.colorDifference + (hasOpp ? 1 : 0);
        
        let newConsec = 0;
        if (hasOpp) {
          newConsec = wHist.consecutiveSameColor >= 0 ? wHist.consecutiveSameColor + 1 : 1;
        }

        colorBalanceReport.push({
          playerId: p.whiteId,
          colorHistory: wHist.colors.join(""),
          currentColor: hasOpp ? "W" : "BYE",
          newColorDifference: newDiff,
          newConsecutiveSameColor: newConsec,
        });
      }
    }

    if (p.blackId && p.whiteId) {
      const bHist = historyMap.get(p.blackId);
      if (bHist) {
        const newDiff = bHist.colorDifference - 1;
        const newConsec = bHist.consecutiveSameColor <= 0 ? bHist.consecutiveSameColor - 1 : -1;

        colorBalanceReport.push({
          playerId: p.blackId,
          colorHistory: bHist.colors.join(""),
          currentColor: "B",
          newColorDifference: newDiff,
          newConsecutiveSameColor: newConsec,
        });
      }
    }
  }

  // 5. Build Tie-break Math Details
  const tiebreakCalculationReport: AuditReport["tiebreakCalculationReport"] = [];
  for (const [id, tb] of tiebreaksMap.entries()) {
    const hist = historyMap.get(id);
    const oppScores = hist
      ? Array.from(hist.opponents).map((oppId) => {
          const oppTb = tiebreaksMap.get(oppId);
          return oppTb ? `${oppId}(${oppTb.score})` : `${oppId}(0)`;
        })
      : [];

    tiebreakCalculationReport.push({
      playerId: id,
      score: tb.score,
      buchholzDetails: `Opponents scores: ${oppScores.join(" + ")} = ${tb.buchholz}`,
      sonnebornBergerDetails: `SB sum: wins + 0.5 * draws = ${tb.sonnebornBerger}`,
      progressiveDetails: `Progressive cumulative sum by round = ${tb.progressiveScore}`,
      mostWinsDetails: `Wins: ${tb.mostWins} (Wins with Black: ${tb.mostWinsBlack})`,
    });
  }

  return {
    round,
    pairingAuditReport: {
      boards: boardsAudit,
      floaters,
    },
    colorBalanceReport,
    fideComplianceReport: {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      checklist,
    },
    tiebreakCalculationReport,
  };
}
