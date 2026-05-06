import type { GameEngine } from "../shared/types/game";

export type EngineCallbacks = {
  onScoreChange: (score: number) => void;
  onGameOver: () => void;
  onLevelComplete?: () => void;
  onEvent?: (event: "jump" | "collect" | "smash" | "hit") => void;
};

export type GameFactory = (canvas: HTMLCanvasElement, callbacks: EngineCallbacks) => GameEngine;
