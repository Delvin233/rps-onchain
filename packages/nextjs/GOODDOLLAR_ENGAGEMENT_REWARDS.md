# Good Dollar Engagement Rewards Integration

This document explains how the Good Dollar engagement rewards system is integrated into your RPS OnChain application.

## Overview

The engagement rewards system provides additional G$ tokens to users based on their participation and engagement with the Good Dollar ecosystem. This is implemented using the official `@goodsdks/engagement-sdk`.

## Features Implemented

### 1. Daily UBI Claims with Engagement Tracking

- Users can claim their daily UBI as before
- The system now tracks consecutive days, total claims, and other engagement metrics
- Local storage is used to maintain engagement statistics

### 2. Engagement Rewards Claims

- Users can claim additional rewards based on their engagement
- Requires registration with the Good Dollar engagement system
- Uses official Good Dollar SDK for secure claim processing

### 3. Social Sharing Rewards

- Users can share their UBI claims on social platforms
- Tracks social shares and provides small rewards
- Supports Twitter, Farcaster, and Telegram

### 4. Streak and Milestone Tracking

- Weekly streak bonuses for consecutive daily claims
- Milestone rewards for reaching claim targets (10, 30 claims)
- Visual progress indicators in the UI

## Technical Implementation

### Hook: `useGoodDollarClaim`

Located at: `packages/nextjs/hooks/useGoodDollarClaim.ts`

**Key Functions:**

- `claimWithEngagementRewards()` - Enhanced claim function that includes engagement rewards
- `checkEngagementEligibility()` - Checks if user can claim engagement rewards
- `checkEngagementRegistration()` - Checks if user is registered for engagement rewards
- `getEngagementStats()` - Retrieves user's engagement statistics
- `shareReward()` - Processes social sharing rewards

### Component: `EngagementRewards`

Located at: `packages/nextjs/components/EngagementRewards.tsx`

**Features:**

- Displays engagement statistics (streak, total claims)
- Shows available rewards and progress
- Provides social sharing buttons
- Engagement rewards claim button (when eligible)

### API Endpoint: `/api/gooddollar/sign-claim`

Located at: `packages/nextjs/app/api/gooddollar/sign-claim/route.ts`

**Purpose:**

- Signs engagement reward claims using your app's private key
- Required for the official Good Dollar engagement rewards flow
- Validates requests and provides app signatures

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Good Dollar Engagement Rewards Configuration
NEXT_PUBLIC_GOODDOLLAR_APP_ADDRESS="0x..." # Your app's address registered with Good Dollar
GOODDOLLAR_APP_PRIVATE_KEY="0x..." # Your app's private key for signing claims
NEXT_PUBLIC_GOODDOLLAR_INVITER_ADDRESS="0x..." # Inviter address (can be same as app address)
GOODDOLLAR_REWARDS_CONTRACT="0x..." # Good Dollar rewards contract address
```

## Setup Instructions

### 1. Get Good Dollar App Registration

Contact the Good Dollar team to:

- Register your app for engagement rewards
- Get your app address and private key
- Get the rewards contract address
- Set up your inviter address

### 2. Configure Environment Variables

Update your `.env.local` file with the values provided by Good Dollar.

### 3. Test the Integration

1. Connect a wallet to your app
2. Claim daily UBI to build engagement stats
3. Check if engagement rewards become available
4. Test social sharing functionality

## User Flow

### First Time Users

1. User connects wallet and claims UBI
2. System tracks engagement locally
3. User needs to register for engagement rewards (happens automatically on first engagement claim)
4. User can then claim engagement rewards when eligible

### Returning Users

1. User claims daily UBI
2. Engagement stats are updated (streak, total claims)
3. If eligible, user can claim additional engagement rewards
4. Social sharing provides small bonus rewards

## Security Considerations

### Private Key Management

- Your app's private key is used to sign engagement reward claims
- Keep this key secure and never expose it in frontend code
- Consider using environment-specific keys for development/production

### Rate Limiting

- The signing endpoint should implement rate limiting in production
- Monitor for unusual signing request patterns
- Log all signature requests for auditing

### Validation

- All user inputs are validated before processing
- Engagement eligibility is checked on-chain
- App signatures are only provided for valid requests

## Troubleshooting

### Common Issues

1. **"Engagement rewards SDK not initialized"**

   - Check that all environment variables are set correctly
   - Verify the rewards contract address is valid

2. **"User not eligible to claim engagement rewards"**

   - User may not be registered yet
   - Check if user meets eligibility requirements
   - Verify app is properly registered with Good Dollar

3. **"Failed to get app signature"**
   - Check that the signing API endpoint is working
   - Verify app private key is correct
   - Check network connectivity to your backend

### Debug Mode

Set `NODE_ENV=development` to see detailed error logs in the console.

## Integration with Existing UBI Claims

The engagement rewards system is designed to work alongside your existing UBI claims:

- Regular UBI claims continue to work as before
- Engagement rewards are additional bonuses
- Both systems share the same user interface
- Engagement stats are tracked regardless of engagement reward eligibility

## Future Enhancements

Potential improvements to consider:

1. **Backend Storage**: Move engagement stats from localStorage to a database
2. **Advanced Analytics**: Track more detailed engagement metrics
3. **Referral System**: Implement user referral rewards
4. **Gamification**: Add more engagement challenges and rewards
5. **Cross-Platform Sync**: Sync engagement stats across devices

## Support

For issues with the Good Dollar integration:

1. Check the Good Dollar documentation
2. Contact the Good Dollar team for app-specific issues
3. Review the official SDK documentation at `@goodsdks/engagement-sdk`

## Dependencies

- `@goodsdks/engagement-sdk` - Official Good Dollar engagement rewards SDK
- `@goodsdks/citizen-sdk` - Good Dollar citizen SDK (already installed)
- `viem` - Ethereum client library
- `wagmi` - React hooks for Ethereum
