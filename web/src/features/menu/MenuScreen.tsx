import type { GameId } from "../../shared/types/game";
import { gameOrder, gameTitles } from "../../games/registry";

type Props = {
  onStart: (gameId: GameId) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
};

export function MenuScreen({ onStart, soundEnabled, onToggleSound }: Props) {
  return (
    <main className="screen menu-screen">
      <div className="menu-card">
        <h1>Game Menu</h1>
        <p>Choose a game to play.</p>
        <div className="game-grid">
          {gameOrder.map((gameId) => (
            <button key={gameId} className="game-card-btn" onClick={() => onStart(gameId)}>
              Play: {gameTitles[gameId]}
            </button>
          ))}
          <button className="game-card-btn" onClick={onToggleSound}>
            Sound: {soundEnabled ? "On" : "Off"}
          </button>
        </div>
      </div>
    </main>
  );
}
