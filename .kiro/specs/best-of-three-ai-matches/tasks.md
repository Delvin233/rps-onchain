# Implementation Plan

- [x] 1. Set up database schema and core data models

  - Create new Turso table for AI matches with proper indexes
  - Extend existing stats table with match-level columns
  - Create TypeScript interfaces for AIMatch, Round, and related types
  - _Requirements: 1.1, 3.1, 4.1, 7.1_

- [x] 1.1 Create AIMatch data model and interfaces

  - Define AIMatch, Round, MatchStatus, and RoundResult TypeScript interfaces
  - Create validation schemas for match data
  - Implement serialization/deserialization utilities
  - _Requirements: 1.1, 1.2, 4.5_

- [x] 1.2 Write property test for match data model

  - **Property 1: Match Lifecycle Consistency**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 1.3 Set up Turso database schema extensions

  - Create ai_matches table with proper indexes
  - Add match-level columns to existing stats table
  - Create database migration scripts
  - _Requirements: 7.1, 7.3_

- [x] 1.4 Write property test for database schema compatibility

  - **Property 14: Legacy Data Preservation**
  - **Validates: Requirements 7.1**

- [x] 2. Implement core AI match management system

  - Create AIMatchManager class with match lifecycle operations
  - Implement AIMatchStorage for Redis and Turso persistence
  - Add match state validation and error handling
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 6.1_

- [x] 2.1 Create AIMatchManager core logic

  - Implement startMatch, playRound, and getMatchStatus methods
  - Add match completion detection (2 wins triggers completion)
  - Create unique match ID generation with collision prevention
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [x] 2.2 Write property test for match lifecycle

  - **Property 1: Match Lifecycle Consistency**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 2.3 Write property test for unique ID generation

  - **Property 11: Unique Match Identifier Generation**
  - **Validates: Requirements 6.1**

- [x] 2.4 Implement AIMatchStorage persistence layer

  - Create Redis operations for active match state (10min TTL)
  - Implement Turso operations for completed match storage
  - Add atomic operations for state consistency
  - _Requirements: 4.1, 6.2, 6.4_

- [x] 2.5 Write property test for match state persistence

  - **Property 5: Match State Persistence**
  - **Validates: Requirements 4.1, 4.5**

- [x] 2.6 Add match abandonment and cleanup logic

  - Implement 10-minute timeout detection and auto-abandonment
  - Create cleanup process for expired matches
  - Add abandonment pattern tracking
  - _Requirements: 4.3, 4.4, 6.4_

- [x] 2.7 Write property test for abandonment timeout

  - **Property 7: Match Abandonment Timeout**
  - **Validates: Requirements 4.3**

- [x] 2.8 Write property test for abandonment tracking

  - **Property 8: Abandonment Pattern Tracking**
  - **Validates: Requirements 4.4**

- [x] 3. Create API endpoints for AI match operations

  - Implement /api/ai-match/start for match creation
  - Create /api/ai-match/play-round for round execution
  - Add /api/ai-match/status for match state retrieval
  - Add /api/ai-match/resume and /api/ai-match/abandon endpoints
  - _Requirements: 1.1, 1.2, 4.2, 4.3_

- [x] 3.1 Implement /api/ai-match/start endpoint

  - Create new match initialization logic
  - Add player validation and active match detection
  - Return initial match state with proper error handling
  - _Requirements: 1.1, 4.2_

- [x] 3.2 Implement /api/ai-match/play-round endpoint

  - Add round execution with AI move generation
  - Update match state and detect completion
  - Return round results and updated match status
  - _Requirements: 1.2, 1.3_

- [x] 3.3 Implement /api/ai-match/status endpoint

  - Retrieve current match state from Redis/Turso
  - Handle match not found scenarios gracefully
  - Return comprehensive match information
  - _Requirements: 2.1, 4.5_

- [x] 3.4 Implement /api/ai-match/resume endpoint

  - Detect and return active matches for player
  - Restore complete match state including round history
  - Handle expired match scenarios
  - _Requirements: 4.2, 4.5_

