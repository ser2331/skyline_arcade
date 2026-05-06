import type { GameId, InputMode } from "../../shared/types/game";
import type { FormEvent, RefObject } from "react";
import { ControlsPanel } from "../controls/ControlsPanel";
import { LeaderboardPanel } from "../leaderboard/LeaderboardPanel";
import type { LeaderboardEntry } from "../../shared/types/game";
import { useTranslation } from "react-i18next";

type Props = {
  activeGame: GameId;
  score: number;
  elapsedSec: number;
  meters: number;
  gameOver: boolean;
  levelWon: boolean;
  soundEnabled: boolean;
  inputMode: InputMode;
  canvasRef: RefObject<HTMLCanvasElement>;
  leaderboard: LeaderboardEntry[];
  name: string;
  status: string;
  onRestart: () => void;
  onToggleSound: () => void;
  onOpenLevelBuilder: () => void;
  onExitToMenu: () => void;
  onInputModeChange: (mode: InputMode) => void;
  onPressControl: (key: string, pressed: boolean) => void;
  onNameChange: (value: string) => void;
  onSubmitScore: (e: FormEvent<HTMLFormElement>) => void;
};

export function GameScreen({
  activeGame,
  score,
  elapsedSec,
  meters,
  gameOver,
  levelWon,
  soundEnabled,
  inputMode,
  canvasRef,
  leaderboard,
  name,
  status,
  onRestart,
  onToggleSound,
  onOpenLevelBuilder,
  onExitToMenu,
  onInputModeChange,
  onPressControl,
  onNameChange,
  onSubmitScore
}: Props) {
  const { t } = useTranslation();
  return (
    <main className="screen game-screen">
      <div className="game-topbar">
        <div className="metric-pills">
          <span className="metric-pill">{t("game.score")}: <strong>{score}</strong></span>
          <span className="metric-pill">⏱ {elapsedSec} s</span>
          <span className="metric-pill">📏 {meters} m</span>
        </div>
        <div className="topbar-actions">
          <button onClick={onRestart}>{t("common.restart")}</button>
          <button onClick={onOpenLevelBuilder}>{t("menu.levelBuilder")}</button>
          <button onClick={onToggleSound}>{t("game.sound", { state: soundEnabled ? t("common.soundOn") : t("common.soundOff") })}</button>
          <button onClick={onExitToMenu}>{t("common.menu")}</button>
        </div>
      </div>

      <div className="game-layout">
        <section className="game-panel">
          <h2>{t(`games.titles.${activeGame}`)}</h2>
          <p className="hint">{t(`games.hints.${activeGame}`)}</p>
          <div className="canvas-wrap">
            <canvas ref={canvasRef} width="500" height="500" />
            {gameOver && (
              <button className="center-restart-btn" onClick={onRestart}>
                {levelWon ? t("common.playAgain") : t("common.retry")}
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
