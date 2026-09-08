import { USDC_MINT, SOL_MINT, SLIPPAGE_BPS, REFERRAL_FEE_ACCOUNT } from './config.ts';

const JUPITER_QUOTE = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP = 'https://quote-api.jup.ag/v6/swap';

export type QuoteResponse = any;

async function fetchWithTimeout(input: string | Request, init?: RequestInit, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input as any, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Get a quote from Jupiter with simple retry and timeout logic.
 * On persistent failure this returns null instead of throwing so callers can decide how to handle transient network errors.
 */
export async function getQuote(inputMint: string, outputMint: string, amount: number, slippageBps = SLIPPAGE_BPS, maxRetries = 2): Promise<QuoteResponse | null> {
  const url = new URL(JUPITER_QUOTE);
  url.searchParams.set('inputMint', inputMint);
  url.searchParams.set('outputMint', outputMint);
  url.searchParams.set('amount', amount.toString());
  url.searchParams.set('slippageBps', slippageBps.toString());

  let lastErr: any = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchWithTimeout(url.toString(), undefined, 5000 + attempt * 3000);
      if (!res.ok) {
        const txt = await res.text();
        lastErr = new Error(`Jupiter quote failed: ${res.status} ${res.statusText} - ${txt}`);
        // retry
      } else {
        return await res.json();
      }
    } catch (err) {
      lastErr = err;
      // transient network error, will retry
    }

    // exponential backoff before retrying
    if (attempt < maxRetries) {
      const backoff = 250 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  // All retries failed. Log and return null (caller should handle this gracefully).
  console.warn('getQuote: all retries failed', { inputMint, outputMint, amount, error: String(lastErr) });
  return null;
}

export async function getSwapTransactionPayload(route: any, userPublicKey: string, wrapUnwrapSOL = true) {
  const body: any = {
    route,
    userPublicKey,
    wrapUnwrapSOL,
  };
  if (REFERRAL_FEE_ACCOUNT) body.feeAccount = REFERRAL_FEE_ACCOUNT;

  let res;
  try {
    res = await fetch(JUPITER_SWAP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // network-level error
    throw new Error(`Jupiter swap network error: ${String(err)}`);
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Jupiter swap failed: ${res.status} ${res.statusText} - ${txt}`);
  }

  return await res.json();
}
