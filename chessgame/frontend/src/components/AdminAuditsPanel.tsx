import { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, Play, RefreshCw, Layers, ClipboardList } from "lucide-react";
import api from "../utils/api";
import { Participant } from "../types";

interface AdminAuditsPanelProps {
  tournamentId: string;
  currentRound: number;
  participants: Participant[];
}

export function AdminAuditsPanel({
  tournamentId,
  currentRound,
  participants,
}: AdminAuditsPanelProps) {
  const [selectedRound, setSelectedRound] = useState<number>(currentRound);
  const [auditReport, setAuditReport] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [simulationStandings, setSimulationStandings] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const fetchAuditReport = async (roundNum: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/tournaments/${tournamentId}/audits/${roundNum}`);
      setAuditReport(res.data);
    } catch (err) {
      setAuditReport(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get(`/tournaments/${tournamentId}/audit-logs`);
      setAuditLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const runSimulation = async () => {
    try {
      setSimulating(true);
      const res = await api.post(`/tournaments/${tournamentId}/pairings/simulate`);
      setSimulationStandings(res.data.standings);
    } catch (err) {
      alert("Failed to run pairings simulation.");
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    if (selectedRound > 0) {
      fetchAuditReport(selectedRound);
    }
    fetchAuditLogs();
  }, [selectedRound, tournamentId]);

  return (
    <div className="space-y-6">
      {/* Simulation / Action Panel */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-800">
              <Play className="h-5 w-5 text-indigo-600 animate-pulse" />
              Pairing Simulation Mode
            </h3>
            <button
              onClick={runSimulation}
              disabled={simulating}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {simulating ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Simulate Remaining Rounds"}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Simulates all remaining rounds of the tournament using in-memory calculations and player ratings, allowing you to preview final standings and check potential pairing deadlocks without modifying the active tournament database.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-800 mb-3">
            <ClipboardList className="h-5 w-5 text-amber-600" />
            Select Audit Round
          </h3>
          <div className="flex gap-2">
            {Array.from({ length: currentRound }, (_, i) => i + 1).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRound(r)}
                className={`h-10 w-10 rounded-xl border text-sm font-semibold transition-all ${
                  selectedRound === r
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-sm scale-105"
                    : "bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                R{r}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Simulated Standings Result */}
      {simulationStandings && (
        <section className="rounded-2xl border bg-zinc-900 text-white p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Simulated Final Standings
            </h3>
            <button
              onClick={() => setSimulationStandings(null)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Clear Simulation
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="py-2">Rank</th>
                  <th className="py-2">Player</th>
                  <th className="py-2">Rating</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">Buchholz</th>
                  <th className="py-2">Sonneborn-Berger</th>
                </tr>
              </thead>
              <tbody>
                {simulationStandings.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800 last:border-none hover:bg-zinc-800/50">
                    <td className="py-2.5 font-semibold text-zinc-100">{p.rank}</td>
                    <td className="py-2.5 text-zinc-100">{p.name}</td>
                    <td className="py-2.5">{p.rating}</td>
                    <td className="py-2.5 font-bold text-green-400">{p.score.toFixed(1)}</td>
                    <td className="py-2.5">{p.buchholz.toFixed(1)}</td>
                    <td className="py-2.5">{p.sonnebornBerger.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* FIDE Audits Section */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : auditReport ? (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left: Compliance Checklist & Warnings */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-zinc-800">FIDE Compliance Report</h3>
            <div className="rounded-2xl border bg-white p-4 space-y-3">
              {auditReport.fideComplianceReport.checklist.map((c: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 border-b last:border-none pb-3 last:pb-0"
                >
                  {c.status === "PASS" ? (
                    <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-zinc-800">{c.rule}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{c.details}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Floaters Info */}
            <h3 className="text-base font-bold text-zinc-800">Score Group Floaters</h3>
            <div className="rounded-2xl border bg-white p-4 space-y-2 text-xs">
              {auditReport.pairingAuditReport.floaters.length === 0 ? (
                <p className="text-zinc-500 italic">No floaters in this round.</p>
              ) : (
                auditReport.pairingAuditReport.floaters.map((fl: any, idx: number) => {
                  const pName = participants.find((p) => p.id === fl.playerId)?.name || fl.playerId;
                  return (
                    <div key={idx} className="flex justify-between border-b pb-2 last:border-none last:pb-0">
                      <span className="font-semibold text-zinc-800">{pName}</span>
                      <span
                        className={`font-semibold capitalize ${
                          fl.direction === "up" ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        Floated {fl.direction} ({fl.fromScore.toFixed(1)} → {fl.toScore.toFixed(1)})
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Color Balance Details */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-zinc-800">Color Balance Matrix</h3>
            <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-zinc-500">
                    <th className="py-2">Player</th>
                    <th className="py-2">History</th>
                    <th className="py-2">Current</th>
                    <th className="py-2">Diff (W-B)</th>
                    <th className="py-2">Consecutive</th>
                  </tr>
                </thead>
                <tbody>
                  {auditReport.colorBalanceReport.map((cb: any, idx: number) => {
                    const pName = participants.find((p) => p.id === cb.playerId)?.name || cb.playerId;
                    return (
                      <tr key={idx} className="border-b last:border-none hover:bg-zinc-50">
                        <td className="py-2 font-medium text-zinc-800">{pName}</td>
                        <td className="py-2 font-mono text-zinc-500">{cb.colorHistory || "—"}</td>
                        <td className="py-2 font-semibold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              cb.currentColor === "W"
                                ? "bg-zinc-100 text-zinc-800 border"
                                : cb.currentColor === "B"
                                ? "bg-zinc-950 text-white"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {cb.currentColor}
                          </span>
                        </td>
                        <td className="py-2">{cb.newColorDifference}</td>
                        <td className="py-2">{cb.newConsecutiveSameColor}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border bg-white p-6 text-center text-zinc-500 italic">
          No audit report generated yet. Reports are generated when rounds are paired.
        </div>
      )}

      {/* Audit Logs */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-zinc-800">Pairing Audit Logs</h3>
        <div className="rounded-2xl border bg-white p-2 divide-y max-h-[300px] overflow-y-auto">
          {auditLogs.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-500 italic">No logs found.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 text-xs flex justify-between items-start gap-4">
                <div>
                  <span className="font-semibold text-zinc-800 uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] mr-2">
                    {log.action}
                  </span>
                  <span className="text-zinc-600">Round {log.round}</span>
                  <p className="text-zinc-500 mt-1">Actor: {log.actor}</p>
                </div>
                <span className="text-zinc-400 text-[10px]">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
