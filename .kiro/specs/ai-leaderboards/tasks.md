# AI Leaderboards Implementation Tasks

## Overview

This document breaks down the AI Leaderboards feature into actionable implementation tasks. Tasks are organized by phase and dependency order.

## Phase 1: Database & Core Logic

### Task 1.1: Create Rank System Utilities

**File:** `packages/nextjs/lib/ranks.ts`

**Description:** Create rank calculation and utility functions

**Subtasks:**
- [ ] Define `RankTier` interface
- [ ] Create `RANK_TIERS` constant array with all 10 ranks
- [ ] Implement `getRankForWins(wins: number): RankTier`
- [ ] Implement `getNextRank(currentWins: number): { rank: RankTier; winsNeeded: number } | null`
- [ ] Implement `getRankColor(rankName: string): string`
- [ ] Add unit tests for rank calculations

**Dependencies:** None

**Estimated Time:** 2 hours

---

### Task 1.2: Create Database Schema

**File:** Database migration or initialization script

**Description:** Set up Turso database table for leaderboards

**Subtasks:**
- [ ] Create `ai_leaderboards` table with schema
- [ ] Add `idx_wins` index (DESC)
- [ ] Add `idx_rank` index
- [ ] Test table creation in development
- [ ] Verify indexes are working
- [ ] Document schema in README

**Dependencies:** None

**Estimated Time:** 1 hour

---

### Task 1.3: Create Database Client Utilities

**File:** `packages/nextjs/lib/turso.ts` (or update existing)

**Description:** Add helper functions for leaderboard database operations

**Subtasks:**
- [ ] Create `getPlayerRank(address: string)` function
- [ ] Create `updatePlayerWins(address: string, increment: number)` function
- [ ] Create `getLeaderboard(limit: number, offset: number)` function
- [ ] Create `getPlayerPosition(address: string)` function
- [ ] Add error handling for all functions
- [ ] Add TypeScript types for return values

**Dependencies:** Task 1.2

**Estimated Time:** 3 hours

---

## Phase 2: API Endpoints

### Task 2.1: Create Update Wins Endpoint

**File:** `packages/nextjs/app/api/leaderboard/ai/update/route.ts`

**Description:** API endpoint to update player wins after AI match

**Subtasks:**
- [ ] Create POST handler
- [ ] Validate request body (address, won)
- [ ] Check if player exists in database
- [ ] Insert new player or update existing
- [ ] Calculate and update rank
- [ ] Return updated stats with rank change indicator
- [ ] Add rate limiting (1 update per 10 seconds per address)
- [ ] Add error handling and logging
- [ ] Test with various scenarios (new player, existing player, rank up)

**Dependencies:** Task 1.1, Task 1.3

**Estimated Time:** 4 hours

---

### Task 2.2: Create Get Leaderboard Endpoint

**File:** `packages/nextjs/app/api/leaderboard/ai/route.ts`

**Description:** API endpoint to fetch leaderboard rankings

**Subtasks:**
- [ ] Create GET handler
- [ ] Parse query parameters (limit, offset)
- [ ] Validate parameters (max limit: 100)
- [ ] Query database with pagination
- [ ] Calculate positions for entries
- [ ] Return paginated results with total count
- [ ] Add caching (30 second TTL)
- [ ] Add error handling
- [ ] Test pagination logic

**Dependencies:** Task 1.3

**Estimated Time:** 3 hours

---

### Task 2.3: Create Get Player Rank Endpoint

**File:** `packages/nextjs/app/api/leaderboard/ai/player/route.ts`

**Description:** API endpoint to fetch specific player's rank

**Subtasks:**
- [ ] Create GET handler
- [ ] Parse address from query parameter
- [ ] Validate address format
- [ ] Query player data from database
- [ ] Calculate player position
- [ ] Calculate next rank and wins needed
- [ ] Return player stats
- [ ] Add caching (1 minute TTL)
- [ ] Handle player not found case
- [ ] Test with various addresses

**Dependencies:** Task 1.1, Task 1.3

**Estimated Time:** 2 hours

---

## Phase 3: Frontend Components

### Task 3.1: Create Rank Badge Component

**File:** `packages/nextjs/components/RankBadge.tsx`

**Description:** Reusable component to display rank with styling

**Subtasks:**
- [ ] Create component with props (rank, wins, size, showWins)
- [ ] Implement color coding based on rank
- [ ] Add gradient support for Mythic rank
- [ ] Support multiple sizes (sm, md, lg)
- [ ] Add optional win count display
- [ ] Make responsive for mobile
- [ ] Add hover effects
- [ ] Test with all rank tiers

