# AI Leaderboards Requirements

## Introduction

The AI Leaderboards feature provides a competitive ranking system for players who compete against the AI opponent. Players earn ranks based on their total wins, with rank names inspired by Tekken's progression system. This creates a sense of achievement and progression for single-player mode, encouraging players to improve and climb the ranks.

## Glossary

- **AI Match**: A single-player game where the user plays Rock Paper Scissors against an AI opponent
- **Win Count**: Total number of AI matches won by a player
- **Rank**: A title earned based on win count thresholds (e.g., Beginner, Warrior, Master)
- **Leaderboard**: A ranked list of all players sorted by wins and rank
- **Turso Database**: The database system used to store leaderboard data
- **AI Leaderboards Table**: Database table storing player addresses, win counts, and ranks

## Requirements

### Requirement 1: Leaderboard Navigation

**User Story**: As a player, I want to access the AI leaderboards from the navigation menu, so that I can see how I rank against other players.

#### Acceptance Criteria

1. WHEN a user clicks the "Leaderboards" navigation item THEN the system SHALL display the leaderboards page
2. WHEN the leaderboards page loads THEN the system SHALL display a "Single Player Ranks" option
3. WHEN a user clicks "Single Player Ranks" THEN the system SHALL navigate to the AI leaderboards view
4. WHEN no other leaderboard types are available THEN the system SHALL display only the Single Player Ranks option

### Requirement 2: Rank System Based on Wins

**User Story**: As a player, I want to earn ranks based on my AI match wins, so that I can see my progression and feel a sense of achievement.

#### Acceptance Criteria

1. WHEN a player has 0-4 wins THEN the system SHALL assign the rank "Beginner"
2. WHEN a player has 5-9 wins THEN the system SHALL assign the rank "Novice"
3. WHEN a player has 10-19 wins THEN the system SHALL assign the rank "Fighter"
4. WHEN a player has 20-29 wins THEN the system SHALL assign the rank "Warrior I"
5. WHEN a player has 30-39 wins THEN the system SHALL assign the rank "Warrior II"
6. WHEN a player has 40-49 wins THEN the system SHALL assign the rank "Warrior III"
7. WHEN a player has 50-59 wins THEN the system SHALL assign the rank "Expert I"
8. WHEN a player has 60-69 wins THEN the system SHALL assign the rank "Expert II"
9. WHEN a player has 70-79 wins THEN the system SHALL assign the rank "Expert III"
10. WHEN a player has 80-89 wins THEN the system SHALL assign the rank "Master I"
11. WHEN a player has 90-99 wins THEN the system SHALL assign the rank "Master II"
12. WHEN a player has 100-109 wins THEN the system SHALL assign the rank "Master III"
13. WHEN a player has 110-119 wins THEN the system SHALL assign the rank "Grandmaster I"
14. WHEN a player has 120-129 wins THEN the system SHALL assign the rank "Grandmaster II"
15. WHEN a player has 130-139 wins THEN the system SHALL assign the rank "Grandmaster III"
16. WHEN a player has 140-149 wins THEN the system SHALL assign the rank "Champion I"
17. WHEN a player has 150-159 wins THEN the system SHALL assign the rank "Champion II"
18. WHEN a player has 160-169 wins THEN the system SHALL assign the rank "Champion III"
19. WHEN a player has 170-179 wins THEN the system SHALL assign the rank "Legend I"
20. WHEN a player has 180-189 wins THEN the system SHALL assign the rank "Legend II"
21. WHEN a player has 190-199 wins THEN the system SHALL assign the rank "Legend III"
22. WHEN a player has 200-209 wins THEN the system SHALL assign the rank "Legend IV"
23. WHEN a player has 210-219 wins THEN the system SHALL assign the rank "Legend V"
24. WHEN a player has 220-239 wins THEN the system SHALL assign the rank "Mythic I"
25. WHEN a player has 240-259 wins THEN the system SHALL assign the rank "Mythic II"
26. WHEN a player has 260-279 wins THEN the system SHALL assign the rank "Mythic III"
27. WHEN a player has 280-299 wins THEN the system SHALL assign the rank "Mythic IV"
28. WHEN a player has 300-319 wins THEN the system SHALL assign the rank "Mythic V"
29. WHEN a player has 320-369 wins THEN the system SHALL assign the rank "RPS-God I"
30. WHEN a player has 370-419 wins THEN the system SHALL assign the rank "RPS-God II"
31. WHEN a player has 420-469 wins THEN the system SHALL assign the rank "RPS-God III"
32. WHEN a player has 470-519 wins THEN the system SHALL assign the rank "RPS-God IV"
33. WHEN a player has 520-569 wins THEN the system SHALL assign the rank "RPS-God V"
34. WHEN a player has 570-599 wins THEN the system SHALL assign the rank "RPS-God VI"
35. WHEN a player has 600-629 wins THEN the system SHALL assign the rank "RPS-God VII"
36. WHEN a player has 630-659 wins THEN the system SHALL assign the rank "RPS-God VIII"
37. WHEN a player has 660-689 wins THEN the system SHALL assign the rank "RPS-God IX"
38. WHEN a player has 690+ wins THEN the system SHALL assign the rank "RPS-God X"

