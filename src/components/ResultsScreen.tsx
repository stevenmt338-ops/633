import React from 'react';
import { Trophy, Skull, Users, HeartHandshake, Clock, RotateCcw, Home } from 'lucide-react';
import { GameRoomState } from '../types/game';
import { soundManager } from '../audio/HorrorAudioManager';

interface ResultsScreenProps {
  roomState: GameRoomState;
  localPlayerId: string;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
  lang: 'ar' | 'en';
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  roomState,
  localPlayerId,
  onPlayAgain,
  onReturnToMenu,
  lang,
}) => {
  const isSurvivorWin = roomState.winner === 'survivors';
  const players = Object.values(roomState.players);
  const durationSec = Math.floor(
    ((roomState.stats.endTime || Date.now()) - roomState.stats.startTime) / 1000
  );
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;

  const routeNames = {
    main_door: { en: 'Main Mansion Front Door', ar: 'الباب الرئيسي للقصر' },
    car: { en: 'Basement Escape Car', ar: 'سيارة القبو السريعة' },
    tunnel: { en: 'Underground Sewer Tunnel', ar: 'نفق الصرف الصحي السري' },
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-40 flex flex-col items-center justify-center p-6 select-none font-sans overflow-y-auto">
      {/* Background Glow */}
      <div
        className={`fixed inset-0 pointer-events-none ${
          isSurvivorWin
            ? 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.15),_transparent_70%)]'
            : 'bg-[radial-gradient(circle_at_center,_rgba(220,38,38,0.25),_transparent_70%)]'
        }`}
      />

      <div className="relative z-10 max-w-xl w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 md:p-8 text-center shadow-2xl backdrop-blur-md animate-scaleIn">
        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          {isSurvivorWin ? (
            <div className="w-20 h-20 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <Trophy className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-950 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse">
              <Skull className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2
          className={`text-3xl md:text-5xl font-black font-['Creepster',cursive] tracking-wider ${
            isSurvivorWin ? 'text-emerald-400' : 'text-red-600'
          }`}
        >
          {isSurvivorWin
            ? lang === 'ar'
              ? 'لقد نجوتم من الكابوس!'
              : 'YOU ESCAPED THE NIGHTMARE!'
            : lang === 'ar'
            ? 'أمسكت بكم غرانّي!'
            : 'GRANNY CAUGHT YOU ALL!'}
        </h2>

        <p className="mt-2 text-sm text-neutral-400 font-mono">
          {isSurvivorWin
            ? roomState.escapeRouteUsed && (
                <span>
                  {lang === 'ar' ? 'طريق الهروب: ' : 'Escape Route: '}
                  <strong className="text-white">
                    {lang === 'ar'
                      ? routeNames[roomState.escapeRouteUsed].ar
                      : routeNames[roomState.escapeRouteUsed].en}
                  </strong>
                </span>
              )
            : lang === 'ar'
            ? 'انتهت الأيام الخمسة... لم ينجُ أحد من قبضتها المرعبة.'
            : 'Day 5 ended... No survivor was ever found again.'}
        </p>

        {/* Team Match Statistics Grid */}
        <div className="grid grid-cols-3 gap-3 my-6 font-mono">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <Users className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">
              {roomState.stats.totalEscaped} / {players.length}
            </div>
            <div className="text-[10px] text-neutral-500">{lang === 'ar' ? 'الناجون' : 'ESCAPED'}</div>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <HeartHandshake className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{roomState.stats.totalRevives}</div>
            <div className="text-[10px] text-neutral-500">{lang === 'ar' ? 'مرات الإنعاش' : 'REVIVES'}</div>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <Clock className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </div>
            <div className="text-[10px] text-neutral-500">{lang === 'ar' ? 'الوقت' : 'TIME'}</div>
          </div>
        </div>

        {/* Players performance list */}
        <div className="space-y-2 mb-6 text-left font-mono text-xs">
          {players.map((p) => (
            <div
              key={p.id}
              className="p-2.5 bg-neutral-950/70 border border-neutral-800 rounded-lg flex items-center justify-between"
            >
              <span className="font-bold text-white">{p.name}</span>
              <span>
                {p.escaped ? (
                  <span className="text-emerald-400 font-bold">{lang === 'ar' ? 'هرب بنجاح' : 'ESCAPED'}</span>
                ) : (
                  <span className="text-red-500">{lang === 'ar' ? 'وقع في الأسر' : 'CAPTURED'}</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              soundManager.playDoorSqueak(true);
              onReturnToMenu();
            }}
            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-xl text-neutral-200 font-mono text-xs md:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            {lang === 'ar' ? 'القائمة الرئيسية' : 'MAIN MENU'}
          </button>

          <button
            onClick={() => {
              soundManager.playBatHit();
              onPlayAgain();
            }}
            className="flex-1 py-3 bg-red-800 hover:bg-red-700 border border-red-500 rounded-xl text-white font-mono text-xs md:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(220,38,38,0.5)]"
          >
            <RotateCcw className="w-4 h-4" />
            {lang === 'ar' ? 'لعب مجدداً' : 'PLAY AGAIN'}
          </button>
        </div>
      </div>
    </div>
  );
};
