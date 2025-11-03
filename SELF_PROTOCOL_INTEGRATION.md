# Self Protocol Integration

This document outlines the Self Protocol integration in the RPS-OnChain game, providing human identity verification alongside wallet connections.

## Overview

Self Protocol provides privacy-preserving identity verification using government-issued IDs like passports. This integration offers:

- **Human Verification**: Users can prove they are real humans using their passport/ID
- **Anti-Sybil Protection**: Prevents bots and fake accounts from playing
- **Privacy-First**: Uses zero-knowledge proofs to verify identity without revealing personal data

## Implementation

### Core Components

1. **useSelfProtocol Hook** (`hooks/useSelfProtocol.ts`)
   - Manages Self Protocol connection state
   - Handles authentication flow
   - Provides ethers provider for blockchain interactions

2. **AuthContext** (`contexts/AuthContext.tsx`)
   - Unified authentication state management
   - Supports both wallet and Self Protocol authentication
   - Provides consistent interface across the app

3. **SelfQRCode Component** (`components/SelfQRCode.tsx`)
   - Generates QR codes for Self Protocol authentication
   - Handles mobile app integration

### Key Features

- **Dual Authentication**: Users can sign in with either wallet or Self Protocol
- **State Management**: Unified authentication state across the application
- **Provider Integration**: Self Protocol provides ethers-compatible provider
- **Seamless UX**: Identical game experience regardless of authentication method

### Files Modified

- `app/page.tsx` - Updated to use unified auth context
- `app/play/page.tsx` - Updated to use unified auth context  
- `app/game/[roomId]/page.tsx` - Updated to use unified auth context
- `components/ScaffoldEthAppWithProviders.tsx` - Added AuthProvider

### Dependencies Added

```json
{
  "@selfxyz/core": "^1.1.0-beta.7",
  "@selfxyz/qrcode": "^1.0.15",
  "ethers": "^6.15.0"
}
```

## Usage

### For Users

1. **Wallet Sign-In**: Traditional MetaMask/wallet connection
2. **Self Protocol Sign-In**: Click "Sign In with Self" button
   - Mobile users can scan QR code
   - Desktop users can use Self Protocol wallet

### For Developers

```typescript
// Use the unified auth context
import { useAuth } from "~~/contexts/AuthContext";

function MyComponent() {
  const { isAuthenticated, address, authMethod, connectSelf } = useAuth();
  
  // Check authentication status
  if (!isAuthenticated) {
    return <SignInButtons />;
  }
  
  // Use address for blockchain interactions
  console.log("User address:", address);
  console.log("Auth method:", authMethod); // "wallet" | "self"
}
```

## Configuration

### Environment Variables

No additional environment variables required for basic Self Protocol integration.

### Network Support

Self Protocol integration supports the same networks as the main application:
- Celo Mainnet
- Optimism
- Arbitrum
- Polygon
- Base

## Testing

### Manual Testing

1. Start the development server: `yarn start`
2. Navigate to the home page
3. Click "Sign In with Self" button
4. Verify authentication flow works
5. Test game functionality with Self Protocol authentication

### Test Component

A test component is available at `components/SelfProtocolTest.tsx` for isolated testing of Self Protocol functionality.

## Security Considerations

- Self Protocol handles private key management
- Ethers provider is created from Self Protocol's secure provider
- All blockchain interactions use the same security model as wallet connections
- No additional security risks compared to traditional wallet connections

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all imports use the correct `~~/` prefix
2. **Provider Issues**: Verify Self Protocol provider is properly initialized
3. **Network Mismatch**: Ensure Self Protocol is configured for the correct network

### Debug Mode

Enable debug logging by adding to your component:

```typescript
useEffect(() => {
  console.log("Auth state:", { isAuthenticated, address, authMethod });
}, [isAuthenticated, address, authMethod]);
```

## Future Enhancements

- QR code integration for mobile authentication
- Enhanced error handling and user feedback
- Support for additional Self Protocol features
- Integration with Self Protocol's advanced authentication flows

## Support

For Self Protocol specific issues:
- [Self Protocol Documentation](https://docs.self.xyz)
- [Self Protocol GitHub](https://github.com/selfxyz)

For integration issues within this project:
- Check the console for error messages
- Verify all dependencies are installed
- Ensure proper import paths are used