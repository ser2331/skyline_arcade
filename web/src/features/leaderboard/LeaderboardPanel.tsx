import type { LeaderboardEntry } from "../../shared/types/game";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  leaderboard: LeaderboardEntry[];
  name: string;
  status: string;
  onNameChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function LeaderboardPanel({ leaderboard, name, status, onNameChange, onSubmit }: Props) {
  const { t } = useTranslation();
  return (
    <section className="leaderboard-panel">
      <h2>{t("leaderboard.title")}</h2>
      <ol id="leaderboardList">
        {leaderboard.length === 0 ? (
          <li>{t("leaderboard.empty")}</li>
        ) : (
          leaderboard.map((entry, idx) => (
            <li key={`${entry.playerName}-${entry.score}-${idx}`}>
              {entry.playerName}: {entry.score}
            </li>
          ))
        )}
      </ol>
      <form className="score-form" onSubmit={onSubmit}>
        <label htmlFor="playerName">{t("leaderboard.name")}</label>
        <input
          id="playerName"
          maxLength={20}
          placeholder={t("leaderboard.namePlaceholder")}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
        <button type="submit">{t("leaderboard.saveScore")}</button>
      </form>
      <p className="status-message">{status}</p>
    </section>
  );
}
