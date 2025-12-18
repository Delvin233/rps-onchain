# Quickstart

> ⚠️ Forking the [workshop repo](https://github.com/selfxyz/workshop) is a great starting point for your project to integrate Self. It contains a basic working example that demonstrates how to integrate Self. From this, you can add your own logic/requirements as needed.

## Before You Start

**New to Self Protocol?** We highly recommend watching our [ETHGlobal Buenos Aires Workshop](https://www.loom.com/share/8a6d116a5f66415998a496f06fefdc23) first. This essential workshop walks through the core concepts and provides a hands-on introduction to building with Self.&#x20;

### Examples

Working examples of Self Protocol integration are available to use as a foundation to build upon.

- [Airdrop](https://docs.self.xyz/contract-integration/airdrop-example)
- [Happy Birthday](https://docs.self.xyz/contract-integration/happy-birthday-example)
- [Soul Bound Token](https://github.com/selfxyz/self/blob/main/contracts/contracts/example/SelfPassportERC721.sol)
- [Cross Chain (LayerZero)](https://github.com/selfxyz/self-layerzero-example)
- [Cross Chain (Hyperlane)](https://github.com/selfxyz/workshop/tree/hyperlane-example)

## Overview

To use Self in your web app, you will display QR codes to request proofs from your front-end, then you have a choice to verify them in your own back-end or onchain. All apps must integrate:

Frontend:

- [The front-end SDK](https://docs.self.xyz/frontend-integration/qrcode-sdk) generates and displays QR codes containing information from your app and what you want users to disclose.

Verification:

- [Verify through the onchain smart contracts](https://docs.self.xyz/contract-integration/basic-integration). The verification happens on chain in a completely trustless manner. A demo working example can be found here: <https://github.com/selfxyz/workshop>
- [Verify through your projects backend](https://docs.self.xyz/backend-integration/basic-integration). The back-end SDK verifies proofs on a node server (as in this quickstart). The verification is done on the projects own backend, meaning their is a trust assumption the users must make about the verification being done correctly. A demo working example can be found here: <https://github.com/selfxyz/workshop/tree/backend-verification>

<figure><img src="https://3083267457-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F3b7SjmW8sq7ARi9xvk7J%2Fuploads%2FQ4zGpc6ODKQq1GrD5LH2%2Fimage.png?alt=media&#x26;token=6f2af7d4-d327-492c-9a0d-ac5b970f4ba5" alt=""><figcaption></figcaption></figure>

## Installation

Install the required frontend packages:

{% tabs %}
{% tab title="npm" %}

```bash
npm install @selfxyz/qrcode @selfxyz/core ethers
```

{% endtab %}

{% tab title="yarn" %}

```bash
yarn add @selfxyz/qrcode @selfxyz/core ethers
```

{% endtab %}

{% tab title="bun" %}

```bash
bun install @selfxyz/qrcode @selfxyz/core ethers
```

{% endtab %}
{% endtabs %}

**Package purposes:**

- `@selfxyz/qrcode`: QR code generation and display components
- `@selfxyz/core`: Core utilities including `getUniversalLink` for deeplinks
- `ethers`: Ethereum utilities for address handling

### Basic Usage

Here's a complete Next.js component example based on the workshop:

```javascript
"use client";

import React, { useState, useEffect } from "react";
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";

function VerificationPage() {
  const [selfApp, setSelfApp] = (useState < SelfApp) | (null > null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState(ethers.ZeroAddress);

  useEffect(() => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Self Workshop",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "self-workshop",
        endpoint: `${process.env.NEXT_PUBLIC_SELF_ENDPOINT}`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "staging_https",
        userIdType: "hex",
        userDefinedData: "Hello World",
        disclosures: {
          //check the API reference for more disclose attributes!
          minimumAge: 18,
          nationality: true,
          gender: true,
        },
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
    }
  }, [userId]);

  const handleSuccessfulVerification = () => {
    console.log("Verification successful!");
  };

  return (
    <div className="verification-container">
      <h1>Verify Your Identity</h1>
      <p>Scan this QR code with the Self app</p>

      {selfApp ? (
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={handleSuccessfulVerification}
          onError={() => {
            console.error("Error: Failed to verify identity");
          }}
        />
      ) : (
        <div>Loading QR Code...</div>
      )}
    </div>
  );
}

export default VerificationPage;
```

{% hint style="info" %}
If you instead want to use the Self App on a mobile then we check out the [use-deeplinking](https://docs.self.xyz/use-self/use-deeplinking "mention") and [#usage-mobile](https://docs.self.xyz/frontend-integration/qrcode-sdk#usage-mobile "mention") sections!
{% endhint %}

### Verification Flow

The QR code component displays the current verification status with an LED indicator and changes its appearance based on the verification state:

1. **QR Code Display**: Component shows QR code for users to scan
2. **User Scans**: User scans with Self app and provides proof
3. **Verification**:
   1. Onchain Verification: Your smart contract receives the proof and verifies it on the Self VerificationHub contract.
   2. Backend Verification: Your API endpoint receives and verifies the proof
4. **Success Callback**: `onSuccess` callback is triggered when verification completes

## Add `SelfBackendVerifier` to your backend

If you want to verify your proofs with the backend verifier, then you would implement the following.

### Requirements

- Node v16+

### Install dependencies

{% tabs %}
{% tab title="npm" %}

```bash
npm install @selfxyz/core
```

{% endtab %}

{% tab title="yarn" %}

```bash
yarn add @selfxyz/core
```

{% endtab %}

{% tab title="bun" %}

```bash
bun install @selfxyz/core
```

{% endtab %}
{% endtabs %}

### Set Up SelfBackendVerifier

```javascript
// app/api/verify/route.ts
import { NextResponse } from "next/server";
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

// Reuse a single verifier instance
const selfBackendVerifier = new SelfBackendVerifier(
  "self-playground",
  "https://playground.self.xyz/api/verify",
  false, // mockPassport: false = mainnet, true = staging/testnet
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK", "RUS", "SYR"],
    ofac: true,
  }),
  "uuid" // userIdentifierType
);

export async function POST(req: Request) {
  try {
    // Extract data from the request
    const { attestationId, proof, publicSignals, userContextData } = await req.json();

    // Verify all required fields are present
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json(
        {
          message: "Proof, publicSignals, attestationId and userContextData are required",
        },
        { status: 200 }
      );
    }

    // Verify the proof
    const result = await selfBackendVerifier.verify(
      attestationId,    // Document type (1 = passport, 2 = EU ID card, 3 = Aadhaar)
      proof,            // The zero-knowledge proof
      publicSignals,    // Public signals array
      userContextData   // User context data (hex string)
    );

    // Check if verification was successful
    if (result.isValidDetails.isValid) {
      // Verification successful - process the result
      return NextResponse.json({
        status: "success",
        result: true,
        credentialSubject: result.discloseOutput,
      });
    } else {
      // Verification failed
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Verification failed",
          error_code: "VERIFICATION_FAILED"
          details: result.isValidDetails,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        result: false,
        reason: error instanceof Error ? error.message : "Unknown error",
        error_code: "UNKNOWN_ERROR"
      },
      { status: 200 }
    );
  }
}

```

{% hint style="warning" %}
The endpoint must be publicly accessible (not localhost). For local development, use ngrok to tunnel your localhost endpoint.
{% endhint %}

## Key Points

### Configuration Matching

Your frontend and backend configurations must match exactly:

```javascript
// Backend configuration
const verification_config = {
  excludedCountries: [],
  ofac: false,
  minimumAge: 18,
};

// Frontend configuration (must match)
disclosures: {
  minimumAge: 18,        // Same as backend
  excludedCountries: [], // Same as backend
  ofac: false,           // Same as backend
  // Plus any disclosure fields you want
  nationality: true,
  gender: true,
}
```

# V1 to V2 Migration Guide

This guide helps you migrate from Self Protocol V1 to V2. V2 introduces multi-document support, dynamic configuration, and improved data structures.

## Overview of Changes

### What's New in V2

- **Multi-document support**: E-Passports and EU ID Cards
- **Dynamic configuration**: Switch configurations without redeployment
- **Enhanced data formats**: Pre-extracted, human-readable outputs
- **User context data**: Pass custom data through verification flow
- **Improved error handling**: Detailed configuration mismatch reporting

### Breaking Changes

- Backend SDK constructor requires new parameters
- Configuration methods replaced with interface
- Verification method signature changed
- Frontend requires disclosures object
- Smart contract interfaces updated

## Backend Migration

### 1. Update Dependencies

```bash
npm install @selfxyz/core@latest
```

### 2. Update Constructor

**V1 (Old):**

```javascript
const verifier = new SelfBackendVerifier(
  "my-app-scope",
  "https://api.example.com/verify",
  false // mock mode
);
```

**V2 (New):**

```javascript
import {
  SelfBackendVerifier,
  AttestationId,
  UserIdType,
  IConfigStorage,
  AllIds,
} from "@selfxyz/core";

// Option 1: Use AllIds for all document types (recommended for most cases)
const allowedIds = AllIds;

// Option 2: Define specific allowed document types
// const allowedIds = new Map();
// allowedIds.set(AttestationId.E_PASSPORT, true);  // Accept passports
// allowedIds.set(AttestationId.EU_ID_CARD, true);  // Accept EU ID cards

// Implement configuration storage
class ConfigStorage implements IConfigStorage {
  async getConfig(configId: string) {
    // Return your verification requirements
    return {
      minimumAge: 18,
      excludedCountries: ["IRN", "PRK"],
      ofac: true,
    };
  }

  async getActionId(userIdentifier: string, userDefinedData?: string) {
    // Return config ID based on your logic
    return "default_config";
  }
}

const verifier = new SelfBackendVerifier(
  "my-app-scope",
  "https://api.example.com/verify",
  false, // mock mode
  allowedIds, // NEW: allowed document types
  new ConfigStorage(), // NEW: config storage
  UserIdType.UUID // NEW: user ID type
);
```

### 3. Update Configuration

**V1 (Old):**

```javascript
// Direct method calls
verifier.setMinimumAge(18);
verifier.excludeCountries("Iran", "North Korea");
verifier.enablePassportNoOfacCheck();
verifier.enableNameOfacCheck();
verifier.enableDobOfacCheck();
```

**V2 (New):**

```javascript
// Configuration via IConfigStorage implementation
class ConfigStorage implements IConfigStorage {
  async getConfig(configId: string) {
    // All configuration in one place
    return {
      minimumAge: 18,
      excludedCountries: ["IRN", "PRK"], // Use ISO 3-letter codes
      ofac: true, // Single boolean for all OFAC checks
    };
  }
}
```

### 4. Update Verification Method

**V1 (Old):**

```javascript
app.post("/api/verify", async (req, res) => {
  const { proof, publicSignals } = req.body;

  try {
    const isValid = await verifier.verify(proof, publicSignals);
    res.json({ valid: isValid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

**V2 (New):**

```javascript
app.post("/api/verify", async (req, res) => {
  const { attestationId, proof, pubSignals, userContextData } = req.body;

  try {
    const result = await verifier.verify(
      attestationId, // NEW: 1 for passport, 2 for EU ID
      proof,
      pubSignals,
      userContextData // NEW: hex-encoded context data
    );

    if (result.isValidDetails.isValid) {
      res.json({
        status: "success",
        result: true,
        credentialSubject: result.discloseOutput,
        documentType: attestationId === 1 ? "passport" : "eu_id_card",
      });
    } else {
      res.status(400).json({
        status: "error",
        result: false,
        details: result.isValidDetails,
      });
    }
  } catch (error) {
    if (error.name === "ConfigMismatchError") {
      res.status(400).json({
        status: "error",
        message: "Configuration mismatch",
        issues: error.issues,
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});
```

### 5. Handle New Response Format

**V1 Response:**

```javascript
// Simple boolean
true / false;
```

**V2 Response:**

```javascript
{
  attestationId: 1,              // Document type
  isValidDetails: {
    isValid: boolean,            // Overall result
    isOlderThanValid: boolean,   // Age check result
    isOfacValid: boolean         // OFAC check result
  },
  forbiddenCountriesList: [],    // Excluded countries
  discloseOutput: {              // Pre-extracted data
    nationality: "USA",
    minimumAge: "21",
    name: ["JOHN", "DOE"],
    dateOfBirth: "01-01-1990",
    issuingState: "USA",
    idNumber: "123456789",
    gender: "M",
    expiryDate: "01-01-2030",
    ofac: [true, true, true]
  },
  userData: {
    userIdentifier: "uuid-here",
    userDefinedData: "custom-data"
  }
}
```

## Frontend Migration

### 1. Update Dependencies

```bash
npm install @selfxyz/qrcode@latest
```

### 2. Update QR Code Configuration

**V1 (Old):**

```javascript
import { SelfAppBuilder } from "@selfxyz/qrcode";

const selfApp = new SelfAppBuilder({
  appName: "My App",
  scope: "my-app-scope",
  endpoint: "https://api.example.com/verify",
  userId: userId,
  logoBase64: logo,
}).build();
```

**V2 (New):**

```javascript
import { SelfAppBuilder } from "@selfxyz/qrcode";

const selfApp = new SelfAppBuilder({
  appName: "My App",
  scope: "my-app-scope",
  endpoint: "https://api.example.com/verify",
  userId: userId,
  logoBase64: logo,
  version: 2, // NEW: Specify V2
  userDefinedData: "custom-data", // NEW: Optional custom data
  disclosures: {
    // NEW: Must match backend config
    // Verification rules
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK"],
    ofac: true,
    // Data fields to reveal
    name: true,
    nationality: true,
    dateOfBirth: true,
  },
}).build();
```

### 3. Important: Disclosures Object

The `disclosures` object in V2 contains **both** verification rules and data fields:

```javascript
disclosures: {
  // Verification rules (must match backend exactly)
  minimumAge: 18,                      // Age requirement
  excludedCountries: ['IRN', 'PRK'],   // ISO 3-letter codes
  ofac: true,                          // OFAC checking

  // Data fields to reveal
  name: true,                          // Full name
  nationality: true,                   // Nationality
  dateOfBirth: true,                   // Date of birth
  issuingState: true,                  // Issuing country
  idNumber: true,                      // Document number
  gender: true,                        // Gender
  expiryDate: true                     // Expiration date
}
```

## Smart Contract Migration

### 1. Update Contract Inheritance

**V1 (Old):**

```solidity
import { IIdentityVerificationHub } from "@selfxyz/contracts/interfaces/IIdentityVerificationHub.sol";

contract MyContract {
    IIdentityVerificationHub public hub;

    function verify(/* params */) external {
        // Direct hub integration
    }
}
```

**V2 (New):**

```solidity
import { SelfVerificationRoot } from "@selfxyz/contracts/abstract/SelfVerificationRoot.sol";

contract MyContract is SelfVerificationRoot {
    constructor(
        address _hub,
        bytes32 _scope
    ) SelfVerificationRoot(_hub, _scope) {}

    // Override to handle verification results
    function customVerificationHook(
        GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal override {
        // Your business logic here
    }

    // Override to provide configuration ID
    function getConfigId(
        bytes32 destinationChainId,
        bytes32 userIdentifier,
        bytes memory userDefinedData
    ) public view override returns (bytes32) {
        // Generate your config ID at https://tools.self.xyz/
        // Default config ID: 0x7b6436b0c98f62380866d9432c2af0ee08ce16a171bda6951aecd95ee1307d61
        return 0x7b6436b0c98f62380866d9432c2af0ee08ce16a171bda6951aecd95ee1307d61;
    }
}
```

### 2. Update Hub Addresses

**V2 Hub Addresses:**

```solidity
// Celo Mainnet
address constant HUB_V2 = 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF;

// Celo Testnet (Alfajores)
address constant HUB_V2_STAGING = 0x68c931C9a534D37aa78094877F46fE46a49F1A51;
```

### 3. Handle New Data Structure

**V1 Structure:**

```solidity
struct VcAndDiscloseVerificationResult {
    uint256 attestationId;
    uint256 scope;
    uint256 userIdentifier;
    uint256 nullifier;
    uint256[3] revealedDataPacked;   // Packed data
}
```

**V2 Structure:**

```solidity
struct GenericDiscloseOutputV2 {
    bytes32 attestationId;           // Now bytes32
    uint256 userIdentifier;
    uint256 nullifier;
    string issuingState;             // Pre-extracted
    string[] name;                   // Pre-extracted array
    string idNumber;                 // Renamed from passportNumber
    string nationality;              // Pre-extracted
    string dateOfBirth;              // Pre-extracted format
    string gender;                   // Pre-extracted
    string expiryDate;               // Pre-extracted
    uint256 minimumAge;
    bool[3] ofac;                    // Bool array
    uint256[4] forbiddenCountriesListPacked;
}
```

## Common Migration Issues

### 1. Configuration Mismatch

**Problem:** Frontend disclosures don't match backend configuration

```
ConfigMismatchError: Configuration mismatch
```

**Solution:** Ensure frontend and backend have identical settings:

```javascript
// Frontend
disclosures: {
  minimumAge: 18,
  excludedCountries: ['IRN', 'PRK'],
  ofac: true
}

// Backend (in getConfig)
return {
  minimumAge: 18,
  excludedCountries: ['IRN', 'PRK'],
  ofac: true
};
```

### 2. Missing Attestation ID

**Problem:** Verification fails with missing attestation ID

**Solution:** Frontend must send attestation ID:

```javascript
const requestBody = {
  attestationId: 1, // 1 for passport, 2 for EU ID
  proof: proof,
  pubSignals: pubSignals,
  userContextData: userContextData,
};
```

### 3. Invalid User Context Data

**Problem:** User context data validation fails

**Solution:** Ensure proper hex encoding:

```javascript
// Create user context data (256 bytes total)
const userContextData = "0x" + "0".repeat(512); // 512 hex chars = 256 bytes
```

### 4. Document Type Not Allowed

**Problem:** "Attestation ID is not allowed" error

**Solution:** Add document type to allowedIds:

```javascript
// Option 1: Use AllIds for all document types
const allowedIds = AllIds;

// Option 2: Define specific allowed document types
// const allowedIds = new Map();
// allowedIds.set(AttestationId.E_PASSPORT, true);  // Add passport
// allowedIds.set(AttestationId.EU_ID_CARD, true);  // Add EU ID card
```

## Testing Your Migration

### 1. Test with Mock Passports

```javascript
// Use staging/testnet for development
const verifier = new SelfBackendVerifier(
  "test-scope",
  "https://test.ngrok.app/verify",
  true, // Enable mock mode
  allowedIds,
  configStorage,
  UserIdType.UUID
);

// Disable OFAC for mock passports
class ConfigStorage {
  async getConfig() {
    return {
      minimumAge: 18,
      ofac: false, // Must be false for mock passports
    };
  }
}
```

### 2. Test Both Document Types

```javascript
// Test passport verification
const passportResult = await verifier.verify(
  AttestationId.E_PASSPORT, // 1
  passportProof,
  passportSignals,
  userContextData
);

// Test EU ID card verification
const idCardResult = await verifier.verify(
  AttestationId.EU_ID_CARD, // 2
  idCardProof,
  idCardSignals,
  userContextData
);
```

### 3. Verify Configuration Switching

```javascript
class DynamicConfigStorage {
  async getConfig(configId: string) {
    switch (configId) {
      case "strict":
        return { minimumAge: 21, ofac: true };
      case "relaxed":
        return { minimumAge: 18, ofac: false };
      default:
        return { minimumAge: 18, ofac: true };
    }
  }

  async getActionId(userIdentifier: string, userDefinedData?: string) {
    // Select config based on user data
    return userDefinedData === "premium" ? "strict" : "relaxed";
  }
}
```

## Best Practices

### 1. Configuration Management

- Store configurations in a database for easy updates
- Version your configurations for rollback capability
- Use meaningful config IDs (not just hashes)
- Document configuration requirements

### 2. Error Handling

```javascript
try {
  const result = await verifier.verify(/* params */);
} catch (error) {
  if (error.name === "ConfigMismatchError") {
    // Log detailed issues for debugging
    console.error("Config issues:", error.issues);
    // Return user-friendly message
    return { error: "Verification configuration error" };
  }
  // Handle other errors
}
```

### 3. Security Considerations

- Always validate attestation IDs
- Store and check nullifiers to prevent replay
- Use appropriate scopes for different use cases
- Never expose configuration details to frontend

### 4. Performance Optimization

- Cache configuration objects
- Reuse verifier instances
- Batch verification requests when possible
- Use connection pooling for RPC calls

## Resources

- [Quickstart Guide](https://docs.self.xyz/use-self/quickstart) - Basic V2 setup
- [Basic Integration](https://github.com/selfxyz/self-docs/blob/main/use-self/broken-reference/README.md) - Contract examples
- [Workshop Example](https://github.com/selfxyz/workshop) - Simple implementation

## Need Help?

If you encounter issues during migration:

1. Review example implementations
2. Report issues at [GitHub Issues](https://github.com/selfxyz/self/issues)

# Troubleshooting

Some of the most common errors you will encounter when integrating Self can be found below with possible solutions. If you find you are still having issues, further support can be found in our [Telegram group for builders](http://t.me/selfprotocolbuilder).

If you are using AI models to build your app and are encoutering issues, verify that you are using the most up to date versions of our packages. Check your `package.json` file in your frontend and backend. Many AI programs still utilize previous versions when building which will cause errors to occur. You can also make sure you are using a valid working version by using the ones specified in the workshop repo. Check for `@selfxyz/common`, `@selfxyz/qrcode`, `@selfxyz/contracts`, `@selfxyz/core`. &#x20;

- Workshop frontend `package.json`: <https://github.com/selfxyz/workshop/blob/main/app/package.json>
- Workshop smart contracts `package.json`: <https://github.com/selfxyz/workshop/blob/main/contracts/package.json>
- Workshop backend `package.json`: <https://github.com/selfxyz/workshop/blob/main/app/package.json>

## Common errors while verifying proofs

### ScopeMismatch

There is a mismatch of the scope value between the smart contract and the front end. Check the `scopeSeed` value that was used to deploy the smart contract (in your .env/deployment script/smart contract). Then, check the scope value you are passing into the `SelfAppBuilder` object you are building on your frontend (e.g. in your page.tsx). Ensure the `scope` string in `SelfAppBuilder` is the same as the `scopeSeed` used in your contract.

You should also ensure that the `endpoint` used for `SelfAppBuilder` is in lowercase (unchecksum/not in checksum format), if you are using an onchain contract address.

### Invalid 'to' address

There is a mismatch between `endpoint` and `endpoint-type` in the `SelfAppBuilder` object.

- If `endpointType` is `celo` , then `endpoint` value must be the contract address for a contract deployed on Celo Mainnet.
- If `endpointType` is `celo-staging` , then `endpoint` value must be the contract address for a contract deployed on Celo Sepolia Testnet.
- If `endpointType` is `https` , then `endpoint` value must be a http endpoint.
- If `endpointType` is `https-staging` , then `endpoint` value must be a http endpoint. `https-staging` is to be used for verifying mock documents.

### -32000, "message" : "execution reverted"

This is a generic error message thrown when something is wrong with your smart contract logic. This can be caused by a wide variety of factors. Try:

- Checking that you deployed your contract with the [correct Hub address.](https://docs.self.xyz/contract-integration/deployed-contracts)
- Ensure that your `customVerificationHook` logic is sound and contains no errors.

If the error is from a failing require check, the require statements error message will be displayed instead of the -32000 error message.

Other common error codes for interacting with smart contracts can be found in the [EIP-1474 specifications](https://eips.ethereum.org/EIPS/eip-1474).

### Invalid config ID

A common cause of this error is trying to use a Mock Passport to verify a proof on a Celo Mainnet smart contract. Mock Passports can only be used for deployments on Celo Sepolia.

### Config Mismatch

Can be caused by various different issues to do with a mismatch being found between the Verification Config specified in the smart contract and the frontend - see the [section in Basic Integration](https://docs.self.xyz/contract-integration/basic-integration#setting-verification-configs).

### InvalidIdentityCommitmentRoot

This is caused by trying to verify a mock passport on a contract deployed on Celo Mainnet, or verifying a real passport on a contract deployed on Celo Sepolia Testnet.&#x20;

- Real passports are only valid for Celo Mainnet
- Mock passports are only valid for Celo Sepolia Testnet

### error decoding response body: expected value at line 1 coloumn 1

Not following the API spec properly. Check the [Endpoint API reference](https://docs.self.xyz/backend-integration/basic-integration#endpoint-api-reference) and verify you are following it.

### builder error: relative URL

URL being used for endpoint is malformed. Try verifying it is correct and is being input correctly.

### Transaction failed with error: 0xf4d678b8

If you get an error with a message like this but with differing data after the 0x, it is likely the smart contract is hitting a custom error. The error displayed is the hex selector of the custom error you have defined, and so will be different based on the name of your custom error. For example, 0xf4d678b8 is the hex selector for the custom error `InsufficientBalance`.

### DOCTYPE

Caused when you are developing locally and defining your public endpoint (`NEXT_PUBLIC_SELF_ENDPOINT` in the workshop example) with an older version of ngrok, or ngrok not setup properly.

### Due to technical issues

This error can be caused from adding >40 countries to the exclusion list.
