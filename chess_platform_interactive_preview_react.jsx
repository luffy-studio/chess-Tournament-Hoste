// import React, { useMemo, useState } from "react";
// import { Trophy, Plus, Shuffle, ArrowRight, Crown, Users2 } from "lucide-react";

// // Basic interactive preview of the tournament platform UI
// // TailwindCSS expected. Default export a single component (per canvas guidelines).

// // ---------------- Types ----------------

// type Result = "W" | "D" | "L" | null;

// type Match = {
//   id: number;
//   board: number;
//   whiteId: number; // -1 can be BYE
//   blackId: number; // -1 can be BYE
//   result: Result; // user-entered for real games; BYE is awarded automatically
// };

// type Standing = { id: number; score: number };

// type Participant = { id: number; name: string };

// type Mode = "swiss" | "roundrobin";

// const BYE_ID = -1;

// // ---------------- Utilities ----------------

// function shuffle<T>(arr: T[]) {
//   const copy = arr.slice();
//   for (let i = copy.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [copy[i], copy[j]] = [copy[j], copy[i]];
//   }
//   return copy;
// }

// function nameOf(id: number, players: Participant[]) {
//   if (id === BYE_ID) return "BYE";
//   return players.find((p) => p.id === id)?.name || "?";
// }

// // CSV helpers
// function csvEscape(v: unknown): string {
//   const s = String(v ?? "");
//   if (/[",\n]/.test(s)) {
//     return '"' + s.replace(/"/g, '""') + '"';
//   }
//   return s;
// }
// function rowsToCSV(rows: (string | number)[][]): string {
//   return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
// }
// function downloadCSV(filename: string, csv: string) {
//   const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
//   URL.revokeObjectURL(url);
// }

// // ---------------- Scoring ----------------

// function useScores(pairings: Match[], players: Participant[], byePoints: number) {
//   // compute totals: win=1, draw=0.5, loss=0 + BYE points
//   return useMemo<Standing[]>(() => {
//     const totals = new Map<number, number>();
//     players.forEach((p) => totals.set(p.id, 0));

//     pairings.forEach((m) => {
//       // BYE handling (auto-award)
//       if (m.whiteId === BYE_ID && m.blackId !== BYE_ID) {
//         totals.set(m.blackId, (totals.get(m.blackId) || 0) + byePoints);
//         return;
//       }
//       if (m.blackId === BYE_ID && m.whiteId !== BYE_ID) {
//         totals.set(m.whiteId, (totals.get(m.whiteId) || 0) + byePoints);
//         return;
//       }
//       // Normal results
//       if (m.result === "W") {
//         totals.set(m.whiteId, (totals.get(m.whiteId) || 0) + 1);
//       } else if (m.result === "L") {
//         totals.set(m.blackId, (totals.get(m.blackId) || 0) + 1);
//       } else if (m.result === "D") {
//         totals.set(m.whiteId, (totals.get(m.whiteId) || 0) + 0.5);
//         totals.set(m.blackId, (totals.get(m.blackId) || 0) + 0.5);
//       }
//     });

//     return Array.from(totals.entries())
//       .map(([id, score]) => ({ id, score }))
//       .sort((a, b) => b.score - a.score || a.id - b.id);
//   }, [pairings, players, byePoints]);
// }

// // ---------------- Pairing Logic ----------------

// /**
//  * Build Swiss-ish pairs from standings: players with same score get bracketed together.
//  * Inside each bracket we shuffle, and if odd-sized, we float the last player down.
//  * Returns a list of pairs; BYE produced only if total count is odd.
//  */
// export function buildScoreBracketPairsFromStandings(standings: Standing[], playerCount: number) {
//   const byScore = new Map<number, number[]>();
//   standings.forEach(({ id, score }) => {
//     const key = Math.round(score * 2) / 2; // keep .0 / .5 steps
//     if (!byScore.has(key)) byScore.set(key, []);
//     byScore.get(key)!.push(id);
//   });

//   const bracketKeys = Array.from(byScore.keys()).sort((a, b) => b - a);

//   const orderedPairs: { a: number; b: number }[] = [];
//   let carry: number | null = null;

//   for (const key of bracketKeys) {
//     const bucket = shuffle(byScore.get(key)!);

