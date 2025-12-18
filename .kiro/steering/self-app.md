# QRCode SDK

> **Scope**: How to install, configure, and embed the component. [qrcode-sdk-api-reference](https://docs.self.xyz/frontend-integration/qrcode-sdk-api-reference "mention") (all props, types) lives on a separate page.

## Installation

{% tabs %}
{% tab title="npm" %}
npm i @selfxyz/qrcode
{% endtab %}

{% tab title="yarn " %}
yarn add @selfxyz/core
{% endtab %}

{% tab title="pnpm " %}
pnpm i @selfxyz/qrcode
{% endtab %}
{% endtabs %}

## Usage (Desktop)

The `SelfQRCode` component is responsible for storing information about your app. This information includes data about the mock / real passports, the userId you want to store etc. along with information about the config that should be checked for a given proof.

This involves 2 steps:

1. Create a `SelfApp` from the `SelfAppBuilder` that takes in `Partial<SelfApp>`.
2. Pass the `SelfApp` to the QRCode component along with `onSuccess` and `onError` functions.

{% code fullWidth="false" %}

```tsx
import { useEffect, useState } from "react";
import { countries, SelfQRcodeWrapper } from "@selfxyz/qrcode";
import { SelfAppBuilder } from "@selfxyz/qrcode";

export default function Verify() {
  const [selfApp, setSelfApp] = useState<any | null>(null);

  useEffect(() => {
    const userId = "0xYourUserEthAddress"; // or a UUID depending on your setup

    const app = new SelfAppBuilder({
      version: 2,
      appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Self Docs",
      scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "self-docs",
      endpoint: `${process.env.NEXT_PUBLIC_SELF_ENDPOINT}`,
      logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
      userId,
      endpointType: "staging_celo",
      userIdType: "hex", // 'hex' for EVM address or 'uuid' for uuidv4
      userDefinedData: "Hello from the Docs!!",
      disclosures: {
        // What you want to verify from the user's identity
        minimumAge: 18,
        excludedCountries: [
          countries.CUBA,
          countries.IRAN,
          countries.NORTH_KOREA,
          countries.RUSSIA,
        ],

        // What you want users to
        nationality: true,
        gender: true,
      },
    }).build();

    setSelfApp(app);
  }, []);

  const handleSuccessfulVerification = () => {
    // Persist the attestation / session result to your backend, then gate content
    console.log("Verified!");
  };

  return (
    <div>
      {selfApp ? (
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={handleSuccessfulVerification}
          onError={() => {
            console.error("Error: Failed to verify identity");
          }}
        />
      ) : (
        <div>
          <p>Loading QR Code...</p>
        </div>
      )}
    </div>
  );
}
```

{% endcode %}

{% hint style="warning" %}
The claims you want to verify MUST exactly match the ones you set in your backend configuration.
{% endhint %}

{% hint style="danger" %}
If you're using a contract to verify your proofs then please sure the contract address is in lowercase.
{% endhint %}

## Usage (Mobile)

If you're developing an app then it's not easy to scan a QR Code. Instead, what you would do is to create a deeplink to the Self app and pass in a `deeplinkCallback` url that the Self app can navigate to once the proof is verified. Here's what you'll need to add:

```tsx
import { useEffect, useState } from 'react'
import { countries, SelfQRcodeWrapper } from '@selfxyz/qrcode'
import { SelfAppBuilder } from '@selfxyz/qrcode'

export default function Verify() {
  const [selfApp, setSelfApp] = useState<any | null>(null);
  const [universalLink, setUniversalLink] = useState("");

  useEffect(() => {
    const userId = '0xYourUserEthAddress' // or a UUID depending on your setup

    const app = new SelfAppBuilder({
      ..., //same as previous example
      deeplinkCallback: "https://your-callback-url.com",
    }).build()

    setSelfApp(app);
    setUniversalLink(getUniversalLink(app);
  }, []);

  const openSelfApp = () => {
    if (!universalLink) return;
    window.open(universalLink, "_blank");
  }

  return (
    <div>
      {selfApp ? (
         <button
            type="button"
            onClick={openSelfApp}
            disabled={!universalLink}
          >
          Open Self App
        </button>
      ) : (
        <div>
          <p>Loading QR Code...</p>
        </div>
      )}
    </div>
  )
}
```

# QRCode SDK - API Reference

## Exports

- SelfQRCodeWrapper
- SelfQRCode
- SelfAppBuilder
- SelfApp
- getUniversalLink

## SelfQRCodeWrapper / SelfQRCode

| Input        | Type                                                    | Default       | Description                                          |
| ------------ | ------------------------------------------------------- | ------------- | ---------------------------------------------------- |
| selfApp      | [#selfapp](#selfapp "mention")                          | -             | The configured Self app instance.                    |
| onSuccess    | () ⇒ void;                                              | -             | Callback triggered when verification succeeds.       |
| onError      | data: { error_code?: string; reason?: string }) => void | -             | Callback triggered when verification fails.          |
| type         | 'websocket' \| 'deeplink'                               | websocket     | Determines whether to use WebSocket or deep link QR. |
| websocketUrl | string                                                  | WS_DB_RELAYER | Custom WebSocket relayer URL.                        |
| size         | number                                                  | 300           | Width and height of the QR Code in pixels.           |
| darkMode     | boolean                                                 | false         | Toggles light/dark mode for QR code styling.         |

## SelfApp

| Property         | Type                                                           | Required | Description                                                                                                                  |
| ---------------- | -------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| appName          | string                                                         | ✅       | The name of your app                                                                                                         |
| logoBase64       | string                                                         | ✅       | Image URL or base64 encoded image                                                                                            |
| endpointType     | `https` \| `staging_https` \| `celo` \| `staging_celo`         | ✅       | Required by the Self Protocol to know where the proofs will be verified: Onchain/Offchain and Real Documents/Mock Documents. |
| endpoint         | string                                                         | ✅       | Either the EVM Address or the backend URL where the proof must be verified.                                                  |
| deeplinkCallback | string                                                         | ⚪       | Triggered by the app after proof the proof is verified (or if it fails being generated)                                      |
| scope            | string                                                         | ✅       | A unique identifier for you application                                                                                      |
| userId           | string                                                         | ✅       | An identifier for the end user.                                                                                              |
| userIdType       | 'uuid' \| 'hex'                                                | ✅       | Type of the user identifier                                                                                                  |
| disclosures      | [#selfappdisclosureconfig](#selfappdisclosureconfig "mention") | ✅       | Object containing all disclosures and checks.                                                                                |
| version          | 1 \| 2                                                         | ⚪       | Whether to use Self V1 or SelfV2. Defaults to 2                                                                              |
| userDefinedData  | string                                                         | ⚪       | Any data you want to pass to your endpoint.                                                                                  |

## SelfAppDisclosureConfig

| Property              | Type                  | Default | Description                                               |
| --------------------- | --------------------- | ------- | --------------------------------------------------------- |
| issuing_state         | boolean               | false   | Request the issuing state from the document               |
| name                  | boolean               | false   | Request the full name from the document                   |
| passport_number       | boolean               | false   | Request the document number.                              |
| nationality           | boolean               | false   | Request the user’s nationality.                           |
| date_of_birth         | boolean               | false   | Request the date of birth.                                |
| gender                | boolean               | false   | Request the gender field.                                 |
| expiry_date           | boolean               | false   | Request the passport expiry date.                         |
| ofac\*\*              | boolean               | false   | Check against OFAC sanction lists.                        |
| excludedCountries\*\* | Country3LetterCode\[] | \[]     | Exclude users from specific ISO 3166-1 alpha-3 countries. |
| minimumAge\*\*        | number                | 0       | Require a minimum age (e.g., `18` (upto `99`)).\|         |

# Disclosure Configs

When configuring the disclosures object in your Self app, you define both verification rules and data disclosures. These determine what the Self mobile app will check for and what data users will reveal during verification.

## Verification Rules

Verification rules let you express compliance and eligibility requirements. They run automatically when the proof is generated.

```typescript
disclosures: {
  // Age verification
  minimumAge: 18,

  // Geographic restrictions
  excludedCountries: ["USA", "RUS"],

  // Compliance checking
  ofac: false,
}
```

### `minimumAge`

- **Purpose:** Ensures the user is at least this age. The check is done on the verified date of birth attribute.
- **Example**: `minimumAge: 18` ensures only adults proceed.

### `excludedCountries`

- **Purpose**: Blocks users whose nationality or residence matches any listed country.
- **Example**: `excludedCountries: ["USA", "RUS"`] rejects users from the US or Russia.

### `ofac`

- **Purpose**: Enables or disables screening against the OFAC sanctions list.
- **Example**: `ofac: true` rejects sanctioned users. `false` skips the check.

## Data Disclosures

Data disclosures define **what attributes are revealed** from the user’s verified identity. You can choose to request personal or document data depending on your use case. Since these are not claims, they are not enforced by your backend / contracts.

## Frontend & Backend Alignment

{% hint style="warning" %}
**Important**: The disclosure configuration used on the **frontend** (in your app) **must exactly match** the configuration enforced on the **backend/contracts**.
{% endhint %}

- **Example**: If the backend requires `minimumAge: 18` but the frontend only specifies 21, verification will fail (and vice versa).
- **Example:** If the contracts require `excludedCountries: ["USA"]` and your frontend only specifies `excludedCountries: ["USA", "RUS"]` then your transaction is going to fail.

Note that in both these cases even though the backend requires a less strict verification config, the transaction/request IS going to fail as the configs are not the same.

{% hint style="success" %}
**Best practice**: Centralize your disclosure config (e.g., in a shared constants file or service) and import it into both frontend and backend to avoid drift.
{% endhint %}

# Basic Integration

The `@selfxyz/core` library provides the essential building blocks to integrate Self’s verification flows into your backend. It contains utilities, types, and helpers for working with scopes, configs, and verification data.

Within this library, the `SelfBackendVerifier` class is the main tool you’ll use on the server. It helps you verify that the proofs produced by the frontend/mobile flow are valid against the on‑chain hub and your configured rules.

{% hint style="info" %}
Make sure your version of @selfxyz/core is >= 1.1.0-beta.1. Versions prior to this use Celo Alfajores for mock passports and will not verify correctly.
{% endhint %}

## Creating a verifier instance

You typically instantiate a `SelfBackendVerifier` once with your chosen **scope**, **endpoint**, and other settings.

```typescript
import { SelfBackendVerifier, DefaultConfigStore, AllIds } from "@selfxyz/core";

const selfBackendVerifier = new SelfBackendVerifier(
  "docs", // scope string
  "https://docs.self.xyz/api/verify", // endpoint (your backend verification API)
  true, // mockPassport → true = testnet, realPassport → false = mainnet
  AllIds, // allowed attestation IDs map
  new DefaultConfigStore({
    // config store (see separate docs)
    minimumAge: 18,
    excludedCountries: ["USA"],
    ofac: false,
  }),
  "hex" // user identifier type
);
```

### Parameters

- **scope**: identifier for your application. Must match the frontend scope.
- **endpoint**: the URL where your proofs will be verified (including the route). Must match the frontend endpoint.
- **mockPassport**: toggle to use testnet/staging vs mainnet hub.
- **allowedIds**: map of attestation IDs you want to accept.
- **configStorage**: implementation of `IConfigStorage` (for now, use `DefaultConfigStore` or `InMemoryConfigStore` see [configstore](https://docs.self.xyz/backend-integration/configstore "mention")).
- **userIdentifierType**: either `'uuid'` or `'hex'` (depending on how your frontend built the user identifier).

## Verifying a proof

Call `.verify()` with the attestation ID, proof, public signals, and user context data. These will be passed to your endpoint from Self's relayers. The verifier will check validity against on‑chain contracts and your config store.

```typescript
const result = await selfBackendVerifier.verify(
  attestationId, // e.g. AttestationId.Passport
  proof, // zkSNARK proof object
  pubSignals, // array of public signals from prover
  userContextData //user context data
);

console.log(result);
```

### Example output

```json
{
    "attestationId": 1,
    "isValidDetails": {
        "isValid": true,
        "isMinimumAgeValid": true,
        "isOfacValid": false
    },
    "forbiddenCountriesList": ["USA"],
    "discloseOutput": {
        "minimumAge": "18",
        "nationality": "IND",
        "gender": "M"
    ...
    },
    "userData": {
        "userIdentifier": "8e4e6f24-...",
        "userDefinedData": "..." //what you pass in the qrcode
    }
}
```

## Using in an API endpoint

You’ll usually expose this via a backend route that your Self's relayers call after creating your proof.

{% hint style="warning" %}
Since your API must be reachable to Self's relayers, we recommend you use `ngrok` to tunnel requests to your local API endpoint during development and then set this API in your frontend and backend.
{% endhint %}

```typescript
import express from "express";
import bodyParser from "body-parser";
import { SelfBackendVerifier } from "@selfxyz/core";
import { AllIds } from "./utils/constants.js";
import { DefaultConfigStore } from "./store/DefaultConfigStore.js";

const app = express();
app.use(bodyParser.json());

const selfBackendVerifier = new SelfBackendVerifier(
  process.env.SELF_SCOPE_SEED,
  process.env.SELF_ENDPOINT,
  true,
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: ["USA"],
    ofac: false,
  }),
  "hex"
);

app.post("/api/verify", async (req, res) => {
  try {
    const { attestationId, proof, publicSignals, userContextData } = req.body;
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return res.status(200).json({
        status: "error",
        result: false,
        reason:
          "Proof, publicSignals, attestationId and userContextData are required",
      });
    }

    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );

    const { isValid, isMinimumAgeValid } = result.isValidDetails;
    if (!isValid || !isMinimumAgeValid) {
      let reason = "Verification failed";
      if (!isMinimumAgeValid) reason = "Minimum age verification failed";
      return res.status(200).json({
        status: "error",
        result: false,
        reason,
      });
    }

    return res.status(200).json({
      status: "success",
      result: true,
    });
  } catch (error) {
    return res.status(200).json({
      status: "error",
      result: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
```

{% hint style="info" %}
Notice however that the `status` of the http request is 200 regardless of whether the inputs were correct / wrong and if the proof was verified or not. In general, you will need to follow the format below when creating an API.
{% endhint %}

## Endpoint API Reference

<mark style="color:green;">`POST`</mark> `/api/verify`

Verifies a Self Identity proof.

**Headers**

| Name         | Value              |
| ------------ | ------------------ |
| Content-Type | `application/json` |

**Body**

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td><code>attestationId</code></td><td>number</td><td>The id of the document being verified.</td></tr><tr><td><code>proof</code></td><td><pre><code>{
    a: [string, string],
    b: [[string, string], 
        [string, string]],
    c: [string, string]
}
</code></pre></td><td>The self identity proof.</td></tr><tr><td><code>publicSignals</code></td><td><code>string[]</code></td><td>The public signals for the proof</td></tr><tr><td><code>userContextData</code></td><td>string</td><td>Contains information about the user id and app defined user data.</td></tr></tbody></table>

**Response**

{% tabs %}
{% tab title="200 (success)" %}

```json
{
  "status": "success",
  "result": true
}
```

{% endtab %}

{% tab title="200 (error)" %}

```json
{
  "status": "error",
  "result": false,
  "reason": "Not enough inputs"
}
```

{% endtab %}
{% endtabs %}

## Accepting only certain type of documents

If you want to only accept certain types of documents (for example if you don't want to use Aadhaar) then you can create a map that has all attestation ids other than Aadhaar.

```typescript
import { ATTESTATION_ID, AttestationId } from "@selfxyz/core";

const allowedIds = new Map<AttestationId, boolean>([
  [ATTESTATION_ID.PASSPORT, true],
  [ATTESTATION_ID.BIOMETRIC_ID_CARD, true],
]);
```

# ConfigStore

The **config storage layer** defines how verification configurations are persisted and retrieved on the backend. These configurations represent the same disclosure/verification rules that the frontend and smart contracts enforce. Keeping them consistent is critical.

This `@selfxyz/core` library exposes an interface (`IConfigStorage`) and two default implementations (`DefaultConfigStore`, `InMemoryConfigStore`).

## `IConfigStorage`

```typescript
export interface IConfigStorage {
  getConfig(id: string): Promise<VerificationConfig>;
  setConfig(id: string, config: VerificationConfig): Promise<boolean>;
  getActionId(userIdentifier: string, data: string): Promise<string>;
}
```

#### Methods

- **`getConfig(id)`**
  - Returns the `VerificationConfig` associated with a given id.
  - This id is typically the `configId` referenced by your contract/backend/frontend.
- **`setConfig(id, config)`**
  - Stores a new verification config under the given id.
  - Returns `true` if an existing config was replaced, `false` if it was newly set.
- **`getActionId(userIdentifier, data)`**
  - Computes or retrieves an action id based on user context data from the frontend.
  - This action id links user activity with a registered config and is later used by `getConfig(id)`

## DefaultConfigStore

A simple implementation that always returns the same config regardless of id.

```typescript
export class DefaultConfigStore implements IConfigStorage {
  constructor(private config: VerificationConfig) {}

  //other methods
}
```

### Example

```typescript
const defaultConfigStore = new DefaultConfigStore({
  minimumAge: 18,
  excludedCountries: ["US", "CA"],
  ofac: true,
});
```

## InMemoryConfigStore

A more flexible implementation that can hold multiple configs in memory.

```typescript
export class InMemoryConfigStore implements IConfigStorage {
  private configs: Map<string, VerificationConfig> = new Map();
  private getActionIdFunc: IConfigStorage["getActionId"];

  constructor(getActionIdFunc: IConfigStorage["getActionId"]) {
    this.getActionIdFunc = getActionIdFunc;
  }

  //other methods
}
```

### Example

```typescript
const inMemoryHandler = async (
  userIdentifier: string,
  userDefinedData: string
) => {
  return userDefinedData === "high_value" ? "strict" : "standard";
};

const inMemory = new InMemoryConfigStore(inMemoryHandler);
inMemory.setConfig("strict", {
  minimumAge: 18,
  excludedCountries: ["USA", "CAN"],
  ofac: true,
});
inMemory.setConfig("standard", {
  minimumAge: 18,
  excludedCountries: ["USA", "CAN"],
  ofac: true,
});
```

**Use cases:**

- Backends that need to manage multiple verification configurations at once.
- Scenarios where action ids must be computed dynamically per user.
- Good for prototyping before connecting to a persistent store (DB, KV, etc.).

## Custom Implementations

Here's an example of a `KVConfigStore` that is used in the [playground](https://plaground.self.xyz/).

```typescript
import { IConfigStorage, VerificationConfig } from "@selfxyz/core";
import { Redis } from "@upstash/redis";

export class KVConfigStore implements IConfigStorage {
  private redis: Redis;

  constructor(url: string, token: string) {
    this.redis = new Redis({
      url: url,
      token: token,
    });
  }

  async getActionId(userIdentifier: string, data: string): Promise<string> {
    return userIdentifier;
  }

  async setConfig(id: string, config: VerificationConfig): Promise<boolean> {
    await this.redis.set(id, JSON.stringify(config));
    return true;
  }

  async getConfig(id: string): Promise<VerificationConfig> {
    const config = (await this.redis.get(id)) as VerificationConfig;
    return config;
  }
}
```

### Integration with Frontend

The `userDefinedData` parameter in the frontend's `SelfAppBuilder` is passed to your `getActionId` method:

```javascript
// Frontend
const selfApp = new SelfAppBuilder({
  // ... other config
  version: 2,
  userDefinedData: Buffer.from(JSON.stringify({
    action: "high_value_transaction",
    amount: 50000,
    merchant: "merchant_123"
  })).toString('hex'),
  // ...
}).build();

// Backend - getActionId receives this data
async getActionId(userIdentifier: string, userDefinedData: string): Promise<string> {
  const data = JSON.parse(Buffer.from(userDefinedData, 'hex').toString());

  if (data.action === 'high_value_transaction' && data.amount > 10000) {
    return 'strict_verification';
  }

  return 'standard_verification';
}
```

### Summary

- `IConfigStorage` defines a contract for working with verification configs.
- The library ships with `DefaultConfigStore` (static) and `InMemoryConfigStore` (multi‑config, dynamic).
- Backend verifiers (like `SelfBackendVerifier`) depend on `IConfigStorage` to fetch configs and action ids.
- You can plug in your own storage backend by implementing the same interface.

# SelfBackendVerifier - API Reference

A backend verification class that validates zero-knowledge proofs generated by the Self mobile app.

## Constructor

```typescript
new SelfBackendVerifier(
  scope: string,
  endpoint: string,
  mockPassport: boolean = false,
  allowedIds: Map<AttestationId, boolean>,
  configStorage: IConfigStorage,
  userIdentifierType: UserIdType
)
```

### Parameters

| Parameter          | Type                          | Description                                                                                                                    |
| ------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| scope              | `string`                      | Your application's unique identifier. Must match the scope used in SelfAppBuilder. Max 30 characters.                          |
| endpoint           | `string`                      | Your backend verification endpoint URL. Must be publicly accessible and match your frontend configuration.                     |
| mockPassport       | `boolean`                     | `false` for real documents (mainnet), `true` for testing with mock documents (testnet). Default: `false`                       |
| allowedIds         | `Map<AttestationId, boolean>` | Map of allowed document types. Key: attestation ID, Value: allowed status                                                      |
| configStorage      | `IConfigStorage`              | Configuration storage implementation that determines verification requirements.                                                |
| userIdentifierType | `UserIdType`                  | <p>Type of user identifier: <code>'uuid'</code> or <code>'hex'</code> (for blockchain addresses)</p><h4 id="methods"><br></h4> |

## Methods

Validates zero-knowledge proofs from the Self mobile app.

```typescript
async verify(
  attestationId: AttestationId,
  proof: VcAndDiscloseProof,
  pubSignals: BigNumberish[],
  userContextData: string
): Promise<VerificationResult>
```

### Parameters

| Parameter       | Type                 | Description                                                                     |
| --------------- | -------------------- | ------------------------------------------------------------------------------- |
| attestationId   | `AttestationId`      | Document type identifier (1 = electronic passport, 2 = EU ID card, 3 = Aadhaar) |
| proof           | `VcAndDiscloseProof` | Zero-knowledge proof object containing cryptographic proof arrays.              |
| pubSignals      | `BigNumberish[]`     | Public signals from the zero-knowledge proof                                    |
| userContextData | `string`             | Hex-encoded string containing user context and configuration data               |

## **Return Value**

The method returns a `VerificationResult` object with comprehensive verification details:

```typescript
{
  attestationId: AttestationId;           // Document type that was verified
  isValidDetails: {
    isValid: boolean;                     // Overall cryptographic proof validity
    isMinimumAgeValid: boolean;           // Age requirement validation, false if minimum age check does not pass
    isOfacValid: boolean;                 // OFAC sanctions check result, true if in OFAC
  };
  forbiddenCountriesList: string[];       // Countries excluded from the proof
  discloseOutput: {                       // Disclosed document information
    nullifier: string;                    // Unique proof identifier (prevents reuse)
    forbiddenCountriesListPacked: string[];
    issuingState: string;                 // Country that issued the document
    name: string;                         // Full name (if disclosed)
    idNumber: string;                     // Document number
    nationality: string;                  // Nationality
    dateOfBirth: string;                  // Date of birth (if disclosed)
    gender: string;                       // Gender
    expiryDate: string;                   // Document expiry date
    olderThan: string;                    // Age verification result
    ofac: boolean[];                      // OFAC check results [passportNo, nameAndDob, nameAndYob]
  };
  userData: {
    userIdentifier: string;               // User identifier from context
    userDefinedData: string;              // Custom user data
  };
}
```

The method throws `ConfigMismatchError` when verification requirements don't match:

```typescript
try {
  const result = await verifier.verify(
    attestationId,
    proof,
    pubSignals,
    userContextData
  );
  // Handle successful verification
} catch (error: any) {
  if (error.name === "ConfigMismatchError") {
    console.error("Configuration mismatches:", error.issues);
    // error.issues contains detailed information about what failed
  } else {
    console.error("Verification error:", error);
  }
}
```

Common ConfigMismatch Types:

- `InvalidId` - Attestation ID not in allowedIds
- `InvalidScope` - Proof was generated for a different application
- `InvalidRoot` - Merkle root not found on blockchain
- `InvalidForbiddenCountriesList` - Countries don't match configuration
- `InvalidMinimumAge` - Age requirement mismatch
- `InvalidTimestamp` - Proof timestamp out of valid range (±1 day)
- `ConfigNotFound` - Configuration not found in storage

## Types

### VerificationConfig

```typescript
{
  minimumAge?: number;                  // Minimum age requirement
  excludedCountries?: Country3LetterCode[];  // ISO 3-letter country codes to exclude
  ofac?: boolean;                       // Enable OFAC sanctions checking
}
```

### VcAndDiscloseProof

```typescript
{
  a: [BigNumberish, BigNumberish];
  b: [
    [BigNumberish, BigNumberish],
    [BigNumberish, BigNumberish],
  ];
  c: [BigNumberish, BigNumberish];
}
```

### AttestationId

Document type identifiers:

- `1` - Electronic passport
- `2` - Biometric ID card
- `3` - Aadhaar

# Getting Started

The Self Mobile SDK Alpha provides React Native screen components and client infrastructure for integrating Self's identity verification flows into your mobile application.

## Installation

```bash
npm install @selfxyz/mobile-sdk-alpha
```

## Native Modules Setup

⚠️ **Important**: The Mobile SDK requires native module configuration for both Android and iOS platforms. Before using the SDK, you must complete the native setup:

- [**Native Modules Setup**](https://github.com/selfxyz/self-docs/blob/main/mobile-sdk/native-modules-setup.md) - Complete Android and iOS native configuration
- **Android**: MainActivity configuration, build.gradle setup, permissions

## Quick Start

The SDK requires two main integration points:

1. **SelfClientProvider** - Wraps your app with configured adapters and event listeners
2. **Screen Components** - Individual onboarding screens imported from specific paths

### Minimal Example

```tsx
import React from 'react';
import { View } from 'react-native';
import {
  SelfClientProvider,
  createListenersMap,
  type Adapters
} from '@selfxyz/mobile-sdk-alpha';
import { DocumentCameraScreen } from '@selfxyz/mobile-sdk-alpha/onboarding/document-camera-screen';

// Configure adapters (see selfclient-provider.md for details)
const adapters: Adapters = {
  auth: {
    getPrivateKey: async () => "your-private-key"
  },
  scanner: yourNFCScannerAdapter,
  network: {
    http: { fetch },
    ws: { connect: (url) => new WebSocket(url) }
  },
  crypto: {
    hash: async (data) => /* hash implementation */,
    sign: async (data, keyRef) => /* signing implementation */
  },
  documents: yourDocumentStorageAdapter
};

// Configure event listeners for navigation
const listeners = createListenersMap();
const config = {};

function App() {
  return (
    <SelfClientProvider
      config={config}
      adapters={adapters}
      listeners={listeners.map}
    >
      <View style={{ flex: 1 }}>
        <DocumentCameraScreen
          onBack={() => console.log('Go back')}
          onSuccess={() => console.log('MRZ scan successful')}
        />
      </View>
    </SelfClientProvider>
  );
}
```

## Next Steps

- [**Native Modules Setup**](https://github.com/selfxyz/self-docs/blob/main/mobile-sdk/native-modules-setup.md) - Configure Android and iOS native modules
- [**SelfClient Provider Setup**](https://docs.self.xyz/mobile-sdk/selfclient-provider) - Configure adapters and event listeners
- [**Onboarding Screen Components**](https://docs.self.xyz/mobile-sdk/onboarding-screens) - Use the available screen components
- [**Implementation Examples**](https://docs.self.xyz/mobile-sdk/examples) - See complete integration patterns

## Important Notes

⚠️ **Alpha Status**: This SDK is in alpha. The interface may change as it matures. Many current configuration options may be removed or simplified in future versions.

✅ **Core Stability**: The two main integration patterns (SelfClientProvider + screen components) are expected to remain stable.

# SelfClient Provider Setup

The `SelfClientProvider` is a React context provider that must wrap all screens using the Mobile SDK. It configures the SDK with the necessary adapters and event listeners your app needs.

## Basic Setup

```tsx
import {
  SelfClientProvider,
  createListenersMap,
  type Adapters,
  type Config,
} from "@selfxyz/mobile-sdk-alpha";

const config: Config = {};

const adapters: Adapters = {
  // Required adapters
  auth: authAdapter,
  scanner: scannerAdapter,
  network: networkAdapter,
  crypto: cryptoAdapter,
  documents: documentsAdapter,

  // Optional adapters (SDK provides defaults)
  analytics: analyticsAdapter,
  logger: loggerAdapter,
  clock: clockAdapter,
};

const { map: listeners } = createListenersMap();

function App() {
  return (
    <SelfClientProvider
      config={config}
      adapters={adapters}
      listeners={listeners}
    >
      {/* Your app screens here */}
    </SelfClientProvider>
  );
}
```

## Required Adapters

### Auth Adapter

Manages private key access for cryptographic operations.

```tsx
const authAdapter = {
  async getPrivateKey(): Promise<string | null> {
    // Return private key as hex string (with or without 0x prefix)
    // Return null if no key available
    return await yourSecureStorage.getPrivateKey();
  },
};
```

### Scanner Adapter

Provides NFC scanning capabilities.

```tsx
// For React Native
import { reactNativeScannerAdapter } from "@selfxyz/mobile-sdk-alpha";
const scannerAdapter = reactNativeScannerAdapter;

// For Web (development/testing)
import { webNFCScannerShim } from "@selfxyz/mobile-sdk-alpha";
const scannerAdapter = webNFCScannerShim;
```

### Network Adapter

Handles HTTP and WebSocket communications.

```tsx
const networkAdapter = {
  http: {
    fetch: (input: RequestInfo, init?: RequestInit) => fetch(input, init),
  },
  ws: {
    connect: (url: string) => {
      const socket = new WebSocket(url);
      return {
        send: (data) => socket.send(data),
        close: () => socket.close(),
        onMessage: (cb) =>
          socket.addEventListener("message", (ev) => cb(ev.data)),
        onError: (cb) => socket.addEventListener("error", cb),
        onClose: (cb) => socket.addEventListener("close", cb),
      };
    },
  },
};
```

### Crypto Adapter

Provides hashing and signing operations.

```tsx
const cryptoAdapter = {
  async hash(data: Uint8Array, algo: "sha256" = "sha256"): Promise<Uint8Array> {
    // Use Web Crypto API or native crypto library
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(buffer);
  },

  async sign(data: Uint8Array, keyRef: string): Promise<Uint8Array> {
    // Implement signing logic for your key management
    throw new Error("Signing not implemented");
  },
};
```

### Documents Adapter

Handles document storage and retrieval.

```tsx
const documentsAdapter = {
  async loadDocumentCatalog(): Promise<DocumentCatalog> {
    return await yourStorage.getCatalog();
  },

  async saveDocumentCatalog(catalog: DocumentCatalog): Promise<void> {
    await yourStorage.saveCatalog(catalog);
  },

  async loadDocumentById(id: string): Promise<IDDocument | null> {
    return await yourStorage.getDocument(id);
  },

  async saveDocument(id: string, document: IDDocument): Promise<void> {
    await yourStorage.saveDocument(id, document);
  },

  async deleteDocument(id: string): Promise<void> {
    await yourStorage.deleteDocument(id);
  },
};
```

## Event Listeners & Navigation

Event listeners handle SDK events and route to appropriate screens in your app.

```tsx
import { SdkEvents } from "@selfxyz/mobile-sdk-alpha";

const { map: listeners, addListener } = createListenersMap();

// Handle country selection -> navigate to ID picker
addListener(
  SdkEvents.DOCUMENT_COUNTRY_SELECTED,
  ({ countryCode, documentTypes }) => {
    navigation.navigate("IDPicker", { countryCode, documentTypes });
  }
);

// Handle document type selection -> navigate to appropriate flow
addListener(
  SdkEvents.DOCUMENT_TYPE_SELECTED,
  ({ documentType, countryCode }) => {
    switch (documentType) {
      case "p": // Passport
      case "i": // ID Card
        navigation.navigate("DocumentCamera");
        break;
      case "a": // Aadhaar
        navigation.navigate("AadhaarUpload", { countryCode });
        break;
      default:
        navigation.navigate("ComingSoon", { countryCode });
    }
  }
);

// Handle successful MRZ scan -> navigate to NFC scan
addListener(SdkEvents.DOCUMENT_MRZ_READ_SUCCESS, () => {
  navigation.navigate("NFCScan");
});

// Handle MRZ scan failure -> navigate to troubleshooting
addListener(SdkEvents.DOCUMENT_MRZ_READ_FAILURE, () => {
  navigation.navigate("DocumentTrouble");
});
```

## Common SDK Events

| Event                       | Payload                          | Description                         |
| --------------------------- | -------------------------------- | ----------------------------------- |
| `DOCUMENT_COUNTRY_SELECTED` | `{ countryCode, documentTypes }` | User selected a country             |
| `DOCUMENT_TYPE_SELECTED`    | `{ documentType, countryCode }`  | User selected document type         |
| `DOCUMENT_MRZ_READ_SUCCESS` | `{}`                             | MRZ scanning completed successfully |
| `DOCUMENT_MRZ_READ_FAILURE` | `{}`                             | MRZ scanning failed                 |

## Related Documentation

- [Getting Started Guide](https://docs.self.xyz/mobile-sdk/getting-started) - SDK overview and basic setup
- [Onboarding Screen Components](https://docs.self.xyz/mobile-sdk/onboarding-screens) - Available screen components
- [Examples](https://docs.self.xyz/mobile-sdk/examples) - Complete implementation examples

# Onboarding Screen Components

The Mobile SDK provides pre-built React Native screen components for the identity verification onboarding flow. These screens handle the UI and logic for document selection, camera scanning, and user interactions.

## Import Pattern

Screens are imported directly from their onboarding paths, not from the main package index:

```tsx
import { DocumentCameraScreen } from "@selfxyz/mobile-sdk-alpha/onboarding/document-camera-screen";
import IDSelectionScreen from "@selfxyz/mobile-sdk-alpha/onboarding/id-selection-screen";
import SDKCountryPickerScreen from "@selfxyz/mobile-sdk-alpha/onboarding/country-picker-screen";
```

## Provider Requirement

⚠️ **All screens must be wrapped in `SelfClientProvider`**. The screens use `useSelfClient()` internally and will throw an error if used outside the provider context.

## Available Screens

### DocumentCameraScreen

Handles MRZ (Machine Readable Zone) scanning from identity documents using the device camera.

```tsx
import { DocumentCameraScreen } from "@selfxyz/mobile-sdk-alpha/onboarding/document-camera-screen";

<DocumentCameraScreen
  onBack={() => navigation.goBack()}
  onSuccess={() => navigation.navigate("NFCScan")}
  safeAreaInsets={{ top: 44, bottom: 34 }} // Optional
/>;
```

**Props:**

- `onBack?: () => void` - Called when user taps back button
- `onSuccess?: () => void` - Called when MRZ scan succeeds
- `safeAreaInsets?: { top: number, bottom: number }` - Safe area padding

**Behavior:**

- Displays camera viewfinder with MRZ scanning overlay
- Shows scan instructions and animations
- Automatically processes MRZ data when detected
- Emits `DOCUMENT_MRZ_READ_SUCCESS` or `DOCUMENT_MRZ_READ_FAILURE` events
- Provides haptic feedback during scanning

### IDSelectionScreen

Displays available document types for a selected country and handles document type selection.

```tsx
import IDSelectionScreen from "@selfxyz/mobile-sdk-alpha/onboarding/id-selection-screen";

<IDSelectionScreen
  countryCode="USA"
  documentTypes={["p", "i"]} // p = passport, i = ID card, a = aadhaar
/>;
```

**Props:**

- `countryCode: string` - ISO country code (e.g., "USA", "GBR")
- `documentTypes: string[]` - Available document types for the country

**Behavior:**

- Shows document type cards with icons (passport, ID card, Aadhaar, etc.)
- Handles document type selection
- Emits `DOCUMENT_TYPE_SELECTED` event with selected type and country
- Provides visual feedback for selections

### CountryPickerScreen

Displays a searchable list of countries for document selection.

```tsx
import SDKCountryPickerScreen from "@selfxyz/mobile-sdk-alpha/onboarding/country-picker-screen";

<SDKCountryPickerScreen />;
```

**Props:**

- No props required - manages its own state internally

**Behavior:**

- Shows searchable country list with flags
- Filters countries by name as user types
- Loads available document types for each country
- Emits `DOCUMENT_COUNTRY_SELECTED` event with country info
- Optimized for performance with large country lists

## Screen Flow Example

A typical onboarding flow might look like:

```
CountryPickerScreen
    ↓ (DOCUMENT_COUNTRY_SELECTED)
IDSelectionScreen
    ↓ (DOCUMENT_TYPE_SELECTED)
DocumentCameraScreen
    ↓ (DOCUMENT_MRZ_READ_SUCCESS)
[Your NFC Scanning Screen]
```

## Error Handling

Screens handle errors internally and emit appropriate events. Listen for failure events in your event listeners:

```tsx
addListener(SdkEvents.DOCUMENT_MRZ_READ_FAILURE, () => {
  // Navigate to error screen or retry flow
  navigation.navigate("DocumentScanError");
});
```

## Related Documentation

- [Getting Started Guide](https://docs.self.xyz/mobile-sdk/getting-started) - SDK overview and installation
- [SelfClient Provider Setup](https://docs.self.xyz/mobile-sdk/selfclient-provider) - Configure adapters and event listeners
- [Examples](https://docs.self.xyz/mobile-sdk/examples) - Complete implementation examples
