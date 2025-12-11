/**
 * Unit Tests for UI Components
 *
 * Comprehensive unit tests for MatchScoreboard and ResumeMatchModal components.
 * Tests component rendering, user interactions, and accessibility features.
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 */
import React from "react";
import { MatchScoreboard } from "../components/MatchScoreboard";
import { ResumeMatchModal } from "../components/ResumeMatchModal";
import { AIMatch, MatchStatus } from "../types/aiMatch";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("MatchScoreboard Component", () => {
  it("should render active match with correct scores and round indicator", () => {
    render(<MatchScoreboard playerScore={1} aiScore={0} currentRound={2} maxRounds={3} playerName="TestPlayer" />);

    // Verify scores are displayed
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();

    // Verify round indicator
    expect(screen.getByText("Round 2")).toBeInTheDocument();
    expect(screen.getByText("of 3")).toBeInTheDocument();

    // Verify player names
    expect(screen.getByText("TestPlayer")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();

    // Verify VS divider
    expect(screen.getByText("VS")).toBeInTheDocument();
  });

  it("should render completed match with victory message", () => {
    render(<MatchScoreboard playerScore={2} aiScore={1} currentRound={3} maxRounds={3} />);

    // Should show match complete instead of round
    expect(screen.getByText("Match Complete")).toBeInTheDocument();
    expect(screen.queryByText("Round 3")).not.toBeInTheDocument();

    // Should show victory message
    expect(screen.getByText("🎉 You Won the Match!")).toBeInTheDocument();
    expect(screen.getByText("Best of 3 rounds")).toBeInTheDocument();
  });

  it("should render completed match with defeat message", () => {
    render(<MatchScoreboard playerScore={0} aiScore={2} currentRound={3} maxRounds={3} />);

    // Should show defeat message
    expect(screen.getByText("😔 AI Won the Match")).toBeInTheDocument();
    expect(screen.getByText("Match Complete")).toBeInTheDocument();
  });

  it("should display progress dots correctly for active match", () => {
    const { container } = render(<MatchScoreboard playerScore={1} aiScore={1} currentRound={3} maxRounds={3} />);

    // Should have 3 progress dots
    const progressDots = container.querySelectorAll('[class*="w-2 h-2 rounded-full"]');
    expect(progressDots.length).toBeGreaterThanOrEqual(3);
  });

  it("should display win indicators correctly", () => {
    const { container } = render(<MatchScoreboard playerScore={2} aiScore={1} currentRound={3} maxRounds={3} />);

    // Should have win indicators for both players (2 each = 4 total)
    const winIndicators = container.querySelectorAll('[class*="w-3 h-3 rounded-full"]');
    expect(winIndicators.length).toBe(4);

    // Should have 3 filled indicators (2 player + 1 AI)
    const filledIndicators = container.querySelectorAll('[class*="bg-success"]');
    expect(filledIndicators.length).toBe(3);
  });

  it("should handle animation state correctly", () => {
    const { rerender } = render(
      <MatchScoreboard playerScore={1} aiScore={0} currentRound={2} maxRounds={3} isAnimating={false} />,
    );

    // Re-render with animation
    rerender(<MatchScoreboard playerScore={1} aiScore={0} currentRound={2} maxRounds={3} isAnimating={true} />);

    // Should not crash with animation state
    expect(screen.getByText("Round 2")).toBeInTheDocument();
  });
});

describe("ResumeMatchModal Component", () => {
  const mockMatch: AIMatch = {
    id: "test-match-123",
    playerId: "0x123",
    status: MatchStatus.ACTIVE,
    rounds: [
      {
        roundNumber: 1,
        playerMove: "rock",
        aiMove: "scissors",
        result: { winner: "player", playerMove: "rock", aiMove: "scissors" },
        timestamp: new Date("2024-01-01T10:00:00Z"),
      },
    ],
    playerScore: 1,
    aiScore: 0,
    currentRound: 2,
    startedAt: new Date("2024-01-01T10:00:00Z"),
    lastActivityAt: new Date("2024-01-01T10:05:00Z"),
    isAbandoned: false,
  };

  const mockProps = {
    match: mockMatch,
    onResume: vi.fn(),
    onAbandon: vi.fn(),
    timeRemaining: 5,
    isVisible: true,
  };

  it("should render modal with match information when visible", () => {
    render(<ResumeMatchModal {...mockProps} />);

    // Should show modal title
    expect(screen.getByRole("heading", { name: "Resume Match" })).toBeInTheDocument();

    // Should show match scores
    expect(screen.getByText("1")).toBeInTheDocument(); // Player score
    expect(screen.getByText("0")).toBeInTheDocument(); // AI score

    // Should show round information
    expect(screen.getByText("Round 2 of 3")).toBeInTheDocument();

    // Should show action buttons
    expect(screen.getByRole("button", { name: /resume match/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /abandon match/i })).toBeInTheDocument();
  });

  it("should not render when not visible", () => {
    render(<ResumeMatchModal {...mockProps} isVisible={false} />);

    // Should not show modal content
    expect(screen.queryByText("Resume Match")).not.toBeInTheDocument();
  });

  it("should call onResume when resume button is clicked", () => {
    const onResume = vi.fn();
    render(<ResumeMatchModal {...mockProps} onResume={onResume} />);

    const resumeButton = screen.getByRole("button", { name: /resume match/i });
    fireEvent.click(resumeButton);

    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("should call onAbandon when abandon button is clicked", () => {
    const onAbandon = vi.fn();
    render(<ResumeMatchModal {...mockProps} onAbandon={onAbandon} />);

    const abandonButton = screen.getByRole("button", { name: /abandon match/i });
    fireEvent.click(abandonButton);

    expect(onAbandon).toHaveBeenCalledTimes(1);
  });

  it("should call onAbandon when close button is clicked", () => {
    const onAbandon = vi.fn();
    render(<ResumeMatchModal {...mockProps} onAbandon={onAbandon} />);

    const closeButton = screen.getByRole("button", { name: /close modal/i });
    fireEvent.click(closeButton);

    expect(onAbandon).toHaveBeenCalledTimes(1);
  });

  it("should display time remaining correctly", () => {
    render(<ResumeMatchModal {...mockProps} timeRemaining={5} />);

    expect(screen.getByText(/Auto-abandon in: 5 minutes/)).toBeInTheDocument();
  });

  it("should show warning for matches close to expiration", () => {
    render(<ResumeMatchModal {...mockProps} timeRemaining={2} />);

    // Should show warning emoji and text
    expect(screen.getByText(/⚠️/)).toBeInTheDocument();
    expect(screen.getByText(/automatically abandoned soon/)).toBeInTheDocument();
  });

  it("should display last activity time correctly", () => {
    render(<ResumeMatchModal {...mockProps} />);

    // Should show some indication of last activity
    expect(screen.getByText(/Last played:/)).toBeInTheDocument();
  });

  it("should display rounds played information", () => {
    render(<ResumeMatchModal {...mockProps} />);

    // Should show rounds played (1 round completed out of 3)
    expect(screen.getByText("Rounds played: 1/3")).toBeInTheDocument();
  });

  it("should handle match with no completed rounds", () => {
    const matchWithNoRounds = {
      ...mockMatch,
      rounds: [],
      playerScore: 0,
      aiScore: 0,
      currentRound: 1,
    };

    render(<ResumeMatchModal {...mockProps} match={matchWithNoRounds} />);

    expect(screen.getByText("Round 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Rounds played: 0/3")).toBeInTheDocument();
  });

  it("should be accessible with proper ARIA labels", () => {
    render(<ResumeMatchModal {...mockProps} />);

    // Check for accessible close button
    const closeButton = screen.getByRole("button", { name: /close modal/i });
    expect(closeButton).toBeInTheDocument();

    // Check for accessible action buttons
    const resumeButton = screen.getByRole("button", { name: /resume match/i });
    const abandonButton = screen.getByRole("button", { name: /abandon match/i });

    expect(resumeButton).toBeInTheDocument();
    expect(abandonButton).toBeInTheDocument();
  });

  it("should handle responsive design with proper CSS classes", () => {
    const { container } = render(<ResumeMatchModal {...mockProps} />);

    // Check for responsive modal container
    const modal = container.querySelector(".fixed.inset-0");
    expect(modal).toBeInTheDocument();

    // Check for responsive modal content
    const modalContent = container.querySelector(".max-w-md.w-full");
    expect(modalContent).toBeInTheDocument();

    // Check for flex layouts
    const flexElements = container.querySelectorAll('[class*="flex"]');
    expect(flexElements.length).toBeGreaterThan(0);
  });

  it("should display proper visual hierarchy with correct text sizes", () => {
    const { container } = render(<ResumeMatchModal {...mockProps} />);

    // Check for heading text size
    const heading = container.querySelector(".text-xl");
    expect(heading).toBeInTheDocument();

    // Check for score text size
    const scoreText = container.querySelector(".text-2xl");
    expect(scoreText).toBeInTheDocument();

    // Check for small text elements
    const smallText = container.querySelectorAll(".text-sm");
    expect(smallText.length).toBeGreaterThan(0);
  });
});

describe("MatchScoreboard Component - Additional Tests", () => {
  it("should handle edge case with maximum scores", () => {
    render(<MatchScoreboard playerScore={2} aiScore={2} currentRound={3} maxRounds={3} />);

    // Should show both scores as 2 (use getAllByText since both players have score 2)
    const scoreElements = screen.getAllByText("2");
    expect(scoreElements).toHaveLength(2);
    expect(screen.getByText("Match Complete")).toBeInTheDocument();
  });

  it("should handle responsive design with proper grid layout", () => {
    const { container } = render(<MatchScoreboard playerScore={1} aiScore={0} currentRound={2} maxRounds={3} />);

    // Check for grid layout
    const gridElement = container.querySelector(".grid.grid-cols-3");
    expect(gridElement).toBeInTheDocument();

    // Check for responsive spacing
    const gapElements = container.querySelectorAll('[class*="gap-"]');
    expect(gapElements.length).toBeGreaterThan(0);
  });

  it("should display proper visual feedback for different states", () => {
    const { container } = render(
      <MatchScoreboard playerScore={1} aiScore={1} currentRound={3} maxRounds={3} isAnimating={true} />,
    );

    // Check for animation classes
    const animatedElements = container.querySelectorAll('[class*="animate-"]');
    expect(animatedElements.length).toBeGreaterThan(0);

    // Check for transition classes
    const transitionElements = container.querySelectorAll('[class*="transition-"]');
    expect(transitionElements.length).toBeGreaterThan(0);
  });

  it("should handle accessibility with proper semantic elements", () => {
    render(<MatchScoreboard playerScore={1} aiScore={0} currentRound={2} maxRounds={3} playerName="TestPlayer" />);

    // Check that important information is accessible
    expect(screen.getByText("TestPlayer")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("VS")).toBeInTheDocument();

    // Verify scores are properly displayed
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should handle different player names correctly", () => {
    render(
      <MatchScoreboard playerScore={0} aiScore={1} currentRound={2} maxRounds={3} playerName="CustomPlayerName" />,
    );

    expect(screen.getByText("CustomPlayerName")).toBeInTheDocument();
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("should handle match completion with tie scenario", () => {
    // Note: This is a theoretical test since current logic doesn't support ties at match level
    // but it tests the component's robustness
    render(<MatchScoreboard playerScore={1} aiScore={1} currentRound={3} maxRounds={3} />);

    // Should show current round since neither player has 2 wins
    expect(screen.getByText("Round 3")).toBeInTheDocument();
    expect(screen.queryByText("Match Complete")).not.toBeInTheDocument();
  });
});
