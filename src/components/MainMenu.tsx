import React, { useState } from 'react';
import { Skull, Users, Play, PlusCircle, LogIn, User, Settings, HelpCircle, Flame, ShieldAlert } from 'lucide-react';
import { soundManager } from '../audio/HorrorAudioManager';

interface MainMenuProps {
  playerName: string;
  onQuickMatch: () => void;
  onCreateRoom: (maxPlayers: number, isPublic: boolean) => void;
  onJoinRoom: (roomId: string) => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  lang: 'ar' | 'en';
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  onQuickMatch,
  onCreateRoom,
  onJoinRoom,
  onOpenProfile,
  onOpenSettings,
  onOpenGuide,
  lang,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createMaxPlayers, setCreateMaxPlayers] = useState(4);
  const [createIsPublic, setCreateIsPublic] = useState(true);

  const handleQuickMatch = () => {
    soundManager.playBatHit();
    onQuickMatch();
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCodeInput.trim().length >= 3) {
      soundManager.playDoorSqueak(true);
      onJoinRoom(joinCodeInput.trim().toUpperCase());
    }
  };

  const handleCreateSubmit = () => {
    soundManager.playDoorSqueak(true);
    onCreateRoom(createMaxPlayers, createIsPublic);
    setShowCreateDialog(false);
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-neutral-950 flex flex-col items-center justify-between p-6 overflow-y-auto select-none font-sans">
      {/* Dark Ambient Vignette Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-neutral-950 to-black pointer-events-none" />

      {/* Top Bar: Player profile pill & Settings */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between py-2">
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-3 px-4 py-2 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 hover:border-red-600 rounded-lg cursor-pointer transition"
        >
          <div className="w-8 h-8 rounded-full bg-red-900/60 border border-red-500/50 flex items-center justify-center text-red-200">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs text-neutral-400 font-mono">{lang === 'ar' ? 'الناجي' : 'SURVIVOR'}</div>
            <div className="text-sm font-bold text-white tracking-wider">{playerName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGuide}
            className="p-2.5 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500 rounded-lg text-neutral-300 hover:text-amber-400 transition cursor-pointer"
            title={lang === 'ar' ? 'دليل اللعب والهروب' : 'How To Play'}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2.5 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 hover:border-red-500 rounded-lg text-neutral-300 hover:text-red-400 transition cursor-pointer"
            title={lang === 'ar' ? 'الإعدادات' : 'Settings'}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero Center Title */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-8">
        <div className="relative mb-2">
          <Skull className="w-16 h-16 text-red-600 mx-auto filter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-red-600/10 rounded-full blur-xl pointer-events-none" />
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white font-['Creepster',cursive] drop-shadow-[0_4px_20px_rgba(255,0,0,0.5)]">
          GRANNY: THE NIGHTMARE
        </h1>
        <p className="mt-2 text-sm md:text-base text-neutral-400 font-mono tracking-widest uppercase max-w-md">
          {lang === 'ar'
            ? 'لعبة رعب تعاونية أونلاين • 2 إلى 6 لاعبين • اهرب من المنزل قبل اليوم الخامس'
            : '2D MULTIPLAYER SURVIVAL HORROR • 2-6 PLAYERS • ESCAPE BEFORE DAY 5'}
        </p>

        {/* Action Buttons Grid */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-md">
          {/* Quick Match Button */}
          <button
            onClick={handleQuickMatch}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-red-900 via-red-800 to-red-900 hover:from-red-800 hover:to-red-700 border-2 border-red-500 rounded-xl text-white font-black text-lg tracking-wider transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            {lang === 'ar' ? 'مباراة سريعة' : 'QUICK MATCH'}
          </button>

          {/* Create Room Button */}
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex-1 py-4 px-6 bg-neutral-900/90 hover:bg-neutral-800 border-2 border-neutral-700 hover:border-red-500 rounded-xl text-neutral-200 hover:text-white font-bold text-base tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-red-500" />
            {lang === 'ar' ? 'إنشاء غرفة' : 'CREATE ROOM'}
          </button>
        </div>

        {/* Join Room by Code */}
        <form onSubmit={handleJoinSubmit} className="mt-4 flex gap-2 w-full max-w-md">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            placeholder={lang === 'ar' ? 'أدخل كود الغرفة (مثال: ABCD)' : 'ENTER ROOM CODE (e.g. ABCD)'}
            maxLength={6}
            className="flex-1 px-4 py-3 bg-neutral-900/80 border border-neutral-700 focus:border-red-500 rounded-lg text-white font-mono text-center tracking-widest placeholder:text-neutral-500 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={joinCodeInput.trim().length < 3}
            className="px-6 py-3 bg-neutral-800 hover:bg-red-950 disabled:opacity-40 disabled:hover:bg-neutral-800 border border-neutral-600 hover:border-red-500 rounded-lg text-white font-bold text-sm tracking-wider transition flex items-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {lang === 'ar' ? 'انضمام' : 'JOIN'}
          </button>
        </form>
      </div>

      {/* Bottom Info Banner */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 font-mono pt-4 border-t border-neutral-900 gap-2">
        <div className="flex items-center gap-2 text-neutral-400">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span>{lang === 'ar' ? 'تحذير: لا تصدر ضوضاء، غرانّي تسمع كل شيء!' : 'WARNING: STAY QUIET. GRANNY HEARS ALL SOUNDS.'}</span>
        </div>
        <div>v2.0 • PHASER 3 + SOCKET.IO MULTIPLAYER</div>
      </footer>

      {/* Create Room Modal */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-md w-full p-6 text-white shadow-2xl animate-scaleIn">
            <h3 className="text-xl font-bold font-mono tracking-wider text-red-400 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              {lang === 'ar' ? 'إعدادات الغرفة الجديدة' : 'CREATE MULTIPLAYER ROOM'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-2">
                  {lang === 'ar' ? 'الحد الأقصى للاعبين (2 إلى 6):' : 'MAX PLAYERS (2 TO 6):'}
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCreateMaxPlayers(num)}
                      className={`flex-1 py-2 rounded-lg font-bold font-mono border transition cursor-pointer ${
                        createMaxPlayers === num
                          ? 'bg-red-900/80 border-red-500 text-white'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-2">
                  {lang === 'ar' ? 'نوع الغرفة:' : 'ROOM PRIVACY:'}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateIsPublic(true)}
                    className={`flex-1 py-2 px-3 rounded-lg border font-mono text-xs transition cursor-pointer ${
                      createIsPublic
                        ? 'bg-red-950/80 border-red-500 text-red-200'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {lang === 'ar' ? 'عامة (تظهر في Quick Match)' : 'PUBLIC (Visible in Quick Match)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateIsPublic(false)}
                    className={`flex-1 py-2 px-3 rounded-lg border font-mono text-xs transition cursor-pointer ${
                      !createIsPublic
                        ? 'bg-red-950/80 border-red-500 text-red-200'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {lang === 'ar' ? 'خاصة (بالكود فقط)' : 'PRIVATE (Code only)'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-300 font-mono text-sm cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'CANCEL'}
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                className="flex-1 py-2.5 bg-red-800 hover:bg-red-700 border border-red-500 rounded-lg text-white font-bold font-mono text-sm shadow-[0_0_15px_rgba(220,38,38,0.5)] cursor-pointer"
              >
                {lang === 'ar' ? 'بدء الغرفة' : 'CREATE NOW'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
