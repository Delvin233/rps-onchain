// Share utilities
export type ShareType = "room-code" | "match-result" | "room-history";

// Generate room code share text
export function generateRoomCodeShare(roomId: string, data?: { winStreak?: number }): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://rpsonchain.xyz";

  const winStreakText =
    data?.winStreak && data.winStreak > 1
      ? `I'm on a ${data.winStreak}-game win streak!\nThink you can end it? `
      : "Think you can beat me at RPS?\n";

  return `${winStreakText}Join room ${roomId} and prove it!\n${baseUrl}/play/multiplayer?join=${roomId}`;
}

// Generate match result share text
export function generateMatchResultShare(data: {
  winner?: string;
  player1Move?: string;
  player2Move?: string;
  player1Name?: string;
  player2Name?: string;
  roomId: string;
  matchId?: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://rpsonchain.xyz";

  const isWin = data.winner === data.player1Name;
  const moveAbbr = data.player1Move === "rock" ? "R" : data.player1Move === "paper" ? "P" : "S";
  const resultText = isWin
    ? `Just crushed ${data.player2Name || "opponent"} with ${data.player1Move} (${moveAbbr})!`
    : `Good game against ${data.player2Name || "opponent"}!`;

  return `${resultText}\nYour turn to challenge me!\n${baseUrl}/share/match/${data.roomId}/${data.matchId}`;
}

// Generate room history share text
export function generateRoomHistoryShare(
  roomId: string,
  data?: { totalMatches?: number; player1Name?: string; player2Name?: string },
): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://rpsonchain.xyz";

  const matchText = data?.totalMatches ? `${data.totalMatches}-match` : "epic";
  const playersText = data?.player1Name && data?.player2Name ? `\n${data.player1Name} vs ${data.player2Name}` : "";

  return `Epic ${matchText} battle!${playersText}\nCheck out the full history:\n${baseUrl}/share/room/${roomId}`;
}

// Generate shareable URL
export function generateShareUrl(type: ShareType, roomId: string, matchId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://rpsonchain.xyz";

  switch (type) {
    case "room-code":
      return `${baseUrl}/play/multiplayer?join=${roomId}`;
    case "match-result":
      return `${baseUrl}/share/match/${roomId}/${matchId}`;
    case "room-history":
      return `${baseUrl}/share/room/${roomId}`;
    default:
      return `${baseUrl}/play/multiplayer?join=${roomId}`;
  }
}

// Get share text with URL
export function getShareContent(
  type: ShareType,
  roomId: string,
  matchId?: string,
  data?: any,
): { title: string; text: string; url: string } {
  const url = generateShareUrl(type, roomId, matchId);

  switch (type) {
    case "room-code":
      return {
        title: "Join my RPS game!",
        text: generateRoomCodeShare(roomId, data),
        url,
      };
    case "match-result":
      return {
        title: "RPS Match Result",
        text: generateMatchResultShare({ ...data, roomId, matchId }),
        url,
      };
    case "room-history":
      return {
        title: "Epic RPS Battle History",
        text: generateRoomHistoryShare(roomId, data),
        url,
      };
    default:
      return {
        title: "RPS-onChain",
        text: "Join me for Rock Paper Scissors!",
        url,
      };
  }
}