**Dependencies:** Task 1.1

**Estimated Time:** 3 hours

---

### Task 3.2: Create Leaderboard Entry Component

**File:** `packages/nextjs/components/LeaderboardEntry.tsx`

**Description:** Component for individual leaderboard entry

**Subtasks:**
- [ ] Create component with props (entry, isCurrentUser)
- [ ] Display position number with styling (1st, 2nd, 3rd)
- [ ] Display player name/address
- [ ] Display rank badge
- [ ] Display win count
- [ ] Highlight current user entry
- [ ] Add hover effects
- [ ] Make responsive for mobile
- [ ] Test with various entry data

**Dependencies:** Task 3.1

**Estimated Time:** 2 hours

---

### Task 3.3: Update Leaderboards Landing Page

**File:** `packages/nextjs/app/leaderboards/page.tsx`

**Description:** Update placeholder page with Single Player Ranks option

**Subtasks:**
- [ ] Replace "Coming Soon" with leaderboard options
- [ ] Add "Single Player Ranks" card
- [ ] Add description: "Compete against AI and climb the ranks"
- [ ] Add navigation to `/leaderboards/ai`
- [ ] Add icon (MdOutlineLeaderboard)
- [ ] Style card consistently with other pages
- [ ] Add placeholder for future leaderboard types
- [ ] Test navigation

**Dependencies:** None

**Estimated Time:** 1 hour

---

### Task 3.4: Create AI Leaderboard Page

**File:** `packages/nextjs/app/leaderboards/ai/page.tsx`

**Description:** Main AI leaderboard view with rankings

**Subtasks:**
- [ ] Create page component
- [ ] Add header with title and refresh button
- [ ] Fetch leaderboard data on mount
- [ ] Fetch current user rank
- [ ] Display current user card (highlighted)
- [ ] Display leaderboard list
- [ ] Implement pagination/infinite scroll
- [ ] Add loading states
- [ ] Add empty state (no entries)
- [ ] Add error state with retry
- [ ] Handle refresh button click
- [ ] Add debounce to refresh (5 seconds)
- [ ] Make responsive for mobile
- [ ] Test with various data scenarios

**Dependencies:** Task 2.2, Task 2.3, Task 3.1, Task 3.2

**Estimated Time:** 6 hours

---

### Task 3.5: Integrate Rank Display in Home Page Stats

**File:** `packages/nextjs/app/page.tsx`

**Description:** Add AI rank card to home page stats section

**Subtasks:**
- [ ] Fetch player rank data on home page load
- [ ] Add "AI Rank" card to statsData array
- [ ] Display current rank with badge
- [ ] Display total wins
- [ ] Show progress to next rank (in subtitle)
- [ ] Display wins needed for next rank
- [ ] Make card clickable to navigate to leaderboard
- [ ] Handle unranked state (0 wins)
- [ ] Add loading state (skeleton)
- [ ] Make responsive for mobile
- [ ] Test with various rank levels
- [ ] Ensure consistent styling with other stat cards

**Dependencies:** Task 2.3, Task 3.1

**Estimated Time:** 3 hours

**Note:** Profile page remains for user customization only

---

## Phase 4: Integration & Automation

### Task 4.1: Create AI Match Completion Hook

**File:** `packages/nextjs/hooks/useAIMatchCompletion.ts`

**Description:** Hook to automatically update leaderboard after AI match

**Subtasks:**
- [ ] Create custom hook
- [ ] Implement `updateLeaderboard(won: boolean)` function
- [ ] Call update API endpoint
- [ ] Handle rank change notifications
- [ ] Show toast on rank up
- [ ] Add error handling
- [ ] Add loading state
- [ ] Test with AI game completion

**Dependencies:** Task 2.1

**Estimated Time:** 2 hours

---

### Task 4.2: Integrate Hook with AI Game

**File:** `packages/nextjs/app/ai/page.tsx` (or AI game component)

**Description:** Call leaderboard update when AI match ends

**Subtasks:**
- [ ] Import `useAIMatchCompletion` hook
- [ ] Call `updateLeaderboard(true)` on player win
- [ ] Ensure update happens after match is saved
- [ ] Test with multiple AI matches
- [ ] Verify rank updates correctly
- [ ] Test rank up notification
- [ ] Handle update failures gracefully

