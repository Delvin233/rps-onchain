// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RPSOnline {
    enum GameState { Created, Joined, Finished }
    
    struct Match {
        address winner;
        uint256 timestamp;
    }
    
    struct Game {
        address player1;
        address player2;
        GameState state;
        uint256 createdAt;
        Match[] matches;
    }
    
    address public backend;
    
    mapping(string => Game) public games;
    
    event GameCreated(string indexed roomId, address indexed creator);
    event GameJoined(string indexed roomId, address indexed joiner);
    event MatchFinished(string indexed roomId, address indexed winner, uint256 matchNumber);
    event GameCancelled(string indexed roomId, address indexed creator);
    
    constructor() {
        backend = msg.sender;
    }
    
    function createGame(string memory roomId) external {
        require(games[roomId].player1 == address(0), "Room already exists");
        
        Game storage game = games[roomId];
        game.player1 = msg.sender;
        game.player2 = address(0);
        game.state = GameState.Created;
        game.createdAt = block.timestamp;
        
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
    
    function publishMatch(string memory roomId, address winner) external {
        Game storage game = games[roomId];
        require(game.player1 == msg.sender || game.player2 == msg.sender, "Not a player");
        require(game.state == GameState.Joined || game.state == GameState.Finished, "Game not ready");
        
        game.matches.push(Match({
            winner: winner,
            timestamp: block.timestamp
        }));
        
        emit MatchFinished(roomId, winner, game.matches.length);
    }
    

    
    function getMatchHistory(string memory roomId) external view returns (Match[] memory) {
        return games[roomId].matches;
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
        Game storage game = games[roomId];
        return game.player1 != address(0) && game.player2 == address(0) && game.state == GameState.Created;
    }
    
    function getRoomStats(string memory roomId) external view returns (uint256 totalMatches, address player1, address player2) {
        Game storage game = games[roomId];
        return (game.matches.length, game.player1, game.player2);
    }
}