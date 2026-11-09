import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { CharacterId, ChatMessage, GameRoomState, ItemType } from './types/game';
import { CinematicIntro } from './components/CinematicIntro';
import { MainMenu } from './components/MainMenu';
import { RoomLobby } from './components/RoomLobby';
import { InGameHUD } from './components/InGameHUD';
import { ResultsScreen } from './components/ResultsScreen';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { PhaserGame } from './game/PhaserGame';
import { InteractionTarget } from './game/scenes/HouseScene';
import { soundManager } from './audio/HorrorAudioManager';

export default function App() {
  // Screens: intro, menu, lobby, game, results
  const [screen, setScreen] = useState<'intro' | 'menu' | 'lobby' | 'game' | 'results'>('intro');

  // Player Session
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('granny_player_name') || `Survivor_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [selectedChar, setSelectedChar] = useState<CharacterId>('ethan');
  const [playerToken] = useState<string>(() => {
    let t = sessionStorage.getItem('granny_session_token');
    if (!t) {
      t = `tok_${Date.now()}_${Math.random()}`;
      sessionStorage.setItem('granny_session_token', t);
    }
    return t;
  });

  // Settings
  const [masterVol, setMasterVol] = useState(0.8);
  const [sfxVol, setSfxVol] = useState(0.9);
  const [musicVol, setMusicVol] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(() => {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  });
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Cumulative Stats
  const [stats, setStats] = useState({
    gamesPlayed: Number(localStorage.getItem('granny_games_played') || '0'),
    escapes: Number(localStorage.getItem('granny_escapes') || '0'),
    revives: Number(localStorage.getItem('granny_revives') || '0'),
  });

  // Socket & Room State
  const socketRef = useRef<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [roomState, setRoomState] = useState<GameRoomState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [interactionTarget, setInteractionTarget] = useState<InteractionTarget | null>(null);

  // Touch Virtual Joystick vectors
  const [touchVector, setTouchVector] = useState({ x: 0, y: 0 });
  const [touchSprinting, setTouchSprinting] = useState(false);
  const [touchCrouching, setTouchCrouching] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('room_state_update', (newState: GameRoomState) => {
      setRoomState(newState);
      if (newState.status === 'in_game' || newState.status === 'day_transition') {
        setScreen('game');
      } else if (newState.status === 'ended') {
        setScreen('results');
        // Update stats
        if (newState.winner === 'survivors') {
          const newEscapes = stats.escapes + 1;
          const newGames = stats.gamesPlayed + 1;
          setStats((prev) => ({ ...prev, escapes: newEscapes, gamesPlayed: newGames }));
          localStorage.setItem('granny_escapes', String(newEscapes));
          localStorage.setItem('granny_games_played', String(newGames));
        } else {
          const newGames = stats.gamesPlayed + 1;
          setStats((prev) => ({ ...prev, gamesPlayed: newGames }));
          localStorage.setItem('granny_games_played', String(newGames));
        }
      } else if (newState.status === 'waiting') {
        setScreen('lobby');
      }
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-30), msg]);
    });

    socket.on('door_unlocked', () => {
      soundManager.playUnlockKey();
    });

    socket.on('door_toggled', (data: { isOpen: boolean }) => {
      soundManager.playDoorSqueak(data.isOpen);
    });

    socket.on('player_downed', () => {
      soundManager.playBatHit();
    });

    socket.on('player_trapped', () => {
      soundManager.playBearTrapSnap();
    });

    socket.on('player_revived', () => {
      soundManager.playReviveSuccess();
      setStats((prev) => {
        const nr = prev.revives + 1;
        localStorage.setItem('granny_revives', String(nr));
        return { ...prev, revives: nr };
      });
    });

    socket.on('day_advanced', () => {
      soundManager.playDayGong();
    });

    socket.on('granny_stunned', () => {
      soundManager.playGrannyScream();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Keyboard shortcut listener for in-game actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'game') return;

      if (e.key === 'e' || e.key === 'E') {
        handleInteract();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleUseItem();
      } else if (e.key === 'g' || e.key === 'G') {
        const sid = socketRef.current?.id;
        const local = sid && roomState ? roomState.players[sid] : undefined;
        if (local && local.equippedItem) {
          handleDropItem(local.equippedItem);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, interactionTarget, roomState]);

  // Actions
  const handleQuickMatch = () => {
    if (!socketRef.current) return;
    socketRef.current.emit(
      'quick_match',
      { name: playerName, character: selectedChar, token: playerToken },
      (res: { success: boolean; state: GameRoomState }) => {
        if (res.success) {
          setRoomState(res.state);
          setScreen('lobby');
        }
      }
    );
  };

  const handleCreateRoom = (maxPlayers: number, isPublic: boolean) => {
    if (!socketRef.current) return;
    socketRef.current.emit(
      'create_room',
      { name: playerName, character: selectedChar, maxPlayers, isPublic, token: playerToken },
      (res: { success: boolean; state: GameRoomState }) => {
        if (res.success) {
          setRoomState(res.state);
          setScreen('lobby');
        }
      }
    );
  };

  const handleJoinRoom = (roomId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit(
      'join_room',
      { roomId, name: playerName, character: selectedChar, token: playerToken },
      (res: { success: boolean; state?: GameRoomState; message?: string }) => {
        if (res.success && res.state) {
          setRoomState(res.state);
          setScreen('lobby');
        } else {
          alert(res.message || 'Could not join room');
        }
      }
    );
  };

  const handleSetReady = (isReady: boolean) => {
    socketRef.current?.emit('set_ready', { isReady });
  };

  const handleSelectCharacter = (charId: CharacterId) => {
    setSelectedChar(charId);
    socketRef.current?.emit('set_character', { character: charId });
  };

  const handleStartGame = () => {
    socketRef.current?.emit('start_game');
  };

  const handleLeaveRoom = () => {
    soundManager.stopHeartbeat();
    setRoomState(null);
    setScreen('menu');
  };

  const handleMove = (data: { x: number; y: number; rotation: number; isSprinting: boolean; isCrouching: boolean }) => {
    socketRef.current?.emit('player_move', data);
  };

  const handleInteract = () => {
    if (!interactionTarget || !socketRef.current) return;

    if (interactionTarget.type === 'door') {
      socketRef.current.emit('toggle_door', { doorId: interactionTarget.id });
    } else if (interactionTarget.type === 'item') {
      socketRef.current.emit('pickup_item', { itemId: interactionTarget.id });
    } else if (interactionTarget.type === 'stair') {
      socketRef.current.emit('use_stairs', { stairId: interactionTarget.id });
    } else if (interactionTarget.type === 'hiding') {
      socketRef.current.emit('toggle_hiding', { spotId: interactionTarget.id });
    } else if (interactionTarget.type === 'teammate') {
      socketRef.current.emit('revive_teammate', { targetId: interactionTarget.id });
    }
  };

  const handleUseItem = () => {
    socketRef.current?.emit('use_item');
  };

  const handleDropItem = (itemType: ItemType) => {
    socketRef.current?.emit('drop_item', { itemType });
  };

  const handleSendRadio = (text: string) => {
    socketRef.current?.emit('send_chat', { text, isRadio: true });
  };

  const currentSocketId = socketRef.current?.id || '';

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="w-screen h-screen overflow-hidden bg-black text-white relative font-sans"
    >
      {/* 1. Cinematic Horror Intro */}
      {screen === 'intro' && (
        <CinematicIntro
          lang={lang}
          onComplete={() => {
            soundManager.startAtmosphericAmbience();
            setScreen('menu');
          }}
        />
      )}

      {/* 2. Main Menu */}
      {screen === 'menu' && (
        <MainMenu
          playerName={playerName}
          onQuickMatch={handleQuickMatch}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onOpenProfile={() => setShowProfile(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenGuide={() => setShowGuide(true)}
          lang={lang}
        />
      )}

      {/* 3. Multiplayer Room Lobby */}
      {screen === 'lobby' && roomState && (
        <RoomLobby
          roomState={roomState}
          localPlayerId={currentSocketId}
          onSetReady={handleSetReady}
          onSelectCharacter={handleSelectCharacter}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
          chatMessages={chatMessages}
          onSendChat={(text) => socketRef.current?.emit('send_chat', { text })}
          lang={lang}
        />
      )}

      {/* 4. Game Screen (Phaser 3 Canvas + InGame HUD) */}
      {(screen === 'game' || (screen === 'results' && roomState)) && roomState && (
        <div className="relative w-full h-full overflow-hidden">
          <PhaserGame
            localPlayerId={currentSocketId}
            gameState={roomState}
            onInteractionTargetChange={setInteractionTarget}
            onMove={handleMove}
            touchVector={touchVector}
            touchSprinting={touchSprinting}
            touchCrouching={touchCrouching}
          />

          <InGameHUD
            roomState={roomState}
            localPlayerId={currentSocketId}
            interactionTarget={interactionTarget}
            onInteract={handleInteract}
            onUseItem={handleUseItem}
            onDropItem={handleDropItem}
            onSendRadio={handleSendRadio}
            onTouchJoystick={setTouchVector}
            onTouchSprint={setTouchSprinting}
            onTouchCrouch={setTouchCrouching}
            showMobileControls={showMobileControls}
            lang={lang}
          />
        </div>
      )}

      {/* 5. Results Screen */}
      {screen === 'results' && roomState && (
        <ResultsScreen
          roomState={roomState}
          localPlayerId={currentSocketId}
          onPlayAgain={() => {
            setScreen('lobby');
          }}
          onReturnToMenu={() => {
            setRoomState(null);
            setScreen('menu');
          }}
          lang={lang}
        />
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        masterVol={masterVol}
        setMasterVol={setMasterVol}
        sfxVol={sfxVol}
        setSfxVol={setSfxVol}
        musicVol={musicVol}
        setMusicVol={setMusicVol}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        showMobileControls={showMobileControls}
        setShowMobileControls={setShowMobileControls}
        lang={lang}
        setLang={setLang}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        playerName={playerName}
        setPlayerName={setPlayerName}
        selectedChar={selectedChar}
        setSelectedChar={setSelectedChar}
        stats={stats}
        lang={lang}
      />

      <HowToPlayModal isOpen={showGuide} onClose={() => setShowGuide(false)} lang={lang} />
    </div>
  );
}