//     const work = carry !== null ? [carry, ...bucket] : bucket.slice();
//     carry = null;

//     for (let i = 0; i < work.length; i += 2) {
//       if (i + 1 < work.length) {
//         orderedPairs.push({ a: work[i], b: work[i + 1] });
//       } else {
//         carry = work[i];
//       }
//     }
//   }

//   // Remaining carry -> BYE if odd field size
//   if (carry !== null && playerCount % 2 === 1) {
//     orderedPairs.push({ a: carry, b: BYE_ID });
//     carry = null;
//   }

//   return orderedPairs;
// }

// /** Round-robin (circle method): returns array of rounds, each a list of [a,b] ids. */
// function roundRobinSchedule(playerIds: number[]): number[][][] {
//   const ids = playerIds.slice();
//   const hadBye = ids.length % 2 === 1;
//   if (hadBye) ids.push(BYE_ID);

//   const n = ids.length;
//   const rounds: number[][][] = [];
//   const half = n / 2;

//   for (let r = 0; r < n - 1; r++) {
//     const pairs: number[][] = [];
//     const seen = new Set<number>();
//     for (let i = 0; i < half; i++) {
//       const a = ids[i];
//       const b = ids[n - 1 - i];
//       if (a === b) throw new Error("Round-robin self-pair detected");
//       if (seen.has(a) || seen.has(b)) throw new Error("Round-robin duplicate in same round");
//       seen.add(a); seen.add(b);
//       pairs.push([a, b]);
//     }
//     rounds.push(pairs);
//     // rotate keeping first fixed
//     const fixed = ids[0];
//     const rest = ids.slice(1);
//     rest.unshift(rest.pop()!);
//     ids.splice(0, ids.length, fixed, ...rest);
//   }

//   return rounds;
// }

// // ---------------- UI Components ----------------

// function ScoreToggle({ value, onChange }: { value: Result; onChange: (v: Exclude<Result, null>) => void }) {
//   return (
//     <div className="inline-flex rounded-2xl shadow-sm overflow-hidden border">
//       <button
//         type="button"
//         className={`px-3 py-1 text-sm font-medium ${value === "W" ? "bg-black text-white" : "bg-white"}`}
//         onClick={() => onChange("W")}
//       >
//         A wins (1–0)
//       </button>
//       <button
//         type="button"
//         className={`px-3 py-1 text-sm font-medium ${value === "D" ? "bg-black text-white" : "bg-white"}`}
//         onClick={() => onChange("D")}
//       >
//         Draw (0.5–0.5)
//       </button>
//       <button
//         type="button"
//         className={`px-3 py-1 text-sm font-medium ${value === "L" ? "bg-black text-white" : "bg-white"}`}
//         onClick={() => onChange("L")}
//       >
//         B wins (0–1)
//       </button>
//     </div>
//   );
// }

// // ---------- DEV TESTS (non-blocking) ----------
// (function DEV_TESTS() {
//   try {
//     // Test 1: simple two brackets [1,1,0,0] -> 2 pairs
//     const st1: Standing[] = [
//       { id: 1, score: 1 },
//       { id: 2, score: 1 },
//       { id: 3, score: 0 },
//       { id: 4, score: 0 },
//     ];
//     const p1 = buildScoreBracketPairsFromStandings(st1, 4);
//     console.assert(p1.length === 2, "Test1: expected 2 pairs");

//     // Test 2: odd top bracket [1,1,1,0,0,0] -> 3 pairs, float handled, even -> no BYE
//     const st2: Standing[] = [
//       { id: 1, score: 1 },
//       { id: 2, score: 1 },
//       { id: 3, score: 1 },
//       { id: 4, score: 0 },
//       { id: 5, score: 0 },
//       { id: 6, score: 0 },
//     ];
//     const p2 = buildScoreBracketPairsFromStandings(st2, 6);
//     console.assert(p2.length === 3, "Test2: expected 3 pairs with float inside bracket");
//     console.assert(!p2.some((x) => x.a === x.b), "Test2b: no self-pairing");

//     // Test 3: odd field -> BYE must exist
//     const st3: Standing[] = [
//       { id: 1, score: 0.5 },
//       { id: 2, score: 0.5 },
//       { id: 3, score: 0.5 },
//     ];
//     const p3 = buildScoreBracketPairsFromStandings(st3, 3);
//     console.assert(p3.some((x) => x.a === BYE_ID || x.b === BYE_ID), "Test3: expected a BYE pair");

