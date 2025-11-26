# Requirements Document

## Introduction

This document outlines the requirements for a Random Matchmaking system for the RPS (Rock Paper Scissors) game. The system will allow users to be automatically paired with random opponents for competitive Best-of-5 match series, separate from the existing room-based multiplayer system.

## Glossary

- **Matchmaking System**: The automated system that pairs players together for competitive matches
- **Match Series**: A Best-of-5 competition between two players (first to win 3 rounds wins)
- **Matchmaking Queue**: A waiting list of players seeking opponents on a specific blockchain network
- **Round**: A single game of rock-paper-scissors within a match series
- **Network**: The blockchain network (Celo or Base) on which the game contract is deployed
- **MiniPay**: Opera's mobile wallet that only supports Celo network
- **Base App**: Applications running within the Base ecosystem that only support Base network
- **Consent Transaction**: An on-chain transaction that a user signs to enter a match series
- **RPSBestOfFive Contract**: The new smart contract that handles multi-round match series
- **RPSGame Contract**: The existing smart contract that handles single-game room-based matches

## Requirements

### Requirement 1

**User Story:** As a player, I want to find a random opponent quickly, so that I can play competitive matches without browsing through room lists.

#### Acceptance Criteria

1. WHEN a user clicks the "Find Match" button THEN the Matchmaking System SHALL add the user to the Matchmaking Queue for their current Network
2. WHEN a user is in the Matchmaking Queue THEN the Matchmaking System SHALL display a "Searching for opponent..." status with a cancel option
3. WHEN two users are in the same Network's Matchmaking Queue THEN the Matchmaking System SHALL pair them together within 5 seconds
4. WHEN a user clicks "Cancel Search" THEN the Matchmaking System SHALL remove the user from the Matchmaking Queue immediately
5. WHEN a match is found THEN the Matchmaking System SHALL notify both players and display opponent information

### Requirement 2

**User Story:** As a player, I want to play a Best-of-5 series with minimal transaction signatures, so that I have a smooth gaming experience without constant wallet interruptions.

#### Acceptance Criteria

1. WHEN two players are paired THEN the Matchmaking System SHALL prompt both players to sign a Consent Transaction to enter the Match Series
2. WHEN both players sign the Consent Transaction within 30 seconds THEN the RPSBestOfFive Contract SHALL create a new Match Series
3. WHEN a Match Series is created THEN the Matchmaking System SHALL allow players to play up to 5 Rounds without additional signatures
4. WHEN a player wins 3 Rounds THEN the Matchmaking System SHALL declare that player the winner and end the Match Series
5. WHEN all 5 Rounds are played THEN the Matchmaking System SHALL determine the winner based on who won more Rounds

### Requirement 3

**User Story:** As a player, I want to play multiple rounds in a series, so that I can have a more competitive and engaging experience than single games.

#### Acceptance Criteria

1. WHEN a Match Series begins THEN the Matchmaking System SHALL start Round 1 automatically
2. WHEN a Round ends THEN the Matchmaking System SHALL display the Round result and automatically start the next Round
3. WHEN each Round starts THEN the Matchmaking System SHALL allow both players to select their move (rock, paper, or scissors)
4. WHEN both players submit their moves THEN the Matchmaking System SHALL reveal both moves simultaneously and determine the Round winner
5. WHEN a Round ends THEN the Matchmaking System SHALL update the series score display showing wins for each player

### Requirement 4

**User Story:** As a player, I want to publish the final match result on-chain, so that my victories are permanently recorded and I can earn Divvi referral rewards.

#### Acceptance Criteria

1. WHEN a Match Series ends THEN the Matchmaking System SHALL display a "Publish Result" button to both players
2. WHEN either player clicks "Publish Result" THEN the Matchmaking System SHALL prompt that player to sign a publish transaction
3. WHEN the publish transaction is signed THEN the RPSBestOfFive Contract SHALL record the complete Match Series result on-chain
4. WHEN the Match Series result is published THEN the Matchmaking System SHALL submit the transaction to Divvi for referral tracking
5. WHEN the result is published THEN the Matchmaking System SHALL display the final series outcome to both players

### Requirement 5

**User Story:** As a player, I want to play again with the same opponent or find a new one, so that I can continue playing without returning to the main menu.

#### Acceptance Criteria

1. WHEN a Match Series ends THEN the Matchmaking System SHALL display two options: "Rematch" and "Find New Match"
2. WHEN a player clicks "Rematch" THEN the Matchmaking System SHALL wait for the opponent's decision for 30 seconds
3. WHEN both players click "Rematch" within 30 seconds THEN the Matchmaking System SHALL start a new Match Series with roles swapped
4. WHEN a player clicks "Find New Match" THEN the Matchmaking System SHALL return that player to the Matchmaking Queue
5. WHEN the rematch timeout expires without both players accepting THEN the Matchmaking System SHALL return both players to the Matchmaking Queue

### Requirement 6

**User Story:** As a player on MiniPay or Base App, I want matchmaking to work seamlessly on my restricted network, so that I don't encounter network compatibility issues.

#### Acceptance Criteria

