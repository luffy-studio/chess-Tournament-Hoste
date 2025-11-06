import React, { useMemo, useState } from "react";
import { Trophy, Shuffle, ArrowRight, Users2, Eye } from "lucide-react";

// Types and utilities
import { UserRole, Mode, Match, Participant, Standing, BYE_ID } from "./types";
import { 
  shuffle, 
  nameOf, 
  buildScoreBracketPairsFromStandings, 
  roundRobinSchedule 
} from "./utils/tournamentUtils";
import { downloadCSV, rowsToCSV } from "./utils/csvUtils";

// Components
import { LoginModal } from "./components/LoginModal";
import { Header } from "./components/Header";
import { ScoreToggle } from "./components/ScoreToggle";
import { OnHoldDisplay } from "./components/OnHoldDisplay";

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "chess2025"
};

// Scoring hook
function useScores(pairings: Match[], players: Participant[], byePoints: number): Standing[] {
  return useMemo<Standing[]>(() => {
    const totals = new Map<number, number>();
    players.forEach((p) => totals.set(p.id, 0));

    pairings.forEach((m) => {
      // BYE handling
      if (m.whiteId === BYE_ID && m.blackId !== BYE_ID) {
        totals.set(m.blackId, (totals.get(m.blackId) || 0) + byePoints);
        return;
      }
      if (m.blackId === BYE_ID && m.whiteId !== BYE_ID) {
        totals.set(m.whiteId, (totals.get(m.whiteId) || 0) + byePoints);
        return;
      }
      // Normal results
      if (m.result === "W") {
        totals.set(m.whiteId, (totals.get(m.whiteId) || 0) + 1);
      } else if (m.result === "L") {
        totals.set(m.blackId, (totals.get(m.blackId) || 0) + 1);
      } else if (m.result === "D") {
        totals.set(m.whiteId, (totals.get(m.whiteId) || 0) + 0.5);
        totals.set(m.blackId, (totals.get(m.blackId) || 0) + 0.5);
      }
    });

    return Array.from(totals.entries())
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score || a.id - b.id);
  }, [pairings, players, byePoints]);
}

