export type CharacterId = 'ethan' | 'marcus' | 'sarah' | 'tyler' | 'chloe' | 'alex';

export interface SurvivorCharacter {
  id: CharacterId;
  name: string;
  nameAr: string;
  role: string;
  roleAr: string;
  perk: string;
  perkAr: string;
  color: string;
  speedMultiplier: number;
  noiseMultiplier: number;
}

export type FloorId = 0 | 1 | 2; // 0 = Basement, 1 = Ground Floor, 2 = Upper Floor

export type ItemType =
  | 'padlock_key'
  | 'master_key'
  | 'sewer_key'
  | 'safe_key'
  | 'crowbar'
  | 'pliers'
  | 'medkit'
  | 'tranquilizer_shotgun'
  | 'pepper_spray'
  | 'car_battery'
  | 'spark_plug'
  | 'gasoline_can'
  | 'car_key'
  | 'cogwheel'
  | 'alarm_clock'
  | 'flashlight';

export interface Item {
  id: string;
  type: ItemType;
  name: string;
  nameAr: string;
  x: number;
  y: number;
  floor: FloorId;
  heldBy?: string | null; // socket ID or null
  description: string;
  descriptionAr: string;
}

export interface Player {
  id: string; // Socket ID
  token: string; // Session token for reconnects
  name: string;
  character: CharacterId;
  isHost: boolean;
  isReady: boolean;
  x: number;
  y: number;
  floor: FloorId;
  rotation: number;
  health: number; // 0 to 100
  isDowned: boolean;
  downedTimer: number; // seconds left to revive
  isHiding: boolean;
  hidingSpotId?: string | null;
  inventory: ItemType[];
  equippedItem: ItemType | null;
  isSprinting: boolean;
  isCrouching: boolean;
  flashlightOn: boolean;
  battery: number; // 0 to 100
  escaped: boolean;
}

export type GrannyState = 'patrol' | 'investigate' | 'chase' | 'attack' | 'stunned';

export interface Granny {
  x: number;
  y: number;
  floor: FloorId;
  rotation: number;
  state: GrannyState;
  targetX: number;
  targetY: number;
  targetFloor: FloorId;
  chasingPlayerId?: string | null;
  stunTimer: number;
  speed: number;
  hearingRadius: number;
  lastSoundHeard?: { x: number; y: number; floor: FloorId; time: number };
}

export interface Door {
  id: string;
  x: number;
  y: number;
  floor: FloorId;
  width: number;
  height: number;
  isOpen: boolean;
  isLocked: boolean;
  requiredKey?: ItemType;
  requiredTool?: ItemType;
  label: string;
  labelAr: string;
}

export interface HidingSpot {
  id: string;
  type: 'wardrobe' | 'bed';
  x: number;
  y: number;
  floor: FloorId;
  width: number;
  height: number;
  occupantId?: string | null;
  label: string;
  labelAr: string;
}

export interface BearTrap {
  id: string;
  x: number;
  y: number;
  floor: FloorId;
  isArmed: boolean;
  trappedPlayerId?: string | null;
}

export interface SoundPing {
  id: string;
  x: number;
  y: number;
  floor: FloorId;
  intensity: 'low' | 'medium' | 'high';
  createdAt: number;
  sourcePlayerId?: string;
}

export interface EscapeProgress {
  // Main Door
  mainDoorPlanksRemoved: boolean; // Needs crowbar
  mainDoorAlarmDisabled: boolean; // Needs cutting pliers
  mainDoorPadlockUnlocked: boolean; // Needs padlock key
  mainDoorMasterUnlocked: boolean; // Needs master key
  mainDoorEscapedCount: number;

  // Car Escape
  carBatteryInstalled: boolean;
  carSparkPlugInstalled: boolean;
  carFueled: boolean;
  carUnlocked: boolean; // Needs car key
  carEscapedCount: number;

  // Tunnel Escape
  tunnelGateUnlocked: boolean; // Needs sewer key
  tunnelCogwheelInstalled: boolean; // Needs cogwheel
  tunnelEscapedCount: number;
}

export type GameStatus = 'waiting' | 'in_game' | 'day_transition' | 'ended';

export interface GameRoomState {
  roomId: string;
  isPublic: boolean;
  maxPlayers: number;
  status: GameStatus;
  currentDay: number; // 1 to 5
  dayStartedAt: number;
  dayDurationSeconds: number;
  players: Record<string, Player>;
  granny: Granny;
  items: Record<string, Item>;
  doors: Record<string, Door>;
  traps: Record<string, BearTrap>;
  hidingSpots: Record<string, HidingSpot>;
  soundPings: SoundPing[];
  escapeProgress: EscapeProgress;
  winner: 'survivors' | 'granny' | null;
  escapeRouteUsed?: 'main_door' | 'car' | 'tunnel';
  stats: {
    totalEscaped: number;
    totalRevives: number;
    daysSurvived: number;
    startTime: number;
    endTime?: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isRadio?: boolean;
  createdAt: number;
}
