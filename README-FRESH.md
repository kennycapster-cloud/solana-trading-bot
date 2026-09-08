# Solana Trading Bot - Deployment Guide

This guide covers deploying the Solana Trading Bot to Deno Deploy and running it locally.

## Local Development

### Prerequisites
- Install Deno: https://deno.land

### Setup

```bash
# Clone the repository
git clone https://github.com/kennycapster-cloud/solana-trading-bot.git
cd solana-trading-bot

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration:
# - PRIVATE_KEY: Your Solana wallet private key (optional for testing)
# - RPC_ENDPOINT: Solana RPC endpoint
# - TRADE_SIZE_SOL: Amount of SOL per trade (default: 0.1)
# - SLIPPAGE_BPS: Slippage tolerance in basis points (default: 50)
# - MIN_PROFIT_USD: Minimum profit in USD to execute trade (default: 2)
# - ENABLE_LIVE: Set to "true" to enable live trading (default: false)
```

### Running Locally

```bash
# Run with auto-reload during development
deno task dev

# Or run once
deno task start

# Using local_runner.ts with .env file
deno run -A --allow-read scripts/local_runner.ts
```

## Docker Deployment

```bash
# Build image
docker build -t solana-trading-bot .

# Run container with .env file
docker run -p 8000:8000 --env-file .env solana-trading-bot
```

## Deno Deploy

### Setup on Deno Deploy

1. Push your repository to GitHub
2. Go to [deno.com/deploy](https://deno.com/deploy)
3. Create a new project and connect it to your GitHub repository
4. Set the entrypoint to `src/index.ts`
5. Add the following environment variables as **Secrets**:
   - `PRIVATE_KEY`: Your wallet private key (JSON array or base58)
   - `RPC_ENDPOINT`: Solana RPC endpoint
   - `TRADE_SIZE_SOL`: Trade amount in SOL (e.g., 0.1)
   - `SLIPPAGE_BPS`: Slippage tolerance (e.g., 50)
   - `MIN_PROFIT_USD`: Minimum profit threshold (e.g., 2)
   - `ENABLE_LIVE`: Enable live trading ("true" or "false")
6. Deploy the project

### Available Tasks

In `deno.json`:

```bash
deno task dev      # Development with file watching
deno task start    # Production run
deno task local    # Run with local .env file
```

## Security Notes

⚠️ **CRITICAL SECURITY WARNINGS:**

- **NEVER commit PRIVATE_KEY to git**. Always use Deno Deploy Secrets.
- **Start with ENABLE_LIVE=false** and test thoroughly on devnet before enabling mainnet trading.
- Use trusted RPC endpoints (e.g., Helius, Magic Eden).
- Set reasonable limits on TRADE_SIZE_SOL and MIN_PROFIT_USD.
- Monitor your deployments regularly.

## Features

✅ Safe startup without PRIVATE_KEY (uses default values)
✅ Warmup request handling (fast response, no trades)
✅ Atomic transaction execution (both swaps in one transaction)
✅ Error handling with retry logic
✅ Deno Deploy compatible (no Node.js dependencies)
✅ Clean, minimal configuration

## Troubleshooting

### "Module not found: https://deno.land/x/fresh@1.6.0"
This error has been fixed. The project no longer depends on the Fresh framework. If you see this error, ensure you're using the latest version of the repository.

### "Permission denied" errors
When running locally, ensure you use the `-A` flag:
```bash
deno run -A src/index.ts
```

### RPC connection errors
- Verify your RPC_ENDPOINT is correct and accessible
- Check your network connection
- Try using a different RPC provider

### Transaction execution failures
- Ensure ENABLE_LIVE is set to "false" during testing
- Verify your wallet has sufficient balance
- Check SLIPPAGE_BPS setting (too low may cause failures)

## License

This project is provided as-is for educational and trading purposes. Use at your own risk.