//     // Test 4: Round-robin 5 players -> 6 with BYE -> 5 rounds, 3 matches each
//     const rr5 = roundRobinSchedule([1, 2, 3, 4, 5]);
//     console.assert(rr5.length === 5, "Test4: RR rounds should equal players with BYE");
//     console.assert(rr5[0].length === 3, "Test4b: Each RR round has floor(n/2) matches");

//     // Test 5: Round-robin 4 players -> 3 rounds, 2 matches each, no BYE
//     const rr4 = roundRobinSchedule([1, 2, 3, 4]);
//     console.assert(rr4.length === 3, "Test5: RR(4) should be 3 rounds");
//     console.assert(rr4.every((r) => r.length === 2), "Test5b: RR(4) each round has 2 matches");

//     // Test 6: CSV escaping (quotes, commas, newlines)
//     const csv = rowsToCSV([["a,b", '"q"', "line\nwrap"]]);
//     console.assert(csv.includes('"a,b"') && csv.includes('""q""') && csv.includes('"line\nwrap"'), "Test6: CSV escaping works");
//   } catch (e) {
//     console.warn("DEV_TESTS error:", e);
//   }
// })();

// // ---------------- UI ----------------

// export default function App() {
//   // Setup state
//   const [mode, setMode] = useState<Mode>("swiss");
//   const [namesText, setNamesText] = useState("Aditi\nBhavesh\nChirag\nDiya\nEshan\nFiza\nGautam\nHimani");
//   const [byePoints, setByePoints] = useState<number>(1);
//   const [roundsPlanned, setRoundsPlanned] = useState<number>(3);

//   // Runtime state
//   const [players, setPlayers] = useState<Participant[] | null>(null);
//   const [pairings, setPairings] = useState<Match[]>([]);
//   const [currentRound, setCurrentRound] = useState<number>(1); // 1-based UI

//   const matchesPerRound = useMemo(() => (players ? Math.floor(players.length / 2) : 0), [players]);

//   const standings = useScores(pairings, players ?? [], byePoints);

//   function startTournament() {
//     const lines = namesText
//       .split(/\r?\n/)
//       .map((s) => s.trim())
//       .filter(Boolean);

//     const unique = Array.from(new Set(lines));
//     const initialPlayers: Participant[] = unique.map((name, idx) => ({ id: idx + 1, name }));

//     // if round-robin and odd count, add BYE as a phantom player for schedule
//     const rrPlayers = mode === "roundrobin" && initialPlayers.length % 2 === 1
//       ? [...initialPlayers, { id: BYE_ID, name: "BYE" }]
//       : initialPlayers;

//     setPlayers(rrPlayers);
//     setCurrentRound(1);

//     if (mode === "roundrobin") {
//       const ids = rrPlayers.map((p) => p.id);
//       const rrs = roundRobinSchedule(ids);
//       // flatten into Match[] with round chunks
//       const all: Match[] = [];
//       let id = 100;
//       rrs.forEach((pairs) => {
//         pairs.forEach((pair, i) => {
//           all.push({
//             id: id++,
//             board: i + 1,
//             whiteId: pair[0],
//             blackId: pair[1],
//             result: null,
//           });
//         });
//       });
//       setPairings(all);
//       setRoundsPlanned(rrs.length);
//     } else {
//       // swiss: create random first round pairs
//       const ids = shuffle(initialPlayers.map((p) => p.id));
//       // add BYE as last if odd
//       if (ids.length % 2 === 1) ids.push(BYE_ID);
//       const first: Match[] = [];
//       let id = 100;
//       for (let i = 0; i < ids.length; i += 2) {
//         first.push({ id: id++, board: i / 2 + 1, whiteId: ids[i], blackId: ids[i + 1], result: null });
//       }
//       setPairings(first);
//       // default planned rounds: ceil(log2(n)) + 1 fallback
//       const suggested = Math.max(1, Math.ceil(Math.log2(Math.max(2, initialPlayers.length))) + 1);
//       if (!roundsPlanned) setRoundsPlanned(suggested);
//     }
//   }

