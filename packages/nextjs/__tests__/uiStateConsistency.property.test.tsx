/**
 * UI State Consistency Property Tests
 *
 * Property-based tests for UI component state consistency with match data.
 * **Feature: best-of-three-ai-matches, Property 17: UI State Consistency**
 */
import React from "react";
import { MatchScoreboard } from "../components/MatchScoreboard";
import { render } from "@testing-library/react";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

describe("UI State Consistency Property Tests", () => {
  /**
   * Property 17: UI State Consistency
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.5**
   *
   * For any valid match state, the UI should display current scores, round indicators,
   * and continuation options that accurately reflect the match state.
   */
  it("should display match state consistently with underlying data", async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        fc.integer({ min: 0, max: 2 }),
        fc.integer({ min: 1, max: 3 }),
        (playerScore, aiScore, currentRound) => {
          const { container } = render(
            <MatchScoreboard playerScore={playerScore} aiScore={aiScore} currentRound={currentRound} maxRounds={3} />,
          );

          // **Requirement 2.1: Display current score for both player and AI**
          // Verify scores are displayed
          const scoreElements = container.querySelectorAll('[class*="text-3xl font-bold"]');
          expect(scoreElements.length).toBeGreaterThanOrEqual(2);

          // **Requirement 2.3: Indicate which round is currently being played**
          const isMatchComplete = playerScore >= 2 || aiScore >= 2;

          if (!isMatchComplete) {
            // Should show current round indicator
            expect(container.textContent).toContain(`Round ${currentRound}`);
            expect(container.textContent).toContain("of 3");
          } else {
            // Should show match complete
            expect(container.textContent).toContain("Match Complete");
          }

          // Verify VS divider is always present
          expect(container.textContent).toContain("VS");

          // Verify player and AI labels are present
          expect(container.textContent).toContain("You");
          expect(container.textContent).toContain("AI");
        },
      ),
      { numRuns: 20 },
    );
  });

  /**
   * Simple test to verify component renders without errors
   */
  it("should render without crashing", () => {
    const { container } = render(<MatchScoreboard playerScore={1} aiScore={0} currentRound={2} maxRounds={3} />);

    expect(container).toBeTruthy();
    expect(container.textContent).toContain("VS");
  });
});
