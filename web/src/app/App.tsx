import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { gameFactories } from "../games/registry";
import { MenuScreen } from "../features/menu/MenuScreen";
import { GameScreen } from "../features/game/GameScreen";
import { LevelBuilderScreen } from "../features/level-builder/LevelBuilderScreen";
import { CampaignScreen } from "../features/campaign/CampaignScreen";
import { LevelResultScreen } from "../features/campaign/LevelResultScreen";
import { RunnerSound } from "../shared/audio/RunnerSound";
import type { GameEngine, GameId, InputMode, LeaderboardEntry, Screen } from "../shared/types/game";
import { setCityRunnerActiveLevel } from "../games/city-runner/levelStore";
import { useTranslation } from "react-i18next";
import { cityRunnerCampaignLevels, getUnlockedCityRunnerLevelCount, unlockNextCityRunnerLevel } from "../features/campaign/cityRunnerCampaign";
import { LanguageSwitch } from "../shared/ui/LanguageSwitch";

const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const LOCAL_SCORES_KEY = "dodge-cubes-local-scores";

const sortScores = (items: LeaderboardEntry[]) =>
  [...items].sort((a, b) => b.score - a.score).slice(0, 20);

const readLocalScores = (): LeaderboardEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SCORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    if (!Array.isArray(parsed)) return [];
    return sortScores(
      parsed.filter(
        (it) =>
          it &&
          typeof it.playerName === "string" &&
          typeof it.score === "number" &&
          Number.isFinite(it.score)
      )
    );
  } catch {
    return [];
  }
};

const writeLocalScores = (items: LeaderboardEntry[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(sortScores(items)));
};

