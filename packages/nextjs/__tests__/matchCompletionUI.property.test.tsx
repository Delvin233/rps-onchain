/**
 * Match Completion UI Property Tests
 *
 * Property-based tests for match completion UI feedback consistency.
 * **Feature: best-of-three-ai-matches, Property 18: Match Completion UI Feedback**
 */
import React from "react";
import { MatchScoreboard } from "../components/MatchScoreboard";
import { render } from "@testing-library/react";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

describe("Match Completion UI Property Tests", () => {
  /**
   * Property 18: Match Completion UI Feedback
   * **Validates: Requirements 2.4**
   *
   * For any completed match, the UI should display appropriate celebration or
   * consolation messaging based on the match outcome.
   */
  it("should display appropriate match completion feedback based on outcome", async () => {
    await fc.assert(
      fc.property(
        fc.constantFrom(
          { playerScore: 2, aiScore: 0, winner: "player" },
          { playerScore: 2, aiScore: 1, winner: "player" },
          { playerScore: 0, aiScore: 2, winner: "ai" },
          { playerScore: 1, aiScore: 2, winner: "ai" },
        ),
        fc.integer({ min: 3, max: 3 }), // currentRound should be 3 for completed matches
        (matchOutcome, currentRound) => {
          const { container } = render(
            <MatchScoreboard
              playerScore={matchOutcome.playerScore}
              aiScore={matchOutcome.aiScore}
              currentRound={currentRound}
              maxRounds={3}
            />,
          );

          // **Requirement 2.4: Display final match result with celebration or consolation messaging**

          // Should show "Match Complete" instead of round indicator
          expect(container.textContent).toContain("Match Complete");
          expect(container.textContent).not.toContain(`Round ${currentRound}`);

          // Should display appropriate victory/defeat message
          if (matchOutcome.winner === "player") {
            // Celebration messaging for player victory
            expect(container.textContent).toContain("🎉 You Won the Match!");

            // Should have success styling
            const successElements = container.querySelectorAll('[class*="text-success"]');
            expect(successElements.length).toBeGreaterThan(0);
          } else if (matchOutcome.winner === "ai") {
            // Consolation messaging for AI victory
            expect(container.textContent).toContain("😔 AI Won the Match");

            // Should have error styling
            const errorElements = container.querySelectorAll('[class*="text-error"]');
            expect(errorElements.length).toBeGreaterThan(0);
          }

          // Should show "Best of 3 rounds" context
          expect(container.textContent).toContain("Best of 3 rounds");

          // Should display trophy icon for completed matches
          const trophyIcon = container.querySelector('[class*="text-warning"]');
          expect(trophyIcon).toBeTruthy();

          // Verify final scores are displayed correctly
          const scoreElements = container.querySelectorAll('[class*="text-3xl font-bold"]');
          expect(scoreElements.length).toBeGreaterThanOrEqual(2);

          // Verify win indicators show correct number of wins
          const winIndicators = container.querySelectorAll('[class*="bg-success"]');
          const totalWins = matchOutcome.playerScore + matchOutcome.aiScore;
          expect(winIndicators.length).toBe(totalWins);
        },
      ),
      { numRuns: 20 },
    );
  });

  /**
   * Test that incomplete matches don't show completion UI
   */
  it("should not display completion UI for incomplete matches", async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1 }), // playerScore
        fc.integer({ min: 0, max: 1 }), // aiScore
        fc.integer({ min: 1, max: 2 }), // currentRound
        (playerScore, aiScore, currentRound) => {
          // Skip if this would be a completed match
          if (playerScore >= 2 || aiScore >= 2) return;

          const { container } = render(
            <MatchScoreboard playerScore={playerScore} aiScore={aiScore} currentRound={currentRound} maxRounds={3} />,
          );

          // Should NOT show match completion messages
          expect(container.textContent).not.toContain("Match Complete");
          expect(container.textContent).not.toContain("You Won the Match");
          expect(container.textContent).not.toContain("AI Won the Match");

          // Should show current round instead
          expect(container.textContent).toContain(`Round ${currentRound}`);
        },
      ),
      { numRuns: 20 },
    );
  });

  /**
   * Simple test to verify component renders without errors for completed matches
   */
  it("should render completed match without crashing", () => {
    const { container } = render(<MatchScoreboard playerScore={2} aiScore={1} currentRound={3} maxRounds={3} />);

    expect(container).toBeTruthy();
    expect(container.textContent).toContain("Match Complete");
    expect(container.textContent).toContain("🎉 You Won the Match!");
  });
});
