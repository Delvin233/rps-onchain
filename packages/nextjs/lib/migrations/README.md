# Database Migrations

This directory contains database migration scripts for the RPS OnChain application.

## Overview

Migrations are used to evolve the database schema over time while preserving existing data. Each migration is numbered sequentially and includes both forward migration and rollback capabilities.

## Available Migrations

### 001 - AI Matches Migration (`001_ai_matches_migration.ts`)

**Purpose**: Adds support for best-of-three AI matches by creating the `ai_matches` table and extending the `stats` table with match-level columns.

**Changes**:

- Creates `ai_matches` table for storing match data
- Adds match-level columns to `stats` table:
  - `ai_matches_played` - Total AI matches played
  - `ai_matches_won` - AI matches won by player
  - `ai_matches_lost` - AI matches lost by player
  - `ai_matches_tied` - AI matches that ended in a tie
  - `ai_matches_abandoned` - AI matches abandoned by player
- Creates performance indexes on the new table
- Preserves all existing player statistics and history

**Requirements**: 7.1, 7.3 (from best-of-three AI matches spec)

## Running Migrations

### Command Line Interface

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Verify database integrity
npm run migrate:verify

# Run specific migration
npm run migrate -- --migration 001

# Rollback specific migration (for testing)
npm run migrate -- --rollback 001

# Show help
npm run migrate -- --help
```

### API Endpoints

```bash
# Get migration status
GET /api/migrate/ai-matches

# Execute AI matches migration
POST /api/migrate/ai-matches

# Rollback AI matches migration (for testing)
DELETE /api/migrate/ai-matches
```

### Programmatic Usage

```typescript
import {
  executeAllMigrations,
  executeMigration,
  getMigrationsStatus
} from './migrationRunner';

// Run all pending migrations
const result = await executeAllMigrations();

// Run specific migration
const result = await executeMigration('001');

// Check status
const status = await getMigrationsStatus();
```

## Migration Safety

### Data Preservation

- All migrations are designed to preserve existing data
- New columns are added with appropriate default values
- Existing columns are never modified or removed
- Rollback capabilities are provided for testing

### Testing

- Comprehensive test suite in `__tests__/migrations/`
- Tests verify data integrity before and after migration
- Tests ensure proper schema changes
- Tests validate rollback functionality

### Verification

- Built-in integrity checks verify migration success
- Schema validation ensures all expected tables and columns exist
- Data validation ensures no NULL values in required columns

## Best Practices

1. **Always backup your database** before running migrations in production
2. **Test migrations thoroughly** in development environment first
3. **Run migrations during low-traffic periods** to minimize impact
4. **Monitor the migration process** and verify success
5. **Keep rollback scripts ready** in case of issues

## Migration Structure

Each migration file includes:

- `migrate*()` - Forward migration function
- `rollback*()` - Rollback migration function
- `get*Status()` - Status checking function
- Comprehensive error handling and logging
- Data integrity verification

## Troubleshooting

### Common Issues

1. **Migration already executed**: Check status with `npm run migrate:status`
2. **Schema verification failed**: Run `npm run migrate:verify` to see specific issues
3. **Data integrity issues**: Check logs for specific error messages

### Recovery

If a migration fails:

1. Check the error logs for specific issues
2. Verify database connectivity and permissions
3. Run integrity check: `npm run migrate:verify`
4. If needed, rollback and retry: `npm run migrate -- --rollback 001`

### Support

For migration issues:

1. Check the test suite for expected behavior
2. Review migration logs for error details
3. Verify database schema manually if needed
4. Contact development team for complex issues

## Development

### Adding New Migrations

1. Create new migration file: `00X_migration_name.ts`
2. Implement required functions: `migrate*()`, `rollback*()`, `get*Status()`
3. Add migration to `MIGRATIONS` array in `migrationRunner.ts`
4. Write comprehensive tests
5. Update this README

### Testing Migrations

```bash
# Run migration tests
npm test -- migrations

# Run specific migration test
npm test -- aiMatchesMigration.test.ts
```

Tests should cover:

- Successful migration execution
- Data preservation
- Schema changes
- Rollback functionality
- Error handling
- Edge cases (empty tables, existing data, etc.)
