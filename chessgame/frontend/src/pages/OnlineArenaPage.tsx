import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
import { Swords, RefreshCw, RotateCcw, Flag, HeartHandshake } from 'lucide-react'
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
  const navigate = useNavigate()

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
    })

    socket.on('arena:playerJoined', ({ game }: { game: ArenaGameState }) => {
      setGameState(game)
    })

    socket.on('arena:moveMade', ({ game }: { game: ArenaGameState }) => {
      setGameState(game)
      setWhiteClock(game.white?.timeLeft ?? 0)
      setBlackClock(game.black?.timeLeft ?? 0)
      chessRef.current.load(game.fen)
      setSelectedSquare(null)
      setLegalMoves([])
    })

    socket.on('arena:clockTick', ({ whiteTimeLeft, blackTimeLeft }: { whiteTimeLeft: number; blackTimeLeft: number }) => {
      setWhiteClock(whiteTimeLeft)
      setBlackClock(blackTimeLeft)
    })

    socket.on('arena:gameOver', ({ message, game }: any) => {
      setGameState(game)
      toast(message, { icon: '🏁', duration: 5000 })
    })

    socket.on('arena:drawOffered', ({ by }: { by: 'w' | 'b' }) => {
      if ((myRole === 'w' && by === 'b') || (myRole === 'b' && by === 'w')) {
        toast('Opponent has offered a draw!', { icon: '🤝' })
      }
    })

    socket.on('arena:drawDeclined', () => {
      toast('Draw offer was declined.', { icon: '❌' })
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
      socket.off('arena:error')
    }
  }, [socket, roomId, playerId, playerName])

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

    // If already clicked a square and clicking on a legal destination
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

    // Selecting a piece of player's own color
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

  const handleOfferDraw = () => {
    if (!socket || !roomId) return
    socket.emit('arena:drawOffer', { roomId, playerId })
    toast.success('Draw offered to opponent')
  }

  const handleRespondDraw = (accept: boolean) => {
    if (!socket || !roomId) return
    socket.emit('arena:drawResponse', { roomId, playerId, accept })
  }

  const formatClock = (seconds: number) => {
    if (seconds <= 0 && gameState?.timeControl.initial === 0) return '∞'
    const mins = Math.floor(Math.max(0, seconds) / 60)
    const secs = Math.floor(Math.max(0, seconds) % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Render Chessboard with Authentic Walnut & Maple Wooden Colors
  // Frame: #3D3024, Light: #E8DFCF (maple), Dark: #6E553E (walnut)
  const renderBoard = () => {
    const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]
    const files = flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

    const chess = chessRef.current
    const lastMove = gameState?.moves[gameState.moves.length - 1]

    return (
      <div className="grid grid-cols-8 grid-rows-8 w-full max-w-[min(100vw-32px,520px)] aspect-square rounded-[16px] overflow-hidden border-4 border-[#3D3024] shadow-md relative select-none bg-[#3D3024]">
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

            // Natural wood board tokens:
            // Light square: #E8DFCF
            // Dark square: #6E553E
            let bgColor = isDark ? 'bg-[#6E553E]' : 'bg-[#E8DFCF]'

            if (isLastMoveFrom || isLastMoveTo) {
              bgColor = isDark ? 'bg-[#886A4C]' : 'bg-[#D5C3A5]'
            }
            if (isSelected) {
              bgColor = 'bg-[#B18A52]/70'
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
                      isDark ? 'text-[#E8DFCF]/70' : 'text-[#6E553E]/70'
                    }`}
                  >
                    {r}
                  </span>
                )}
                {rIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 font-cinzel text-[9px] font-bold ${
                      isDark ? 'text-[#E8DFCF]/70' : 'text-[#6E553E]/70'
                    }`}
                  >
                    {f}
                  </span>
                )}

                {/* Piece rendering */}
                {piece && (
                  <span
                    className={`leading-none drop-shadow-sm cursor-pointer transform hover:scale-105 active:scale-95 transition-transform ${
                      piece.color === 'w'
                        ? 'text-[#FAF8F5] drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]'
                        : 'text-[#1C1815] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]'
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
                        ? 'w-full h-full border-4 border-[#B18A52]/80 ring-2 ring-[#B18A52]/40'
                        : 'w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#B18A52]/70 shadow-sm'
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
      <div className="min-h-screen bg-[#F4F0E8] text-[#241E19] font-sans flex flex-col selection:bg-[#B18A52]/20 selection:text-[#241E19]">
        <RoyalHeader />

        {/* Match Top Bar */}
        <div className="border-b border-[#E2D9CB] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/arena" className="font-cinzel text-xs text-[#786F66] hover:text-[#241E19] transition font-semibold">
                ← Exit to Lobby
              </Link>
              <span className="text-[#CEBEA8] text-xs">/</span>
              <span className="font-cinzel text-xs text-[#B18A52] font-bold">
                Room: <span className="font-mono text-[#241E19]">{roomId}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ConnectionBadge socket={socket} />
              <CopyButton
                text={typeof window !== 'undefined' ? window.location.href : ''}
                label="Share Match"
                variant="subtle"
                size="sm"
                successMessage="Match challenge link copied!"
              />
              <span className="font-cinzel text-xs text-[#786F66] hidden md:inline font-semibold">
                👁 {gameState?.spectatorsCount ?? 0} Spectating
              </span>
            </div>
          </div>
        </div>

        {/* Promotion Dialog */}
        {promotionPending && (
          <div className="fixed inset-0 z-50 bg-[#241E19]/70 flex items-center justify-center p-4 backdrop-blur-sm">
            <RoyalCard className="max-w-sm w-full text-center space-y-4 shadow-xl border border-[#CEBEA8]">
              <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#B18A52] font-semibold">
                Pawn Metamorphosis
              </p>
              <h3 className="font-serif italic text-2xl text-[#241E19]">
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
                    className="p-3 bg-[#FAF8F5] hover:bg-[#F4F0E8] border border-[#CEBEA8] rounded-[12px] text-3xl transition flex flex-col items-center gap-1 active:scale-95 shadow-sm"
                  >
                    <span>{p.sym}</span>
                    <span className="font-cinzel text-[10px] text-[#786F66] font-semibold">{p.name}</span>
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
                <span className="text-2xl text-[#B18A52]">{isWhite ? '♚' : '♔'}</span>
                <div>
                  <p className="font-serif font-medium text-sm text-[#241E19] truncate max-w-[150px] sm:max-w-[200px]">
                    {opponent?.name || (gameState?.status === 'waiting' ? 'Waiting for opponent…' : 'Opponent')}
                  </p>
                  <p className="font-cinzel text-[10px] text-[#786F66]">
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
                      : 'border-[#B18A52] bg-[#F4F0E8] text-[#241E19] shadow-sm'
                    : 'border-[#CEBEA8] bg-[#FAF8F5] text-[#786F66]'
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
                <span className="text-2xl text-[#B18A52]">{isWhite ? '♔' : '♚'}</span>
                <div>
                  <p className="font-serif font-medium text-sm text-[#241E19] truncate max-w-[150px] sm:max-w-[200px]">
                    {me?.name || playerName} {isSpectator && '(Spectator)'}
                  </p>
                  <p className="font-cinzel text-[10px] text-[#786F66]">
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
                      : 'border-[#B18A52] bg-[#F4F0E8] text-[#241E19] shadow-sm'
                    : 'border-[#CEBEA8] bg-[#FAF8F5] text-[#786F66]'
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
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-[#CEBEA8] bg-[#FAF8F5] hover:bg-[#F4F0E8] font-cinzel text-xs text-[#241E19] transition shadow-sm font-semibold"
                >
                  <HeartHandshake size={14} className="text-[#B18A52]" />
                  <span>Offer Draw</span>
                </button>
                <button
                  type="button"
                  onClick={handleResign}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-[#9E3B3B]/30 bg-[#FAF8F5] hover:bg-[#9E3B3B]/10 font-cinzel text-xs text-[#9E3B3B] transition shadow-sm font-semibold"
                >
                  <Flag size={14} />
                  <span>Resign</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipped(!flipped)}
                  className="px-4 py-2 rounded-full border border-[#CEBEA8] bg-[#FAF8F5] hover:bg-[#F4F0E8] font-cinzel text-xs text-[#786F66] hover:text-[#241E19] transition shadow-sm"
                  title="Flip Board"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}

            {/* Draw Offer Banner */}
            {gameState?.drawOffer && gameState.drawOffer !== myRole && !isSpectator && (
              <div className="w-full rounded-[14px] border border-[#B18A52] bg-[#FAF8F5] p-3.5 flex items-center justify-between shadow-sm">
                <span className="font-cinzel text-xs text-[#B18A52] font-semibold">
                  Opponent offers peace (Draw)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRespondDraw(true)}
                    className="font-cinzel text-xs px-3.5 py-1 rounded-full bg-[#5B6E57] text-[#FAF8F5] font-bold transition shadow-sm"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespondDraw(false)}
                    className="font-cinzel text-xs px-3.5 py-1 rounded-full border border-[#CEBEA8] text-[#241E19] hover:bg-[#F4F0E8] transition font-semibold"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Move Notation & Game Status */}
          <div className="w-full lg:w-80 space-y-5">
            {/* Game Status Card */}
            <RoyalCard className="space-y-4">
              <span className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] block border-b border-[#E2D9CB] pb-2 font-semibold">
                Arbiter Clock & State
              </span>

              {gameState?.status === 'waiting' && (
                <div className="text-center py-4 space-y-3">
                  <div className="text-3xl animate-bounce">⏳</div>
                  <h4 className="font-serif italic text-lg text-[#241E19]">
                    Awaiting Challenger…
                  </h4>
                  <p className="text-xs text-[#786F66]">
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
                  <span className="font-cinzel text-[#786F66] font-semibold">Turn to Move:</span>
                  <span className="font-cinzel text-sm text-[#241E19] font-bold flex items-center gap-1.5">
                    {gameState.turn === 'w' ? '♔ White' : '♚ Black'}
                    {gameState.isCheck && <span className="text-[#9E3B3B] font-bold">(Check!)</span>}
                  </span>
                </div>
              )}

              {gameState?.status === 'completed' && (
                <div className="rounded-[14px] border border-[#B18A52] bg-[#F4F0E8] p-5 text-center space-y-3 shadow-sm">
                  <div className="text-3xl">🏆</div>
                  <h4 className="font-serif italic text-2xl text-[#241E19]">
                    {gameState.winner === 'draw'
                      ? 'Game Concluded in Draw'
                      : `${gameState.winner === 'w' ? 'White' : 'Black'} Triumphant!`}
                  </h4>
                  <p className="font-cinzel text-xs text-[#786F66] capitalize font-semibold">
                    Reason: {gameState.endReason?.replace('_', ' ')}
                  </p>
                  <RoyalButton
                    to="/arena"
                    variant="primary"
                    className="w-full justify-center text-xs mt-2"
                  >
                    Enter New Challenge
                  </RoyalButton>
                </div>
              )}
            </RoyalCard>

            {/* Move Notation Card */}
            <RoyalCard className="space-y-3">
              <span className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] block border-b border-[#E2D9CB] pb-2 font-semibold">
                Move Notation (PGN)
              </span>
              <div className="max-h-72 overflow-y-auto space-y-1 font-mono text-xs pr-1 divide-y divide-[#E2D9CB]">
                {gameState?.moves.length === 0 ? (
                  <p className="text-[#786F66] font-cinzel text-xs text-center py-4">
                    First move pending
                  </p>
                ) : (
                  Array.from({ length: Math.ceil((gameState?.moves.length || 0) / 2) }).map((_, i) => {
                    const whiteMove = gameState?.moves[i * 2]
                    const blackMove = gameState?.moves[i * 2 + 1]
                    return (
                      <div key={i} className="flex py-1.5 px-2 rounded hover:bg-[#F4F0E8] transition">
                        <span className="font-cinzel text-[#B18A52] w-8 font-bold">{i + 1}.</span>
                        <span className="text-[#241E19] flex-1 font-medium">{whiteMove?.san || ''}</span>
                        <span className="text-[#786F66] flex-1">{blackMove?.san || ''}</span>
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
    <div className="min-h-screen bg-[#F4F0E8] text-[#241E19] font-sans flex flex-col selection:bg-[#B18A52]/20 selection:text-[#241E19]">
      <RoyalHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Editorial Hero Banner */}
        <div className="space-y-4 border-b border-[#E2D9CB] pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#CEBEA8] bg-[#FAF8F5] shadow-sm">
            <Swords size={14} className="text-[#B18A52]" />
            <span className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B18A52] font-semibold">
              Real-Time WebSocket Grid
            </span>
          </div>

          <h1 className="font-serif italic font-normal text-3xl sm:text-4xl lg:text-5xl text-[#241E19] tracking-tight">
            Grandmaster <span className="text-[#B18A52]">Online Arena</span>
          </h1>

          <p className="text-sm sm:text-base text-[#786F66] max-w-3xl leading-relaxed font-sans">
            Execute real-time chess fixtures with authoritative FIDE move legality verification, synchronized Fischer decrement clocks, spectator broadcasts, and instant challenge links.
          </p>
        </div>

        {/* Main Grid: Create Match & Active Matches */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Match Column */}
          <RoyalCard className="lg:col-span-1 space-y-6">
            <div className="border-b border-[#E2D9CB] pb-3">
              <p className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] font-semibold">
                Arena Genesis
              </p>
              <h2 className="font-serif italic text-2xl text-[#241E19] mt-0.5">
                Issue a Challenge
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
                  Competitor Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#CEBEA8] rounded-[12px] px-3.5 py-2 text-sm text-[#241E19] placeholder-[#786F66] focus:outline-none focus:border-[#B18A52] transition font-sans shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
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
                          ? 'border-[#241E19] bg-[#241E19] text-[#FAF8F5] shadow-sm'
                          : 'border-[#CEBEA8] bg-[#FAF8F5] text-[#786F66] hover:border-[#241E19]'
                      }`}
                    >
                      {tc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
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
                          ? 'border-[#241E19] bg-[#241E19] text-[#FAF8F5] shadow-sm'
                          : 'border-[#CEBEA8] bg-[#FAF8F5] text-[#786F66] hover:border-[#241E19]'
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
            <div className="pt-4 border-t border-[#E2D9CB] space-y-2">
              <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
                Direct Fixture Teleport
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. arena-abc123"
                  value={directRoomInput}
                  onChange={(e) => setDirectRoomInput(e.target.value)}
                  className="flex-1 bg-[#FAF8F5] border border-[#CEBEA8] rounded-[12px] px-3.5 py-1.5 text-xs text-[#241E19] placeholder-[#786F66] focus:outline-none focus:border-[#B18A52] font-mono shadow-inner"
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
            <div className="flex items-center justify-between border-b border-[#E2D9CB] pb-3">
              <div>
                <p className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] font-semibold">
                  Continuous Arbitration
                </p>
                <h2 className="font-serif italic text-2xl text-[#241E19]">
                  Active Grandmaster Matches
                </h2>
              </div>
              <button
                type="button"
                onClick={fetchActiveMatches}
                className="font-cinzel text-xs text-[#B18A52] hover:underline inline-flex items-center gap-1.5 font-semibold"
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
                    <div className="flex items-center justify-between text-xs border-b border-[#E2D9CB] pb-2">
                      <span className="font-mono text-xs text-[#786F66]">{m.id}</span>
                      <span
                        className={`font-cinzel text-[10px] px-2.5 py-0.5 rounded-full border uppercase font-bold ${
                          m.status === 'waiting'
                            ? 'border-[#B18A52]/40 bg-[#B18A52]/10 text-[#B18A52]'
                            : m.status === 'in_progress'
                            ? 'border-[#5B6E57]/40 bg-[#5B6E57]/10 text-[#5B6E57]'
                            : 'border-[#CEBEA8] bg-[#FAF8F5] text-[#786F66]'
                        }`}
                      >
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-cinzel text-xs text-[#786F66] font-semibold">♔ White:</span>
                        <span className="font-serif text-[#241E19] truncate font-medium">{m.whiteName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-cinzel text-xs text-[#786F66] font-semibold">♚ Black:</span>
                        <span className="font-serif text-[#241E19] truncate font-medium">{m.blackName}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#E2D9CB] text-xs">
                      <span className="font-cinzel text-xs text-[#786F66]">⏱ {m.timeControl}</span>
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