export default function ChessTournament() {
  // Authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  
  // User role state
  const [userRole, setUserRole] = useState<UserRole>("participant");
  
  // Setup state
  const [mode, setMode] = useState<Mode>("swiss");
  const [namesText, setNamesText] = useState("Aditi\nBhavesh\nChirag\nDiya\nEshan\nFiza\nGautam\nHimani");
  const [byePoints, setByePoints] = useState<number>(1);
  const [roundsPlanned, setRoundsPlanned] = useState<number>(3);
  const [holdName, setHoldName] = useState<string>("");

  // Runtime state
  const [players, setPlayers] = useState<Participant[] | null>(null);
  const [pairings, setPairings] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);

  const matchesPerRound = useMemo(() => (players ? Math.floor(players.length / 2) : 0), [players]);
  const standings = useScores(pairings, players ?? [], byePoints);

  // Authentication handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === ADMIN_CREDENTIALS.username && loginPassword === ADMIN_CREDENTIALS.password) {
      setIsAdminAuthenticated(true);
      setUserRole("admin");
      setLoginError("");
      setLoginPassword("");
    } else {
      setLoginError("Invalid username or password");
      setLoginPassword("");
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setUserRole("participant");
    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
  };

  const handleRoleChange = (role: UserRole) => {
    if (role === "admin" && !isAdminAuthenticated) {
      setUserRole("admin");
      return;
    }
    setUserRole(role);
  };

  // Hold name management
  const handleMoveLastToHold = () => {
    const lines = namesText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const unique = Array.from(new Set(lines));
    if (unique.length % 2 === 1) {
      const lastPerson = unique[unique.length - 1];
      const remaining = unique.slice(0, -1);
      setHoldName(lastPerson);
      setNamesText(remaining.join("\n"));
    }
  };

  const handleAddHoldBack = () => {
    if (holdName) {
      setNamesText(namesText ? namesText + "\n" + holdName : holdName);
      setHoldName("");
    }
  };

  // Tournament functions
  function startTournament() {
    const lines = namesText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const unique = Array.from(new Set(lines));
    const initialPlayers: Participant[] = unique.map((name, idx) => ({ id: idx + 1, name }));

    const rrPlayers = mode === "roundrobin" && initialPlayers.length % 2 === 1
      ? [...initialPlayers, { id: BYE_ID, name: "BYE" }]
      : initialPlayers;

    setPlayers(rrPlayers);
    setCurrentRound(1);

    if (mode === "roundrobin") {
      const ids = rrPlayers.map((p) => p.id);
      const rrs = roundRobinSchedule(ids);
      const all: Match[] = [];
      let id = 100;
      rrs.forEach((pairs) => {
        pairs.forEach((pair, i) => {
          all.push({ id: id++, board: i + 1, whiteId: pair[0], blackId: pair[1], result: null });
        });
      });
      setPairings(all);
      setRoundsPlanned(rrs.length);
    } else {
      const ids = shuffle(initialPlayers.map((p) => p.id));
      if (ids.length % 2 === 1) ids.push(BYE_ID);
      const first: Match[] = [];
      let id = 100;
      for (let i = 0; i < ids.length; i += 2) {
        first.push({ id: id++, board: i / 2 + 1, whiteId: ids[i], blackId: ids[i + 1], result: null });
      }
      setPairings(first);
      const suggested = Math.max(1, Math.ceil(Math.log2(Math.max(2, initialPlayers.length))) + 1);
      if (!roundsPlanned) setRoundsPlanned(suggested);
    }
  }

  const nextRoundSwiss = () => {
    if (!players) return;
    const pairs = buildScoreBracketPairsFromStandings(standings, players.length);
    const startId = pairings.length ? pairings[pairings.length - 1].id + 1 : 200;
    const newPairings: Match[] = pairs.map((p, idx) => ({
      id: startId + idx,
      board: idx + 1,
      whiteId: idx % 2 === 0 ? p.a : p.b,
      blackId: idx % 2 === 0 ? p.b : p.a,
      result: null,
    }));
    setPairings((old) => [...old, ...newPairings]);
    setCurrentRound((r) => r + 1);
  };

  const rounds = useMemo(() => {
    const chunks: { round: number; matches: Match[] }[] = [];
    if (!matchesPerRound || pairings.length === 0) return chunks;
    for (let i = 0, r = 1; i < pairings.length; i += matchesPerRound, r++) {
      chunks.push({ round: r, matches: pairings.slice(i, i + matchesPerRound) });
    }
    return chunks;
  }, [pairings, matchesPerRound]);

  const updateResult = (id: number, result: Exclude<Match["result"], null>) => {
    setPairings((ps) => ps.map((m) => (m.id === id ? { ...m, result } : m)));
  };

  // Export functions
  const exportResultsCSV = () => {
    if (!players) return;
    const header = ["round", "board", "white_name", "black_name", "white_id", "black_id", "result"];
    const rows: (string | number)[][] = [header];
    rounds.forEach((chunk) => {
      chunk.matches.forEach((m) => {
        let result: string = "";
        if (m.whiteId === BYE_ID || m.blackId === BYE_ID) 
          result = `BYE(${m.whiteId === BYE_ID ? m.blackId : m.whiteId})`;
        else if (m.result === "W") result = "1-0";
        else if (m.result === "L") result = "0-1";
        else if (m.result === "D") result = "0.5-0.5";
        rows.push([
          chunk.round, m.board,
          nameOf(m.whiteId, players), nameOf(m.blackId, players),
          m.whiteId, m.blackId, result,
        ]);
      });
    });
    downloadCSV("results.csv", rowsToCSV(rows));
  };

  const exportStandingsCSV = () => {
    if (!players) return;
    const header = ["rank", "participant_id", "participant", "score"];
    const rows: (string | number)[][] = [header];
    standings
      .filter((s) => s.id !== BYE_ID)
      .forEach((s, i) => rows.push([i + 1, s.id, nameOf(s.id, players), s.score.toFixed(1)]));
    downloadCSV("standings.csv", rowsToCSV(rows));
  };

  const exportBoardsCSV = () => {
    if (!players) return;
    const realPlayers = players.filter((p) => p.id !== BYE_ID);
    const header = ["participant_id", "participant", ...rounds.map((r) => `Round ${r.round}`)];
    const boardMap = new Map<number, (string | number)[]>();
    realPlayers.forEach((p) => boardMap.set(p.id, [p.id, p.name, ...new Array(rounds.length).fill("")]));

    rounds.forEach((chunk, rIdx) => {
      chunk.matches.forEach((m) => {
        const boardLabel = m.whiteId === BYE_ID || m.blackId === BYE_ID ? "BYE" : String(m.board);
        if (m.whiteId !== BYE_ID && boardMap.has(m.whiteId)) 
          boardMap.get(m.whiteId)![2 + rIdx] = boardLabel;
        if (m.blackId !== BYE_ID && boardMap.has(m.blackId)) 
          boardMap.get(m.blackId)![2 + rIdx] = boardLabel;
      });
    });

    const rows: (string | number)[][] = [header, ...Array.from(boardMap.values())];
    downloadCSV("boards_by_round.csv", rowsToCSV(rows));
  };

  const participantsCount = players?.filter((p) => p.id !== BYE_ID).length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Login Modal */}
        {!isAdminAuthenticated && userRole === "admin" && (
          <LoginModal
            username={loginUsername}
            password={loginPassword}
            error={loginError}
            onUsernameChange={setLoginUsername}
            onPasswordChange={setLoginPassword}
            onSubmit={handleLogin}
            onCancel={() => setUserRole("participant")}
          />
        )}

        {/* Header */}
        <Header
          userRole={userRole}
          isAdminAuthenticated={isAdminAuthenticated}
          mode={mode}
          hasPlayers={!!players}
          onRoleChange={handleRoleChange}
          onNewTournament={() => setPlayers(null)}
          onLogout={handleLogout}
        />

        {/* Setup Wizard - Admin Only */}
        {!players && userRole === "admin" && isAdminAuthenticated && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2 rounded-2xl border bg-white p-4">
              <h2 className="text-lg font-semibold mb-2">Participants</h2>
              <p className="text-sm text-zinc-600 mb-2">Enter one name per line. We'll set opponents and rounds automatically.</p>
              <textarea
                className="h-48 w-full rounded-xl border p-3 focus:outline-none"
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                placeholder="One name per line"
              />
              {(() => {
                const uniqueList = Array.from(
                  new Set(
                    namesText
                      .split(/\r?\n/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                );
                const isOdd = uniqueList.length % 2 === 1;
                const oddCandidate = isOdd ? uniqueList[uniqueList.length - 1] : '';

                return (isOdd || holdName) ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {isOdd && !holdName && (
                      <div className="rounded-xl border bg-zinc-50 p-3">
                        <div className="text-sm font-medium">Unpaired (odd count)</div>
                        <div className="mt-1 text-sm text-zinc-700 truncate">{oddCandidate}</div>
                        <button
                          className="mt-2 rounded-xl border px-3 py-1 text-xs font-medium hover:bg-zinc-100"
                          onClick={handleMoveLastToHold}
                        >
                          Move to Hold
                        </button>
                      </div>
                    )}
                    {holdName && (
                      <div className="rounded-xl border bg-amber-50 p-3">
                        <div className="text-sm font-medium text-amber-900">On Hold</div>
                        <div className="mt-1 text-sm text-amber-800 truncate">{holdName}</div>
                        <button
                          className="mt-2 rounded-xl border border-amber-600 bg-white px-3 py-1 text-xs font-medium hover:bg-amber-50"
                          onClick={handleAddHoldBack}
                        >
                          Add Back
                        </button>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border bg-white p-4">
                <label className="text-sm text-zinc-700">Format</label>
                <select
                  className="mt-1 w-full rounded-xl border p-2"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                >
                  <option value="swiss">Swiss (pair by score each round)</option>
                  <option value="roundrobin">Round-robin (all rounds pre-set)</option>
                </select>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <label className="text-sm text-zinc-700">Planned Rounds {mode === "roundrobin" && <span className="text-xs text-zinc-500">(auto for RR)</span>}</label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-xl border p-2"
                  value={roundsPlanned}
                  onChange={(e) => setRoundsPlanned(parseInt(e.target.value || "1", 10))}
                  disabled={mode === "roundrobin"}
                />
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <label className="text-sm text-zinc-700">Bye Points</label>
                <select className="mt-1 w-full rounded-xl border p-2" value={byePoints} onChange={(e) => setByePoints(parseFloat(e.target.value))}>
                  <option value={1}>1.0 (full point)</option>
                  <option value={0.5}>0.5</option>
                  <option value={0}>0</option>
                </select>
              </div>
              <button onClick={startTournament} className="w-full rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                Start Tournament
              </button>
            </div>
          </section>
        )}

        {/* Message for participants when no tournament */}
        {!players && userRole === "participant" && (
          <section className="rounded-2xl border bg-white p-12 text-center">
            <Eye className="h-16 w-16 mx-auto mb-4 text-zinc-400" />
            <h2 className="text-xl font-semibold mb-2">No Active Tournament</h2>
            <p className="text-zinc-600">Waiting for the admin to create a tournament...</p>
          </section>
        )}

        {/* Top summary cards */}
        {players && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Round</span>
                <Shuffle className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-semibold">{currentRound}</div>
              <p className="text-xs text-zinc-500">{mode === "swiss" ? "Pair next round from standings" : "Navigate through pre-set rounds"}</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Participants</span>
                <Users2 className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-semibold">{participantsCount}</div>
              <p className="text-xs text-zinc-500">BYE handled automatically if odd</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Leader</span>
                <Trophy className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-semibold">{nameOf(standings[0]?.id ?? (players[0]?.id ?? 0), players)}</div>
              <p className="text-xs text-zinc-500">Tie-breakers later; preview totals only</p>
            </div>
          </section>
        )}

        {/* On Hold Display - Visible to All */}
        {players && holdName && (
          <OnHoldDisplay
            holdName={holdName}
            userRole={userRole}
            isAdminAuthenticated={isAdminAuthenticated}
            onAddBack={handleAddHoldBack}
          />
        )}

        {/* Controls for rounds - Admin Only */}
        {players && userRole === "admin" && isAdminAuthenticated && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-600">Mode: <span className="font-medium uppercase">{mode}</span></div>
            {mode === "swiss" ? (
              <button onClick={nextRoundSwiss} className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                Generate Next Round <ArrowRight className="ml-1 inline h-4 w-4" />
              </button>
            ) : (
              <div className="space-x-2">
                <button className="rounded-2xl border px-3 py-2 text-sm font-medium" onClick={() => setCurrentRound((r) => Math.max(1, r - 1))}>
                  Prev
                </button>
                <button className="rounded-2xl border px-3 py-2 text-sm font-medium" onClick={() => setCurrentRound((r) => Math.min(rounds.length, r + 1))}>
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Round Display for Participants */}
        {players && userRole === "participant" && rounds.length > 0 && (
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Current Round: {currentRound}</h2>
                <p className="text-sm text-zinc-600">View the pairings and standings below</p>
              </div>
              <div className="text-sm text-zinc-600">
                Mode: <span className="font-medium uppercase">{mode}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pairings + Score Entry (Admin) or View (Participant) */}
        {players && (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <div className="rounded-2xl border bg-white p-2">
                <div className="grid grid-cols-12 items-center gap-2 border-b px-3 py-2 text-xs font-medium text-zinc-600">
                  <div className="col-span-1">Board</div>
                  <div className="col-span-4">Participant A (White)</div>
                  <div className="col-span-3">{userRole === "admin" ? "Score" : "Result"}</div>
                  <div className="col-span-4">Participant B (Black)</div>
                </div>

                {rounds[currentRound - 1]?.matches.map((m) => {
                  const getResultDisplay = () => {
                    if (m.whiteId === BYE_ID || m.blackId === BYE_ID) return "BYE";
                    if (!m.result) return "–";
                    if (m.result === "W") return "1–0";
                    if (m.result === "L") return "0–1";
                    if (m.result === "D") return "½–½";
                    return "–";
                  };

                  return (
                    <div key={m.id} className="grid grid-cols-12 items-center gap-2 px-3 py-3 hover:bg-zinc-50">
                      <div className="col-span-1 font-semibold">{m.board}</div>
                      <div className="col-span-4 truncate">{nameOf(m.whiteId, players)}</div>
                      <div className="col-span-3">
                        {userRole === "admin" && isAdminAuthenticated ? (
                          m.whiteId === BYE_ID || m.blackId === BYE_ID ? (
                            <div className="text-xs text-zinc-600">BYE (auto {byePoints})</div>
                          ) : (
                            <ScoreToggle value={m.result} onChange={(v) => updateResult(m.id, v)} />
                          )
                        ) : (
                          <div className="text-sm font-medium text-zinc-700">{getResultDisplay()}</div>
                        )}
                      </div>
                      <div className="col-span-4 truncate">{nameOf(m.blackId, players)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Standings */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Standings (Carry-forward)</h2>
              <div className="rounded-2xl border bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-zinc-600">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Participant</th>
                      <th className="px-3 py-2">Score</th>
                      <th className="px-3 py-2">Wins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings
                      .filter((s) => s.id !== BYE_ID)
                      .map((s, i) => {
                        const wins = pairings.filter((m) =>
                          (m.result === "W" && m.whiteId === s.id) || (m.result === "L" && m.blackId === s.id)
                        ).length;
                        return (
                          <tr key={s.id} className="border-b last:border-none">
                            <td className="px-3 py-2">{i + 1}</td>
                            <td className="px-3 py-2">{nameOf(s.id, players)}</td>
                            <td className="px-3 py-2 font-semibold">{s.score.toFixed(1)}</td>
                            <td className="px-3 py-2">{wins}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Footer bar */}
        {players && (
          <footer className="mt-6 flex items-center justify-between rounded-2xl border bg-white p-3 text-sm text-zinc-600">
            <div>Scoring: Win = 1, Draw = 0.5, Loss = 0 • BYE = {byePoints}</div>
            {userRole === "admin" && isAdminAuthenticated && (
              <div className="space-x-2">
                <button className="rounded-2xl border px-3 py-2 font-medium" onClick={exportResultsCSV}>Export Results CSV</button>
                <button className="rounded-2xl border px-3 py-2 font-medium" onClick={exportStandingsCSV}>Export Standings CSV</button>
                <button className="rounded-2xl border px-3 py-2 font-medium" onClick={exportBoardsCSV}>Export Boards CSV</button>
              </div>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
