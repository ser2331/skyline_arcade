import type { LeaderboardEntry } from "../../shared/types/game";
import type { FormEvent } from "react";

type Props = {
  leaderboard: LeaderboardEntry[];
  name: string;
  status: string;
  onNameChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function LeaderboardPanel({ leaderboard, name, status, onNameChange, onSubmit }: Props) {
  return (
    <section className="leaderboard-panel">
      <h2>Leaderboard</h2>
      <ol id="leaderboardList">
        {leaderboard.length === 0 ? (
          <li>No scores yet</li>
        ) : (
          leaderboard.map((entry, idx) => (
            <li key={`${entry.playerName}-${entry.score}-${idx}`}>
              {entry.playerName}: {entry.score}
            </li>
          ))
        )}
      </ol>
      <form className="score-form" onSubmit={onSubmit}>
        <label htmlFor="playerName">Name</label>
        <input
          id="playerName"
          maxLength={20}
          placeholder="Your name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
        <button type="submit">Save score</button>
      </form>
      <p className="status-message">{status}</p>
    </section>
  );
}
