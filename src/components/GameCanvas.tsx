import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { SimScene } from '../game/scenes/SimScene';
import { GAME_CONFIG } from '../game/config';
import { Agent, Company, MarketProduct } from '../types';

interface GameCanvasProps {
  agents: Agent[];
  companies: Company[];
  market: MarketProduct[];
  worldTime: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ agents, companies, worldTime }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<SimScene | null>(null);

  useEffect(() => {
    // 1. Initialize Game
    if (!gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: 'phaser-container',
        width: GAME_CONFIG.width,
        height: GAME_CONFIG.height,
        backgroundColor: GAME_CONFIG.backgroundColor,
        scene: [SimScene],
        physics: {
          default: 'arcade',
          arcade: { debug: false }
        }
      };

      gameRef.current = new Phaser.Game(config);

      // Wait for scene to be ready
      gameRef.current.events.once('ready', () => {
        const scene = gameRef.current?.scene.getScene('SimScene') as SimScene;
        sceneRef.current = scene;
      });
    }

    return () => {
      // Cleanup on unmount
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, []);

  // 2. Sync React State -> Phaser
  useEffect(() => {
    if (sceneRef.current) {
        // Filter agents based on Spawn Time logic locally before passing to Phaser
        // or let Phaser handle it. For visual purity, we only pass active agents.
        const activeAgents = agents.filter(a => worldTime >= a.spawnTime || (worldTime < a.spawnTime && a.spawnTime > 24));
        sceneRef.current.updateAgents(activeAgents);
        sceneRef.current.updateCompanies(companies);
    }
  }, [agents, companies, worldTime]);

  return (
    <div className="relative w-full h-full flex justify-center items-center bg-slate-950 overflow-hidden rounded-xl border border-slate-700 shadow-2xl">
      <div id="phaser-container" className="rounded-lg overflow-hidden" />
      
      {/* Overlay UI for Phase 8 can go here later */}
      <div className="absolute top-4 right-4 bg-slate-900/80 p-2 rounded text-xs text-white pointer-events-none border border-slate-700">
         <div className="font-mono">VISUAL MODE: PIXEL ART v1</div>
         <div>Agents Active: {agents.filter(a => worldTime >= a.spawnTime || (worldTime < a.spawnTime && a.spawnTime > 24)).length}</div>
      </div>
    </div>
  );
};