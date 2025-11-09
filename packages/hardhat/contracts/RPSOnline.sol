// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RPSOnline {
    enum GameState { Created, Joined, Finished, Claimed }
    
    struct Game {
        address player1;
        address player2;
        GameState state;
        address winner;
        uint256 betAmount;
        uint256 createdAt;
    }
    
    address public backend;
    address public feeCollector;
    uint256 public constant FEE_PERCENTAGE = 125; // 1.25% (125/10000)
    uint256 public constant MIN_BET = 0.01 ether; // Minimum 0.01 CELO
    
    mapping(string => Game) public games;
    
    event GameCreated(string indexed roomId, address indexed creator, uint256 betAmount);
    event GameJoined(string indexed roomId, address indexed joiner, uint256 betAmount);
    event GameFinished(string indexed roomId, address indexed winner);
    event WinningsClaimed(string indexed roomId, address indexed claimer, uint256 amount);
    event GameCancelled(string indexed roomId, address indexed creator);
    
    constructor(address _backend, address _feeCollector) {
        backend = _backend;
        feeCollector = _feeCollector;
    }
    
    function createGame(string memory roomId) external payable {
        require(games[roomId].player1 == address(0), "Room already exists");
        require(msg.value >= MIN_BET, "Bet amount must be at least 0.01 CELO");
        
        games[roomId] = Game({
            player1: msg.sender,
            player2: address(0),
            state: GameState.Created,
            winner: address(0),
            betAmount: msg.value,
            createdAt: block.timestamp
        });
        
        emit GameCreated(roomId, msg.sender, msg.value);
    }
    
    function joinGame(string memory roomId) external payable {
        Game storage game = games[roomId];
        require(game.player1 != address(0), "Room does not exist");
        require(game.player2 == address(0), "Room is full");
        require(game.player1 != msg.sender, "Cannot join your own room");
        require(game.state == GameState.Created, "Game not available");
        require(msg.value == game.betAmount, "Incorrect bet amount");
        
        game.player2 = msg.sender;
        game.state = GameState.Joined;
        
        emit GameJoined(roomId, msg.sender, msg.value);
    }
    
    function getGame(string memory roomId) external view returns (Game memory) {
        return games[roomId];
    }
    
    function finishGameAndPayout(string memory roomId, address winner) external {
        require(msg.sender == backend, "Only backend can finish game");
        Game storage game = games[roomId];
        require(game.state == GameState.Joined, "Game not in progress");
        
        uint256 totalPot = game.betAmount * 2;
        
        if (winner == address(0)) {
            // Tie - refund both (no fee)
            payable(game.player1).transfer(game.betAmount);
            payable(game.player2).transfer(game.betAmount);
            emit WinningsClaimed(roomId, game.player1, game.betAmount);
            emit WinningsClaimed(roomId, game.player2, game.betAmount);
        } else {
            // Winner takes pot minus fee
            uint256 fee = (totalPot * FEE_PERCENTAGE) / 10000;
            uint256 payout = totalPot - fee;
            
            payable(feeCollector).transfer(fee);
            payable(winner).transfer(payout);
            emit WinningsClaimed(roomId, winner, payout);
        }
        
        game.winner = winner;
        game.state = GameState.Finished;
        emit GameFinished(roomId, winner);
    }
    
    function claimTimeout(string memory roomId) external {
        Game storage game = games[roomId];
        require(game.state == GameState.Joined, "Game not in progress");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");
        require(block.timestamp >= game.createdAt + 7 days, "Timeout not reached");
        
        // Refund both players after timeout
        game.state = GameState.Finished;
        payable(msg.sender).transfer(game.betAmount);
        
        emit WinningsClaimed(roomId, msg.sender, game.betAmount);
    }

    
    function cancelGame(string memory roomId) external {
        Game storage game = games[roomId];
        require(game.player1 == msg.sender, "Not the creator");
        require(game.state == GameState.Created, "Game already started");
        require(game.player2 == address(0), "Player already joined");
        
        uint256 refundAmount = game.betAmount;
        delete games[roomId];
        payable(msg.sender).transfer(refundAmount);
        
        emit GameCancelled(roomId, msg.sender);
    }
    
    function isRoomAvailable(string memory roomId) external view returns (bool) {
        Game memory game = games[roomId];
        return game.player1 != address(0) && game.player2 == address(0) && game.state == GameState.Created;
    }
}