//   const nextRoundSwiss = () => {
//     if (!players) return;
//     const pairs = buildScoreBracketPairsFromStandings(standings, players.length);
//     const startId = pairings.length ? pairings[pairings.length - 1].id + 1 : 200;
//     const newPairings: Match[] = pairs.map((p, idx) => ({
//       id: startId + idx,
//       board: idx + 1,
//       whiteId: idx % 2 === 0 ? p.a : p.b,
//       blackId: idx % 2 === 0 ? p.b : p.a,
//       result: null,
//     }));

//     setPairings((old) => [...old, ...newPairings]);
//     setCurrentRound((r) => r + 1);
//   };

//   // split pairings into rounds based on matchesPerRound
//   const rounds = useMemo(() => {
//     const chunks: { round: number; matches: Match[] }[] = [];
//     if (!matchesPerRound || pairings.length === 0) return chunks;
//     for (let i = 0, r = 1; i < pairings.length; i += matchesPerRound, r++) {
//       chunks.push({ round: r, matches: pairings.slice(i, i + matchesPerRound) });
//     }
//     return chunks;
//   }, [pairings, matchesPerRound]);

//   const updateResult = (id: number, result: Exclude<Result, null>) => {
//     setPairings((ps) => ps.map((m) => (m.id === id ? { ...m, result } : m)));
//   };

//   // --------- Exports ---------
//   const exportResultsCSV = () => {
//     if (!players) return;
//     const header = ["round", "board", "white_name", "black_name", "white_id", "black_id", "result"];
//     const rows: (string | number)[][] = [header];
//     rounds.forEach((chunk) => {
//       chunk.matches.forEach((m) => {
//         let result: string = "";
//         if (m.whiteId === BYE_ID || m.blackId === BYE_ID) result = `BYE(${m.whiteId === BYE_ID ? m.blackId : m.whiteId})`;
//         else if (m.result === "W") result = "1-0";
//         else if (m.result === "L") result = "0-1";
//         else if (m.result === "D") result = "0.5-0.5";
//         rows.push([
//           chunk.round,
//           m.board,
//           nameOf(m.whiteId, players),
//           nameOf(m.blackId, players),
//           m.whiteId,
//           m.blackId,
//           result,
//         ]);
//       });
//     });
//     downloadCSV("results.csv", rowsToCSV(rows));
//   };

//   const exportStandingsCSV = () => {
//     if (!players) return;
//     const header = ["rank", "participant_id", "participant", "score"];
//     const rows: (string | number)[][] = [header];
//     standings
//       .filter((s) => s.id !== BYE_ID)
//       .forEach((s, i) => rows.push([i + 1, s.id, nameOf(s.id, players), s.score.toFixed(1)]));
//     downloadCSV("standings.csv", rowsToCSV(rows));
//   };

//   const exportBoardsCSV = () => {
//     if (!players) return;
//     const realPlayers = players.filter((p) => p.id !== BYE_ID);
//     const header = ["participant_id", "participant", ...rounds.map((r) => `Round ${r.round}`)];
//     const boardMap = new Map<number, (string | number)[]>();
//     realPlayers.forEach((p) => boardMap.set(p.id, [p.id, p.name, ...new Array(rounds.length).fill("")]));

//     rounds.forEach((chunk, rIdx) => {
//       chunk.matches.forEach((m) => {
//         const boardLabel = m.whiteId === BYE_ID || m.blackId === BYE_ID ? "BYE" : String(m.board);
//         if (m.whiteId !== BYE_ID && boardMap.has(m.whiteId)) boardMap.get(m.whiteId)![2 + rIdx] = boardLabel;
//         if (m.blackId !== BYE_ID && boardMap.has(m.blackId)) boardMap.get(m.blackId)![2 + rIdx] = boardLabel;
//       });
//     });

//     const rows: (string | number)[][] = [header, ...Array.from(boardMap.values())];
//     downloadCSV("boards_by_round.csv", rowsToCSV(rows));
//   };

//   // ---------------- Render ----------------

