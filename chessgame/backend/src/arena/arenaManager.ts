import { Chess } from 'chess.js';
import { Server } from 'socket.io';

export interface PlayerInfo {
  id: string;
  name: string;
  socketId: string;
  color: 'w' | 'b';
  timeLeft: number; // in seconds
  connected: boolean;
}

export interface ArenaMove {
  san: string;
  from: string;
  to: string;
  promotion?: string;
  fen: string;
  whiteTimeLeft: number;
  blackTimeLeft: number;
  timestamp: number;
}

export interface ArenaGame {
  id: string;
  white: PlayerInfo | null;
  black: PlayerInfo | null;
  spectators: { id: string; name: string; socketId: string }[];
  chess: Chess;
  timeControl: {
    initial: number; // seconds
    increment: number; // seconds
  };
  status: 'waiting' | 'in_progress' | 'completed' | 'aborted';
  winner: 'w' | 'b' | 'draw' | null;
  endReason: string | null;
  moves: ArenaMove[];
  drawOffer: 'w' | 'b' | null;
  lastMoveTimestamp: number | null;
  createdAt: number;
  tournamentId?: string | null;
  matchId?: string | null;
  disconnectTimer?: {
    disconnectedColor: 'w' | 'b';
    secondsLeft: number;
    interval: NodeJS.Timeout;
  } | null;
}

class ArenaManager {
  private games: Map<string, ArenaGame> = new Map();
  private socketToPlayer: Map<string, { roomId: string; playerId: string }> = new Map();
  private timerIntervals: Map<string, NodeJS.Timeout> = new Map();
  private io: Server | null = null;

  setIO(io: Server) {
    this.io = io;
  }

  createGame(params: {
    roomId?: string;
    timeControl: { initial: number; increment: number };
    creatorName: string;
    creatorId: string;
    socketId: string;
    preferredColor?: 'w' | 'b' | 'random';
    tournamentId?: string;
    matchId?: string;
  }): { game: ArenaGame; playerColor: 'w' | 'b' } {
    const roomId = params.roomId || ('arena-' + Math.random().toString(36).substring(2, 9));

    // If game already exists (e.g. bound to tournament match)
    const existingGame = this.games.get(roomId);
    if (existingGame) {
      const assigned = existingGame.white?.id === params.creatorId ? 'w' : 'b';
      return { game: existingGame, playerColor: assigned };
    }

    const chess = new Chess();

    let assignedColor: 'w' | 'b' = 'w';
    if (params.preferredColor === 'b') {
      assignedColor = 'b';
    } else if (params.preferredColor === 'random') {
      assignedColor = Math.random() < 0.5 ? 'w' : 'b';
    }

    const creator: PlayerInfo = {
      id: params.creatorId,
      name: params.creatorName,
      socketId: params.socketId,
      color: assignedColor,
      timeLeft: params.timeControl.initial,
      connected: true,
    };

    const game: ArenaGame = {
      id: roomId,
      white: assignedColor === 'w' ? creator : null,
      black: assignedColor === 'b' ? creator : null,
      spectators: [],
      chess,
      timeControl: params.timeControl,
      status: 'waiting',
      winner: null,
      endReason: null,
      moves: [],
      drawOffer: null,
      lastMoveTimestamp: null,
      createdAt: Date.now(),
      tournamentId: params.tournamentId || null,
      matchId: params.matchId || null,
      disconnectTimer: null,
    };

    this.games.set(roomId, game);
    this.socketToPlayer.set(params.socketId, { roomId, playerId: params.creatorId });

    return { game, playerColor: assignedColor };
  }

