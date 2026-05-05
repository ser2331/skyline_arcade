import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { gameFactories } from "../games/registry";
import { MenuScreen } from "../features/menu/MenuScreen";
import { GameScreen } from "../features/game/GameScreen";
import { RunnerSound } from "../shared/audio/RunnerSound";
import type { GameEngine, GameId, InputMode, LeaderboardEntry, Screen } from "../shared/types/game";

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
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (!canvasRef.current || screen !== "game") return;
    engineRef.current?.stop();

    const engine = gameFactories[activeGame](canvasRef.current, {
      onScoreChange: (nextScore) => setScore(nextScore),
      onEvent: (event) => soundRef.current.play(event),
      onGameOver: () => {
        setGameOver(true);
        setStatus("Game over! Save your score.");
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
    setActiveGame(gameId);
    setScreen("game");
    setGameOver(false);
    setStatus("");
    setScore(0);
    try {
      await loadLeaderboard();
    } catch {
      setStatus("Failed to load leaderboard.");
    }
  };

  const restart = () => {
    void soundRef.current.ensureReady();
    setGameOver(false);
    setStatus("");
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
      setStatus("Enter your name.");
      return;
    }
    if (!gameOver) {
      setStatus("Finish the run first.");
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
      setStatus("Score saved!");
      await loadLeaderboard();
      return;
    } catch {
      const next = sortScores([...readLocalScores(), payload]);
      writeLocalScores(next);
      setLeaderboard(next);
      setStatus("Score saved locally (offline mode).");
    }
  };

  const toggleSound = () => {
    void soundRef.current.ensureReady();
    setSoundEnabled((prev) => !prev);
  };

  if (screen === "menu") {
    return <MenuScreen onStart={startGame} soundEnabled={soundEnabled} onToggleSound={toggleSound} />;
  }

  return (
    <GameScreen
      activeGame={activeGame}
      score={score}
      gameOver={gameOver}
      soundEnabled={soundEnabled}
      inputMode={inputMode}
      canvasRef={canvasRef}
      leaderboard={leaderboard}
      name={name}
      status={status}
      onRestart={restart}
      onToggleSound={toggleSound}
      onExitToMenu={exitToMenu}
      onInputModeChange={setInputMode}
      onPressControl={press}
      onNameChange={setName}
      onSubmitScore={submitScore}
    />
  );
}
