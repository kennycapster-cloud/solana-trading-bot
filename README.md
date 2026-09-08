# Deno Deploy-compatible Solana Arbitrage Bot

This repository contains a Solana arbitrage bot rewritten for Deno Deploy. The bot scans for simple round-trip arbitrage opportunities using the Jupiter Aggregator (v6 quote/swap APIs) and — if enabled — requests a swap transaction payload from Jupiter, signs it with your private key, and sends it to the configured RPC.

WARNING: This bot is capable of executing real trades on-chain. Do NOT enable live execution until you understand the risks and have set appropriate limits and secrets.

Quick summary of files:
- src/index.ts — Deno Deploy HTTP handler (entry point)
- src/jupiter.ts — Jupiter API helpers (quote, swap)
- src/solana.ts — Solana helpers (connection, key loading, signing/sending tx)
- src/config.ts — runtime configuration (env vars)
- src/utils.ts — utility helpers
- scripts/local_runner.ts — helper to run locally (uses std/dotenv)
- deno.json — Deno configuration (permissions handled by Deploy)

Important environment variables (set as Deno Deploy Secrets or local env):
- PRIVATE_KEY — wallet secret **DO NOT COMMIT**. Format accepted:
  - JSON array of bytes (e.g. [12,34, ...]) — recommended
  - base58 string of secret key
- RPC_ENDPOINT — Solana RPC endpoint (default: https://api.mainnet-beta.solana.com)
- ENABLE_LIVE — set to "true" to allow signing and sending transactions. By default live execution is disabled.
- REFERRAL_FEE_ACCOUNT — (optional) base58 address to receive referral fees if supported by route
- TRADE_SIZE_SOL — amount of SOL to test per trade (e.g. 0.1)
- SLIPPAGE_BPS — default slippage basis points (e.g. 50)
- MIN_PROFIT_USD — minimum profit in USD to execute a trade (e.g. 2)

Local run (for development only):
1. Install Deno locally: https://deno.land
2. Create a .env with the required variables (PRIVATE_KEY, RPC_ENDPOINT, ...)
3. Run the local runner:
   deno run --allow-net --allow-env --allow-read scripts/local_runner.ts

Deploy to Deno Deploy:
- Create a new project on Deno Deploy and set the above environment variables as Secrets.
- Set the entrypoint to `src/index.ts`.
- Allow network access in the project settings.

Security notes:
- Never store PRIVATE_KEY in the repo. Use Deno Deploy secrets or other secure secret storage.
- Start with ENABLE_LIVE disabled and test carefully on Devnet before enabling Mainnet trades.
