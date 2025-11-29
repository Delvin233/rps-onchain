# Requirements Document

## Introduction

This document outlines the requirements for a Random Matchmaking system for the RPS (Rock Paper Scissors) game. The system will allow users to be automatically paired with random opponents for competitive Best-of-5 match series, separate from the existing room-based multiplayer system.

**Key Design Decision:** The matchmaking lobby is network-agnostic. Users can enter the lobby from any network (Celo or Base) by signing a message. Matches are played entirely off-chain. Only the winner can publish the final result on-chain to their network of choice, creating incentive to win and preventing duplicate records.

## Glossary

- **Matchmaking System**: The automated system that pairs players together for competitive matches
- **Match Series**: A Best-of-5 competition between two players (first to win 3 rounds wins)
- **Matchmaking Lobby**: A network-agnostic waiting area where players from any network can be paired together
- **Round**: A single game of rock-paper-scissors within a match series
- **Network**: The blockchain network (Celo or Base) on which results can be published
- **MiniPay**: Opera's mobile wallet that only supports Celo network
- **Base App**: Applications running within the Base ecosystem that only support Base network
- **Lobby Entry Signature**: An off-chain signature that authenticates a user entering the matchmaking lobby
- **Publish Transaction**: An on-chain transaction that the winner signs to record the match result
- **RPSBestOfFive Contract**: The new smart contract that handles multi-round match series result publishing
- **RPSGame Contract**: The existing smart contract that handles single-game room-based matches

## Requirements

### Requirement 1

**User Story:** As a player, I want to find a random opponent quickly regardless of which network I'm on, so that I can play competitive matches without browsing through room lists or worrying about network compatibility.

#### Acceptance Criteria

1. WHEN a user clicks the "Find Match" button THEN the Matchmaking System SHALL prompt the user to sign a Lobby Entry Signature
2. WHEN a user signs the Lobby Entry Signature THEN the Matchmaking System SHALL add the user to the global Matchmaking Lobby
3. WHEN a user is in the Matchmaking Lobby THEN the Matchmaking System SHALL display a "Searching for opponent..." status with a cancel option
4. WHEN two or more users are in the Matchmaking Lobby THEN the Matchmaking System SHALL pair them together within 5 seconds
5. WHEN a user clicks "Cancel Search" THEN the Matchmaking System SHALL remove the user from the Matchmaking Lobby immediately
6. WHEN a match is found THEN the Matchmaking System SHALL notify both players and display opponent information

### Requirement 2

**User Story:** As a player, I want to play a Best-of-5 series entirely off-chain with no transaction signatures during gameplay, so that I have a smooth gaming experience without wallet interruptions.

#### Acceptance Criteria

1. WHEN two players are paired THEN the Matchmaking System SHALL immediately start the Match Series without requiring any on-chain transactions
2. WHEN a Match Series starts THEN the Matchmaking System SHALL allow players to play up to 5 Rounds without any wallet signatures
3. WHEN a player wins 3 Rounds THEN the Matchmaking System SHALL declare that player the winner and end the Match Series
4. WHEN all 5 Rounds are played THEN the Matchmaking System SHALL determine the winner based on who won more Rounds
5. WHEN a Match Series ends THEN only the winner SHALL be able to publish the result on-chain

### Requirement 3

**User Story:** As a player, I want to play multiple rounds in a series, so that I can have a more competitive and engaging experience than single games.

#### Acceptance Criteria

1. WHEN a Match Series begins THEN the Matchmaking System SHALL start Round 1 automatically
2. WHEN a Round ends THEN the Matchmaking System SHALL display the Round result and automatically start the next Round
3. WHEN each Round starts THEN the Matchmaking System SHALL allow both players to select their move (rock, paper, or scissors)
4. WHEN both players submit their moves THEN the Matchmaking System SHALL reveal both moves simultaneously and determine the Round winner
5. WHEN a Round ends THEN the Matchmaking System SHALL update the series score display showing wins for each player

### Requirement 4

**User Story:** As a winner, I want to publish the final match result on-chain to my preferred network, so that my victory is permanently recorded and I can earn Divvi referral rewards.

#### Acceptance Criteria

1. WHEN a Match Series ends THEN the Matchmaking System SHALL display a "Publish Result" button only to the winner
2. WHEN the winner clicks "Publish Result" THEN the Matchmaking System SHALL allow them to choose which network (Celo or Base) to publish on
3. WHEN the winner selects a network THEN the Matchmaking System SHALL prompt them to switch to that network if not already connected
4. WHEN the winner signs the Publish Transaction THEN the RPSBestOfFive Contract SHALL record the complete Match Series result on-chain
5. WHEN the Match Series result is published THEN the Matchmaking System SHALL submit the transaction to Divvi for referral tracking
6. WHEN the result is published THEN the Matchmaking System SHALL display the final series outcome to both players

### Requirement 5