**Dependencies:** Task 4.1

**Estimated Time:** 2 hours

---

## Phase 5: Name Resolution

### Task 5.1: Create Name Resolver Utility

**File:** `packages/nextjs/lib/nameResolver.ts`

**Description:** Utility to resolve player names from addresses

**Subtasks:**
- [ ] Create `resolveDisplayName(address: string): Promise<string>` function
- [ ] Implement Farcaster username resolution
- [ ] Implement ENS name resolution
- [ ] Implement Basename resolution
- [ ] Add fallback to truncated address
- [ ] Add caching mechanism (5 minute TTL)
- [ ] Add error handling
- [ ] Test with various addresses

**Dependencies:** None

**Estimated Time:** 4 hours

---

### Task 5.2: Integrate Name Resolution in API

**File:** `packages/nextjs/app/api/leaderboard/ai/update/route.ts`

**Description:** Resolve and store display names on leaderboard updates

**Subtasks:**
- [ ] Import name resolver utility
- [ ] Call resolver on each update
- [ ] Store resolved name in `display_name` field
- [ ] Handle resolution failures gracefully
- [ ] Add timeout for resolution (2 seconds max)
- [ ] Test with various address types

**Dependencies:** Task 2.1, Task 5.1

**Estimated Time:** 2 hours

---

### Task 5.3: Display Resolved Names in Leaderboard

**File:** `packages/nextjs/app/leaderboards/ai/page.tsx`

**Description:** Show resolved names instead of addresses

**Subtasks:**
- [ ] Use `display_name` from API response
- [ ] Fallback to address if name not available
- [ ] Add tooltip showing full address on hover
- [ ] Test with various name types (ENS, Basename, etc.)

**Dependencies:** Task 3.4, Task 5.2

**Estimated Time:** 1 hour

---

## Phase 6: Polish & Optimization

### Task 6.1: Add Loading States

**Files:** All leaderboard components

**Description:** Improve UX with proper loading indicators

**Subtasks:**
- [ ] Add skeleton loaders for leaderboard entries
- [ ] Add spinner for refresh button
- [ ] Add loading state for profile rank card
- [ ] Disable buttons during loading
- [ ] Test loading states

**Dependencies:** Phase 3 complete

**Estimated Time:** 2 hours

---

### Task 6.2: Add Error Handling & Toasts

**Files:** All leaderboard components

**Description:** Improve error feedback to users

**Subtasks:**
- [ ] Add toast notifications for errors
- [ ] Add retry buttons on failures
- [ ] Show helpful error messages
- [ ] Log errors for debugging
- [ ] Test various error scenarios

**Dependencies:** Phase 3 complete

**Estimated Time:** 2 hours

---

### Task 6.3: Optimize Performance

**Files:** API routes and components

**Description:** Improve performance and reduce load times

**Subtasks:**
- [ ] Implement API response caching
- [ ] Add database query optimization
- [ ] Implement virtual scrolling for large lists
- [ ] Add debouncing to refresh button
- [ ] Optimize name resolution (batch requests)
- [ ] Test with large datasets
- [ ] Monitor API response times

**Dependencies:** Phase 2 and 3 complete

**Estimated Time:** 4 hours

---

### Task 6.4: Add Animations & Transitions

**Files:** All leaderboard components

**Description:** Polish UI with smooth animations

**Subtasks:**
- [ ] Add fade-in animation for leaderboard entries
- [ ] Add slide-in animation for rank card
- [ ] Add smooth transitions for rank changes
- [ ] Add confetti effect on rank up
- [ ] Add hover animations
- [ ] Test animations on mobile
- [ ] Ensure animations are performant

**Dependencies:** Phase 3 complete

**Estimated Time:** 3 hours

---

## Phase 7: Testing & Documentation

### Task 7.1: Write Unit Tests

**Files:** Test files for utilities and components

**Description:** Add comprehensive unit tests

**Subtasks:**
- [ ] Test rank calculation functions
- [ ] Test name resolver utility
- [ ] Test database client functions
- [ ] Test API endpoint handlers
- [ ] Test React components
- [ ] Achieve 80%+ code coverage
- [ ] Run tests in CI/CD

**Dependencies:** All implementation complete

**Estimated Time:** 6 hours

---

### Task 7.2: Write Integration Tests

**Files:** Integration test files

**Description:** Test end-to-end flows

