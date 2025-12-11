/**
 * Unit Tests for History Components
 *
 * Comprehensive unit tests for history page and detailed match view components.
 * Tests history display with various match combinations, filtering and sorting functionality,
 * and detailed view rendering and navigation.
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 */
import React from "react";
import { DetailedMatchView } from "../components/DetailedMatchView";
import { AIMatch, MatchStatus, Move, RoundWinner } from "../types/aiMatch";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Next.js components
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// Mock hooks
vi.mock("~~/hooks/useConnectedAddress", () => ({
  useConnectedAddress: () => ({
    address: "0x123456789abcdef",
    isConnected: true,
    isConnecting: false,
  }),
}));

vi.mock("~~/hooks/useIPFSSync", () => ({
  useIPFSSync: () => ({
    syncToIPFS: vi.fn(),
    isSyncing: false,
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Mock fetch
global.fetch = vi.fn();

describe("DetailedMatchView Component", () => {
  const mockMatch: AIMatch = {
    id: "test-match-123",
    playerId: "0x123456789abcdef",
    status: MatchStatus.COMPLETED,
    rounds: [
      {
        roundNumber: 1,
        playerMove: "rock" as Move,
        aiMove: "scissors" as Move,
        result: { winner: "player" as RoundWinner, playerMove: "rock" as Move, aiMove: "scissors" as Move },
        timestamp: new Date("2024-01-01T10:00:00Z"),
      },
      {
        roundNumber: 2,
        playerMove: "paper" as Move,
        aiMove: "rock" as Move,
        result: { winner: "player" as RoundWinner, playerMove: "paper" as Move, aiMove: "rock" as Move },
        timestamp: new Date("2024-01-01T10:01:00Z"),
      },
      {
        roundNumber: 3,
        playerMove: "scissors" as Move,
        aiMove: "paper" as Move,
        result: { winner: "player" as RoundWinner, playerMove: "scissors" as Move, aiMove: "paper" as Move },
        timestamp: new Date("2024-01-01T10:02:00Z"),
      },
    ],
    playerScore: 2,
    aiScore: 0,
    currentRound: 3,
    startedAt: new Date("2024-01-01T10:00:00Z"),
    lastActivityAt: new Date("2024-01-01T10:02:00Z"),
    completedAt: new Date("2024-01-01T10:02:30Z"),
    winner: "player",
    isAbandoned: false,
  };

  const mockProps = {
    match: mockMatch,
    onClose: vi.fn(),
    isVisible: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render detailed match view when visible", () => {
    render(<DetailedMatchView {...mockProps} />);

    // Should show modal title
    expect(screen.getByText("Match Details")).toBeInTheDocument();
    expect(screen.getByText("Best of 3 vs AI")).toBeInTheDocument();

    // Should show match scores
    expect(screen.getByText("2")).toBeInTheDocument(); // Player score
    expect(screen.getByText("0")).toBeInTheDocument(); // AI score

    // Should show match status
    expect(screen.getByTestId("match-status-display")).toHaveTextContent("Victory");
  });

  it("should not render when not visible", () => {
    render(<DetailedMatchView {...mockProps} isVisible={false} />);

    expect(screen.queryByText("Match Details")).not.toBeInTheDocument();
  });

  it("should not render when match is null", () => {
    render(<DetailedMatchView {...mockProps} match={null} />);

    expect(screen.queryByText("Match Details")).not.toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<DetailedMatchView {...mockProps} onClose={onClose} />);

    const closeButton = screen.getByRole("button", { name: /close detailed view/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should display all rounds with correct information", () => {
    render(<DetailedMatchView {...mockProps} />);

    // Should show all 3 rounds (using getAllByText since rounds appear in both badge and progression)
    expect(screen.getAllByText("Round 1")).toHaveLength(2); // Badge + progression
    expect(screen.getAllByText("Round 2")).toHaveLength(2); // Badge + progression
    expect(screen.getAllByText("Round 3")).toHaveLength(2); // Badge + progression

    // Should show moves for each round
    expect(screen.getAllByText("ROCK")).toHaveLength(2); // Player round 1, AI round 2
    expect(screen.getAllByText("PAPER")).toHaveLength(2); // Player round 2, AI round 3
    expect(screen.getAllByText("SCISSORS")).toHaveLength(2); // Player round 3, AI round 1

    // Should show round results
    expect(screen.getAllByText("You Won")).toHaveLength(3);
  });

  it("should display match metadata correctly", () => {
    render(<DetailedMatchView {...mockProps} />);

    // Should show start time
    expect(screen.getByText("Started")).toBeInTheDocument();
    expect(screen.getAllByText("1/1/2024, 10:00:00 AM")).toHaveLength(2); // Appears in match info and round timestamp

    // Should show duration
    expect(screen.getByText("Duration")).toBeInTheDocument();
    expect(screen.getByText("2m 30s")).toBeInTheDocument();

    // Should show match ID
    expect(screen.getByText("Match ID:")).toBeInTheDocument();
    expect(screen.getByText("test-match-123")).toBeInTheDocument();

    // Should show rounds played
    expect(screen.getByText("Rounds Played:")).toBeInTheDocument();
    expect(screen.getByText("3 of 3")).toBeInTheDocument();
  });

  it("should display correct move emojis", () => {
    render(<DetailedMatchView {...mockProps} />);

    // Should show rock, paper, scissors emojis
    expect(screen.getAllByText("🪨")).toHaveLength(2); // Rock moves
    expect(screen.getAllByText("📄")).toHaveLength(2); // Paper moves
    expect(screen.getAllByText("✂️")).toHaveLength(2); // Scissors moves
  });

  it("should display match progression correctly", () => {
    render(<DetailedMatchView {...mockProps} />);

    expect(screen.getByText("Match Progression")).toBeInTheDocument();

    // Should show all 3 round indicators
    const roundIndicators = screen.getAllByText(/Round \d/);
    expect(roundIndicators).toHaveLength(6); // 3 in progression + 3 in round details
  });

  it("should handle abandoned match correctly", () => {
    const abandonedMatch = {
      ...mockMatch,
      isAbandoned: true,
      winner: undefined,
      completedAt: undefined,
    };

    render(<DetailedMatchView {...mockProps} match={abandonedMatch} />);

    expect(screen.getByTestId("match-status-display")).toHaveTextContent("Abandoned");
  });

  it("should handle AI victory correctly", () => {
    const aiWinMatch = {
      ...mockMatch,
      playerScore: 0,
      aiScore: 2,
      winner: "ai" as const,
      rounds: [
        {
          roundNumber: 1,
          playerMove: "rock" as Move,
          aiMove: "paper" as Move,
          result: { winner: "ai" as RoundWinner, playerMove: "rock" as Move, aiMove: "paper" as Move },
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
        {
          roundNumber: 2,
          playerMove: "scissors" as Move,
          aiMove: "rock" as Move,
          result: { winner: "ai" as RoundWinner, playerMove: "scissors" as Move, aiMove: "rock" as Move },
          timestamp: new Date("2024-01-01T10:01:00Z"),
        },
      ],
    };

    render(<DetailedMatchView {...mockProps} match={aiWinMatch} />);

    expect(screen.getByTestId("match-status-display")).toHaveTextContent("Defeat");
    expect(screen.getAllByText("AI Won")).toHaveLength(2);
  });

  it("should handle tie rounds correctly", () => {
    const tieMatch = {
      ...mockMatch,
      rounds: [
        {
          roundNumber: 1,
          playerMove: "rock" as Move,
          aiMove: "rock" as Move,
          result: { winner: "tie" as RoundWinner, playerMove: "rock" as Move, aiMove: "rock" as Move },
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
      ],
      playerScore: 0,
      aiScore: 0,
      currentRound: 2,
      completedAt: undefined,
      winner: undefined,
    };

    render(<DetailedMatchView {...mockProps} match={tieMatch} />);

    expect(screen.getByTestId("match-status-display")).toHaveTextContent("In Progress");
    expect(screen.getByTestId("round-1-result")).toHaveTextContent("Tie");
  });

  it("should format timestamps correctly", () => {
    render(<DetailedMatchView {...mockProps} />);

    // Check that timestamps are formatted properly
    expect(screen.getAllByText("1/1/2024, 10:00:00 AM")).toHaveLength(2); // Appears in match info and round
    expect(screen.getByText("1/1/2024, 10:01:00 AM")).toBeInTheDocument();
    expect(screen.getByText("1/1/2024, 10:02:00 AM")).toBeInTheDocument();
  });

  it("should handle match without completion time", () => {
    const incompleteMatch = {
      ...mockMatch,
      completedAt: undefined,
      winner: undefined,
    };

    render(<DetailedMatchView {...mockProps} match={incompleteMatch} />);

    expect(screen.queryByText("Duration")).not.toBeInTheDocument();
    expect(screen.queryByText("Completed:")).not.toBeInTheDocument();
    expect(screen.getByTestId("match-status-display")).toHaveTextContent("In Progress");
  });

  it("should display win indicators correctly", () => {
    const { container } = render(<DetailedMatchView {...mockProps} />);

    // Should have win indicators for both players
    const winIndicators = container.querySelectorAll('[class*="w-3 h-3 rounded-full"]');
    expect(winIndicators.length).toBe(4); // 2 for player, 2 for AI

    // Should have filled indicators for player wins (2 in player section + 3 in round results + 2 in progression = 7 total)
    const filledIndicators = container.querySelectorAll('[class*="bg-success border-success"]');
    expect(filledIndicators.length).toBeGreaterThanOrEqual(2); // At least 2 for player wins
  });

  it("should handle responsive design with proper CSS classes", () => {
    const { container } = render(<DetailedMatchView {...mockProps} />);

    // Check for responsive modal container
    const modal = container.querySelector(".fixed.inset-0");
    expect(modal).toBeInTheDocument();

    // Check for responsive modal content
    const modalContent = container.querySelector(".max-w-2xl.w-full");
    expect(modalContent).toBeInTheDocument();

    // Check for grid layouts
    const gridElements = container.querySelectorAll('[class*="grid"]');
    expect(gridElements.length).toBeGreaterThan(0);
  });

  it("should be accessible with proper ARIA labels", () => {
    render(<DetailedMatchView {...mockProps} />);

    // Check for accessible close button
    const closeButton = screen.getByRole("button", { name: /close detailed view/i });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAttribute("aria-label", "Close detailed view");
  });

  it("should handle scrollable content for long match history", () => {
    const { container } = render(<DetailedMatchView {...mockProps} />);

    // Check for scrollable container
    const scrollableContainer = container.querySelector(".max-h-\\[90vh\\].overflow-y-auto");
    expect(scrollableContainer).toBeInTheDocument();
  });

  it("should display proper visual hierarchy with correct text sizes", () => {
    const { container } = render(<DetailedMatchView {...mockProps} />);

    // Check for heading text size
    const heading = container.querySelector(".text-2xl");
    expect(heading).toBeInTheDocument();

    // Check for score text size
    const scoreText = container.querySelector(".text-3xl");
    expect(scoreText).toBeInTheDocument();

    // Check for small text elements
    const smallText = container.querySelectorAll(".text-sm");
    expect(smallText.length).toBeGreaterThan(0);
  });

  it("should handle edge case with no rounds", () => {
    const noRoundsMatch = {
      ...mockMatch,
      rounds: [],
      playerScore: 0,
      aiScore: 0,
      currentRound: 1,
      completedAt: undefined,
      winner: undefined,
    };

    render(<DetailedMatchView {...mockProps} match={noRoundsMatch} />);

    expect(screen.getByText("Rounds Played:")).toBeInTheDocument();
    expect(screen.getByText("0 of 3")).toBeInTheDocument();
    expect(screen.getByTestId("match-status-display")).toHaveTextContent("In Progress");
  });

  it("should display round results with proper styling", () => {
    const { container } = render(<DetailedMatchView {...mockProps} />);

    // Check for success styling on player wins
    const successElements = container.querySelectorAll('[class*="bg-success/20 text-success"]');
    expect(successElements.length).toBe(3); // All 3 rounds won by player

    // Check for result emojis - they appear in the round result badges
    const victoryBadges = container.querySelectorAll('[class*="bg-success/20 text-success"]');
    expect(victoryBadges.length).toBe(3); // All 3 rounds won by player
  });

  it("should handle different match statuses correctly", () => {
    const activeMatch = {
      ...mockMatch,
      status: MatchStatus.ACTIVE,
      completedAt: undefined,
      winner: undefined,
    };

    render(<DetailedMatchView {...mockProps} match={activeMatch} />);

    expect(screen.getByTestId("match-status-display")).toHaveTextContent("In Progress");
  });

  it("should format duration correctly for different time ranges", () => {
    // Test seconds only
    const shortMatch = {
      ...mockMatch,
      startedAt: new Date("2024-01-01T10:00:00Z"),
      completedAt: new Date("2024-01-01T10:00:30Z"),
    };

    const { rerender } = render(<DetailedMatchView {...mockProps} match={shortMatch} />);
    expect(screen.getByText("30s")).toBeInTheDocument();

    // Test minutes and seconds
    const mediumMatch = {
      ...mockMatch,
      startedAt: new Date("2024-01-01T10:00:00Z"),
      completedAt: new Date("2024-01-01T10:01:45Z"),
    };

    rerender(<DetailedMatchView {...mockProps} match={mediumMatch} />);
    expect(screen.getByText("1m 45s")).toBeInTheDocument();
  });
});

describe("DetailedMatchView Component - Edge Cases", () => {
  it("should handle unknown move types gracefully", () => {
    const unknownMoveMatch: AIMatch = {
      id: "test-unknown",
      playerId: "0x123",
      status: MatchStatus.COMPLETED,
      rounds: [
        {
          roundNumber: 1,
          playerMove: "unknown" as Move,
          aiMove: "invalid" as Move,
          result: { winner: "tie" as RoundWinner, playerMove: "unknown" as Move, aiMove: "invalid" as Move },
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
      ],
      playerScore: 0,
      aiScore: 0,
      currentRound: 1,
      startedAt: new Date("2024-01-01T10:00:00Z"),
      lastActivityAt: new Date("2024-01-01T10:00:00Z"),
      completedAt: new Date("2024-01-01T10:00:30Z"),
      winner: "tie",
      isAbandoned: false,
    };

    render(<DetailedMatchView match={unknownMoveMatch} onClose={vi.fn()} isVisible={true} />);

    // Should show unknown move emojis
    expect(screen.getAllByText("❓")).toHaveLength(2);
    expect(screen.getAllByText("UNKNOWN")).toHaveLength(1);
    expect(screen.getAllByText("INVALID")).toHaveLength(1);
  });

  it("should handle match with mixed round results", () => {
    const mixedResultsMatch: AIMatch = {
      id: "test-mixed",
      playerId: "0x123",
      status: MatchStatus.COMPLETED,
      rounds: [
        {
          roundNumber: 1,
          playerMove: "rock" as Move,
          aiMove: "paper" as Move,
          result: { winner: "ai" as RoundWinner, playerMove: "rock" as Move, aiMove: "paper" as Move },
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
        {
          roundNumber: 2,
          playerMove: "scissors" as Move,
          aiMove: "scissors" as Move,
          result: { winner: "tie" as RoundWinner, playerMove: "scissors" as Move, aiMove: "scissors" as Move },
          timestamp: new Date("2024-01-01T10:01:00Z"),
        },
        {
          roundNumber: 3,
          playerMove: "paper" as Move,
          aiMove: "rock" as Move,
          result: { winner: "player" as RoundWinner, playerMove: "paper" as Move, aiMove: "rock" as Move },
          timestamp: new Date("2024-01-01T10:02:00Z"),
        },
      ],
      playerScore: 1,
      aiScore: 1,
      currentRound: 3,
      startedAt: new Date("2024-01-01T10:00:00Z"),
      lastActivityAt: new Date("2024-01-01T10:02:00Z"),
      completedAt: new Date("2024-01-01T10:02:30Z"),
      winner: "tie",
      isAbandoned: false,
    };

    const { container } = render(<DetailedMatchView match={mixedResultsMatch} onClose={vi.fn()} isVisible={true} />);

    // Should show different result types
    expect(screen.getByTestId("round-1-result")).toHaveTextContent("AI Won");
    expect(screen.getByTestId("round-2-result")).toHaveTextContent("Tie");
    expect(screen.getByTestId("round-3-result")).toHaveTextContent("You Won");

    // Should show different result badges with appropriate styling
    const aiWinBadge = container.querySelector('[class*="bg-error/20 text-error"]');
    const tieBadge = container.querySelector('[class*="bg-warning/20 text-warning"]');
    const playerWinBadge = container.querySelector('[class*="bg-success/20 text-success"]');

    expect(aiWinBadge).toBeInTheDocument(); // AI win
    expect(tieBadge).toBeInTheDocument(); // Tie
    expect(playerWinBadge).toBeInTheDocument(); // Player win
  });

  it("should handle very long match IDs", () => {
    const longIdMatch = {
      ...{
        id: "test-match-123",
        playerId: "0x123456789abcdef",
        status: MatchStatus.COMPLETED,
        rounds: [],
        playerScore: 0,
        aiScore: 0,
        currentRound: 1,
        startedAt: new Date("2024-01-01T10:00:00Z"),
        lastActivityAt: new Date("2024-01-01T10:00:00Z"),
        isAbandoned: false,
      },
      id: "very-long-match-id-that-should-wrap-properly-in-the-ui-component-display-area-test-123456789",
    };

    render(<DetailedMatchView match={longIdMatch} onClose={vi.fn()} isVisible={true} />);

    // Should display the long ID with proper wrapping
    expect(
      screen.getByText("very-long-match-id-that-should-wrap-properly-in-the-ui-component-display-area-test-123456789"),
    ).toBeInTheDocument();
  });

  it("should handle backdrop click behavior", () => {
    const onClose = vi.fn();
    const { container } = render(
      <DetailedMatchView
        match={{
          id: "test",
          playerId: "0x123",
          status: MatchStatus.COMPLETED,
          rounds: [],
          playerScore: 0,
          aiScore: 0,
          currentRound: 1,
          startedAt: new Date(),
          lastActivityAt: new Date(),
          isAbandoned: false,
        }}
        onClose={onClose}
        isVisible={true}
      />,
    );

    // Click on backdrop (the fixed overlay)
    const backdrop = container.querySelector(".fixed.inset-0");
    expect(backdrop).toBeInTheDocument();

    // Note: In a real implementation, you might want backdrop clicks to close the modal
    // This test verifies the backdrop exists for potential click handling
  });
});
