// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RPSQuantumMatch
 * @dev Rock Paper Scissors with quantum-inspired randomness using block hash entropy
 * Uses multiple entropy sources and commit-reveal scheme for fairness
 */
contract RPSQuantumMatch {
    enum Move { None, Rock, Paper, Scissors }
    enum GameState { WaitingForPlayers, Player1Committed, BothCommitted, Revealed, Finished }
    
    struct Game {
        address player1;
        address player2;
        bytes32 player1CommitHash;
        bytes32 player2CommitHash;
        Move player1Move;
        Move player2Move;
        uint256 player1Nonce;
        uint256 player2Nonce;
        address winner;
        GameState state;
        uint256 createdAt;
        uint256 quantumSeed; // Quantum-inspired entropy
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerActiveGame;
    mapping(address => uint256) public playerWins;
    mapping(address => uint256) public playerGames;
    
    uint256 public gameCounter;
    uint256 public constant GAME_TIMEOUT = 10 minutes;
    
    event GameCreated(uint256 indexed gameId, address indexed player1, uint256 quantumSeed);
    event PlayerJoined(uint256 indexed gameId, address indexed player2);
    event MoveCommitted(uint256 indexed gameId, address indexed player);
    event GameRevealed(uint256 indexed gameId, address indexed winner, Move player1Move, Move player2Move);
    event QuantumEntropyGenerated(uint256 indexed gameId, uint256 entropy);
    
    /**
     * @dev Generate quantum-inspired entropy using multiple block properties
     */
    function generateQuantumEntropy() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.gaslimit,
            blockhash(block.number - 1),
            blockhash(block.number - 2),
            msg.sender,
            tx.gasprice
        )));
    }
    
    /**
     * @dev Create a new game with quantum entropy
     */
    function createGame() external {
        require(playerActiveGame[msg.sender] == 0, "Already in active game");
        
        gameCounter++;
        uint256 quantumSeed = generateQuantumEntropy();
        
        games[gameCounter] = Game({
            player1: msg.sender,
            player2: address(0),
            player1CommitHash: bytes32(0),
            player2CommitHash: bytes32(0),
            player1Move: Move.None,
            player2Move: Move.None,
            player1Nonce: 0,
            player2Nonce: 0,
            winner: address(0),
            state: GameState.WaitingForPlayers,
            createdAt: block.timestamp,
            quantumSeed: quantumSeed
        });
        
        playerActiveGame[msg.sender] = gameCounter;
        
        emit GameCreated(gameCounter, msg.sender, quantumSeed);
        emit QuantumEntropyGenerated(gameCounter, quantumSeed);
    }
    
    /**
     * @dev Join an existing game using quantum matchmaking
     */
    function joinRandomGame() external {
        require(playerActiveGame[msg.sender] == 0, "Already in active game");
        
        // Find available game using quantum-weighted selection
        uint256 availableGame = findQuantumMatch();
        require(availableGame > 0, "No available games");
        
        Game storage game = games[availableGame];
        game.player2 = msg.sender;
        playerActiveGame[msg.sender] = availableGame;
        
        emit PlayerJoined(availableGame, msg.sender);
    }
    
    /**
     * @dev Quantum-weighted game selection algorithm
     */
    function findQuantumMatch() private view returns (uint256) {
        uint256 entropy = generateQuantumEntropy();
        uint256 bestMatch = 0;
        uint256 bestScore = 0;
        
        for (uint256 i = gameCounter; i > 0 && i > gameCounter - 50; i--) {
            Game storage game = games[i];
            if (game.state == GameState.WaitingForPlayers && 
                game.player1 != msg.sender &&
                block.timestamp - game.createdAt < GAME_TIMEOUT) {
                
                // Quantum scoring based on entropy correlation
                uint256 score = uint256(keccak256(abi.encodePacked(
                    entropy,
                    game.quantumSeed,
                    i
                ))) % 1000;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = i;
                }
            }
        }
        
        return bestMatch;
    }
    
    /**
     * @dev Commit move with hash
     */
    function commitMove(uint256 gameId, bytes32 commitHash) external {
        Game storage game = games[gameId];
        require(game.player1 == msg.sender || game.player2 == msg.sender, "Not a player");
        require(game.state == GameState.WaitingForPlayers || game.state == GameState.Player1Committed, "Invalid state");
        
        if (game.player1 == msg.sender) {
            require(game.player1CommitHash == bytes32(0), "Already committed");
            game.player1CommitHash = commitHash;
        } else {
            require(game.player2CommitHash == bytes32(0), "Already committed");
            game.player2CommitHash = commitHash;
        }
        
        if (game.player1CommitHash != bytes32(0) && game.player2CommitHash != bytes32(0)) {
            game.state = GameState.BothCommitted;
        } else if (game.state == GameState.WaitingForPlayers) {
            game.state = GameState.Player1Committed;
        }
        
        emit MoveCommitted(gameId, msg.sender);
    }
    
    /**
     * @dev Reveal move and determine winner
     */
    function revealMove(uint256 gameId, Move move, uint256 nonce) external {
        Game storage game = games[gameId];
        require(game.state == GameState.BothCommitted, "Not ready for reveal");
        require(game.player1 == msg.sender || game.player2 == msg.sender, "Not a player");
        
        bytes32 expectedHash = keccak256(abi.encodePacked(move, nonce, msg.sender));
        
        if (game.player1 == msg.sender) {
            require(game.player1CommitHash == expectedHash, "Invalid reveal");
            game.player1Move = move;
            game.player1Nonce = nonce;
        } else {
            require(game.player2CommitHash == expectedHash, "Invalid reveal");
            game.player2Move = move;
            game.player2Nonce = nonce;
        }
        
        // Check if both revealed
        if (game.player1Move != Move.None && game.player2Move != Move.None) {
            _determineWinner(gameId);
        }
    }
    
    /**
     * @dev Determine winner using quantum-enhanced logic
     */
    function _determineWinner(uint256 gameId) private {
        Game storage game = games[gameId];
        
        address winner = address(0);
        
        if (game.player1Move == game.player2Move) {
            // Tie - use quantum entropy to break ties
            uint256 tieBreaker = uint256(keccak256(abi.encodePacked(
                game.quantumSeed,
                game.player1Nonce,
                game.player2Nonce,
                block.timestamp
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
        game.state = GameState.Finished;
        
        // Update stats
        playerWins[winner]++;
        playerGames[game.player1]++;
        playerGames[game.player2]++;
        
        // Clear active games
        playerActiveGame[game.player1] = 0;
        playerActiveGame[game.player2] = 0;
        
        emit GameRevealed(gameId, winner, game.player1Move, game.player2Move);
    }
    
    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player) external view returns (uint256 wins, uint256 totalGames, uint256 winRate) {
        wins = playerWins[player];
        totalGames = playerGames[player];
        winRate = totalGames > 0 ? (wins * 100) / totalGames : 0;
    }
    
    /**
     * @dev Get available games count
     */
    function getAvailableGamesCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = gameCounter; i > 0 && i > gameCounter - 50; i--) {
            if (games[i].state == GameState.WaitingForPlayers && 
                block.timestamp - games[i].createdAt < GAME_TIMEOUT) {
                count++;
            }
        }
        return count;
    }
}