package com.game.dodgecubes.score;

import java.time.Instant;

public record ScoreEntry(String playerName, int score, Instant createdAt) {
}