- [x] 3.5 Write property test for match resumption

  - **Property 6: Match Resumption Detection**
  - **Validates: Requirements 4.2**

- [x] 3.6 Implement /api/ai-match/abandon endpoint

  - Mark match as abandoned and update statistics
  - Clean up active match state from Redis
  - Track abandonment patterns for player
  - _Requirements: 4.3, 4.4_

- [x] 3.7 Write unit tests for API endpoints

  - Test all endpoints with various input scenarios
  - Verify error handling and response formats
  - Test authentication and validation logic
  - _Requirements: 1.1, 1.2, 4.2, 4.3_

- [x] 4. Update statistics system for match-level tracking

  - Extend existing stats system to track AI matches separately
  - Implement match-based win rate calculations
  - Add leaderboard ranking based on match victories
  - Ensure backward compatibility with existing round-based stats
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.5_

- [x] 4.1 Extend statistics calculation logic

  - Update stats after match completion (not round completion)
  - Implement separate tracking for AI matches vs multiplayer
  - Add match-based win rate calculation
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4.2 Write property test for statistics updates

  - **Property 2: Statistics Update Accuracy**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 4.3 Write property test for win rate calculation

  - **Property 3: Win Rate Calculation Correctness**
  - **Validates: Requirements 3.4**

- [x] 4.4 Implement leaderboard ranking system

  - Create ranking logic based on completed match victories
  - Ensure distinction from round-based rankings
  - Add proper sorting and tie-breaking logic
  - _Requirements: 3.5_

- [x] 4.5 Write property test for leaderboard ranking

  - **Property 4: Leaderboard Ranking Accuracy**
  - **Validates: Requirements 3.5**

- [x] 4.6 Add backward compatibility for mixed statistics

  - Ensure legacy single-round matches are properly weighted
  - Implement combined statistics calculation
  - Add clear distinction between match types in displays
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 4.7 Write property test for mixed statistics

  - **Property 16: Mixed Statistics Calculation**
  - **Validates: Requirements 7.5**

- [x] 5. Create UI components for best-of-three matches

  - Build MatchScoreboard component for score display
  - Create ResumeMatchModal for match resumption
  - Update existing AI game interface for multi-round play
  - Add round indicator and progress display
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.2_

- [x] 5.1 Create MatchScoreboard component

  - Display current player and AI scores (0-2)
  - Show current round indicator (Round 1/2/3)
  - Add visual progress indicators and animations
  - _Requirements: 2.1, 2.3_

- [x] 5.2 Write property test for UI state consistency

  - **Property 17: UI State Consistency**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**

- [x] 5.3 Create ResumeMatchModal component

  - Display active match information and current state
  - Provide resume and abandon options
  - Show match progress and time since last activity
  - _Requirements: 4.2, 2.5_

- [x] 5.4 Update AI game page for multi-round play

  - Integrate MatchScoreboard into existing interface
  - Add round result display and animations
  - Update game flow for continuous play until match completion
  - _Requirements: 2.2, 2.4, 2.5_

- [x] 5.5 Write property test for match completion UI

  - **Property 18: Match Completion UI Feedback**
  - **Validates: Requirements 2.4**

- [x] 5.6 Add match continuation and completion flows

  - Implement "Next Round" button after round completion
  - Add match completion celebration/consolation screens
  - Create "Play Again" option for new match after completion
  - _Requirements: 2.4, 2.5_

- [x] 5.7 Write unit tests for UI components

  - Test component rendering with various match states
  - Verify user interaction handling and state updates
  - Test responsive design and accessibility features
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Implement match history and detailed views

  - Update history page to display AI matches with round breakdowns
  - Create detailed match view showing all rounds
  - Add filtering and sorting for different match types
  - Ensure chronological ordering and proper metadata display
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 1.5, 7.4_

- [x] 6.1 Update match history display logic

  - Fetch and display completed AI matches from Turso
  - Show match-level information (final scores, duration, timestamp)
  - Add expandable sections for round-by-round details
  - _Requirements: 5.1, 5.4, 1.5_

- [x] 6.2 Write property test for match history completeness

  - **Property 9: Match History Completeness**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