  joinGame(
    roomId: string,
    player: { id: string; name: string; socketId: string }
  ): { game: ArenaGame; role: 'w' | 'b' | 'spectator' } | null {
    const game = this.games.get(roomId);
    if (!game) return null;

    // Check if player is already white or black (reconnecting)
    if (game.white && game.white.id === player.id) {
      game.white.socketId = player.socketId;
      game.white.connected = true;
      this.socketToPlayer.set(player.socketId, { roomId, playerId: player.id });

      // Cancel disconnection countdown if white was disconnected
      if (game.disconnectTimer && game.disconnectTimer.disconnectedColor === 'w') {
        clearInterval(game.disconnectTimer.interval);
        game.disconnectTimer = null;
        if (this.io) {
          this.io.to(`arena:${roomId}`).emit('arena:playerReconnected', {
            reconnectedColor: 'w',
          });
        }
      }

      return { game, role: 'w' };
    }
    if (game.black && game.black.id === player.id) {
      game.black.socketId = player.socketId;
      game.black.connected = true;
      this.socketToPlayer.set(player.socketId, { roomId, playerId: player.id });

      // Cancel disconnection countdown if black was disconnected
      if (game.disconnectTimer && game.disconnectTimer.disconnectedColor === 'b') {
        clearInterval(game.disconnectTimer.interval);
        game.disconnectTimer = null;
        if (this.io) {
          this.io.to(`arena:${roomId}`).emit('arena:playerReconnected', {
            reconnectedColor: 'b',
          });
        }
      }

      return { game, role: 'b' };
    }

    // If waiting for opponent
    if (game.status === 'waiting') {
      const openColor: 'w' | 'b' = game.white === null ? 'w' : 'b';
      const newPlayer: PlayerInfo = {
        id: player.id,
        name: player.name,
        socketId: player.socketId,
        color: openColor,
        timeLeft: game.timeControl.initial,
        connected: true,
      };

      if (openColor === 'w') {
        game.white = newPlayer;
      } else {
        game.black = newPlayer;
      }

      game.status = 'in_progress';
      game.lastMoveTimestamp = Date.now();
      this.socketToPlayer.set(player.socketId, { roomId, playerId: player.id });

      // Start clock timer if timed game
      this.startClock(roomId);

      return { game, role: openColor };
    }

    // Join as spectator
    const existing = game.spectators.find((s) => s.id === player.id);
    if (existing) {
      existing.socketId = player.socketId;
    } else {
      game.spectators.push({ id: player.id, name: player.name, socketId: player.socketId });
    }
    this.socketToPlayer.set(player.socketId, { roomId, playerId: player.id });

    return { game, role: 'spectator' };
  }

  private startClock(roomId: string) {
    if (this.timerIntervals.has(roomId)) {
      clearInterval(this.timerIntervals.get(roomId)!);
    }

    const interval = setInterval(() => {
      const game = this.games.get(roomId);
      if (!game || game.status !== 'in_progress') {
        clearInterval(interval);
        this.timerIntervals.delete(roomId);
        return;
      }

      // If untimed game (initial <= 0), no countdown
      if (game.timeControl.initial <= 0) return;

      const activeColor = game.chess.turn(); // 'w' or 'b'
      const activePlayer = activeColor === 'w' ? game.white : game.black;

      if (activePlayer) {
        activePlayer.timeLeft = Math.max(0, activePlayer.timeLeft - 1);

        if (activePlayer.timeLeft <= 0) {
          // Timeout flag fall
          this.handleTimeout(roomId, activeColor);
          clearInterval(interval);
          this.timerIntervals.delete(roomId);
        } else if (this.io) {
          // Broadcast clock tick every second
          this.io.to(`arena:${roomId}`).emit('arena:clockTick', {
            whiteTimeLeft: game.white?.timeLeft ?? 0,
            blackTimeLeft: game.black?.timeLeft ?? 0,
            turn: activeColor,
          });
        }
      }
    }, 1000);

    this.timerIntervals.set(roomId, interval);
  }

  private handleTimeout(roomId: string, flaggedColor: 'w' | 'b') {
    const game = this.games.get(roomId);
    if (!game || game.status !== 'in_progress') return;

    game.status = 'completed';
    game.winner = flaggedColor === 'w' ? 'b' : 'w';
    game.endReason = 'timeout';

    if (game.disconnectTimer) {
      clearInterval(game.disconnectTimer.interval);
      game.disconnectTimer = null;
    }

    const publicState = this.getPublicGameState(game);

    if (this.io) {
      this.io.to(`arena:${roomId}`).emit('arena:gameOver', {
        winner: game.winner,
        endReason: 'timeout',
        message: `${flaggedColor === 'w' ? 'White' : 'Black'} ran out of time!`,
        game: publicState,
      });
    }

    this.recordTournamentResult(game);
  }

  makeMove(
    roomId: string,
    playerId: string,
    move: { from: string; to: string; promotion?: string }
  ): { success: boolean; game?: any; error?: string } {
    const game = this.games.get(roomId);
    if (!game) return { success: false, error: 'Game not found' };
    if (game.status !== 'in_progress') return { success: false, error: 'Game is not active' };

    const currentTurn = game.chess.turn(); // 'w' | 'b'
    const playerColor = game.white?.id === playerId ? 'w' : game.black?.id === playerId ? 'b' : null;

    if (!playerColor) return { success: false, error: 'You are not a player in this game' };
    if (playerColor !== currentTurn) return { success: false, error: 'Not your turn' };

    try {
      const result = game.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q',
      });

