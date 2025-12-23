---
title: Context
description: View context for an app session
---

# Context

When your app is opened it can access information about the session from
`sdk.context`. This object provides basic information about the user, the
client, and where your app was opened from:

```ts
export type MiniAppPlatformType = "web" | "mobile";

export type MiniAppContext = {
  user: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  location?: MiniAppLocationContext;
  client: {
    platformType?: MiniAppPlatformType;
    clientFid: number;
    added: boolean;
    safeAreaInsets?: SafeAreaInsets;
    notificationDetails?: MiniAppNotificationDetails;
  };
  features?: {
    haptics: boolean;
    cameraAndMicrophoneAccess?: boolean;
  };
};
```

## Properties

### `location`

Contains information about the context from which the Mini App was launched.

```ts
export type MiniAppUser = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

export type MiniAppCast = {
  author: MiniAppUser;
  hash: string;
  parentHash?: string;
  parentFid?: number;
  timestamp?: number;
  mentions?: MiniAppUser[];
  text: string;
  embeds?: string[];
  channelKey?: string;
};

export type CastEmbedLocationContext = {
  type: "cast_embed";
  embed: string;
  cast: MiniAppCast;
};

export type CastShareLocationContext = {
  type: "cast_share";
  cast: MiniAppCast;
};

export type NotificationLocationContext = {
  type: "notification";
  notification: {
    notificationId: string;
    title: string;
    body: string;
  };
};

export type LauncherLocationContext = {
  type: "launcher";
};

export type ChannelLocationContext = {
  type: "channel";
  channel: {
    /**
     * Channel key identifier
     */
    key: string;

    /**
     * Channel name
     */
    name: string;

    /**
     * Channel profile image URL
     */
    imageUrl?: string;
  };
};

export type OpenMiniAppLocationContext = {
  type: "open_miniapp";
  referrerDomain: string;
};

export type LocationContext =
  | CastEmbedLocationContext
  | CastShareLocationContext
  | NotificationLocationContext
  | LauncherLocationContext
  | ChannelLocationContext
  | OpenMiniAppLocationContext;
```

#### Cast Embed

Indicates that the Mini App was launched from a cast (where it is an embed).

```ts
> sdk.context.location
{
  type: "cast_embed",
  embed: "https://myapp.example.com",
  cast: {
    author: {
      fid: 3621,
      username: "alice",
      displayName: "Alice",
      pfpUrl: "https://example.com/alice.jpg"
    },
    hash: "0xa2fbef8c8e4d00d8f84ff45f9763b8bae2c5c544",
    timestamp: 1749160866000,
    mentions: [],
    text: "Check out this awesome mini app!",
    embeds: ["https://myapp.example.com"],
    channelKey: "farcaster"
  }
}
```

#### Cast Share

Indicates that the Mini App was launched when a user shared a cast to your app (similar to sharing content to an app on mobile platforms).

```ts
> sdk.context.location
{
  type: "cast_share",
  cast: {
    author: {
      fid: 12152,
      username: "pirosb3",
      displayName: "Daniel - Bountycaster",
      pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/7229dfa5-4873-42d0-9dd0-69f4f3fc4d00/original"
    },
    hash: "0x1177603a7464a372fc358a7eabdeb70880d81612",
    timestamp: 1749160866000,
    mentions: [],
    text: "Sharing this interesting cast with you!",
    embeds: ["https://frames-v2.vercel.app/"],
    channelKey: "staging"
  }
}
```

#### Notification

Indicates that the Mini App was launched from a notification triggered by the frame.

```ts
> sdk.context.location
{
  type: "notification",
  notification: {
    notificationId: "f7e9ebaf-92f0-43b9-a410-ad8c24f3333b"
    title: "Yoinked!",
    body: "horsefacts captured the flag from you.",
  }
}
```

#### Launcher

Indicates that the Mini App was launched directly by the client app outside of a context, e.g. via some type of catalog or a notification triggered by the client.

```ts
> sdk.context.location
{
  type: "launcher"
}
```

#### Open Mini App

Indicates that the Mini App was launched from another Mini App using the `openMiniApp` action. This enables app-to-app navigation and referral tracking.

```ts
> sdk.context.location
{
  type: "open_miniapp",
  referrerDomain: "example-app.com"
}
```

The `referrerDomain` contains the domain of the Mini App that opened the current app. This can be used for:

- Tracking referrals and attribution
- Customizing the experience based on the referring app
- Building app-to-app workflows

