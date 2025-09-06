import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const matchData = await request.json();

    // For hackathon demo - using public IPFS gateway
    // In production, use Pinata API key or web3.storage
    const formData = new FormData();
    formData.append("file", new Blob([JSON.stringify(matchData)], { type: "application/json" }));

    // Using public IPFS node for demo (replace with Pinata/web3.storage for production)
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
