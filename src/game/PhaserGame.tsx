import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { HouseScene, InteractionTarget } from './scenes/HouseScene';
import { GameRoomState } from '../types/game';

interface PhaserGameProps {
  localPlayerId: string;
  gameState: GameRoomState;
  onInteractionTargetChange: (target: InteractionTarget | null) => void;
  onMove: (data: { x: number; y: number; rotation: number; isSprinting: boolean; isCrouching: boolean }) => void;
  touchVector: { x: number; y: number };
  touchSprinting: boolean;
  touchCrouching: boolean;
}

export const PhaserGame: React.FC<PhaserGameProps> = ({
  localPlayerId,
  gameState,
  onInteractionTargetChange,
  onMove,
  touchVector,
  touchSprinting,
  touchCrouching,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<HouseScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth || 1024,
      height: containerRef.current.clientHeight || 768,
      backgroundColor: '#0a0a0c',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: false,
        antialias: true,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const scene = new HouseScene();
    sceneRef.current = scene;

    game.scene.add('HouseScene', scene, true, {
      localPlayerId,
      onInteractionTargetChange,
      onMove,
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, [localPlayerId]);

  // Sync game state to scene
  useEffect(() => {
    if (sceneRef.current && gameState) {
      sceneRef.current.updateGameState(gameState);
    }
  }, [gameState]);

  // Sync touch controls
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setTouchControls(touchVector, touchSprinting, touchCrouching);
    }
  }, [touchVector, touchSprinting, touchCrouching]);

  return <div ref={containerRef} className="w-full h-full relative overflow-hidden select-none" />;
};
