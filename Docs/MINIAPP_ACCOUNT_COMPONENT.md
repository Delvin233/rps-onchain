# MiniAppAccount Component

## Overview

`MiniAppAccount` is a custom Wagmi-based wallet UI component designed specifically for miniapp environments (Farcaster, Base app, MiniPay). It replaces RainbowKit's default UI with a platform-optimized interface that respects each platform's constraints and design patterns.

## Why It Was Made

### Problems with RainbowKit in Miniapps

1. **Too Heavy**: RainbowKit's full modal UI is overkill for miniapps where users are already connected
2. **Platform Constraints**: Miniapps run in iframes with restricted permissions (clipboard API, network switching)
3. **Identity Mismatch**: RainbowKit doesn't understand platform-specific identities (Farcaster usernames, Basenames)
4. **Network Restrictions**: Base app only supports Base network, MiniPay only supports Celo - RainbowKit allows switching
5. **Design Inconsistency**: RainbowKit's modal doesn't match miniapp design patterns

### Solution

A lightweight, platform-aware component that:
- Uses Wagmi hooks directly (no RainbowKit dependency)
- Respects platform network restrictions
- Resolves platform-specific identities
- Handles iframe permission issues
- Integrates with app's theme system

## Architecture

### Core Dependencies

```typescript
// Wagmi Hooks
import { useAccount, useBalance, useEnsName, useSwitchChain } from "wagmi";

// Platform Detection
import { useFarcaster } from "~~/contexts/FarcasterContext";
import { useDisplayName } from "~~/hooks/useDisplayName";

// UI
import Image from "next/image";
import toast from "react-hot-toast";
```

### Wagmi Hooks Used

| Hook | Purpose |
|------|---------|
| `useAccount()` | Get connected wallet address, chain, connection status |
| `useBalance()` | Fetch and display user's token balance |
| `useEnsName()` | Resolve ENS/Basename for the address |
| `useSwitchChain()` | Enable network switching (Farcaster only) |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useFarcaster()` | Access Farcaster context (username, pfp, enriched user data) |
| `useDisplayName()` | API-based identity resolution (basename > farcaster > wallet) |

## Platform-Specific Behavior

### Farcaster MiniApp

```typescript
platform="farcaster"
```

**Features:**
- Shows `@username` from Farcaster profile
- Displays Farcaster profile picture
- Network badge shows current network (CELO/BASE)
- Network switcher enabled (Celo ↔ Base)
- Full clipboard API support

**Identity Priority:**
1. Farcaster username (`@username`)
2. Farcaster display name
3. Wallet address

**Visual Example:**
```
[🖼️] @delvin233                    [📋] [🔄 Celo ▼]
     0.5 CELO [CELO]
```

### Base App

```typescript
platform="base"
```

**Features:**
- Shows Basename or Farcaster username
- Displays Farcaster pfp (if no basename)
- Network badge always shows "BASE"
- Network switcher DISABLED (Base only)
- Iframe-safe clipboard fallback
- Auto-switches to Base network on connect

**Identity Priority:**
1. Basename (`.base` or `.base.eth`)
2. Farcaster username (via API)
3. Wallet address

**Special Handling:**
- Uses `useDisplayName` hook instead of FarcasterContext (more reliable in Base app iframe)
- Clipboard fallback using `document.execCommand('copy')` for iframe restrictions
- Automatically forces Base network (chain ID 8453) when user connects

**Visual Example:**
```
[🖼️] yourname.base                 [📋]
     0.001 ETH [BASE]
```

### MiniPay

```typescript
platform="minipay"
```

**Features:**
- Shows wallet address (no profile APIs available)
- No profile picture (gradient initials avatar)
- Network badge always shows "CELO"
- Network switcher DISABLED (Celo only)
- Standard clipboard API

**Identity Priority:**
1. Wallet address (truncated)

**Note:** MiniPay doesn't have public profile/identity APIs. Phone number attestations exist via Celo identity system but are complex to implement.

**Visual Example:**
```
[D2] 0x1234...5678                 [📋]
     5.2 CELO [CELO]
