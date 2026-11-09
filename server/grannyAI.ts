import { BearTrap, FloorId, Granny, Player, SoundPing } from '../src/types/game.js';
import { HOUSE_HEIGHT, HOUSE_WIDTH, TRANSITION_STAIRS } from './mapData.js';

export interface GrannyUpdateResult {
  granny: Granny;
  newTraps: BearTrap[];
  attacks: { targetPlayerId: string; damage: number }[];
  soundProduced?: SoundPing;
}

const PATROL_POINTS: { x: number; y: number; floor: FloorId }[] = [
  // Floor 1 (Foyer & Dining & Living)
  { x: 600, y: 700, floor: 1 },
  { x: 300, y: 200, floor: 1 },
  { x: 900, y: 300, floor: 1 },
  { x: 1050, y: 220, floor: 1 },
  // Floor 2 (Master Bedroom & Bathroom & Attic)
  { x: 200, y: 200, floor: 2 },
  { x: 600, y: 500, floor: 2 },
  { x: 950, y: 400, floor: 2 },
  { x: 1050, y: 200, floor: 2 },
  // Floor 0 (Basement Garage & Cells & Sewers)
  { x: 180, y: 650, floor: 0 },
  { x: 400, y: 300, floor: 0 },
  { x: 700, y: 450, floor: 0 },
  { x: 950, y: 600, floor: 0 },
];

export class GrannyAIController {
  private patrolIndex = 0;
  private investigateTimer = 0;
  private trapPlacementCooldown = 25; // seconds
  private lastAttackTime = 0;

  constructor() {}

  public tick(
    granny: Granny,
    players: Record<string, Player>,
    recentSounds: SoundPing[],
    deltaSeconds: number
  ): GrannyUpdateResult {
    const attacks: { targetPlayerId: string; damage: number }[] = [];
    const newTraps: BearTrap[] = [];
    let soundProduced: SoundPing | undefined;

    this.trapPlacementCooldown -= deltaSeconds;

    // Handle Stunned state
    if (granny.state === 'stunned') {
      granny.stunTimer -= deltaSeconds;
      if (granny.stunTimer <= 0) {
        granny.stunTimer = 0;
        granny.state = 'patrol';
      }
      return { granny, newTraps, attacks };
    }

    const activePlayers = Object.values(players).filter((p) => !p.isDowned && !p.isHiding && !p.escaped);

    // 1. Check Vision Cone & Proximity to active players on same floor
    let closestVisiblePlayer: Player | null = null;
    let closestDist = Infinity;

    for (const player of activePlayers) {
      if (player.floor !== granny.floor) continue;

      const dx = player.x - granny.x;
      const dy = player.y - granny.y;
      const dist = Math.hypot(dx, dy);

      // Angle check for vision cone (85 degrees)
      const angleToPlayer = Math.atan2(dy, dx);
      let angleDiff = Math.abs(angleToPlayer - granny.rotation);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);

      const inVisionCone = angleDiff < 0.75 && dist < 320;
      const inCloseProximity = dist < 75;

      if ((inVisionCone || inCloseProximity) && dist < closestDist) {
        closestDist = dist;
        closestVisiblePlayer = player;
      }
    }

    // 2. React to Sounds if not in chase
    if (!closestVisiblePlayer && granny.state !== 'chase') {
      const audibleSounds = recentSounds.filter((s) => {
        const isSameFloor = s.floor === granny.floor;
        const dist = Math.hypot(s.x - granny.x, s.y - granny.y);
        const maxDist = s.intensity === 'high' ? 950 : s.intensity === 'medium' ? 600 : 350;
        return isSameFloor && dist < maxDist;
      });

      if (audibleSounds.length > 0) {
        const loudest = audibleSounds[audibleSounds.length - 1];
        granny.state = 'investigate';
        granny.targetX = loudest.x;
        granny.targetY = loudest.y;
        granny.targetFloor = loudest.floor;
        this.investigateTimer = 5; // Look around for 5 seconds
      }
    }

