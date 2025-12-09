# Language Simplification Updates

## Overview
Updated user-facing language to be more accessible and less technical, following MiniPay's feedback to use simplified terminology.

## Key Changes

### 1. "Gas" → "Network Fee"
**Before:** "gas fees"
**After:** "network fee (less than $0.01)"

**Rationale:** "Gas" is crypto jargon. "Network fee" is clearer and adding the cost estimate ($0.01) makes it less intimidating.

### 2. "Sign a Transaction" → "Confirm"
**Before:** "You will be asked to sign a transaction to..."
**After:** "You will be asked to confirm..."

**Rationale:** "Sign a transaction" sounds technical and scary. "Confirm" is what users actually do in their wallet.

### 3. "Publish to Blockchain" → "Save Match Forever"
**Before:** "Publish to Blockchain?"
**After:** "Save Match Forever?"

**Rationale:** Focus on the benefit (permanent record) rather than the technology (blockchain).

### 4. Success Messages
**Before:** "Match published on-chain! View on block explorer."
**After:** "Match saved permanently! Anyone can verify this result."

**Rationale:** Emphasizes the value (permanent, verifiable) in plain language.

## Updated Files

1. **packages/nextjs/app/play/multiplayer/page.tsx**
   - Create room confirmation dialog
   - Join room confirmation dialog

2. **packages/nextjs/app/game/multiplayer/[roomId]/page.tsx**
   - Publish match modal (2 instances)
   - Success toast message

3. **packages/nextjs/components/MiniAppAccount.tsx**
   - Tooltip for cUSD balance

## User-Facing Impact

### Create Room Flow
```
Old: "You will be asked to sign a transaction to create your game room on-chain. 
      This is free and only requires gas fees."

New: "You will be asked to confirm creating your game room. 
      This is free and only requires a small network fee (less than $0.01)."
```

### Join Room Flow
```
Old: "You will be asked to sign a transaction to join this room. 
      This is free and only requires gas fees."

New: "You will be asked to confirm joining this room. 
      This is free and only requires a small network fee (less than $0.01)."
```

### Publish Match Flow
```
Old: "Publish to Blockchain?"
     "You will be asked to sign a transaction to publish this match result on-chain. 
      This only requires gas fees and will permanently record the result on the blockchain."

New: "Save Match Forever?"
     "You will be asked to confirm saving this match result permanently. 
      This only requires a small network fee (less than $0.01) and will record 
      the result where anyone can verify it."
```

## Principles Applied

1. **Avoid Crypto Jargon:** No "gas", "on-chain", "sign transaction"
2. **Focus on Benefits:** What does the user get? (permanent record, verification)
3. **Be Transparent:** Show actual costs ($0.01)
4. **Use Familiar Words:** "Confirm" instead of "sign", "save" instead of "publish"
5. **Keep It Short:** Concise explanations that don't overwhelm

## Testing Checklist

- [ ] Create room dialog shows simplified language
- [ ] Join room dialog shows simplified language
- [ ] Publish match modal shows simplified language
- [ ] Success messages use plain language
- [ ] Tooltip on cUSD balance updated
- [ ] No remaining instances of "gas fees" in user-facing text

## Future Considerations

Other terms to potentially simplify:
- "Smart contract" → "Game rules"
- "Wallet" → "Account" (in some contexts)
- "Deploy" → "Create" or "Set up"
- "Mint" → "Create" or "Claim"

Keep monitoring user feedback and iterate on language that causes confusion.
