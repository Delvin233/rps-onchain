# Migration Guide

This guide explains the user data migration system and how to troubleshoot common issues.

## Overview

The migration system moves user data from IPFS to Redis with the following improvements:

- **Size limits**: Handles Upstash's 10MB request limit through intelligent chunking
- **Data cleaning**: Removes unnecessary fields to reduce storage size
- **Error handling**: Gracefully handles oversized or corrupted data
- **Monitoring**: Provides detailed logging and status endpoints

## Migration Process

### 1. Data Sources

- **Primary**: Existing Redis data (if available)
- **Fallback**: IPFS data via `/api/user-matches`

### 2. Data Processing

- Separates AI vs multiplayer matches
- Calculates comprehensive statistics
- Limits to last 500 matches to prevent excessive storage
- Cleans match data by removing large/unnecessary fields

### 3. Chunking Strategy

- **Batch size**: 10 matches per batch
- **Match size limit**: 100KB per match
- **Processing**: Individual matches are validated and cleaned
- **Fallback**: If batch fails, tries individual pushes

## API Endpoints

### Migration

```bash
# Migrate user data
POST /api/migrate-user
{
  "address": "0x..."
}

# Or via GET
GET /api/migrate-user?address=0x...
```

### Status Check

```bash
# Check migration status
GET /api/migration-status?address=0x...
```

Response:

```json
{
  "address": "0x...",
  "migrated": true,
  "stats": { ... },
  "matchCount": 150,
  "estimatedDataSize": "19.89 KB",
  "sampleSize": 5
}
```

### Reset Migration

```bash
# Clear migrated data (for testing)
POST /api/reset-migration
{
  "address": "0x..."
}
```

## Troubleshooting

### Error: "max request size exceeded"

This error occurs when trying to send more than 10MB to Upstash Redis.

**Solution**: The updated migration code handles this automatically by:

- Processing data in small batches (10 matches)
- Skipping oversized matches (>100KB)
- Cleaning unnecessary data fields
- Using individual pushes as fallback

### Large Match Data

Some matches may contain excessive debug data or metadata.

**Automatic cleaning removes**:

- `metadata` field
- `rawData` field
- `debug` field
- `fullHistory` field
- `logs` field
- Truncates long text fields

### Migration Fails Partially

If some matches fail to migrate:

- Check logs for specific error messages
- Use `/api/migration-status` to see what was processed
- Large matches are automatically skipped with warnings

### Testing Migration

```bash
# Run the test script to verify chunking
cd packages/nextjs
node scripts/test-migration.js
```

## Data Limits

### Upstash Redis Limits

- **Request size**: 10MB maximum
- **Key size**: 512MB maximum
- **Value size**: 512MB maximum

### Our Limits

- **Matches per user**: 500 (most recent)
- **Match size**: 100KB maximum
- **Batch size**: 10 matches
- **Processing delay**: 100ms between batches

## Monitoring

### Logs

Migration logs include:

- Total matches being processed
- Data size information
- Batch processing status
- Skipped matches with reasons
- Final statistics

### Example Log Output

```
[Migration] Processing 155 matches for 0x... (original: 200, size: 8.52 MB)
[Migration] Skipping oversized match for 0x...: 1.7 MB
[Migration] Completed for 0x...: 150 processed, 5 skipped, 150 stored in Redis
```

## Best Practices

### For Development

1. Use `/api/reset-migration` to clear test data
2. Monitor logs during migration testing
3. Check `/api/migration-status` after migration
4. Test with various data sizes

### For Production

1. Migration is idempotent (safe to run multiple times)
2. Existing clean data is preserved
3. Only processes when needed
4. Graceful error handling prevents data loss

## Data Structure

### Stats Object

```json
{
  "totalGames": 150,
  "wins": 75,
  "losses": 60,
  "ties": 15,
  "winRate": 50,
  "ai": {
    "totalGames": 100,
    "wins": 60,
    "losses": 35,
    "ties": 5,
    "winRate": 60
  },
  "multiplayer": {
    "totalGames": 50,
    "wins": 15,
    "losses": 25,
    "ties": 10,
    "winRate": 30
  }
}
```

### Match Object (Cleaned)

```json
{
  "id": "match-123",
  "timestamp": 1640995200000,
  "result": "win",
  "opponent": "AI",
  "moves": ["rock", "paper"],
  "roomId": "room-456"
}
```

## Recovery

If migration fails completely:

1. Check Upstash Redis status
2. Verify network connectivity
3. Check for API rate limits
4. Use `/api/reset-migration` to clear partial data
5. Retry migration

The system is designed to be resilient and will skip problematic data rather than fail completely.
