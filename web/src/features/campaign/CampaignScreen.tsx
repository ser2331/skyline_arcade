import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cityRunnerCampaignLevels, getUnlockedCityRunnerLevelCount } from "./cityRunnerCampaign";

type Props = {
  onBack: () => void;
  onPlayLevel: (levelIndex: number) => void;
};

export function CampaignScreen({ onBack, onPlayLevel }: Props) {
  const { t, i18n } = useTranslation();
  const unlocked = useMemo(() => getUnlockedCityRunnerLevelCount(), []);
  const lang = i18n.language === "en" ? "en" : "ru";

  return (
    <main className="screen menu-screen">
      <div className="menu-card">
        <h1>{t("menu.campaign")}</h1>
        <p className="hint">{lang === "ru" ? "Проходи уровни по порядку — открывай новые." : "Beat levels in order to unlock more."}</p>

        <div className="game-grid">
          {cityRunnerCampaignLevels.map((lvl, idx) => {
            const isUnlocked = idx < unlocked;
            return (
              <button
                key={`${idx}-${lvl.title}`}
                className="game-card-btn"
                onClick={() => onPlayLevel(idx)}
                disabled={!isUnlocked}
                style={{ opacity: isUnlocked ? 1 : 0.55 }}
              >
                {idx + 1}. {lvl.title} {isUnlocked ? "" : lang === "ru" ? " (закрыто)" : " (locked)"}
              </button>
            );
          })}
          <button className="game-card-btn" onClick={onBack}>
            {t("common.back")}
          </button>
        </div>
      </div>
    </main>
  );
}

