export type InputMode = "keyboard" | "mobile" | "dpad";
export type Screen = "menu" | "game";
export type GameId = "dodge-cubes" | "city-runner" | "car-ride" | "worms";

export type LeaderboardEntry = {
  playerName: string;
  score: number;
};

export type ControlButton = {
  key: string;
  label: string;
};

export interface GameEngine {
  start: () => void;
  stop: () => void;
  reset: () => void;
  setKey: (key: string, pressed: boolean) => void;
}
