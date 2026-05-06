import type { CityRunnerLevel } from "../../games/city-runner/levelStore";

const KEY = "skyline-arcade:city-runner-level:v1";

export function loadCityRunnerLevel(): CityRunnerLevel {
  if (typeof window === "undefined") {
    return { version: 1, title: "Мой уровень", durationSec: 60, checkpointsSec: [15, 30, 45], events: [] };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { version: 1, title: "Мой уровень", durationSec: 60, checkpointsSec: [15, 30, 45], events: [] };
    const parsed = JSON.parse(raw) as CityRunnerLevel;
    if (!parsed || parsed.version !== 1 || typeof parsed.title !== "string" || !Array.isArray(parsed.events)) {
      return { version: 1, title: "Мой уровень", durationSec: 60, checkpointsSec: [15, 30, 45], events: [] };
    }
    return {
      version: 1,
      title: parsed.title,
      durationSec:
        typeof parsed.durationSec === "number" && Number.isFinite(parsed.durationSec) && parsed.durationSec > 5
          ? Math.floor(parsed.durationSec)
          : 60,
      checkpointsSec: Array.isArray(parsed.checkpointsSec)
        ? parsed.checkpointsSec
            .filter((n) => typeof n === "number" && Number.isFinite(n) && n > 0)
            .map((n) => Math.floor(n))
            .sort((a, b) => a - b)
        : [15, 30, 45],
      events: parsed.events
    };
  } catch {
    return { version: 1, title: "Мой уровень", durationSec: 60, checkpointsSec: [15, 30, 45], events: [] };
  }
}

export function saveCityRunnerLevel(level: CityRunnerLevel) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(level));
}

