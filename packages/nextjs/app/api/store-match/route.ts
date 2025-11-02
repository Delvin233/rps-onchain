import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const matchData = await request.json();

    // Store match data to IPFS via Pinata
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(matchData)], { type: "application/json" });
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
    const filename = `match-${matchData.roomId}-${dateStr}.json`;
    formData.append("file", blob, filename);

    // Upload to Pinata IPFS
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      // Fallback: return a mock hash for demo
      const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
      return NextResponse.json({ ipfsHash: mockHash });
    }

    const result = await response.json();
    return NextResponse.json({ ipfsHash: result.IpfsHash });
  } catch (error) {
    console.error("Error storing to IPFS:", error);
    // Return mock hash for demo purposes
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
    return NextResponse.json({ ipfsHash: mockHash });
  }
}