### Requirement 3: Database Storage

**User Story**: As the system, I want to store player leaderboard data in Turso database, so that rankings persist across sessions and can be queried efficiently.

#### Acceptance Criteria

1. WHEN the system initializes THEN the system SHALL create an "ai_leaderboards" table if it does not exist
2. WHEN storing player data THEN the system SHALL include the player's wallet address as the primary key
3. WHEN storing player data THEN the system SHALL include the player's total AI wins
4. WHEN storing player data THEN the system SHALL include the player's current rank
5. WHEN storing player data THEN the system SHALL include the player's display name (ENS/Basename if available)
6. WHEN storing player data THEN the system SHALL include a timestamp of last update

### Requirement 4: Win Tracking and Updates

**User Story**: As a player, I want my AI match wins to be automatically tracked and my rank updated, so that I don't have to manually update my progress.

#### Acceptance Criteria

1. WHEN a player wins an AI match THEN the system SHALL increment their win count in the database
2. WHEN a player's win count changes THEN the system SHALL recalculate and update their rank
3. WHEN a player's rank changes THEN the system SHALL update the rank in the database
4. WHEN a player has no existing leaderboard entry THEN the system SHALL create a new entry with 1 win and "Beginner" rank
5. WHEN updating win count THEN the system SHALL use the player's wallet address as the unique identifier

### Requirement 5: Leaderboard Display

**User Story**: As a player, I want to see a ranked list of all players, so that I can compare my performance with others.

#### Acceptance Criteria

1. WHEN the leaderboard loads THEN the system SHALL display players sorted by win count in descending order
2. WHEN displaying each player THEN the system SHALL show their rank position (1st, 2nd, 3rd, etc.)
3. WHEN displaying each player THEN the system SHALL show their display name or truncated address
4. WHEN displaying each player THEN the system SHALL show their rank title (Beginner, Warrior, etc.)
5. WHEN displaying each player THEN the system SHALL show their total wins
6. WHEN the current user is in the leaderboard THEN the system SHALL highlight their entry
7. WHEN the leaderboard has more than 50 entries THEN the system SHALL implement pagination or infinite scroll

### Requirement 6: Rank Visualization

**User Story**: As a player, I want to see visual indicators of ranks, so that I can quickly understand the hierarchy and prestige of different ranks.

#### Acceptance Criteria

1. WHEN displaying a rank THEN the system SHALL use color coding to indicate rank tier
2. WHEN displaying lower ranks (Beginner, Novice, Fighter) THEN the system SHALL use gray or white colors
3. WHEN displaying Warrior ranks (I-III) THEN the system SHALL use blue colors
4. WHEN displaying Expert ranks (I-III) THEN the system SHALL use green colors
5. WHEN displaying Master ranks (I-III) THEN the system SHALL use darker green colors
6. WHEN displaying Grandmaster ranks (I-III) THEN the system SHALL use purple colors
7. WHEN displaying Champion ranks (I-III) THEN the system SHALL use gold colors
8. WHEN displaying Legend ranks (I-V) THEN the system SHALL use red colors
9. WHEN displaying Mythic ranks (I-V) THEN the system SHALL use rainbow gradient colors
10. WHEN displaying RPS-God ranks (I-X) THEN the system SHALL use cosmic/animated gradient colors
11. WHEN displaying a rank THEN the system SHALL show the rank name and level prominently