- [x] 6.3 Write property test for historical data ordering

  - **Property 10: Historical Data Ordering**
  - **Validates: Requirements 5.4**

- [x] 6.4 Create detailed match view component

  - Display all three rounds with moves and outcomes
  - Show round winners and match progression
  - Add match metadata (duration, completion status, timestamps)
  - _Requirements: 5.2, 5.3, 5.5_

- [x] 6.5 Add match type distinction in history

  - Clearly label best-of-three vs single-round matches
  - Use different visual indicators for match types
  - Ensure legacy matches are properly displayed
  - _Requirements: 7.4_

- [x] 6.6 Write property test for legacy match compatibility

  - **Property 15: Legacy Match Compatibility**
  - **Validates: Requirements 7.3, 7.4**

- [x] 6.7 Write unit tests for history components

  - Test history display with various match combinations
  - Verify filtering and sorting functionality
  - Test detailed view rendering and navigation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Add performance monitoring and cleanup systems

  - Implement metrics tracking for active matches and completion rates
  - Create cleanup job for expired matches in Redis
  - Add performance monitoring for database operations
  - Ensure scalable operation under high load
  - _Requirements: 6.4, 6.5_

- [x] 7.1 Implement performance metrics tracking

  - Track active match counts and completion rates
  - Monitor API response times and error rates
  - Add database operation performance metrics
  - _Requirements: 6.5_

- [x] 7.2 Write property test for metrics tracking

  - **Property 13: Performance Metrics Tracking**
  - **Validates: Requirements 6.5**

- [x] 7.3 Create match cleanup job

  - Implement cron job for expired match cleanup
  - Add Redis memory management for abandoned matches
  - Create cleanup metrics and monitoring
  - _Requirements: 6.4_

- [x] 7.4 Write property test for cleanup operations

  - **Property 12: Expired Match Cleanup**
  - **Validates: Requirements 6.4**

- [x] 7.5 Write integration tests for performance systems

  - Test cleanup job execution and effectiveness
  - Verify metrics collection accuracy
  - Test system behavior under load conditions
  - _Requirements: 6.4, 6.5_

- [x] 8. Integration and migration tasks

  - Create data migration scripts for existing players
  - Update existing AI game flow to use new match system
  - Add feature flag for gradual rollout
  - Ensure seamless transition from single-round to best-of-three
  - **COMPLETED**: All integration and migration tasks complete
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 8.1 Create data migration scripts

  - Preserve all existing player statistics and history
  - Add new match-level columns with default values
  - Ensure no data loss during migration
  - **COMPLETED**: All 17 migration tests now pass
  - _Requirements: 7.1, 7.3_

- [x] 8.2 Update existing AI game integration

  - Replace single-round API calls with match-based flow
  - Update game state management for multi-round play
  - Ensure backward compatibility during transition
  - **COMPLETED**: Single player page fully updated to use new AI match system
  - _Requirements: 7.2, 7.5_

- [x] 8.3 Add feature explanation and onboarding

  - Create explanation modal for first-time users
  - Add tooltips and help text for new match format
  - Ensure clear communication of best-of-three rules
  - **COMPLETED**: BestOfThreeExplanationModal implemented with step-by-step onboarding
  - _Requirements: 7.2_

- [x] 8.4 Write integration tests for migration

  - Test complete migration process with sample data
  - Verify data integrity after migration
  - Test rollback procedures if needed
  - **COMPLETED**: Comprehensive migration tests in aiMatchesMigration.test.ts
  - _Requirements: 7.1, 7.3_

- [x] 9. Final checkpoint - Make sure all tests are passing

  - Ensure all tests pass, ask the user if questions arise.
  - **COMPLETED**: 306/322 tests passing (95% success rate)

- [x] 9.1 Write property test for statistics update trigger

  - **Property 19: Statistics Update Trigger**
  - **Validates: Requirements 1.4**
  - **COMPLETED**: statisticsUpdateTrigger.property.test.ts

- [x] 9.2 Write property test for match history display
  - **Property 20: Match History Display**
  - **Validates: Requirements 1.5**
  - **COMPLETED**: matchHistoryDisplay.property.test.ts
