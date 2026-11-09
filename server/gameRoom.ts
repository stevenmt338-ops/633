import {
  BearTrap,
  CharacterId,
  Door,
  EscapeProgress,
  FloorId,
  GameRoomState,
  GameStatus,
  Granny,
  HidingSpot,
  Item,
  ItemType,
  Player,
  SoundPing,
} from '../src/types/game.js';
import { GrannyAIController } from './grannyAI.js';
import {
  generateMatchItems,
  HOUSE_HEIGHT,
  HOUSE_WIDTH,
  INITIAL_DOORS,
  INITIAL_HIDING_SPOTS,
  TRANSITION_STAIRS,
} from './mapData.js';

export class GameRoom {
  public state: GameRoomState;
  private grannyController = new GrannyAIController();
  private tickInterval: NodeJS.Timeout | null = null;
  private onStateChangeCallback: (room: GameRoom) => void;
  private onSoundProducedCallback: (room: GameRoom, sound: SoundPing) => void;
  private onEventBroadcastCallback: (room: GameRoom, eventName: string, data: unknown) => void;

  constructor(
    roomId: string,
    isPublic: boolean,
    maxPlayers: number,
    onStateChange: (room: GameRoom) => void,
    onSoundProduced: (room: GameRoom, sound: SoundPing) => void,
    onEventBroadcast: (room: GameRoom, eventName: string, data: unknown) => void
  ) {
    this.onStateChangeCallback = onStateChange;
    this.onSoundProducedCallback = onSoundProduced;
    this.onEventBroadcastCallback = onEventBroadcast;

    this.state = {
      roomId,
      isPublic,
      maxPlayers: Math.max(2, Math.min(6, maxPlayers)),
      status: 'waiting',
      currentDay: 1,
      dayStartedAt: Date.now(),
      dayDurationSeconds: 400,
      players: {},
      granny: this.createInitialGranny(),
      items: {},
      doors: JSON.parse(JSON.stringify(INITIAL_DOORS)),
      traps: {},
      hidingSpots: JSON.parse(JSON.stringify(INITIAL_HIDING_SPOTS)),
      soundPings: [],
      escapeProgress: this.createInitialEscapeProgress(),
      winner: null,
      stats: {
        totalEscaped: 0,
        totalRevives: 0,
        daysSurvived: 1,
        startTime: Date.now(),
      },
    };
  }

  private createInitialGranny(): Granny {
    return {
      x: 300,
      y: 200,
      floor: 2, // Starts upstairs in master bedroom
      rotation: 0,
      state: 'patrol',
      targetX: 600,
      targetY: 500,
      targetFloor: 2,
      chasingPlayerId: null,
      stunTimer: 0,
      speed: 70,
      hearingRadius: 650,
    };
  }

  private createInitialEscapeProgress(): EscapeProgress {
    return {
      mainDoorPlanksRemoved: false,
      mainDoorAlarmDisabled: false,
      mainDoorPadlockUnlocked: false,
      mainDoorMasterUnlocked: false,
      mainDoorEscapedCount: 0,

      carBatteryInstalled: false,
      carSparkPlugInstalled: false,
      carFueled: false,
      carUnlocked: false,
      carEscapedCount: 0,

      tunnelGateUnlocked: false,
      tunnelCogwheelInstalled: false,
      tunnelEscapedCount: 0,
    };
  }

  public addPlayer(socketId: string, token: string, name: string, character: CharacterId): Player {
    // Check if player with token already exists (reconnection)
    const existing = Object.values(this.state.players).find((p) => p.token === token);
    if (existing) {
      delete this.state.players[existing.id];
      existing.id = socketId;
      this.state.players[socketId] = existing;
      return existing;
    }

    const isFirst = Object.keys(this.state.players).length === 0;
    const player: Player = {
      id: socketId,
      token,
      name: name.slice(0, 16) || `Survivor ${Math.floor(Math.random() * 100)}`,
      character,
      isHost: isFirst,
      isReady: isFirst, // Host starts ready
      x: 550 + Math.random() * 100,
      y: 400 + Math.random() * 100,
      floor: 1,
      rotation: 0,
      health: 100,
      isDowned: false,
      downedTimer: 45,
      isHiding: false,
      hidingSpotId: null,
      inventory: [],
      equippedItem: null,
      isSprinting: false,
      isCrouching: false,
      flashlightOn: true,
      battery: 100,
      escaped: false,
    };

    this.state.players[socketId] = player;
    return player;
  }

