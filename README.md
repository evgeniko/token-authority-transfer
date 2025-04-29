# Wormhole NTT Token Authority Transfer Demo

This script demonstrates how to transfer token authority for a Native Token Transfer (NTT) contract on Solana using Wormhole. It performs a two-step process: first setting a new token authority and then claiming it.

## Prerequisites

- Node.js installed
- A Solana wallet with SOL for transaction fees
- Access to a Solana RPC endpoint

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the following variables in `src/index.ts`:

- **Network**: Change `NETWORK` to "Mainnet" for production use (currently set to "Testnet")
- **Wallet Path**: Update the path to your wallet key file:
```typescript
const payerSecretKey = Uint8Array.from(
  JSON.parse(
    fs.readFileSync(`/path/to/your/wallet.json`, {
    encoding: "utf-8",
  })
)
```

- **Contract Addresses**: Replace the placeholder addresses with your actual deployed contract addresses:
```typescript
const NTT_MANAGER_ADDRESS = new anchor.web3.PublicKey("YOUR_NTT_MANAGER_ADDRESS");
const NTT_TOKEN_ADDRESS = new anchor.web3.PublicKey("YOUR_TOKEN_ADDRESS");
const NEW_TOKEN_AUTHORITY = new anchor.web3.PublicKey("YOUR_NEW_TOKEN_AUTHORITY");
```

- **RPC Endpoint**: Update the RPC endpoint for production use:
```typescript
const connection = new anchor.web3.Connection(
  "https://api.devnet.solana.com",  // Change this for production
  "confirmed"
);
```

## Running the Script

To run the script:

```bash
npm run start
```

## Important Notes

- The wallet used must have the necessary permissions to perform the authority transfer