**User Story:** As a player, I want to play again with the same opponent or find a new one, so that I can continue playing without returning to the main menu.

#### Acceptance Criteria

1. WHEN a Match Series ends THEN the Matchmaking System SHALL display two options: "Rematch" and "Find New Match"
2. WHEN a player clicks "Rematch" THEN the Matchmaking System SHALL wait for the opponent's decision for 30 seconds
3. WHEN both players click "Rematch" within 30 seconds THEN the Matchmaking System SHALL start a new Match Series immediately
4. WHEN a player clicks "Find New Match" THEN the Matchmaking System SHALL return that player to the Matchmaking Lobby
5. WHEN the rematch timeout expires without both players accepting THEN the Matchmaking System SHALL return both players to the Matchmaking Lobby

### Requirement 6

**User Story:** As a player on MiniPay or Base App, I want to play against anyone regardless of their network, so that I have access to the full player pool and faster matchmaking.

#### Acceptance Criteria

1. WHEN a user accesses the game from MiniPay THEN the Matchmaking System SHALL allow them to enter the global Matchmaking Lobby
2. WHEN a user accesses the game from Base App THEN the Matchmaking System SHALL allow them to enter the global Matchmaking Lobby
3. WHEN a user accesses the game from web or Farcaster THEN the Matchmaking System SHALL allow them to enter the global Matchmaking Lobby
4. WHEN users from different networks are in the Matchmaking Lobby THEN the Matchmaking System SHALL pair them together without network restrictions
5. WHEN a MiniPay user wins a match THEN the Matchmaking System SHALL only allow them to publish on Celo (their only supported network)
6. WHEN a Base App user wins a match THEN the Matchmaking System SHALL only allow them to publish on Base (their only supported network)
7. WHEN a web or Farcaster user wins a match THEN the Matchmaking System SHALL allow them to choose between Celo and Base for publishing

### Requirement 7

**User Story:** As a player, I want to see how many other players are waiting for matches, so that I can decide whether to wait or play a different mode.

#### Acceptance Criteria

1. WHEN a user views the matchmaking card THEN the Matchmaking System SHALL display the current number of players in the global Matchmaking Lobby
2. WHEN the lobby count changes THEN the Matchmaking System SHALL update the displayed count within 5 seconds
3. WHEN a user is on any platform (MiniPay, Base App, web, or Farcaster) THEN the Matchmaking System SHALL display the same global lobby count
4. WHEN the lobby count is displayed THEN the Matchmaking System SHALL show players from all networks combined

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

**User Story:** As a winner, I want my matchmaking victory to generate Divvi referral rewards, so that I can earn rewards for my competitive gameplay.

#### Acceptance Criteria

1. WHEN a winner publishes a Match Series result THEN the Matchmaking System SHALL include a Divvi referral tag in the Publish Transaction data
2. WHEN the Publish Transaction with a Divvi referral tag is completed THEN the Matchmaking System SHALL call submitReferral to register it with Divvi
3. WHEN submitReferral is called THEN the Matchmaking System SHALL include the transaction hash and the Network chain ID
4. WHEN Divvi referral submission fails THEN the Matchmaking System SHALL log the error but not prevent the game from continuing
5. WHEN a loser does not publish THEN the Matchmaking System SHALL not generate any Divvi referral for that match

### Requirement 11

**User Story:** As a player, I want to be notified if my opponent abandons the match, so that I'm not left waiting indefinitely.

#### Acceptance Criteria

1. WHEN a match is found and one player does not accept within 15 seconds THEN the Matchmaking System SHALL cancel the match and return both players to the lobby
2. WHEN a player disconnects during a Match Series THEN the Matchmaking System SHALL wait 60 seconds for reconnection
3. WHEN a disconnected player does not reconnect within 60 seconds THEN the Matchmaking System SHALL declare the remaining player the winner by forfeit
4. WHEN a player is declared winner by forfeit THEN the Matchmaking System SHALL allow them to publish the result
5. WHEN a match is cancelled due to timeout THEN the Matchmaking System SHALL display a notification explaining why the match was cancelled

### Requirement 12

**User Story:** As a player, I want to track my matchmaking statistics, so that I can see my competitive performance and progress over time.

#### Acceptance Criteria

1. WHEN a Match Series is published on-chain THEN the Matchmaking System SHALL record the series result in the player statistics database
2. WHEN a user views the home page stats section THEN the Matchmaking System SHALL display global matchmaking statistics alongside existing game statistics
3. WHEN a user views the home page stats section THEN the Matchmaking System SHALL display their total matchmaking wins, losses, and win rate across all networks
4. WHEN a user views the home page stats section THEN the Matchmaking System SHALL display their current win streak and best win streak for matchmaking
5. WHEN a user views detailed stats THEN the Matchmaking System SHALL optionally show a breakdown of wins/losses per network (Celo vs Base)
6. WHEN a user on any platform views the matchmaking card THEN the Matchmaking System SHALL display their global matchmaking statistics