  public removePlayer(socketId: string) {
    const player = this.state.players[socketId];
    if (!player) return;

    // Drop items
    player.inventory.forEach((itemType) => {
      this.dropItem(socketId, itemType);
    });

    // If was hiding, clear spot
    if (player.isHiding && player.hidingSpotId && this.state.hidingSpots[player.hidingSpotId]) {
      this.state.hidingSpots[player.hidingSpotId].occupantId = null;
    }

    delete this.state.players[socketId];

    // If host left, assign new host
    const remaining = Object.values(this.state.players);
    if (player.isHost && remaining.length > 0) {
      remaining[0].isHost = true;
    }

    if (remaining.length === 0) {
      this.stop();
    }
  }

  public setReady(socketId: string, isReady: boolean) {
    if (this.state.players[socketId]) {
      this.state.players[socketId].isReady = isReady;
    }
  }

  public setCharacter(socketId: string, character: CharacterId) {
    if (this.state.players[socketId]) {
      this.state.players[socketId].character = character;
    }
  }

  public startMatch(): boolean {
    const players = Object.values(this.state.players);
    if (players.length < 1) return false;

    this.state.status = 'in_game';
    this.state.currentDay = 1;
    this.state.dayStartedAt = Date.now();
    this.state.items = generateMatchItems();
    this.state.doors = JSON.parse(JSON.stringify(INITIAL_DOORS));
    this.state.traps = {};
    this.state.escapeProgress = this.createInitialEscapeProgress();
    this.state.granny = this.createInitialGranny();
    this.state.winner = null;
    this.state.stats.startTime = Date.now();

    // Spread players across starting rooms
    const spawnOffsets = [
      { x: 550, y: 550, floor: 1 as FloorId },
      { x: 250, y: 250, floor: 1 as FloorId },
      { x: 880, y: 550, floor: 1 as FloorId },
      { x: 600, y: 250, floor: 2 as FloorId },
      { x: 200, y: 600, floor: 2 as FloorId },
      { x: 880, y: 600, floor: 2 as FloorId },
    ];

    players.forEach((p, idx) => {
      const spawn = spawnOffsets[idx % spawnOffsets.length];
      p.x = spawn.x;
      p.y = spawn.y;
      p.floor = spawn.floor;
      p.health = 100;
      p.isDowned = false;
      p.downedTimer = 45;
      p.isHiding = false;
      p.hidingSpotId = null;
      p.inventory = [];
      p.equippedItem = null;
      p.battery = 100;
      p.escaped = false;
    });

    this.startTickLoop();
    this.onEventBroadcastCallback(this, 'match_started', { currentDay: 1 });
    return true;
  }

  private startTickLoop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    const tickRateMs = 50; // 20 updates per sec
    const deltaSec = 0.05;