```

## Component Structure

### Props

```typescript
interface MiniAppAccountProps {
  platform: "farcaster" | "base" | "minipay";
}
```

### State Management

```typescript
const [showNetworkMenu, setShowNetworkMenu] = useState(false);
const menuRef = useRef<HTMLDivElement>(null);
```

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  [👤]  @username                    [📋] [🔄 Base ▼] │
│        0.5 ETH [BASE]                                │
└─────────────────────────────────────────────────────┘
```

**Components:**
- **Left**: Avatar (pfp or initials) + Display name + Balance + Network badge
- **Right**: Copy button + Network switcher (Farcaster only)

### Key Features

1. **Platform Colors**: Dynamic border/background based on platform
2. **Avatar Display**: Shows pfp or generates gradient avatar from initials
3. **Balance Display**: Real-time token balance with loading state
4. **Network Badge**: Shows current network (BASE/CELO) dynamically
5. **Network Switcher**: Dropdown menu (Farcaster only)
6. **Copy Address**: Clipboard with iframe fallback
7. **Theme Integration**: Uses CSS variables for fonts, spacing, colors

## Usage in Your Project

### 1. Basic Implementation

```typescript
import { MiniAppAccount } from "~~/components/MiniAppAccount";
import { usePlatformDetection } from "~~/hooks/usePlatformDetection";

export default function MyPage() {
  const { isMiniApp, isBaseApp, isMiniPay, isFarcaster } = usePlatformDetection();
  
  const getPlatform = (): "farcaster" | "base" | "minipay" => {
    if (isBaseApp) return "base";
    if (isMiniPay) return "minipay";
    if (isFarcaster) return "farcaster";
    return "farcaster";
  };

  return (
    <div>
      {isMiniApp ? (
        <MiniAppAccount platform={getPlatform()} />
      ) : (
        <RainbowKitConnectButton />
      )}
    </div>
  );
}
```

### 2. Platform Detection Hook

Create `hooks/usePlatformDetection.ts`:

```typescript
"use client";

import { useFarcaster } from "~~/contexts/FarcasterContext";

export const usePlatformDetection = () => {
  const { context, isMiniAppReady } = useFarcaster();
  const isBaseApp = typeof window !== "undefined" && 
    (window.location.ancestorOrigins?.[0]?.includes("base.dev") || 
     window.location.href.includes("base.dev/preview"));
  const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;
  const isMiniApp = (isMiniAppReady && !!context) || isBaseApp || isMiniPay;

  return { isMiniApp, isBaseApp, isMiniPay, isFarcaster: isMiniAppReady && !!context };
};
```

### 3. Identity Resolution Hook

Create `hooks/useDisplayName.ts`:

```typescript
"use client";

import { useBasename } from "./useBasename";
import { useQuery } from "@tanstack/react-query";
import { useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";

export const useDisplayName = (address: string | undefined) => {
  const { data: mainnetEns } = useEnsName({ address, chainId: mainnet.id });
  const { basename } = useBasename(address);

  const { data: farcasterData } = useQuery({
    queryKey: ["resolve-name", address],
    queryFn: async () => {
      if (!address) return { name: null, pfp: null };
      const res = await fetch(`/api/resolve-name?address=${address}`);
      const data = await res.json();
      return { name: data.name || null, pfp: data.pfp || null };
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });

  const displayName =
    mainnetEns || basename || farcasterData?.name || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "");
  const hasEns = !!(mainnetEns || basename || farcasterData?.name);
  const ensType = mainnetEns ? "mainnet" : basename ? "basename" : farcasterData?.name ? "farcaster" : null;
  const pfpUrl = basename ? null : farcasterData?.pfp;

  return { displayName, hasEns, ensType, fullAddress: address, pfpUrl };
};
```

