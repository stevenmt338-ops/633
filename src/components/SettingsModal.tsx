import React from 'react';
import { X, Volume2, VolumeX, Globe, Smartphone, Monitor } from 'lucide-react';
import { soundManager } from '../audio/HorrorAudioManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterVol: number;
  setMasterVol: (v: number) => void;
  sfxVol: number;
  setSfxVol: (v: number) => void;
  musicVol: number;
  setMusicVol: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  showMobileControls: boolean;
  setShowMobileControls: (b: boolean) => void;
  lang: 'ar' | 'en';
  setLang: (l: 'ar' | 'en') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  masterVol,
  setMasterVol,
  sfxVol,
  setSfxVol,
  musicVol,
  setMusicVol,
  isMuted,
  setIsMuted,
  showMobileControls,
  setShowMobileControls,
  lang,
  setLang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <h3 className="text-xl font-bold font-mono tracking-wider text-red-500">
            {lang === 'ar' ? 'إعدادات اللعبة' : 'GAME SETTINGS'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="space-y-5 py-4 font-mono text-sm">
          {/* Language Switch */}
          <div>
            <label className="text-xs text-neutral-400 block mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-400" />
              {lang === 'ar' ? 'اللغة / Language:' : 'Language / اللغة:'}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setLang('ar')}
                className={`flex-1 py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                  lang === 'ar'
                    ? 'bg-red-950 border-red-500 text-white'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => setLang('en')}
                className={`flex-1 py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                  lang === 'en'
                    ? 'bg-red-950 border-red-500 text-white'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Master Volume */}
          <div>
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>{lang === 'ar' ? 'مستوى الصوت العام' : 'Master Volume'}</span>
              <span>{Math.round(masterVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVol}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setMasterVol(v);
                soundManager.setVolumes(v, sfxVol, musicVol);
              }}
              className="w-full accent-red-600 bg-neutral-800 h-2 rounded cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>{lang === 'ar' ? 'المؤثرات الصوتية (SFX)' : 'Sound Effects (SFX)'}</span>
              <span>{Math.round(sfxVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVol}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setSfxVol(v);
                soundManager.setVolumes(masterVol, v, musicVol);
              }}
              className="w-full accent-red-600 bg-neutral-800 h-2 rounded cursor-pointer"
            />
          </div>

          {/* Mobile Joystick Controls toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-red-400" />
              <div>
                <div className="text-xs font-bold text-white">
                  {lang === 'ar' ? 'أزرار التحكم باللمس للشاشات' : 'Touch Screen Controls'}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {lang === 'ar' ? 'عصا تحكم افتراضية وأزرار للهواتف' : 'Virtual joystick and buttons for mobile'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowMobileControls(!showMobileControls)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                showMobileControls ? 'bg-red-700' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  showMobileControls ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Mute All */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <span className="text-xs text-neutral-300">
              {lang === 'ar' ? 'كتم جميع الأصوات' : 'Mute All Sounds'}
            </span>
            <button
              onClick={() => {
                const m = !isMuted;
                setIsMuted(m);
                soundManager.setMuted(m);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isMuted ? 'bg-red-950 border-red-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-300'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              {isMuted ? (lang === 'ar' ? 'مكتوم' : 'MUTED') : (lang === 'ar' ? 'مفعل' : 'ACTIVE')}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white font-mono text-xs font-bold cursor-pointer"
          >
            {lang === 'ar' ? 'إغلاق' : 'CLOSE'}
          </button>
        </div>
      </div>
    </div>
  );
};
