// Edge Config client for verification storage
export async function updateEdgeConfig(key: string, value: any) {
  if (!process.env.EDGE_CONFIG_ID || !process.env.VERCEL_API_TOKEN) {
    console.warn("Edge Config not configured, skipping update");
    return false;
  }

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

    return response.ok;
  } catch (error) {
    console.error("Edge Config update failed:", error);
    return false;
  }
}