      if (!result) {
        return { success: false, error: 'Illegal move' };
      }

      // Add increment to the player who just moved
      const movedPlayer = playerColor === 'w' ? game.white : game.black;
      if (movedPlayer && game.timeControl.increment > 0) {
        movedPlayer.timeLeft += game.timeControl.increment;
      }

      game.lastMoveTimestamp = Date.now();

      // Record move
      const arenaMove: ArenaMove = {
        san: result.san,
        from: result.from,
        to: result.to,
        promotion: result.promotion,
        fen: game.chess.fen(),
        whiteTimeLeft: game.white?.timeLeft ?? 0,
        blackTimeLeft: game.black?.timeLeft ?? 0,
        timestamp: Date.now(),
      };
      game.moves.push(arenaMove);
      game.drawOffer = null; // Clear any pending draw offer on move

      // Check game termination states
      if (game.chess.isCheckmate()) {
        game.status = 'completed';
        game.winner = playerColor;
        game.endReason = 'checkmate';
      } else if (game.chess.isDraw()) {
        game.status = 'completed';
        game.winner = 'draw';
        if (game.chess.isStalemate()) game.endReason = 'stalemate';
        else if (game.chess.isThreefoldRepetition()) game.endReason = 'threefold_repetition';
        else if (game.chess.isInsufficientMaterial()) game.endReason = 'insufficient_material';
        else game.endReason = 'fifty_move_rule';
      }

      if (game.status === 'completed') {
        if (this.timerIntervals.has(roomId)) {
          clearInterval(this.timerIntervals.get(roomId)!);
          this.timerIntervals.delete(roomId);
        }
        if (game.disconnectTimer) {
          clearInterval(game.disconnectTimer.interval);
          game.disconnectTimer = null;
        }
      }

      const publicState = this.getPublicGameState(game);

      if (this.io) {
        this.io.to(`arena:${roomId}`).emit('arena:moveMade', {
          move: arenaMove,
          fen: game.chess.fen(),
          turn: game.chess.turn(),
          isCheck: game.chess.inCheck(),
          isGameOver: game.status === 'completed',
          winner: game.winner,
          endReason: game.endReason,
          game: publicState,
        });

        if (game.status === 'completed') {
          this.io.to(`arena:${roomId}`).emit('arena:gameOver', {
            winner: game.winner,
            endReason: game.endReason,
            message:
              game.endReason === 'checkmate'
                ? `Checkmate! ${game.winner === 'w' ? 'White' : 'Black'} wins!`
                : `Game drawn by ${game.endReason}!`,
            game: publicState,
          });
        }
      }

      if (game.status === 'completed') {
        this.recordTournamentResult(game);
      }