### Requirement 7: Home Page Stats Integration

**User Story**: As a player, I want to see my current rank on the home page stats section, so that I can track my progress at a glance.

#### Acceptance Criteria

1. WHEN a player views the home page THEN the system SHALL display their current AI rank in the stats section
2. WHEN a player views the home page THEN the system SHALL display their total AI wins in the rank card
3. WHEN a player views the home page THEN the system SHALL display wins needed for next rank
4. WHEN a player has not played any AI matches THEN the system SHALL display "Unranked" status
5. WHEN displaying the rank card THEN the system SHALL show it alongside other stat cards (Total Games, AI Wins, PvP Wins)
6. WHEN a player clicks the rank card THEN the system SHALL navigate to the full leaderboard page
7. WHEN displaying the rank card THEN the system SHALL show a glowing border in the color of the player's rank tier
8. WHEN the rank is Mythic or RPS-God THEN the system SHALL use an animated gradient glow effect

### Requirement 8: Real-time Updates

**User Story**: As a player, I want the leaderboard to update in real-time, so that I can see my new rank immediately after winning matches.

#### Acceptance Criteria

1. WHEN a player wins an AI match THEN the system SHALL update the database within 5 seconds
2. WHEN viewing the leaderboard THEN the system SHALL provide a refresh button to fetch latest data
3. WHEN a player's rank changes THEN the system SHALL display a notification or toast message
4. WHEN the leaderboard page is open THEN the system SHALL allow manual refresh of rankings

### Requirement 9: Name Resolution

**User Story**: As a player, I want to see recognizable names on the leaderboard, so that I can identify players I know.

#### Acceptance Criteria

1. WHEN displaying a player THEN the system SHALL attempt to resolve their ENS name
2. WHEN displaying a player THEN the system SHALL attempt to resolve their Basename
3. WHEN displaying a player THEN the system SHALL attempt to resolve their Farcaster username
4. WHEN no name is available THEN the system SHALL display a truncated wallet address
5. WHEN resolving names THEN the system SHALL cache results to improve performance

### Requirement 10: Empty State Handling

**User Story**: As a new user, I want to see helpful messaging when the leaderboard is empty, so that I understand how to participate.

#### Acceptance Criteria

1. WHEN the leaderboard has no entries THEN the system SHALL display an empty state message
2. WHEN displaying empty state THEN the system SHALL include a call-to-action to play AI matches
3. WHEN displaying empty state THEN the system SHALL explain how the ranking system works
4. WHEN a user is not on the leaderboard THEN the system SHALL show their potential starting rank

