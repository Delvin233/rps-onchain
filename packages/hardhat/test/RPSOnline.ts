import { expect } from "chai";
import { ethers } from "hardhat";
import { RPSOnline } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RPSOnline", function () {
  let rpsContract: RPSOnline;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;

  const ROOM_ID = "ABC123";
  const ROOM_ID_2 = "XYZ789";

  beforeEach(async () => {
    [owner, player1, player2, player3] = await ethers.getSigners();
    const RPSFactory = await ethers.getContractFactory("RPSOnline");
    rpsContract = (await RPSFactory.deploy()) as RPSOnline;
    await rpsContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the backend address to deployer", async function () {
      expect(await rpsContract.backend()).to.equal(owner.address);
    });
  });

  describe("Game Creation", function () {
    it("Should create a new game", async function () {
      await expect(rpsContract.connect(player1).createGame(ROOM_ID))
        .to.emit(rpsContract, "GameCreated")
        .withArgs(ROOM_ID, player1.address);

      const game = await rpsContract.getGame(ROOM_ID);
      expect(game.player1).to.equal(player1.address);
      expect(game.player2).to.equal(ethers.ZeroAddress);
      expect(game.state).to.equal(0); // GameState.Created
    });

    it("Should not allow creating duplicate room", async function () {
      await rpsContract.connect(player1).createGame(ROOM_ID);
      
      await expect(
        rpsContract.connect(player2).createGame(ROOM_ID)
      ).to.be.revertedWith("Room already exists");
    });

    it("Should allow multiple different rooms", async function () {
      await rpsContract.connect(player1).createGame(ROOM_ID);
      await rpsContract.connect(player2).createGame(ROOM_ID_2);

      const game1 = await rpsContract.getGame(ROOM_ID);
      const game2 = await rpsContract.getGame(ROOM_ID_2);

      expect(game1.player1).to.equal(player1.address);
      expect(game2.player1).to.equal(player2.address);
    });
  });

  describe("Game Joining", function () {
    beforeEach(async () => {
      await rpsContract.connect(player1).createGame(ROOM_ID);
    });

    it("Should allow joining an available game", async function () {
      await expect(rpsContract.connect(player2).joinGame(ROOM_ID))
        .to.emit(rpsContract, "GameJoined")
        .withArgs(ROOM_ID, player2.address);

      const game = await rpsContract.getGame(ROOM_ID);
      expect(game.player2).to.equal(player2.address);
      expect(game.state).to.equal(1); // GameState.Joined
    });

    it("Should not allow joining non-existent room", async function () {
      await expect(
        rpsContract.connect(player2).joinGame("INVALID")
      ).to.be.revertedWith("Room does not exist");
    });

    it("Should not allow creator to join their own room", async function () {
      await expect(
        rpsContract.connect(player1).joinGame(ROOM_ID)
      ).to.be.revertedWith("Cannot join your own room");
    });

    it("Should not allow joining full room", async function () {
      await rpsContract.connect(player2).joinGame(ROOM_ID);
      
      await expect(
        rpsContract.connect(player3).joinGame(ROOM_ID)
      ).to.be.revertedWith("Room is full");
    });
  });

  describe("Match Publishing", function () {
    beforeEach(async () => {
      await rpsContract.connect(player1).createGame(ROOM_ID);
      await rpsContract.connect(player2).joinGame(ROOM_ID);
    });

    it("Should allow player1 to publish match result", async function () {
      await expect(
        rpsContract.connect(player1).publishMatch(
          ROOM_ID,
          player1.address,
          "rock",
          "scissors"
        )
      ).to.emit(rpsContract, "MatchFinished")
        .withArgs(ROOM_ID, player1.address, 1);

      const matches = await rpsContract.getMatchHistory(ROOM_ID);
      expect(matches.length).to.equal(1);
      expect(matches[0].winner).to.equal(player1.address);
      expect(matches[0].player1Move).to.equal("rock");
      expect(matches[0].player2Move).to.equal("scissors");
    });

    it("Should allow player2 to publish match result", async function () {
      await expect(
        rpsContract.connect(player2).publishMatch(
          ROOM_ID,
          player2.address,
          "rock",
          "paper"
        )
      ).to.emit(rpsContract, "MatchFinished")
        .withArgs(ROOM_ID, player2.address, 1);

      const matches = await rpsContract.getMatchHistory(ROOM_ID);
      expect(matches[0].winner).to.equal(player2.address);
    });

    it("Should not allow non-players to publish match", async function () {
      await expect(
        rpsContract.connect(player3).publishMatch(
          ROOM_ID,
          player1.address,
          "rock",
          "scissors"
        )
      ).to.be.revertedWith("Not a player");
    });

    it("Should allow publishing multiple matches (rematch)", async function () {
      await rpsContract.connect(player1).publishMatch(
        ROOM_ID,
        player1.address,
        "rock",
        "scissors"
      );

      await rpsContract.connect(player2).publishMatch(
        ROOM_ID,
        player2.address,
        "paper",
        "rock"
      );

      const matches = await rpsContract.getMatchHistory(ROOM_ID);
      expect(matches.length).to.equal(2);
    });

    it("Should handle tie games", async function () {
      await rpsContract.connect(player1).publishMatch(
        ROOM_ID,
        ethers.ZeroAddress, // Tie = zero address
        "rock",
        "rock"
      );

      const matches = await rpsContract.getMatchHistory(ROOM_ID);
      expect(matches[0].winner).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Game Cancellation", function () {
    beforeEach(async () => {
      await rpsContract.connect(player1).createGame(ROOM_ID);
    });

    it("Should allow creator to cancel unjoined game", async function () {
      await expect(rpsContract.connect(player1).cancelGame(ROOM_ID))
        .to.emit(rpsContract, "GameCancelled")
        .withArgs(ROOM_ID, player1.address);

      const game = await rpsContract.getGame(ROOM_ID);
      expect(game.player1).to.equal(ethers.ZeroAddress);
    });

    it("Should not allow non-creator to cancel game", async function () {
      await expect(
        rpsContract.connect(player2).cancelGame(ROOM_ID)
      ).to.be.revertedWith("Not the creator");
    });

    it("Should not allow cancelling after player joined", async function () {
      await rpsContract.connect(player2).joinGame(ROOM_ID);
      
      await expect(
        rpsContract.connect(player1).cancelGame(ROOM_ID)
      ).to.be.revertedWith("Player already joined");
    });
  });

  describe("Room Availability", function () {
    it("Should return false for non-existent room", async function () {
      expect(await rpsContract.isRoomAvailable(ROOM_ID)).to.be.false;
    });

    it("Should return true for available room", async function () {
      await rpsContract.connect(player1).createGame(ROOM_ID);
      expect(await rpsContract.isRoomAvailable(ROOM_ID)).to.be.true;
    });

    it("Should return false for full room", async function () {
      await rpsContract.connect(player1).createGame(ROOM_ID);
      await rpsContract.connect(player2).joinGame(ROOM_ID);
      expect(await rpsContract.isRoomAvailable(ROOM_ID)).to.be.false;
    });

    it("Should return false for cancelled room", async function () {
      await rpsContract.connect(player1).createGame(ROOM_ID);
      await rpsContract.connect(player1).cancelGame(ROOM_ID);
      expect(await rpsContract.isRoomAvailable(ROOM_ID)).to.be.false;
    });
  });

  describe("Room Stats", function () {
    beforeEach(async () => {
      await rpsContract.connect(player1).createGame(ROOM_ID);
      await rpsContract.connect(player2).joinGame(ROOM_ID);
    });

    it("Should return correct stats with no matches", async function () {
      const [totalMatches, p1, p2] = await rpsContract.getRoomStats(ROOM_ID);
      expect(totalMatches).to.equal(0);
      expect(p1).to.equal(player1.address);
      expect(p2).to.equal(player2.address);
    });

    it("Should return correct stats with matches", async function () {
      await rpsContract.connect(player1).publishMatch(
        ROOM_ID,
        player1.address,
        "rock",
        "scissors"
      );

      await rpsContract.connect(player2).publishMatch(
        ROOM_ID,
        player2.address,
        "paper",
        "rock"
      );

      const [totalMatches, p1, p2] = await rpsContract.getRoomStats(ROOM_ID);
      expect(totalMatches).to.equal(2);
      expect(p1).to.equal(player1.address);
      expect(p2).to.equal(player2.address);
    });
  });

  describe("Match History", function () {
    beforeEach(async () => {
      await rpsContract.connect(player1).createGame(ROOM_ID);
      await rpsContract.connect(player2).joinGame(ROOM_ID);
    });

    it("Should return empty array for new game", async function () {
      const matches = await rpsContract.getMatchHistory(ROOM_ID);
      expect(matches.length).to.equal(0);
    });

    it("Should return all matches in order", async function () {
      await rpsContract.connect(player1).publishMatch(
        ROOM_ID,
        player1.address,
        "rock",
        "scissors"
      );

      await rpsContract.connect(player2).publishMatch(
        ROOM_ID,
        player2.address,
        "paper",
        "rock"
      );

      await rpsContract.connect(player1).publishMatch(
        ROOM_ID,
        ethers.ZeroAddress,
        "rock",
        "rock"
      );

      const matches = await rpsContract.getMatchHistory(ROOM_ID);
      expect(matches.length).to.equal(3);
      expect(matches[0].winner).to.equal(player1.address);
      expect(matches[1].winner).to.equal(player2.address);
      expect(matches[2].winner).to.equal(ethers.ZeroAddress);
    });

    it("Should include timestamps for each match", async function () {
      await rpsContract.connect(player1).publishMatch(
        ROOM_ID,
        player1.address,
        "rock",
        "scissors"
      );

      const matches = await rpsContract.getMatchHistory(ROOM_ID);
      expect(matches[0].timestamp).to.be.gt(0);
    });
  });
});
