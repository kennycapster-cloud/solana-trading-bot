// Configuration module - loads environment variables safely
// Provides sensible defaults to prevent startup failures during build phase

function getEnv(key: string, defaultValue?: string): string {
  try {
    return Deno.env.get(key) || defaultValue || '';
  } catch (_e) {
    // In build/warmup context, env access may fail gracefully
    return defaultValue || '';
  }
}

// RPC Configuration
export const RPC_ENDPOINT = getEnv(
  'RPC_ENDPOINT',
  'https://api.mainnet-beta.solana.com'
);

// Trading Configuration
export const TRADE_SIZE_SOL = parseFloat(getEnv('TRADE_SIZE_SOL', '0.1'));
export const SLIPPAGE_BPS = parseInt(getEnv('SLIPPAGE_BPS', '50'), 10);
export const MIN_PROFIT_USD = parseFloat(getEnv('MIN_PROFIT_USD', '2'));

// Execution Configuration
export const ENABLE_LIVE = getEnv('ENABLE_LIVE', 'false').toLowerCase() === 'true';

// Token Mints
export const SOL_MINT = 'So11111111111111111111111111111111111111112'; // Native SOL
export const USDC_MINT = 'EPjFWaLb3odcccccccccccccccccccccccccccccccc'; // USDC

// Referral Configuration (optional)
export const REFERRAL_FEE_ACCOUNT = getEnv('REFERRAL_FEE_ACCOUNT', '');

// Logging Configuration
export const LOG_LEVEL = getEnv('LOG_LEVEL', 'info');
