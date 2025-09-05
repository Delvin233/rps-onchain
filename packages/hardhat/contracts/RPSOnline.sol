// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RPSOnline {
    event MatchCreated(string indexed matchId, address indexed player);
    
    struct Match {
        address player1;
        address player2;
        string matchId;
        bool isActive;
    }
    
    mapping(string => Match) public matches;
    
    function createMatch(string memory matchId) external {
        require(matches[matchId].player1 == address(0), "Match already exists");
        
        matches[matchId] = Match({
            player1: msg.sender,
            player2: address(0),
            matchId: matchId,
            isActive: true
        });
        
        emit MatchCreated(matchId, msg.sender);
    }
    
    function getMatch(string memory matchId) external view returns (Match memory) {
        return matches[matchId];
    }
}