import React, { useState } from 'react';
import {
  Heart,
  Volume2,
  VolumeX,
  Volume1,
  Flashlight,
  ShieldAlert,
  Key,
  Car,
  DoorClosed,
  ChevronDown,
  ChevronUp,
  Radio,
  Zap,
  ArrowUpCircle,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { GameRoomState, ItemType, Player } from '../types/game';
import { InteractionTarget } from '../game/scenes/HouseScene';
import { soundManager } from '../audio/HorrorAudioManager';

interface InGameHUDProps {
  roomState: GameRoomState;
  localPlayerId: string;
  interactionTarget: InteractionTarget | null;
  onInteract: () => void;
  onUseItem: () => void;
  onDropItem: (itemType: ItemType) => void;
  onSendRadio: (text: string) => void;
  // Touch control callbacks
  onTouchJoystick: (vector: { x: number; y: number }) => void;
  onTouchSprint: (sprinting: boolean) => void;
  onTouchCrouch: (crouching: boolean) => void;
  showMobileControls: boolean;
  lang: 'ar' | 'en';
}

export const InGameHUD: React.FC<InGameHUDProps> = ({
  roomState,
  localPlayerId,
  interactionTarget,
  onInteract,
  onUseItem,
  onDropItem,
  onSendRadio,
  onTouchJoystick,
  onTouchSprint,
  onTouchCrouch,
  showMobileControls,
  lang,
}) => {
  const [showObjectives, setShowObjectives] = useState(false);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [sprintLocked, setSprintLocked] = useState(false);
  const [crouchLocked, setCrouchLocked] = useState(false);

  const localPlayer = roomState.players[localPlayerId];
  if (!localPlayer) return null;

  const floorLabels = {
    0: { en: 'B • Basement & Tunnel', ar: 'القبو السفلي ونفق الهروب' },
    1: { en: '1F • Ground Foyer & Kitchen', ar: 'الطابق الأول • المدخل والمطبخ' },
    2: { en: '2F • Master Bedroom & Attic', ar: 'الطابق الثاني • غرفة النوم والعلية' },
  };

  // Noise level calculation
  const noiseLevel = localPlayer.isSprinting
    ? { text: lang === 'ar' ? 'صوت عالٍ!' : 'LOUD!', color: 'text-red-500 bg-red-950/80 border-red-500' }
    : localPlayer.isCrouching
    ? { text: lang === 'ar' ? 'صامت تماماً' : 'SILENT', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500' }
    : { text: lang === 'ar' ? 'عادي' : 'NORMAL', color: 'text-amber-400 bg-amber-950/80 border-amber-500' };

  // Touch Virtual Joystick Handler
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setJoystickActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!joystickActive) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const normX = Math.cos(angle) * (clampedDist / maxRadius);
    const normY = Math.sin(angle) * (clampedDist / maxRadius);

    setJoystickPos({ x: normX * 35, y: normY * 35 });
    onTouchJoystick({ x: normX, y: normY });
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    onTouchJoystick({ x: 0, y: 0 });
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between p-3 md:p-6">
      {/* Horror Terror Vignette (Pulses if Granny is on same floor) */}
      {roomState.granny.floor === localPlayer.floor && (
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(150,0,0,0.35)_100%)] animate-pulse" />
      )}

      {/* Downed Screen Overlay if local player is knocked out */}
      {localPlayer.isDowned && (
        <div className="fixed inset-0 pointer-events-auto bg-red-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 animate-pulse">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-3" />
          <h2 className="text-3xl md:text-5xl font-extrabold text-white font-mono tracking-wider">
            {lang === 'ar' ? 'سقطت مغشياً عليك!' : 'YOU ARE DOWNED!'}
          </h2>
          <p className="text-base text-red-200 font-mono mt-2">
            {lang === 'ar'
              ? `انتظر إنقاذ زملائك بالحقيبة الطبية: ${Math.ceil(localPlayer.downedTimer)} ثانية`
              : `CALL TEAMMATES FOR REVIVE: ${Math.ceil(localPlayer.downedTimer)}s REMAINING`}
          </p>
          <button
            onClick={() => onSendRadio('HELP ME! I AM DOWNED!')}
            className="mt-6 px-6 py-3 bg-red-800 hover:bg-red-700 border border-red-500 rounded-xl text-white font-mono font-bold tracking-wider pointer-events-auto cursor-pointer"
          >
            📢 {lang === 'ar' ? 'طلب النجدة عبر اللاسلكي' : 'CALL SOS ON RADIO'}
          </button>
        </div>
      )}

      {/* Day Transition Announcement */}
      {roomState.status === 'day_transition' && (
        <div className="fixed inset-0 pointer-events-none bg-black/90 flex flex-col items-center justify-center text-center p-6 z-50 animate-fadeIn">
          <h2 className="text-4xl md:text-6xl font-black text-red-600 font-['Creepster',cursive] tracking-widest drop-shadow-[0_0_25px_rgba(255,0,0,0.8)]">
            DAY {roomState.currentDay}
          </h2>
          <p className="text-neutral-300 font-mono text-sm md:text-base mt-3 tracking-widest uppercase">
            {lang === 'ar'
              ? 'استيقظتم في غرفة النوم... غرانّي أصبحت أسرع وأكثر غضباً!'
              : 'SHE DRAGGED YOU TO BED... SHE BECOMES FASTER AND DEADLIER!'}
          </p>
        </div>
      )}

      {/* Top Header: Teammates status & Day counter & Objectives */}
      <div className="flex items-start justify-between w-full gap-4">
        {/* Left: Teammates Status */}
        <div className="space-y-1.5 pointer-events-auto">
          {Object.values(roomState.players).map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono backdrop-blur-md transition ${
                p.id === localPlayerId
                  ? 'bg-neutral-900/90 border-neutral-700 text-white'
                  : p.isDowned
                  ? 'bg-red-950/90 border-red-500 text-red-200 animate-pulse'
                  : p.escaped
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                  : 'bg-neutral-950/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  p.escaped ? 'bg-emerald-400' : p.isDowned ? 'bg-red-500 animate-ping' : 'bg-neutral-400'
                }`}
              />
              <span className="font-bold truncate max-w-[80px] md:max-w-[120px]">{p.name}</span>
              <span className="text-[10px] text-neutral-400">
                {p.floor === 0 ? 'B' : p.floor === 1 ? '1F' : '2F'}
              </span>
              {p.isDowned && <span className="text-[10px] text-red-400 font-bold">DOWN!</span>}
              {p.escaped && <span className="text-[10px] text-emerald-400 font-bold">ESCAPED</span>}
            </div>
          ))}
        </div>

        {/* Center: Day Banner & Floor Indicator */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div className="px-5 py-2 bg-neutral-950/90 border border-red-900/80 rounded-xl shadow-lg flex items-center gap-3">
            <span className="text-red-500 font-black text-sm md:text-base font-mono tracking-wider">
              DAY {roomState.currentDay} / 5
            </span>
            <div className="h-4 w-px bg-neutral-800" />
            <span className="text-neutral-300 font-mono text-xs">
              {lang === 'ar' ? floorLabels[localPlayer.floor].ar : floorLabels[localPlayer.floor].en}
            </span>
          </div>

          {/* Sound Noise Meter */}
          <div className="mt-2 flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono border ${noiseLevel.color}`}>
              {noiseLevel.text}
            </span>
          </div>
        </div>

        {/* Right: Escape Checklist Tracker */}
        <div className="pointer-events-auto">
          <button
            onClick={() => setShowObjectives(!showObjectives)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950/90 hover:bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 cursor-pointer"
          >
            <DoorClosed className="w-3.5 h-3.5 text-red-400" />
            <span>{lang === 'ar' ? 'طرق الهروب' : 'ESCAPES'}</span>
            {showObjectives ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showObjectives && (
            <div className="mt-2 p-3 bg-neutral-950/95 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-300 space-y-2 w-56 shadow-2xl backdrop-blur-md">
              <div className="font-bold text-red-400 border-b border-neutral-800 pb-1">
                🚪 {lang === 'ar' ? 'الباب الرئيسي (طابق 1):' : 'MAIN FRONT DOOR:'}
              </div>
              <div className="space-y-1 pl-2 text-[11px]">
                <div className={roomState.escapeProgress.mainDoorPlanksRemoved ? 'text-emerald-400 line-through' : ''}>
                  • {lang === 'ar' ? 'خلع الألواح (عتلة)' : 'Planks (Crowbar)'}
                </div>
                <div className={roomState.escapeProgress.mainDoorAlarmDisabled ? 'text-emerald-400 line-through' : ''}>
                  • {lang === 'ar' ? 'قطع الإنذار (كماشة)' : 'Alarm wire (Pliers)'}
                </div>
                <div className={roomState.escapeProgress.mainDoorPadlockUnlocked ? 'text-emerald-400 line-through' : ''}>
                  • {lang === 'ar' ? 'قفل ذهبي (مفتاح ذهبي)' : 'Padlock (Gold Key)'}
                </div>
                <div className={roomState.escapeProgress.mainDoorMasterUnlocked ? 'text-emerald-400 line-through' : ''}>
                  • {lang === 'ar' ? 'قفل رئيسي (مفتاح أحمر)' : 'Master Lock (Red Key)'}
                </div>
              </div>

              <div className="font-bold text-red-400 border-b border-neutral-800 pb-1 pt-1">
                🚗 {lang === 'ar' ? 'سيارة القبو (طابق 0):' : 'BASEMENT CAR:'}
              </div>
              <div className="space-y-1 pl-2 text-[11px]">
                <div className={roomState.escapeProgress.carBatteryInstalled ? 'text-emerald-400 line-through' : ''}>
                  • {lang === 'ar' ? 'بطارية السيارة' : 'Battery installed'}
                </div>
                <div className={roomState.escapeProgress.carSparkPlugInstalled ? 'text-emerald-400 line-through' : ''}>
                  • {lang === 'ar' ? 'شمعة الإشعال' : 'Spark plug'}
                </div>
                <div className={roomState.escapeProgress.carFueled ? 'text-emerald-400 line-through' : ''}>
                  • {lang === 'ar' ? 'تعبئة البنزين' : 'Gasoline fueled'}
                </div>
                <div className={roomState.escapeProgress.carUnlocked ? 'text-emerald-400 line-through' : ''}>
                  • {lang === 'ar' ? 'مفتاح السيارة' : 'Car key'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Active Interaction Prompt (if near door/item/etc) */}
      {interactionTarget && !localPlayer.isDowned && (
        <div className="self-center pointer-events-auto bg-neutral-950/90 border-2 border-red-500 rounded-2xl p-4 shadow-[0_0_25px_rgba(220,38,38,0.5)] flex flex-col items-center gap-2 max-w-sm text-center animate-bounce duration-700">
          <div className="text-sm md:text-base font-black text-white font-mono">
            {lang === 'ar' ? interactionTarget.labelAr : interactionTarget.label}
          </div>
          {interactionTarget.subText && (
            <div className="text-xs text-neutral-400 font-mono">
              {lang === 'ar' ? interactionTarget.subTextAr : interactionTarget.subText}
            </div>
          )}
          <button
            onClick={onInteract}
            className="px-6 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white font-bold font-mono text-sm tracking-wider shadow-md transition cursor-pointer"
          >
            [E] {lang === 'ar' ? 'تفاعل' : 'INTERACT'}
          </button>
        </div>
      )}

      {/* Bottom Area: Inventory & Controls */}
      <div className="flex flex-col md:flex-row items-end md:items-center justify-between w-full gap-4">
        {/* Mobile Left Virtual Joystick */}
        {showMobileControls && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-28 h-28 rounded-full bg-neutral-900/60 border-2 border-neutral-700/80 pointer-events-auto relative flex items-center justify-center touch-none select-none mb-2"
          >
            <div
              className="w-12 h-12 rounded-full bg-red-800/80 border border-red-500/80 absolute shadow-lg transition-transform"
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              }}
            />
          </div>
        )}

        {/* Center: Inventory Slots & Equipped Item Action */}
        <div className="mx-auto flex flex-col items-center gap-2 pointer-events-auto">
          {/* Quick Radio Shout Button */}
          <div className="flex gap-2 mb-1">
            {['Granny is near!', 'I got a key!', 'Meet at stairs', 'Need help!'].map((callout) => (
              <button
                key={callout}
                onClick={() => onSendRadio(callout)}
                className="px-2.5 py-1 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded text-[11px] font-mono text-neutral-300 cursor-pointer"
              >
                📢 {callout}
              </button>
            ))}
          </div>

          {/* 2 Inventory Slots */}
          <div className="flex items-center gap-3 bg-neutral-950/90 border border-neutral-800 p-2.5 rounded-2xl backdrop-blur-md">
            {[0, 1].map((slotIdx) => {
              const itemType = localPlayer.inventory[slotIdx];
              const isEquipped = itemType && localPlayer.equippedItem === itemType;
              return (
                <div
                  key={slotIdx}
                  className={`w-16 h-16 rounded-xl border flex flex-col items-center justify-center relative cursor-pointer transition ${
                    isEquipped
                      ? 'border-red-500 bg-red-950/50 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                      : itemType
                      ? 'border-neutral-700 bg-neutral-900/80'
                      : 'border-dashed border-neutral-800 bg-neutral-950/40'
                  }`}
                  onClick={() => {
                    if (itemType) {
                      soundManager.playItemPickup();
                      localPlayer.equippedItem = itemType;
                    }
                  }}
                >
                  {itemType ? (
                    <>
                      <span className="text-xl">
                        {itemType.includes('key')
                          ? '🔑'
                          : itemType === 'crowbar'
                          ? '🔨'
                          : itemType === 'pliers'
                          ? '✂️'
                          : itemType === 'medkit'
                          ? '🩹'
                          : itemType.includes('shotgun')
                          ? '🔫'
                          : itemType.includes('battery')
                          ? '🔋'
                          : '📦'}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-300 mt-1 truncate max-w-[56px]">
                        {itemType.split('_')[0].toUpperCase()}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-neutral-600 font-mono">EMPTY</span>
                  )}
                </div>
              );
            })}

            {/* Use Item Button */}
            {localPlayer.equippedItem && (
              <button
                onClick={onUseItem}
                className="px-4 py-3 bg-red-900/90 hover:bg-red-800 border border-red-500 rounded-xl text-white font-bold font-mono text-xs tracking-wider cursor-pointer shadow-lg"
              >
                {lang === 'ar' ? 'استخدام العنصر' : 'USE ITEM [SPACE]'}
              </button>
            )}

            {/* Drop Item Button */}
            {localPlayer.equippedItem && (
              <button
                onClick={() => onDropItem(localPlayer.equippedItem!)}
                className="px-3 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-400 hover:text-white font-mono text-xs cursor-pointer"
                title="Drop Item [G]"
              >
                {lang === 'ar' ? 'إلقاء' : 'DROP [G]'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Right Action Buttons */}
        {showMobileControls && (
          <div className="flex gap-2 pointer-events-auto mb-2">
            {/* Sprint Button */}
            <button
              onClick={() => {
                const n = !sprintLocked;
                setSprintLocked(n);
                onTouchSprint(n);
              }}
              className={`w-14 h-14 rounded-full border flex items-center justify-center font-bold text-xs font-mono cursor-pointer ${
                sprintLocked ? 'bg-amber-700 border-amber-400 text-white' : 'bg-neutral-900/80 border-neutral-700 text-neutral-300'
              }`}
            >
              RUN
            </button>

            {/* Crouch Button */}
            <button
              onClick={() => {
                const n = !crouchLocked;
                setCrouchLocked(n);
                onTouchCrouch(n);
              }}
              className={`w-14 h-14 rounded-full border flex items-center justify-center font-bold text-xs font-mono cursor-pointer ${
                crouchLocked ? 'bg-emerald-700 border-emerald-400 text-white' : 'bg-neutral-900/80 border-neutral-700 text-neutral-300'
              }`}
            >
              SNEAK
            </button>

            {/* Mobile Interact button */}
            {interactionTarget && (
              <button
                onClick={onInteract}
                className="w-14 h-14 rounded-full bg-red-700 border-2 border-red-400 flex items-center justify-center font-bold text-xs font-mono text-white cursor-pointer animate-pulse"
              >
                USE
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
