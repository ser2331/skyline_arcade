import type { GameId } from "../shared/types/game";
import type { GameFactory } from "./types";
import { createDodgeCubesEngine } from "./dodge-cubes/engine";
import { createCityRunnerEngine } from "./city-runner/engine";
import { createCarRideEngine } from "./car-ride/engine";
import { createWormsEngine } from "./worms/engine";

export const gameTitles: Record<GameId, string> = {
  "dodge-cubes": "Уворачивайся от кубов",
  "city-runner": "Сити-раннер",
  "car-ride": "Автопоездка",
  worms: "Червячки"
};

export const gameHints: Record<GameId, string> = {
  "dodge-cubes": "Двигайся WASD или стрелками. Продержись как можно дольше.",
  "city-runner":
    "Автобег. Прыжок: Up/W/Space, присесть: Down/S. Бей пчел и мух снизу, ломай кирпичи, собирай звезды.",
  "car-ride": "Разгоняйся Up и рули Left/Right. Избегай всех препятствий на дороге.",
  worms: "Ешь яблоки, расти и стань самым большим червем на карте."
};

export const gameOrder: GameId[] = ["dodge-cubes", "city-runner", "car-ride", "worms"];

export const gameFactories: Record<GameId, GameFactory> = {
  "dodge-cubes": createDodgeCubesEngine,
  "city-runner": createCityRunnerEngine,
  "car-ride": createCarRideEngine,
  worms: createWormsEngine
};
