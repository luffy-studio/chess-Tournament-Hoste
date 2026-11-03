import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Chess, Square } from 'chess.js'
import { Socket } from 'socket.io-client'
import api from '../utils/api'
import { createAppSocket } from '../utils/socket'
import { RoyalHeader } from '../components/RoyalHeader'
import { RoyalFooter } from '../components/RoyalFooter'
import { RoyalButton } from '../components/RoyalButton'
import { RoyalCard } from '../components/RoyalCard'
import { RoyalEmpty } from '../components/RoyalEmpty'
import { CopyButton } from '../components/CopyButton'
import { ConnectionBadge } from '../components/ConnectionBadge'
import { Swords, RefreshCw, RotateCcw, Flag, HeartHandshake, AlertTriangle, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'

interface ArenaGameState {
  id: string
  fen: string
  turn: 'w' | 'b'
  isCheck: boolean
  status: 'waiting' | 'in_progress' | 'completed' | 'aborted'
  winner: 'w' | 'b' | 'draw' | null
  endReason: string | null
  timeControl: { initial: number; increment: number }
  tournamentId?: string | null
  matchId?: string | null
  white: { id: string; name: string; color: 'w'; timeLeft: number; connected: boolean } | null
  black: { id: string; name: string; color: 'b'; timeLeft: number; connected: boolean } | null
  spectatorsCount: number
  moves: { san: string; from: string; to: string; whiteTimeLeft: number; blackTimeLeft: number }[]
  drawOffer: 'w' | 'b' | null
}

const PIECE_SYMBOLS: Record<string, string> = {
  wK: '♔',
  wQ: '♕',
  wR: '♖',
  wB: '♗',
  wN: '♘',
  wP: '♙',
  bK: '♚',
  bQ: '♛',
  bR: '♜',
  bB: '♝',
  bN: '♞',
  bP: '♟',
}

export const OnlineArenaPage: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const tournamentIdParam = searchParams.get('tournamentId')
  const matchIdParam = searchParams.get('matchId')

  // User identity
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('arena_player_name') || 'Grandmaster_' + Math.floor(Math.random() * 1000)
  })
  const [playerId] = useState(() => {
    let id = localStorage.getItem('arena_player_id')
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 9)
      localStorage.setItem('arena_player_id', id)
    }
    return id
  })

  // Lobby state
  const [activeMatches, setActiveMatches] = useState<any[]>([])
  const [timePreset, setTimePreset] = useState<'10+0' | '5+3' | '3+2' | '1+0' | 'untimed'>('5+3')
  const [colorPref, setColorPref] = useState<'w' | 'b' | 'random'>('random')
  const [directRoomInput, setDirectRoomInput] = useState('')
  const [creating, setCreating] = useState(false)

  // In-Game state
  const [socket, setSocket] = useState<Socket | null>(null)
  const [gameState, setGameState] = useState<ArenaGameState | null>(null)
  const [myRole, setMyRole] = useState<'w' | 'b' | 'spectator'>('spectator')
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [legalMoves, setLegalMoves] = useState<Square[]>([])
  const [flipped, setFlipped] = useState(false)
  const [whiteClock, setWhiteClock] = useState<number>(0)
  const [blackClock, setBlackClock] = useState<number>(0)
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null)

  // Phase 2 & 3 States
  const [drawOfferSent, setDrawOfferSent] = useState(false)
  const [incomingDrawOffer, setIncomingDrawOffer] = useState(false)
  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)

  const chessRef = useRef(new Chess())

  // Save player name
  useEffect(() => {
    localStorage.setItem('arena_player_name', playerName)
  }, [playerName])

  // Connect Socket.IO
  useEffect(() => {
    const newSocket = createAppSocket()
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  // Fetch active public matches
  useEffect(() => {
    if (!roomId) {
      fetchActiveMatches()
      const interval = setInterval(fetchActiveMatches, 4000)
      return () => clearInterval(interval)
    }
  }, [roomId])

  const fetchActiveMatches = async () => {
    try {
      const res = await api.get('/arena/games')
      setActiveMatches(res.data)
    } catch {
      // ignore
    }
  }

  // Join room when in game view
  useEffect(() => {
    if (!socket || !roomId) return

    // If game does not exist and it's a tournament match room, create it first
    if (tournamentIdParam && matchIdParam) {
      api.post('/arena/games', {
        roomId,
        creatorName: playerName,
        creatorId: playerId,
        timeControl: { initial: 300, increment: 3 },
        tournamentId: tournamentIdParam,
        matchId: matchIdParam,
      }).catch(() => {})
    }

    socket.emit('arena:join', {
      roomId,
      player: { id: playerId, name: playerName },
    })

    socket.on('arena:gameState', ({ role, game }: { role: 'w' | 'b' | 'spectator'; game: ArenaGameState }) => {
      setMyRole(role)
      setGameState(game)
      setWhiteClock(game.white?.timeLeft ?? 0)
      setBlackClock(game.black?.timeLeft ?? 0)
      chessRef.current.load(game.fen)
      if (role === 'b') {
        setFlipped(true)
      }
      if (game.status === 'completed') {
        setShowResultModal(true)
      }
      if (game.drawOffer && game.drawOffer !== role && role !== 'spectator') {
        setIncomingDrawOffer(true)
      }
    })

    socket.on('arena:playerJoined', ({ game }: { game: ArenaGameState }) => {
      setGameState(game)
      if (game.status === 'in_progress') {
        toast.success('Opponent connected. Match beginning!', { icon: '♟' })
      }
    })

    socket.on('arena:moveMade', ({ game }: { game: ArenaGameState }) => {
      setGameState(game)
      setWhiteClock(game.white?.timeLeft ?? 0)
      setBlackClock(game.black?.timeLeft ?? 0)
      chessRef.current.load(game.fen)
      setSelectedSquare(null)
      setLegalMoves([])
      setDrawOfferSent(false)
      setIncomingDrawOffer(false)
    })

    socket.on('arena:clockTick', ({ whiteTimeLeft, blackTimeLeft }: { whiteTimeLeft: number; blackTimeLeft: number }) => {
      setWhiteClock(whiteTimeLeft)
      setBlackClock(blackTimeLeft)
    })

    socket.on('arena:gameOver', ({ message, game }: any) => {
      setGameState(game)
      setShowResultModal(true)
      setDisconnectCountdown(null)
      setIncomingDrawOffer(false)
      setDrawOfferSent(false)
      toast(message, { icon: '🏆', duration: 6000 })
    })

    // Phase 2: Real-time Draw Offer Events
    socket.on('arena:drawOffered', ({ by }: { by: 'w' | 'b' }) => {
      setGameState((prev) => (prev ? { ...prev, drawOffer: by } : prev))
      if (myRole !== 'spectator' && by !== myRole) {
        setIncomingDrawOffer(true)
      }
    })

    socket.on('arena:drawDeclined', ({ message }: { message?: string }) => {
      setGameState((prev) => (prev ? { ...prev, drawOffer: null } : prev))
      setDrawOfferSent(false)
      setIncomingDrawOffer(false)
      toast.error(message || 'Draw offer rejected.', { icon: '❌' })
    })

    // Phase 3: 50s Disconnection Countdown Events
    socket.on('arena:disconnectCountdown', ({ disconnectedColor, secondsLeft }: { disconnectedColor: 'w' | 'b'; secondsLeft: number }) => {
      if (myRole !== 'spectator' && disconnectedColor !== myRole) {
        setDisconnectCountdown(secondsLeft)
      }
    })

    socket.on('arena:playerReconnected', ({ reconnectedColor }: { reconnectedColor: 'w' | 'b' }) => {
      if (reconnectedColor !== myRole) {
        setDisconnectCountdown(null)
        toast.success('Opponent reconnected! Live match continuing.', { icon: '🟢' })
      }
    })

    socket.on('arena:error', ({ message }: { message: string }) => {
      toast.error(message)
    })

    return () => {
      socket.off('arena:gameState')
      socket.off('arena:playerJoined')
      socket.off('arena:moveMade')
      socket.off('arena:clockTick')
      socket.off('arena:gameOver')
      socket.off('arena:drawOffered')
      socket.off('arena:drawDeclined')
      socket.off('arena:disconnectCountdown')
      socket.off('arena:playerReconnected')
      socket.off('arena:error')
    }
  }, [socket, roomId, playerId, playerName, myRole, tournamentIdParam, matchIdParam])

  // Create match
  const handleCreateMatch = async () => {
    try {
      setCreating(true)
      let initial = 300
      let increment = 3

      if (timePreset === '10+0') {
        initial = 600
        increment = 0
      } else if (timePreset === '5+3') {
        initial = 300
        increment = 3
      } else if (timePreset === '3+2') {
        initial = 180
        increment = 2
      } else if (timePreset === '1+0') {
        initial = 60
        increment = 0
      } else if (timePreset === 'untimed') {
        initial = 0
        increment = 0
      }

      const res = await api.post('/arena/games', {
        creatorName: playerName,
        creatorId: playerId,
        timeControl: { initial, increment },
        preferredColor: colorPref,
      })

      navigate(`/arena/${res.data.roomId}`)
    } catch {
      toast.error('Failed to create match')
    } finally {
      setCreating(false)
    }
  }

  // Square Click & Move Logic
  const handleSquareClick = (sq: Square) => {
    if (!gameState || gameState.status !== 'in_progress') return
    if (myRole !== 'w' && myRole !== 'b') return // Spectator
    if (gameState.turn !== myRole) return // Not your turn

    const chess = chessRef.current
    const piece = chess.get(sq)

    // Destination clicked
    if (selectedSquare && legalMoves.includes(sq)) {
      const movingPiece = chess.get(selectedSquare)
      const isPawnPromotion =
        movingPiece?.type === 'p' &&
        ((movingPiece.color === 'w' && sq.endsWith('8')) || (movingPiece.color === 'b' && sq.endsWith('1')))

      if (isPawnPromotion) {
        setPromotionPending({ from: selectedSquare, to: sq })
        return
      }

      executeMove(selectedSquare, sq)
      return
    }

    // Selecting own piece
    if (piece && piece.color === myRole) {
      setSelectedSquare(sq)
      const moves = chess.moves({ square: sq, verbose: true })
      setLegalMoves(moves.map((m) => m.to as Square))
    } else {
      setSelectedSquare(null)
      setLegalMoves([])
    }
  }

  const executeMove = (from: Square, to: Square, promotion?: string) => {
    if (!socket || !roomId) return
    socket.emit('arena:move', {
      roomId,
      playerId,
      move: { from, to, promotion: promotion || 'q' },
    })
    setSelectedSquare(null)
    setLegalMoves([])
    setPromotionPending(null)
  }

  const handleResign = () => {
    if (!socket || !roomId || !window.confirm('Are you sure you want to resign this match?')) return
    socket.emit('arena:resign', { roomId, playerId })
  }

  // Phase 2: Offer Draw
  const handleOfferDraw = () => {
    if (!socket || !roomId) return
    if (drawOfferSent || gameState?.drawOffer) {
      toast.error('A draw offer is already pending.')
      return
    }
    socket.emit('arena:drawOffer', { roomId, playerId })
    setDrawOfferSent(true)
    toast.success('Draw offered to opponent.')
  }

  // Phase 2: Accept or Reject Draw
  const handleRespondDraw = (accept: boolean) => {
    if (!socket || !roomId) return
    socket.emit('arena:drawResponse', { roomId, playerId, accept })
    setIncomingDrawOffer(false)
  }

  const formatClock = (seconds: number) => {
    if (seconds <= 0 && gameState?.timeControl.initial === 0) return '∞'
    const mins = Math.floor(Math.max(0, seconds) / 60)
    const secs = Math.floor(Math.max(0, seconds) % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Render Chessboard with Soft Ivory & Warm Walnut Luxury Colors
  // Frame: #683B2B, Light: #FAF6F2, Dark: #DED1BD
  const renderBoard = () => {
    const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]
    const files = flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

    const chess = chessRef.current
    const lastMove = gameState?.moves[gameState.moves.length - 1]

    return (
      <div className="grid grid-cols-8 grid-rows-8 w-full max-w-[min(100vw-32px,520px)] aspect-square rounded-[16px] overflow-hidden border-4 border-[#683B2B] shadow-md relative select-none bg-[#683B2B]">
        {ranks.map((r, rIdx) =>
          files.map((f, fIdx) => {
            const sq = `${f}${r}` as Square
            const isDark = (rIdx + fIdx) % 2 === 1
            const piece = chess.get(sq)
            const isSelected = selectedSquare === sq
            const isLegalTarget = legalMoves.includes(sq)
            const isLastMoveFrom = lastMove?.from === sq
            const isLastMoveTo = lastMove?.to === sq
            const isKingInCheck =
              piece?.type === 'k' && piece.color === chess.turn() && chess.inCheck()

            // Soft Ivory & Warm Beige Board Tokens:
            let bgColor = isDark ? 'bg-[#DED1BD]' : 'bg-[#FAF6F2]'

            if (isLastMoveFrom || isLastMoveTo) {
              bgColor = isDark ? 'bg-[#C9BAA3]' : 'bg-[#F4EEE7]'
            }
            if (isSelected) {
              bgColor = 'bg-[#B08401]/50'
            }

            return (
              <button
                key={sq}
                type="button"
                onClick={() => handleSquareClick(sq)}
                className={`relative flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-normal transition-all duration-75 ${bgColor} ${
                  isKingInCheck ? 'ring-4 ring-[#9E3B3B] ring-inset bg-[#9E3B3B]/40 animate-pulse' : ''
                }`}
              >
                {/* Coordinate labels */}
                {fIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 font-cinzel text-[9px] font-bold ${
                      isDark ? 'text-[#683B2B]/60' : 'text-[#7A6658]/60'
                    }`}
                  >
                    {r}
                  </span>
                )}
                {rIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 font-cinzel text-[9px] font-bold ${
                      isDark ? 'text-[#683B2B]/60' : 'text-[#7A6658]/60'
                    }`}
                  >
                    {f}
                  </span>
                )}

                {/* Piece rendering */}
                {piece && (
                  <span
                    className={`leading-none cursor-pointer transform hover:scale-105 active:scale-95 transition-transform ${
                      piece.color === 'w'
                        ? 'text-[#FFFFFF] drop-shadow-[0_2px_4px_rgba(104,59,43,0.8)]'
                        : 'text-[#241E19] drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]'
                    }`}
                  >
                    {PIECE_SYMBOLS[`${piece.color}${piece.type.toUpperCase()}`]}
                  </span>
                )}

                {/* Legal Move Indicators */}
                {isLegalTarget && (
                  <div
                    className={`absolute rounded-full pointer-events-none ${
                      piece
                        ? 'w-full h-full border-4 border-[#B08401]/90 ring-2 ring-[#B08401]/40'
                        : 'w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#B08401]/80 shadow-sm'
                    }`}
                  />
                )}
              </button>
            )
          })
        )}
      </div>
    )
  }

  // If in a room, render Live Match View
  if (roomId) {
    const isWhite = myRole === 'w'
    const isSpectator = myRole === 'spectator'
    const opponent = isWhite ? gameState?.black : gameState?.white
    const me = isWhite ? gameState?.white : gameState?.black

    const opponentClock = isWhite ? blackClock : whiteClock
    const myClock = isWhite ? whiteClock : blackClock

    return (
      <div className="min-h-screen bg-[#FAF6F2] text-[#683B2B] font-sans flex flex-col selection:bg-[#B08401]/25 selection:text-[#683B2B]">
        <RoyalHeader />

        {/* Match Top Bar */}
        <div className="border-b border-[#DED1BD] bg-[#FFFFFF]/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/arena" className="font-cinzel text-xs text-[#7A6658] hover:text-[#683B2B] transition font-semibold">
                ← Exit to Lobby
              </Link>
              <span className="text-[#DED1BD] text-xs">/</span>
              <span className="font-cinzel text-xs text-[#B08401] font-bold">
                Room: <span className="font-mono text-[#683B2B]">{roomId}</span>
              </span>
              {gameState?.tournamentId && (
                <span className="hidden sm:inline-block font-cinzel text-[11px] px-2.5 py-0.5 rounded-full bg-[#D49E8D]/20 text-[#683B2B] border border-[#D49E8D]/40 font-semibold">
                  Tournament Match
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <ConnectionBadge socket={socket} />
              <CopyButton
                text={typeof window !== 'undefined' ? window.location.href : ''}
                label="Share Match"
                variant="secondary"
                size="sm"
                successMessage="Match link copied to clipboard!"
              />
              <span className="font-cinzel text-xs text-[#7A6658] hidden md:inline font-semibold">
                👁 {gameState?.spectatorsCount ?? 0} Spectating
              </span>
            </div>
          </div>
        </div>

        {/* Phase 3: Disconnection Warning Banner */}
        {disconnectCountdown !== null && (
          <div className="bg-[#FAF6F2] border-b-2 border-[#B08401] p-3 text-center shadow-md animate-in slide-in-from-top duration-200">
            <div className="max-w-xl mx-auto flex items-center justify-center gap-3">
              <AlertTriangle className="text-[#B08401] animate-bounce shrink-0" size={20} />
              <div className="text-left sm:text-center">
                <p className="font-cinzel text-xs uppercase tracking-wider font-bold text-[#683B2B]">
                  Opponent Disconnected
                </p>
                <p className="text-xs text-[#7A6658] font-sans">
                  Waiting for opponent to reconnect... Victory awarded in{' '}
                  <span className="font-mono font-bold text-sm text-[#B08401] bg-[#FAF6F2] px-2 py-0.5 rounded border border-[#B08401]">
                    {disconnectCountdown}s
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Real-time Draw Offer Modal / Prompt */}
        {incomingDrawOffer && !isSpectator && gameState?.status === 'in_progress' && (
          <div className="fixed inset-0 z-50 bg-[#683B2B]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <RoyalCard className="max-w-md w-full text-center space-y-5 p-7 shadow-2xl border-2 border-[#B08401]">
              <div className="w-14 h-14 rounded-full bg-[#FAF6F2] border border-[#B08401] flex items-center justify-center mx-auto text-2xl text-[#B08401]">
                <HeartHandshake size={28} />
              </div>
              <div className="space-y-1">
                <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#B08401] font-semibold">
                  Peace Accord
                </p>
                <h3 className="font-serif italic text-2xl text-[#683B2B]">
                  Your opponent has offered a draw.
                </h3>
                <p className="text-xs text-[#7A6658]">
                  Accepting will conclude this fixture immediately with a half-point awarded to both competitors.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleRespondDraw(true)}
                  className="py-2.5 px-4 rounded-full bg-[#B08401] hover:bg-[#997200] text-[#FAF6F2] font-cinzel text-xs font-bold transition shadow-sm"
                >
                  Accept Draw
                </button>
                <button
                  type="button"
                  onClick={() => handleRespondDraw(false)}
                  className="py-2.5 px-4 rounded-full border border-[#DED1BD] bg-[#FAF6F2] hover:bg-[#DED1BD] text-[#683B2B] font-cinzel text-xs font-bold transition"
                >
                  Reject Offer
                </button>
              </div>
            </RoyalCard>
          </div>
        )}

        {/* Phase 2 & 3: Final Game Result Modal */}
        {showResultModal && gameState?.status === 'completed' && (
          <div className="fixed inset-0 z-50 bg-[#683B2B]/45 backdrop-blur-sm flex items-center justify-center p-4">
            <RoyalCard className="max-w-lg w-full text-center space-y-6 p-8 shadow-2xl border-2 border-[#B08401]">
              <div className="w-16 h-16 rounded-full bg-[#FAF6F2] border-2 border-[#B08401] flex items-center justify-center mx-auto text-3xl text-[#B08401]">
                {gameState.winner === 'draw' ? <HeartHandshake size={32} /> : <Trophy size={32} />}
              </div>

              <div className="space-y-1.5">
                <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B08401] font-bold">
                  Fixture Concluded
                </p>
                <h2 className="font-serif italic text-3xl text-[#683B2B]">
                  {gameState.endReason === 'abandonment'
                    ? 'Victory!'
                    : gameState.winner === 'draw'
                    ? 'Game Drawn'
                    : `${gameState.winner === 'w' ? 'White' : 'Black'} Triumphant!`}
                </h2>

                {gameState.endReason === 'abandonment' ? (
                  <p className="text-sm text-[#7A6658] font-sans">
                    Your opponent abandoned the match.<br />
                    <span className="text-xs text-[#9E8B7D]">Opponent disconnected for more than 50 seconds.</span>
                  </p>
                ) : gameState.endReason === 'agreement' ? (
                  <p className="text-sm text-[#7A6658] font-sans">
                    Both players have agreed to a draw.
                  </p>
                ) : (
                  <p className="text-sm text-[#7A6658] font-sans capitalize">
                    Reason: {gameState.endReason?.replace('_', ' ')}
                  </p>
                )}
              </div>

              {/* Match Summary Box */}
              <div className="bg-[#FAF6F2] border border-[#DED1BD] rounded-[14px] p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-cinzel text-[#7A6658] font-semibold">♔ White:</span>
                  <span className="font-serif font-medium text-[#683B2B]">{gameState.white?.name || 'White'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-cinzel text-[#7A6658] font-semibold">♚ Black:</span>
                  <span className="font-serif font-medium text-[#683B2B]">{gameState.black?.name || 'Black'}</span>
                </div>
                <div className="border-t border-[#DED1BD] pt-2 flex items-center justify-between text-xs">
                  <span className="font-cinzel text-[#B08401] font-bold">Official Score:</span>
                  <span className="font-cinzel text-sm font-bold text-[#683B2B]">
                    {gameState.winner === 'w' ? '1 – 0' : gameState.winner === 'b' ? '0 – 1' : '½ – ½'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {gameState.tournamentId ? (
                  <RoyalButton
                    to={`/tournaments/${gameState.tournamentId}`}
                    variant="primary"
                    className="flex-1 justify-center"
                  >
                    Return to Tournament
                  </RoyalButton>
                ) : (
                  <RoyalButton
                    to="/arena"
                    variant="primary"
                    className="flex-1 justify-center"
                  >
                    Return to Lobby
                  </RoyalButton>
                )}
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2.5 rounded-full border border-[#DED1BD] bg-[#FFFFFF] hover:bg-[#FAF6F2] text-xs font-cinzel text-[#7A6658] font-semibold transition"
                >
                  Review Board
                </button>
              </div>
            </RoyalCard>
          </div>
        )}

        {/* Promotion Dialog */}
        {promotionPending && (
          <div className="fixed inset-0 z-50 bg-[#683B2B]/40 flex items-center justify-center p-4 backdrop-blur-sm">
            <RoyalCard className="max-w-sm w-full text-center space-y-4 shadow-xl border border-[#DED1BD]">
              <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#B08401] font-semibold">
                Pawn Metamorphosis
              </p>
              <h3 className="font-serif italic text-2xl text-[#683B2B]">
                Select Promotion Piece
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { type: 'q', name: 'Queen', sym: myRole === 'w' ? '♕' : '♛' },
                  { type: 'r', name: 'Rook', sym: myRole === 'w' ? '♖' : '♜' },
                  { type: 'b', name: 'Bishop', sym: myRole === 'w' ? '♗' : '♝' },
                  { type: 'n', name: 'Knight', sym: myRole === 'w' ? '♘' : '♞' },
                ].map((p) => (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => executeMove(promotionPending.from, promotionPending.to, p.type)}
                    className="p-3 bg-[#FAF6F2] hover:bg-[#DED1BD] border border-[#DED1BD] rounded-[12px] text-3xl transition flex flex-col items-center gap-1 active:scale-95 shadow-sm text-[#683B2B]"
                  >
                    <span>{p.sym}</span>
                    <span className="font-cinzel text-[10px] text-[#7A6658] font-semibold">{p.name}</span>
                  </button>
                ))}
              </div>
            </RoyalCard>
          </div>
        )}

        {/* Live Game Arena Layout */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
          {/* Left/Center: Chessboard & Clocks */}
          <div className="flex flex-col items-center space-y-3 w-full max-w-[min(100vw-32px,520px)]">
            {/* Opponent Card & Clock */}
            <RoyalCard className="w-full p-3.5 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl text-[#B08401]">{isWhite ? '♚' : '♔'}</span>
                <div>
                  <p className="font-serif font-medium text-sm text-[#683B2B] truncate max-w-[150px] sm:max-w-[200px]">
                    {opponent?.name || (gameState?.status === 'waiting' ? 'Waiting for opponent…' : 'Opponent')}
                  </p>
                  <p className="font-cinzel text-[10px] text-[#7A6658]">
                    {isWhite ? 'Black' : 'White'} • {opponent?.connected ? '🟢 Connected' : '🔴 Disconnected'}
                  </p>
                </div>
              </div>

              {/* Opponent Clock */}
              <div
                className={`font-cinzel text-xl sm:text-2xl px-4 py-1.5 rounded-[12px] border font-bold transition-all ${
                  gameState?.turn === (isWhite ? 'b' : 'w')
                    ? opponentClock < 30
                      ? 'border-[#9E3B3B] bg-[#9E3B3B]/10 text-[#9E3B3B] animate-pulse shadow-sm'
                      : 'border-[#B08401] bg-[#FAF6F2] text-[#B08401] shadow-sm'
                    : 'border-[#DED1BD] bg-[#FAF6F2] text-[#7A6658]'
                }`}
              >
                {formatClock(opponentClock)}
              </div>
            </RoyalCard>

            {/* Chess Board */}
            {renderBoard()}

            {/* Player Card (You) & Clock */}
            <RoyalCard className="w-full p-3.5 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl text-[#B08401]">{isWhite ? '♔' : '♚'}</span>
                <div>
                  <p className="font-serif font-medium text-sm text-[#683B2B] truncate max-w-[150px] sm:max-w-[200px]">
                    {me?.name || playerName} {isSpectator && '(Spectator)'}
                  </p>
                  <p className="font-cinzel text-[10px] text-[#7A6658]">
                    {isSpectator ? 'Spectating' : isWhite ? 'White (You)' : 'Black (You)'} • 🟢 Active
                  </p>
                </div>
              </div>

              {/* Player Clock */}
              <div
                className={`font-cinzel text-xl sm:text-2xl px-4 py-1.5 rounded-[12px] border font-bold transition-all ${
                  gameState?.turn === myRole
                    ? myClock < 30
                      ? 'border-[#9E3B3B] bg-[#9E3B3B]/10 text-[#9E3B3B] animate-pulse shadow-sm'
                      : 'border-[#B08401] bg-[#FAF6F2] text-[#B08401] shadow-sm'
                    : 'border-[#DED1BD] bg-[#FAF6F2] text-[#7A6658]'
                }`}
              >
                {formatClock(myClock)}
              </div>
            </RoyalCard>

            {/* In-game action controls */}
            {!isSpectator && gameState?.status === 'in_progress' && (
              <div className="w-full flex gap-2">
                <button
                  type="button"
                  onClick={handleOfferDraw}
                  disabled={drawOfferSent || gameState?.drawOffer !== null}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-[#DED1BD] bg-[#FFFFFF] hover:bg-[#FAF6F2] font-cinzel text-xs text-[#683B2B] transition shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HeartHandshake size={15} className="text-[#B08401]" />
                  <span>{drawOfferSent ? 'Draw Offered…' : 'Offer Draw'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResign}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-[#9E3B3B]/30 bg-[#FFFFFF] hover:bg-[#9E3B3B]/10 font-cinzel text-xs text-[#9E3B3B] transition shadow-sm font-semibold"
                >
                  <Flag size={15} />
                  <span>Resign</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipped(!flipped)}
                  className="px-4 py-2.5 rounded-full border border-[#DED1BD] bg-[#FFFFFF] hover:bg-[#FAF6F2] font-cinzel text-xs text-[#7A6658] hover:text-[#683B2B] transition shadow-sm"
                  title="Flip Board"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Move Notation & Game Status */}
          <div className="w-full lg:w-80 space-y-5">
            {/* Game Status Card */}
            <RoyalCard className="space-y-4">
              <span className="font-cinzel text-xs uppercase tracking-wider text-[#B08401] block border-b border-[#DED1BD] pb-2 font-semibold">
                Arbiter Clock & State
              </span>

              {gameState?.status === 'waiting' && (
                <div className="text-center py-4 space-y-3">
                  <div className="text-3xl animate-bounce">⏳</div>
                  <h4 className="font-serif italic text-lg text-[#683B2B]">
                    Awaiting Challenger…
                  </h4>
                  <p className="text-xs text-[#7A6658]">
                    Distribute this match challenge link to initiate live multiplayer arbitration:
                  </p>
                  <CopyButton
                    text={typeof window !== 'undefined' ? window.location.href : ''}
                    label="Copy Challenge Link"
                    variant="primary"
                    className="w-full justify-center"
                    successMessage="Challenge link copied!"
                  />
                </div>
              )}

              {gameState?.status === 'in_progress' && (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-cinzel text-[#7A6658] font-semibold">Turn to Move:</span>
                  <span className="font-cinzel text-sm text-[#683B2B] font-bold flex items-center gap-1.5">
                    {gameState.turn === 'w' ? '♔ White' : '♚ Black'}
                    {gameState.isCheck && <span className="text-[#9E3B3B] font-bold">(Check!)</span>}
                  </span>
                </div>
              )}

              {gameState?.status === 'completed' && (
                <div className="rounded-[14px] border border-[#B08401] bg-[#FAF6F2] p-5 text-center space-y-3 shadow-sm">
                  <div className="text-3xl">🏆</div>
                  <h4 className="font-serif italic text-2xl text-[#683B2B]">
                    {gameState.winner === 'draw'
                      ? 'Game Concluded in Draw'
                      : `${gameState.winner === 'w' ? 'White' : 'Black'} Triumphant!`}
                  </h4>
                  <p className="font-cinzel text-xs text-[#7A6658] capitalize font-semibold">
                    Reason: {gameState.endReason?.replace('_', ' ')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowResultModal(true)}
                    className="w-full py-2 px-4 rounded-full bg-[#B08401] text-[#FAF6F2] font-cinzel text-xs font-semibold shadow-sm hover:bg-[#997200] transition"
                  >
                    View Official Result
                  </button>
                </div>
              )}
            </RoyalCard>

            {/* Move Notation Card */}
            <RoyalCard className="space-y-3">
              <span className="font-cinzel text-xs uppercase tracking-wider text-[#B08401] block border-b border-[#DED1BD] pb-2 font-semibold">
                Move Notation (PGN)
              </span>
              <div className="max-h-72 overflow-y-auto space-y-1 font-mono text-xs pr-1 divide-y divide-[#DED1BD]">
                {gameState?.moves.length === 0 ? (
                  <p className="text-[#7A6658] font-cinzel text-xs text-center py-4">
                    First move pending
                  </p>
                ) : (
                  Array.from({ length: Math.ceil((gameState?.moves.length || 0) / 2) }).map((_, i) => {
                    const whiteMove = gameState?.moves[i * 2]
                    const blackMove = gameState?.moves[i * 2 + 1]
                    return (
                      <div key={i} className="flex py-1.5 px-2 rounded hover:bg-[#FAF6F2] transition">
                        <span className="font-cinzel text-[#B08401] w-8 font-bold">{i + 1}.</span>
                        <span className="text-[#683B2B] flex-1 font-medium">{whiteMove?.san || ''}</span>
                        <span className="text-[#7A6658] flex-1">{blackMove?.san || ''}</span>
                      </div>
                    )
                  })
                )}
              </div>
            </RoyalCard>
          </div>
        </main>

        <RoyalFooter />
      </div>
    )
  }

  // Lobby View (No Room ID)
  return (
    <div className="min-h-screen bg-[#FAF6F2] text-[#683B2B] font-sans flex flex-col selection:bg-[#B08401]/25 selection:text-[#683B2B]">
      <RoyalHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Editorial Hero Banner */}
        <div className="space-y-4 border-b border-[#DED1BD] pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#DED1BD] bg-[#FFFFFF] shadow-sm">
            <Swords size={14} className="text-[#B08401]" />
            <span className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B08401] font-semibold">
              Live Championship Arena
            </span>
          </div>

          <h1 className="font-serif italic font-normal text-3xl sm:text-4xl lg:text-5xl text-[#683B2B] tracking-tight">
            Grandmaster <span className="text-[#B08401]">Online Arena</span>
          </h1>

          <p className="text-sm sm:text-base text-[#7A6658] max-w-3xl leading-relaxed font-sans">
            Execute live chess fixtures with authoritative move legality verification, synchronized Fischer decrement clocks, spectator broadcasts, and instant challenge links.
          </p>
        </div>

        {/* Main Grid: Create Match & Active Matches */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Match Column */}
          <RoyalCard className="lg:col-span-1 space-y-6">
            <div className="border-b border-[#DED1BD] pb-3">
              <p className="font-cinzel text-xs uppercase tracking-wider text-[#B08401] font-semibold">
                Arena Genesis
              </p>
              <h2 className="font-serif italic text-2xl text-[#683B2B] mt-0.5">
                Issue a Challenge
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] block font-semibold">
                  Competitor Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DED1BD] rounded-[12px] px-3.5 py-2 text-sm text-[#683B2B] placeholder-[#9E8B7D] focus:outline-none focus:border-[#B08401] transition font-sans shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] block font-semibold">
                  Time Control
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '10+0', label: 'Rapid 10+0' },
                    { id: '5+3', label: 'Blitz 5+3' },
                    { id: '3+2', label: 'Blitz 3+2' },
                    { id: '1+0', label: 'Bullet 1+0' },
                    { id: 'untimed', label: 'Untimed' },
                  ].map((tc) => (
                    <button
                      key={tc.id}
                      type="button"
                      onClick={() => setTimePreset(tc.id as any)}
                      className={`py-2 px-3 rounded-[12px] font-cinzel text-xs transition border font-semibold ${
                        timePreset === tc.id
                          ? 'border-[#B08401] bg-[#B08401] text-[#FAF6F2] shadow-sm'
                          : 'border-[#DED1BD] bg-[#FFFFFF] text-[#7A6658] hover:border-[#683B2B]'
                      }`}
                    >
                      {tc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] block font-semibold">
                  Color Assignment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'random', label: 'Random', icon: '🎲' },
                    { id: 'w', label: 'White', icon: '♔' },
                    { id: 'b', label: 'Black', icon: '♚' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColorPref(c.id as any)}
                      className={`py-2 px-2 rounded-[12px] font-cinzel text-xs transition flex flex-col items-center gap-1 border font-semibold ${
                        colorPref === c.id
                          ? 'border-[#B08401] bg-[#B08401] text-[#FAF6F2] shadow-sm'
                          : 'border-[#DED1BD] bg-[#FFFFFF] text-[#7A6658] hover:border-[#683B2B]'
                      }`}
                    >
                      <span className="text-base">{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <RoyalButton
                type="button"
                variant="primary"
                onClick={handleCreateMatch}
                disabled={creating || !playerName.trim()}
                className="w-full justify-center"
              >
                {creating ? 'Constituting Arena…' : 'Issue Live Challenge →'}
              </RoyalButton>
            </div>

            {/* Direct Join by Room ID */}
            <div className="pt-4 border-t border-[#DED1BD] space-y-2">
              <label className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] block font-semibold">
                Direct Fixture Teleport
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. arena-abc123"
                  value={directRoomInput}
                  onChange={(e) => setDirectRoomInput(e.target.value)}
                  className="flex-1 bg-[#FFFFFF] border border-[#DED1BD] rounded-[12px] px-3.5 py-1.5 text-xs text-[#683B2B] placeholder-[#9E8B7D] focus:outline-none focus:border-[#B08401] font-mono shadow-inner"
                />
                <RoyalButton
                  type="button"
                  variant="secondary"
                  onClick={() => directRoomInput.trim() && navigate(`/arena/${directRoomInput.trim()}`)}
                  className="text-xs py-1.5 px-4"
                >
                  Join
                </RoyalButton>
              </div>
            </div>
          </RoyalCard>

          {/* Active Matches Column */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between border-b border-[#DED1BD] pb-3">
              <div>
                <p className="font-cinzel text-xs uppercase tracking-wider text-[#B08401] font-semibold">
                  Continuous Arbitration
                </p>
                <h2 className="font-serif italic text-2xl text-[#683B2B]">
                  Active Grandmaster Matches
                </h2>
              </div>
              <button
                type="button"
                onClick={fetchActiveMatches}
                className="font-cinzel text-xs text-[#B08401] hover:underline inline-flex items-center gap-1.5 font-semibold"
              >
                <RefreshCw size={12} />
                <span>Synchronize</span>
              </button>
            </div>

            {activeMatches.length === 0 ? (
              <RoyalEmpty
                title="No Active Arena Games"
                description="No public matches are underway right now. Issue a new challenge on the left to start."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMatches.map((m: any) => (
                  <RoyalCard key={m.id} className="space-y-4">
                    <div className="flex items-center justify-between text-xs border-b border-[#DED1BD] pb-2">
                      <span className="font-mono text-xs text-[#7A6658]">{m.id}</span>
                      <span
                        className={`font-cinzel text-[10px] px-2.5 py-0.5 rounded-full border uppercase font-bold ${
                          m.status === 'waiting'
                            ? 'border-[#B08401]/40 bg-[#B08401]/10 text-[#B08401]'
                            : m.status === 'in_progress'
                            ? 'border-[#5B6E57]/40 bg-[#5B6E57]/10 text-[#5B6E57]'
                            : 'border-[#DED1BD] bg-[#FAF6F2] text-[#7A6658]'
                        }`}
                      >
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-cinzel text-xs text-[#7A6658] font-semibold">♔ White:</span>
                        <span className="font-serif text-[#683B2B] truncate font-medium">{m.whiteName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-cinzel text-xs text-[#7A6658] font-semibold">♚ Black:</span>
                        <span className="font-serif text-[#683B2B] truncate font-medium">{m.blackName}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#DED1BD] text-xs">
                      <span className="font-cinzel text-xs text-[#7A6658]">⏱ {m.timeControl}</span>
                      <RoyalButton
                        to={`/arena/${m.id}`}
                        variant={m.status === 'waiting' ? 'primary' : 'secondary'}
                        className="text-xs py-1 px-3.5"
                      >
                        {m.status === 'waiting' ? 'Accept Challenge →' : 'Spectate 👁'}
                      </RoyalButton>
                    </div>
                  </RoyalCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <RoyalFooter />
    </div>
  )
}
