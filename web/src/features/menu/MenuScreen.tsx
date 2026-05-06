import type { GameId } from "../../shared/types/game";
import { gameOrder } from "../../games/registry";
import { useTranslation } from "react-i18next";

type Props = {
  onStart: (gameId: GameId) => void;
  onOpenCampaign: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
};

const gameIcons: Record<GameId, string> = {
  "dodge-cubes": "/assets/menu-icons/dodge-cubes.svg",
  "city-runner": "/assets/menu-icons/city-runner.svg",
  "car-ride": "/assets/menu-icons/car-ride.svg",
  worms: "/assets/menu-icons/worms.svg"
};

export function MenuScreen({ onStart, onOpenCampaign, soundEnabled, onToggleSound }: Props) {
  const { t } = useTranslation();
  return (
    <main className="screen menu-screen">
      <div className="menu-card">
        <h1>{t("app.title")}</h1>
        <p>{t("menu.chooseGame")}</p>
        <div className="game-cards-grid">
          {gameOrder.map((gameId) => (
            <button key={gameId} className="game-tile-btn" onClick={() => onStart(gameId)}>
              <img className="game-tile-icon-img" src={gameIcons[gameId]} alt={t(`games.titles.${gameId}`)} />
              <span className="game-tile-title">{t(`games.titles.${gameId}`)}</span>
            </button>
          ))}
        </div>
        <div className="game-grid">
          <button className="game-card-btn" onClick={onOpenCampaign}>
            {t("menu.campaign")}
          </button>
          <button className="game-card-btn" onClick={onToggleSound}>
            {t("menu.sound", { state: soundEnabled ? t("common.soundOn") : t("common.soundOff") })}
          </button>
        </div>
      </div>
    </main>
  );
}
