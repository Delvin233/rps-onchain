// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RPSChaosMatch
 * @dev Rock Paper Scissors with chaos theory-inspired randomness and emergent matchmaking
 * Uses butterfly effect algorithms and complex adaptive systems for unpredictable matching
 */
contract RPSChaosMatch {
    enum Move { None, Rock, Paper, Scissors }
    enum ChaosLevel { Order, Mild, Moderate, High, Extreme, Pandemonium }
    
    struct Game {
        address player1;
        address player2;
        Move player1Move;
        Move player2Move;
        address winner;
        uint256 createdAt;
        ChaosLevel chaosLevel;
        uint256 chaosEntropy;
        uint256 butterflyFactor;
        bool isFinished;
        uint256[] chaosHistory; // Previous chaos values affecting this game
    }
    
    struct PlayerChaosProfile {
        uint256 totalGames;
        uint256 wins;
        uint256 chaosAffinity; // How much chaos the player attracts
        uint256 lastChaosLevel;
        uint256 chaosStreak; // Consecutive games in high chaos
        uint256 orderStreak; // Consecutive games in low chaos
        uint256 butterflyWings; // Accumulated butterfly effects
        bool isChaosMaster; // Achieved through extreme chaos survival
    }
    
    struct ChaosEvent {
        uint256 timestamp;
        ChaosLevel level;
        address[] affectedPlayers;
        uint256 magnitude;
        string eventType;
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => PlayerChaosProfile) public playerProfiles;
    mapping(address => uint256) public playerActiveGame;
    mapping(uint256 => ChaosEvent) public chaosEvents;
    mapping(ChaosLevel => address[]) public chaosQueues; // Players waiting in each chaos level
    
    uint256 public gameCounter;
    uint256 public chaosEventCounter;
    uint256 public globalChaosLevel; // System-wide chaos accumulation
    uint256 public lastChaosUpdate;
    
    // Chaos constants
    uint256 public constant BUTTERFLY_THRESHOLD = 1000;
    uint256 public constant CHAOS_DECAY_RATE = 10; // Chaos decreases over time
    uint256 public constant MAX_CHAOS_HISTORY = 10;
    
    event GameCreated(uint256 indexed gameId, address indexed player1, ChaosLevel chaosLevel, uint256 entropy);
    event ChaosLevelChanged(uint256 indexed gameId, ChaosLevel oldLevel, ChaosLevel newLevel, uint256 trigger);
    event ButterflyEffect(uint256 indexed gameId, address indexed player, uint256 magnitude, string effect);
    event ChaosEventTriggered(uint256 indexed eventId, ChaosLevel level, uint256 magnitude, string eventType);
    event ChaosMasterAscended(address indexed player, uint256 chaosAffinity);
    event EmergentBehaviorDetected(uint256 indexed gameId, string pattern, uint256 complexity);
    
    /**
     * @dev Generate chaos entropy using butterfly effect principles
     */
    function generateChaosEntropy(address player) private view returns (uint256, uint256) {
        PlayerChaosProfile storage profile = playerProfiles[player];
        
        // Base entropy from multiple chaotic sources
        uint256 baseEntropy = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.gaslimit,
            blockhash(block.number - 1),
            blockhash(block.number - 2),
            blockhash(block.number - 3),
            msg.sender,
            tx.gasprice,
            gasleft()
        )));
        
        // Butterfly factor - small changes create large effects
        uint256 butterflyFactor = uint256(keccak256(abi.encodePacked(
            baseEntropy,
            profile.chaosAffinity,
            profile.butterflyWings,
            globalChaosLevel,
            block.timestamp % 1000 // Microsecond-level sensitivity
        )));
        
        // Amplify based on player's chaos history
        if (profile.chaosStreak > 5) {
            butterflyFactor = (butterflyFactor * (100 + profile.chaosStreak * 10)) / 100;
        }
        
        return (baseEntropy, butterflyFactor);
    }
    
    /**
     * @dev Calculate chaos level based on entropy and system state
     */
    function calculateChaosLevel(uint256 entropy, uint256 butterflyFactor) private view returns (ChaosLevel) {
        uint256 chaosScore = (entropy % 1000) + (butterflyFactor % 500) + (globalChaosLevel % 300);
        
        // Time-based chaos amplification
        uint256 timeAmplifier = (block.timestamp % 86400) / 14400; // 6 time periods per day
        chaosScore += timeAmplifier * 50;
        
        // Network congestion adds chaos
        if (tx.gasprice > 20 gwei) {
            chaosScore += 100;
        }
        
        if (chaosScore >= 1500) return ChaosLevel.Pandemonium;
        if (chaosScore >= 1200) return ChaosLevel.Extreme;
        if (chaosScore >= 900) return ChaosLevel.High;
        if (chaosScore >= 600) return ChaosLevel.Moderate;
        if (chaosScore >= 300) return ChaosLevel.Mild;
        return ChaosLevel.Order;
    }
    
    /**
     * @dev Create game with chaos-driven parameters
     */
    function createChaosGame() external {
        require(playerActiveGame[msg.sender] == 0, "Already in active game");
        
        // Update global chaos
        _updateGlobalChaos();
        
        // Generate chaos parameters
        (uint256 entropy, uint256 butterflyFactor) = generateChaosEntropy(msg.sender);
        ChaosLevel chaosLevel = calculateChaosLevel(entropy, butterflyFactor);
        
        gameCounter++;
        
        // Build chaos history from recent games
        uint256[] memory chaosHistory = new uint256[](MAX_CHAOS_HISTORY);
        uint256 historyCount = 0;
        for (uint256 i = gameCounter - 1; i > 0 && historyCount < MAX_CHAOS_HISTORY && i > gameCounter - 50; i--) {
            if (games[i].chaosEntropy > 0) {
                chaosHistory[historyCount] = games[i].chaosEntropy;
                historyCount++;
            }
        }
        
        games[gameCounter] = Game({
            player1: msg.sender,
            player2: address(0),
            player1Move: Move.None,
            player2Move: Move.None,
            winner: address(0),
            createdAt: block.timestamp,
            chaosLevel: chaosLevel,
            chaosEntropy: entropy,
            butterflyFactor: butterflyFactor,
            isFinished: false,
            chaosHistory: chaosHistory
        });
        
        playerActiveGame[msg.sender] = gameCounter;
        
        // Add to chaos queue
        chaosQueues[chaosLevel].push(msg.sender);
        
        // Update player chaos profile
        PlayerChaosProfile storage profile = playerProfiles[msg.sender];
        profile.chaosAffinity = (profile.chaosAffinity + uint256(chaosLevel) * 100) / 2;
        profile.lastChaosLevel = uint256(chaosLevel);
        
        emit GameCreated(gameCounter, msg.sender, chaosLevel, entropy);
        
        // Trigger butterfly effects
        if (butterflyFactor > BUTTERFLY_THRESHOLD) {
            _triggerButterflyEffect(gameCounter, msg.sender, butterflyFactor);
        }
        
        // Attempt chaos-based matching
        _attemptChaosMatch(gameCounter);
    }
    
    /**
     * @dev Update global chaos level based on system activity
     */
    function _updateGlobalChaos() private {
        uint256 timeSinceUpdate = block.timestamp - lastChaosUpdate;
        
        // Chaos naturally decays over time
        if (timeSinceUpdate > 60) { // 1 minute
            uint256 decay = (timeSinceUpdate / 60) * CHAOS_DECAY_RATE;
            if (globalChaosLevel > decay) {
                globalChaosLevel -= decay;
            } else {
                globalChaosLevel = 0;
            }
        }
        
        // Add chaos from recent activity
        uint256 recentActivity = 0;
        for (uint256 i = gameCounter; i > 0 && i > gameCounter - 10; i--) {
            if (block.timestamp - games[i].createdAt < 300) { // 5 minutes
                recentActivity += uint256(games[i].chaosLevel) * 10;
            }
        }
        
        globalChaosLevel += recentActivity / 10;
        lastChaosUpdate = block.timestamp;
        
        // Trigger chaos events at high levels
        if (globalChaosLevel > 5000 && chaosEventCounter == 0 || 
            block.timestamp - chaosEvents[chaosEventCounter].timestamp > 3600) {
            _triggerChaosEvent();
        }
    }
    
    /**
     * @dev Trigger butterfly effect
     */
    function _triggerButterflyEffect(uint256 gameId, address player, uint256 magnitude) private {
        PlayerChaosProfile storage profile = playerProfiles[player];
        profile.butterflyWings += magnitude / 100;
        
        // Butterfly effects can change chaos levels of nearby games
        for (uint256 i = gameCounter; i > 0 && i > gameCounter - 5; i--) {
            if (i != gameId && !games[i].isFinished) {
                Game storage affectedGame = games[i];
                ChaosLevel oldLevel = affectedGame.chaosLevel;
                
                // Butterfly effect can increase or decrease chaos
                uint256 effect = uint256(keccak256(abi.encodePacked(magnitude, i))) % 3;
                if (effect == 0 && affectedGame.chaosLevel < ChaosLevel.Pandemonium) {
                    affectedGame.chaosLevel = ChaosLevel(uint256(affectedGame.chaosLevel) + 1);
                } else if (effect == 1 && affectedGame.chaosLevel > ChaosLevel.Order) {
                    affectedGame.chaosLevel = ChaosLevel(uint256(affectedGame.chaosLevel) - 1);
                }
                
                if (affectedGame.chaosLevel != oldLevel) {
                    emit ChaosLevelChanged(i, oldLevel, affectedGame.chaosLevel, magnitude);
                }
            }
        }
        
        string memory effectType;
        if (magnitude > 5000) effectType = "Reality Distortion";
        else if (magnitude > 3000) effectType = "Temporal Ripple";
        else if (magnitude > 2000) effectType = "Quantum Flutter";
        else effectType = "Micro Perturbation";
        
        emit ButterflyEffect(gameId, player, magnitude, effectType);
    }
    
    /**
     * @dev Trigger system-wide chaos event
     */
    function _triggerChaosEvent() private {
        chaosEventCounter++;
        
        ChaosLevel eventLevel = ChaosLevel(globalChaosLevel / 1000);
        if (eventLevel > ChaosLevel.Pandemonium) eventLevel = ChaosLevel.Pandemonium;
        
        uint256 magnitude = globalChaosLevel;
        
        // Collect affected players
        address[] memory affected = new address[](50);
        uint256 affectedCount = 0;
        
        for (uint256 i = gameCounter; i > 0 && i > gameCounter - 50 && affectedCount < 50; i--) {
            if (!games[i].isFinished) {
                affected[affectedCount] = games[i].player1;
                affectedCount++;
                if (games[i].player2 != address(0) && affectedCount < 50) {
                    affected[affectedCount] = games[i].player2;
                    affectedCount++;
                }
            }
        }
        
        string memory eventType;
        if (eventLevel >= ChaosLevel.Extreme) eventType = "Chaos Storm";
        else if (eventLevel >= ChaosLevel.High) eventType = "Reality Flux";
        else if (eventLevel >= ChaosLevel.Moderate) eventType = "Entropy Wave";
        else eventType = "Disorder Pulse";
        
        chaosEvents[chaosEventCounter] = ChaosEvent({
            timestamp: block.timestamp,
            level: eventLevel,
            affectedPlayers: affected,
            magnitude: magnitude,
            eventType: eventType
        });
        
        emit ChaosEventTriggered(chaosEventCounter, eventLevel, magnitude, eventType);
        
        // Reset global chaos after event
        globalChaosLevel = globalChaosLevel / 4;
    }
    
    /**
     * @dev Attempt chaos-based matching using emergent algorithms
     */
    function _attemptChaosMatch(uint256 gameId) private {
        Game storage game = games[gameId];
        
        address bestMatch = address(0);
        uint256 bestResonance = 0;
        
        // First try same chaos level (resonance matching)
        bestMatch = _findResonantMatch(game.player1, game.chaosLevel);
        
        // If no resonant match, try chaos attraction/repulsion
        if (bestMatch == address(0)) {
            bestMatch = _findChaosAttraction(game.player1, game.chaosLevel);
        }
        
        // Emergency matching across all chaos levels
        if (bestMatch == address(0)) {
            bestMatch = _findEmergencyMatch(game.player1);
        }
        
        if (bestMatch != address(0)) {
            uint256 opponentGameId = playerActiveGame[bestMatch];
            _matchPlayers(gameId, opponentGameId);
        }
    }
    
    /**
     * @dev Find resonant match (same chaos level)
     */
    function _findResonantMatch(address player, ChaosLevel chaosLevel) private view returns (address) {
        address[] storage queue = chaosQueues[chaosLevel];
        
        for (uint256 i = 0; i < queue.length; i++) {
            address candidate = queue[i];
            if (candidate != player && playerActiveGame[candidate] != 0) {
                Game storage candidateGame = games[playerActiveGame[candidate]];
                if (candidateGame.player2 == address(0)) {
                    return candidate;
                }
            }
        }
        
        return address(0);
    }
    
    /**
     * @dev Find chaos attraction match (opposite attracts)
     */
    function _findChaosAttraction(address player, ChaosLevel playerChaos) private view returns (address) {
        PlayerChaosProfile storage profile = playerProfiles[player];
        
        // High chaos attracts order, order attracts chaos
        ChaosLevel targetChaos;
        if (uint256(playerChaos) >= 3) {
            targetChaos = ChaosLevel(0); // Seek order
        } else {
            targetChaos = ChaosLevel(5); // Seek chaos
        }
        
        address[] storage queue = chaosQueues[targetChaos];
        
        for (uint256 i = 0; i < queue.length; i++) {
            address candidate = queue[i];
            if (candidate != player && playerActiveGame[candidate] != 0) {
                Game storage candidateGame = games[playerActiveGame[candidate]];
                if (candidateGame.player2 == address(0)) {
                    // Check chaos compatibility
                    uint256 compatibility = _calculateChaosCompatibility(player, candidate);
                    if (compatibility > 70) {
                        return candidate;
                    }
                }
            }
        }
        
        return address(0);
    }
    
    /**
     * @dev Emergency matching across all chaos levels
     */
    function _findEmergencyMatch(address player) private view returns (address) {
        // Search all chaos levels for any available match
        for (uint256 level = 0; level <= uint256(ChaosLevel.Pandemonium); level++) {
            address[] storage queue = chaosQueues[ChaosLevel(level)];
            
            for (uint256 i = 0; i < queue.length; i++) {
                address candidate = queue[i];
                if (candidate != player && playerActiveGame[candidate] != 0) {
                    Game storage candidateGame = games[playerActiveGame[candidate]];
                    if (candidateGame.player2 == address(0)) {
                        return candidate;
                    }
                }
            }
        }
        
        return address(0);
    }
    
    /**
     * @dev Calculate chaos compatibility between players
     */
    function _calculateChaosCompatibility(address player1, address player2) private view returns (uint256) {
        PlayerChaosProfile storage profile1 = playerProfiles[player1];
        PlayerChaosProfile storage profile2 = playerProfiles[player2];
        
        uint256 compatibility = 50; // Base compatibility
        
        // Chaos affinity difference
        uint256 affinityDiff = profile1.chaosAffinity > profile2.chaosAffinity ?
            profile1.chaosAffinity - profile2.chaosAffinity :
            profile2.chaosAffinity - profile1.chaosAffinity;
        
        if (affinityDiff < 100) compatibility += 30; // Similar chaos affinity
        else if (affinityDiff > 500) compatibility += 20; // Opposite attracts
        
        // Butterfly wings resonance
        uint256 wingsResonance = (profile1.butterflyWings + profile2.butterflyWings) % 100;
        compatibility += wingsResonance / 5;
        
        // Chaos master bonus
        if (profile1.isChaosMaster || profile2.isChaosMaster) {
            compatibility += 25;
        }
        
        return compatibility;
    }
    
    /**
     * @dev Match two players with chaos synchronization
     */
    function _matchPlayers(uint256 gameId1, uint256 gameId2) private {
        Game storage game1 = games[gameId1];
        Game storage game2 = games[gameId2];
        
        // Merge games with chaos synchronization
        game1.player2 = game2.player1;
        
        // Synchronize chaos levels (they influence each other)
        uint256 avgChaos = (uint256(game1.chaosLevel) + uint256(game2.chaosLevel)) / 2;
        game1.chaosLevel = ChaosLevel(avgChaos);
        
        // Merge chaos histories
        for (uint256 i = 0; i < game2.chaosHistory.length && i < MAX_CHAOS_HISTORY; i++) {
            if (game2.chaosHistory[i] > 0) {
                // Add to game1's chaos history if there's space
                for (uint256 j = 0; j < game1.chaosHistory.length; j++) {
                    if (game1.chaosHistory[j] == 0) {
                        game1.chaosHistory[j] = game2.chaosHistory[i];
                        break;
                    }
                }
            }
        }
        
        // Clear second game
        playerActiveGame[game2.player1] = gameId1;
        delete games[gameId2];
        
        // Remove from chaos queues
        _removeFromChaosQueues(game1.player1);
        _removeFromChaosQueues(game1.player2);
        
        // Detect emergent behavior patterns
        _detectEmergentBehavior(gameId1);
    }
    
    /**
     * @dev Detect emergent behavior patterns
     */
    function _detectEmergentBehavior(uint256 gameId) private {
        Game storage game = games[gameId];
        
        // Analyze chaos history for patterns
        uint256 complexity = 0;
        uint256 pattern = 0;
        
        for (uint256 i = 0; i < game.chaosHistory.length - 1; i++) {
            if (game.chaosHistory[i] > 0 && game.chaosHistory[i + 1] > 0) {
                uint256 diff = game.chaosHistory[i] > game.chaosHistory[i + 1] ?
                    game.chaosHistory[i] - game.chaosHistory[i + 1] :
                    game.chaosHistory[i + 1] - game.chaosHistory[i];
                complexity += diff / 1000;
                pattern += (game.chaosHistory[i] % 10);
            }
        }
        
        string memory patternType;
        if (complexity > 500) patternType = "Fractal Emergence";
        else if (complexity > 300) patternType = "Strange Attractor";
        else if (complexity > 100) patternType = "Chaos Cascade";
        else if (pattern % 7 == 0) patternType = "Harmonic Resonance";
        else patternType = "Random Walk";
        
        if (complexity > 100) {
            emit EmergentBehaviorDetected(gameId, patternType, complexity);
        }
    }
    
    /**
     * @dev Submit move with chaos influence
     */
    function submitMove(uint256 gameId, Move move) external {
        Game storage game = games[gameId];
        require(game.player1 == msg.sender || game.player2 == msg.sender, "Not a player");
        require(!game.isFinished, "Game already finished");
        require(move != Move.None, "Invalid move");
        
        // Chaos can influence moves at extreme levels
        Move finalMove = move;
        if (game.chaosLevel >= ChaosLevel.Extreme) {
            uint256 chaosInfluence = uint256(keccak256(abi.encodePacked(
                game.chaosEntropy,
                msg.sender,
                block.timestamp
            ))) % 100;
            
            if (chaosInfluence < 10) { // 10% chance of chaos influence
                uint256 newMoveIndex = (uint256(move) % 3) + 1;
                if (newMoveIndex > 3) newMoveIndex = 1;
                finalMove = Move(newMoveIndex);
            }
        }
        
        if (game.player1 == msg.sender) {
            require(game.player1Move == Move.None, "Already moved");
            game.player1Move = finalMove;
        } else {
            require(game.player2Move == Move.None, "Already moved");
            game.player2Move = finalMove;
        }
        
        // Check if both players moved
        if (game.player1Move != Move.None && game.player2Move != Move.None) {
            _finishGame(gameId);
        }
    }
    
    /**
     * @dev Finish game with chaos-influenced outcome
     */
    function _finishGame(uint256 gameId) private {
        Game storage game = games[gameId];
        
        address winner = _determineChaosWinner(game);
        game.winner = winner;
        game.isFinished = true;
        
        // Update player profiles
        _updateChaosProfiles(game.player1, game.player2, winner, game.chaosLevel);
        
        // Clear active games
        playerActiveGame[game.player1] = 0;
        playerActiveGame[game.player2] = 0;
        
        // Add to global chaos
        globalChaosLevel += uint256(game.chaosLevel) * 50;
    }
    
    /**
     * @dev Determine winner with chaos influence
     */
    function _determineChaosWinner(Game storage game) private view returns (address) {
        if (game.player1Move == game.player2Move) {
            // Chaos-influenced tie breaking
            uint256 chaosBreaker = uint256(keccak256(abi.encodePacked(
                game.chaosEntropy,
                game.butterflyFactor,
                block.timestamp,
                globalChaosLevel
            )));
            
            // Higher chaos levels have more unpredictable outcomes
            if (game.chaosLevel >= ChaosLevel.High) {
                // Use chaos history to influence outcome
                uint256 historyInfluence = 0;
                for (uint256 i = 0; i < game.chaosHistory.length; i++) {
                    historyInfluence += game.chaosHistory[i];
                }
                chaosBreaker += historyInfluence;
            }
            
            return (chaosBreaker % 2 == 0) ? game.player1 : game.player2;
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
     * @dev Update chaos profiles after game
     */
    function _updateChaosProfiles(address player1, address player2, address winner, ChaosLevel chaosLevel) private {
        PlayerChaosProfile storage profile1 = playerProfiles[player1];
        PlayerChaosProfile storage profile2 = playerProfiles[player2];
        
        // Update basic stats
        profile1.totalGames++;
        profile2.totalGames++;
        
        if (winner == player1) {
            profile1.wins++;
        } else {
            profile2.wins++;
        }
        
        // Update chaos streaks
        if (uint256(chaosLevel) >= 3) { // High chaos
            profile1.chaosStreak++;
            profile2.chaosStreak++;
            profile1.orderStreak = 0;
            profile2.orderStreak = 0;
        } else { // Low chaos
            profile1.orderStreak++;
            profile2.orderStreak++;
            profile1.chaosStreak = 0;
            profile2.chaosStreak = 0;
        }
        
        // Check for chaos master ascension
        if (!profile1.isChaosMaster && profile1.chaosStreak >= 20 && profile1.chaosAffinity > 2000) {
            profile1.isChaosMaster = true;
            emit ChaosMasterAscended(player1, profile1.chaosAffinity);
        }
        
        if (!profile2.isChaosMaster && profile2.chaosStreak >= 20 && profile2.chaosAffinity > 2000) {
            profile2.isChaosMaster = true;
            emit ChaosMasterAscended(player2, profile2.chaosAffinity);
        }
    }
    
    /**
     * @dev Remove player from chaos queues
     */
    function _removeFromChaosQueues(address player) private {
        for (uint256 level = 0; level <= uint256(ChaosLevel.Pandemonium); level++) {
            address[] storage queue = chaosQueues[ChaosLevel(level)];
            for (uint256 i = 0; i < queue.length; i++) {
                if (queue[i] == player) {
                    queue[i] = queue[queue.length - 1];
                    queue.pop();
                    break;
                }
            }
        }
    }
    
    /**
     * @dev Get player chaos statistics
     */
    function getPlayerChaosStats(address player) external view returns (
        uint256 totalGames,
        uint256 wins,
        uint256 winRate,
        uint256 chaosAffinity,
        uint256 chaosStreak,
        uint256 orderStreak,
        uint256 butterflyWings,
        bool isChaosMaster
    ) {
        PlayerChaosProfile storage profile = playerProfiles[player];
        totalGames = profile.totalGames;
        wins = profile.wins;
        winRate = totalGames > 0 ? (wins * 100) / totalGames : 0;
        chaosAffinity = profile.chaosAffinity;
        chaosStreak = profile.chaosStreak;
        orderStreak = profile.orderStreak;
        butterflyWings = profile.butterflyWings;
        isChaosMaster = profile.isChaosMaster;
    }
    
    /**
     * @dev Get system chaos statistics
     */
    function getSystemChaosStats() external view returns (
        uint256 currentGlobalChaos,
        uint256 totalChaosEvents,
        uint256 timeSinceLastEvent,
        ChaosLevel dominantChaosLevel
    ) {
        currentGlobalChaos = globalChaosLevel;
        totalChaosEvents = chaosEventCounter;
        timeSinceLastEvent = chaosEventCounter > 0 ? 
            block.timestamp - chaosEvents[chaosEventCounter].timestamp : 0;
        
        // Find dominant chaos level
        uint256 maxQueue = 0;
        dominantChaosLevel = ChaosLevel.Order;
        for (uint256 level = 0; level <= uint256(ChaosLevel.Pandemonium); level++) {
            if (chaosQueues[ChaosLevel(level)].length > maxQueue) {
                maxQueue = chaosQueues[ChaosLevel(level)].length;
                dominantChaosLevel = ChaosLevel(level);
            }
        }
    }
}