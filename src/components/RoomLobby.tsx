import React, { useState } from 'react';
import { Copy, Check, Play, LogOut, Crown, CheckCircle2, Circle, Radio, Send, Users, Shield } from 'lucide-react';
import { CharacterId, ChatMessage, GameRoomState } from '../types/game';
import { SURVIVOR_CHARACTERS } from '../data/characters';
import { soundManager } from '../audio/HorrorAudioManager';

interface RoomLobbyProps {
  roomState: GameRoomState;
  localPlayerId: string;
  onSetReady: (isReady: boolean) => void;
  onSelectCharacter: (charId: CharacterId) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  chatMessages: ChatMessage[];
  onSendChat: (text: string) => void;
  lang: 'ar' | 'en';
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  roomState,
  localPlayerId,
  onSetReady,
  onSelectCharacter,
  onStartGame,
  onLeaveRoom,
  chatMessages,
  onSendChat,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const localPlayer = roomState.players[localPlayerId];
  const isHost = localPlayer?.isHost ?? false;
  const isReady = localPlayer?.isReady ?? false;
  const playersList = Object.values(roomState.players);
  const canStart = isHost && playersList.length >= 1; // Allows solo testing or full group!

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendChat(chatInput.trim());
      setChatInput('');
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-neutral-950 flex flex-col p-4 md:p-8 select-none font-sans overflow-y-auto">
      {/* Background Horror Texture */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-black pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onLeaveRoom}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-600 rounded-lg text-neutral-400 hover:text-white transition flex items-center gap-2 text-sm font-mono cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            {lang === 'ar' ? 'مغادرة الغرفة' : 'LEAVE'}
          </button>

          <div>
            <div className="text-xs font-mono text-neutral-400">{lang === 'ar' ? 'غرفة اللعب' : 'LOBBY ROOM'}</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-black font-mono tracking-widest text-red-500">
                {roomState.roomId}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 transition cursor-pointer"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Players Count & Status */}
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-neutral-900/90 border border-neutral-800 rounded-lg flex items-center gap-2">
            <Users className="w-4 h-4 text-red-400" />
            <span className="font-mono text-sm text-neutral-200">
              {playersList.length} / {roomState.maxPlayers} {lang === 'ar' ? 'لاعبين' : 'PLAYERS'}
            </span>
          </div>

          {/* Ready / Start Buttons */}
          <button
            onClick={() => {
              soundManager.playDoorSqueak(true);
              onSetReady(!isReady);
            }}
            className={`px-5 py-2.5 rounded-lg font-bold font-mono text-sm tracking-wider border transition cursor-pointer flex items-center gap-2 ${
              isReady
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-red-500'
            }`}
          >
            {isReady ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
            {isReady ? (lang === 'ar' ? 'جاهز!' : 'READY!') : (lang === 'ar' ? 'غير جاهز' : 'SET READY')}
          </button>

          {isHost && (
            <button
              onClick={() => {
                soundManager.playBatHit();
                onStartGame();
              }}
              disabled={!canStart}
              className="px-6 py-2.5 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 disabled:opacity-40 border border-red-500 rounded-lg text-white font-black font-mono text-sm tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.5)] transition flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              {lang === 'ar' ? 'بدء الهروب' : 'START MATCH'}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1">
        {/* Left 2 Cols: Players in Lobby & Character Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Players Slots */}
          <div>
            <h3 className="text-sm font-mono text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              {lang === 'ar' ? 'الناجون في هذه الغرفة' : 'SURVIVORS IN SESSION'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {playersList.map((player) => {
                const char = SURVIVOR_CHARACTERS.find((c) => c.id === player.character);
                return (
                  <div
                    key={player.id}
                    className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl flex items-center gap-3 relative overflow-hidden"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-inner"
                      style={{ backgroundColor: char?.color || '#3b82f6' }}
                    >
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-sm truncate">{player.name}</span>
                        {player.isHost && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                      </div>
                      <div className="text-xs text-neutral-400 font-mono truncate">
                        {lang === 'ar' ? char?.roleAr : char?.role}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {player.isReady ? (
                        <span className="px-2 py-1 bg-emerald-950 border border-emerald-600 rounded text-[10px] font-mono text-emerald-300">
                          READY
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-mono text-neutral-400">
                          WAITING
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Select Your Character */}
          <div>
            <h3 className="text-sm font-mono text-neutral-400 uppercase tracking-wider mb-3">
              {lang === 'ar' ? 'اختر شخصيتك ومهارتك:' : 'CHOOSE YOUR SURVIVOR CHARACTER & PERK:'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {SURVIVOR_CHARACTERS.map((char) => {
                const isSelected = localPlayer?.character === char.id;
                return (
                  <div
                    key={char.id}
                    onClick={() => {
                      soundManager.playFootstep();
                      onSelectCharacter(char.id);
                    }}
                    className={`p-3.5 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-neutral-800 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: char.color }}
                      >
                        {char.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{lang === 'ar' ? char.nameAr : char.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {lang === 'ar' ? char.roleAr : char.role}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 font-mono bg-neutral-950/60 p-2 rounded border border-neutral-800/80">
                      ⚡ {lang === 'ar' ? char.perkAr : char.perk}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Walkie-Talkie Radio Chat */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col h-[480px]">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800 text-xs font-mono text-neutral-400">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{lang === 'ar' ? 'جهاز اللاسلكي (شات الغرفة)' : 'RADIO WALKIE-TALKIE'}</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2 font-mono text-xs">
            {chatMessages.length === 0 && (
              <div className="text-neutral-500 italic text-center py-10">
                {lang === 'ar' ? 'اللاسلكي هادئ... تحدث مع فريقك' : 'Radio is quiet... coordinate with teammates.'}
              </div>
            )}
            {chatMessages.map((msg) => (
              <div key={msg.id} className="p-2 bg-neutral-950/60 rounded border border-neutral-800/80">
                <span className="font-bold text-red-400">{msg.senderName}: </span>
                <span className="text-neutral-200">{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Quick preset horror callouts */}
          <div className="flex flex-wrap gap-1.5 py-2 border-t border-neutral-800">
            {['Ready to Escape!', 'I will check Basement', 'Stay quiet!', 'Help me with Front Door'].map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => onSendChat(phrase)}
                className="text-[10px] font-mono px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition cursor-pointer"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSendChat} className="flex gap-2 pt-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={lang === 'ar' ? 'اكتب رسالة لاسلكية...' : 'Type radio message...'}
              maxLength={80}
              className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded text-xs text-white font-mono focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 bg-red-900/80 hover:bg-red-800 text-white rounded border border-red-600 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