## Technical Considerations

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS ai_leaderboards (
  address TEXT PRIMARY KEY,
  wins INTEGER NOT NULL DEFAULT 0,
  rank TEXT NOT NULL,
  display_name TEXT,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wins ON ai_leaderboards(wins DESC);
CREATE INDEX IF NOT EXISTS idx_rank ON ai_leaderboards(rank);
```

### Rank Thresholds

```typescript
const RANK_THRESHOLDS = [
  { name: "Beginner", minWins: 0, maxWins: 4, color: "gray" },
  { name: "Novice", minWins: 5, maxWins: 9, color: "gray" },
  { name: "Fighter", minWins: 10, maxWins: 19, color: "blue" },
  { name: "Warrior I", minWins: 20, maxWins: 29, color: "blue" },
  { name: "Warrior II", minWins: 30, maxWins: 39, color: "blue" },
  { name: "Warrior III", minWins: 40, maxWins: 49, color: "blue" },
  { name: "Expert I", minWins: 50, maxWins: 59, color: "green" },
  { name: "Expert II", minWins: 60, maxWins: 69, color: "green" },
  { name: "Expert III", minWins: 70, maxWins: 79, color: "green" },
  { name: "Master I", minWins: 80, maxWins: 89, color: "green" },
  { name: "Master II", minWins: 90, maxWins: 99, color: "green" },
  { name: "Master III", minWins: 100, maxWins: 109, color: "green" },
  { name: "Grandmaster I", minWins: 110, maxWins: 119, color: "purple" },
  { name: "Grandmaster II", minWins: 120, maxWins: 129, color: "purple" },
  { name: "Grandmaster III", minWins: 130, maxWins: 139, color: "purple" },
  { name: "Champion I", minWins: 140, maxWins: 149, color: "gold" },
  { name: "Champion II", minWins: 150, maxWins: 159, color: "gold" },
  { name: "Champion III", minWins: 160, maxWins: 169, color: "gold" },
  { name: "Legend I", minWins: 170, maxWins: 179, color: "red" },
  { name: "Legend II", minWins: 180, maxWins: 189, color: "red" },
  { name: "Legend III", minWins: 190, maxWins: 199, color: "red" },
  { name: "Legend IV", minWins: 200, maxWins: 209, color: "red" },
  { name: "Legend V", minWins: 210, maxWins: 219, color: "red" },
  { name: "Mythic I", minWins: 220, maxWins: 239, color: "rainbow" },
  { name: "Mythic II", minWins: 240, maxWins: 259, color: "rainbow" },
  { name: "Mythic III", minWins: 260, maxWins: 279, color: "rainbow" },
  { name: "Mythic IV", minWins: 280, maxWins: 299, color: "rainbow" },
  { name: "Mythic V", minWins: 300, maxWins: 319, color: "rainbow" },
  { name: "RPS-God I", minWins: 320, maxWins: 369, color: "cosmic" },
  { name: "RPS-God II", minWins: 370, maxWins: 419, color: "cosmic" },
  { name: "RPS-God III", minWins: 420, maxWins: 469, color: "cosmic" },
  { name: "RPS-God IV", minWins: 470, maxWins: 519, color: "cosmic" },
  { name: "RPS-God V", minWins: 520, maxWins: 569, color: "cosmic" },
  { name: "RPS-God VI", minWins: 570, maxWins: 599, color: "cosmic" },
  { name: "RPS-God VII", minWins: 600, maxWins: 629, color: "cosmic" },
  { name: "RPS-God VIII", minWins: 630, maxWins: 659, color: "cosmic" },
  { name: "RPS-God IX", minWins: 660, maxWins: 689, color: "cosmic" },
  { name: "RPS-God X", minWins: 690, maxWins: null, color: "cosmic" },
];
```

### API Endpoints

- `POST /api/leaderboard/ai/update` - Update player wins after AI match
- `GET /api/leaderboard/ai` - Fetch AI leaderboard rankings
- `GET /api/leaderboard/ai/player?address={address}` - Get specific player's rank

## Success Metrics

1. **Engagement**: % of AI players who check the leaderboard
2. **Retention**: Do ranked players play more AI matches?
3. **Progression**: Average time to reach each rank tier
4. **Competition**: % of players who return after seeing their rank
5. **Social**: Do players share their ranks?

## Future Enhancements (Out of Scope)

1. Multiplayer leaderboards (separate ranking system)
2. Weekly/Monthly leaderboards (time-based rankings)
3. Rank decay (lose rank if inactive)
4. Rank badges/icons (visual flair)
5. Rank-based rewards (tokens, NFTs)
6. Regional leaderboards (by location)
7. Friend leaderboards (compare with connections)
8. Rank history (track progression over time)
9. Achievement system (special milestones)
10. Rank challenges (compete for specific ranks)

## Notes

- Inspired by Tekken's ranking system for familiarity and proven engagement
- Focus on AI matches first to validate the system before expanding
- 38 total ranks with sub-levels create engaging long-term progression
- RPS-God tier (320-690+ wins) provides aspirational goal for dedicated players
- Sub-ranks (I, II, III, etc.) give frequent sense of achievement
- Reaching RPS-God X (690+ wins) is the ultimate achievement
- Consider adding rank icons/badges in Phase 2
- Monitor for rank inflation and adjust thresholds if needed
- Sub-ranks make progression feel more rewarding and less grindy