**Subtasks:**
- [ ] Test AI match → leaderboard update flow
- [ ] Test leaderboard pagination
- [ ] Test player rank retrieval
- [ ] Test name resolution caching
- [ ] Test rank up notifications
- [ ] Test error scenarios

**Dependencies:** All implementation complete

**Estimated Time:** 4 hours

---

### Task 7.3: Manual QA Testing

**Description:** Thorough manual testing of all features

**Subtasks:**
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (iOS, Android)
- [ ] Test with different wallet types
- [ ] Test with various rank levels
- [ ] Test edge cases (0 wins, 1000+ wins)
- [ ] Test error scenarios
- [ ] Test performance with large datasets
- [ ] Document any bugs found

**Dependencies:** All implementation complete

**Estimated Time:** 4 hours

---

### Task 7.4: Update Documentation

**Files:** README, API docs, component docs

**Description:** Document the leaderboard feature

**Subtasks:**
- [ ] Update main README with leaderboard info
- [ ] Document API endpoints
- [ ] Document component props and usage
- [ ] Add code examples
- [ ] Document rank system
- [ ] Add troubleshooting guide
- [ ] Update architecture diagrams

**Dependencies:** All implementation complete

**Estimated Time:** 3 hours

---

## Phase 8: Deployment & Monitoring

### Task 8.1: Deploy to Staging

**Description:** Deploy feature to staging environment

**Subtasks:**
- [ ] Create database table in staging
- [ ] Deploy API endpoints
- [ ] Deploy frontend changes
- [ ] Test in staging environment
- [ ] Verify database connections
- [ ] Test with staging data
- [ ] Fix any deployment issues

**Dependencies:** All implementation and testing complete

**Estimated Time:** 2 hours

---

### Task 8.2: Set Up Monitoring

**Description:** Add monitoring and analytics

**Subtasks:**
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Add performance monitoring
- [ ] Track leaderboard page views
- [ ] Track API response times
- [ ] Track rank distribution
- [ ] Set up alerts for errors
- [ ] Create monitoring dashboard

**Dependencies:** Task 8.1

**Estimated Time:** 3 hours

---

### Task 8.3: Deploy to Production

**Description:** Deploy feature to production

**Subtasks:**
- [ ] Create database table in production
- [ ] Deploy API endpoints
- [ ] Deploy frontend changes
- [ ] Verify deployment
- [ ] Test in production
- [ ] Monitor for errors
- [ ] Announce feature to users

**Dependencies:** Task 8.1, Task 8.2

**Estimated Time:** 2 hours

---

### Task 8.4: Post-Launch Monitoring

**Description:** Monitor feature performance after launch

**Subtasks:**
- [ ] Monitor error rates
- [ ] Monitor API performance
- [ ] Track user engagement
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Optimize based on metrics
- [ ] Plan future enhancements

**Dependencies:** Task 8.3

**Estimated Time:** Ongoing

---

## Summary

### Total Estimated Time: ~75 hours

### Task Breakdown by Phase:
- **Phase 1:** Database & Core Logic - 6 hours
- **Phase 2:** API Endpoints - 9 hours
- **Phase 3:** Frontend Components - 16 hours
- **Phase 4:** Integration & Automation - 4 hours
- **Phase 5:** Name Resolution - 7 hours
- **Phase 6:** Polish & Optimization - 11 hours
- **Phase 7:** Testing & Documentation - 17 hours
- **Phase 8:** Deployment & Monitoring - 7 hours

### Critical Path:
1. Task 1.1 → Task 1.2 → Task 1.3 (Database setup)
2. Task 2.1 → Task 4.1 → Task 4.2 (AI match integration)
3. Task 3.1 → Task 3.2 → Task 3.4 (Leaderboard UI)
4. Task 5.1 → Task 5.2 → Task 5.3 (Name resolution)
5. Phase 6 → Phase 7 → Phase 8 (Polish, test, deploy)

### Recommended Team Size:
- 1-2 developers for 2-3 weeks
- OR 3-4 developers for 1 week

### Priority Order:
1. **High Priority:** Phase 1-4 (Core functionality)
2. **Medium Priority:** Phase 5-6 (Polish & optimization)
3. **Low Priority:** Phase 7-8 (Testing & deployment)

## Notes

- Tasks can be parallelized where dependencies allow
- Some tasks may take longer depending on complexity
- Add buffer time for unexpected issues (20% recommended)
- Consider breaking large tasks into smaller subtasks
- Update estimates based on actual progress

