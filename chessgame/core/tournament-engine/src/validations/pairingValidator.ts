import { FIDE_RULES } from '../fide-rules/rules';
import { PlayerHistory } from '../pairing/swiss';

export interface PairingToValidate {
  whiteId: string | null;
  blackId: string | null;
  board: number;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validates round pairings against FIDE rules and history.
 */
export function validatePairings(
  pairings: PairingToValidate[],
  historyMap: Map<string, PlayerHistory>
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const pairedPlayers = new Set<string>();

  for (const p of pairings) {
    const wId = p.whiteId;
    const bId = p.blackId;

    if (!wId && !bId) {
      errors.push(`Board ${p.board}: Both White and Black IDs are null.`);
      continue;
    }

    // 1. Check self-pair
    if (wId && bId && wId === bId) {
      errors.push(`Board ${p.board}: Player ${wId} is paired against themselves.`);
      continue;
    }

    // 2. Process White Player
    if (wId) {
      if (pairedPlayers.has(wId)) {
        errors.push(`Board ${p.board}: Player ${wId} is paired multiple times in this round.`);
      }
      pairedPlayers.add(wId);

      const wHist = historyMap.get(wId);
      if (wHist) {
        if (bId) {
          // Check repeat pairing
          if (wHist.opponents.has(bId)) {
            warnings.push(
              `Board ${p.board}: Repeat pairing detected. Player ${wId} has already played Player ${bId}.`
            );
          }

          // Check color violations if they play White
          const newDiff = wHist.colorDifference + 1;
          if (Math.abs(newDiff) > FIDE_RULES.MAX_COLOR_DIFFERENCE) {
            warnings.push(
              `Board ${p.board}: Color difference violation for Player ${wId}. Current difference is ${wHist.colorDifference}, playing White would make it ${newDiff}.`
            );
          }

          if (wHist.consecutiveSameColor >= FIDE_RULES.MAX_CONSECUTIVE_SAME_COLOR) {
            warnings.push(
              `Board ${p.board}: Consecutive color violation for Player ${wId}. Already played White ${wHist.consecutiveSameColor} times consecutively.`
            );
          }
        } else {
          // Bye check
          if (wHist.hasHadBye) {
            warnings.push(`Board ${p.board}: Duplicate bye warning. Player ${wId} has already received a bye.`);
          }
        }
      }
    }

    // 3. Process Black Player
    if (bId) {
      if (pairedPlayers.has(bId)) {
        errors.push(`Board ${p.board}: Player ${bId} is paired multiple times in this round.`);
      }
      pairedPlayers.add(bId);

      const bHist = historyMap.get(bId);
      if (bHist) {
        if (wId) {
          // Check color violations if they play Black
          const newDiff = bHist.colorDifference - 1;
          if (Math.abs(newDiff) > FIDE_RULES.MAX_COLOR_DIFFERENCE) {
            warnings.push(
              `Board ${p.board}: Color difference violation for Player ${bId}. Current difference is ${bHist.colorDifference}, playing Black would make it ${newDiff}.`
            );
          }

          if (bHist.consecutiveSameColor <= -FIDE_RULES.MAX_CONSECUTIVE_SAME_COLOR) {
            warnings.push(
              `Board ${p.board}: Consecutive color violation for Player ${bId}. Already played Black ${Math.abs(
                bHist.consecutiveSameColor
              )} times consecutively.`
            );
          }
        } else {
          // Bye check
          if (bHist.hasHadBye) {
            warnings.push(`Board ${p.board}: Duplicate bye warning. Player ${bId} has already received a bye.`);
          }
        }
      }
    }
  }

  // Check if any players from historyMap are not paired
  for (const id of historyMap.keys()) {
    if (!pairedPlayers.has(id)) {
      warnings.push(`Player ${id} is not paired in this round.`);
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}