export default function App() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const soundRef = useRef<RunnerSound>(new RunnerSound());
  const lastActionSfxAtRef = useRef<number>(0);
  const [screen, setScreen] = useState<Screen>("menu");
  const [activeGame, setActiveGame] = useState<GameId>("dodge-cubes");
  const [score, setScore] = useState<number>(0);
  const [inputMode, setInputMode] = useState<InputMode>(isTouch ? "dpad" : "keyboard");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [name, setName] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [levelWon, setLevelWon] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [campaignLevelIndex, setCampaignLevelIndex] = useState<number | null>(null);
  const [lastPlayedTitle, setLastPlayedTitle] = useState<string>("");
  const [lastWon, setLastWon] = useState<boolean>(false);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current || screen !== "game") return;
    engineRef.current?.stop();

    const engine = gameFactories[activeGame](canvasRef.current, {
      onScoreChange: (nextScore) => setScore(nextScore),
      onEvent: (event) => soundRef.current.play(event),
      onGameOver: () => {
        setGameOver(true);
        setLevelWon(false);
        setStatus(t("game.defeatStatus"));
        if (campaignLevelIndex !== null) {
          setLastWon(false);
          setScreen("level-result");
        }
      },
      onLevelComplete: () => {
        setGameOver(true);
        setLevelWon(true);
        setStatus(t("game.victoryStatus"));
        if (campaignLevelIndex !== null) {
          unlockNextCityRunnerLevel(campaignLevelIndex);
          setLastWon(true);
          setScreen("level-result");
        }
      }
    });

    engineRef.current = engine;
    engine.reset();
    engine.start();
    return () => engine.stop();
  }, [screen, activeGame]);

  useEffect(() => {
    soundRef.current.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (inputMode !== "keyboard" || !engineRef.current) return;
      void soundRef.current.ensureReady();
      engineRef.current.setKey(e.key, true);
    };
    const up = (e: KeyboardEvent) => {
      if (inputMode !== "keyboard" || !engineRef.current) return;
      engineRef.current.setKey(e.key, false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [inputMode]);

  useEffect(() => {
    if (screen !== "game" || gameOver) return;
    const interval = activeGame === "dodge-cubes" ? 420 : activeGame === "city-runner" ? 360 : 300;
    const pulseId = window.setInterval(() => {
      soundRef.current.playBeatPulse();
    }, interval);
    return () => window.clearInterval(pulseId);
  }, [screen, activeGame, gameOver]);

  useEffect(() => {
    if (screen !== "game" || gameOver) return;
    const timer = window.setInterval(() => {
      if (!startedAtRef.current) return;
      setElapsedSec(Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    }, 500);
    return () => window.clearInterval(timer);
  }, [screen, gameOver]);

  const press = (key: string, pressed: boolean) => {
    if (inputMode === "keyboard" || !engineRef.current) return;
    void soundRef.current.ensureReady();
    if (pressed && (key === "ArrowUp" || key === "ArrowLeft" || key === "ArrowRight")) {
      const now = performance.now();
      if (now - lastActionSfxAtRef.current > 95) {
        soundRef.current.play("jump");
        lastActionSfxAtRef.current = now;
      }
    }
    engineRef.current.setKey(key, pressed);
  };

  const loadLeaderboard = async () => {
    try {
      const res = await fetch("/api/scores");
      if (!res.ok) throw new Error("api unavailable");
      const data: LeaderboardEntry[] = await res.json();
      setLeaderboard(sortScores(data));
      return;
    } catch {
      setLeaderboard(readLocalScores());
    }
  };

  const startGame = async (gameId: GameId) => {
    void soundRef.current.ensureReady();
    // Clear any scripted level when starting normally from menu.
    setCityRunnerActiveLevel(null);
    setCampaignLevelIndex(null);
    setActiveGame(gameId);
    setScreen("game");
    setGameOver(false);
    setLevelWon(false);
    setStatus("");
    setScore(0);
    setElapsedSec(0);
    startedAtRef.current = Date.now();
    try {
      await loadLeaderboard();
    } catch {
      setStatus(t("leaderboard.loadFailed"));
    }
  };

  const openLevelBuilder = () => {
    engineRef.current?.stop();
    setScreen("level-builder");
  };

  const openCampaign = () => {
    engineRef.current?.stop();
    setScreen("campaign");
  };

  const playCityRunnerLevel = async (level: import("../games/city-runner/levelStore").CityRunnerLevel) => {
    void soundRef.current.ensureReady();
    setCityRunnerActiveLevel(level);
    setCampaignLevelIndex(null);
    setActiveGame("city-runner");
    setScreen("game");
    setGameOver(false);
    setLevelWon(false);
    setLastPlayedTitle(level.title);
    setStatus(``);
    setScore(0);
    setElapsedSec(0);
    startedAtRef.current = Date.now();
    try {
      await loadLeaderboard();
    } catch {
      setStatus(t("leaderboard.loadFailed"));
    }
  };

  const playCampaignLevel = async (levelIndex: number) => {
    const unlocked = getUnlockedCityRunnerLevelCount();
    if (levelIndex < 0 || levelIndex >= unlocked) return;
    const level = cityRunnerCampaignLevels[levelIndex];
    void soundRef.current.ensureReady();
    setCityRunnerActiveLevel(level);
    setCampaignLevelIndex(levelIndex);
    setLastPlayedTitle(level.title);
    setActiveGame("city-runner");
    setScreen("game");
    setGameOver(false);
    setLevelWon(false);
    setStatus("");
    setScore(0);
    setElapsedSec(0);
    startedAtRef.current = Date.now();
    try {
      await loadLeaderboard();
    } catch {
      setStatus(t("leaderboard.loadFailed"));
    }
  };

  const restart = () => {
    void soundRef.current.ensureReady();
    setGameOver(false);
    setLevelWon(false);
    setStatus("");
    startedAtRef.current = Date.now();
    setElapsedSec(0);
    engineRef.current?.reset();
    engineRef.current?.start();
  };

  const exitToMenu = () => {
    engineRef.current?.stop();
    setScreen("menu");
  };

  const submitScore = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatus(t("leaderboard.enterName"));
      return;
    }
    if (!gameOver) {
      setStatus(t("leaderboard.finishFirst"));
      return;
    }
    const payload = { playerName: name.trim(), score };
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("save failed");
      setStatus(t("leaderboard.saved"));
      await loadLeaderboard();
      return;
    } catch {
      const next = sortScores([...readLocalScores(), payload]);
      writeLocalScores(next);
      setLeaderboard(next);
      setStatus(t("leaderboard.savedOffline"));
    }
  };

  const toggleSound = () => {
    void soundRef.current.ensureReady();
    setSoundEnabled((prev) => !prev);
  };

  if (screen === "menu") {
    const content = (
      <MenuScreen
        onStart={startGame}
        onOpenCampaign={openCampaign}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
    );
    return (
      <div className="app-shell">
        <header className="app-header">
          <strong>Skyline Arcade</strong>
          <LanguageSwitch />
        </header>
        {content}
      </div>
    );
  }

  if (screen === "level-builder") {
    return (
      <div className="app-shell">
        <header className="app-header">
          <strong>Skyline Arcade</strong>
          <LanguageSwitch />
        </header>
        <LevelBuilderScreen onBack={() => setScreen("menu")} onPlay={playCityRunnerLevel} />
      </div>
    );
  }

  if (screen === "campaign") {
    return (
      <div className="app-shell">
        <header className="app-header">
          <strong>Skyline Arcade</strong>
          <LanguageSwitch />
        </header>
        <CampaignScreen onBack={() => setScreen("menu")} onPlayLevel={playCampaignLevel} />
      </div>
    );
  }

  if (screen === "level-result") {
    const idx = campaignLevelIndex ?? -1;
    const hasNext = idx >= 0 && idx + 1 < cityRunnerCampaignLevels.length;
    return (
      <div className="app-shell">
        <header className="app-header">
          <strong>Skyline Arcade</strong>
          <LanguageSwitch />
        </header>
        <LevelResultScreen
          won={lastWon}
          title={lastPlayedTitle}
          canGoNext={Boolean(lastWon && hasNext && idx + 1 < getUnlockedCityRunnerLevelCount())}
          onRetry={() => {
            if (campaignLevelIndex === null) {
              setScreen("menu");
              return;
            }
            void playCampaignLevel(campaignLevelIndex);
          }}
          onNext={() => {
            if (!hasNext || campaignLevelIndex === null) return;
            void playCampaignLevel(campaignLevelIndex + 1);
          }}
          onMenu={() => {
            setCampaignLevelIndex(null);
            setScreen("menu");
          }}
        />
      </div>
    );
  }

  const meters = Math.max(0, score);
  return (
    <div className="app-shell">
      <header className="app-header">
        <strong>Skyline Arcade</strong>
        <LanguageSwitch />
      </header>
      <GameScreen
        activeGame={activeGame}
        score={score}
        elapsedSec={elapsedSec}
        meters={meters}
        gameOver={gameOver}
        levelWon={levelWon}
        soundEnabled={soundEnabled}
        inputMode={inputMode}
        canvasRef={canvasRef}
        leaderboard={leaderboard}
        name={name}
        status={status}
        onRestart={restart}
        onToggleSound={toggleSound}
        onOpenLevelBuilder={openLevelBuilder}
        onExitToMenu={exitToMenu}
        onInputModeChange={setInputMode}
        onPressControl={press}
        onNameChange={setName}
        onSubmitScore={submitScore}
      />
    </div>
  );
}
