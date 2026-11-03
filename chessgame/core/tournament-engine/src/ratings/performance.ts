import { FIDE_RULES } from '../fide-rules/rules';

const FIDE_DP_TABLE = [
  { p: 1.00, dp: 800 },
  { p: 0.99, dp: 677 },
  { p: 0.98, dp: 589 },
  { p: 0.97, dp: 538 },
  { p: 0.96, dp: 501 },
  { p: 0.95, dp: 470 },
  { p: 0.94, dp: 444 },
  { p: 0.93, dp: 422 },
  { p: 0.92, dp: 401 },
  { p: 0.91, dp: 383 },
  { p: 0.90, dp: 366 },
  { p: 0.89, dp: 351 },
  { p: 0.88, dp: 336 },
  { p: 0.87, dp: 322 },
  { p: 0.86, dp: 309 },
  { p: 0.85, dp: 296 },
  { p: 0.84, dp: 284 },
  { p: 0.83, dp: 273 },
  { p: 0.82, dp: 262 },
  { p: 0.81, dp: 251 },
  { p: 0.80, dp: 240 },
  { p: 0.79, dp: 230 },
  { p: 0.78, dp: 220 },
  { p: 0.77, dp: 211 },
  { p: 0.76, dp: 202 },
  { p: 0.75, dp: 193 },
  { p: 0.74, dp: 184 },
  { p: 0.73, dp: 175 },
  { p: 0.72, dp: 166 },
  { p: 0.71, dp: 158 },
  { p: 0.70, dp: 149 },
  { p: 0.69, dp: 141 },
  { p: 0.68, dp: 133 },
  { p: 0.67, dp: 125 },
  { p: 0.66, dp: 117 },
  { p: 0.65, dp: 110 },
  { p: 0.64, dp: 102 },
  { p: 0.63, dp: 95 },
  { p: 0.62, dp: 87 },
  { p: 0.61, dp: 80 },
  { p: 0.60, dp: 72 },
  { p: 0.59, dp: 65 },
  { p: 0.58, dp: 57 },
  { p: 0.57, dp: 50 },
  { p: 0.56, dp: 43 },
  { p: 0.55, dp: 36 },
  { p: 0.54, dp: 29 },
  { p: 0.53, dp: 22 },
  { p: 0.52, dp: 15 },
  { p: 0.51, dp: 7 },
  { p: 0.50, dp: 0 },
  { p: 0.49, dp: -7 },
  { p: 0.48, dp: -15 },
  { p: 0.47, dp: -22 },
  { p: 0.46, dp: -29 },
  { p: 0.45, dp: -36 },
  { p: 0.44, dp: -43 },
  { p: 0.43, dp: -50 },
  { p: 0.42, dp: -57 },
  { p: 0.41, dp: -65 },
  { p: 0.40, dp: -72 },
  { p: 0.39, dp: -80 },
  { p: 0.38, dp: -87 },
  { p: 0.37, dp: -95 },
  { p: 0.36, dp: -102 },
  { p: 0.35, dp: -110 },
  { p: 0.34, dp: -117 },
  { p: 0.33, dp: -125 },
  { p: 0.32, dp: -133 },
  { p: 0.31, dp: -141 },
  { p: 0.30, dp: -149 },
  { p: 0.29, dp: -158 },
  { p: 0.28, dp: -166 },
  { p: 0.27, dp: -175 },
  { p: 0.26, dp: -184 },
  { p: 0.25, dp: -193 },
  { p: 0.24, dp: -202 },
  { p: 0.23, dp: -211 },
  { p: 0.22, dp: -220 },
  { p: 0.21, dp: -230 },
  { p: 0.20, dp: -240 },
  { p: 0.19, dp: -251 },
  { p: 0.18, dp: -262 },
  { p: 0.17, dp: -273 },
  { p: 0.16, dp: -284 },
  { p: 0.15, dp: -296 },
  { p: 0.14, dp: -309 },
  { p: 0.13, dp: -322 },
  { p: 0.12, dp: -336 },
  { p: 0.11, dp: -351 },
  { p: 0.10, dp: -366 },
  { p: 0.09, dp: -383 },
  { p: 0.08, dp: -401 },
  { p: 0.07, dp: -422 },
  { p: 0.06, dp: -444 },
  { p: 0.05, dp: -470 },
  { p: 0.04, dp: -501 },
  { p: 0.03, dp: -538 },
  { p: 0.02, dp: -589 },
  { p: 0.01, dp: -677 },
  { p: 0.00, dp: -800 }
];

/**
 * Returns FIDE rating difference dp for a given score percentage p.
 */
export function lookupFideDp(p: number): number {
  // Bound p between 0 and 1
  const boundedP = Math.max(0, Math.min(1, p));
  
  // Find closest score percentage in FIDE dp table
  let closest = FIDE_DP_TABLE[0];
  let minDiff = Math.abs(closest.p - boundedP);

  for (const item of FIDE_DP_TABLE) {
    const diff = Math.abs(item.p - boundedP);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }

  return closest.dp;
}

/**
 * Computes rating performance (Rp).
 * Formula: Rp = Ra + dp
 * Ra = average rating of opponents
 * dp = FIDE table lookup for score / games
 */
export function calculatePerformanceRating(
  playerRating: number,
  opponentRatings: number[],
  score: number
): number {
  if (opponentRatings.length === 0) {
    return playerRating;
  }

  // Handle unrated opponents by replacing them with provisional rating (1200)
  const cleanedRatings = opponentRatings.map(
    (r) => (r <= 0 ? FIDE_RULES.UNRATED_PROVISIONAL_RATING : r)
  );

  const sum = cleanedRatings.reduce((a, b) => a + b, 0);
  const Ra = sum / cleanedRatings.length;
  
  const p = score / cleanedRatings.length;
  const dp = lookupFideDp(p);

  return Math.round(Ra + dp);
}
