import Phaser from 'phaser';
import { soundManager } from '../../audio/HorrorAudioManager';
import { BearTrap, Door, FloorId, GameRoomState, HidingSpot, Item, Player, SoundPing } from '../../types/game';
import { HOUSE_HEIGHT, HOUSE_WIDTH, INITIAL_WALLS, TRANSITION_STAIRS } from '../../../server/mapData';
import { generateProceduralTextures } from '../spriteAssets';

export interface InteractionTarget {
  type: 'door' | 'item' | 'stair' | 'hiding' | 'teammate' | 'escape_main' | 'escape_car' | 'escape_tunnel';
  id: string;
  label: string;
  labelAr: string;
  subText?: string;
  subTextAr?: string;
  distance: number;
}

export class HouseScene extends Phaser.Scene {
  private localPlayerId: string = '';
  private gameState: GameRoomState | null = null;
  private onInteractionCallback?: (target: InteractionTarget | null) => void;
  private onMoveCallback?: (data: { x: number; y: number; rotation: number; isSprinting: boolean; isCrouching: boolean }) => void;

  // Visual layers
  private floorTileSprite!: Phaser.GameObjects.TileSprite;
  private wallGraphics!: Phaser.GameObjects.Graphics;
  private doorContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private itemContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private trapContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private hidingContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private stairContainers: Map<string, Phaser.GameObjects.Container> = new Map();

  // Characters
  private localPlayerContainer!: Phaser.GameObjects.Container;
  private localFlashlight!: Phaser.GameObjects.Image;
  private remotePlayerContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private grannyContainer!: Phaser.GameObjects.Container;
  private grannyFlashlight!: Phaser.GameObjects.Image;

  // Darkness & Lighting Overlay
  private darknessRenderTexture!: Phaser.GameObjects.RenderTexture;
  private soundWaveGraphics!: Phaser.GameObjects.Graphics;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private keyCtrl!: Phaser.Input.Keyboard.Key;
  private keyC!: Phaser.Input.Keyboard.Key;

  // Virtual Joystick inputs from touch
  private touchVector = { x: 0, y: 0 };
  private touchSprinting = false;
  private touchCrouching = false;

  private currentFloor: FloorId = 1;
  private lastMoveSentTime = 0;
  private lastFootstepTime = 0;

  constructor() {
    super({ key: 'HouseScene' });
  }

  public init(data: {
    localPlayerId: string;
    onInteractionTargetChange: (target: InteractionTarget | null) => void;
    onMove: (data: { x: number; y: number; rotation: number; isSprinting: boolean; isCrouching: boolean }) => void;
  }) {
    this.localPlayerId = data.localPlayerId;
    this.onInteractionCallback = data.onInteractionTargetChange;
    this.onMoveCallback = data.onMove;
  }

  public preload() {
    generateProceduralTextures(this);
  }

  public create() {
    // Set world bounds to 1200 x 800
    this.physics.world.setBounds(0, 0, HOUSE_WIDTH, HOUSE_HEIGHT);

    // 1. Floor Tile Background
    this.floorTileSprite = this.add.tileSprite(0, 0, HOUSE_WIDTH, HOUSE_HEIGHT, 'floor_wood');
    this.floorTileSprite.setOrigin(0, 0);

    // 2. Wall Graphics
    this.wallGraphics = this.add.graphics();
    this.drawWalls(1);

    // 3. Sound Wave Graphics
    this.soundWaveGraphics = this.add.graphics();

    // 4. Create Stairs
    this.createStairsContainers();

    // 5. Create Escape Points (Car in Basement, Front Door on Floor 1, Sewer Gate)
    this.createEscapeVisuals();

    // 6. Granny Container
    this.grannyContainer = this.add.container(-100, -100);
    const grannySprite = this.add.sprite(0, 0, 'granny_char');
    grannySprite.setOrigin(0.5, 0.5);

    // Granny Red Vision Beam
    this.grannyFlashlight = this.add.image(0, 0, 'flashlight_cone');
    this.grannyFlashlight.setOrigin(0.15, 0.5);
    this.grannyFlashlight.setTint(0xff1122);
    this.grannyFlashlight.setAlpha(0.65);

    const grannyAura = this.add.circle(0, 0, 36, 0xff0000, 0.15);
    this.grannyContainer.add([this.grannyFlashlight, grannyAura, grannySprite]);
    this.grannyContainer.setDepth(15);
    this.grannyContainer.setVisible(false);

    // 7. Local Player Container
    this.localPlayerContainer = this.add.container(600, 400);
    this.localFlashlight = this.add.image(0, 0, 'flashlight_cone');
    this.localFlashlight.setOrigin(0.15, 0.5);
    this.localFlashlight.setAlpha(0.85);

    const playerSprite = this.add.sprite(0, 0, 'survivor_ethan');
    playerSprite.setName('sprite');
    playerSprite.setOrigin(0.5, 0.5);

    const nameText = this.add.text(0, -28, 'YOU', {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 4, y: 2 },
    });
    nameText.setOrigin(0.5, 0.5);

