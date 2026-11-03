import React, { useMemo, useState } from "react";

// Types and utilities
import { UserRole, Mode, Match, Participant, Standing, BYE_ID } from "./types";
import {
  shuffle,
  nameOf,
  roundRobinSchedule,
  buildScoreBracketPairsFromStandings,
} from "./utils/tournamentUtils";
import { downloadCSV, rowsToCSV } from "./utils/csvUtils";

// Components
import { LoginModal } from "./components/LoginModal";
import { Header } from "./components/Header";
import { SetupWizard } from "./components/SetupWizard";
import { NoTournamentMessage } from "./components/NoTournamentMessage";
import { SummaryCards } from "./components/SummaryCards";
import { RoundControls } from "./components/RoundControls";
import { RoundDisplay } from "./components/RoundDisplay";
import { PairingsBoard } from "./components/PairingsBoard";
import { StandingsTable } from "./components/StandingsTable";
import { Footer } from "./components/Footer";
import { AddParticipantPanel } from "./components/AddParticipantPanel";
import { OnHoldDisplay } from "./components/OnHoldDisplay";
import { ParticipantManager } from "./components/ParticipantManager";

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

  // Add participant state
  const [newParticipantName, setNewParticipantName] = useState<string>("");
  const [participantQueue, setParticipantQueue] = useState<string[]>([]);

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

  // New participant queue management
  const handleAddToQueue = () => {
    if (newParticipantName.trim() && !participantQueue.includes(newParticipantName.trim())) {
      setParticipantQueue([...participantQueue, newParticipantName.trim()]);
      setNewParticipantName("");
    }
  };

  const handleRemoveFromQueue = (index: number) => {
    setParticipantQueue(participantQueue.filter((_, i) => i !== index));
  };

  // Participant management during tournament
  const handleAddParticipantDirect = (name: string) => {
    if (!players) return;
    const maxId = Math.max(...players.map(p => p.id));
    const newParticipant: Participant = {
      id: maxId + 1,
      name,
    };
    setPlayers([...players, newParticipant]);
  };

  const handleEditParticipant = (id: number, newName: string) => {
    if (!players) return;
    setPlayers(players.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleRemoveParticipant = (id: number) => {
    if (!players) return;
    // Remove from players
    setPlayers(players.filter(p => p.id !== id));
    // Remove from pairings (set results to null if participant was in a match)
    setPairings(pairings.map(m => {
      if (m.whiteId === id || m.blackId === id) {
        return { ...m, result: null };
      }
      return m;
    }));
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
      rrs.forEach((pairs: any) => {
        pairs.forEach((pair: any, i: any) => {
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

    // Add queued participants to the player list
    if (participantQueue.length > 0) {
      const maxId = Math.max(...players.map(p => p.id));
      const newPlayers = participantQueue.map((name, idx) => ({
        id: maxId + idx + 1,
        name,
      }));
      setPlayers([...players, ...newPlayers]);
      setParticipantQueue([]); // Clear the queue

      // Recalculate standings with new players
      const updatedStandings = useScores(pairings, [...players, ...newPlayers], byePoints);
      const pairs = buildScoreBracketPairsFromStandings(updatedStandings, players.length + newPlayers.length);
      const startId = pairings.length ? pairings[pairings.length - 1].id + 1 : 200;
      const newPairings: Match[] = pairs.map((p: any, idx: any) => ({
        id: startId + idx,
        board: idx + 1,
        whiteId: idx % 2 === 0 ? p.a : p.b,
        blackId: idx % 2 === 0 ? p.b : p.a,
        result: null,
      }));
      setPairings((old) => [...old, ...newPairings]);
      setCurrentRound((r) => r + 1);
    } else {
      // Normal Swiss round generation
      const pairs = buildScoreBracketPairsFromStandings(standings, players.length);
      const startId = pairings.length ? pairings[pairings.length - 1].id + 1 : 200;
      const newPairings: Match[] = pairs.map((p: any, idx: any) => ({
        id: startId + idx,
        board: idx + 1,
        whiteId: idx % 2 === 0 ? p.a : p.b,
        blackId: idx % 2 === 0 ? p.b : p.a,
        result: null,
      }));
      setPairings((old) => [...old, ...newPairings]);
      setCurrentRound((r) => r + 1);
    }
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
  if (!players || !rounds) return;

  const idToName = new Map(players.map(p => [p.id, p.name]));
  const nameOf = (id: number) => (id === BYE_ID ? "BYE" : (idToName.get(id) ?? `ID:${id}`));

  const rows: (string | number)[][] = [];

  // Har round ka block: title row, header row, phir board-wise pairings
  [...rounds]
    .sort((a, b) => a.round - b.round)
    .forEach(r => {
      rows.push([`Round ${r.round}`]);
      rows.push(["S.NO", "Black", "Board", "White"]);

      const matches = [...r.matches].sort((a, b) => (a.board ?? 0) - (b.board ?? 0));
      matches.forEach(m => {
        const boardNum = m.board ?? "";
        rows.push([
          boardNum, nameOf(m.whiteId),
          boardNum, nameOf(m.blackId),
        ]);
      });

      rows.push([]); // separator blank line
    });

  downloadCSV("pairings_by_round.csv", rowsToCSV(rows));
};


  const participantsCount = players?.filter((p) => p.id !== BYE_ID).length ?? 0;
  const leaderName = nameOf(standings[0]?.id ?? (players?.[0]?.id ?? 0), players ?? []);
  const currentMatches = rounds[currentRound - 1]?.matches ?? [];

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
          <SetupWizard
            namesText={namesText}
            mode={mode}
            roundsPlanned={roundsPlanned}
            byePoints={byePoints}
            holdName={holdName}
            onNamesChange={setNamesText}
            onModeChange={setMode}
            onRoundsPlannedChange={setRoundsPlanned}
            onByePointsChange={setByePoints}
            onMoveLastToHold={handleMoveLastToHold}
            onAddHoldBack={handleAddHoldBack}
            onStart={startTournament}
          />
        )}

        {/* Message for participants when no tournament */}
        {!players && userRole === "participant" && <NoTournamentMessage />}

        {/* Top summary cards */}
        {players && (
          <SummaryCards
            currentRound={currentRound}
            mode={mode}
            participantsCount={participantsCount}
            leaderName={leaderName}
          />
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

        {/* Add Participant Panel - Admin Only */}
        {players && userRole === "admin" && isAdminAuthenticated && (
          <AddParticipantPanel
            mode={mode}
            newName={newParticipantName}
            queue={participantQueue}
            onNewNameChange={setNewParticipantName}
            onAddToQueue={handleAddToQueue}
            onRemoveFromQueue={handleRemoveFromQueue}
          />
        )}

        {/* Participant Manager - Admin Only */}
        {players && userRole === "admin" && isAdminAuthenticated && (
          <ParticipantManager
            participants={players}
            onAddParticipant={handleAddParticipantDirect}
            onEditParticipant={handleEditParticipant}
            onRemoveParticipant={handleRemoveParticipant}
          />
        )}

        {/* Controls for rounds - Admin Only */}
        {players && userRole === "admin" && isAdminAuthenticated && (
          <RoundControls
            mode={mode}
            currentRound={currentRound}
            totalRounds={rounds.length}
            onNextRound={() => setCurrentRound((r) => Math.min(rounds.length, r + 1))}
            onPrevRound={() => setCurrentRound((r) => Math.max(1, r - 1))}
            onNextRoundClick={nextRoundSwiss}
          />
        )}

        {/* Round Display for Participants */}
        {players && userRole === "participant" && rounds.length > 0 && (
          <RoundDisplay currentRound={currentRound} mode={mode} />
        )}

        {/* Pairings + Score Entry (Admin) or View (Participant) */}
        {players && (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <PairingsBoard
              matches={currentMatches}
              players={players}
              userRole={userRole}
              isAdminAuthenticated={isAdminAuthenticated}
              byePoints={byePoints}
              onUpdateResult={updateResult}
              onEditParticipant={handleEditParticipant}
              onRemoveParticipant={handleRemoveParticipant}
            />
            <StandingsTable
              standings={standings}
              players={players}
              pairings={pairings}
            />
          </section>
        )}

        {/* Footer bar */}
        {players && (
          <Footer
            byePoints={byePoints}
            userRole={userRole}
            isAdminAuthenticated={isAdminAuthenticated}
            onExportResults={exportResultsCSV}
            onExportStandings={exportStandingsCSV}
            onExportBoards={exportBoardsCSV}
          />
        )}
      </div>
    </div>
  );
}
