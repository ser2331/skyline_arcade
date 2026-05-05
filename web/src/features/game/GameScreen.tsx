import type { GameId, InputMode } from "../../shared/types/game";
import type { FormEvent, RefObject } from "react";
import { gameHints, gameTitles } from "../../games/registry";
import { ControlsPanel } from "../controls/ControlsPanel";
import { LeaderboardPanel } from "../leaderboard/LeaderboardPanel";
import type { LeaderboardEntry } from "../../shared/types/game";

type Props = {
  activeGame: GameId;
  score: number;
  gameOver: boolean;
  soundEnabled: boolean;
  inputMode: InputMode;
  canvasRef: RefObject<HTMLCanvasElement>;
  leaderboard: LeaderboardEntry[];
  name: string;
  status: string;
  onRestart: () => void;
  onToggleSound: () => void;
  onExitToMenu: () => void;
  onInputModeChange: (mode: InputMode) => void;
  onPressControl: (key: string, pressed: boolean) => void;
  onNameChange: (value: string) => void;
  onSubmitScore: (e: FormEvent<HTMLFormElement>) => void;
};

export function GameScreen({
  activeGame,
  score,
  gameOver,
  soundEnabled,
  inputMode,
  canvasRef,
  leaderboard,
  name,
  status,
  onRestart,
  onToggleSound,
  onExitToMenu,
  onInputModeChange,
  onPressControl,
  onNameChange,
  onSubmitScore
}: Props) {
  return (
    <main className="screen game-screen">
      <div className="game-topbar">
        <span>
          {gameTitles[activeGame]} - Score: <strong>{score}</strong>
        </span>
        <div className="topbar-actions">
          <button onClick={onRestart}>Restart</button>
          <button onClick={onToggleSound}>Sound: {soundEnabled ? "On" : "Off"}</button>
          <button onClick={onExitToMenu}>Exit to menu</button>
        </div>
      </div>

      <div className="game-layout">
        <section className="game-panel">
          <h2>{gameTitles[activeGame]}</h2>
          <p className="hint">{gameHints[activeGame]}</p>
          <div className="canvas-wrap">
            <canvas ref={canvasRef} width="500" height="500" />
            {gameOver && (
              <button className="center-restart-btn" onClick={onRestart}>
                Restart
              </button>
            )}
          </div>

          <ControlsPanel inputMode={inputMode} onModeChange={onInputModeChange} onPress={onPressControl} />
        </section>

        <LeaderboardPanel
          leaderboard={leaderboard}
          name={name}
          status={status}
          onNameChange={onNameChange}
          onSubmit={onSubmitScore}
        />
      </div>
    </main>
  );
}
