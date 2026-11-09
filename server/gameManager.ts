import { CharacterId, ChatMessage, GameRoomState, ItemType, SoundPing } from '../src/types/game.js';
import { GameRoom } from './gameRoom.js';

export class GameManager {
  private rooms: Map<string, GameRoom> = new Map();
  private socketRoomMap: Map<string, string> = new Map();
  private ioBroadcast: (roomId: string, event: string, payload: unknown) => void;

  constructor(broadcastFn: (roomId: string, event: string, payload: unknown) => void) {
    this.ioBroadcast = broadcastFn;
  }

  public createRoom(
    isPublic: boolean = true,
    maxPlayers: number = 4
  ): GameRoom {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let roomId = '';
    do {
      roomId = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    } while (this.rooms.has(roomId));

    const room = new GameRoom(
      roomId,
      isPublic,
      maxPlayers,
      (r) => this.broadcastRoomState(r),
      (r, s) => this.broadcastSound(r, s),
      (r, e, d) => this.ioBroadcast(r.state.roomId, e, d)
    );

    this.rooms.set(roomId, room);
    return room;
  }

  public findQuickMatchRoom(): GameRoom | null {
    for (const room of this.rooms.values()) {
      if (
        room.state.isPublic &&
        room.state.status === 'waiting' &&
        Object.keys(room.state.players).length < room.state.maxPlayers
      ) {
        return room;
      }
    }
    return null;
  }

  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  public joinRoom(
    roomId: string,
    socketId: string,
    token: string,
    name: string,
    character: CharacterId
  ): { success: boolean; room?: GameRoom; message?: string } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, message: 'Room not found! Verify room code.' };
    }

    if (
      room.state.status !== 'waiting' &&
      !Object.values(room.state.players).some((p) => p.token === token)
    ) {
      return { success: false, message: 'Game has already started!' };
    }

    const currentCount = Object.keys(room.state.players).length;
    const isReconnecting = Object.values(room.state.players).some((p) => p.token === token);
    if (currentCount >= room.state.maxPlayers && !isReconnecting) {
      return { success: false, message: 'Room is full (max players reached)!' };
    }

    room.addPlayer(socketId, token, name, character);
    this.socketRoomMap.set(socketId, room.state.roomId);
    this.broadcastRoomState(room);
    return { success: true, room };
  }

  public handleDisconnect(socketId: string) {
    const roomId = this.socketRoomMap.get(socketId);
    if (!roomId) return;

    this.socketRoomMap.delete(socketId);
    const room = this.rooms.get(roomId);
    if (room) {
      room.removePlayer(socketId);
      if (Object.keys(room.state.players).length === 0) {
        room.stop();
        this.rooms.delete(roomId);
      } else {
        this.broadcastRoomState(room);
      }
    }
  }

  public broadcastRoomState(room: GameRoom) {
    this.ioBroadcast(room.state.roomId, 'room_state_update', room.state);
  }

  private broadcastSound(room: GameRoom, sound: SoundPing) {
    this.ioBroadcast(room.state.roomId, 'sound_ping', sound);
  }

  public getPlayerRoom(socketId: string): GameRoom | undefined {
    const roomId = this.socketRoomMap.get(socketId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }
}
