/**
 * Test script to verify migration functionality
 * Run with: node scripts/test-migration.js
 */

// Inline formatBytes function for testing
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Simulate large match data
function createTestMatch(size = "normal") {
  const baseMatch = {
    id: Math.random().toString(36),
    timestamp: Date.now(),
    result: "win",
    opponent: "AI",
    moves: ["rock", "paper", "scissors"],
    roomId: "test-room",
  };

  if (size === "large") {
    // Add large data that might cause issues
    baseMatch.metadata = {
      largeArray: new Array(10000).fill("x".repeat(100)),
      debug: {
        logs: new Array(1000).fill("debug message ".repeat(50)),
        rawData: "x".repeat(50000),
      },
    };
  }

  return baseMatch;
}

// Test data size calculation
function testDataSizes() {
  console.log("Testing data sizes...\n");

  const normalMatch = createTestMatch("normal");
  const largeMatch = createTestMatch("large");

  const normalSize = JSON.stringify(normalMatch).length;
  const largeSize = JSON.stringify(largeMatch).length;

  console.log(`Normal match size: ${formatBytes(normalSize)}`);
  console.log(`Large match size: ${formatBytes(largeSize)}`);

  // Test batch sizes
  const normalBatch = new Array(100).fill(normalMatch);
  const largeBatch = new Array(10).fill(largeMatch);

  const normalBatchSize = JSON.stringify(normalBatch).length;
  const largeBatchSize = JSON.stringify(largeBatch).length;

  console.log(`\nBatch sizes:`);
  console.log(`100 normal matches: ${formatBytes(normalBatchSize)}`);
  console.log(`10 large matches: ${formatBytes(largeBatchSize)}`);

  // Check against Upstash limit (10MB)
  const upstashLimit = 10 * 1024 * 1024; // 10MB
  console.log(`\nUpstash limit: ${formatBytes(upstashLimit)}`);
  console.log(`Normal batch within limit: ${normalBatchSize < upstashLimit}`);
  console.log(`Large batch within limit: ${largeBatchSize < upstashLimit}`);
}

// Test chunking strategy
function testChunkingStrategy() {
  console.log("\n--- Testing Chunking Strategy ---\n");

  // Simulate a mix of normal and large matches
  const matches = [
    ...new Array(50).fill(null).map(() => createTestMatch("normal")),
    ...new Array(5).fill(null).map(() => createTestMatch("large")),
    ...new Array(100).fill(null).map(() => createTestMatch("normal")),
  ];

  console.log(`Total matches: ${matches.length}`);
  console.log(`Total data size: ${formatBytes(JSON.stringify(matches).length)}`);

  // Simulate our chunking logic
  const BATCH_SIZE = 10;
  const MAX_MATCH_SIZE = 100000; // 100KB

  let processedCount = 0;
  let skippedCount = 0;
  let totalProcessedSize = 0;

  for (let i = 0; i < matches.length; i += BATCH_SIZE) {
    const batch = matches.slice(i, i + BATCH_SIZE);
    const validMatches = [];

    for (const match of batch) {
      const serialized = JSON.stringify(match);
      if (serialized.length > MAX_MATCH_SIZE) {
        skippedCount++;
        console.log(`Skipping oversized match: ${formatBytes(serialized.length)}`);
      } else {
        validMatches.push(serialized);
        processedCount++;
        totalProcessedSize += serialized.length;
      }
    }

    if (validMatches.length > 0) {
      const batchSize = validMatches.reduce((sum, match) => sum + match.length, 0);
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${validMatches.length} matches, ${formatBytes(batchSize)}`);
    }
  }

  console.log(`\nFinal Results:`);
  console.log(`Processed: ${processedCount} matches`);
  console.log(`Skipped: ${skippedCount} matches`);
  console.log(`Total processed size: ${formatBytes(totalProcessedSize)}`);
  console.log(`Average match size: ${formatBytes(totalProcessedSize / processedCount)}`);
}

if (require.main === module) {
  testDataSizes();
  testChunkingStrategy();
}

module.exports = { createTestMatch, testDataSizes };