### 4. API Endpoint for Farcaster Resolution

Create `app/api/resolve-name/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ name: null, pfp: null });
  }

  try {
    // Call Farcaster API to resolve address to username/pfp
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          api_key: process.env.NEYNAR_API_KEY || "",
        },
      }
    );

    const data = await response.json();
    const user = data[address.toLowerCase()]?.[0];

    return NextResponse.json({
      name: user?.username || null,
      pfp: user?.pfp_url || null,
    });
  } catch {
    return NextResponse.json({ name: null, pfp: null });
  }
}
```

## Theme Integration

The component uses CSS variables for dynamic theming:

```typescript
// Fonts
fontFamily: "var(--font-heading)"
fontFamily: "var(--font-body)"

// Font sizes (with multipliers)
fontSize: "calc(0.875rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))"

// Spacing
padding: "var(--card-padding, 1rem)"
gap: "var(--inner-gap, 0.75rem)"

// Colors
background: "var(--theme-card)"
color: "var(--theme-text)"
border: "var(--theme-border)"
```

## Clipboard Fallback for Iframes

```typescript
const handleCopyAddress = useCallback(async () => {
  if (!address) return;
  try {
    // Try modern clipboard API first
    await navigator.clipboard.writeText(address);
    toast.success("Address copied!");
  } catch {
    // Fallback for iframes (Base app preview)
    try {
      const textArea = document.createElement("textarea");
      textArea.value = address;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Address copied!");
    } catch {
      toast.error("Failed to copy address");
    }
  }
}, [address]);
```

## Network Badge & Switching Logic

### Network Badge (All Platforms)

```typescript
<span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
  {chain?.name?.toUpperCase() || "UNKNOWN"}
</span>
```

**Displays:**
- "BASE" when on Base network
- "CELO" when on Celo network
- Updates automatically when network changes
- Visible on all platforms

### Network Switcher (Farcaster Only)

```typescript
const canSwitchNetworks = platform === "farcaster";

// Only show network menu for Farcaster
{canSwitchNetworks && (
  <div className="relative" ref={menuRef}>
    <button onClick={() => setShowNetworkMenu(!showNetworkMenu)}>
      <Network size={12} />
      <span>{chain?.name}</span>
    </button>
    
    {showNetworkMenu && (
      <div className="dropdown-menu">
        <button onClick={() => handleNetworkSwitch(celo.id)}>Celo</button>
        <button onClick={() => handleNetworkSwitch(base.id)}>Base</button>
      </div>
    )}
  </div>
)}
```

### Auto-Switch for Base App

Base app users are automatically switched to Base network on connect:

```typescript
// In app/page.tsx
useEffect(() => {
  if (isBaseApp && !isMiniAppReady && address && chainId !== 8453) {
    try {
      switchChain({ chainId: 8453 });
    } catch (error) {
      console.error("Failed to switch to Base:", error);
    }
  }
}, [isBaseApp, isMiniAppReady, address, chainId, switchChain]);
```

## Performance Optimizations

### useMemo for Expensive Computations

```typescript
const platformColors = useMemo(() => {
  switch (platform) {
    case "farcaster": return "border-accent/30 bg-accent/10";
    case "base": return "border-secondary/30 bg-secondary/10";
    case "minipay": return "border-primary/30 bg-primary/10";
    default: return "border-primary/30 bg-primary/10";
  }
}, [platform]);

const { displayName, avatarUrl } = useMemo(() => {
  // Complex identity resolution logic
}, [platform, enrichedUser, ensName, address, apiDisplayName, apiPfpUrl]);
```

### useCallback for Event Handlers

```typescript
const handleCopyAddress = useCallback(async () => {
  // Copy logic
}, [address, toastStyle]);

const handleNetworkSwitch = useCallback(async (chainId: number) => {
  // Network switch logic
}, [switchChain, toastStyle]);
```

## Comparison: RainbowKit vs MiniAppAccount