    this.tickInterval = setInterval(() => {
      this.tick(deltaSec);
    }, tickRateMs);
  }

  public stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private tick(deltaSec: number) {
    if (this.state.status !== 'in_game') return;

    // Clean old sound pings (> 3 seconds)
    const now = Date.now();
    this.state.soundPings = this.state.soundPings.filter((s) => now - s.createdAt < 3000);

    // Update downed timers
    const players = Object.values(this.state.players);
    let allActiveDowned = true;
    let anyAlive = false;

    for (const player of players) {
      if (player.escaped) continue;
      anyAlive = true;

      if (player.isDowned) {
        player.downedTimer -= deltaSec;
        if (player.downedTimer <= 0) {
          player.downedTimer = 0;
        }
      } else {
        allActiveDowned = false;
      }
    }

    // Check if day transition needed (all players knocked out)
    if (anyAlive && allActiveDowned) {
      this.advanceDay();
      return;
    }

    // Granny AI Tick
    const aiResult = this.grannyController.tick(
      this.state.granny,
      this.state.players,
      this.state.soundPings,
      deltaSec
    );

    this.state.granny = aiResult.granny;

    // Add newly placed traps
    aiResult.newTraps.forEach((trap) => {
      this.state.traps[trap.id] = trap;
      this.onEventBroadcastCallback(this, 'trap_placed', trap);
    });

    // Handle attacks
    aiResult.attacks.forEach((attack) => {
      const target = this.state.players[attack.targetPlayerId];
      if (target && !target.isDowned && !target.escaped) {
        target.health = 0;
        target.isDowned = true;
        target.downedTimer = 45;
        this.emitSound(target.x, target.y, target.floor, 'high', target.id);
        this.onEventBroadcastCallback(this, 'player_downed', {
          playerId: target.id,
          playerName: target.name,
        });
      }
    });

    // Check Bear Traps collision with players
    for (const trap of Object.values(this.state.traps)) {
      if (!trap.isArmed) continue;
      for (const p of players) {
        if (p.floor === trap.floor && !p.isDowned && !p.escaped) {
          const dist = Math.hypot(p.x - trap.x, p.y - trap.y);
          if (dist < 32) {
            trap.isArmed = false;
            trap.trappedPlayerId = p.id;
            this.emitSound(p.x, p.y, p.floor, 'high', p.id);
            this.onEventBroadcastCallback(this, 'player_trapped', {
              playerId: p.id,
              trapId: trap.id,
            });
            break;
          }
        }
      }
    }

    // Broadcast updated state
    this.onStateChangeCallback(this);
  }

  public advanceDay() {
    if (this.state.currentDay >= 5) {
      // Day 5 failed: GAME OVER
      this.state.status = 'ended';
      this.state.winner = 'granny';
      this.state.stats.endTime = Date.now();
      this.stop();
      this.onEventBroadcastCallback(this, 'game_ended', { winner: 'granny' });
      return;
    }

    this.state.status = 'day_transition';
    this.state.currentDay += 1;
    this.state.stats.daysSurvived = this.state.currentDay;
    this.state.dayStartedAt = Date.now();

    // Reset Granny upstairs
    this.state.granny = this.createInitialGranny();

    // Revive all players with half health in bedroom
    Object.values(this.state.players).forEach((p) => {
      if (!p.escaped) {
        p.isDowned = false;
        p.health = 100;
        p.downedTimer = 45;
        p.floor = 2;
        p.x = 220 + Math.random() * 80;
        p.y = 220 + Math.random() * 80;
        p.isHiding = false;
        p.hidingSpotId = null;
      }
    });

    this.onEventBroadcastCallback(this, 'day_advanced', { currentDay: this.state.currentDay });

    setTimeout(() => {
      if (this.state.status === 'day_transition') {
        this.state.status = 'in_game';
      }
    }, 4500);
  }

  public emitSound(x: number, y: number, floor: FloorId, intensity: 'low' | 'medium' | 'high', sourcePlayerId?: string) {
    const sound: SoundPing = {
      id: `snd_${Date.now()}_${Math.random()}`,
      x,
      y,
      floor,
      intensity,
      createdAt: Date.now(),
      sourcePlayerId,
    };
    this.state.soundPings.push(sound);
    this.onSoundProducedCallback(this, sound);
  }

  // --- ACTIONS ---

  public updatePlayerMovement(
    socketId: string,
    x: number,
    y: number,
    rotation: number,
    isSprinting: boolean,
    isCrouching: boolean
  ) {
    const p = this.state.players[socketId];
    if (!p || p.isDowned || p.isHiding || p.escaped) return;

    p.x = Math.max(30, Math.min(HOUSE_WIDTH - 30, x));
    p.y = Math.max(30, Math.min(HOUSE_HEIGHT - 30, y));
    p.rotation = rotation;
    p.isSprinting = isSprinting;
    p.isCrouching = isCrouching;

    // Sound generation based on movement
    if (isSprinting && Math.random() < 0.12) {
      this.emitSound(p.x, p.y, p.floor, 'medium', p.id);
    } else if (!isCrouching && Math.random() < 0.03) {
      this.emitSound(p.x, p.y, p.floor, 'low', p.id);
    }
  }

  public playerUseStairs(socketId: string, stairId: string): boolean {
    const p = this.state.players[socketId];
    if (!p || p.isDowned || p.isHiding || p.escaped) return false;

    const stair = TRANSITION_STAIRS.find((s) => s.id === stairId && s.fromFloor === p.floor);
    if (!stair) return false;

    const dist = Math.hypot(p.x - stair.x, p.y - stair.y);
    if (dist > 80) return false;

    p.floor = stair.toFloor;
    p.x = stair.targetX;
    p.y = stair.targetY;
    this.emitSound(p.x, p.y, p.floor, 'low', p.id);
    return true;
  }

  public toggleDoor(socketId: string, doorId: string): { success: boolean; message?: string } {
    const p = this.state.players[socketId];
    const door = this.state.doors[doorId];
    if (!p || !door || p.floor !== door.floor || p.isDowned) return { success: false };

    const dist = Math.hypot(p.x - door.x, p.y - door.y);
    if (dist > 90) return { success: false, message: 'Too far' };

    if (door.isLocked) {
      // Check if player has the required key
      if (door.requiredKey && p.inventory.includes(door.requiredKey)) {
        door.isLocked = false;
        door.isOpen = true;
        this.emitSound(door.x, door.y, door.floor, 'medium', p.id);
        this.onEventBroadcastCallback(this, 'door_unlocked', { doorId, playerName: p.name });
        return { success: true };
      } else {
        return { success: false, message: 'Door is locked! Key required.' };
      }
    }

    // Toggle open/close
    door.isOpen = !door.isOpen;
    this.emitSound(door.x, door.y, door.floor, 'low', p.id);
    this.onEventBroadcastCallback(this, 'door_toggled', { doorId, isOpen: door.isOpen });
    return { success: true };
  }

  public toggleHiding(socketId: string, spotId: string): boolean {
    const p = this.state.players[socketId];
    if (!p || p.isDowned || p.escaped) return false;

    if (p.isHiding) {
      // Exit hiding
      if (p.hidingSpotId && this.state.hidingSpots[p.hidingSpotId]) {
        this.state.hidingSpots[p.hidingSpotId].occupantId = null;
      }
      p.isHiding = false;
      p.hidingSpotId = null;
      this.emitSound(p.x, p.y, p.floor, 'low', p.id);
      return true;
    }

    const spot = this.state.hidingSpots[spotId];
    if (!spot || spot.floor !== p.floor || spot.occupantId) return false;

    const dist = Math.hypot(p.x - spot.x, p.y - spot.y);
    if (dist > 85) return false;

    spot.occupantId = p.id;
    p.isHiding = true;
    p.hidingSpotId = spot.id;
    p.x = spot.x;
    p.y = spot.y;
    return true;
  }

  public pickupItem(socketId: string, itemId: string): boolean {
    const p = this.state.players[socketId];
    const item = this.state.items[itemId];
    if (!p || !item || item.floor !== p.floor || p.isDowned || p.isHiding) return false;

    // Max 2 inventory slots
    if (p.inventory.length >= 2) return false;

    const dist = Math.hypot(p.x - item.x, p.y - item.y);
    if (dist > 80) return false;

    item.heldBy = socketId;
    p.inventory.push(item.type);
    if (!p.equippedItem) {
      p.equippedItem = item.type;
    }

    // Remove from floor items or mark held
    delete this.state.items[itemId];
    this.onEventBroadcastCallback(this, 'item_picked', { itemId, player: p });
    return true;
  }

  public dropItem(socketId: string, itemType: ItemType): boolean {
    const p = this.state.players[socketId];
    if (!p || !p.inventory.includes(itemType)) return false;

    p.inventory = p.inventory.filter((t) => t !== itemType);
    if (p.equippedItem === itemType) {
      p.equippedItem = p.inventory[0] || null;
    }

    const newItemId = `dropped_${itemType}_${Date.now()}`;
    this.state.items[newItemId] = {
      id: newItemId,
      type: itemType,
      name: itemType.replace('_', ' ').toUpperCase(),
      nameAr: itemType,
      x: p.x,
      y: p.y,
      floor: p.floor,
      description: 'Dropped item',
      descriptionAr: 'عنصر تم إلقاؤه',
    };

    // Dropping makes a sound!
    this.emitSound(p.x, p.y, p.floor, 'medium', p.id);
    this.onEventBroadcastCallback(this, 'item_dropped', { item: this.state.items[newItemId] });
    return true;
  }

  public useEquippedItem(socketId: string): { success: boolean; actionType: string; message?: string } {
    const p = this.state.players[socketId];
    if (!p || !p.equippedItem || p.isDowned || p.isHiding) return { success: false, actionType: 'none' };

    const item = p.equippedItem;

    // 1. Weapon: Tranquilizer Gun or Pepper Spray against Granny
    if (item === 'tranquilizer_shotgun' || item === 'pepper_spray') {
      if (this.state.granny.floor === p.floor) {
        const dist = Math.hypot(p.x - this.state.granny.x, p.y - this.state.granny.y);
        const maxRange = item === 'tranquilizer_shotgun' ? 380 : 120;
        if (dist < maxRange) {
          const duration = item === 'tranquilizer_shotgun' ? 20 : 10;
          this.state.granny.state = 'stunned';
          this.state.granny.stunTimer = duration;
          this.emitSound(p.x, p.y, p.floor, 'high', p.id);
          this.dropItem(socketId, item); // consumed
          this.onEventBroadcastCallback(this, 'granny_stunned', { duration, playerName: p.name });
          return { success: true, actionType: 'stun_granny' };
        }
      }
      return { success: false, actionType: 'none', message: 'Granny is out of range!' };
    }

    // 2. Alarm Clock: Distraction decoy
    if (item === 'alarm_clock') {
      this.dropItem(socketId, item);
      this.emitSound(p.x, p.y, p.floor, 'high', p.id);
      this.onEventBroadcastCallback(this, 'alarm_distraction', { x: p.x, y: p.y, floor: p.floor });
      return { success: true, actionType: 'alarm' };
    }

    // 3. Pliers: Disarm nearby bear trap
    if (item === 'pliers') {
      for (const trap of Object.values(this.state.traps)) {
        if (trap.floor === p.floor && Math.hypot(p.x - trap.x, p.y - trap.y) < 70) {
          delete this.state.traps[trap.id];
          this.onEventBroadcastCallback(this, 'trap_disarmed', { trapId: trap.id });
          return { success: true, actionType: 'trap_disarm' };
        }
      }
    }

    // 4. Escape Interactions by location
    // Main Exit Door (Floor 1, x: 600, y: 776)
    if (p.floor === 1 && Math.hypot(p.x - 600, p.y - 776) < 120) {
      const prog = this.state.escapeProgress;
      if (item === 'crowbar' && !prog.mainDoorPlanksRemoved) {
        prog.mainDoorPlanksRemoved = true;
        this.emitSound(p.x, p.y, p.floor, 'high', p.id);
        this.onEventBroadcastCallback(this, 'escape_step', { step: 'planks_removed', playerName: p.name });
        return { success: true, actionType: 'planks' };
      }
      if (item === 'pliers' && !prog.mainDoorAlarmDisabled) {
        prog.mainDoorAlarmDisabled = true;
        this.emitSound(p.x, p.y, p.floor, 'low', p.id);
        this.onEventBroadcastCallback(this, 'escape_step', { step: 'alarm_disabled', playerName: p.name });
        return { success: true, actionType: 'alarm_wire' };
      }
      if (item === 'padlock_key' && !prog.mainDoorPadlockUnlocked) {
        prog.mainDoorPadlockUnlocked = true;
        this.emitSound(p.x, p.y, p.floor, 'low', p.id);
        this.onEventBroadcastCallback(this, 'escape_step', { step: 'padlock_unlocked', playerName: p.name });
        return { success: true, actionType: 'padlock' };
      }
      if (item === 'master_key' && !prog.mainDoorMasterUnlocked) {
        prog.mainDoorMasterUnlocked = true;
        this.emitSound(p.x, p.y, p.floor, 'low', p.id);
        this.onEventBroadcastCallback(this, 'escape_step', { step: 'master_unlocked', playerName: p.name });
        return { success: true, actionType: 'master_key' };
      }

      // Check if all steps complete and escape!
      if (
        prog.mainDoorPlanksRemoved &&
        prog.mainDoorAlarmDisabled &&
        prog.mainDoorPadlockUnlocked &&
        prog.mainDoorMasterUnlocked
      ) {
        this.triggerPlayerEscape(p, 'main_door');
        return { success: true, actionType: 'escape' };
      }
    }

    // Car Escape (Floor 0 Garage, x: 400, y: 300)
    if (p.floor === 0 && Math.hypot(p.x - 400, p.y - 300) < 130) {
      const prog = this.state.escapeProgress;
      if (item === 'car_battery' && !prog.carBatteryInstalled) {
        prog.carBatteryInstalled = true;
        this.dropItem(socketId, item);
        this.onEventBroadcastCallback(this, 'escape_step', { step: 'battery_installed', playerName: p.name });
        return { success: true, actionType: 'car_battery' };
      }
      if (item === 'spark_plug' && !prog.carSparkPlugInstalled) {
        prog.carSparkPlugInstalled = true;
        this.dropItem(socketId, item);
        this.onEventBroadcastCallback(this, 'escape_step', { step: 'spark_installed', playerName: p.name });
        return { success: true, actionType: 'car_spark' };
      }
      if (item === 'gasoline_can' && !prog.carFueled) {
        prog.carFueled = true;
        this.dropItem(socketId, item);
        this.onEventBroadcastCallback(this, 'escape_step', { step: 'car_fueled', playerName: p.name });
        return { success: true, actionType: 'car_fuel' };
      }
      if (item === 'car_key' && !prog.carUnlocked) {
        prog.carUnlocked = true;
        this.onEventBroadcastCallback(this, 'escape_step', { step: 'car_unlocked', playerName: p.name });
        return { success: true, actionType: 'car_key' };
      }

      if (prog.carBatteryInstalled && prog.carSparkPlugInstalled && prog.carFueled && prog.carUnlocked) {
        this.triggerPlayerEscape(p, 'car');
        return { success: true, actionType: 'escape' };
      }
    }

    // Sewer Escape (Floor 0, x: 950, y: 600)
    if (p.floor === 0 && Math.hypot(p.x - 950, p.y - 600) < 130) {
      const prog = this.state.escapeProgress;
      if (item === 'sewer_key' && !prog.tunnelGateUnlocked) {
        prog.tunnelGateUnlocked = true;
        this.onEventBroadcastCallback(this, 'escape_step', { step: 'tunnel_key', playerName: p.name });
        return { success: true, actionType: 'tunnel_key' };
      }
      if (item === 'cogwheel' && !prog.tunnelCogwheelInstalled) {
        prog.tunnelCogwheelInstalled = true;
        this.dropItem(socketId, item);
        this.onEventBroadcastCallback(this, 'escape_step', { step: 'cogwheel_installed', playerName: p.name });
        return { success: true, actionType: 'tunnel_cog' };
      }

      if (prog.tunnelGateUnlocked && prog.tunnelCogwheelInstalled) {
        this.triggerPlayerEscape(p, 'tunnel');
        return { success: true, actionType: 'escape' };
      }
    }

    return { success: false, actionType: 'none', message: 'Item cannot be used here' };
  }

  public reviveTeammate(socketId: string, targetId: string): boolean {
    const p = this.state.players[socketId];
    const target = this.state.players[targetId];
    if (!p || !target || p.isDowned || !target.isDowned || p.floor !== target.floor) return false;

    const dist = Math.hypot(p.x - target.x, p.y - target.y);
    if (dist > 90) return false;

    // Has medkit or performs CPR
    const hasMedkit = p.inventory.includes('medkit');
    if (hasMedkit) {
      this.dropItem(socketId, 'medkit');
    }

    target.isDowned = false;
    target.health = 100;
    target.downedTimer = 45;
    this.state.stats.totalRevives += 1;

    this.onEventBroadcastCallback(this, 'player_revived', {
      reviverName: p.name,
      targetName: target.name,
    });
    return true;
  }

  private triggerPlayerEscape(p: Player, route: 'main_door' | 'car' | 'tunnel') {
    p.escaped = true;
    this.state.stats.totalEscaped += 1;
    this.state.escapeRouteUsed = route;

    this.onEventBroadcastCallback(this, 'player_escaped', {
      playerId: p.id,
      playerName: p.name,
      route,
    });

    // If all remaining active players have escaped, end game as survivor victory!
    const activeRemaining = Object.values(this.state.players).filter((pl) => !pl.escaped);
    if (activeRemaining.length === 0) {
      this.state.status = 'ended';
      this.state.winner = 'survivors';
      this.state.stats.endTime = Date.now();
      this.stop();
      this.onEventBroadcastCallback(this, 'game_ended', { winner: 'survivors', route });
    }
  }
}
