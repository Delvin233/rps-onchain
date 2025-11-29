# 📱 MiniApp Integration Guide

## Overview

RPS-onChain supports three MiniApp platforms with platform-specific optimizations:
- **Base App** (Base network only)
- **MiniPay** (Celo network only) 
- **Farcaster** (Both networks)

## Platform Detection & Auto-Connect

### Implementation
```tsx
// app/page.tsx
const isMiniPay = typeof window !== "undefined" && window.ethereum?.isMiniPay;
const isBaseApp = typeof window !== "undefined" && window.ethereum?.isBaseApp;
const { context } = useFarcaster();
const isFarcaster = !!context;
```

### Auto-Connect Logic
- **MiniPay**: Auto-connects on page load
- **Base App**: Auto-connects via BaseAppReady component
- **Farcaster**: Auto-connects when context available

## Network Restrictions

### Configuration (`scaffold.config.ts`)
```tsx
const getTargetNetworks = (): readonly Chain[] => {
  if (typeof window !== "undefined") {
    if (window.ethereum?.isBaseApp) return [base];
    if (window.ethereum?.isMiniPay) return [celo];
  }
  return [celo, base]; // Farcaster + Web
};
```

### Matchmaking Pools
- **Base Network**: All platforms can match
- **Celo Network**: Excludes Base app users (Base app can't access Celo)

## Custom MiniApp UI

### MiniAppAccount Component
Provides platform-specific wallet UI alongside AppKit:

```tsx
// components/MiniAppAccount.tsx
const getPlatformColors = () => {
  switch (platform) {
    case "farcaster": return "border-purple-500/30 bg-purple-500/10";
    case "base": return "border-blue-500/30 bg-blue-500/10";
    case "minipay": return "border-green-500/30 bg-green-500/10";
  }
};
```

### Features
- ✅ Loading states for connection/balance
- ✅ Network switching (Farcaster only)
- ✅ Address copying with toast feedback
- ✅ Click-outside menu closing
- ✅ Platform-specific colors

## Base App Integration

### CSP Headers (`layout.tsx`)
```tsx
export const metadata = {
  other: {
    "Content-Security-Policy": "frame-ancestors 'self' https://*.base.org https://wallet.base.org",
  }
};
```

### Splash Screen Fix
```tsx
// components/BaseAppReady.tsx
useEffect(() => {
  if (typeof window !== "undefined" && window.ethereum?.isBaseApp) {
    import("@coinbase/onchainkit/wallet").then(({ sdk }) => {
      sdk.actions.ready();
    });
  }
}, []);
```

## Farcaster Integration

### Manifest (`app/.well-known/farcaster.json/route.ts`)
```json
{
  "version": "1",
  "imageUrl": "https://www.rpsonchain.xyz/images/frame-preview.png",
  "button": {
    "title": "Play RPS",
    "action": {
      "type": "launch_miniapp",
      "name": "RPS-onChain",
      "url": "https://www.rpsonchain.xyz"
    }
  }
}
```

### Provider Setup
```tsx
// app/layout.tsx
<FarcasterProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</FarcasterProvider>
```

## Performance Optimizations

### Dynamic Imports
```tsx
// layout.tsx
const CRTEffect = dynamic(() => import("~~/components/CRTEffect"));
const OverlayProvider = dynamic(() => import("~~/components/overlays/OverlayManager"));
```

### Conditional Loading
- Components only load when needed
- Platform-specific features lazy-loaded
- Network calls optimized per platform

### Memory Management
- Event listeners properly cleaned up
- useEffect dependencies optimized
- Refs used for DOM manipulation

## Testing Checklist

### Base App
- [ ] Auto-connects without user interaction
- [ ] Only shows Base network
- [ ] Splash screen disappears after ready()
- [ ] CSP headers allow embedding

### MiniPay
- [ ] Auto-connects to Celo wallet
- [ ] Only shows Celo network
- [ ] Green platform styling applied
- [ ] Works in MiniPay browser

### Farcaster
- [ ] Detects Farcaster context
- [ ] Shows both networks with switching
- [ ] Purple platform styling applied
- [ ] Manifest loads correctly

### Cross-Platform
- [ ] Network-based matchmaking works
- [ ] Base users can't join Celo rooms
- [ ] Celo users can join Base rooms
- [ ] UI adapts to each platform

## Deployment Notes

### Environment Variables
```env
NEXT_PUBLIC_URL="https://www.rpsonchain.xyz"
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="your_project_id"
```

### Vercel Configuration
- CSP headers configured for Base app embedding
- Edge Config for verification storage
- Analytics enabled for usage tracking

## Troubleshooting

### Common Issues
1. **Splash screen stuck**: Ensure `sdk.actions.ready()` is called
2. **Network switching fails**: Check platform restrictions
3. **Auto-connect not working**: Verify platform detection logic
4. **Styling issues**: Confirm platform colors are applied

### Debug Tools
```tsx
// Add to any component for debugging
console.log({
  isMiniPay: window.ethereum?.isMiniPay,
  isBaseApp: window.ethereum?.isBaseApp,
  farcasterContext: context,
  currentChain: chain?.name
});
```

## Future Enhancements

- [ ] Platform-specific analytics
- [ ] Enhanced error handling per platform
- [ ] Platform-specific game features
- [ ] Deep linking support
- [ ] Push notifications (where supported)