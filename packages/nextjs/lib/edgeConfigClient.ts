// Edge Config client for verification storage
export async function updateEdgeConfig(key: string, value: any, retries = 3) {
  if (!process.env.EDGE_CONFIG_ID || !process.env.VERCEL_API_TOKEN) {
    throw new Error("Edge Config not configured");
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ operation: "upsert", key, value }],
        }),
      });

      if (response.ok) return true;

      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    } catch (error) {
      console.error(`Edge Config update attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
    }
  }

  throw new Error("Edge Config update failed after retries");
}
