import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, FastForward, Play, Skull } from 'lucide-react';
import { soundManager } from '../audio/HorrorAudioManager';

interface CinematicIntroProps {
  onComplete: () => void;
  lang: 'ar' | 'en';
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete, lang }) => {
  const [step, setStep] = useState<number>(0);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [flash, setFlash] = useState<boolean>(false);
  const [grannyVisible, setGrannyVisible] = useState<boolean>(false);
  const [showPlayButton, setShowPlayButton] = useState<boolean>(false);

  const startCinematic = () => {
    setHasInteracted(true);
    soundManager.init();
    soundManager.startAtmosphericAmbience();
    soundManager.playFootstep(false, false);

    // Sequence of horror timeline
    setStep(1);

    // Footsteps sequence
    setTimeout(() => soundManager.playFootstep(false, false), 1200);
    setTimeout(() => soundManager.playFootstep(false, false), 2400);

    // Lightning Flash 1: House silhouette
    setTimeout(() => {
      setFlash(true);
      soundManager.playThunder();
      setStep(2);
      setTimeout(() => setFlash(false), 250);
    }, 3200);

    // Footsteps closer
    setTimeout(() => soundManager.playFootstep(true, false), 4500);

    // Lightning Flash 2: Granny silhouette appears
    setTimeout(() => {
      setFlash(true);
      setGrannyVisible(true);
      soundManager.playThunder();
      soundManager.playGrannyScream();
      soundManager.updateHeartbeatTerror(0.9);
      setStep(3);
      setTimeout(() => setFlash(false), 350);
    }, 5800);

    // Final Logo Burn & Play Button
    setTimeout(() => {
      setShowPlayButton(true);
      setStep(4);
    }, 8000);
  };

  const handleSkip = () => {
    soundManager.stopHeartbeat();
    onComplete();
  };

  const handlePlayNow = () => {
    soundManager.stopHeartbeat();
    soundManager.playJumpscare();
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Lightning Flash Overlay */}
      <div
        className={`fixed inset-0 bg-white pointer-events-none transition-opacity duration-150 ${
          flash ? 'opacity-85' : 'opacity-0'
        }`}
      />

      {/* Skip Intro Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-neutral-900/80 hover:bg-red-950/80 border border-neutral-700 hover:border-red-600 text-neutral-300 hover:text-white rounded text-sm transition font-mono tracking-wider cursor-pointer"
      >
        <FastForward className="w-4 h-4 text-red-500" />
        {lang === 'ar' ? 'تخطي الانترو' : 'SKIP INTRO'}
      </button>

      {/* Screen 0: Initial Click to start sound */}
      {!hasInteracted && (
        <div
          onClick={startCinematic}
          className="cursor-pointer flex flex-col items-center justify-center text-center p-8 max-w-lg animate-pulse"
        >
          <div className="w-20 h-20 rounded-full border-2 border-red-800 flex items-center justify-center mb-6 bg-red-950/30 shadow-[0_0_30px_rgba(220,38,38,0.4)]">
            <Play className="w-8 h-8 text-red-500 fill-red-500 ml-1" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-red-100 tracking-widest font-mono mb-2 uppercase">
            {lang === 'ar' ? 'انقر للبدء (يوصى باستخدام سماعات الرأس)' : 'CLICK TO ENTER THE NIGHTMARE'}
          </h2>
          <p className="text-sm text-neutral-400 font-mono">
            {lang === 'ar' ? 'تحذير: تحتوي اللعبة على أصواء رعب وقفزات مخيفة' : 'HEADPHONES HIGHLY RECOMMENDED FOR 3D AUDIO TERROR'}
          </p>
        </div>
      )}

      {/* Atmospheric Visuals during cinematic */}
      {hasInteracted && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Ambient Rain / Mist background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900/40 via-black to-black" />

          {/* Haunted House Silhouette */}
          {(step >= 2 || flash) && (
            <div className="relative z-10 flex flex-col items-center">
              {/* Victorian House SVG Graphic */}
              <div className="relative w-[340px] md:w-[460px] h-[260px] flex items-end justify-center">
                <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">
                  {/* Moon */}
                  <circle cx="90" cy="70" r="32" fill="#d0d0d8" opacity="0.3" filter="blur(1px)" />

                  {/* House base */}
                  <polygon points="120,140 200,60 280,140" fill="#0d0d10" />
                  <rect x="135" y="140" width="130" height="130" fill="#09090c" />

                  {/* Left Tower */}
                  <polygon points="60,160 100,100 140,160" fill="#0a0a0d" />
                  <rect x="70" y="160" width="60" height="110" fill="#07070a" />

                  {/* Right Attic */}
                  <polygon points="260,170 310,110 360,170" fill="#0a0a0d" />
                  <rect x="270" y="170" width="80" height="100" fill="#07070a" />

                  {/* Windows with eerie flickering glow */}
                  <rect x="185" y="165" width="30" height="40" fill={flash ? '#ff2222' : '#331a00'} rx="4" />
                  <rect x="85" y="185" width="25" height="35" fill={flash ? '#ff4444' : '#221100'} rx="4" />

                  {/* Dead Gnarled Trees */}
                  <path d="M40,270 Q50,200 30,170 Q45,190 60,150 Q45,210 50,270" stroke="#060608" strokeWidth="8" fill="none" />
                  <path d="M370,270 Q350,210 375,180 Q360,195 345,160 Q360,220 360,270" stroke="#060608" strokeWidth="8" fill="none" />
                </svg>

                {/* Granny Terror Silhouette */}
                {grannyVisible && (
                  <div className="absolute top-[85px] z-20 flex flex-col items-center animate-bounce duration-1000">
                    <div className="relative">
                      {/* Granny Shadow Figure */}
                      <div className="w-16 h-28 bg-neutral-950 rounded-t-full relative border border-red-950 flex flex-col items-center">
                        {/* Bun Hair */}
                        <div className="w-6 h-6 bg-neutral-800 rounded-full -mt-2" />
                        {/* Eyes */}
                        <div className="flex gap-3 mt-4">
                          <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                          <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                        </div>
                        {/* Bat */}
                        <div className="absolute -right-5 top-5 w-2.5 h-20 bg-amber-950 rotate-45 border-t-4 border-red-700" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Creepy Subtitles */}
          {step === 1 && (
            <div className="absolute bottom-24 text-neutral-400 font-mono tracking-widest text-sm animate-pulse">
              {lang === 'ar' ? '...صوت خطوات يقترب في الظلام' : '...HEAVY FOOTSTEPS IN THE DARKNESS'}
            </div>
          )}

          {step === 2 && (
            <div className="absolute bottom-24 text-neutral-400 font-mono tracking-widest text-sm">
              {lang === 'ar' ? 'المنزل المهجور... حيث لا يخرج أحد حياً' : 'THE ABANDONED RESIDENCE OF HORROR'}
            </div>
          )}

          {step === 3 && (
            <div className="absolute bottom-24 text-red-500 font-bold font-mono tracking-widest text-base animate-pulse">
              {lang === 'ar' ? '«أنا أراكم... هل تريدون لعب الغميضة؟»' : '“I SEE YOU... WANNA PLAY HIDE AND SEEK?”'}
            </div>
          )}

          {/* Stage 4: Bloody Game Logo & PLAY NOW Button */}
          {showPlayButton && (
            <div className="relative z-30 flex flex-col items-center mt-6 animate-fadeIn">
              <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-red-500 via-red-700 to-neutral-950 tracking-wider text-center drop-shadow-[0_10px_25px_rgba(255,0,0,0.6)] font-['Creepster',cursive]">
                GRANNY: THE NIGHTMARE
              </h1>
              <p className="text-sm md:text-base text-neutral-400 font-mono tracking-widest mt-2 uppercase text-center">
                {lang === 'ar' ? 'لعبة رعب جماعية متعددة اللاعبين - هل تنجو من اليوم الخامس؟' : '2D MULTIPLAYER HORROR • SURVIVE 5 DAYS WITH YOUR TEAM'}
              </p>

              <button
                onClick={handlePlayNow}
                className="mt-8 group relative px-10 py-4 bg-red-950/90 hover:bg-red-800 border-2 border-red-600 hover:border-red-400 rounded-lg text-white font-black text-xl tracking-widest transition-all duration-200 transform hover:scale-105 shadow-[0_0_40px_rgba(220,38,38,0.7)] flex items-center gap-3 cursor-pointer"
              >
                <Skull className="w-6 h-6 text-red-400 group-hover:rotate-12 transition-transform" />
                {lang === 'ar' ? 'العب الآن' : 'PLAY NOW'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
