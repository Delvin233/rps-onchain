// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RPSOnline {
    enum GameState { Created, Joined, Finished }
    
    struct Game {
        address player1;
        address player2;
        GameState state;
        address winner;
        uint256 createdAt;
    }
    
    address public backend;
    
    mapping(string => Game) public games;
    
    event GameCreated(string indexed roomId, address indexed creator);
    event GameJoined(string indexed roomId, address indexed joiner);
    event GameFinished(string indexed roomId, address indexed winner);
    event GameCancelled(string indexed roomId, address indexed creator);
    
    constructor(address _backend) {
        backend = _backend;
    }
    
    function createGame(string memory roomId) external {
        require(games[roomId].player1 == address(0), "Room already exists");
        
        games[roomId] = Game({
            player1: msg.sender,
            player2: address(0),
            state: GameState.Created,
            winner: address(0),
            createdAt: block.timestamp
        });
        
        emit GameCreated(roomId, msg.sender);
    }
    
    function joinGame(string memory roomId) external {
        Game storage game = games[roomId];
        require(game.player1 != address(0), "Room does not exist");
        require(game.player2 == address(0), "Room is full");
        require(game.player1 != msg.sender, "Cannot join your own room");
        require(game.state == GameState.Created, "Game not available");
        
        game.player2 = msg.sender;
        game.state = GameState.Joined;
        
        emit GameJoined(roomId, msg.sender);
    }
    
    function getGame(string memory roomId) external view returns (Game memory) {
        return games[roomId];
    }
    
    function finishGame(string memory roomId, address winner) external {
        require(msg.sender == backend, "Only backend can finish game");
        Game storage game = games[roomId];
        require(game.state == GameState.Joined, "Game not in progress");
        
        game.winner = winner;
        game.state = GameState.Finished;
        emit GameFinished(roomId, winner);
    }
    


    
    function cancelGame(string memory roomId) external {
        Game storage game = games[roomId];
        require(game.player1 == msg.sender, "Not the creator");
        require(game.state == GameState.Created, "Game already started");
        require(game.player2 == address(0), "Player already joined");
        
        delete games[roomId];
        emit GameCancelled(roomId, msg.sender);
    }
    
    function isRoomAvailable(string memory roomId) external view returns (bool) {
        Game memory game = games[roomId];
        return game.player1 != address(0) && game.player2 == address(0) && game.state == GameState.Created;
    }
}