//   const participantsCount = players?.filter((p) => p.id !== BYE_ID).length ?? 0;

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white p-6">
//       <div className="mx-auto max-w-6xl space-y-6">
//         {/* Header */}
//         <header className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <Crown className="h-8 w-8" />
//             <div>
//               <h1 className="text-2xl font-semibold tracking-tight">Royal Chess Championship (Preview)</h1>
//               <p className="text-sm text-zinc-600">Offline-friendly score entry • Player input • Auto-pairing ({mode === "swiss" ? "Swiss" : "Round-robin"})</p>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <button className="rounded-2xl border px-3 py-2 text-sm font-medium hover:shadow" onClick={() => setPlayers(null)}>
//               New Tournament <Plus className="ml-1 inline h-4 w-4" />
//             </button>
//           </div>
//         </header>

//         {/* Setup Wizard */}
//         {!players && (
//           <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
//             <div className="md:col-span-2 rounded-2xl border bg-white p-4">
//               <h2 className="text-lg font-semibold mb-2">Participants</h2>
//               <p className="text-sm text-zinc-600 mb-2">Enter one name per line. We'll set opponents and rounds automatically.</p>
//               <textarea
//                 className="h-48 w-full rounded-xl border p-3 focus:outline-none"
//                 value={namesText}
//                 onChange={(e) => setNamesText(e.target.value)}
//                 placeholder="One name per line"
//               />
//             </div>
//             <div className="space-y-3">
//               <div className="rounded-2xl border bg-white p-4">
//                 <label className="text-sm text-zinc-700">Format</label>
//                 <select
//                   className="mt-1 w-full rounded-xl border p-2"
//                   value={mode}
//                   onChange={(e) => setMode(e.target.value as Mode)}
//                 >
//                   <option value="swiss">Swiss (pair by score each round)</option>
//                   <option value="roundrobin">Round-robin (all rounds pre-set)</option>
//                 </select>
//               </div>
//               <div className="rounded-2xl border bg-white p-4">
//                 <label className="text-sm text-zinc-700">Planned Rounds {mode === "roundrobin" && <span className="text-xs text-zinc-500">(auto for RR)</span>}</label>
//                 <input
//                   type="number"
//                   min={1}
//                   className="mt-1 w-full rounded-xl border p-2"
//                   value={roundsPlanned}
//                   onChange={(e) => setRoundsPlanned(parseInt(e.target.value || "1", 10))}
//                   disabled={mode === "roundrobin"}
//                 />
//               </div>
//               <div className="rounded-2xl border bg-white p-4">
//                 <label className="text-sm text-zinc-700">Bye Points</label>
//                 <select className="mt-1 w-full rounded-xl border p-2" value={byePoints} onChange={(e) => setByePoints(parseFloat(e.target.value))}>
//                   <option value={1}>1.0 (full point)</option>
//                   <option value={0.5}>0.5</option>
//                   <option value={0}>0</option>
//                 </select>
//               </div>
//               <button onClick={startTournament} className="w-full rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">
//                 Start Tournament
//               </button>
//             </div>
//           </section>
//         )}

//         {/* Top summary cards */}
//         {players && (
//           <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
//             <div className="rounded-2xl border bg-white p-4 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-zinc-600">Round</span>
//                 <Shuffle className="h-4 w-4" />
//               </div>
//               <div className="mt-2 text-3xl font-semibold">{currentRound}</div>
//               <p className="text-xs text-zinc-500">{mode === "swiss" ? "Pair next round from standings" : "Navigate through pre-set rounds"}</p>
//             </div>
//             <div className="rounded-2xl border bg-white p-4 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-zinc-600">Participants</span>
//                 <Users2 className="h-4 w-4" />
//               </div>
//               <div className="mt-2 text-3xl font-semibold">{participantsCount}</div>
//               <p className="text-xs text-zinc-500">BYE handled automatically if odd</p>
//             </div>
//             <div className="rounded-2xl border bg-white p-4 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-zinc-600">Leader</span>
//                 <Trophy className="h-4 w-4" />
//               </div>
//               <div className="mt-2 text-3xl font-semibold">{nameOf(standings[0]?.id ?? (players[0]?.id ?? 0), players)}</div>
//               <p className="text-xs text-zinc-500">Tie-breakers later; preview totals only</p>
//             </div>
//           </section>
//         )}

