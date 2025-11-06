// Type definitions for Chess Tournament Platform

export type UserRole = "admin" | "participant";

export type Result = "W" | "D" | "L" | null;

export type Match = {
  id: number;
  board: number;
  whiteId: number; // -1 can be BYE
  blackId: number; // -1 can be BYE
  result: Result;
};

export type Standing = { 
  id: number; 
  score: number 
};

export type Participant = { 
  id: number; 
  name: string 
};

export type Mode = "swiss" | "roundrobin";

export const BYE_ID = -1;
