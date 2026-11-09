import React, { useState } from 'react';
import { X, User, Trophy, HeartHandshake, Shield, Check } from 'lucide-react';
import { CharacterId } from '../types/game';
import { SURVIVOR_CHARACTERS } from '../data/characters';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  setPlayerName: (n: string) => void;
  selectedChar: CharacterId;
  setSelectedChar: (c: CharacterId) => void;
  stats: {
    gamesPlayed: number;
    escapes: number;
    revives: number;
  };
  lang: 'ar' | 'en';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  playerName,
  setPlayerName,
  selectedChar,
  setSelectedChar,
  stats,
  lang,
}) => {
  const [nameInput, setNameInput] = useState(playerName);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
      localStorage.setItem('granny_player_name', nameInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <h3 className="text-xl font-bold font-mono tracking-wider text-red-500 flex items-center gap-2">
            <User className="w-5 h-5" />
            {lang === 'ar' ? 'ملف الناجي' : 'SURVIVOR PROFILE'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name Input */}
        <form onSubmit={handleSaveName} className="my-4">
          <label className="text-xs font-mono text-neutral-400 block mb-1">
            {lang === 'ar' ? 'اسم اللاعب:' : 'SURVIVOR NICKNAME:'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={15}
              className="flex-1 px-4 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white font-mono focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-white font-mono text-xs font-bold cursor-pointer"
            >
              {lang === 'ar' ? 'حفظ' : 'SAVE'}
            </button>
          </div>
        </form>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 my-4 font-mono text-center">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <Shield className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{stats.gamesPlayed}</div>
            <div className="text-[10px] text-neutral-400">{lang === 'ar' ? 'المباريات' : 'GAMES'}</div>
          </div>
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <Trophy className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-emerald-400">{stats.escapes}</div>
            <div className="text-[10px] text-neutral-400">{lang === 'ar' ? 'مرات الهروب' : 'ESCAPED'}</div>
          </div>
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <HeartHandshake className="w-4 h-4 text-red-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{stats.revives}</div>
            <div className="text-[10px] text-neutral-400">{lang === 'ar' ? 'إنقاذ الزملاء' : 'REVIVES'}</div>
          </div>
        </div>

        {/* Survivor Character Choice */}
        <div>
          <label className="text-xs font-mono text-neutral-400 block mb-2">
            {lang === 'ar' ? 'اختر شخصيتك الافتراضية:' : 'DEFAULT SURVIVOR CHARACTER:'}
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {SURVIVOR_CHARACTERS.map((char) => {
              const isSelected = selectedChar === char.id;
              return (
                <div
                  key={char.id}
                  onClick={() => setSelectedChar(char.id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800 border-red-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0"
                    style={{ backgroundColor: char.color }}
                  >
                    {char.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs truncate">{lang === 'ar' ? char.nameAr : char.name}</div>
                    <div className="text-[10px] text-neutral-500 truncate">
                      {lang === 'ar' ? char.roleAr : char.role}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-red-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white font-mono text-xs font-bold cursor-pointer"
          >
            {lang === 'ar' ? 'تم' : 'DONE'}
          </button>
        </div>
      </div>
    </div>
  );
};
