# Base App Beta

> Frequently asked questions about the Base  Wallet limited beta

Welcome to the Base app beta. Coinbase Wallet is now Base, an everything app to create, earn, trade, discover apps, and chat with friends all in one place.Here are answers to some frequently asked questions about the  beta! Thank you for building with us.

## What is Base App

Base is the new name for Coinbase Wallet. A new experience is coming, with a current beta for some users. You can continue using the same Coinbase Wallet features in Base App.

## Who can participate in the beta?

The beta is currently open to a limited group of testers. We’ll be rolling out to more users on our waitlist soon.

## How do I get access to the beta app?

Join the waitlist at [base.app](http://www.base.app)

## Basenames

<AccordionGroup>
  <Accordion title="I already have a basename but it isn’t showing up/ I don’t have the option to transfer it.">
    A wallet can use multiple basenames. Sign up with a new basename, then transfer your existing basename to this new wallet. Here are the steps to transfer and use your existing basename.

    1. [Transfer the basename between wallets](https://docs.base.org/identity/basenames/basenames-faq#10-how-do-i-transfer-my-basename-to-another-address).
    2. [Set the basename as the primary name on your new wallet.](https://docs.base.org/identity/basenames/basenames-faq#9-how-do-i-set-my-basename-as-my-primary-name-for-my-address)
  </Accordion>

  <Accordion title="Will my basename show up on Farcaster?">
    Your basename will only be visible from users in the Base beta. Interaction from other clients will display your Farcaster username if you connected an account. If you create a new account your base name is set as the username on Farcaster.
  </Accordion>
</AccordionGroup>

## Wallet and Funds

### I logged into the beta, but don’t see my funds from my previous Coinbase Wallet.

The Base beta currently only supports smart wallets. Your funds are safe and still in the app. If you created a new smart wallet during the onboarding process, then your previous Externally Owned Account (EOA) wallet will only be available in the classic .

You can return to your previous wallet by toggling beta mode off.
Navigate to the Social tab (first icon), tap your profile pic, and toggle “beta mode” off.

### Smart Wallet

What is a smart wallet?
A smart wallet is a passkey-secured, self-custodial onchain wallet that's embedded in the app. It's designed for easy onboarding and better user experience. No browser extensions, no app switching.

If you don't have a smart wallet, you will create one in the onboarding flow for the new beta app.

**I have Base, but how do I know if I have a smart wallet?**

If you use a passkey to sign onchain transactions, you have a smart wallet. If you don't know or you have a 12 word recovery phrase backed up somewhere, you use an EOA (externally owned account), not a smart wallet.

From the in-app browser, go to wallet.coinbase.com and log in. If you have a smart wallet, you'll see it say "smart wallet" in your account details.

You'll be asked to create or import a smart wallet on the way into the beta. If you are uncertain, create a new wallet.

**Do I need a smart wallet for the beta?**
Yes. The beta is smart wallet only

### Common Issues

<AccordionGroup>
  <Accordion title="I logged into the beta, but don’t see my funds from my previous Coinbase Wallet.">
    The Base beta currently only supports smart wallets. Your funds are safe and still in the app. If you created a new smart wallet during the onboarding process, then your previous Externally Owned Account (EOA) wallet will only be available in the classic .

    <Info>
      You can return to your previous wallet by toggling beta mode off.
      Navigate to the Social tab (first icon), tap your profile pic, and toggle "beta mode" off.
    </Info>
  </Accordion>
</AccordionGroup>

## Farcaster Integration

<AccordionGroup>
  <Accordion title="How do I connect my Farcaster account?">
    Open the social tab and engage with any post (tap like or recast). You’ll be prompted to open the Farcaster app to connect your account. Follow the prompts to link Base Wallet to Farcaster.
  </Accordion>

  <Accordion title="What if I don't have a Farcaster account?">
    When signing up to the beta experience, you will be prompted to create a social account.
  </Accordion>
</AccordionGroup>

## Beta Management

### Toggling Beta Mode

**How can I toggle the beta off in Base again:** Navigate to the Social tab (first icon), tap your profile photo, and toggle “beta mode” off.

**I toggled beta mode off - how do I rejoin?** Navigate to the Assets tab (last tab on the right), select the settings icon in the upper right, and toggle “Beta mode”.

### Additional Questions

<AccordionGroup>
  <Accordion title="I needed to reinstall Base app and no longer have access to the beta - can I get another invite?">
    Unfortunately, our invites are one time use. If you uninstall the app, we aren’t able to add you back into the beta. However, all your wallets will still be available as long as you have your passkeys, backups, and recovery phrases.
  </Accordion>
</AccordionGroup>

## Launch Timeline

<AccordionGroup>
  <Accordion title="When will the official app launch?">
    We will announce the official app launch date soon - thanks for being a part of the beta!
  </Accordion>
</AccordionGroup>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.base.org/llms.txt


# Migrate an Existing App

> Quickly migrate your existing app to a mini app, preview it in Base Build, and publish to the Base app.

<Panel>
  <iframe className="w-3/4 aspect-video rounded-xl mx-auto block" src="https://www.youtube-nocookie.com/embed/bChuIvqLiX0" title="Turning an Existing App into a Mini App on the Base App" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
</Panel>

**Prerequisites**

* You have an existing web app
* You have a Base app account

<Steps>
  <Step title="Add the MiniApp SDK">
    <CodeGroup>
      ```bash npm theme={null}
      npm install @farcaster/miniapp-sdk
      ```

      ```bash pnpm theme={null}
      pnpm add @farcaster/miniapp-sdk
      ```

      ```bash yarn theme={null}
      yarn add @farcaster/miniapp-sdk
      ```
    </CodeGroup>
  </Step>

  <Step title="Trigger App Display">
    Once your app has loaded, call `sdk.actions.ready()` to hide the loading splash screen and display your app.

    <Tabs>
      <Tab title="Vanilla JS">
        ```javascript app.js theme={null}
        import { sdk } from '@farcaster/miniapp-sdk';

        // Once app is ready to be displayed
        await sdk.actions.ready();
        ```
      </Tab>

      <Tab title="React">
        In React apps, call `ready()` inside a `useEffect` hook to prevent it from running on every re-render.  Call `ready()` as soon as possible and avoid jitter and content reflows.

        ```typescript app.tsx theme={null}
        import { sdk } from '@farcaster/miniapp-sdk';
        import { useEffect } from 'react';

        function App() {
            useEffect(() => {
                sdk.actions.ready();
            }, []);

            return(...your app content goes here...)
        }

        export default App;

        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Host the Manifest">
    Create a file available at `https://www.your-domain.com/.well-known/farcaster.json`.

    <Tabs>
      <Tab title="Vanilla JS">
        Create the manifest file in your project at `/public/.well-known/farcaster.json`.
      </Tab>

      <Tab title="Next.js">
        Create a Next.js route to host your manifest file

        ```typescript app/.well-known/farcaster.json/route.ts theme={null}
        function withValidProperties(properties: Record<string, undefined | string | string[]>) {
        return Object.fromEntries(
            Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
        );
        }

        export async function GET() {
        const URL = process.env.NEXT_PUBLIC_URL as string;
        return Response.json(paste_manifest_json_object_here); // see the next step for the manifest_json_object
        }
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Update the Manifest">
    Copy the example manifest below and add it to the file created in the previous step. Update each field in the `miniapp`.

    For details on each field, see the [field reference](/mini-apps/features/manifest#field-reference)

    ### Example Manifest

    ```json /.well-known/farcaster.json theme={null}
    {
      "accountAssociation": {  // these will be added in step 5
        "header": "",
        "payload": "",
        "signature": ""
      },
      "baseBuilder": {
        "ownerAddress": "0x" // add your Base Account address here
      },
      "miniapp": {
        "version": "1",
        "name": "Example Mini App",
        "homeUrl": "https://ex.co",
        "iconUrl": "https://ex.co/i.png",
        "splashImageUrl": "https://ex.co/l.png",
        "splashBackgroundColor": "#000000",
        "webhookUrl": "https://ex.co/api/webhook",
        "subtitle": "Fast, fun, social",
        "description": "A fast, fun way to challenge friends in real time.",
        "screenshotUrls": [
          "https://ex.co/s1.png",
          "https://ex.co/s2.png",
          "https://ex.co/s3.png"
        ],
        "primaryCategory": "social",
        "tags": ["example", "miniapp", "baseapp"],
        "heroImageUrl": "https://ex.co/og.png",
        "tagline": "Play instantly",
        "ogTitle": "Example Mini App",
        "ogDescription": "Challenge friends in real time.",
        "ogImageUrl": "https://ex.co/og.png",
        "noindex": true
      }
    }
    ```
  </Step>

  <Step title="Create accountAssociation Credentials">
    The `accountAssociation` fields in the manifest are used to verify ownership of your app. You can generate these fields on Base Build.

    1. Ensure all changes are live so that the Manifest file is available at your app's url.
    2. Navigate to the Base Build [Account association tool](https://www.base.dev/preview?tab=account).
    3. Paste your domain in the `App URL` field (ex: sample-url.vercel.app) and click "Submit"
    4. Click on the "Verify" button that appears and follow the instructions to generate the `accountAssociation` fields.
    5. Copy the `accountAssociation` fields and paste them into the manifest file you added in the previous step.

    ```json /.well-known/farcaster.json theme={null}
    {
      "accountAssociation": {
        "header": "eyJmaWQiOjkxNTIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMmVmNzkwRGQ3OTkzQTM1ZkQ4NDdDMDUzRURkQUU5NDBEMDU1NTk2In0",
        "payload": "eyJkb21haW4iOiJhcHAuZXhhbXBsZS5jb20ifQ",
        "signature": "MHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwNDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAyMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwYzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMTIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxNzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEyNDdhNDhlZGJmMTMwZDU0MmIzMWQzZTg1ZDUyOTAwMmEwNDNkMjM5NjZiNWVjNTNmYjhlNzUzZmIyYzc1MWFmNTI4MWFiYTgxY2I5ZDE3NDAyY2YxMzQxOGI2MTcwYzFiODY3OTExZDkxN2UxMzU3MmVkMWIwYzNkYzEyM2Q1ODAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMjVmMTk4MDg2YjJkYjE3MjU2NzMxYmM0NTY2NzNiOTZiY2VmMjNmNTFkMWZiYWNkZDdjNDM3OWVmNjU0NjU1NzJmMWQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwOGE3YjIyNzQ3OTcwNjUyMjNhMjI3NzY1NjI2MTc1NzQ2ODZlMmU2NzY1NzQyMjJjMjI2MzY4NjE2YzZjNjU2ZTY3NjUyMjNhMjI2NDJkMzQ0YjMzMzMzNjUyNDY3MDc0MzE0NTYxNjQ2Yjc1NTE0ODU3NDg2ZDc5Mzc1Mzc1Njk2YjQ0MzI0ZjM1NGE2MzRhNjM2YjVhNGM3NDUzMzczODIyMmMyMjZmNzI2OTY3Njk2ZTIyM2EyMjY4NzQ3NDcwNzMzYTJmMmY2YjY1Nzk3MzJlNjM2ZjY5NmU2MjYxNzM2NTJlNjM2ZjZkMjIyYzIyNjM3MjZmNzM3MzRmNzI2OTY3Njk2ZTIyM2E2NjYxNmM3MzY1N2QwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMA"
      },
      "miniapp": {...} // these fields remain the same
    }
    ```

    <Info>
      Note: Because you are signing with your Base Account, the `signature` field will be significantly longer than if you were to sign directly with your Farcaster custody wallet.
    </Info>
  </Step>

  <Step title="Add Embed Metadata">
    Update your index.html file to include the `fc:miniapp` metadata. This is used to generate the rich embeds when your app is shared and is required for your app to display.

    <Tabs>
      <Tab title="Vanilla JS">
        Add directly to your index.html file.

        ```html index.html theme={null}
          <meta name="fc:miniapp" content='{
          "version":"next",
          "imageUrl":"https://your-app.com/embed-image",
          "button":{
              "title":"Play Now",
              "action":{
              "type":"launch_miniapp",
              "name":"Your App Name",
              "url":"https://your-app.com"
              }
          }
          }' />
        ```
      </Tab>

      <Tab title="Next.js">
        Use the `generateMetadata` function to add the `fc:miniapp` metadata.

        ```typescript app/layout.tsx theme={null}
            export async function generateMetadata(): Promise<Metadata> {
            return {
                other: {
                'fc:miniapp': JSON.stringify({
                    version: 'next',
                    imageUrl: 'https://your-app.com/embed-image',
                    button: {
                        title: `Launch Your App Name`,
                        action: {
                            type: 'launch_miniapp',
                            name: 'Your App Name',
                            url: 'https://your-app.com',
                            splashImageUrl: 'https://your-app.com/splash-image',
                            splashBackgroundColor: '#000000',
                        },
                    },
                }),
                },
            };
            }
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Push to Production">
    Ensure all changes are live.
  </Step>

  <Step title="Preview Your App">
    Use the Base Build [Preview tool](https://www.base.dev/preview) to validate your app.

    1. Add your app URL to view the embeds and click the launch button to verify the app launches as expected.
    2. Use the "Account association" tab to verify the association credentials were created correctly.
    3. Use the "Metadata" to see the metadata added from the manifest and identify any missing fields.

    <video autoPlay muted loop playsInline src="https://mintcdn.com/base-a060aa97/hlNNNlUJtlshvXQM/videos/mini-apps/basebuildpreview.mp4?fit=max&auto=format&n=hlNNNlUJtlshvXQM&q=85&s=65a4cb8ce13c9940cba6aee73b8ececb" data-path="videos/mini-apps/basebuildpreview.mp4" />
  </Step>

  <Step title="Post to Publish">
    To publish your app, create a post in the Base app with your app's URL.

    <img src="https://mintcdn.com/base-a060aa97/t8Sjfqig2G4AU7Gh/images/minikit/publish-app-base.png?fit=max&auto=format&n=t8Sjfqig2G4AU7Gh&q=85&s=71a07b27f04a4df65f47fced5b2b76a5" alt="Posting an app to Base app" height="300" className="rounded-lg" data-og-width="1143" data-og-height="1380" data-path="images/minikit/publish-app-base.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/base-a060aa97/t8Sjfqig2G4AU7Gh/images/minikit/publish-app-base.png?w=280&fit=max&auto=format&n=t8Sjfqig2G4AU7Gh&q=85&s=aa2a25afd0e22fad807642a6753446fc 280w, https://mintcdn.com/base-a060aa97/t8Sjfqig2G4AU7Gh/images/minikit/publish-app-base.png?w=560&fit=max&auto=format&n=t8Sjfqig2G4AU7Gh&q=85&s=187a5bdceb902dbfb0714088301bb58e 560w, https://mintcdn.com/base-a060aa97/t8Sjfqig2G4AU7Gh/images/minikit/publish-app-base.png?w=840&fit=max&auto=format&n=t8Sjfqig2G4AU7Gh&q=85&s=8e731221f349c80283e57ee3fddd5827 840w, https://mintcdn.com/base-a060aa97/t8Sjfqig2G4AU7Gh/images/minikit/publish-app-base.png?w=1100&fit=max&auto=format&n=t8Sjfqig2G4AU7Gh&q=85&s=fa5af302bc79f138a4989c91fb5f4c6b 1100w, https://mintcdn.com/base-a060aa97/t8Sjfqig2G4AU7Gh/images/minikit/publish-app-base.png?w=1650&fit=max&auto=format&n=t8Sjfqig2G4AU7Gh&q=85&s=90bbb4dbaea6ce60b0fc145348888ded 1650w, https://mintcdn.com/base-a060aa97/t8Sjfqig2G4AU7Gh/images/minikit/publish-app-base.png?w=2500&fit=max&auto=format&n=t8Sjfqig2G4AU7Gh&q=85&s=66414a12494828300cad19fef435b18c 2500w" />
  </Step>
</Steps>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.base.org/llms.txt


# Build Checklist

> Key steps to build a successful mini app

## Register for Base Build

Base Build unlocks Builder Rewards, boosts your chances of being featured, provides growth insights, and gives you a Preview tool to test and debug your app.

<Card title="Register for Base Build" icon="chart-simple" href="https://base.dev" />

## Authentication

Authenticate when it unlocks value, not before. Fast, optional sign‑in keeps momentum and lets users act the moment onchain interactions are needed.

<Card title="Authentication" icon="user" href="/mini-apps/core-concepts/authentication" />

## Manifest

Your manifest powers saving, discovery, and rich embeds. A strong manifest includes complete fields, valid assets, and `noindex: true` during testing.

<Card title="Sign Your Manifest" icon="signature" href="/mini-apps/core-concepts/manifest" />

## Embeds & Previews

Distribution starts in the feed: compelling previews with a clear image and launch button turn impressions into launches.

<Card title="Embeds & Previews" icon="image" href="/mini-apps/core-concepts/embeds-and-previews" />

## Search & Discovery

Be found across surfaces: set a primary category, share once to trigger indexing, and keep assets valid to appear in search and categories.

<Card title="Search & Discovery" icon="magnifying-glass" href="/mini-apps/troubleshooting/how-search-works" />

## Sharing & Social Graph

Design for social lift: native share flows and social navigation turn single‑player moments into threads and returns.

<Card title="Sharing & Social Graph" icon="share" href="/mini-apps/technical-guides/sharing-and-social-graph" />

## Notifications

Re‑engage saved users with relevant, rate‑limited notifications at the right moments.

<Card title="Notifications" icon="bell" href="/mini-apps/core-concepts/notifications" />

## UX Best Practices

Build for compact, touch‑first contexts: respect safe areas, keep interfaces concise, and emphasize clear primary actions.

<CardGroup cols={2}>
  <Card title="Design patterns" icon="puzzle-piece" href="/mini-apps/featured-guidelines/design-guidelines" />

  <Card title="OnchainKit" icon="box" href="/mini-apps/featured-guidelines/product-guidelines/foundations" />
</CardGroup>

## Build for Growth

Follow best practices to improve user engagement and retention.

<CardGroup cols={2}>
  <Card title="Optimize Onboarding" icon="users" href="/mini-apps/growth/optimize-onboarding" />

  <Card title="Build Viral Mini Apps" icon="users" href="/mini-apps/growth/build-viral-mini-apps" />
</CardGroup>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.base.org/llms.txt

# Building for The Base App

> People use apps to have fun, learn, earn, or connect. Your mini app should focus on **one core need** and do it exceptionally well.

The best apps are **simple, focused, and easy to understand.**

<Steps>
  <Step title="Ask yourself">
    * What’s the **one thing** my app does really well?

    * Why would someone **use it every day**?

    * Why and when would someone **share it with a friend**?
  </Step>

  <Step title="Audience fit">
    Base users are social, onchain-native, and interested in **creating, earning, trading, and connecting**.
  </Step>

  <Step title="Successful apps">
    * Help people **earn** (e.g. rewards, yield, creator income)

    * Help people **create** (e.g. minting, designing, storytelling)

    * Help people **have fun** (games, collectibles, quizzes, social experiences with onchain elements)

    * Are **simple,** **easy and satisfying** to use

    * Have **low friction onboarding** — avoid:

      * Collecting personal info (address, phone number, etc.)

      * Requiring upfront deposits or complex setup steps
  </Step>

  <Step title="Group chat focus">
    We’re especially excited about mini apps that make group chats more fun, functional, or rewarding — from games with onchain buy-ins, to tools like dinner-bill splitting with USDC.
  </Step>
</Steps>

### Featured Guidelines

When building mini apps for the Base app, follow the [Featured Guidelines](/mini-apps/featured-guidelines/overview):

<CardGroup>
  <Card title="Product Guidelines" icon="lightbulb" href="/mini-apps/featured-guidelines/product-guidelines" />

  <Card title="Design Guidelines" icon="brush" href="/mini-apps/featured-guidelines/design-guidelines" />

  <Card title="Technical Guidelines" icon="wrench" href="/mini-apps/featured-guidelines/technical-guidelines" />

  <Card title="Notification Guidelines" icon="bell" href="/mini-apps/featured-guidelines/notification-guidelines" />
</CardGroup>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.base.org/llms.txt

# Building for The Base App

> People use apps to have fun, learn, earn, or connect. Your mini app should focus on **one core need** and do it exceptionally well.

The best apps are **simple, focused, and easy to understand.**

<Steps>
  <Step title="Ask yourself">
    * What’s the **one thing** my app does really well?

    * Why would someone **use it every day**?

    * Why and when would someone **share it with a friend**?
  </Step>

  <Step title="Audience fit">
    Base users are social, onchain-native, and interested in **creating, earning, trading, and connecting**.
  </Step>

  <Step title="Successful apps">
    * Help people **earn** (e.g. rewards, yield, creator income)

    * Help people **create** (e.g. minting, designing, storytelling)

    * Help people **have fun** (games, collectibles, quizzes, social experiences with onchain elements)

    * Are **simple,** **easy and satisfying** to use

    * Have **low friction onboarding** — avoid:

      * Collecting personal info (address, phone number, etc.)

      * Requiring upfront deposits or complex setup steps
  </Step>

  <Step title="Group chat focus">
    We’re especially excited about mini apps that make group chats more fun, functional, or rewarding — from games with onchain buy-ins, to tools like dinner-bill splitting with USDC.
  </Step>
</Steps>

### Featured Guidelines

When building mini apps for the Base app, follow the [Featured Guidelines](/mini-apps/featured-guidelines/overview):

<CardGroup>
  <Card title="Product Guidelines" icon="lightbulb" href="/mini-apps/featured-guidelines/product-guidelines" />

  <Card title="Design Guidelines" icon="brush" href="/mini-apps/featured-guidelines/design-guidelines" />

  <Card title="Technical Guidelines" icon="wrench" href="/mini-apps/featured-guidelines/technical-guidelines" />

  <Card title="Notification Guidelines" icon="bell" href="/mini-apps/featured-guidelines/notification-guidelines" />
</CardGroup>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.base.org/llms.txt

# Building for The Base App

> People use apps to have fun, learn, earn, or connect. Your mini app should focus on **one core need** and do it exceptionally well.

The best apps are **simple, focused, and easy to understand.**

<Steps>
  <Step title="Ask yourself">
    * What’s the **one thing** my app does really well?

    * Why would someone **use it every day**?

    * Why and when would someone **share it with a friend**?
  </Step>

  <Step title="Audience fit">
    Base users are social, onchain-native, and interested in **creating, earning, trading, and connecting**.
  </Step>

  <Step title="Successful apps">
    * Help people **earn** (e.g. rewards, yield, creator income)

    * Help people **create** (e.g. minting, designing, storytelling)

    * Help people **have fun** (games, collectibles, quizzes, social experiences with onchain elements)

    * Are **simple,** **easy and satisfying** to use

    * Have **low friction onboarding** — avoid:

      * Collecting personal info (address, phone number, etc.)

      * Requiring upfront deposits or complex setup steps
  </Step>

  <Step title="Group chat focus">
    We’re especially excited about mini apps that make group chats more fun, functional, or rewarding — from games with onchain buy-ins, to tools like dinner-bill splitting with USDC.
  </Step>
</Steps>

### Featured Guidelines

When building mini apps for the Base app, follow the [Featured Guidelines](/mini-apps/featured-guidelines/overview):

<CardGroup>
  <Card title="Product Guidelines" icon="lightbulb" href="/mini-apps/featured-guidelines/product-guidelines" />

  <Card title="Design Guidelines" icon="brush" href="/mini-apps/featured-guidelines/design-guidelines" />

  <Card title="Technical Guidelines" icon="wrench" href="/mini-apps/featured-guidelines/technical-guidelines" />

  <Card title="Notification Guidelines" icon="bell" href="/mini-apps/featured-guidelines/notification-guidelines" />
</CardGroup>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.base.org/llms.txt

