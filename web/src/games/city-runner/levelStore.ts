import type { BrickObstacle, Creature, FlyingObstacle, GroundObstacle, StarDrop } from "./types";

export type CityRunnerLevelEvent =
  | {
      at: number; // engine frame
      type: "ground";
      kind: GroundObstacle["kind"];
      height?: number;
      width?: number;
    }
  | {
      at: number;
      type: "brick";
      y?: number; // absolute y in canvas coords; if omitted -> default spawn logic
      width?: number;
      height?: number;
    }
  | {
      at: number;
      type: "creature";
    }
  | {
      at: number;
      type: "flyer";
      lowFlight?: boolean;
      kind?: FlyingObstacle["kind"];
      starCarrier?: boolean;
    }
  | {
      at: number;
      type: "star";
      kind: StarDrop["kind"];
      y?: number;
    };

export type CityRunnerLevel = {
  version: 1;
  title: string;
  durationSec: number;
  checkpointsSec: number[];
  events: CityRunnerLevelEvent[];
};

let activeLevel: CityRunnerLevel | null = null;

export function setCityRunnerActiveLevel(level: CityRunnerLevel | null) {
  activeLevel = level;
}

export function getCityRunnerActiveLevel() {
  return activeLevel;
}

