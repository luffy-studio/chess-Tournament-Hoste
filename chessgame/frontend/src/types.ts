// Type definitions for Chess Tournament Platform aligned with Backend and FIDE Engine

export type UserRole = "admin" | "participant";

export type Result = "W" | "D" | "L" | null;

export type Match = {
  id: any;
  tournamentId?: string;
  round?: number;
  board?: number;
  whiteId: any;
  blackId: any;
  result: Result;
  isManual?: boolean;
};

export type Standing = {
  id: any;
  name?: string;
  score: number;
  rating?: number;
  nationalRating?: number | null;
  title?: string | null;
  isUnrated?: boolean;
  rank?: number;
  buchholz?: number;
  medianBuchholz?: number;
  cut1Buchholz?: number;
  sonnebornBerger?: number;
  progressiveScore?: number;
  mostWins?: number;
  mostWinsBlack?: number;
  performanceRating?: number;
};

export type Participant = {
  id: any;
  tournamentId?: string;
  name: string;
  score?: number;
  rating?: number;
  nationalRating?: number | null;
  title?: string | null;
  isUnrated?: boolean;
};

export type Mode = "swiss" | "roundrobin" | "SWISS" | "ROUND_ROBIN";

export type Tournament = {
  id: string;
  name: string;
  mode: Mode;
  status: "setup" | "ongoing" | "completed" | "paused" | "ACTIVE" | "COMPLETED";
  currentRound: number;
  roundsPlanned: number;
  byePoints: number;
  timeControl?: string;
  venue?: string;
  description?: string;
  winnerName?: string | null;
  holdName?: string | null;
  participants: Participant[];
  matches: Match[];
  announcements?: any[];
  settings?: any;
};

export const BYE_ID: any = "BYE";


