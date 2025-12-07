# AI Leaderboards Deployment Checklist

## Pre-Deployment

### Database Setup

- [ ] **Verify Turso database connection**
  ```bash
  # Test connection
  curl -X POST https://your-app.vercel.app/api/test-db
  ```

- [ ] **Create ai_leaderboards table**
  - The table will be created automatically on first API call via `initAILeaderboardsTable()`
  - Or manually run the SQL:
  ```sql
  CREATE TABLE IF NOT EXISTS ai_leaderboards (
    address TEXT PRIMARY KEY,
    wins INTEGER NOT NULL DEFAULT 0,
    rank TEXT NOT NULL,
    display_name TEXT,
    updated_at INTEGER NOT NULL
  );
  
  CREATE INDEX IF NOT EXISTS idx_wins ON ai_leaderboards(wins DESC);
  CREATE INDEX IF NOT EXISTS idx_rank ON ai_leaderboards(rank);
  ```

### Environment Variables

- [ ] **Verify all required environment variables are set in Vercel:**
  - `TURSO_DATABASE_URL` - Turso database URL ✅ Required
  - `TURSO_AUTH_TOKEN` - Turso authentication token ✅ Required
  - `NEXT_PUBLIC_URL` - Your app's public URL ✅ Required
  - `NEYNAR_API_KEY` - For Farcaster username resolution ✅ **Already configured**

### Code Review

- [ ] **Run all tests**
  ```bash
  yarn test
  ```

- [ ] **Type checking passes**
  ```bash
  yarn check-types
  ```

- [ ] **Linting passes**
  ```bash
  yarn lint
  ```

- [ ] **Build succeeds**
  ```bash
  yarn build
  ```

## Deployment Steps

### 1. Deploy to Vercel

- [ ] **Push to main branch**
  ```bash
  git push origin feature/ai-leaderboards
  # Create PR and merge to main
  ```

- [ ] **Verify deployment succeeds**
  - Check Vercel dashboard for successful deployment
  - No build errors
  - All environment variables loaded

### 2. Database Initialization

- [ ] **Initialize tables**
  - Tables auto-initialize on first API call
  - Or manually trigger via API endpoint

- [ ] **Verify table creation**
  ```bash
  # Check Turso dashboard or run query
  SELECT name FROM sqlite_master WHERE type='table' AND name='ai_leaderboards';
  ```

### 3. Data Migration

- [ ] **Run migration to populate existing players**
  ```bash
  curl -X POST https://your-app.vercel.app/api/leaderboard/ai/migrate
  ```

- [ ] **Verify migration results**
  ```json
  {
    "success": true,
    "total": 150,
    "migrated": 150,
    "skipped": 0,
    "errors": 0,
    "message": "Migration complete: 150 migrated, 0 skipped, 0 errors"
  }
  ```

- [ ] **Check migrated data**
  ```bash
  curl https://your-app.vercel.app/api/leaderboard/ai?limit=10
  ```

## Post-Deployment Verification

### Functional Testing

- [ ] **Test leaderboard page loads**
  - Visit `/leaderboards/ai`
  - Verify entries display correctly
  - Check pagination works

- [ ] **Test player rank display**
  - Visit home page
  - Verify AI Rank card shows correct rank
  - Check glowing border appears

- [ ] **Test AI match integration**
  - Play an AI match and win
  - Verify leaderboard updates
  - Check rank-up notification appears (if applicable)

- [ ] **Test name resolution**
  - Check if ENS/Basename names display
  - Verify fallback to truncated addresses works

### Performance Testing

- [ ] **Check API response times**
  - Leaderboard endpoint: < 500ms
  - Player rank endpoint: < 300ms
  - Update endpoint: < 1000ms

- [ ] **Verify caching works**
  - Second request should be faster
  - Check cache headers

- [ ] **Test with load**
  - Multiple concurrent requests
  - No rate limit errors for normal usage

### UI/UX Testing

- [ ] **Desktop testing**
  - Chrome, Firefox, Safari
  - All features work correctly
  - Animations smooth

- [ ] **Mobile testing**
  - iOS Safari
  - Android Chrome
  - Responsive layout works
  - Touch interactions work

- [ ] **Farcaster Mini App testing**
  - Test in Warpcast
  - Test in Base app
  - Verify context integration

## Monitoring Setup

### Error Tracking

- [ ] **Set up error monitoring**
  - Vercel Analytics enabled
  - Error logs accessible
  - Alert thresholds configured

- [ ] **Monitor API errors**
  ```bash
  # Check Vercel logs for errors
  vercel logs --follow
  ```

### Performance Monitoring

- [ ] **Track key metrics**
  - API response times
  - Database query performance
  - Cache hit rates
  - User engagement (leaderboard views)

- [ ] **Set up alerts**
  - API error rate > 5%
  - Response time > 2s
  - Database connection failures

### Database Monitoring

- [ ] **Monitor database health**
  - Check Turso dashboard
  - Query performance
  - Storage usage
  - Connection pool status

## Rollback Plan

### If Issues Occur

1. **Identify the issue**
   - Check Vercel logs
   - Check database logs
   - Check user reports

2. **Quick fixes**
   - Disable feature flag (if implemented)
   - Revert to previous deployment
   - Fix and redeploy

3. **Database rollback**
   - Keep migration script for re-running
   - Backup data before major changes
   - Can drop and recreate table if needed

## Post-Launch Tasks

### Week 1

- [ ] **Monitor daily**
  - Check error rates
  - Review user feedback
  - Track engagement metrics

- [ ] **Optimize based on data**
  - Adjust cache TTLs if needed
  - Optimize slow queries
  - Fix any bugs reported

### Week 2-4

- [ ] **Gather feedback**
  - User surveys
  - Analytics review
  - Performance analysis

- [ ] **Plan improvements**
  - Feature enhancements
  - Performance optimizations
  - Bug fixes

## Success Metrics

### Launch Goals

- [ ] **Zero critical errors** in first 24 hours
- [ ] **< 1% error rate** for API endpoints
- [ ] **> 80% of existing players** migrated successfully
- [ ] **< 500ms average** API response time
- [ ] **Positive user feedback** on social channels

### Engagement Metrics

- [ ] Track leaderboard page views
- [ ] Track rank-up notifications
- [ ] Track AI match completion rate
- [ ] Track user retention

## Troubleshooting

### Common Issues

**Issue: Migration fails**
- Check database connection
- Verify stats table has data
- Check for duplicate entries
- Review error logs

**Issue: Names not resolving**
- Check RPC endpoints
- Verify network connectivity
- Check rate limits
- Review cache settings

**Issue: Slow API responses**
- Check database indexes
- Review query performance
- Verify caching is working
- Check network latency

**Issue: Rank not updating**
- Check rate limiting (10s cooldown)
- Verify API endpoint is called
- Check database write permissions
- Review error logs

## Support Contacts

- **Database Issues**: Turso support
- **Deployment Issues**: Vercel support
- **Code Issues**: Development team
- **User Issues**: Support team

## Documentation Links

- [AI Leaderboards Documentation](./AI_LEADERBOARDS.md)
- [API Documentation](./API.md)
- [Rank System](./RANK_SYSTEM.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Deployment Status**: ⬜ Success ⬜ Issues ⬜ Rolled Back

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________
