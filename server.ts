import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GameManager } from './server/gameManager.js';
import { CharacterId, ItemType } from './src/types/game.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  const gameManager = new GameManager((roomId, event, payload) => {
    io.to(roomId).emit(event, payload);
  });

  // Socket.IO event router
  io.on('connection', (socket) => {
    // 1. Create Room
    socket.on('create_room', (data: { name: string; character: CharacterId; isPublic: boolean; maxPlayers: number; token: string }, callback) => {
      const room = gameManager.createRoom(data.isPublic ?? true, data.maxPlayers ?? 4);
      socket.join(room.state.roomId);
      const player = room.addPlayer(socket.id, data.token, data.name, data.character);
      gameManager.broadcastRoomState(room);
      if (typeof callback === 'function') {
        callback({ success: true, roomId: room.state.roomId, player, state: room.state });
      }
    });

    // 2. Quick Match
    socket.on('quick_match', (data: { name: string; character: CharacterId; token: string }, callback) => {
      let room = gameManager.findQuickMatchRoom();
      if (!room) {
        room = gameManager.createRoom(true, 4);
      }
      socket.join(room.state.roomId);
      const player = room.addPlayer(socket.id, data.token, data.name, data.character);
      gameManager.broadcastRoomState(room);
      if (typeof callback === 'function') {
        callback({ success: true, roomId: room.state.roomId, player, state: room.state });
      }
    });

    // 3. Join Room
    socket.on('join_room', (data: { roomId: string; name: string; character: CharacterId; token: string }, callback) => {
      const result = gameManager.joinRoom(data.roomId, socket.id, data.token, data.name, data.character);
      if (result.success && result.room) {
        socket.join(result.room.state.roomId);
        if (typeof callback === 'function') {
          callback({
            success: true,
            roomId: result.room.state.roomId,
            state: result.room.state,
            player: result.room.state.players[socket.id],
          });
        }
      } else {
        if (typeof callback === 'function') {
          callback({ success: false, message: result.message || 'Failed to join room' });
        }
      }
    });

    // 4. Toggle Ready
    socket.on('set_ready', (data: { isReady: boolean }) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (room) {
        room.setReady(socket.id, data.isReady);
        gameManager.broadcastRoomState(room);
      }
    });

    // 5. Select Character
    socket.on('set_character', (data: { character: CharacterId }) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (room) {
        room.setCharacter(socket.id, data.character);
        gameManager.broadcastRoomState(room);
      }
    });

    // 6. Host Start Game
    socket.on('start_game', (callback) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (!room) return;
      const player = room.state.players[socket.id];
      if (!player || !player.isHost) {
        if (typeof callback === 'function') callback({ success: false, message: 'Only host can start match' });
        return;
      }

      const started = room.startMatch();
      if (started) {
        gameManager.broadcastRoomState(room);
        if (typeof callback === 'function') callback({ success: true });
      } else {
        if (typeof callback === 'function') callback({ success: false, message: 'Failed to start match' });
      }
    });

    // 7. Movement synchronization
    socket.on('player_move', (data: { x: number; y: number; rotation: number; isSprinting: boolean; isCrouching: boolean }) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (room && room.state.status === 'in_game') {
        room.updatePlayerMovement(socket.id, data.x, data.y, data.rotation, data.isSprinting, data.isCrouching);
      }
    });

    // 8. Stairs
    socket.on('use_stairs', (data: { stairId: string }, callback) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (room) {
        const success = room.playerUseStairs(socket.id, data.stairId);
        if (typeof callback === 'function') callback({ success });
      }
    });

    // 9. Door interaction
    socket.on('toggle_door', (data: { doorId: string }, callback) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (room) {
        const res = room.toggleDoor(socket.id, data.doorId);
        if (typeof callback === 'function') callback(res);
      }
    });

    // 10. Hiding Spot
    socket.on('toggle_hiding', (data: { spotId: string }, callback) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (room) {
        const success = room.toggleHiding(socket.id, data.spotId);
        if (typeof callback === 'function') callback({ success });
      }
    });

    // 11. Pick up item
    socket.on('pickup_item', (data: { itemId: string }, callback) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (room) {
        const success = room.pickupItem(socket.id, data.itemId);
        if (typeof callback === 'function') callback({ success });
      }
    });

    // 12. Drop item
    socket.on('drop_item', (data: { itemType: ItemType }, callback) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (room) {
        const success = room.dropItem(socket.id, data.itemType);
        if (typeof callback === 'function') callback({ success });
      }
    });

    // 13. Use equipped item
    socket.on('use_item', (callback) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (room) {
        const res = room.useEquippedItem(socket.id);
        if (typeof callback === 'function') callback(res);
      }
    });

    // 14. Revive teammate
    socket.on('revive_teammate', (data: { targetId: string }, callback) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (room) {
        const success = room.reviveTeammate(socket.id, data.targetId);
        if (typeof callback === 'function') callback({ success });
      }
    });

    // 15. Radio Chat
    socket.on('send_chat', (data: { text: string; isRadio?: boolean }) => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (room) {
        const player = room.state.players[socket.id];
        if (player) {
          const msg = {
            id: `msg_${Date.now()}_${Math.random()}`,
            senderId: socket.id,
            senderName: player.name,
            text: data.text.slice(0, 100),
            isRadio: data.isRadio,
            createdAt: Date.now(),
          };
          io.to(room.state.roomId).emit('chat_message', msg);
        }
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      gameManager.handleDisconnect(socket.id);
    });
  });

  // API health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'GRANNY: THE NIGHTMARE' });
  });

  // Mount Vite middleware in dev or serve dist in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[GRANNY SERVER] Running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER ERROR]', err);
  process.exit(1);
});
