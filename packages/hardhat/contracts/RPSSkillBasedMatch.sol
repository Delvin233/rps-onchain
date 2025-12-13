// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RPSSkillBasedMatch
 * @dev Rock Paper Scissors with ELO-based skill matching and adaptive difficulty
 * Uses sophisticated ranking system and machine learning-inspired matchmaking
 */
contract RPSSkillBasedMatch {
    enum Move { None, Rock, Paper, Scissors }
    enum SkillTier { Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster }
    
    struct Game {
        address player1;
        address player2;
        Move player1Move;
        Move player2Move;
        address winner;
        uint256 createdAt;
        uint256 eloStake;
        SkillTier requiredTier;
        bool isRanked;
        bool isFinished;
        uint256 skillSeed;
    }
    
    struct PlayerRating {
        uint256 elo;
        SkillTier tier;
        uint256 totalGames;
        uint256 wins;
        uint256 winStreak;
        uint256 longestWinStreak;
        uint256 lastGameTime;
        uint256 seasonWins;
        uint256 seasonGames;
        bool isCalibrated; // After 10 placement games
    }
    
    struct MatchmakingPool {
        address[] players;
        uint256 minElo;
        uint256 maxElo;
        uint256 createdAt;
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => PlayerRating) public playerRatings;
    mapping(address => uint256) public playerActiveGame;
    mapping(SkillTier => MatchmakingPool) public skillPools;
    mapping(address => uint256) public placementGamesRemaining;
    
    uint256 public gameCounter;
    uint256 public constant INITIAL_ELO = 1200;
    uint256 public constant K_FACTOR = 32;
    uint256 public constant PLACEMENT_GAMES = 10;
    uint256 public constant SEASON_LENGTH = 30 days;
    uint256 public seasonStartTime;
    
    event GameCreated(uint256 indexed gameId, address indexed player1, SkillTier tier, uint256 eloStake);
    event PlayersMatched(uint256 indexed gameId, address indexed player1, address indexed player2, uint256 eloDiff);
    event EloUpdated(address indexed player, uint256 oldElo, uint256 newElo, SkillTier oldTier, SkillTier newTier);
    event SkillTierPromoted(address indexed player, SkillTier newTier);
    event PlacementGameCompleted(address indexed player, uint256 gamesRemaining);
    event SeasonReset(uint256 newSeasonStart);
    
    constructor() {
        seasonStartTime = block.timestamp;
    }
    
    /**
     * @dev Generate skill-based randomness
     */
    function generateSkillSeed(address player1, address player2) private view returns (uint256) {
        PlayerRating storage rating1 = playerRatings[player1];
        PlayerRating storage rating2 = playerRatings[player2];
        
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            rating1.elo,
            rating2.elo,
            rating1.winStreak,
            rating2.winStreak,
            block.number
        )));
    }
    
    /**
     * @dev Initialize player rating
     */
    function initializePlayer() external {
        require(playerRatings[msg.sender].elo == 0, "Player already initialized");
        
        playerRatings[msg.sender] = PlayerRating({
            elo: INITIAL_ELO,
            tier: SkillTier.Bronze,
            totalGames: 0,
            wins: 0,
            winStreak: 0,
            longestWinStreak: 0,
            lastGameTime: 0,
            seasonWins: 0,
            seasonGames: 0,
            isCalibrated: false
        });
        
        placementGamesRemaining[msg.sender] = PLACEMENT_GAMES;
    }
    
    /**
     * @dev Create ranked game with skill-based matchmaking
     */
    function createRankedGame() external {
        require(playerActiveGame[msg.sender] == 0, "Already in active game");
        require(playerRatings[msg.sender].elo > 0, "Player not initialized");
        
        PlayerRating storage rating = playerRatings[msg.sender];
        SkillTier tier = rating.tier;
        
        gameCounter++;
        uint256 eloStake = _calculateEloStake(rating.elo);
        
        games[gameCounter] = Game({
            player1: msg.sender,
            player2: address(0),
            player1Move: Move.None,
            player2Move: Move.None,
            winner: address(0),
            createdAt: block.timestamp,
            eloStake: eloStake,
            requiredTier: tier,
            isRanked: true,
            isFinished: false,
            skillSeed: 0
        });
        
        playerActiveGame[msg.sender] = gameCounter;
        
        // Add to skill pool
        _addToSkillPool(msg.sender, tier);
        
        emit GameCreated(gameCounter, msg.sender, tier, eloStake);
        
        // Attempt immediate matching
        _attemptSkillMatch(gameCounter);
    }
    
    /**
     * @dev Create casual game (no ELO changes)
     */
    function createCasualGame() external {
        require(playerActiveGame[msg.sender] == 0, "Already in active game");
        
        gameCounter++;
        
        games[gameCounter] = Game({
            player1: msg.sender,
            player2: address(0),
            player1Move: Move.None,
            player2Move: Move.None,
            winner: address(0),
            createdAt: block.timestamp,
            eloStake: 0,
            requiredTier: SkillTier.Bronze,
            isRanked: false,
            isFinished: false,
            skillSeed: 0
        });
        
        playerActiveGame[msg.sender] = gameCounter;
        
        emit GameCreated(gameCounter, msg.sender, SkillTier.Bronze, 0);
    }
    
    /**
     * @dev Calculate ELO stake based on rating
     */
    function _calculateEloStake(uint256 elo) private pure returns (uint256) {
        if (elo < 1000) return 40; // High stakes for low ELO
        if (elo < 1400) return 32;
        if (elo < 1800) return 24;
        if (elo < 2200) return 16;
        return 12; // Lower stakes for high ELO
    }
    
    /**
     * @dev Add player to appropriate skill pool
     */
    function _addToSkillPool(address player, SkillTier tier) private {
        MatchmakingPool storage pool = skillPools[tier];
        pool.players.push(player);
        
        PlayerRating storage rating = playerRatings[player];
        if (pool.minElo == 0 || rating.elo < pool.minElo) {
            pool.minElo = rating.elo;
        }
        if (rating.elo > pool.maxElo) {
            pool.maxElo = rating.elo;
        }
        
        if (pool.createdAt == 0) {
            pool.createdAt = block.timestamp;
        }
    }
    
    /**
     * @dev Attempt skill-based matching
     */
    function _attemptSkillMatch(uint256 gameId) private {
        Game storage game = games[gameId];
        PlayerRating storage player1Rating = playerRatings[game.player1];
        
        address bestMatch = address(0);
        uint256 bestScore = 0;
        
        // First, try same tier
        bestMatch = _findMatchInTier(game.player1, game.requiredTier);
        
        // If no match in same tier, expand search
        if (bestMatch == address(0)) {
            bestMatch = _findMatchInAdjacentTiers(game.player1, game.requiredTier);
        }
        
        if (bestMatch != address(0)) {
            uint256 opponentGameId = playerActiveGame[bestMatch];
            _matchPlayers(gameId, opponentGameId);
        }
    }
    
    /**
     * @dev Find match within same skill tier
     */
    function _findMatchInTier(address player, SkillTier tier) private view returns (address) {
        MatchmakingPool storage pool = skillPools[tier];
        PlayerRating storage playerRating = playerRatings[player];
        
        address bestMatch = address(0);
        uint256 bestScore = 0;
        
        for (uint256 i = 0; i < pool.players.length; i++) {
            address candidate = pool.players[i];
            if (candidate != player && playerActiveGame[candidate] != 0) {
                Game storage candidateGame = games[playerActiveGame[candidate]];
                if (candidateGame.player2 == address(0) && candidateGame.isRanked) {
                    uint256 matchScore = _calculateSkillMatchScore(player, candidate);
                    if (matchScore > bestScore) {
                        bestScore = matchScore;
                        bestMatch = candidate;
                    }
                }
            }
        }
        
        return bestMatch;
    }
    
    /**
     * @dev Find match in adjacent tiers (tier expansion)
     */
    function _findMatchInAdjacentTiers(address player, SkillTier tier) private view returns (address) {
        // Check lower tier
        if (tier > SkillTier.Bronze) {
            SkillTier lowerTier = SkillTier(uint256(tier) - 1);
            address matchedPlayer = _findMatchInTier(player, lowerTier);
            if (matchedPlayer != address(0)) return matchedPlayer;
        }
        
        // Check higher tier
        if (tier < SkillTier.Grandmaster) {
            SkillTier higherTier = SkillTier(uint256(tier) + 1);
            address matchedPlayer = _findMatchInTier(player, higherTier);
            if (matchedPlayer != address(0)) return matchedPlayer;
        }
        
        return address(0);
    }
    
    /**
     * @dev Calculate skill-based match score
     */
    function _calculateSkillMatchScore(address player1, address player2) private view returns (uint256) {
        PlayerRating storage rating1 = playerRatings[player1];
        PlayerRating storage rating2 = playerRatings[player2];
        
        uint256 score = 100;
        
        // ELO difference (closer = better)
        uint256 eloDiff = rating1.elo > rating2.elo ? 
            rating1.elo - rating2.elo : rating2.elo - rating1.elo;
        score += (200 - (eloDiff / 10)); // Max 200 bonus for identical ELO
        
        // Experience matching (similar game counts)
        uint256 gameDiff = rating1.totalGames > rating2.totalGames ?
            rating1.totalGames - rating2.totalGames : rating2.totalGames - rating1.totalGames;
        score += (50 - (gameDiff / 5)); // Experience similarity bonus
        
        // Win streak consideration (avoid streak sniping)
        if (rating1.winStreak > 5 && rating2.winStreak > 5) {
            score += 30; // Both on streaks
        } else if (rating1.winStreak == 0 && rating2.winStreak == 0) {
            score += 20; // Both struggling
        }
        
        // Calibration matching (placement players vs placement players)
        if (!rating1.isCalibrated && !rating2.isCalibrated) {
            score += 40; // Both in placement
        } else if (rating1.isCalibrated && rating2.isCalibrated) {
            score += 20; // Both calibrated
        }
        
        return score;
    }
    
    /**
     * @dev Match two players together
     */
    function _matchPlayers(uint256 gameId1, uint256 gameId2) private {
        Game storage game1 = games[gameId1];
        Game storage game2 = games[gameId2];
        
        // Merge games
        game1.player2 = game2.player1;
        game1.skillSeed = generateSkillSeed(game1.player1, game1.player2);
        
        // Clear second game
        playerActiveGame[game2.player1] = gameId1;
        delete games[gameId2];
        
        PlayerRating storage rating1 = playerRatings[game1.player1];
        PlayerRating storage rating2 = playerRatings[game1.player2];
        uint256 eloDiff = rating1.elo > rating2.elo ? 
            rating1.elo - rating2.elo : rating2.elo - rating1.elo;
        
        emit PlayersMatched(gameId1, game1.player1, game1.player2, eloDiff);
    }
    
    /**
     * @dev Submit move
     */
    function submitMove(uint256 gameId, Move move) external {
        Game storage game = games[gameId];
        require(game.player1 == msg.sender || game.player2 == msg.sender, "Not a player");
        require(!game.isFinished, "Game already finished");
        require(move != Move.None, "Invalid move");
        
        if (game.player1 == msg.sender) {
            require(game.player1Move == Move.None, "Already moved");
            game.player1Move = move;
        } else {
            require(game.player2Move == Move.None, "Already moved");
            game.player2Move = move;
        }
        
        // Check if both players moved
        if (game.player1Move != Move.None && game.player2Move != Move.None) {
            _finishGame(gameId);
        }
    }
    
    /**
     * @dev Finish game and update ELO ratings
     */
    function _finishGame(uint256 gameId) private {
        Game storage game = games[gameId];
        
        address winner = _determineWinner(game);
        game.winner = winner;
        game.isFinished = true;
        
        // Update ELO ratings if ranked game
        if (game.isRanked) {
            _updateEloRatings(game.player1, game.player2, winner);
        }
        
        // Update basic stats for both ranked and casual
        _updatePlayerStats(game.player1, winner == game.player1);
        _updatePlayerStats(game.player2, winner == game.player2);
        
        // Clear active games
        playerActiveGame[game.player1] = 0;
        playerActiveGame[game.player2] = 0;
        
        // Clean up skill pools
        _removeFromSkillPools(game.player1);
        _removeFromSkillPools(game.player2);
    }
    
    /**
     * @dev Determine winner with skill-based tie breaking
     */
    function _determineWinner(Game storage game) private view returns (address) {
        if (game.player1Move == game.player2Move) {
            // Skill-based tie breaking
            PlayerRating storage rating1 = playerRatings[game.player1];
            PlayerRating storage rating2 = playerRatings[game.player2];
            
            // Higher ELO player wins ties (slight advantage)
            if (rating1.elo != rating2.elo) {
                return rating1.elo > rating2.elo ? game.player1 : game.player2;
            }
            
            // If ELO is equal, use skill seed
            uint256 tieBreaker = uint256(keccak256(abi.encodePacked(
                game.skillSeed,
                block.timestamp
            ))) % 2;
            return tieBreaker == 0 ? game.player1 : game.player2;
        } else if (
            (game.player1Move == Move.Rock && game.player2Move == Move.Scissors) ||
            (game.player1Move == Move.Paper && game.player2Move == Move.Rock) ||
            (game.player1Move == Move.Scissors && game.player2Move == Move.Paper)
        ) {
            return game.player1;
        } else {
            return game.player2;
        }
    }
    
    /**
     * @dev Update ELO ratings using standard ELO formula
     */
    function _updateEloRatings(address player1, address player2, address winner) private {
        _updatePlayerElo(player1, player2, winner == player1);
        _updatePlayerElo(player2, player1, winner == player2);
    }
    
    /**
     * @dev Update individual player ELO
     */
    function _updatePlayerElo(address player, address opponent, bool won) private {
        PlayerRating storage rating = playerRatings[player];
        PlayerRating storage opponentRating = playerRatings[opponent];
        
        uint256 oldElo = rating.elo;
        SkillTier oldTier = rating.tier;
        
        // Calculate expected score and update ELO
        uint256 expectedScore = _calculateExpectedScore(rating.elo, opponentRating.elo);
        uint256 actualScore = won ? 100 : 0;
        uint256 kFactor = rating.isCalibrated ? K_FACTOR : K_FACTOR * 2;
        
        int256 eloChange = int256(kFactor * (actualScore - expectedScore)) / 100;
        rating.elo = uint256(int256(rating.elo) + eloChange);
        
        // Update tier
        SkillTier newTier = _calculateTier(rating.elo);
        if (newTier != oldTier) {
            rating.tier = newTier;
            if (newTier > oldTier) {
                emit SkillTierPromoted(player, newTier);
            }
        }
        
        emit EloUpdated(player, oldElo, rating.elo, oldTier, newTier);
    }
    
    /**
     * @dev Calculate expected score using ELO formula
     */
    function _calculateExpectedScore(uint256 eloA, uint256 eloB) private pure returns (uint256) {
        int256 diff = int256(eloA) - int256(eloB);
        // Simplified ELO expected score calculation
        if (diff >= 400) return 95;
        if (diff >= 200) return 75;
        if (diff >= 100) return 65;
        if (diff >= 50) return 57;
        if (diff >= 0) return 50;
        if (diff >= -50) return 43;
        if (diff >= -100) return 35;
        if (diff >= -200) return 25;
        if (diff >= -400) return 5;
        return 5;
    }
    
    /**
     * @dev Calculate skill tier based on ELO
     */
    function _calculateTier(uint256 elo) private pure returns (SkillTier) {
        if (elo >= 2400) return SkillTier.Grandmaster;
        if (elo >= 2000) return SkillTier.Master;
        if (elo >= 1700) return SkillTier.Diamond;
        if (elo >= 1400) return SkillTier.Platinum;
        if (elo >= 1100) return SkillTier.Gold;
        if (elo >= 800) return SkillTier.Silver;
        return SkillTier.Bronze;
    }
    
    /**
     * @dev Update player statistics
     */
    function _updatePlayerStats(address player, bool won) private {
        PlayerRating storage rating = playerRatings[player];
        
        rating.totalGames++;
        rating.seasonGames++;
        rating.lastGameTime = block.timestamp;
        
        if (won) {
            rating.wins++;
            rating.seasonWins++;
            rating.winStreak++;
            if (rating.winStreak > rating.longestWinStreak) {
                rating.longestWinStreak = rating.winStreak;
            }
        } else {
            rating.winStreak = 0;
        }
        
        // Check placement games
        if (placementGamesRemaining[player] > 0) {
            placementGamesRemaining[player]--;
            if (placementGamesRemaining[player] == 0) {
                rating.isCalibrated = true;
            }
            emit PlacementGameCompleted(player, placementGamesRemaining[player]);
        }
    }
    
    /**
     * @dev Remove player from skill pools
     */
    function _removeFromSkillPools(address player) private {
        // This is a simplified version - in production you'd want more efficient removal
        for (uint256 tier = 0; tier <= uint256(SkillTier.Grandmaster); tier++) {
            MatchmakingPool storage pool = skillPools[SkillTier(tier)];
            for (uint256 i = 0; i < pool.players.length; i++) {
                if (pool.players[i] == player) {
                    pool.players[i] = pool.players[pool.players.length - 1];
                    pool.players.pop();
                    break;
                }
            }
        }
    }
    
    /**
     * @dev Get detailed player statistics
     */
    function getPlayerStats(address player) external view returns (
        uint256 elo,
        SkillTier tier,
        uint256 wins,
        uint256 totalGames,
        uint256 winRate,
        uint256 winStreak,
        uint256 longestWinStreak,
        bool isCalibrated,
        uint256 placementGames
    ) {
        PlayerRating storage rating = playerRatings[player];
        elo = rating.elo;
        tier = rating.tier;
        wins = rating.wins;
        totalGames = rating.totalGames;
        winRate = totalGames > 0 ? (wins * 100) / totalGames : 0;
        winStreak = rating.winStreak;
        longestWinStreak = rating.longestWinStreak;
        isCalibrated = rating.isCalibrated;
        placementGames = placementGamesRemaining[player];
    }
    
    /**
     * @dev Get skill pool statistics
     */
    function getSkillPoolStats(SkillTier tier) external view returns (
        uint256 playerCount,
        uint256 minElo,
        uint256 maxElo,
        uint256 avgWaitTime
    ) {
        MatchmakingPool storage pool = skillPools[tier];
        playerCount = pool.players.length;
        minElo = pool.minElo;
        maxElo = pool.maxElo;
        avgWaitTime = pool.createdAt > 0 ? block.timestamp - pool.createdAt : 0;
    }
}