1. WHEN a user accesses the game from MiniPay THEN the Matchmaking System SHALL only show Celo Network matchmaking options
2. WHEN a user accesses the game from Base App THEN the Matchmaking System SHALL only show Base Network matchmaking options
3. WHEN a user accesses the game from web or Farcaster THEN the Matchmaking System SHALL allow the user to choose between Celo and Base Networks
4. WHEN a user is in a Matchmaking Queue THEN the Matchmaking System SHALL only pair them with users on the same Network
5. WHEN a user switches Networks on web or Farcaster THEN the Matchmaking System SHALL remove them from the previous Network's queue and update the UI

### Requirement 7

**User Story:** As a player, I want to see how many other players are waiting for matches, so that I can decide whether to wait or play a different mode.

#### Acceptance Criteria

1. WHEN a user views the matchmaking card THEN the Matchmaking System SHALL display the current number of players in the queue for each available Network
2. WHEN the queue count changes THEN the Matchmaking System SHALL update the displayed count within 5 seconds
3. WHEN a user is on MiniPay THEN the Matchmaking System SHALL display only the Celo queue count
4. WHEN a user is on Base App THEN the Matchmaking System SHALL display only the Base queue count
5. WHEN a user is on web or Farcaster THEN the Matchmaking System SHALL display queue counts for both Networks

### Requirement 8

**User Story:** As a player, I want the matchmaking feature to be easily accessible alongside existing multiplayer options, so that I can choose my preferred play style.

#### Acceptance Criteria

1. WHEN a user navigates to the multiplayer page THEN the Matchmaking System SHALL display a Random Matchmaking card alongside existing room cards
2. WHEN the Random Matchmaking card is displayed THEN the Matchmaking System SHALL position it as the last item in the room grid
3. WHEN a user views the Random Matchmaking card THEN the Matchmaking System SHALL clearly indicate it is for Best-of-5 matches
4. WHEN a user views the multiplayer page THEN the Matchmaking System SHALL not modify or interfere with existing room-based functionality
5. WHEN a user is in a Match Series THEN the Matchmaking System SHALL navigate them to a dedicated match page separate from room-based games

### Requirement 9

**User Story:** As a developer, I want the new matchmaking system to use a separate smart contract, so that existing room-based games remain unaffected.

#### Acceptance Criteria

1. WHEN the Matchmaking System is deployed THEN the RPSBestOfFive Contract SHALL be deployed separately from the RPSGame Contract
2. WHEN a user plays a matchmaking game THEN the Matchmaking System SHALL interact only with the RPSBestOfFive Contract
3. WHEN a user plays a room-based game THEN the Matchmaking System SHALL interact only with the RPSGame Contract
4. WHEN the RPSBestOfFive Contract is deployed THEN the Matchmaking System SHALL deploy it to both Celo and Base Networks
5. WHEN either contract is called THEN the Matchmaking System SHALL ensure no cross-dependencies exist between the two contracts

### Requirement 10

**User Story:** As a player, I want my matchmaking games to generate Divvi referral rewards, so that I can earn rewards for my gameplay activity.

#### Acceptance Criteria

1. WHEN a player signs the Consent Transaction THEN the Matchmaking System SHALL include a Divvi referral tag in the transaction data
2. WHEN a player publishes a Match Series result THEN the Matchmaking System SHALL include a Divvi referral tag in the transaction data
3. WHEN a transaction with a Divvi referral tag is completed THEN the Matchmaking System SHALL call submitReferral to register it with Divvi
4. WHEN submitReferral is called THEN the Matchmaking System SHALL include the transaction hash and Network chain ID
5. WHEN Divvi referral submission fails THEN the Matchmaking System SHALL log the error but not prevent the game from continuing

### Requirement 11

**User Story:** As a player, I want to be notified if my opponent abandons the match, so that I'm not left waiting indefinitely.

#### Acceptance Criteria

1. WHEN a match is found and one player does not sign the Consent Transaction within 30 seconds THEN the Matchmaking System SHALL cancel the match and return both players to the queue
2. WHEN a player disconnects during a Match Series THEN the Matchmaking System SHALL wait 60 seconds for reconnection
3. WHEN a disconnected player does not reconnect within 60 seconds THEN the Matchmaking System SHALL declare the remaining player the winner by forfeit
4. WHEN a player is declared winner by forfeit THEN the Matchmaking System SHALL allow them to publish the result
5. WHEN a match is cancelled due to timeout THEN the Matchmaking System SHALL display a notification explaining why the match was cancelled

### Requirement 12

**User Story:** As a player, I want to track my matchmaking statistics, so that I can see my competitive performance and progress over time.

#### Acceptance Criteria

1. WHEN a Match Series is published on-chain THEN the Matchmaking System SHALL record the series result in the player statistics database
2. WHEN a user views the home page stats section THEN the Matchmaking System SHALL display matchmaking statistics alongside existing game statistics
3. WHEN a user views the home page stats section THEN the Matchmaking System SHALL display their total matchmaking wins, losses, and win rate
4. WHEN a user views the home page stats section THEN the Matchmaking System SHALL display their current win streak and best win streak for matchmaking
5. WHEN a user views the home page stats section THEN the Matchmaking System SHALL display matchmaking statistics separately for each Network (Celo and Base)
6. WHEN a user on MiniPay views the matchmaking card THEN the Matchmaking System SHALL display only their Celo Network statistics
7. WHEN a user on Base App views the matchmaking card THEN the Matchmaking System SHALL display only their Base Network statistics
8. WHEN a user on web or Farcaster views the matchmaking card THEN the Matchmaking System SHALL display statistics for both Celo and Base Networks in separate sections
