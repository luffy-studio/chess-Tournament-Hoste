import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { RoyalHeader } from '../components/RoyalHeader'
import { RoyalFooter } from '../components/RoyalFooter'
import { RoyalButton } from '../components/RoyalButton'
import { RoyalCard } from '../components/RoyalCard'
import { RoyalInput } from '../components/RoyalInput'

interface ParticipantInput {
  name: string
  rating?: number
  title?: string
  nationalRating?: number
}

export const CreateTournamentPage: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: Details
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'swiss' | 'roundrobin'>('swiss')
  const [roundsPlanned, setRoundsPlanned] = useState<number>(5)
  const [byePoints, setByePoints] = useState<number>(1)
  const [venue, setVenue] = useState('')
  const [timeControl, setTimeControl] = useState('15+10 Rapid')
  const [description, setDescription] = useState('')

  // Step 2: Participants
  const [namesText, setNamesText] = useState(
    'Magnus Carlsen\nHikaru Nakamura\nAlireza Firouzja\nGukesh D\nPraggnanandhaa R\nDing Liren\nFabiano Caruana\nIan Nepomniachtchi'
  )
  const [parsedParticipants, setParsedParticipants] = useState<ParticipantInput[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)

  // Parse names or CSV
  const handleProceedToReview = () => {
    let participants: ParticipantInput[] = []

    if (csvFile && parsedParticipants.length > 0) {
      participants = parsedParticipants
    } else {
      const lines = namesText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      const uniqueNames = Array.from(new Set(lines))
      participants = uniqueNames.map((n) => ({ name: n, rating: 1200 }))
    }

    if (participants.length < 2) {
      toast.error('At least 2 participants are required')
      return
    }

    setParsedParticipants(participants)
    setStep(3)
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length === 0) return

      const header = lines[0].toLowerCase()
      const hasHeader = header.includes('name')
      const dataRows = hasHeader ? lines.slice(1) : lines

      const items: ParticipantInput[] = []
      dataRows.forEach((row) => {
        const parts = row.split(',').map((p) => p.trim())
        if (parts[0]) {
          items.push({
            name: parts[0],
            rating: parts[1] ? parseInt(parts[1], 10) || 1200 : 1200,
            title: parts[2] || undefined,
            nationalRating: parts[3] ? parseInt(parts[3], 10) || undefined : undefined,
          })
        }
      })

      setParsedParticipants(items)
      toast.success(`Loaded ${items.length} participants from CSV`)
    }
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      // 1. Create Tournament
      const res = await api.post('/tournaments', {
        name,
        mode,
        roundsPlanned: Number(roundsPlanned),
        byePoints: Number(byePoints),
      })

      const tournamentId = res.data.id

      // Update metadata (venue, timeControl, description)
      if (venue || timeControl || description) {
        await api.patch(`/tournaments/${tournamentId}`, {
          venue,
          timeControl,
          description,
        })
      }

      // 2. Add Participants
      if (csvFile) {
        const formData = new FormData()
        formData.append('file', csvFile)
        await api.post(`/tournaments/${tournamentId}/participants/import`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        for (const p of parsedParticipants) {
          await api.post(`/tournaments/${tournamentId}/participants`, {
            name: p.name,
            rating: p.rating || 1200,
            title: p.title || null,
            nationalRating: p.nationalRating || null,
          })
        }
      }

      toast.success('Tournament constituted and ratified successfully!')
      navigate(`/admin/tournaments/${tournamentId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create tournament')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6F2] text-[#683B2B] font-sans flex flex-col selection:bg-[#B08401]/20 selection:text-[#683B2B]">
      <RoyalHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Header & Stepper */}
        <div className="space-y-4 border-b border-[#DED1BD] pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B08401] font-semibold">
                Arbiter Chamber Formulation
              </p>
              <h1 className="font-serif italic font-normal text-3xl sm:text-4xl text-[#683B2B] mt-1 tracking-tight">
                Constitute New <span className="text-[#B08401]">Championship</span>
              </h1>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center gap-2">
              {[
                { num: 1, label: 'Specifications' },
                { num: 2, label: 'Enrollment' },
                { num: 3, label: 'Ratification' },
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  {idx > 0 && <span className="text-[#DED1BD] text-xs">─</span>}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-cinzel transition-all ${
                      step === s.num
                        ? 'bg-[#B08401] text-[#FAF6F2] font-bold shadow-sm'
                        : step > s.num
                        ? 'border border-[#B08401] text-[#B08401] bg-[#FAF6F2]'
                        : 'border border-[#DED1BD] text-[#7A6658] bg-[#FFFFFF]'
                    }`}
                  >
                    <span>{s.num}.</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 1: SPECIFICATIONS */}
        {step === 1 && (
          <RoyalCard className="space-y-6">
            <div className="border-b border-[#DED1BD] pb-4">
              <h2 className="font-serif italic text-2xl text-[#683B2B]">
                1. Institutional Specifications
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6658] mt-1">
                Define the institutional rules, schedule limits, and time control for this championship decree.
              </p>
            </div>

            <div className="space-y-5">
              <RoyalInput
                label="Championship Title *"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Autumn Grandmaster Invitational"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="space-y-2">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] block font-semibold">
                    Tournament Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('swiss')}
                      className={`p-3.5 rounded-[12px] border text-left transition-all ${
                        mode === 'swiss'
                          ? 'border-[#B08401] bg-[#FAF6F2] text-[#683B2B] ring-1 ring-[#B08401] shadow-xs'
                          : 'border-[#DED1BD] bg-[#FFFFFF] text-[#7A6658] hover:border-[#B08401]/60'
                      }`}
                    >
                      <p className="font-cinzel text-xs font-bold text-[#B08401]">FIDE Swiss</p>
                      <p className="text-[11px] text-[#7A6658] mt-0.5 leading-snug">Dutch algorithm with floater auditing</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('roundrobin')}
                      className={`p-3.5 rounded-[12px] border text-left transition-all ${
                        mode === 'roundrobin'
                          ? 'border-[#B08401] bg-[#FAF6F2] text-[#683B2B] ring-1 ring-[#B08401] shadow-xs'
                          : 'border-[#DED1BD] bg-[#FFFFFF] text-[#7A6658] hover:border-[#B08401]/60'
                      }`}
                    >
                      <p className="font-cinzel text-xs font-bold text-[#B08401]">Round Robin</p>
                      <p className="text-[11px] text-[#7A6658] mt-0.5 leading-snug">Berger pairing tables, all play all</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] block font-semibold">
                    Rounds Planned
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={roundsPlanned}
                    onChange={(e) => setRoundsPlanned(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#FFFFFF] border border-[#DED1BD] rounded-[12px] px-4 py-2.5 text-[#683B2B] font-cinzel text-sm focus:outline-none focus:border-[#B08401] focus:ring-1 focus:ring-[#B08401] transition shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-1">
                <div className="space-y-2">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] block font-semibold">
                    Unpaired BYE Award
                  </label>
                  <select
                    value={byePoints}
                    onChange={(e) => setByePoints(parseFloat(e.target.value))}
                    className="w-full bg-[#FFFFFF] border border-[#DED1BD] rounded-[12px] px-3.5 py-2.5 text-[#683B2B] font-cinzel text-xs focus:outline-none focus:border-[#B08401] shadow-xs"
                  >
                    <option value={1}>1.0 (Full Point Award)</option>
                    <option value={0.5}>0.5 (Half Point Award)</option>
                    <option value={0}>0.0 (Zero Points)</option>
                  </select>
                </div>

                <RoyalInput
                  label="Time Control"
                  type="text"
                  value={timeControl}
                  onChange={(e) => setTimeControl(e.target.value)}
                  placeholder="e.g. 15+10 Rapid, 90+30 Classical"
                />

                <RoyalInput
                  label="Sanctioned Venue"
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Grand Guild Hall, Boardroom A"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] block font-semibold">
                  Championship Decree & Arbiter Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specify prize pool, FIDE tiebreak rules, default times, or special regulations..."
                  rows={3}
                  className="w-full bg-[#FFFFFF] border border-[#DED1BD] rounded-[12px] p-3 text-[#683B2B] placeholder-[#7A6658]/50 focus:outline-none focus:border-[#B08401] focus:ring-1 focus:ring-[#B08401] transition text-sm font-sans shadow-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-[#DED1BD]">
              <RoyalButton
                type="button"
                variant="primary"
                onClick={() => {
                  if (!name.trim()) {
                    toast.error('Tournament name is required')
                    return
                  }
                  setStep(2)
                }}
              >
                Proceed to Competitor Enrollment →
              </RoyalButton>
            </div>
          </RoyalCard>
        )}

        {/* STEP 2: PARTICIPANTS */}
        {step === 2 && (
          <RoyalCard className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DED1BD] pb-4">
              <div>
                <h2 className="font-serif italic text-2xl text-[#683B2B]">
                  2. Competitor Enrollment
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6658] mt-1">
                  Input verified players or import a FIDE roster CSV file.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full border border-[#DED1BD] bg-[#FFFFFF] hover:bg-[#FAF6F2] text-xs font-cinzel text-[#683B2B] transition shadow-xs">
                <span>📁 Upload CSV Roster</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
              </label>
            </div>

            {csvFile ? (
              <div className="rounded-[14px] border border-[#B08401]/40 bg-[#FAF6F2] p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-cinzel text-xs text-[#B08401] font-semibold">
                    📄 {csvFile.name}
                  </p>
                  <p className="text-xs text-[#7A6658]">
                    {parsedParticipants.length} competitors parsed from roster file
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCsvFile(null)
                    setParsedParticipants([])
                  }}
                  className="font-cinzel text-xs text-[#9E3B3B] hover:underline font-semibold"
                >
                  Clear File
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] block font-semibold">
                  Player Roster (One per line)
                </label>
                <textarea
                  value={namesText}
                  onChange={(e) => setNamesText(e.target.value)}
                  rows={8}
                  className="w-full bg-[#FFFFFF] border border-[#DED1BD] rounded-[12px] p-4 text-[#683B2B] font-mono text-sm placeholder-[#7A6658]/50 focus:outline-none focus:border-[#B08401] focus:ring-1 focus:ring-[#B08401] transition shadow-xs"
                  placeholder="Magnus Carlsen&#10;Hikaru Nakamura&#10;..."
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#DED1BD]">
              <RoyalButton
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
              >
                ← Back to Specifications
              </RoyalButton>
              <RoyalButton
                type="button"
                variant="primary"
                onClick={handleProceedToReview}
              >
                Review & Ratify →
              </RoyalButton>
            </div>
          </RoyalCard>
        )}

        {/* STEP 3: REVIEW & RATIFICATION */}
        {step === 3 && (
          <RoyalCard className="space-y-6">
            <div className="border-b border-[#DED1BD] pb-4">
              <h2 className="font-serif italic text-2xl text-[#683B2B]">
                3. Championship Ratification
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6658] mt-1">
                Confirm institutional details before committing to the immutable ledger.
              </p>
            </div>

            {/* Specifications Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-[14px] bg-[#FAF6F2] border border-[#DED1BD] text-sm">
              <div>
                <span className="font-cinzel text-[11px] uppercase tracking-wider text-[#7A6658] block font-semibold">
                  Championship
                </span>
                <span className="font-serif font-medium text-[#683B2B] text-base truncate block mt-0.5">
                  {name}
                </span>
              </div>
              <div>
                <span className="font-cinzel text-[11px] uppercase tracking-wider text-[#7A6658] block font-semibold">
                  Format
                </span>
                <span className="font-cinzel text-xs text-[#B08401] uppercase font-bold block mt-1">
                  {mode === 'swiss' ? 'FIDE Swiss' : 'Round Robin'}
                </span>
              </div>
              <div>
                <span className="font-cinzel text-[11px] uppercase tracking-wider text-[#7A6658] block font-semibold">
                  Planned Rounds
                </span>
                <span className="font-cinzel text-xs text-[#683B2B] font-bold block mt-1">
                  {roundsPlanned} Rounds
                </span>
              </div>
              <div>
                <span className="font-cinzel text-[11px] uppercase tracking-wider text-[#7A6658] block font-semibold">
                  Enrolled Players
                </span>
                <span className="font-cinzel text-xs text-[#5B6E57] font-bold block mt-1">
                  {parsedParticipants.length} Competitors
                </span>
              </div>
            </div>

            {/* Participants Roster Preview */}
            <div className="space-y-2">
              <span className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] block font-semibold">
                Verified Roster Preview:
              </span>
              <div className="max-h-64 overflow-y-auto rounded-[14px] bg-[#FFFFFF] border border-[#DED1BD] divide-y divide-[#DED1BD]">
                {parsedParticipants.map((p, idx) => (
                  <div key={idx} className="px-4 py-2.5 flex items-center justify-between text-sm">
                    <span className="text-[#683B2B] flex items-center gap-2">
                      <span className="font-cinzel text-xs text-[#7A6658] w-6">
                        {idx + 1}.
                      </span>
                      {p.name}
                    </span>
                    <span className="font-cinzel text-xs text-[#7A6658] flex items-center gap-2">
                      {p.title && (
                        <span className="text-[#B08401] font-bold border border-[#B08401]/40 px-1.5 py-0.5 rounded bg-[#FAF6F2]">
                          {p.title}
                        </span>
                      )}
                      Rating: <span className="text-[#683B2B] font-semibold">{p.rating || 1200}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#DED1BD]">
              <RoyalButton
                type="button"
                variant="secondary"
                onClick={() => setStep(2)}
              >
                ← Back to Enrollment
              </RoyalButton>
              <RoyalButton
                type="button"
                variant="primary"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Ratifying…' : '♔ Ratify & Launch Championship'}
              </RoyalButton>
            </div>
          </RoyalCard>
        )}
      </main>

      <RoyalFooter />
    </div>
  )
}
