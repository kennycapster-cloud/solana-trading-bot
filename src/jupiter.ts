import { USDC_MINT, SOL_MINT, SLIPPAGE_BPS, REFERRAL_FEE_ACCOUNT } from './config.ts';

const JUPITER_QUOTE = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP = 'https://quote-api.jup.ag/v6/swap';

export type QuoteResponse = any;

export async function getQuote(inputMint: string, outputMint: string, amount: number, slippageBps = SLIPPAGE_BPS): Promise<QuoteResponse> {
  const url = new URL(JUPITER_QUOTE);
  url.searchParams.set('inputMint', inputMint);
  url.searchParams.set('outputMint', outputMint);
  url.searchParams.set('amount', amount.toString());
  url.searchParams.set('slippageBps', slippageBps.toString());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Jupiter quote failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function getSwapTransactionPayload(route: any, userPublicKey: string, wrapUnwrapSOL = true) {
  const body: any = {
    route,
    userPublicKey,
    wrapUnwrapSOL,
  };
  if (REFERRAL_FEE_ACCOUNT) body.feeAccount = REFERRAL_FEE_ACCOUNT;

  const res = await fetch(JUPITER_SWAP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Jupiter swap failed: ${res.status} ${res.statusText} - ${txt}`);
  }

  return await res.json();
}
