// Filecoin Calibration Testnet integration
import { ethers } from "ethers";

export interface FilecoinStorageResult {
  cid: string;
  dealId?: string;
  provider: "filecoin" | "pinata" | "demo";
  txHash?: string;
}

// Filecoin storage contract ABI (simplified)
const STORAGE_CONTRACT_ABI = [
  "function storeData(bytes calldata data) external payable returns (uint256)",
  "function retrieveData(uint256 dealId) external view returns (bytes memory)",
  "event DataStored(uint256 indexed dealId, string cid, address indexed client)"
];

// Mock Filecoin storage contract address on Calibration testnet
const STORAGE_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

export class FilecoinClient {
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Wallet;
  private contract?: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_FILECOIN_RPC || "https://api.calibration.node.glif.io/rpc/v1"
    );
    
    if (process.env.FILECOIN_PRIVATE_KEY) {
      this.signer = new ethers.Wallet(process.env.FILECOIN_PRIVATE_KEY, this.provider);
      this.contract = new ethers.Contract(STORAGE_CONTRACT_ADDRESS, STORAGE_CONTRACT_ABI, this.signer);
    }
  }

  async storeMatchRecord(matchData: any): Promise<FilecoinStorageResult> {
    try {
      // Try Filecoin first
      if (this.contract && this.signer) {
        const dataBytes = ethers.toUtf8Bytes(JSON.stringify(matchData));
        const tx = await this.contract.storeData(dataBytes, {
          value: ethers.parseEther("0.001") // Small payment for storage
        });
        
        const receipt = await tx.wait();
        const event = receipt.logs.find((log: any) => log.fragment?.name === "DataStored");
        
        if (event) {
          return {
            cid: event.args.cid,
            dealId: event.args.dealId.toString(),
            provider: "filecoin",
            txHash: receipt.hash
          };
        }
      }

      // Fallback to SynapseSDK simulation
      return await this.storeBySynapseSDK(matchData);
    } catch (error) {
      console.error("Filecoin storage failed:", error);
      // Final fallback to demo mode
      return this.generateDemoResult(matchData);
    }
  }

  private async storeBySynapseSDK(matchData: any): Promise<FilecoinStorageResult> {
    try {
      // Simulate SynapseSDK call
      const response = await fetch("https://api.synapse.storage/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SYNAPSE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(matchData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          cid: result.cid,
          dealId: result.dealId,
          provider: "filecoin"
        };
      }
      
      throw new Error("SynapseSDK failed");
    } catch (error) {
      console.log("SynapseSDK failed, using demo mode");
      return this.generateDemoResult(matchData);
    }
  }

  private generateDemoResult(matchData: any): FilecoinStorageResult {
    // Generate deterministic CID for demo
    const hashInput = `${matchData.roomId}-${matchData.result.timestamp}`;
    const mockCid = `bafybeig${Buffer.from(hashInput).toString('hex').substring(0, 52)}`;
    
    return {
      cid: mockCid,
      dealId: Math.floor(Math.random() * 1000000).toString(),
      provider: "demo"
    };
  }

  async retrieveMatchRecord(cid: string): Promise<any | null> {
    try {
      // Try retrieving from Filecoin/IPFS
      const response = await fetch(`https://dweb.link/ipfs/${cid}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Failed to retrieve from Filecoin:", error);
      return null;
    }
  }
}

export const filecoinClient = new FilecoinClient();