// إعدادات افتراضية — عدّلها أو استمدها من المتغيرات البيئية في بيئة الإنتاج
export const RPC_ENDPOINT = Deno.env.get('RPC_ENDPOINT') || 'https://api.mainnet-beta.solana.com';

// Token mints
export const USDC_MINT = Deno.env.get('USDC_MINT') || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const SOL_MINT = Deno.env.get('SOL_MINT') || 'So11111111111111111111111111111111111111112'; // wrapped SOL

// Trading configuration
export const TRADE_SIZE_SOL = Number(Deno.env.get('TRADE_SIZE_SOL') || '0.01'); // example: 0.01 SOL
export const SLIPPAGE_BPS = Number(Deno.env.get('SLIPPAGE_BPS') || '50'); // 0.5%
export const REFERRAL_FEE_ACCOUNT = Deno.env.get('REFERRAL_FEE_ACCOUNT') || '';

// Safety / runtime flags
export const ENABLE_LIVE = (Deno.env.get('ENABLE_LIVE') || 'false') === 'true';
export const MIN_PROFIT_USD = Number(Deno.env.get('MIN_PROFIT_USD') || '0.5');