    this.localPlayerContainer.add([this.localFlashlight, playerSprite, nameText]);
    this.localPlayerContainer.setDepth(20);

    // Camera setup
    this.cameras.main.setBounds(0, 0, HOUSE_WIDTH, HOUSE_HEIGHT);
    this.cameras.main.startFollow(this.localPlayerContainer, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2);

    // Keyboard inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.keyCtrl = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
      this.keyC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    }
  }

  public setTouchControls(vector: { x: number; y: number }, sprinting: boolean, crouching: boolean) {
    this.touchVector = vector;
    this.touchSprinting = sprinting;
    this.touchCrouching = crouching;
  }

  public updateGameState(state: GameRoomState) {
    this.gameState = state;
    const local = state.players[this.localPlayerId];
    if (local && local.floor !== this.currentFloor) {
      this.changeFloor(local.floor);
    }

    this.syncDoors(state.doors);
    this.syncHidingSpots(state.hidingSpots);
    this.syncTraps(state.traps);
    this.syncItems(state.items);
    this.syncRemotePlayers(state.players);
    this.syncGranny(state.granny);
    this.syncSoundPings(state.soundPings);
  }

  private changeFloor(newFloor: FloorId) {
    this.currentFloor = newFloor;
    const tex = newFloor === 0 ? 'floor_stone' : newFloor === 2 ? 'floor_carpet' : 'floor_wood';
    this.floorTileSprite.setTexture(tex);
    this.drawWalls(newFloor);

    // Update visibility of stairs
    this.stairContainers.forEach((container, id) => {
      const stair = TRANSITION_STAIRS.find((s) => s.id === id);
      container.setVisible(stair?.fromFloor === newFloor);
    });
  }

  private drawWalls(floor: FloorId) {
    this.wallGraphics.clear();
    const wallsOnFloor = INITIAL_WALLS.filter((w) => w.floor === floor);

    this.wallGraphics.fillStyle(0x111317, 1);
    this.wallGraphics.lineStyle(2, 0x2d3238, 0.8);

    wallsOnFloor.forEach((w) => {
      this.wallGraphics.fillRect(w.x, w.y, w.width, w.height);
      this.wallGraphics.strokeRect(w.x, w.y, w.width, w.height);
    });
  }

  private createStairsContainers() {
    TRANSITION_STAIRS.forEach((stair) => {
      const container = this.add.container(stair.x, stair.y);
      const circle = this.add.circle(0, 0, 32, 0x443322, 0.8);
      circle.setStrokeStyle(2, 0xd4af37, 0.9);

      const iconText = this.add.text(0, -6, '▲▼', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffdd77',
      });
      iconText.setOrigin(0.5, 0.5);

      const label = this.add.text(0, 22, stair.label, {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 3, y: 1 },
      });
      label.setOrigin(0.5, 0.5);

      container.add([circle, iconText, label]);
      container.setDepth(5);
      container.setVisible(stair.fromFloor === this.currentFloor);
      this.stairContainers.set(stair.id, container);
    });
  }

  private createEscapeVisuals() {
    // Basement car container
    const car = this.add.sprite(400, 300, 'escape_car');
    car.setOrigin(0.5, 0.5);
    car.setDepth(6);
    car.setName('car_escape_sprite');
    car.setVisible(this.currentFloor === 0);
  }

  private syncDoors(doors: Record<string, Door>) {
    Object.values(doors).forEach((door) => {
      let container = this.doorContainers.get(door.id);
      if (!container) {
        container = this.add.container(door.x, door.y);
        const rect = this.add.rectangle(0, 0, door.width, door.height, 0x5a341e);
        rect.setName('rect');
        rect.setStrokeStyle(2, 0x241208);

        const lockIcon = this.add.text(0, 0, '🔒', { fontSize: '12px' });
        lockIcon.setName('lock');
        lockIcon.setOrigin(0.5, 0.5);

        container.add([rect, lockIcon]);
        container.setDepth(8);
        this.doorContainers.set(door.id, container);
      }

      container.setVisible(door.floor === this.currentFloor);
      const rect = container.getByName('rect') as Phaser.GameObjects.Rectangle;
      const lock = container.getByName('lock') as Phaser.GameObjects.Text;

      if (rect) {
        rect.setFillStyle(door.isOpen ? 0x2e8b57 : door.isLocked ? 0x8b0000 : 0x5a341e);
        rect.setAlpha(door.isOpen ? 0.35 : 1.0);
      }
      if (lock) {
        lock.setVisible(door.isLocked);
      }
    });
  }

  private syncHidingSpots(spots: Record<string, HidingSpot>) {
    Object.values(spots).forEach((spot) => {
      let container = this.hidingContainers.get(spot.id);
      if (!container) {
        container = this.add.container(spot.x, spot.y);
        const sprite = this.add.sprite(0, 0, spot.type === 'bed' ? 'furniture_bed' : 'furniture_wardrobe');
        sprite.setOrigin(0.5, 0.5);

        const label = this.add.text(0, -spot.height / 2 - 12, 'HIDE', {
          fontFamily: 'sans-serif',
          fontSize: '9px',
          color: '#00ffcc',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: { x: 3, y: 1 },
        });
        label.setOrigin(0.5, 0.5);

        container.add([sprite, label]);
        container.setDepth(6);
        this.hidingContainers.set(spot.id, container);
      }

      container.setVisible(spot.floor === this.currentFloor);
    });
  }

  private syncTraps(traps: Record<string, BearTrap>) {
    // Remove disappeared traps
    this.trapContainers.forEach((container, id) => {
      if (!traps[id]) {
        container.destroy();
        this.trapContainers.delete(id);
      }
    });

    Object.values(traps).forEach((trap) => {
      let container = this.trapContainers.get(trap.id);
      if (!container) {
        container = this.add.container(trap.x, trap.y);
        const sprite = this.add.sprite(0, 0, 'bear_trap');
        sprite.setName('sprite');
        sprite.setOrigin(0.5, 0.5);
        container.add(sprite);
        container.setDepth(7);
        this.trapContainers.set(trap.id, container);
      }

      container.setVisible(trap.floor === this.currentFloor);
      const sprite = container.getByName('sprite') as Phaser.GameObjects.Sprite;
      if (sprite) {
        sprite.setAlpha(trap.isArmed ? 0.9 : 0.4);
      }
    });
  }

  private syncItems(items: Record<string, Item>) {
    // Remove picked up items
    this.itemContainers.forEach((container, id) => {
      if (!items[id]) {
        container.destroy();
        this.itemContainers.delete(id);
      }
    });

    Object.values(items).forEach((item) => {
      let container = this.itemContainers.get(item.id);
      if (!container) {
        container = this.add.container(item.x, item.y);
        const circle = this.add.circle(0, 0, 12, 0xffbb00, 0.9);
        circle.setStrokeStyle(2, 0xffffff, 0.8);

        const iconText = this.add.text(0, -1, '🔑', { fontSize: '11px' });
        iconText.setOrigin(0.5, 0.5);
        if (item.type.includes('key')) iconText.setText('🔑');
        else if (item.type === 'crowbar') iconText.setText('🔨');
        else if (item.type === 'pliers') iconText.setText('✂️');
        else if (item.type === 'medkit') iconText.setText('🩹');
        else if (item.type.includes('shotgun')) iconText.setText('🔫');
        else if (item.type.includes('battery')) iconText.setText('🔋');
        else if (item.type.includes('gasoline')) iconText.setText('⛽');
        else iconText.setText('📦');

        const label = this.add.text(0, 16, item.name, {
          fontFamily: 'sans-serif',
          fontSize: '9px',
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: { x: 3, y: 1 },
        });
        label.setOrigin(0.5, 0.5);

        container.add([circle, iconText, label]);
        container.setDepth(9);
        this.itemContainers.set(item.id, container);
      }

      container.setVisible(item.floor === this.currentFloor);
    });
  }

  private syncRemotePlayers(players: Record<string, Player>) {
    // Remove disconnected
    this.remotePlayerContainers.forEach((container, id) => {
      if (!players[id] || id === this.localPlayerId) {
        container.destroy();
        this.remotePlayerContainers.delete(id);
      }
    });

    Object.values(players).forEach((p) => {
      if (p.id === this.localPlayerId) return;

      let container = this.remotePlayerContainers.get(p.id);
      if (!container) {
        container = this.add.container(p.x, p.y);
        const flash = this.add.image(0, 0, 'flashlight_cone');
        flash.setName('flashlight');
        flash.setOrigin(0.15, 0.5);
        flash.setAlpha(0.65);

        const sprite = this.add.sprite(0, 0, `survivor_${p.character}`);
        sprite.setName('sprite');
        sprite.setOrigin(0.5, 0.5);

        const nameTag = this.add.text(0, -26, p.name, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: { x: 4, y: 2 },
        });
        nameTag.setName('nametag');
        nameTag.setOrigin(0.5, 0.5);

        const downedLabel = this.add.text(0, 24, 'DOWNED! PRESS E', {
          fontFamily: 'sans-serif',
          fontSize: '10px',
          color: '#ff2222',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: { x: 4, y: 2 },
        });
        downedLabel.setName('downed');
        downedLabel.setOrigin(0.5, 0.5);
        downedLabel.setVisible(false);

        container.add([flash, sprite, nameTag, downedLabel]);
        container.setDepth(18);
        this.remotePlayerContainers.set(p.id, container);
      }

      container.setVisible(p.floor === this.currentFloor && !p.isHiding && !p.escaped);
      container.setPosition(p.x, p.y);
      container.setRotation(p.rotation);

      const downed = container.getByName('downed') as Phaser.GameObjects.Text;
      if (downed) {
        downed.setVisible(p.isDowned);
        downed.setText(`DOWNED (${Math.ceil(p.downedTimer)}s)`);
      }
    });
  }

  private syncGranny(granny: GameRoomState['granny']) {
    const isSameFloor = granny.floor === this.currentFloor;
    this.grannyContainer.setVisible(isSameFloor);

    if (isSameFloor) {
      this.grannyContainer.setPosition(granny.x, granny.y);
      this.grannyContainer.setRotation(granny.rotation);

      // Calculate distance to local player for heartbeat terror audio
      const local = this.gameState?.players[this.localPlayerId];
      if (local && !local.escaped) {
        const dist = Math.hypot(local.x - granny.x, local.y - granny.y);
        const maxHearingDist = 650;
        const terrorIntensity = Math.max(0, Math.min(1, 1 - dist / maxHearingDist));
        soundManager.updateHeartbeatTerror(terrorIntensity);
      }
    } else {
      soundManager.stopHeartbeat();
    }
  }

  private syncSoundPings(pings: SoundPing[]) {
    this.soundWaveGraphics.clear();
    const now = Date.now();
    pings.forEach((ping) => {
      if (ping.floor !== this.currentFloor) return;
      const age = now - ping.createdAt;
      const progress = age / 2500;
      if (progress < 1) {
        const radius = progress * (ping.intensity === 'high' ? 180 : 90);
        const alpha = (1 - progress) * 0.7;
        const color = ping.intensity === 'high' ? 0xff2222 : 0xffaa00;

        this.soundWaveGraphics.lineStyle(3, color, alpha);
        this.soundWaveGraphics.strokeCircle(ping.x, ping.y, radius);
      }
    });
  }

  override update(time: number, delta: number) {
    if (!this.gameState || this.gameState.status !== 'in_game') return;

    const localPlayer = this.gameState.players[this.localPlayerId];
    if (!localPlayer || localPlayer.isDowned || localPlayer.escaped) return;

    // Local Movement Calculations
    let moveX = 0;
    let moveY = 0;

    // Keyboard
    if (this.cursors) {
      if (this.cursors.left.isDown || this.keyA.isDown) moveX -= 1;
      if (this.cursors.right.isDown || this.keyD.isDown) moveX += 1;
      if (this.cursors.up.isDown || this.keyW.isDown) moveY -= 1;
      if (this.cursors.down.isDown || this.keyS.isDown) moveY += 1;
    }

    // Combine with virtual touch joystick
    if (Math.abs(this.touchVector.x) > 0.1 || Math.abs(this.touchVector.y) > 0.1) {
      moveX = this.touchVector.x;
      moveY = this.touchVector.y;
    }

    const isSprinting = (this.keyShift?.isDown || this.touchSprinting) && !localPlayer.isHiding;
    const isCrouching = (this.keyCtrl?.isDown || this.keyC?.isDown || this.touchCrouching) && !localPlayer.isHiding;

    let speed = 140; // Base speed
    if (isSprinting) speed = 210;
    if (isCrouching) speed = 85;

    let rotation = this.localPlayerContainer.rotation;

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      const normX = moveX / len;
      const normY = moveY / len;
      rotation = Math.atan2(normY, normX);

      const deltaSec = delta / 1000;
      const newX = Phaser.Math.Clamp(this.localPlayerContainer.x + normX * speed * deltaSec, 30, HOUSE_WIDTH - 30);
      const newY = Phaser.Math.Clamp(this.localPlayerContainer.y + normY * speed * deltaSec, 30, HOUSE_HEIGHT - 30);

      this.localPlayerContainer.setPosition(newX, newY);
      this.localPlayerContainer.setRotation(rotation);

      // Footstep sound throttled
      const stepInterval = isSprinting ? 280 : isCrouching ? 550 : 380;
      if (time - this.lastFootstepTime > stepInterval) {
        this.lastFootstepTime = time;
        soundManager.playFootstep(isSprinting, isCrouching);
      }
    }

    // Send movement to server throttled (~20 times/sec)
    if (time - this.lastMoveSentTime > 50) {
      this.lastMoveSentTime = time;
      this.onMoveCallback?.({
        x: this.localPlayerContainer.x,
        y: this.localPlayerContainer.y,
        rotation,
        isSprinting,
        isCrouching,
      });
    }

    // Update nearest interaction target
    this.checkNearestInteraction(localPlayer);
  }

  private checkNearestInteraction(localPlayer: Player) {
    if (!this.gameState || localPlayer.isDowned) {
      this.onInteractionCallback?.(null);
      return;
    }

    const px = this.localPlayerContainer.x;
    const py = this.localPlayerContainer.y;
    let nearest: InteractionTarget | null = null;
    let minDistance = 90;

    // 1. Check Downed Teammates
    Object.values(this.gameState.players).forEach((p) => {
      if (p.id !== this.localPlayerId && p.floor === this.currentFloor && p.isDowned) {
        const d = Math.hypot(px - p.x, py - p.y);
        if (d < minDistance) {
          minDistance = d;
          nearest = {
            type: 'teammate',
            id: p.id,
            label: `Revive ${p.name}`,
            labelAr: `إنعاش ${p.name}`,
            subText: 'Hold to Revive / Use Medkit',
            subTextAr: 'اضغط للإنعاش أو استخدم حقيبة الإسعاف',
            distance: d,
          };
        }
      }
    });

    // 2. Check Items on floor
    if (!nearest) {
      Object.values(this.gameState.items).forEach((item) => {
        if (item.floor === this.currentFloor) {
          const d = Math.hypot(px - item.x, py - item.y);
          if (d < minDistance) {
            minDistance = d;
            nearest = {
              type: 'item',
              id: item.id,
              label: `Pick up ${item.name}`,
              labelAr: `التقاط ${item.nameAr}`,
              subText: item.description,
              subTextAr: item.descriptionAr,
              distance: d,
            };
          }
        }
      });
    }

    // 3. Check Doors
    if (!nearest) {
      Object.values(this.gameState.doors).forEach((door) => {
        if (door.floor === this.currentFloor) {
          const d = Math.hypot(px - door.x, py - door.y);
          if (d < minDistance) {
            minDistance = d;
            nearest = {
              type: 'door',
              id: door.id,
              label: door.isLocked ? `Unlock ${door.label}` : door.isOpen ? 'Close Door' : 'Open Door',
              labelAr: door.isLocked ? `فتح قفل ${door.labelAr}` : door.isOpen ? 'إغلاق الباب' : 'فتح الباب',
              subText: door.isLocked ? `Requires ${door.requiredKey?.replace('_', ' ').toUpperCase()}` : undefined,
              subTextAr: door.isLocked ? `يتطلب مفتاح مناسب` : undefined,
              distance: d,
            };
          }
        }
      });
    }

    // 4. Check Stairs
    if (!nearest) {
      TRANSITION_STAIRS.forEach((stair) => {
        if (stair.fromFloor === this.currentFloor) {
          const d = Math.hypot(px - stair.x, py - stair.y);
          if (d < minDistance) {
            minDistance = d;
            nearest = {
              type: 'stair',
              id: stair.id,
              label: stair.label,
              labelAr: stair.labelAr,
              distance: d,
            };
          }
        }
      });
    }

    // 5. Check Hiding Spots
    if (!nearest) {
      Object.values(this.gameState.hidingSpots).forEach((spot) => {
        if (spot.floor === this.currentFloor) {
          const d = Math.hypot(px - spot.x, py - spot.y);
          if (d < minDistance) {
            minDistance = d;
            nearest = {
              type: 'hiding',
              id: spot.id,
              label: localPlayer.isHiding ? 'Exit Hiding' : `Hide in ${spot.label}`,
              labelAr: localPlayer.isHiding ? 'الخروج من المخبأ' : `الاختباء في ${spot.labelAr}`,
              distance: d,
            };
          }
        }
      });
    }

    this.onInteractionCallback?.(nearest);
  }
}
