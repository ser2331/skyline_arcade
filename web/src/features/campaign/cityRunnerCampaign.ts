import type { CityRunnerLevel } from "../../games/city-runner/levelStore";

export const cityRunnerCampaignLevels: CityRunnerLevel[] = [
  {
    version: 1,
    title: "Глава 1: Разминка",
    durationSec: 30,
    checkpointsSec: [10, 20],
    events: [
      { at: 3 * 60, type: "ground", kind: "pipe", height: 70 },
      { at: 7 * 60, type: "brick" },
      { at: 11 * 60, type: "flyer", kind: "bee", lowFlight: true },
      { at: 15 * 60, type: "ground", kind: "pipe", height: 85 },
      { at: 18 * 60, type: "star", kind: "superJump", y: 240 },
      { at: 22 * 60, type: "brick" },
      { at: 25 * 60, type: "flyer", kind: "fly", lowFlight: false }
    ]
  },
  {
    version: 1,
    title: "Глава 2: Ромашки",
    durationSec: 40,
    checkpointsSec: [15, 30],
    events: [
      { at: 4 * 60, type: "ground", kind: "flower", height: 64 },
      { at: 8 * 60, type: "ground", kind: "pipe", height: 96 },
      { at: 12 * 60, type: "brick" },
      { at: 16 * 60, type: "creature" },
      { at: 18 * 60, type: "flyer", kind: "bee", lowFlight: true, starCarrier: true },
      { at: 24 * 60, type: "ground", kind: "flower", height: 74 },
      { at: 28 * 60, type: "brick" },
      { at: 32 * 60, type: "flyer", kind: "fly", lowFlight: true }
    ]
  },
  {
    version: 1,
    title: "Глава 3: Комбо",
    durationSec: 55,
    checkpointsSec: [20, 40],
    events: [
      { at: 4 * 60, type: "ground", kind: "pipe", height: 110 },
      { at: 7 * 60, type: "brick" },
      { at: 11 * 60, type: "flyer", kind: "bee", lowFlight: true },
      { at: 14 * 60, type: "creature" },
      { at: 18 * 60, type: "brick" },
      { at: 22 * 60, type: "ground", kind: "pipe", height: 88 },
      { at: 26 * 60, type: "flyer", kind: "fly", lowFlight: true },
      { at: 30 * 60, type: "star", kind: "invincible", y: 220 },
      { at: 36 * 60, type: "ground", kind: "pipe", height: 120 },
      { at: 41 * 60, type: "brick" },
      { at: 45 * 60, type: "flyer", kind: "bee", lowFlight: false }
    ]
  }
];

const STORAGE_KEY = "skyline-arcade:campaign:city-runner:unlocked";

export function getUnlockedCityRunnerLevelCount(): number {
  if (typeof window === "undefined") return 1;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number(raw) : 1;
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(cityRunnerCampaignLevels.length, Math.floor(n)));
}

export function unlockNextCityRunnerLevel(currentIndex: number) {
  if (typeof window === "undefined") return;
  const nextCount = Math.max(getUnlockedCityRunnerLevelCount(), currentIndex + 2);
  window.localStorage.setItem(STORAGE_KEY, String(Math.min(nextCount, cityRunnerCampaignLevels.length)));
}

