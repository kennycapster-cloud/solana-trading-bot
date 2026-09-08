export const RPC_ENDPOINT = Deno.env.get('RPC_ENDPOINT') || 'https://api.mainnet-beta.solana.com';
export const ENABLE_LIVE = (Deno.env.get('ENABLE_LIVE') || 'false') === 'true';
export const TRADE_SIZE_SOL = parseFloat(Deno.env.get('TRADE_SIZE_SOL') || '0.1');
export const SLIPPAGE_BPS = parseInt(Deno.env.get('SLIPPAGE_BPS') || '50');
export const MIN_PROFIT_USD = parseFloat(Deno.env.get('MIN_PROFIT_USD') || '1');
export const REFERRAL_FEE_ACCOUNT = Deno.env.get('REFERRAL_FEE_ACCOUNT') || '';
export const RPC_COMMITMENT: 'confirmed' | 'finalized' | 'processed' = 'confirmed';

// Common token mints
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