      return { success: true, game: publicState };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid move' };
    }
  }

  resign(roomId: string, playerId: string): { success: boolean; game?: any; error?: string } {
    const game = this.games.get(roomId);
    if (!game || game.status !== 'in_progress') return { success: false, error: 'Cannot resign' };

    const playerColor = game.white?.id === playerId ? 'w' : game.black?.id === playerId ? 'b' : null;
    if (!playerColor) return { success: false, error: 'Not a player in this game' };

    game.status = 'completed';
    game.winner = playerColor === 'w' ? 'b' : 'w';
    game.endReason = 'resignation';

    if (this.timerIntervals.has(roomId)) {
      clearInterval(this.timerIntervals.get(roomId)!);
      this.timerIntervals.delete(roomId);
    }
    if (game.disconnectTimer) {
      clearInterval(game.disconnectTimer.interval);
      game.disconnectTimer = null;
    }

    const publicState = this.getPublicGameState(game);

    if (this.io) {
      this.io.to(`arena:${roomId}`).emit('arena:gameOver', {
        winner: game.winner,
        endReason: 'resignation',
        message: `${playerColor === 'w' ? 'White' : 'Black'} resigned.`,
        game: publicState,
      });
    }

    this.recordTournamentResult(game);

    return { success: true, game: publicState };
  }

  offerDraw(roomId: string, playerId: string): { success: boolean; error?: string } {
    const game = this.games.get(roomId);
    if (!game || game.status !== 'in_progress') return { success: false, error: 'Cannot offer draw' };

    // Prevent repeated draw offer spam
    if (game.drawOffer !== null) {
      return { success: false, error: 'A draw offer is already pending' };
    }

    const playerColor = game.white?.id === playerId ? 'w' : game.black?.id === playerId ? 'b' : null;
    if (!playerColor) return { success: false, error: 'Not a player in this game' };

    game.drawOffer = playerColor;

    if (this.io) {
      this.io.to(`arena:${roomId}`).emit('arena:drawOffered', {
        by: playerColor,
      });
    }

    return { success: true };
  }

  respondDraw(
    roomId: string,
    playerId: string,
    accept: boolean
  ): { success: boolean; game?: any; error?: string } {
    const game = this.games.get(roomId);
    if (!game || game.status !== 'in_progress' || !game.drawOffer) {
      return { success: false, error: 'No draw offer to respond to' };
    }

    const playerColor = game.white?.id === playerId ? 'w' : game.black?.id === playerId ? 'b' : null;
    if (!playerColor || playerColor === game.drawOffer) {
      return { success: false, error: 'Invalid draw response' };
    }

    if (accept) {
      game.status = 'completed';
      game.winner = 'draw';
      game.endReason = 'agreement';
      game.drawOffer = null;

      if (this.timerIntervals.has(roomId)) {
        clearInterval(this.timerIntervals.get(roomId)!);
        this.timerIntervals.delete(roomId);
      }
      if (game.disconnectTimer) {
        clearInterval(game.disconnectTimer.interval);
        game.disconnectTimer = null;
      }

      const publicState = this.getPublicGameState(game);

      if (this.io) {
        this.io.to(`arena:${roomId}`).emit('arena:gameOver', {
          winner: 'draw',
          endReason: 'agreement',
          message: 'Both players have agreed to a draw.',
          game: publicState,
        });
      }

      this.recordTournamentResult(game);

      return { success: true, game: publicState };
    } else {
      const rejectingColor = playerColor;
      game.drawOffer = null;

      if (this.io) {
        this.io.to(`arena:${roomId}`).emit('arena:drawDeclined', {
          by: rejectingColor,
          message: 'Draw offer rejected.',
        });
      }
      return { success: true, game: this.getPublicGameState(game) };
    }
  }

  handleDisconnect(socketId: string) {
    const ref = this.socketToPlayer.get(socketId);
    if (!ref) return;

    const game = this.games.get(ref.roomId);
    if (!game) return;

    let disconnectedColor: 'w' | 'b' | null = null;
    if (game.white?.socketId === socketId) {
      game.white.connected = false;
      disconnectedColor = 'w';
    } else if (game.black?.socketId === socketId) {
      game.black.connected = false;
      disconnectedColor = 'b';
    } else {
      game.spectators = game.spectators.filter((s) => s.socketId !== socketId);
    }

    if (this.io) {
      this.io.to(`arena:${ref.roomId}`).emit('arena:playerConnectionStatus', {
        whiteConnected: game.white?.connected ?? false,
        blackConnected: game.black?.connected ?? false,
        spectatorCount: game.spectators.length,
      });
    }

    this.socketToPlayer.delete(socketId);

    // If game is in progress and a player disconnected, start authoritative 50s countdown
    if (game.status === 'in_progress' && disconnectedColor) {
      // Clear previous disconnect timer if any
      if (game.disconnectTimer) {
        clearInterval(game.disconnectTimer.interval);
        game.disconnectTimer = null;
      }

      let secondsLeft = 50;
      const targetColor = disconnectedColor;

      // Broadcast initial 50-second disconnection notification
      if (this.io) {
        this.io.to(`arena:${ref.roomId}`).emit('arena:disconnectCountdown', {
          disconnectedColor: targetColor,
          secondsLeft,
        });
      }

      const interval = setInterval(() => {
        const currentGame = this.games.get(ref.roomId);
        if (!currentGame || currentGame.status !== 'in_progress') {
          clearInterval(interval);
          return;
        }

        secondsLeft -= 1;
        if (secondsLeft > 0) {
          if (this.io) {
            this.io.to(`arena:${ref.roomId}`).emit('arena:disconnectCountdown', {
              disconnectedColor: targetColor,
              secondsLeft,
            });
          }
        } else {
          // 50 SECONDS EXPIRED -> AUTOMATIC ABANDONMENT FORFEIT
          clearInterval(interval);
          currentGame.disconnectTimer = null;
          this.handleAbandonment(ref.roomId, targetColor);
        }
      }, 1000);

      game.disconnectTimer = {
        disconnectedColor: targetColor,
        secondsLeft,
        interval,
      };
    }
  }

  private handleAbandonment(roomId: string, disconnectedColor: 'w' | 'b') {
    const game = this.games.get(roomId);
    if (!game || game.status !== 'in_progress') return;

    game.status = 'completed';
    game.winner = disconnectedColor === 'w' ? 'b' : 'w';
    game.endReason = 'abandonment';

    if (this.timerIntervals.has(roomId)) {
      clearInterval(this.timerIntervals.get(roomId)!);
      this.timerIntervals.delete(roomId);
    }
    if (game.disconnectTimer) {
      clearInterval(game.disconnectTimer.interval);
      game.disconnectTimer = null;
    }

    const winnerName = game.winner === 'w' ? game.white?.name : game.black?.name;
    const opponentName = disconnectedColor === 'w' ? game.white?.name : game.black?.name;
    const publicState = this.getPublicGameState(game);

    if (this.io) {
      this.io.to(`arena:${roomId}`).emit('arena:gameOver', {
        winner: game.winner,
        endReason: 'abandonment',
        message: 'Opponent disconnected for more than 50 seconds.',
        winnerName,
        opponentName,
        game: publicState,
      });
    }

    this.recordTournamentResult(game);
  }

  private async recordTournamentResult(game: ArenaGame) {
    if (!game.tournamentId || !game.matchId) return;

    try {
      const { prisma } = require('../index');
      const { recalculateParticipantScores, broadcastTournamentUpdate } = require('../utils/tournamentUtils');

      let resultStr: 'W' | 'L' | 'D' | null = null;
      if (game.winner === 'w') resultStr = 'W';
      else if (game.winner === 'b') resultStr = 'L';
      else if (game.winner === 'draw') resultStr = 'D';

      if (!resultStr) return;

      const match = await prisma.match.findUnique({
        where: { id: game.matchId },
      });

      if (match && !match.resultConfirmed) {
        await prisma.match.update({
          where: { id: game.matchId },
          data: {
            result: resultStr,
            resultDetail: game.endReason,
            resultEnteredAt: new Date(),
            lastUpdatedBy: 'Online Arena Engine',
          },
        });

        await recalculateParticipantScores(game.tournamentId);
        await broadcastTournamentUpdate(game.tournamentId);
      }
    } catch (err) {
      console.error('[ARENA] Failed to record tournament match result:', err);
    }
  }

  getGame(roomId: string): ArenaGame | null {
    return this.games.get(roomId) || null;
  }

  getPublicGameState(game: ArenaGame) {
    return {
      id: game.id,
      fen: game.chess.fen(),
      turn: game.chess.turn(),
      isCheck: game.chess.inCheck(),
      status: game.status,
      winner: game.winner,
      endReason: game.endReason,
      timeControl: game.timeControl,
      tournamentId: game.tournamentId || null,
      matchId: game.matchId || null,
      white: game.white
        ? {
            id: game.white.id,
            name: game.white.name,
            color: game.white.color,
            timeLeft: game.white.timeLeft,
            connected: game.white.connected,
          }
        : null,
      black: game.black
        ? {
            id: game.black.id,
            name: game.black.name,
            color: game.black.color,
            timeLeft: game.black.timeLeft,
            connected: game.black.connected,
          }
        : null,
      spectatorsCount: game.spectators.length,
      moves: game.moves,
      drawOffer: game.drawOffer,
      disconnectCountdown: game.disconnectTimer
        ? {
            disconnectedColor: game.disconnectTimer.disconnectedColor,
            secondsLeft: game.disconnectTimer.secondsLeft,
          }
        : null,
      createdAt: game.createdAt,
    };
  }

  listPublicGames() {
    const results = [];
    for (const game of this.games.values()) {
      results.push({
        id: game.id,
        status: game.status,
        whiteName: game.white?.name || 'Waiting...',
        blackName: game.black?.name || 'Waiting...',
        timeControl: `${Math.round(game.timeControl.initial / 60)}+${game.timeControl.increment}`,
        movesCount: game.moves.length,
        createdAt: game.createdAt,
      });
    }
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export const arenaManager = new ArenaManager();
