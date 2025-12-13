// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RPSTimeBasedMatch
 * @dev Rock Paper Scissors with time-based matchmaking and temporal randomness
 * Uses time windows and player activity patterns for intelligent matching
 */
contract RPSTimeBasedMatch {
    enum Move { None, Rock, Paper, Scissors }
    enum MatchType { Instant, Scheduled, Tournament }
    
    struct Game {
        address player1;
        address player2;
        Move player1Move;
        Move player2Move;
        address winner;
        uint256 createdAt;
        uint256 timeWindow;
        MatchType matchType;
        bool isFinished;
        uint256 temporalSeed;
    }
    
    struct PlayerProfile {
        uint256 totalGames;
        uint256 wins;
        uint256 lastGameTime;
        uint256 averageResponseTime;
        uint256 preferredTimeWindow;
        bool isActive;
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => PlayerProfile) public playerProfiles;
    mapping(address => uint256) public playerActiveGame;
    mapping(uint256 => address[]) public timeWindowPlayers; // time window => players waiting
    
    uint256 public gameCounter;
    uint256 public constant TIME_WINDOW_SIZE = 5 minutes;
    uint256 public constant MAX_WAIT_TIME = 30 minutes;
    
    event GameCreated(uint256 indexed gameId, address indexed player1, uint256 timeWindow, MatchType matchType);
    event PlayerMatched(uint256 indexed gameId, address indexed player1, address indexed player2, uint256 matchScore);
    event MoveSubmitted(uint256 indexed gameId, address indexed player, uint256 responseTime);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 gameDuration);
    event TimeWindowUpdated(uint256 indexed timeWindow, uint256 playerCount);
    
    /**
     * @dev Generate temporal randomness based on time patterns
     */
    function generateTemporalSeed() private view returns (uint256) {
        uint256 timeOfDay = block.timestamp % 86400; // seconds in a day
        uint256 dayOfWeek = (block.timestamp / 86400) % 7;
        
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            timeOfDay,
            dayOfWeek,
            block.number,
            msg.sender
        )));
    }
    
    /**
     * @dev Get current time window
     */
    function getCurrentTimeWindow() public view returns (uint256) {
        return block.timestamp / TIME_WINDOW_SIZE;
    }
    
    /**
     * @dev Create instant match game
     */
    function createInstantGame() external {
        require(playerActiveGame[msg.sender] == 0, "Already in active game");
        
        uint256 currentWindow = getCurrentTimeWindow();
        _createGame(MatchType.Instant, currentWindow);
        
        // Try to find immediate match
        _attemptInstantMatch(gameCounter);
    }
    
    /**
     * @dev Schedule a game for specific time window
     */
    function scheduleGame(uint256 targetTimeWindow) external {
        require(playerActiveGame[msg.sender] == 0, "Already in active game");
        require(targetTimeWindow >= getCurrentTimeWindow(), "Cannot schedule in past");
        require(targetTimeWindow <= getCurrentTimeWindow() + 288, "Too far in future"); // 24 hours max
        
        _createGame(MatchType.Scheduled, targetTimeWindow);
        
        // Add to time window queue
        timeWindowPlayers[targetTimeWindow].push(msg.sender);
        emit TimeWindowUpdated(targetTimeWindow, timeWindowPlayers[targetTimeWindow].length);
    }
    
    /**
     * @dev Join tournament-style rapid matching
     */
    function joinTournament() external {
        require(playerActiveGame[msg.sender] == 0, "Already in active game");
        
        uint256 tournamentWindow = getCurrentTimeWindow();
        _createGame(MatchType.Tournament, tournamentWindow);
        
        // Tournament matching prioritizes active players
        _attemptTournamentMatch(gameCounter);
    }
    
    /**
     * @dev Internal game creation
     */
    function _createGame(MatchType matchType, uint256 timeWindow) private {
        gameCounter++;
        uint256 temporalSeed = generateTemporalSeed();
        
        games[gameCounter] = Game({
            player1: msg.sender,
            player2: address(0),
            player1Move: Move.None,
            player2Move: Move.None,
            winner: address(0),
            createdAt: block.timestamp,
            timeWindow: timeWindow,
            matchType: matchType,
            isFinished: false,
            temporalSeed: temporalSeed
        });
        
        playerActiveGame[msg.sender] = gameCounter;
        
        // Update player profile
        PlayerProfile storage profile = playerProfiles[msg.sender];
        profile.lastGameTime = block.timestamp;
        profile.isActive = true;
        
        emit GameCreated(gameCounter, msg.sender, timeWindow, matchType);
    }
    
    /**
     * @dev Attempt instant matching using temporal algorithms
     */
    function _attemptInstantMatch(uint256 gameId) private {
        Game storage game = games[gameId];
        uint256 currentWindow = getCurrentTimeWindow();
        
        address bestMatch = address(0);
        uint256 bestScore = 0;
        
        // Check recent time windows for waiting players
        for (uint256 i = 0; i < 3; i++) {
            uint256 checkWindow = currentWindow - i;
            address[] storage windowPlayers = timeWindowPlayers[checkWindow];
            
            for (uint256 j = 0; j < windowPlayers.length; j++) {
                address candidate = windowPlayers[j];
                if (candidate != msg.sender && playerActiveGame[candidate] != 0) {
                    Game storage candidateGame = games[playerActiveGame[candidate]];
                    if (candidateGame.player2 == address(0)) {
                        uint256 matchScore = _calculateMatchScore(msg.sender, candidate);
                        if (matchScore > bestScore) {
                            bestScore = matchScore;
                            bestMatch = candidate;
                        }
                    }
                }
            }
        }
        
        if (bestMatch != address(0)) {
            _matchPlayers(gameId, playerActiveGame[bestMatch]);
        }
    }
    
    /**
     * @dev Tournament matching with activity-based scoring
     */
    function _attemptTournamentMatch(uint256 gameId) private {
        // Tournament matching prioritizes recently active players
        uint256 currentTime = block.timestamp;
        address bestMatch = address(0);
        uint256 bestScore = 0;
        
        // Look for active tournament games in last 10 minutes
        for (uint256 i = gameCounter; i > 0 && i > gameCounter - 100; i--) {
            Game storage candidateGame = games[i];
            if (candidateGame.matchType == MatchType.Tournament &&
                candidateGame.player2 == address(0) &&
                candidateGame.player1 != msg.sender &&
                currentTime - candidateGame.createdAt < 10 minutes) {
                
                uint256 matchScore = _calculateTournamentScore(msg.sender, candidateGame.player1);
                if (matchScore > bestScore) {
                    bestScore = matchScore;
                    bestMatch = candidateGame.player1;
                }
            }
        }
        
        if (bestMatch != address(0)) {
            _matchPlayers(gameId, playerActiveGame[bestMatch]);
        }
    }
    
    /**
     * @dev Calculate match compatibility score
     */
    function _calculateMatchScore(address player1, address player2) private view returns (uint256) {
        PlayerProfile storage profile1 = playerProfiles[player1];
        PlayerProfile storage profile2 = playerProfiles[player2];
        
        uint256 score = 100;
        
        // Skill-based matching (similar win rates)
        uint256 winRate1 = profile1.totalGames > 0 ? (profile1.wins * 100) / profile1.totalGames : 50;
        uint256 winRate2 = profile2.totalGames > 0 ? (profile2.wins * 100) / profile2.totalGames : 50;
        uint256 skillDiff = winRate1 > winRate2 ? winRate1 - winRate2 : winRate2 - winRate1;
        score += (50 - skillDiff / 2); // Closer skill = higher score
        
        // Activity-based matching
        uint256 timeDiff = block.timestamp > profile2.lastGameTime ? 
            block.timestamp - profile2.lastGameTime : 0;
        if (timeDiff < 1 hours) {
            score += 30; // Recently active bonus
        }
        
        // Response time compatibility
        if (profile1.averageResponseTime > 0 && profile2.averageResponseTime > 0) {
            uint256 responseDiff = profile1.averageResponseTime > profile2.averageResponseTime ?
                profile1.averageResponseTime - profile2.averageResponseTime :
                profile2.averageResponseTime - profile1.averageResponseTime;
            score += (60 - (responseDiff / 1000)); // Similar response times
        }
        
        return score;
    }
    
    /**
     * @dev Calculate tournament-specific match score
     */
    function _calculateTournamentScore(address player1, address player2) private view returns (uint256) {
        PlayerProfile storage profile1 = playerProfiles[player1];
        PlayerProfile storage profile2 = playerProfiles[player2];
        
        uint256 score = _calculateMatchScore(player1, player2);
        
        // Tournament bonus for active players
        if (profile1.isActive && profile2.isActive) {
            score += 50;
        }
        
        // Experience bonus
        uint256 totalExperience = profile1.totalGames + profile2.totalGames;
        score += (totalExperience / 10); // More experienced players get priority
        
        return score;
    }
    
    /**
     * @dev Match two players together
     */
    function _matchPlayers(uint256 gameId1, uint256 gameId2) private {
        Game storage game1 = games[gameId1];
        Game storage game2 = games[gameId2];
        
        // Merge games - use the first game as primary
        game1.player2 = game2.player1;
        
        // Clear second game
        playerActiveGame[game2.player1] = gameId1;
        delete games[gameId2];
        
        uint256 matchScore = _calculateMatchScore(game1.player1, game1.player2);
        emit PlayerMatched(gameId1, game1.player1, game1.player2, matchScore);
    }
    
    /**
     * @dev Submit move with response time tracking
     */
    function submitMove(uint256 gameId, Move move) external {
        Game storage game = games[gameId];
        require(game.player1 == msg.sender || game.player2 == msg.sender, "Not a player");
        require(!game.isFinished, "Game already finished");
        require(move != Move.None, "Invalid move");
        
        uint256 responseTime = block.timestamp - game.createdAt;
        
        if (game.player1 == msg.sender) {
            require(game.player1Move == Move.None, "Already moved");
            game.player1Move = move;
        } else {
            require(game.player2Move == Move.None, "Already moved");
            game.player2Move = move;
        }
        
        // Update response time stats
        PlayerProfile storage profile = playerProfiles[msg.sender];
        if (profile.averageResponseTime == 0) {
            profile.averageResponseTime = responseTime;
        } else {
            profile.averageResponseTime = (profile.averageResponseTime + responseTime) / 2;
        }
        
        emit MoveSubmitted(gameId, msg.sender, responseTime);
        
        // Check if both players moved
        if (game.player1Move != Move.None && game.player2Move != Move.None) {
            _finishGame(gameId);
        }
    }
    
    /**
     * @dev Finish game and determine winner
     */
    function _finishGame(uint256 gameId) private {
        Game storage game = games[gameId];
        uint256 gameDuration = block.timestamp - game.createdAt;
        
        address winner = address(0);
        
        if (game.player1Move == game.player2Move) {
            // Tie - use temporal randomness
            uint256 tieBreaker = uint256(keccak256(abi.encodePacked(
                game.temporalSeed,
                block.timestamp,
                gameDuration
            ))) % 2;
            winner = tieBreaker == 0 ? game.player1 : game.player2;
        } else if (
            (game.player1Move == Move.Rock && game.player2Move == Move.Scissors) ||
            (game.player1Move == Move.Paper && game.player2Move == Move.Rock) ||
            (game.player1Move == Move.Scissors && game.player2Move == Move.Paper)
        ) {
            winner = game.player1;
        } else {
            winner = game.player2;
        }
        
        game.winner = winner;
        game.isFinished = true;
        
        // Update player profiles
        playerProfiles[game.player1].totalGames++;
        playerProfiles[game.player2].totalGames++;
        playerProfiles[winner].wins++;
        
        // Clear active games
        playerActiveGame[game.player1] = 0;
        playerActiveGame[game.player2] = 0;
        
        emit GameFinished(gameId, winner, gameDuration);
    }
    
    /**
     * @dev Get player statistics with temporal data
     */
    function getPlayerStats(address player) external view returns (
        uint256 wins,
        uint256 totalGames,
        uint256 winRate,
        uint256 averageResponseTime,
        uint256 lastGameTime,
        bool isActive
    ) {
        PlayerProfile storage profile = playerProfiles[player];
        wins = profile.wins;
        totalGames = profile.totalGames;
        winRate = totalGames > 0 ? (wins * 100) / totalGames : 0;
        averageResponseTime = profile.averageResponseTime;
        lastGameTime = profile.lastGameTime;
        isActive = profile.isActive && (block.timestamp - profile.lastGameTime < 1 hours);
    }
    
    /**
     * @dev Get time window statistics
     */
    function getTimeWindowStats(uint256 timeWindow) external view returns (uint256 playerCount, uint256 activeGames) {
        playerCount = timeWindowPlayers[timeWindow].length;
        
        // Count active games in this time window
        for (uint256 i = gameCounter; i > 0 && i > gameCounter - 50; i--) {
            if (games[i].timeWindow == timeWindow && !games[i].isFinished) {
                activeGames++;
            }
        }
    }
}