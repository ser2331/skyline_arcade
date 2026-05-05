import type { GameId } from "../shared/types/game";
import type { GameFactory } from "./types";
import { createDodgeCubesEngine } from "./dodge-cubes/engine";
import { createCityRunnerEngine } from "./city-runner/engine";
import { createCarRideEngine } from "./car-ride/engine";
import { createWormsEngine } from "./worms/engine";

export const gameTitles: Record<GameId, string> = {
  "dodge-cubes": "Dodge Cubes",
  "city-runner": "City Runner",
  "car-ride": "Car Ride",
  worms: "Worms"
};

export const gameHints: Record<GameId, string> = {
  "dodge-cubes": "Move with WASD or arrow keys. Survive as long as possible.",
  "city-runner":
    "Auto-run mode. Jump with Up/W/Space and crouch with Down/S. Hit bees and flies from below, break brick blocks, and collect stars.",
  "car-ride": "Drive forward with Up and steer Left/Right. Avoid all road obstacles.",
  worms: "Eat apples, grow your worm, and become huge enough to fill the whole map."
};

export const gameOrder: GameId[] = ["dodge-cubes", "city-runner", "car-ride", "worms"];

export const gameFactories: Record<GameId, GameFactory> = {
  "dodge-cubes": createDodgeCubesEngine,
  "city-runner": createCityRunnerEngine,
  "car-ride": createCarRideEngine,
  worms: createWormsEngine
};
