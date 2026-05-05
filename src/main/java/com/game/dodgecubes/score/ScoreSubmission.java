package com.game.dodgecubes.score;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ScoreSubmission(
        @NotBlank @Size(max = 20) String playerName,
        @Min(0) @Max(999_999) int score
) {
}
