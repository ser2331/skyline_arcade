import { useTranslation } from "react-i18next";

type Props = {
  won: boolean;
  title: string;
  canGoNext: boolean;
  onRetry: () => void;
  onNext: () => void;
  onMenu: () => void;
};

export function LevelResultScreen({ won, title, canGoNext, onRetry, onNext, onMenu }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "ru";

  return (
    <main className="screen menu-screen">
      <div className="menu-card">
        <h1>{won ? (lang === "ru" ? "Победа!" : "Victory!") : lang === "ru" ? "Поражение" : "Defeat"}</h1>
        <p className="hint">
          {lang === "ru" ? "Уровень:" : "Level:"} <strong>{title}</strong>
        </p>
        <div className="game-grid">
          <button className="game-card-btn" onClick={onRetry}>
            {lang === "ru" ? "Повторить" : "Retry"}
          </button>
          <button className="game-card-btn" onClick={onNext} disabled={!canGoNext} style={{ opacity: canGoNext ? 1 : 0.55 }}>
            {lang === "ru" ? "Следующий уровень" : "Next level"}
          </button>
          <button className="game-card-btn" onClick={onMenu}>
            {lang === "ru" ? "В меню" : "Menu"}
          </button>
        </div>
      </div>
    </main>
  );
}