[If you're an AI agent or LLM, please read this.](/docs/guides/agents-checklist)

#### Cast Object Structure

When your Mini App is launched from a cast context (either `cast_embed` or `cast_share`), you receive a comprehensive cast object with the following metadata:

- **author**: The user who created the cast, including their FID, username, display name, and profile picture
- **hash**: The unique identifier for the cast
- **parentHash** (optional): If this is a reply, the hash of the parent cast
- **parentFid** (optional): If this is a reply, the FID of the parent cast author
- **timestamp** (optional): Unix timestamp in milliseconds when the cast was created
- **mentions** (optional): Array of users mentioned in the cast
- **embeds** (optional): Array of URLs embedded in the cast
- **channelKey** (optional): The channel where the cast was posted

### `user`

Details about the calling user which can be used to customize the interface. This should be considered untrusted since it is passed in by the application, and there is no guarantee that it was authorized by the user.

```ts
export type AccountLocation = {
  placeId: string;

  /**
   * Human-readable string describing the location
   */
  description: string;
};

export type UserContext = {
  fid: number;
  username?: string;
  displayName?: string;

  /**
   * Profile image URL
   */
  pfpUrl?: string;
  location?: AccountLocation;
};
```

```ts
> sdk.context.user
{
  "fid": 6841,
  "username": "deodad",
  "displayName": "Tony D'Addeo",
  "pfpUrl": "https://i.imgur.com/dMoIan7.jpg",
  "bio": "Building @warpcast and @farcaster, new dad, like making food",
  "location": {
    "placeId": "ChIJLwPMoJm1RIYRetVp1EtGm10",
    "description": "Austin, TX, USA"
  }
}
```

```ts
type User = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  location?: {
    placeId: string;
    description: string;
  };
};
```

### client

Details about the Farcaster client running the Mini App. This should be considered untrusted

- `platformType`: indicates whether the Mini App is running on 'web' or 'mobile' platform
- `clientFid`: the self-reported FID of the client (e.g. 9152 for Warpcast)
- `added`: whether the user has added the Mini App to the client
- `safeAreaInsets`: insets to avoid areas covered by navigation elements that obscure the view
- `notificationDetails`: in case the user has enabled notifications, includes the `url` and `token` for sending notifications

```ts
export type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type ClientContext = {
  platformType?: MiniAppPlatformType;
  clientFid: number;
  added: boolean;
  notificationDetails?: MiniAppNotificationDetails;
  safeAreaInsets?: SafeAreaInsets;
};
```

```ts
> sdk.context.client
{
  platformType: "mobile",
  clientFid: 9152,
  added: true,
  safeAreaInsets: {
    top: 0,
    bottom: 20,
    left: 0,
    right: 0,
  };
  notificationDetails: {
    url: "https://api.farcaster.xyz/v1/frame-notifications",
    token: "a05059ef2415c67b08ecceb539201cbc6"
  }
}
```

```ts
type MiniAppNotificationDetails = {
  url: string;
  token: string;
};

type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type ClientContext = {
  platformType?: MiniAppPlatformType;
  clientFid: number;
  added: boolean;
  safeAreaInsets?: SafeAreaInsets;
  notificationDetails?: MiniAppNotificationDetails;
};
```

#### Using safeAreaInsets

Mobile devices render navigation elements that obscure the view of an app. Use
the `safeAreaInsets` to render content in the safe area that won't be obstructed.

A basic usage would to wrap your view in a container that adds margin:

```
<div style={{
  marginTop: context.client.safeAreaInsets.top,
  marginBottom: context.client.safeAreaInsets.bottom,
  marginLeft: context.client.safeAreaInsets.left,
  marginRight: context.client.safeAreaInsets.right,
}}>
  ...your app view
</div>
```

However, you may want to set these insets on specific elements: for example if
you have tab bar at the bottom of your app with a different background, you'd
want to set the bottom inset as padding there so it looks attached to the
bottom of the view.

[If you're an AI agent or LLM, please read this.](/docs/guides/agents-checklist)

### features

Optional object that indicates which features are available and their current state in the client.

```ts
export type ClientFeatures = {
  haptics: boolean;
  cameraAndMicrophoneAccess?: boolean;
};
```

- `haptics`: Indicates whether haptic feedback is supported on the current platform
- `cameraAndMicrophoneAccess`: Indicates whether camera and microphone permissions have been granted and stored for this mini app. When `true`, the user has previously granted access and won't be prompted again. This field is optional and may not be present on all platforms.

```ts
> sdk.context.features
{
  haptics: true,
  cameraAndMicrophoneAccess: true
}
```

#### Using features for capability detection

You can use the `features` object to conditionally enable functionality based on platform support:

```ts
// Check if camera/microphone is available before using it
if (context.features?.cameraAndMicrophoneAccess) {
  // Camera and microphone access is available and granted
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
} else {
  // Feature not supported or permissions not granted
  console.log("Camera/microphone not available");
}
```

**Note:** For more fine-grained capability detection, use the [`getCapabilities()`](/docs/sdk/detecting-capabilities#getcapabilities) method which returns specific SDK methods supported by the host.

Example usage with `getCapabilities()`:

```ts
import { sdk } from "@farcaster/miniapp-sdk";

// Get list of supported capabilities
const capabilities = await sdk.getCapabilities();

// Check if specific haptic methods are supported
if (capabilities.includes("haptics.impactOccurred")) {
  // Impact haptic feedback is available
  await sdk.haptics.impactOccurred("medium");
}
```

---

title: Quick Auth
description: Easily authenticate Farcaster users in your mini app

---

# Quick Auth

Quick Auth is a lightweight service built on top of Sign In with Farcaster that makes
it easy to get an authenticated session for a Farcaster user.

## Examples

- [Make authenticated requests](#make-authenticated-requests)
- [Use a session token directly](#use-a-session-token-directly)
- [Validate a session token](#validate-a-session-token)

### Make authenticated requests

In your frontend, use [`sdk.quickAuth.fetch`](/docs/sdk/quick-auth/fetch) to
make an authenticated request. This will automatically get a Quick Auth session
token if one is not already present and add it as Bearer token in the
`Authorization` header:

```tsx twoslash
const BACKEND_ORIGIN = "https://hono-backend.miniapps.farcaster.xyz";

// ---cut---
import React, { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function App() {
  const [user, setUser] = useState<{ fid: number }>();

  useEffect(() => {
    (async () => {
      const res = await sdk.quickAuth.fetch(`${BACKEND_ORIGIN}/me`);
      if (res.ok) {
        setUser(await res.json());
        sdk.actions.ready();
      }
    })();
  }, []);

  // The splash screen will be shown, don't worry about rendering yet.
  if (!user) {
    return null;
  }

  return <div>hello, {user.fid}</div>;
}
```

The token must be [validated on your server](#validate-a-session-token).

### Use a session token directly

In your frontend, use
[`sdk.quickAuth.getToken`](/docs/sdk/quick-auth/get-token) to get a Quick Auth
session token. If there is already a session token in memory that hasn't
expired it will be immediately returned, otherwise a fresh one will be
acquired.

```html
<div id="user" />

<script type="module">
  import ky from "https://esm.sh/ky";
  import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk";

  const { token } = await sdk.quickAuth.getToken();
  const user = await ky
    .get("http://localhost:8787" + "/me", {
      headers: { Authorization: "Bearer " + token },
    })
    .json();
  document.getElementById("user").textContent = JSON.stringify(user);
</script>
```

The token must be [validated on your server](#validate-a-session-token).

### Validate a session token

First, install the Quick Auth library into your backend with:

```
npm install @farcaster/quick-auth
```

Then you can use `verifyJwt` to check the JWT and get back the token payload
which has the FID of the user as the `sub` property.

You can then look up additional information about the user.

```ts
import { Errors, createClient } from "@farcaster/quick-auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

const client = createClient();
const app = new Hono<{ Bindings: Cloudflare.Env }>();

// Resolve information about the authenticated Farcaster user. In practice
// you might get this information from your database, Neynar, or Snapchain.
async function resolveUser(fid: number) {
  const primaryAddress = await (async () => {
    const res = await fetch(
      `https://api.farcaster.xyz/fc/primary-address?fid=${fid}&protocol=ethereum`
    );
    if (res.ok) {
      const { result } = await res.json<{
        result: {
          address: {
            fid: number;
            protocol: "ethereum" | "solana";
            address: string;
          };
        };
      }>();

      return result.address.address;
    }
  })();

  return {
    fid,
    primaryAddress,
  };
}

const quickAuthMiddleware = createMiddleware<{
  Bindings: Cloudflare.Env;
  Variables: {
    user: {
      fid: number;
      primaryAddress?: string;
    };
  };
}>(async (c, next) => {
  const authorization = c.req.header("Authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing token" });
  }

  try {
    const payload = await client.verifyJwt({
      token: authorization.split(" ")[1] as string,
      domain: c.env.HOSTNAME,
    });

    const user = await resolveUser(payload.sub);
    c.set("user", user);
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      console.info("Invalid token:", e.message);
      throw new HTTPException(401, { message: "Invalid token" });
    }

    throw e;
  }

  await next();
});

app.use(cors());

app.get("/me", quickAuthMiddleware, (c) => {
  return c.json(c.get("user"));
});

export default app;
```

## Optimizing performance

To optimize performance, provide a `preconnect` hint to the browser in your
frontend so that it can preemptively initiate a connection with the Quick Auth
Server:

```html
<link rel="preconnect" href="https://auth.farcaster.xyz" />
```

Or if you're using React:

```ts
import { preconnect } from "react-dom";

function AppRoot() {
  preconnect("https://auth.farcaster.xyz");
}
```

## Quick Auth vs Sign In with Farcaster

[Sign In with
Farcaster](https://github.com/farcasterxyz/protocol/discussions/110) is the
foundational standard that allows Farcaster users to authenticate into
applications.

[Farcaster Quick
Server](https://github.com/farcasterxyz/protocol/discussions/231) is an
optional service built on top of SIWF that is highly performant and easy to
integrate. Developers don't need to worry about securely generating and
consuming nonces or the nuances of verifying a SIWF message—instead they
receive a signed JWT that can be used as a session token to authenticate their
server.

The Auth Server offers exceptional performance in two ways:

- the service is deployed on the edge so nonce generation and verification
  happens close to your users no matter where they are located
- the issued tokens are asymmetrically signed so they can be verified locally
  on your server

## Functions

| Name                                       | Description                         |
| ------------------------------------------ | ----------------------------------- |
| [getToken](/docs/sdk/quick-auth/get-token) | Gets a signed Quick Auth token      |
| [fetch](/docs/sdk/quick-auth/fetch)        | Make an authenticated fetch request |

## Properties

| Name                                | Description                        |
| ----------------------------------- | ---------------------------------- |
| [token](/docs/sdk/quick-auth/token) | Returns an active token if present |

---

title: quickAuth.getToken
description: Get Quick Auth session token

---

import { Caption } from '../../../../components/Caption.tsx';

# quickAuth.getToken

Request a signed JWT from a [Farcaster Quick Auth
Server](https://github.com/farcasterxyz/protocol/discussions/231).

## Usage

```ts twoslash
// ---cut---
import { sdk } from "@farcaster/miniapp-sdk";

const { token } = await sdk.quickAuth.getToken();
```

See the [session token example](/docs/sdk/quick-auth#use-a-session-token-directly).

## Parameters

### force

- **Type:** `boolean`

Acquire a new token even if one is already in memory and not expired.

### quickAuthServerOrigin (optional)

- **Type:** `string`

Use a custom Quick Auth Server. Defaults to `https://auth.farcaster.xyz`.

## Return Value

A [JWT](https://datatracker.ietf.org/doc/html/rfc7519) issued by the Quick Auth
Server based on the Sign In with Farcaster credential signed by the user.

```ts
{
  token: string;
}
```

You must [validate the token on your server](/docs/sdk/quick-auth#validate-a-session-token).

### JWT Payload

```json
{
  "iat": 1747764819,
  "iss": "https://auth.farcaster.xyz",
  "exp": 1747768419,
  "sub": 6841,
  "aud": "miniapps.farcaster.xyz"
}
```

#### sub

- **Type:** `number`

The FID of the signed in user.

#### iss

- **Type:** `string`

The Quick Auth server that verified the SIWF credential and issued the JWT.

#### aud

- **Type:** `string`

The domain this token was issued to.

#### exp

- **Type:** `number`

The JWT expiration time.

#### iat

- **Type:** `number`

The JWT issued at time.

---

title: quickAuth.fetch
description: Make an authenticated fetch request with a Quick Auth session token

---

# quickAuth.fetch

Make a [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) request
with `Authorization` header set to `Bearer ${token}` where token is a
Quick Auth session token.

:::note
This is a convenience function that makes it easy to make authenticated
requests but using it is not a requirement. Use
[getToken](/docs/sdk/quick-auth/get-token) to get a token directly and attach
it to requests using the library and format of your choosing.
:::

## Usage

```ts twoslash
const url = "https://example.com";

// ---cut---
import { sdk } from "@farcaster/miniapp-sdk";

await sdk.quickAuth.fetch(url);
```

See the [make authenticated requests example](/docs/sdk/quick-auth#make-authenticated-requests).

## Parameters

See [Fetch parameters](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#parameters).

## Return Value

See [Fetch return value](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#return_value).

---

title: addMiniApp
description: Prompts the user to add the app

---

import { Caption } from '../../../../components/Caption.tsx';

# addMiniApp

Prompts the user to add the app.

![adding a mini app in Warpcast](/add_frame_preview.png)

<Caption>
  A user discovers an app from their social feed, adds it, and then sees it
  from their apps screen
</Caption>

## Usage

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

await sdk.actions.addMiniApp();
```

The `addMiniApp()` action requires your app's domain to exactly match the domain in your manifest file. This means:

- You cannot use tunnel domains (ngrok, localtunnel, etc.) - the action will fail
- Your app must be deployed to the same domain specified in your `farcaster.json`
- For local development, use the preview tool instead of trying to add the app

## Return Value

`void`

## Errors

### `RejectedByUser`

Thrown if a user rejects the request to add the Mini App.

### `InvalidDomainManifestJson`

Thrown when an app does not have a valid `farcaster.json` or when the domain doesn't match. Common causes:

- Using a tunnel domain (ngrok, localtunnel) instead of your production domain
- The app's current domain doesn't match the domain in the manifest
- The manifest file is missing or malformed

---

title: close
description: Closes the app

---

import { Caption } from '../../../../components/Caption.tsx';

# close

Closes the mini app.

![closing the app](/close_preview.png)

<Caption>
  Close the app with `close`.
</Caption>

## Usage

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

await sdk.actions.close();
```

## Return Value

`void`

---

title: composeCast
description: Open the cast composer with a suggested cast

---

import { Caption } from '../../../../components/Caption.tsx';

# composeCast

Open the cast composer with a suggested cast. The user will be able to modify
the cast before posting it.

![composing a cast](/compose_cast_action.png)

<Caption>
  An app prompts the user to cast and includes an embed.
</Caption>

## Usage

```ts twoslash
/**
 * Cryptographically secure nonce generated on the server and associated with
 * the user's session.
 */
const text = "I just learned how to compose a cast";
const embeds = [
  "https://miniapps.farcaster.xyz/docs/sdk/actions/compose-cast",
] as [string];

// ---cut---
import { sdk } from "@farcaster/miniapp-sdk";

await sdk.actions.composeCast({
  text,
  embeds,
});
```

## Parameters

### text (optional)

- **Type:** `string`

Suggested text for the body of the cast.

Mentions can be included using the human-writeable form (e.g. @farcaster).

### embeds (optional)

- **Type:** `[] | [string] | [string, string]`

Suggested embeds. Max two.

### parent (optional)

- **Type:** `{ type: 'cast'; hash: string }`

Suggested parent of the cast.

### close (optional)

- **Type:** `boolean`

Whether the app should be closed when this action is called. If true the app
will be closed and the action will resolve with no result.

### channelKey (optional)

- **Type:** `string`

Whether the cast should be posted to a channel.

## Return Value

The cast posted by the user, or `undefined` if set to close.

**Note:** The `cast` property in the result can be `null` if the user decides not to create the cast.

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

// ---cut---
const result = await sdk.actions.composeCast({
  //    ^?
  text: "I just learned how to compose a cast",
  embeds: ["https://miniapps.farcaster.xyz/docs/sdk/actions/compose-cast"],
  channelKey: "farcaster", // optional channel
});

// result.cast can be null if user cancels
if (result?.cast) {
  console.log(result.cast.hash);
  console.log(result.cast.channelKey); // includes channel if posted to one
}
```

---

title: ready
description: Hides the Splash Screen.

---

import { Caption } from '../../../../components/Caption.tsx';

# ready

Hides the Splash Screen. Read the [guide on loading your app](/docs/guides/loading) for best practices.

[If you're an AI agent or LLM, please read this.](/docs/guides/agents-checklist)

![calling ready to hide the splash screen](/ready_preview.png)

<Caption>
  Dismiss the Splash Screen with ready.
</Caption>

## Usage

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

await sdk.actions.ready();
```

## Parameters

### disableNativeGestures (optional)

- **Type:** `boolean`
- **Default:** `false`

Disable native gestures. Use this option if your frame uses gestures
that conflict with native gestures like swipe to dismiss.

## Return Value

`void`

---

title: openUrl
description: Opens an external URL

---

import { Caption } from '../../../../components/Caption.tsx';

# openUrl

Opens an external URL.

If a user is on mobile `openUrl` can be used to deeplink
users into different parts of the Farcaster client they
are using.

![opening a url](/open_url_preview.png)

<Caption>
  Opening an external url with `openUrl`.
</Caption>

## Usage

```ts twoslash
const url = "https://farcaster.xyz";

//---cut---
import { sdk } from "@farcaster/miniapp-sdk";

// Pass URL as a string
await sdk.actions.openUrl(url);

// Or pass URL as an object
await sdk.actions.openUrl({ url: "https://farcaster.xyz" });
```

## Return Value

`void`

---

title: openMiniApp
description: Opens another Mini App

---

import { Caption } from '../../../../components/Caption.tsx';

# openMiniApp

Opens another Mini App, providing a seamless way to navigate between Mini Apps within the Farcaster ecosystem.

When you open another Mini App using this method, your current Mini App will close after successful navigation. The target Mini App will receive information about your app as the referrer, enabling referral tracking and app-to-app flows.

## Usage

```ts twoslash
const options = {
  url: "https://www.bountycaster.xyz/bounty/0x983ad3e340fbfef785e0705ff87c0e63c22bebc4",
};

//---cut---
import { sdk } from "@farcaster/miniapp-sdk";

// Open a Mini App using an embed URL
await sdk.actions.openMiniApp({
  url: "https://www.bountycaster.xyz/bounty/0x983ad3e340fbfef785e0705ff87c0e63c22bebc4",
});

// Open a Mini App using a launch URL
await sdk.actions.openMiniApp({
  url: "https://farcaster.xyz/miniapps/WoLihpyQDh7w/farville",
});
```

## Options

```ts
type OpenMiniAppOptions = {
  url: string;
};
```

- `url`: The URL of the Mini App to open. This can be either:
  - A Mini App embed URL (e.g., `https://example.com/specific-page`)
  - A Mini App launch URL (e.g., `https://farcaster.xyz/miniapps/[id]/[name]`)

## Return Value

`Promise<void>` - The promise resolves when navigation is successful. If navigation fails, the promise will be rejected with an error.

## Error Handling

Always await the `openMiniApp` call and handle potential errors:

```ts
import { sdk } from "@farcaster/miniapp-sdk";

try {
  await sdk.actions.openMiniApp({
    url: "https://example.com/miniapp",
  });
  // Navigation successful - your app will close
} catch (error) {
  console.error("Failed to open Mini App:", error);
  // Handle the error - your app remains open
}
```

## Referrer Information

When a Mini App is opened using `openMiniApp`, the target app receives a special location context with referrer information:

```ts
// In the target Mini App:
if (sdk.context.location?.type === "open_miniapp") {
  console.log("Referred by:", sdk.context.location.referrerDomain);
  // e.g., "Referred by: yourminiapp.com"
}
```

## Use Cases

### Hub or Portfolio Apps

Create a central hub that showcases multiple Mini Apps:

```ts
const miniApps = [
  {
    name: "Farville",
    url: "https://farcaster.xyz/miniapps/WoLihpyQDh7w/farville",
  },
  { name: "Bountycaster", url: "https://www.bountycaster.xyz" },
  { name: "Yoink", url: "https://yoink.party/framesV2/" },
];

function MiniAppHub() {
  const handleOpenApp = async (url: string) => {
    try {
      await sdk.actions.openMiniApp({ url });
    } catch (error) {
      console.error("Failed to open app:", error);
    }
  };

  return (
    <div>
      {miniApps.map((app) => (
        <button key={app.name} onClick={() => handleOpenApp(app.url)}>
          Open {app.name}
        </button>
      ))}
    </div>
  );
}
```

### Referral Systems

Implement referral tracking between Mini Apps:

```ts
// In the source Mini App
const referralUrl = "https://partner-app.com/campaign?ref=myapp";
await sdk.actions.openMiniApp({ url: referralUrl });

// In the target Mini App
if (sdk.context.location?.type === "open_miniapp") {
  // Track the referral
  analytics.track("referral_received", {
    referrer: sdk.context.location.referrerDomain,
    campaign: new URL(window.location.href).searchParams.get("ref"),
  });
}
```

## Important Notes

- Your Mini App will close after successful navigation
- The action works the same way on both web and mobile platforms
- The target app must be a valid Mini App with a proper manifest
- Always handle errors as navigation may fail for various reasons

---

title: signIn
description: Sign in the user with Farcaster.

---

import { Caption } from '../../../../components/Caption.tsx';

# signIn

Request a [Sign in with Farcaster
(SIWF)](https://docs.farcaster.xyz/developers/siwf/) credential from the user.

See the guide on [authenticating users](/docs/guides/auth).

![signing in a user](/sign_in_preview.png)

<Caption>
  A user opens an app and is automatically signed in
</Caption>

## Usage

```ts twoslash
/**
 * Cryptographically secure nonce generated on the server and associated with
 * the user's session.
 */
const nonce = "securenonce";

// ---cut---
import { sdk } from "@farcaster/miniapp-sdk";

await sdk.actions.signIn({
  nonce,
  acceptAuthAddress: true,
});
```

## Parameters

### nonce

- **Type:** `string`

A random string used to prevent replay attacks, at least 8 alphanumeric
characters.

### acceptAuthAddress

- **Type:** `boolean`

Whether an [Auth
Address](https://github.com/farcasterxyz/protocol/discussions/225) signed
message is acceptable. Defaults to `true` for the best user experience.
Set to `false` if your verification method does not support auth addresses.

## Return Value

The SIWF message and signature.

```ts
type SignInResult = {
  signature: string;
  message: string;
};
```

:::note
This message must be sent to your server and verified. See the guide on
[authenticating with Farcaster](/docs/guides/auth) for more information.
:::

## Errors

### `RejectedByUser`

Thrown if a user rejects the sign-in request.

```ts
try {
  const result = await sdk.actions.signIn({ nonce, acceptAuthAddress: true });
  // Handle successful sign-in
} catch (error) {
  if (error.name === "RejectedByUser") {
    // Handle user rejection
  }
}
```

[If you're an AI agent or LLM, please read this.](/docs/guides/agents-checklist)

---

title: viewProfile
description: Displays a user's Farcaster profile.

---

import { Caption } from '../../../../components/Caption.tsx';

# viewProfile

Displays a user's Farcaster profile.

![viewing a profile from an app](/view_profile_preview.png)

<Caption>
  Viewing a profile and follow a user from an app.
</Caption>

## Usage

```ts twoslash
const fid = 6841;

// ---cut---
import { sdk } from "@farcaster/miniapp-sdk";

await sdk.actions.viewProfile({
  fid,
});
```

## Parameters

### fid

- **Type:** `number`

Farcaster ID of the user whose profile to view.

## Return Value

`void`

---

title: viewCast
description: Open a specific cast in the Farcaster client

---

import { Caption } from '../../../../components/Caption.tsx';

# viewCast

Open a specific cast in the Farcaster client. This navigates the user to view
the full cast with its replies and reactions.

## Usage

```ts twoslash
const castHash = "0x1234567890abcdef";

// ---cut---
import { sdk } from "@farcaster/miniapp-sdk";

await sdk.actions.viewCast({
  hash: castHash,
});
```

## Parameters

### hash

- **Type:** `string`

The hash of the cast to view. This should be a valid cast hash from the Farcaster protocol.

### close (optional)

- **Type:** `boolean`

Whether the app should be closed when this action is called. If true, the app
will be closed after opening the cast view.

## Return Value

`Promise<void>` - This action does not return a value. It triggers navigation to the cast view in the Farcaster client.

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

// ---cut---
// View a specific cast
await sdk.actions.viewCast({
  hash: "0x1234567890abcdef",
});

// View a cast and close the mini app
await sdk.actions.viewCast({
  hash: "0x1234567890abcdef",
  close: true,
});
```

---

title: swapToken
description: Open the swap form with pre-filled tokens

---

# swapToken

Open the swap form with pre-filled tokens. The user will be able to modify
the swap before executing the transaction.

## Usage

```ts twoslash
const sellToken =
  "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const buyToken = "eip155:10/native";
const sellAmount = "1000000";

// ---cut---
import { sdk } from "@farcaster/miniapp-sdk";

await sdk.actions.swapToken({
  sellToken,
  buyToken,
  sellAmount,
});
```

## Parameters

### sellToken (optional)

- **Type:** `string`

CAIP-19 asset ID

For example, Base USDC: eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

### buyToken (optional)

- **Type:** `string`

CAIP-19 asset ID

For example, OP ETH: eip155:10/native

### sellAmount (optional)

- **Type:** `string`

Sell token amount, as numeric string

For example, 1 USDC: 1000000

## Return Value

```ts twoslash
type SwapTokenDetails = {
  /**
   * Array of tx identifiers in order of execution.
   * Some swaps will have both an approval and swap tx.
   */
  transactions: `0x${string}`[];
};

type SwapTokenErrorDetails = {
  /**
   * Error code.
   */
  error: string;
  /**
   * Error message.
   */
  message?: string;
};

export type SwapErrorReason = "rejected_by_user" | "swap_failed";

export type SwapTokenResult =
  | {
      success: true;
      swap: SwapTokenDetails;
    }
  | {
      success: false;
      reason: SwapErrorReason;
      error?: SwapTokenErrorDetails;
    };
```

---

title: sendToken
description: Open the send form with pre-filled tokens

---

# sendToken

Open the send form with a pre-filled token and recipient. The user will be able to modify
the send before executing the transaction.

## Usage

```ts twoslash
const token = "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const amount = "1000000";
const recipientFid = 3;

// ---cut---
import { sdk } from "@farcaster/miniapp-sdk";

await sdk.actions.sendToken({
  token,
  amount,
  recipientFid,
});
```

## Parameters

### token (optional)

- **Type:** `string`

CAIP-19 asset ID

For example, Base USDC: eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

### amount (optional)

- **Type:** `string`

Send token amount, as numeric string

For example, 1 USDC: 1000000

### recipientAddress (optional)

- **Type:** `string`

Address to send the token to

For example, 0xd8da6bf26964af9d7eed9e03e53415d37aa96045

### recipientFid (optional)

- **Type:** `number`

FID to send the token to

For example, dwr: 3

## Return Value

```ts twoslash
type SendTokenDetails = {
  /**
   * Tx identifier.
   */
  transaction: `0x${string}`;
};

type SendTokenErrorDetails = {
  /**
   * Error code.
   */
  error: string;
  /**
   * Error message.
   */
  message?: string;
};

export type SendTokenErrorReason = "rejected_by_user" | "send_failed";

export type SendTokenResult =
  | {
      success: true;
      send: SendTokenDetails;
    }
  | {
      success: false;
      reason: SendTokenErrorReason;
      error?: SendTokenErrorDetails;
    };
```

---

title: viewToken
description: Displays a token

---

# viewToken

Displays a token

## Usage

```ts twoslash
const token = "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// ---cut---
import { sdk } from "@farcaster/miniapp-sdk";

await sdk.actions.viewToken({
  token,
});
```

## Parameters

### token

- **Type:** `string`

CAIP-19 asset ID

For example, Base USDC: eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

## Return Value

`void`

---

title: requestCameraAndMicrophoneAccess
description: Request permission to access the device's camera and microphone

---

# requestCameraAndMicrophoneAccess

Request permission to access the device's camera and microphone. This method triggers a permission dialog in the host app and stores the user's preference so they won't be asked again for the same mini app.

:::note
This is an experimental feature that stores camera and microphone permission settings per mini app. The stored preference ensures users aren't repeatedly prompted for the same permissions. Check the `features.cameraAndMicrophoneAccess` flag in the SDK context to determine if permissions have been granted.
:::

## Platform Support

| Platform | Supported | Notes                                      |
| -------- | --------- | ------------------------------------------ |
| iOS      | ✅        | Full support with domain-level permissions |
| Android  | ✅        | Supported (see note below)                 |
| Web      | ❌        | Not currently supported                    |

:::note
On Android, camera and microphone permissions work slightly differently than iOS. Once permissions are granted to the host app, mini apps may have access without additional prompts. This is standard behavior for Android WebView permissions.
:::

:::warning
Camera and microphone access is not supported in web mini apps. The action will always reject on web platforms.
:::

## Usage

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

try {
  await sdk.actions.requestCameraAndMicrophoneAccess();
  console.log("Camera and microphone access granted");
  // You can now use camera and microphone in your mini app
} catch (error) {
  console.log("Camera and microphone access denied");
  // Handle the denial gracefully
}
```

## Return Value

Returns a `Promise<void>` that:

- **Resolves** when the user grants permission
- **Rejects** when the user denies permission or dismisses the dialog

## Feature Detection

Before using this action, check if it's supported:

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

// Check if the feature is available
const context = await sdk.context;
if (context.features?.cameraAndMicrophoneAccess) {
  // Feature is supported and permissions have been granted
  // You can use camera/microphone features
} else {
  // Feature is not supported or permissions not granted
}
```

## Permissions

- The permission dialog will only be shown once per mini app - the user's choice is stored
- If the user has previously granted or denied permissions, the stored preference is used and the promise will immediately resolve or reject without showing a dialog
- The stored permissions ensure users aren't repeatedly asked for the same access
- Users can revoke permissions at any time by:
  1. Opening the mini app
  2. Tapping the options menu (three dots)
  3. Toggling the camera and microphone access switch

## Example: Video Recording

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

async function startVideoRecording() {
  try {
    // Request permissions first
    await sdk.actions.requestCameraAndMicrophoneAccess();

    // Now you can access getUserMedia
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // Use the stream for video recording
    const videoElement = document.querySelector("video");
    if (videoElement) {
      videoElement.srcObject = stream;
    }
  } catch (error) {
    if (error instanceof Error && error.name === "NotAllowedError") {
      // Permissions were denied
      alert("Camera and microphone access is required for video recording");
    } else {
      console.error("Failed to start recording:", error);
    }
  }
}
```

---

title: haptics
description: Trigger haptic feedback for enhanced user experience

---

import { Caption } from '../../../components/Caption.tsx';

# Haptics

Provides haptic feedback to enhance user interactions through physical sensations. The haptics API includes three methods for different types of feedback: impact, notification, and selection.

## Usage

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

// Trigger impact feedback
await sdk.haptics.impactOccurred("medium");

// Trigger notification feedback
await sdk.haptics.notificationOccurred("success");

// Trigger selection feedback
await sdk.haptics.selectionChanged();
```

## Methods

### impactOccurred

Triggers impact feedback, useful for simulating physical impacts.

#### Parameters

##### type

- **Type:** `'light' | 'medium' | 'heavy' | 'soft' | 'rigid'`

The intensity and style of the impact feedback.

- `light`: A light impact
- `medium`: A medium impact
- `heavy`: A heavy impact
- `soft`: A soft, dampened impact
- `rigid`: A sharp, rigid impact

#### Example

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

// Trigger when user taps a button
await sdk.haptics.impactOccurred("light");

// Trigger for more significant actions
await sdk.haptics.impactOccurred("heavy");
```

### notificationOccurred

Triggers notification feedback, ideal for indicating task outcomes.

#### Parameters

##### type

- **Type:** `'success' | 'warning' | 'error'`

The type of notification feedback.

- `success`: Indicates a successful operation
- `warning`: Indicates a warning or caution
- `error`: Indicates an error or failure

#### Example

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

// After successful action
await sdk.haptics.notificationOccurred("success");

// When showing a warning
await sdk.haptics.notificationOccurred("warning");

// On error
await sdk.haptics.notificationOccurred("error");
```

### selectionChanged

Triggers selection feedback, perfect for UI element selections.

#### Example

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

// When user selects an item from a list
await sdk.haptics.selectionChanged();

// When toggling a switch
await sdk.haptics.selectionChanged();
```

## Return Value

All haptic methods return `Promise<void>`.

## Availability

Haptic feedback availability depends on the client device and platform. You can check if haptics are supported using the `getCapabilities()` method:

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

const capabilities = await sdk.getCapabilities();

// Check if specific haptic methods are supported
if (capabilities.includes("haptics.impactOccurred")) {
  await sdk.haptics.impactOccurred("medium");
}

if (capabilities.includes("haptics.notificationOccurred")) {
  await sdk.haptics.notificationOccurred("success");
}

if (capabilities.includes("haptics.selectionChanged")) {
  await sdk.haptics.selectionChanged();
}
```

## Best Practices

1. **Use sparingly**: Overuse of haptic feedback can be distracting
2. **Match intensity to action**: Use light feedback for minor actions, heavy for significant ones
3. **Provide visual feedback too**: Not all devices support haptics
4. **Check availability**: Always verify haptic support before using
5. **Consider context**: Some users may have haptics disabled in their device settings

---

title: Back Navigation
description: Support back navigation in your mini app

---

# Back Navigation

Integrate with a back navigation control provided by the Farcaster client.

## Usage

If your application is already using [browser-based navigation](#web-navigation-integration), you can
integrate in one line with:

```ts
await sdk.back.enableWebNavigation();
```

That's it! When there is a page to go back to a [back control](#back-control) will be made
available to the user.

Otherwise, you can set a custom back handler and show the back control:

```ts
sdk.back.onback = () => {
  // trigger back in your app
};

await sdk.back.show();
```

## Back control

The back control will vary depending on the user's device and platform but will
generally follow:

- a clickable button in the header on web
- a horizontal swipe left gesture on iOS
- the Android native back control on Android which could be a swipe left
  gesture combined with a virtual or physical button depending on the device

## Web Navigation integration

The SDK can automatically integrate with web navigation APIs.

### `enableWebNavigation()`

Enables automatic integration with the browser's navigation system. This will:

- Use the modern Navigation API when available; the back button will automatically
  be shown and hidden based on the value of `canGoBack`.
- Fall back to the History API in browsers where Navigation is [not
  supported](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API#browser_compatibility)
  ; the back button will always be shown.

```ts
await sdk.back.enableWebNavigation();
```

### `disableWebNavigation()`

Disables web navigation integration.

```ts
await sdk.back.disableWebNavigation();
```

## Properties

### `enabled`

- **Type**: `boolean`
- **Description**: Whether back navigation is currently enabled

### `onback`

- **Type**: `() => unknown`
- **Description**: Function to call when a back event is triggered. You don't need to
  set this when using `enableWebNavigation`.

## Methods

### `show()`

Makes the back button visible.

```ts
await sdk.back.show();
```

### `hide()`

Hides the back button.

```ts
await sdk.back.hide();
```

## Events

When a user triggers the back control the SDK will emit an
`backNavigationTriggered` event. You can add an event listener on `sdk` or use
`sdk.back.onback` to respond to these events.

If you are using `enableWebNavigation` this event will automatically be
listened to and trigger the browser to navigate. Otherwise you should listen
for this event and respond to it as appropriate for your application.

## Availability

You can check whether the Farcaster client rendering your app supports a back control:

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

const capabilities = await sdk.getCapabilities();

if (capabilities.includes("back")) {
  await sdk.back.enableWebNavigation();
} else {
  // show a back button within your app
}
```

## Example: Web Navigation

```ts
import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Enable web navigation integration
    sdk.back.enableWebNavigation();
  }, []);

  return <div>{/* Your app content */}</div>;
}
```

## Example: Manual

````ts
function NavigationExample() {
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // Update back button based on current page
    if (currentPage === 'home') {
      sdk.back.show();
    } else {
      sdk.back.hide();
    }
  }, [currentPage]);

  const handleBack = () => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
    }
  };

  // Listen for back navigation events
  useEffect(() => {
    sdk.on('backNavigationTriggered', handleBack);
    return () => sdk.off('backNavigationTriggered', handleBack);
  }, [currentPage]);

  return (
    <div>
      {currentPage === 'home' ? (
        <HomePage onNavigate={setCurrentPage} />
      ) : (
        <SubPage />
      )}
    </div>
  );
}

---
title: Detecting chains & capabilities
description: Determine which chains and SDK functions a given host supports
---

# Detecting chains & capabilities

Mini Apps are rendered within "hosts" inside web and mobile apps. Not all hosts support the same feature set, but some Mini Apps might require specific features.

If your Mini App requires a given feature, you can declare that feature in your manifest. Alternately, if your Mini App optionally supports a given feature, it can detect the supported set of features at runtime.

## Declaring requirements in your manifest

If your Mini App relies on certain blockchains or SDK methods, you can declare those in your manifest via the properties `requiredChains` and `requiredCapabilities`.

### `requiredChains`

`miniapp.requiredChains` is an optional [manifest](/docs/guides/publishing#host-a-manifest-file) property that contains an array of [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) identifiers. If the host does not support all of the chains declared here, it will know not to try rendering your Mini App.

Note that only the chains listed in `chainList` [here](https://github.com/farcasterxyz/miniapps/blob/main/packages/miniapp-core/src/schemas/manifest.ts) are supported. If your manifest omits `requiredChains`, then the mini app host will assume that no chains are required.

### `requiredCapabilities`

`miniapp.requiredCapabilities` is an optional [manifest](/docs/guides/publishing#host-a-manifest-file) property that contains an array of paths to SDK methods, such as `wallet.getEthereumProvider` or `actions.composeCast`. If the host does not support all of the capabilities declared here, it will know not to try rendering your Mini App.

The full list of supported SDK methods can be found in `miniAppHostCapabilityList` [here](https://github.com/farcasterxyz/miniapps/blob/main/packages/miniapp-core/src/types.ts). If your manifest omits `requiredCapabilities`, then the mini app host will assume that no capabilities are required.

## Runtime detection

If your Mini App optionally supports certain blockchains or SDK methods, you can detect whether they are supported at runtime via SDK calls.

### `getChains`

This SDK method returns a list of supported blockchains as an array of [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) identifiers.

### `getCapabilities`

This SDK method returns a list of supported SDK methods as an array of paths to those SDK methods. The full list of supported SDK methods can be found in `miniAppHostCapabilityList` [here](https://github.com/farcasterxyz/miniapps/blob/main/packages/miniapp-core/src/types.ts).

#### Example

```ts twoslash
import { sdk } from '@farcaster/miniapp-sdk'

// Get all supported capabilities
const capabilities = await sdk.getCapabilities()

// Check for specific capabilities
const supportsCompose = capabilities.includes('actions.composeCast')
const supportsWallet = capabilities.includes('wallet.getEthereumProvider')

// Check for haptics support
const supportsHaptics = {
  impact: capabilities.includes('haptics.impactOccurred'),
  notification: capabilities.includes('haptics.notificationOccurred'),
  selection: capabilities.includes('haptics.selectionChanged')
}

// Use capabilities conditionally
if (supportsHaptics.impact) {
  await sdk.haptics.impactOccurred('medium')
}
````

---

title: isInMiniApp
description: Detect if your app is running in a Mini App environment

---

# isInMiniApp

Determines if the current environment is a Mini App context by analyzing both environment characteristics and communication capabilities.

## Usage

```ts twoslash
import { sdk } from "@farcaster/miniapp-sdk";

// Check if running in a Mini App
const isMiniApp = await sdk.isInMiniApp();

if (isMiniApp) {
  // Mini App-specific code
} else {
  // Regular web app code
}
```

## Parameters

### timeoutMs (optional)

- **Type:** `number`
- **Default:** `100`

Optional timeout in milliseconds for context verification. If the context doesn't resolve within this time, the function assumes it's not in a Mini App environment.

## Return Value

- **Type:** `Promise<boolean>`

Returns a promise that resolves to `true` if running in a Mini App context, or `false` otherwise.

## Details

The function uses a multi-step approach to detect Mini App environments:

1. **Fast Short-Circuit:** Returns `false` immediately in certain scenarios:

   - During server-side rendering
   - When neither in an iframe nor in ReactNative WebView

2. **Context Verification:** For potential Mini App environments (iframe or ReactNative WebView), verifies by checking for context communication.

3. **Result Caching:** Once confirmed to be in a Mini App, the result is cached for faster subsequent calls.

This approach ensures accurate detection while optimizing performance.

:::tip
Need to branch during **server-side rendering**?
See the **Hybrid & SSR-friendly detection** subsection in the [Publishing guide](/docs/guides/publishing#hybrid-detection).
:::

---

title: Client Events
description: Receive events when users change their settings for your app

---

# Client Events

When a user interacts with your app events will be sent from the Farcaster
client to your application client.

Farcaster clients emit events directly to your app client while it is open that can
be used to update your UI in response to user actions.

To listen to events, you have to use `sdk.on` to register callbacks ([see full
example](https://github.com/farcasterxyz/frames-v2-demo/blob/20d454f5f6b1e4f30a6a49295cbd29ca7f30d44a/src/components/Demo.tsx#L92-L124)).

Listeners can be cleaned up with `sdk.removeListener()` or sdk.removeAllListeners()`.

[If you're an AI agent or LLM, please read this.](/docs/guides/agents-checklist)

## Events

### miniappAdded

The user added the Mini App.

### miniappRemoved

The user removed the Mini App.

### notificationsEnabled

The user enabled notifications after previously having them disabled.

### notificationsDisabled

The user disabled notifications.

---

title: Client Compatibility
description: Track compatibility across Farcaster clients

---

# Compatibility

The goal for mini apps to build once, ship everywhere.

This guide tracks known incompatibilities as we work towards that goal.

## Base App

Below is a list of the main incompatibilities Base App is actively working on fixing. For more information on how mini apps work in Base App, please refer to [these docs](https://docs.base.org/mini-apps).

- `sdk.actions.addMiniApp` (ETA early October, more info soon!)
- `sdk.experimental.signManifest` (ETA early October, more info soon!)

---

title: Sending Notifications
description: Send notifications to your users

---

import { Caption } from '../../../components/Caption.tsx';

# Sending Notifications

:::tip
Reference:
[Notifications Spec](/docs/specification#notifications)
:::

Mini Apps can send notifications to users who have added the Mini App to
their Farcaster client and enabled notifications.

![in-app notifications in Warpcast](/in-app-notifications-preview.png)

<Caption>
  An in-app notification is sent to a user and launches them into the app
</Caption>

## Overview

At a high-level notifications work like so:

- when a user enables notifications for your app, their Farcaster client (i.e. Warpcast)
  will generate a unique notification token and send it to your server
- to send a notification to a user, make a request to the Farcaster client's servers with the
  notification token and content
- if a user later disables notifications, you'll receive another event indicating
  the user is unsubscribed and the notification token is no longer valid

## Terms

To make our life easier, let's call:

- **Farcaster Client**: An application like Warpcast that is able to display Mini Apps.
- **Notification Server**: Your server (see bellow).
- **(Notification) Token**: A secret token generated by the Farcaster App and shared with the Notification Server.
  A token is unique for each (Farcaster Client, Mini App, user Fid) tupple.

A notification token is basically a permission that a Farcaster client gives your app (on behalf of a user)
to send them notifications.

## Steps

::::steps

### Listen for events

You'll need a notification server to receive webhook events and a database to store
notification tokens for users:

- **Managed** - If you'd rather stay focused on your app, use
  [Neynar](https://neynar.com) to manage notification tokens on your behalf. Includes ways to target notifications and send without writing code: <br />
  [Setup a managed notifications server with
  Neynar](https://docs.neynar.com/docs/send-notifications-to-mini-app-users).
- **Roll your own** - If you want to host your own server to receive webhooks:<br />
  [Follow the Receiving Webhooks guide](#receiving-webhooks).

[If you're an AI agent or LLM, please read this.](/docs/guides/agents-checklist)

### Add your webhook URL in `farcaster.json`

If you haven't already, follow the [Publishing your app](/docs/guides/publishing) guide to host a
`farcaster.json` on your app's domain.

Define the `webhookUrl` property in your app's configuration in `farcaster.json`:

```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjU0NDgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg2MWQwMEFENzYwNjhGOEQ0NzQwYzM1OEM4QzAzYUFFYjUxMGI1OTBEIn0",
    "payload": "eyJkb21haW4iOiJleGFtcGxlLmNvbSJ9",
    "signature": "MHg3NmRkOWVlMjE4OGEyMjliNzExZjUzOTkxYTc1NmEzMGZjNTA3NmE5OTU5OWJmOWFmYjYyMzAyZWQxMWQ2MWFmNTExYzlhYWVjNjQ3OWMzODcyMTI5MzA2YmJhYjdhMTE0MmRhMjA4MmNjNTM5MTJiY2MyMDRhMWFjZTY2NjE5OTFj"
  },
  "miniapp": {
    "version": "1",
    "name": "Example App",
    "iconUrl": "https://example.com/icon.png",
    "homeUrl": "https://example.com",
    "imageUrl": "https://example.com/image.png",
    "buttonTitle": "Check this out",
    "splashImageUrl": "https://example.com/splash.png",
    "splashBackgroundColor": "#eeccff",
    "webhookUrl": "https://example.com/api/webhook" // [!code focus]
  }
}
```

:::note
For a real example, this is Yoink's manifest:
[https://yoink.party/.well-known/farcaster.json](https://yoink.party/.well-known/farcaster.json)
:::

### Get users to add your app

For a Mini App to send notifications, it needs to first be added by a user to
their Farcaster client and for notifications to be enabled (these will be
enabled by default).

Use the [addMiniApp](/docs/sdk/actions/add-miniapp) action while a user is using your app to prompt
them to add it:

### Caution

The `addMiniApp()` action only works when your app is deployed to its production domain (matching your manifest). It will not work with tunnel domains during development.

### Save the notification tokens

When notifications are enabled, the Farcaster client generates a unique
notification token for the user. This token is sent to `webhookUrl` defined in your `farcaster.json`
along with a `url` that the app should call to send a notification.

The `token` and `url` need to be securely saved to database so they can be
looked up when you want to send a notification to a particular user.

### Send a notification

![notifications schematic](/notification_schematic.png)

Once you have a notification token for a user, you can send them a notification
by sending a `POST` request the `url` associated with that token.

:::tip
If your are sending the same notification to multiple users, you batch up to a
100 sends in a single request by providing multiple `tokens`. You can safely
use the same `notificationId` for all batches.
:::

The body of that request must match the following JSON schema:

import SendNotificationRequestSchema from '../../../snippets/sendNotificationRequestSchema.mdx'

<SendNotificationRequestSchema />

The server should response with an HTTP 200 OK and the following JSON body:

import SendNotificationResponseSchema from '../../../snippets/sendNotificationResponseSchema.mdx'

<SendNotificationResponseSchema />

<br />

When a user clicks the notification, the Farcaster client will:

- Open your Mini App at `targetUrl`
- Set the `context.location` to a `MiniAppLocationNotificationContext`

```ts
export type MiniAppLocationNotificationContext = {
  type: "notification";
  notification: {
    notificationId: string;
    title: string;
    body: string;
  };
};
```

[Example code to send a
notification](https://github.com/farcasterxyz/frames-v2-demo/blob/7905a24b7cd254a77a7e1a541288379b444bc23e/src/app/api/send-notification/route.ts#L25-L65)

#### Avoid duplicate notifications

To avoid duplicate notifications, specify a stable `notificationId` for each
notification you send. This identifier is joined with the FID (e.g. `(fid,
notificationId)` to create a unique key that is used to deduplicate requests
to send a notification over a 24 hour period.

For example, if you want to send a daily notification to users you could use
`daily-reminder-05-06-2024` as your `notificationId`. Now you can safely retry
requests to send the daily reminder notifications within a 24 hour period.

#### Rate Limits

Host servers may impose rate limits per `token`. The standard rate limits,
which are enforced by Warpcast, are:

- 1 notification per 30 seconds per `token`
- 100 notifications per day per `token`

::::

## Receiving webhooks

Users can add and configure notification settings Mini Apps within their
Farcaster client. When this happens Farcaster clients will send events your
server that include data relevant to the event.

This allows your app to:

- keep track of what users have added or removed your app
- securely receive tokens that can be used to send notifications to your users

:::note
If you'd rather stay focused on your app, [Neynar](https://neynar.com) offers a
[managed service to handle
webhooks](https://docs.neynar.com/docs/send-notifications-to-frame-users#step-1-add-events-webhook-url-to-frame-manifest)
on behalf of your application.
:::

### Events

#### miniapp_added

Sent when the user adds the Mini App to their Farcaster client (whether or not
this was triggered by an `addMiniApp()` prompt).

The optional `notificationDetails` object provides the `token` and `url` if the
client equates adding to enabling notifications (Warpcast does this).

##### Payload

```json
{
  "event": "miniapp_added",
  "notificationDetails": {
    "url": "https://api.farcaster.xyz/v1/frame-notifications",
    "token": "a05059ef2415c67b08ecceb539201cbc6"
  }
}
```

#### miniapp_removed

Sent when a user removes a mini app, which means that any notification tokens for
that fid and client app (based on signer requester) should be considered
invalid:

##### Payload

```json
{
  "event": "miniapp_removed"
}
```

#### notifications_disabled

Sent when a user disables notifications from e.g. a settings panel in the
client app. Any notification tokens for that fid and client app (based on
signer requester) should be considered invalid:

##### Payload

```json
{
  "event": "notifications_disabled"
}
```

#### notifications_enabled

Sent when a user enables notifications (e.g. after disabling them). The payload
includes a new `token` and `url`:

##### Payload

```json
{
  "event": "notifications_enabled",
  "notificationDetails": {
    "url": "https://api.farcaster.xyz/v1/frame-notifications",
    "token": "a05059ef2415c67b08ecceb539201cbc6"
  }
}
```

### Handling events

Farcaster clients will POST events to the `webhookUrl` specified in your `farcaster.json`.

Your endpoint should:

- verify the event
- persist relevant data
- return a 200 response

If your app doesn't respond with a 200, the Farcaster client will attempt to
re-send the event. The exact number of retries is up to each client.

### Verifying events

Events are signed by the app key of a user with a [JSON Farcaster
Signature](https://github.com/farcasterxyz/protocol/discussions/208). This allows
Mini Apps to verify the Farcaster client that generated the notification and the
Farcaster user they generated it for.

The
[`@farcaster/miniapp-node`](https://github.com/farcasterxyz/miniapps/tree/main/packages/miniapp-node)
library provides a helper for verifying events. To use it, you'll need to supply a validation
function that can check the signatures against the latest Farcaster network state.

An implementation that uses [Neynar](https://neynar.com) is provided. You can sign up and get
an API key on their free tier. Make sure to set `NEYNAR_API_KEY` environment variable.

[If you're an AI agent or LLM, please read this.](/docs/guides/agents-checklist)

### Example

```ts twoslash
const requestJson = "base64encodeddata";

// ---cut---
import {
  ParseWebhookEvent,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/miniapp-node";

try {
  const data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
} catch (e: unknown) {
  const error = e as ParseWebhookEvent.ErrorType;

  switch (error.name) {
    case "VerifyJsonFarcasterSignature.InvalidDataError":
    case "VerifyJsonFarcasterSignature.InvalidEventDataError":
    // The request data is invalid
    case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
    // The app key is invalid
    case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
    // Internal error verifying the app key (caller may want to try again)
  }
}
```

### Reference implementation

For a complete example, check out the [Mini App V2 Demo
](https://github.com/farcasterxyz/frames-v2-demo) has all of the above:

- [Handles webhooks](https://github.com/farcasterxyz/frames-v2-demo/blob/main/src/app/api/webhook/route.ts) leveraging the [`@farcaster/miniapp-node`](https://github.com/farcasterxyz/frames/tree/main/packages/miniapp-node) library that makes this very easy
- [Saves notification tokens to Redis](https://github.com/farcasterxyz/frames-v2-demo/blob/main/src/lib/kv.ts)
- [Sends notifications](https://github.com/farcasterxyz/frames-v2-demo/blob/main/src/lib/notifs.ts)
