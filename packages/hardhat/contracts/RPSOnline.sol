// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RPSOnline {
    enum GameState { Created, Joined, MovesCommitted, Revealed, Finished }
    
    struct Game {
        address player1;
        address player2;
        bytes32 player1Move;
        bytes32 player2Move;
        uint8 revealedMove1;
        uint8 revealedMove2;
        GameState state;
        address winner;
        uint256 betAmount;
        bool player1Paid;
        bool player2Paid;
        uint256 createdAt;
    }
    
    mapping(string => Game) public games;
    
    event GameCreated(string indexed roomId, address indexed creator);
    event GameJoined(string indexed roomId, address indexed joiner);
    event MoveCommitted(string indexed roomId, address indexed player);
    event MoveRevealed(string indexed roomId, address indexed player, uint8 move);
    event GameFinished(string indexed roomId, address indexed winner);
    event WinningsClaimed(string indexed roomId, address indexed winner, uint256 amount);
    event GameCancelled(string indexed roomId, address indexed creator);
    
    function createGame(string memory roomId) external payable {
        require(games[roomId].player1 == address(0), "Room already exists");
        
        games[roomId] = Game({
            player1: msg.sender,
            player2: address(0),
            player1Move: bytes32(0),
            player2Move: bytes32(0),
            revealedMove1: 0,
            revealedMove2: 0,
            state: GameState.Created,
            winner: address(0),
            betAmount: msg.value,
            player1Paid: true,
            player2Paid: false,
            createdAt: block.timestamp
        });
        
        emit GameCreated(roomId, msg.sender);
    }
    
    function joinGame(string memory roomId) external payable {
        Game storage game = games[roomId];
        require(game.player1 != address(0), "Room does not exist");
        require(game.player2 == address(0), "Room is full");
        require(game.player1 != msg.sender, "Cannot join your own room");
        require(game.state == GameState.Created, "Game not available");
        require(msg.value == game.betAmount, "Incorrect bet amount");
        
        game.player2 = msg.sender;
        game.player2Paid = true;
        game.state = GameState.Joined;
        
        emit GameJoined(roomId, msg.sender);
    }
    
    function getGame(string memory roomId) external view returns (Game memory) {
        return games[roomId];
    }
    
    function submitMove(string memory roomId, bytes32 hashedMove) external {
        Game storage game = games[roomId];
        require(game.state == GameState.Joined, "Game not ready for moves");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");
        
        if (msg.sender == game.player1) {
            require(game.player1Move == bytes32(0), "Move already submitted");
            game.player1Move = hashedMove;
        } else {
            require(game.player2Move == bytes32(0), "Move already submitted");
            game.player2Move = hashedMove;
        }
        
        if (game.player1Move != bytes32(0) && game.player2Move != bytes32(0)) {
            game.state = GameState.MovesCommitted;
        }
        
        emit MoveCommitted(roomId, msg.sender);
    }
    
    function revealMove(string memory roomId, uint8 move, uint256 nonce) external {
        Game storage game = games[roomId];
        require(game.state == GameState.MovesCommitted, "Moves not committed yet");
        require(move >= 1 && move <= 3, "Invalid move");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");
        
        bytes32 hash = keccak256(abi.encodePacked(move, nonce, msg.sender));
        
        if (msg.sender == game.player1) {
            require(game.player1Move == hash, "Invalid reveal");
            require(game.revealedMove1 == 0, "Already revealed");
            game.revealedMove1 = move;
        } else {
            require(game.player2Move == hash, "Invalid reveal");
            require(game.revealedMove2 == 0, "Already revealed");
            game.revealedMove2 = move;
        }
        
        emit MoveRevealed(roomId, msg.sender, move);
        
        if (game.revealedMove1 != 0 && game.revealedMove2 != 0) {
            game.winner = determineWinner(game.revealedMove1, game.revealedMove2, game.player1, game.player2);
            game.state = GameState.Finished;
            emit GameFinished(roomId, game.winner);
        }
    }
    
    function determineWinner(uint8 move1, uint8 move2, address player1, address player2) private pure returns (address) {
        if (move1 == move2) return address(0);
        if ((move1 == 1 && move2 == 3) || (move1 == 2 && move2 == 1) || (move1 == 3 && move2 == 2)) {
            return player1;
        }
        return player2;
    }
    
    function claimWinnings(string memory roomId) external {
        Game storage game = games[roomId];
        require(game.state == GameState.Finished, "Game not finished");
        require(game.player1Paid && game.player2Paid, "Bets not complete");
        
        uint256 totalPot = game.betAmount * 2;
        
        if (game.winner == address(0)) {
            // Tie - refund both players
            require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");
            if (msg.sender == game.player1 && game.player1Paid) {
                payable(game.player1).transfer(game.betAmount);
                game.player1Paid = false;
            } else if (msg.sender == game.player2 && game.player2Paid) {
                payable(game.player2).transfer(game.betAmount);
                game.player2Paid = false;
            }
        } else {
            // Winner takes all
            require(msg.sender == game.winner, "Not the winner");
            payable(game.winner).transfer(totalPot);
            game.player1Paid = false;
            game.player2Paid = false;
        }
        
        emit WinningsClaimed(roomId, msg.sender, game.winner == address(0) ? game.betAmount : totalPot);
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