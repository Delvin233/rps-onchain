# Send Notifications to Mini App Users

> This guide walks you through a simple setup for enabling notifications for your mini app

<Info>
  ### This tutorial refers to these two APIs: [Send notifications](/reference/publish-frame-notifications), [List of frame notification tokens](/reference/fetch-notification-tokens)
</Info>

## Overview

Farcaster miniapps enable developers to send notifications to users who have added the mini app to their Farcaster client and enabled notifications.

Neynar provides a simple way to:

- manage approved notification tokens, no need to store on developer side
- send notifications in a single API call, no need to batch
- automate handling of notification permission revokes, and mini app "remove" events
- target notifications to specific user cohorts
- send notifications using the dev portal without having to write code
- track notification analytics including open rates

Mini app analytics will automatically populate in the Dev Portal dashboard once you use Neynar for notifications.

## Set up Notifications

<Tip>
  <b>If you don't have a Neynar developer account yet, sign up for free [here](https://neynar.com) </b>
</Tip>

### Step 1: Add events webhook URL to Mini App Manifest

#### a) Locate the Neynar frame events webhook URL

The Neynar mini app events webhook URL is on the Neynar app page. Navigate to [dev.neynar.com/app](https://dev.neynar.com/app) and then click on the app.

It should be in this format -`https://api.neynar.com/f/app/<your_client_id>/event`. See the highlighted URL in the image below.

<Frame>
  <img src="https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/da35cbb784332bb13686353ac326b0d50bf6ed01e588e66e18e77e8fccb6ff67-image.png?fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=82c78a7ea7d2d9b2b482dcbb9ef98c75" alt="Neynar mini app events webhook URL" data-og-width="1028" width="1028" data-og-height="860" height="860" data-path="images/docs/da35cbb784332bb13686353ac326b0d50bf6ed01e588e66e18e77e8fccb6ff67-image.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/da35cbb784332bb13686353ac326b0d50bf6ed01e588e66e18e77e8fccb6ff67-image.png?w=280&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=ebb03a4bec249f3f8d90fa92576eb178 280w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/da35cbb784332bb13686353ac326b0d50bf6ed01e588e66e18e77e8fccb6ff67-image.png?w=560&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=be9d43e039d2bcc13a04aaf83fbdda99 560w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/da35cbb784332bb13686353ac326b0d50bf6ed01e588e66e18e77e8fccb6ff67-image.png?w=840&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=f3be0f203ac621168933b0434512d11d 840w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/da35cbb784332bb13686353ac326b0d50bf6ed01e588e66e18e77e8fccb6ff67-image.png?w=1100&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=19fd9a67f974ccf7f128ceb58f2b03a3 1100w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/da35cbb784332bb13686353ac326b0d50bf6ed01e588e66e18e77e8fccb6ff67-image.png?w=1650&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=65247713bfd3dadf5b307c70c4dfd7e8 1650w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/da35cbb784332bb13686353ac326b0d50bf6ed01e588e66e18e77e8fccb6ff67-image.png?w=2500&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=872c32051333d22fafc6d71e3b9806b3 2500w" />
</Frame>

#### b) Set this URL in the mini app manifest

Frame servers must provide a JSON manifest file on their domain at the well-known URI. for example `https://your-frame-domain.com/.well-known/farcaster.json`.

Set the Neynar frame events URL as the `webhookUrl` to the Frame Config object inside the manifest. Here's an example manifest

<CodeGroup>
  ```json JSON theme={"system"}
  {
    "accountAssociation": {
      "header": "eyJmaWQiOjE5MSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDNhNmRkNTY5ZEU4NEM5MTgyOEZjNDJEQ0UyMGY1QjgyN0UwRUY1QzUifQ",
      "payload": "eyJkb21haW4iOiIxYmNlLTczLTcwLTE2OC0yMDUubmdyb2stZnJlZS5hcHAifQ",
      "signature": "MHg1ZDU1MzFiZWQwNGZjYTc5NjllNDIzNmY1OTY0ZGU1NDMwNjE1YTdkOTE3OWNhZjE1YjQ5M2MxYWQyNWUzMTIyM2NkMmViNWQyMjFhZjkxYTYzM2NkNWU3NDczNmQzYmE4NjI4MmFiMTU4Y2JhNGY0ZWRkOTQ3ODlkNmM2OTJlNDFi"
    },
    "frame": {
      "version": "4.2.0",
      "name": "Your Frame Name",
      "iconUrl": "https://your-frame-domain.com/icon.png",
      "splashImageUrl": "https://your-frame-domain.com/splash.png",
      "splashBackgroundColor": "#f7f7f7",
      "homeUrl": "https://your-frame-domain.com",
      "webhookUrl": "https://api.neynar.com/f/app/<your_client_id>/event"
    }
  }
  ```
</CodeGroup>

<Info>
  ### Frame manifest caching

Farcaster clients might have your mini app manifest cached and would only get updated on a periodic basis.

If you're using Warpcast to test, you can go their Settings > Developer Tools > Domains, put in your Frame URL and hit the Check domain status to force a refresh.
</Info>

### Step 2: Prompt users to add your Mini App

#### a) Install @neynar/react

```bash theme={"system"}
npm install @neynar/react
```

#### b) Set up the MiniAppProvider context provider

Wrap your app with the `MiniAppProvider` component:

```javascript theme={"system"}
import { MiniAppProvider } from "@neynar/react";

export default function App() {
  return <MiniAppProvider>{/* Your app components */}</MiniAppProvider>;
}
```

#### c) Prompt the user to add your mini app using the useMiniApp hook

```javascript theme={"system"}
import { useMiniApp } from "@neynar/react";

export default function HomePage() {
  const { isSDKLoaded, addMiniApp } = useMiniApp();

  const handleAddMiniApp = async () => {
    if (!isSDKLoaded) return;

    const result = await addMiniApp();
    if (result.added && result.notificationDetails) {
      // Mini app was added and notifications were enabled
      console.log("Notification token:", result.notificationDetails.token);
    }
  };

  return <button onClick={handleAddMiniApp}>Add Mini App</button>;
}
```

The result type is:

```typescript theme={"system"}
export type FrameNotificationDetails = {
  url: string;
  token: string;
};

export type AddFrameResult =
  | {
      added: true;
      notificationDetails?: FrameNotificationDetails;
    }
  | {
      added: false;
      reason: "invalid_domain_manifest" | "rejected_by_user";
    };
```

If `added` is true and `notificationDetails` is a valid object, then the client should have called POST to the Neynar frame events webhook URL with the same details.

Neynar will manage all mini app add/remove & notifications enabled/disabled events delivered on this events webhook.

#### Alternative: Using the Mini App SDK directly

If you prefer to use the Mini App SDK directly instead of the Neynar React components:

```bash theme={"system"}
yarn add @farcaster/frame-sdk
```

Then prompt the user:

```typescript theme={"system"}
import sdk from "@farcaster/frame-sdk";

const result = await sdk.actions.addFrame();
```

### Step 3: Send a notification to users

Notifications can be broadcast to all your mini app users with notifications enabled or to a limited set of FIDs. Notifications can also be filtered so that only users meeting certain criteria receive the notification.

The `target_fids` parameter is the starting point for all filtering. Pass an empty array for `target_fids` to start with the set of all FIDs with notifications enabled for your app, or manually define `target_fids` to list specific FIDs.

#### a) Target specific users with filters via the Neynar dev portal

The [Neynar dev portal](https://dev.neynar.com) offers the same functionality as the API for broadcasting notifications. Navigate to your app and click the "Mini App" tab.
Once your mini app is configured with your Neynar webhook URL and users have enabled notifications for your mini app, you'll see a "Broadcast Notification" section with an exandable filters section.

<Frame>
  <img src="https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/broadcast-notification-with-filters.png?fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=11aa41aa1829e96dc1cf0e82673b45db" alt="Neynar mini app Broadcast Notification panel" data-og-width="2338" width="2338" data-og-height="1270" height="1270" data-path="images/docs/broadcast-notification-with-filters.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/broadcast-notification-with-filters.png?w=280&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=9d2d69e57792c13dba5a5fc6653cf0f9 280w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/broadcast-notification-with-filters.png?w=560&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=235efeadbcb1a233013eff778d12cbe7 560w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/broadcast-notification-with-filters.png?w=840&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=8c18eec59cccd2ff291a90db2b5f9a8b 840w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/broadcast-notification-with-filters.png?w=1100&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=d11ea285dca9f74cdb0e7df406cd20ac 1100w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/broadcast-notification-with-filters.png?w=1650&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=c71a5a1ebbf976aaaaee3d78eef89b48 1650w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/broadcast-notification-with-filters.png?w=2500&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=602baf160fe69ad1a17bdb2e2301d050 2500w" />
</Frame>

#### b) Target specific users with filters via the API

The following example uses the [@neynar/nodejs-sdk](https://github.com/neynarxyz/nodejs-sdk) to send notifications to users and includes a set of filtering criteria.

<CodeGroup>
  ```typescript Typescript theme={"system"}
  const targetFids = []; // target all relevant users
  const filters = {
    exclude_fids: [420, 69], // do not send to these FIDs
    following_fid: 3, // only send to users following this FID
    minimum_user_score: 0.5, // only send to users with score >= this value
    near_location: { // only send to users near a certain point
      latitude: 34.052235,
      longitude: -118.243683,
      radius: 50000, // distance in meters from the lat/log point (optional, defaults to 50km)
    }
  };
  const notification = {
    title: "🪐",
    body: "It's time to savor farcaster",
    target_url: "https://your-frame-domain.com/notification-destination",
  };

client.publishFrameNotifications({ targetFids, filters, notification }).then((response) => {
console.log("response:", response);
});

```
</CodeGroup>

Additional documentation on the API and its body parameters can be found at [/reference/publish-frame-notifications](/reference/publish-frame-notifications)

### Step 4: Check analytics

Notification analytics will automatically show in your developer portal once you start using Neynar for frame notifications.

<Frame>
<img src="https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/b963bd7c8e35263317ab6e0d1354dee4b854b471587c4ad827342ed7b83d2218-image.png?fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=fb04ad51b25f65ad90494337179c3c35" alt="Notification analytics" data-og-width="1406" width="1406" data-og-height="1154" height="1154" data-path="images/docs/b963bd7c8e35263317ab6e0d1354dee4b854b471587c4ad827342ed7b83d2218-image.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/b963bd7c8e35263317ab6e0d1354dee4b854b471587c4ad827342ed7b83d2218-image.png?w=280&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=f21101a56c9c0bfb94d92e9c04f42d97 280w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/b963bd7c8e35263317ab6e0d1354dee4b854b471587c4ad827342ed7b83d2218-image.png?w=560&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=b0aa80723d65c290522039f68c137d0f 560w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/b963bd7c8e35263317ab6e0d1354dee4b854b471587c4ad827342ed7b83d2218-image.png?w=840&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=af68960b6ad617cbe9d6ad7d9ad9399b 840w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/b963bd7c8e35263317ab6e0d1354dee4b854b471587c4ad827342ed7b83d2218-image.png?w=1100&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=18cea9970381a4a8b27a8fab63ee62df 1100w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/b963bd7c8e35263317ab6e0d1354dee4b854b471587c4ad827342ed7b83d2218-image.png?w=1650&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=5f4824515ac1389f6dd250e3814b3b26 1650w, https://mintcdn.com/neynar/4PNY113y9N9T-r9z/images/docs/b963bd7c8e35263317ab6e0d1354dee4b854b471587c4ad827342ed7b83d2218-image.png?w=2500&fit=max&auto=format&n=4PNY113y9N9T-r9z&q=85&s=dcbae41863aaea66bfec06970df4f83e 2500w" />
</Frame>

When using the `MiniAppProvider` context provider, you'll get additional analytics including notification open rates.

<Frame>
<img src="https://mintcdn.com/neynar/V7Un5QUQSGJFAZfS/images/docs/notification-campaigns.png?fit=max&auto=format&n=V7Un5QUQSGJFAZfS&q=85&s=5e374d10cc0e62888b4fec4dd9ce02ed" alt="Notification open analytics" data-og-width="2310" width="2310" data-og-height="1084" height="1084" data-path="images/docs/notification-campaigns.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/neynar/V7Un5QUQSGJFAZfS/images/docs/notification-campaigns.png?w=280&fit=max&auto=format&n=V7Un5QUQSGJFAZfS&q=85&s=2a020520bb4549f11cc1f3112d1a95a3 280w, https://mintcdn.com/neynar/V7Un5QUQSGJFAZfS/images/docs/notification-campaigns.png?w=560&fit=max&auto=format&n=V7Un5QUQSGJFAZfS&q=85&s=4e240976df0926fc51d9d3e48dbd1259 560w, https://mintcdn.com/neynar/V7Un5QUQSGJFAZfS/images/docs/notification-campaigns.png?w=840&fit=max&auto=format&n=V7Un5QUQSGJFAZfS&q=85&s=205a20a602254f6cb89e168fee24d32a 840w, https://mintcdn.com/neynar/V7Un5QUQSGJFAZfS/images/docs/notification-campaigns.png?w=1100&fit=max&auto=format&n=V7Un5QUQSGJFAZfS&q=85&s=686ec1d56faef51cb6387034cba0f793 1100w, https://mintcdn.com/neynar/V7Un5QUQSGJFAZfS/images/docs/notification-campaigns.png?w=1650&fit=max&auto=format&n=V7Un5QUQSGJFAZfS&q=85&s=0cf971365ede74360d1103a941238691 1650w, https://mintcdn.com/neynar/V7Un5QUQSGJFAZfS/images/docs/notification-campaigns.png?w=2500&fit=max&auto=format&n=V7Un5QUQSGJFAZfS&q=85&s=ce5fcc66e0617a034ba10dc4fe6dfed2 2500w" />
</Frame>

## FAQ

<AccordionGroup>
<Accordion title="How do I determine if the user has already added my mini app?">
  When using the `MiniAppProvider` context provider, you can check the `context` object from the `useMiniApp()` hook which contains the `added` boolean and `notificationDetails` object. More details in [Frame Core Types](https://github.com/farcasterxyz/frames/blob/main/packages/frame-core/src/types.ts#L58-L62)
</Accordion>

<Accordion title="What happens if I send a notification via API to a user who has revoked notification permission?">
  To avoid getting rate-limited by Farcaster clients, Neynar will filter out sending notifications to disabled tokens.
</Accordion>

<Accordion title="How do I fetch the notification tokens, URLs, and their status?">
  The [fetch notification tokens API](/reference/fetch-notification-tokens) provides access to the underlying data.
</Accordion>

<Accordion title="Are there notification rate limits?">
  Host servers may impose rate limits per `token`. The [standard rate limits, which are enforced by Merkle's Farcaster client](https://miniapps.farcaster.xyz/docs/guides/notifications#rate-limits), are:

  * 1 notification per 30 seconds per token
  * 100 notifications per day per token
</Accordion>
</AccordionGroup>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.neynar.com/llms.txt
```
