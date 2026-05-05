package com.game.dodgecubes.score;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    private final ScoreService scoreService;

    public ScoreController(ScoreService scoreService) {
        this.scoreService = scoreService;
    }

    @GetMapping
    public List<ScoreEntry> getTopScores() {
        return scoreService.getTopScores();
    }

    @PostMapping
    public List<ScoreEntry> submitScore(@Valid @RequestBody ScoreSubmission submission) {
        return scoreService.submit(submission);
    }
}