    // 3. State transitions
    if (closestVisiblePlayer) {
      granny.state = 'chase';
      granny.chasingPlayerId = closestVisiblePlayer.id;
      granny.targetX = closestVisiblePlayer.x;
      granny.targetY = closestVisiblePlayer.y;
      granny.targetFloor = closestVisiblePlayer.floor;
    } else if (granny.state === 'chase') {
      // Lost sight of player
      const chasedPlayer = granny.chasingPlayerId ? players[granny.chasingPlayerId] : null;
      if (!chasedPlayer || chasedPlayer.floor !== granny.floor || chasedPlayer.isHiding || chasedPlayer.isDowned) {
        granny.state = 'investigate';
        this.investigateTimer = 4;
        granny.chasingPlayerId = null;
      }
    }

    // 4. Movement execution
    let currentSpeed = 70; // Base patrol speed
    if (granny.state === 'chase') {
      currentSpeed = 135; // Sprint chase speed
    } else if (granny.state === 'investigate') {
      currentSpeed = 95;
    }

    // Handle Floor Transition via stairs if target is on different floor
    if (granny.targetFloor !== granny.floor) {
      const stair = TRANSITION_STAIRS.find(
        (s) => s.fromFloor === granny.floor && s.toFloor === granny.targetFloor
      );
      if (stair) {
        const distToStairs = Math.hypot(stair.x - granny.x, stair.y - granny.y);
        if (distToStairs < 40) {
          // Take stairs
          granny.floor = stair.toFloor;
          granny.x = stair.targetX;
          granny.y = stair.targetY;
        } else {
          // Move towards stairs
          this.moveTowards(granny, stair.x, stair.y, currentSpeed, deltaSeconds);
        }
      } else {
        // Fallback target current floor patrol
        granny.targetFloor = granny.floor;
      }
    } else {
      // Same floor movement
      if (granny.state === 'patrol') {
        const dest = PATROL_POINTS[this.patrolIndex % PATROL_POINTS.length];
        if (dest.floor !== granny.floor) {
          granny.targetFloor = dest.floor;
        } else {
          const distToPatrol = Math.hypot(dest.x - granny.x, dest.y - granny.y);
          if (distToPatrol < 40) {
            this.patrolIndex = (this.patrolIndex + 1) % PATROL_POINTS.length;
          } else {
            this.moveTowards(granny, dest.x, dest.y, currentSpeed, deltaSeconds);
          }
        }
      } else if (granny.state === 'investigate') {
        const dist = Math.hypot(granny.targetX - granny.x, granny.targetY - granny.y);
        if (dist > 35) {
          this.moveTowards(granny, granny.targetX, granny.targetY, currentSpeed, deltaSeconds);
        } else {
          // Searching around
          this.investigateTimer -= deltaSeconds;
          granny.rotation += 1.8 * deltaSeconds;
          if (this.investigateTimer <= 0) {
            // Drop a bear trap sometimes when done investigating
            if (this.trapPlacementCooldown <= 0 && Math.random() < 0.6) {
              newTraps.push({
                id: `trap_${Date.now()}_${Math.floor(Math.random() * 999)}`,
                x: granny.x,
                y: granny.y,
                floor: granny.floor,
                isArmed: true,
              });
              this.trapPlacementCooldown = 35;
            }
            granny.state = 'patrol';
          }
        }
      } else if (granny.state === 'chase') {
        this.moveTowards(granny, granny.targetX, granny.targetY, currentSpeed, deltaSeconds);

        // Check attack distance (55 units)
        const distToChased = Math.hypot(granny.targetX - granny.x, granny.targetY - granny.y);
        const now = Date.now();
        if (distToChased < 58 && now - this.lastAttackTime > 1200) {
          this.lastAttackTime = now;
          if (granny.chasingPlayerId) {
            attacks.push({ targetPlayerId: granny.chasingPlayerId, damage: 100 });
          }
        }
      }
    }

    return { granny, newTraps, attacks, soundProduced };
  }

  private moveTowards(granny: Granny, tx: number, ty: number, speed: number, delta: number) {
    const dx = tx - granny.x;
    const dy = ty - granny.y;
    const angle = Math.atan2(dy, dx);
    granny.rotation = angle;

    const step = speed * delta;
    const nextX = granny.x + Math.cos(angle) * step;
    const nextY = granny.y + Math.sin(angle) * step;

    // Simple bounds clamp
    granny.x = Math.max(30, Math.min(HOUSE_WIDTH - 30, nextX));
    granny.y = Math.max(30, Math.min(HOUSE_HEIGHT - 30, nextY));
  }
}