//         {/* Controls for rounds navigation / generation */}
//         {players && (
//           <div className="flex items-center justify-between">
//             <div className="text-sm text-zinc-600">Mode: <span className="font-medium uppercase">{mode}</span></div>
//             {mode === "swiss" ? (
//               <button onClick={nextRoundSwiss} className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">
//                 Generate Next Round <ArrowRight className="ml-1 inline h-4 w-4" />
//               </button>
//             ) : (
//               <div className="space-x-2">
//                 <button
//                   className="rounded-2xl border px-3 py-2 text-sm font-medium"
//                   onClick={() => setCurrentRound((r) => Math.max(1, r - 1))}
//                 >
//                   Prev
//                 </button>
//                 <button
//                   className="rounded-2xl border px-3 py-2 text-sm font-medium"
//                   onClick={() => setCurrentRound((r) => Math.min(rounds.length, r + 1))}
//                 >
//                   Next
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Pairings + Fast Score Entry */}
//         {players && (
//           <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
//             <div className="md:col-span-2 space-y-4">
//               <div className="rounded-2xl border bg-white p-2">
//                 <div className="grid grid-cols-12 items-center gap-2 border-b px-3 py-2 text-xs font-medium text-zinc-600">
//                   <div className="col-span-1">Board</div>
//                   <div className="col-span-3">Participant A (White)</div>
//                   <div className="col-span-4">Score</div>
//                   <div className="col-span-3">Participant B (Black)</div>
//                   <div className="col-span-1 text-center">Save</div>
//                 </div>

//                 {rounds[currentRound - 1]?.matches.map((m) => (
//                   <div key={m.id} className="grid grid-cols-12 items-center gap-2 px-3 py-3 hover:bg-zinc-50">
//                     <div className="col-span-1 font-semibold">{m.board}</div>
//                     <div className="col-span-3 truncate">{nameOf(m.whiteId, players)}</div>
//                     <div className="col-span-4">
//                       {m.whiteId === BYE_ID || m.blackId === BYE_ID ? (
//                         <div className="text-xs text-zinc-600">BYE (auto {byePoints})</div>
//                       ) : (
//                         <ScoreToggle value={m.result} onChange={(v) => updateResult(m.id, v)} />
//                       )}
//                     </div>
//                     <div className="col-span-3 truncate">{nameOf(m.blackId, players)}</div>
//                     <div className="col-span-1 text-center">
//                       <button className="rounded-xl border px-3 py-1 text-xs font-medium">OK</button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Standings */}
//             <div className="space-y-3">
//               <h2 className="text-lg font-semibold">Standings (Carry-forward)</h2>
//               <div className="rounded-2xl border bg-white">
//                 <table className="w-full text-sm">
//                   <thead>
//                     <tr className="border-b text-left text-zinc-600">
//                       <th className="px-3 py-2">#</th>
//                       <th className="px-3 py-2">Participant</th>
//                       <th className="px-3 py-2">Score</th>
//                       <th className="px-3 py-2">Wins</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {standings
//                       .filter((s) => s.id !== BYE_ID)
//                       .map((s, i) => {
//                         const wins = pairings.filter((m) =>
//                           (m.result === "W" && m.whiteId === s.id) || (m.result === "L" && m.blackId === s.id)
//                         ).length;
//                         return (
//                           <tr key={s.id} className="border-b last:border-none">
//                             <td className="px-3 py-2">{i + 1}</td>
//                             <td className="px-3 py-2">{nameOf(s.id, players)}</td>
//                             <td className="px-3 py-2 font-semibold">{s.score.toFixed(1)}</td>
//                             <td className="px-3 py-2">{wins}</td>
//                           </tr>
//                         );
//                       })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Footer bar */}
//         <footer className="mt-6 flex items-center justify-between rounded-2xl border bg-white p-3 text-sm text-zinc-600">
//           <div>Scoring: Win = 1, Draw = 0.5, Loss = 0 • BYE = {byePoints}</div>
//           <div className="space-x-2">
//             <button className="rounded-2xl border px-3 py-2 font-medium" onClick={exportResultsCSV}>Export Results CSV</button>
//             <button className="rounded-2xl border px-3 py-2 font-medium" onClick={exportStandingsCSV}>Export Standings CSV</button>
//             <button className="rounded-2xl border px-3 py-2 font-medium" onClick={exportBoardsCSV}>Export Boards CSV</button>
//           </div>
//         </footer>
//       </div>
//     </div>
//   );
// }