| Feature | RainbowKit | MiniAppAccount |
|---------|-----------|----------------|
| Bundle Size | ~200KB | ~5KB |
| Platform Awareness | ❌ | ✅ |
| Network Restrictions | ❌ | ✅ |
| Network Badge | ❌ | ✅ |
| Auto Network Switch | ❌ | ✅ (Base app) |
| Farcaster Identity | ❌ | ✅ |
| Basename Support | ❌ | ✅ |
| Iframe Clipboard | ❌ | ✅ |
| Theme Integration | Partial | Full |
| Auto-connect | ❌ | ✅ |

## Migration Guide

### From RainbowKit to MiniAppAccount

**Before:**
```typescript
import { ConnectButton } from "@rainbow-me/rainbowkit";

<ConnectButton />
```

**After:**
```typescript
import { MiniAppAccount } from "~~/components/MiniAppAccount";
import { usePlatformDetection } from "~~/hooks/usePlatformDetection";

const { isMiniApp } = usePlatformDetection();

{isMiniApp ? (
  <MiniAppAccount platform={getPlatform()} />
) : (
  <ConnectButton />
)}
```

## Best Practices

1. **Always detect platform first** - Don't hardcode platform prop
2. **Use conditional rendering** - Show RainbowKit for web, MiniAppAccount for miniapps
3. **Test in all environments** - Farcaster, Base app preview, MiniPay, regular web
4. **Handle loading states** - Show skeleton while connecting
5. **Provide fallbacks** - Clipboard, identity resolution, network switching

## Troubleshooting

### Issue: @dummyuser showing on Base app

**Cause:** Using FarcasterContext instead of API-based resolution

**Fix:** Ensure Base app uses `useDisplayName` hook:
```typescript
if (platform === "base") {
  return {
    displayName: apiDisplayName,
    avatarUrl: apiPfpUrl || null,
  };
}
```

### Issue: Clipboard not working in Base app preview

**Cause:** Clipboard API blocked in iframes

**Fix:** Use `document.execCommand('copy')` fallback (already implemented)

### Issue: Network switcher showing on Base app

**Cause:** Platform detection failing

**Fix:** Check both `ancestorOrigins` and URL:
```typescript
const isBaseApp = typeof window !== "undefined" && 
  (window.location.ancestorOrigins?.[0]?.includes("base.dev") || 
   window.location.href.includes("base.dev/preview"));
```

### Issue: Base app users connected to Celo network

**Cause:** Network restrictions in `scaffold.config.ts` run at build time, not runtime

**Fix:** Add runtime auto-switch in `app/page.tsx`:
```typescript
useEffect(() => {
  if (isBaseApp && !isMiniAppReady && address && chainId !== 8453) {
    try {
      switchChain({ chainId: 8453 });
    } catch (error) {
      console.error("Failed to switch to Base:", error);
    }
  }
}, [isBaseApp, isMiniAppReady, address, chainId, switchChain]);
```

### Issue: Network badge not updating

**Cause:** Not using `chain` from `useAccount`

**Fix:** Badge uses `chain?.name` which updates automatically:
```typescript
const { chain } = useAccount();
// ...
{chain?.name?.toUpperCase() || "UNKNOWN"}
```

## Future Enhancements

- [ ] Add Basename avatar resolution
- [ ] Support MiniPay profile APIs (when available)
- [ ] Add transaction history dropdown
- [ ] Support multiple wallets in miniapps
- [ ] Add wallet switching UI
- [ ] Implement ENS avatar resolution

## Related Documentation

- [MINIAPP_INTEGRATION.md](./MINIAPP_INTEGRATION.md) - Full miniapp integration guide
- [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md) - Performance best practices
- [Wagmi Documentation](https://wagmi.sh) - Wagmi hooks reference
- [RainbowKit Documentation](https://rainbowkit.com) - RainbowKit comparison

## License

MIT - Feel free to use in your own projects!
