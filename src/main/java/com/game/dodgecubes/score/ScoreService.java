package com.game.dodgecubes.score;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class ScoreService {

    private static final int MAX_ENTRIES = 10;
    private final List<ScoreEntry> scores = new CopyOnWriteArrayList<>();

    public List<ScoreEntry> getTopScores() {
        return scores.stream()
                .sorted(Comparator.comparingInt(ScoreEntry::score).reversed()
                        .thenComparing(ScoreEntry::createdAt))
                .limit(MAX_ENTRIES)
                .toList();
    }

    public List<ScoreEntry> submit(ScoreSubmission submission) {
        ScoreEntry entry = new ScoreEntry(
                sanitizeName(submission.playerName()),
                submission.score(),
                Instant.now()
        );
        scores.add(entry);
        trimToBestScores();
        return getTopScores();
    }

    private String sanitizeName(String name) {
        String trimmed = name.trim();
        return trimmed.isEmpty() ? "Player" : trimmed;
    }

    private void trimToBestScores() {
        List<ScoreEntry> best = new ArrayList<>(getTopScores());
        scores.clear();
        scores.addAll(best);
    }
}
