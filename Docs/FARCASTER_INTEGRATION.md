# 🎮 Farcaster Integration - Hybrid Approach

## ✅ Phase 1: Core Setup (COMPLETED)

### Dependencies Installed
```bash
@farcaster/frame-sdk@0.1.12
@farcaster/frame-wagmi-connector@1.0.0
@farcaster/quick-auth@0.0.8
jose@6.1.1
```

### Files Created

**1. Context: `/contexts/FarcasterContext.tsx`**
- MiniApp SDK initialization
- Frame context management
- `useFarcaster()` hook export

**2. Hook: `/hooks/useFarcasterAuth.ts`**
- QuickAuth integration
- Sign-in flow with JWT
- User state management

**3. API Route: `/app/api/farcaster/auth/route.ts`**
- Token verification via QuickAuth
- Neynar user data fetching
- JWT cookie generation

**4. Utility: `/lib/neynar.ts`**
- Neynar API client
- User data fetching

### Environment Variables Added
```env
NEXT_PUBLIC_URL="https://www.rpsonchain.xyz"
NEYNAR_API_KEY="NEYNAR_API_DOCS"
JWT_SECRET="your_random_jwt_secret_here"
```

## 🚀 Next Steps

### Phase 2: Integrate into App (30 min)

**1. Update Providers**
```tsx
// app/providers.tsx
import { FarcasterProvider } from "~~/contexts/FarcasterContext";

export function Providers({ children }) {
  return (
    <WagmiProvider config={appkitWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**2. Add Farcaster Sign-In Button**
```tsx
// app/page.tsx
import { useFarcaster } from "~~/contexts/FarcasterContext";
import { useFarcasterAuth } from "~~/hooks/useFarcasterAuth";

const { context, isMiniAppReady } = useFarcaster();
const { signIn, isSignedIn, user } = useFarcasterAuth();

{isMiniAppReady && context && (
  <button onClick={signIn}>
    Sign in with Farcaster
  </button>
)}
```

**3. Show Farcaster Username in Header**
```tsx
// components/Header.tsx
const { user } = useFarcasterAuth();

{user && (
  <div>
    <img src={user.pfp_url} />
    @{user.username}
  </div>
)}
```

### Phase 3: Frame Metadata (30 min)

**1. Create `.well-known/farcaster.json`**
```bash
mkdir -p app/.well-known/farcaster.json
```

**2. Add Frame Metadata to Pages**
```tsx
// app/page.tsx
export async function generateMetadata(): Promise<Metadata> {
  return {
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: `${appUrl}/images/frame-preview.png`,
        button: {
          title: "Play RPS",
          action: {
            type: "launch_frame",
            name: "RPS OnChain",
            url: appUrl,
            splashImageUrl: `${appUrl}/images/splash.png`,
          },
        },
      }),
    },
  };
}
```

**3. Generate Manifest**
- Visit: https://warpcast.com/~/developers/mini-apps/manifest
- Enter domain: www.rpsonchain.xyz
- Copy manifest variables to env

### Phase 4: Game Integration (1 hour)

**1. Detect Farcaster Context in Game**
```tsx
// app/game/multiplayer/[roomId]/page.tsx
const { context, isMiniAppReady } = useFarcaster();

// Auto-login Farcaster users
useEffect(() => {
  if (isMiniAppReady && context && !isSignedIn) {
    signIn();
  }
}, [isMiniAppReady, context]);
```

**2. Add "Cast Result" Button**
```tsx
// After match ends
{isSignedIn && (
  <button onClick={castResult}>
    Share on Farcaster
  </button>
)}
```

### Phase 5: Frames (2 hours)

**1. Room Invitation Frame**
```
/api/frame/invite/[roomId]
```

**2. Match Result Frame**
```
/api/frame/result/[matchKey]
```

**3. Playable Frame**
```
/api/frame/play/[roomId]
```

## 📋 TODO Checklist

- [ ] Get Neynar API key (https://neynar.com)
- [ ] Generate JWT secret (`openssl rand -base64 32`)
- [ ] Update providers with FarcasterProvider
- [ ] Add Farcaster sign-in button to home page
- [ ] Show Farcaster username in Header
- [ ] Create Frame metadata
- [ ] Generate Farcaster manifest
- [ ] Add Frame detection to game page
- [ ] Implement "Cast Result" button
- [ ] Create Frame endpoints
- [ ] Test in Warpcast

## 🔗 Resources

- **Neynar API**: https://neynar.com
- **Farcaster Docs**: https://docs.farcaster.xyz
- **MiniApp Docs**: https://miniapps.farcaster.xyz
- **Manifest Tool**: https://warpcast.com/~/developers/mini-apps/manifest
- **Frame Validator**: https://warpcast.com/~/developers/frames

## 🎯 Expected User Flow

1. User sees RPS cast in Farcaster feed
2. Clicks "Launch Game" → Opens in Warpcast
3. Auto-signs in with Farcaster (no wallet needed!)
4. Plays full game inside mini-app
5. Clicks "Cast Result" → Shares to feed
6. Friends see result Frame → Click to play

## 💡 Key Features

- ✅ Dual auth (Wallet + Farcaster)
- ✅ Auto-login in Farcaster context
- ✅ Shareable game Frames
- ✅ In-feed playable Frames
- ✅ Social result sharing
- ✅ Farcaster username display
