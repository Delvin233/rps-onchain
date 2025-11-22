import type { GameData, Move } from "./types";

export class NetworkSync {
  private roomId: string;
  private playerAddress: string;
  private pollingInterval: number;
  private pollTimer?: NodeJS.Timeout;
  private isPolling = false;

  constructor(roomId: string, playerAddress: string, pollingInterval = 1500) {
    this.roomId = roomId;
    this.playerAddress = playerAddress;
    this.pollingInterval = pollingInterval;
  }

  async submitMove(move: Move): Promise<{ success: boolean }> {
    const response = await fetch("/api/room/submit-move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: this.roomId,
        player: this.playerAddress,
        move,
      }),
    });

    return response.json();
  }

  async fetchGameStatus(): Promise<GameData | null> {
    try {
      const response = await fetch(`/api/room/status?roomId=${this.roomId}&player=${this.playerAddress}`);

      if (!response.ok) return null;

      return response.json();
    } catch (error) {
      console.error("Error fetching game status:", error);
      return null;
    }
  }

  async requestRematch(): Promise<void> {
    await fetch("/api/room/rematch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: this.roomId,
        player: this.playerAddress,
        action: "request",
      }),
    });
  }

  async acceptRematch(): Promise<void> {
    await fetch("/api/room/rematch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: this.roomId,
        player: this.playerAddress,
        action: "accept",
      }),
    });
  }

  async leaveRoom(): Promise<void> {
    await fetch("/api/room/rematch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: this.roomId,
        player: this.playerAddress,
        action: "leave",
      }),
    });
  }

  startPolling(callback: (data: GameData | null) => void): void {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollTimer = setInterval(async () => {
      const data = await this.fetchGameStatus();
      callback(data);
    }, this.pollingInterval);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    this.isPolling = false;
  }

  updatePollingInterval(interval: number): void {
    this.pollingInterval = interval;
    if (this.isPolling) {
      this.stopPolling();
      // Restart with new interval if callback exists
    }
  }
}
