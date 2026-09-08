import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { getQuote, getSwapTransactionPayload } from './jupiter.ts';
import { loadKeypairFromEnv, signAndSendBase64Transaction, connection } from './solana.ts';
import { TRADE_SIZE_SOL, USDC_MINT, SOL_MINT, ENABLE_LIVE, MIN_PROFIT_USD } from './config.ts';
import { LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js@1.95.0';

async function handleRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    // Accept GET for testing and POST for explicit control
    const mode = url.searchParams.get('mode') || 'scan';

    const amountLamports = Math.round(TRADE_SIZE_SOL * LAMPORTS_PER_SOL);

    // 1) Quote SOL -> USDC
    const quote1 = await getQuote(SOL_MINT, USDC_MINT, amountLamports);
    if (!quote1 || !quote1.data || quote1.data.length === 0) {
      return new Response(JSON.stringify({ success: false, reason: 'no_quote_sol_to_usdc', quote: quote1 }), { status: 500 });
    }
    const best1 = quote1.data[0];
    const outUsdc = Number(best1.outAmount); // in USDC base units (6 decimals)

    // 2) Quote USDC -> SOL using outUsdc as amount
    const quote2 = await getQuote(USDC_MINT, SOL_MINT, outUsdc);
    if (!quote2 || !quote2.data || quote2.data.length === 0) {
      return new Response(JSON.stringify({ success: false, reason: 'no_quote_usdc_to_sol', quote: quote2 }), { status: 500 });
    }
    const best2 = quote2.data[0];
    const roundtripSol = Number(best2.outAmount) / 1e9; // SOL has 9 decimals

    const startingSol = TRADE_SIZE_SOL;
    const profitSol = roundtripSol - startingSol;

    // Convert profit to USD roughly using outUsdc
    const outUsdcFloat = outUsdc / 1e6;
    // When doing roundtrip, the USD change is (outUsdc -> back to SOL). We'll approximate profit in USD as profitSol * last SOL price.
    // Estimate SOL price by (outUsdc / startingSol)
    const estSolPrice = outUsdcFloat / startingSol;
    const profitUsd = profitSol * estSolPrice;

    const scanResult: any = {
      success: true,
      startingSol,
      outUsdc: outUsdcFloat,
      roundtripSol,
      profitSol,
      profitUsd,
      quote1Best: best1,
      quote2Best: best2,
      enableLive: ENABLE_LIVE,
    };

    if (profitUsd >= MIN_PROFIT_USD) {
      // Candidate to execute. If ENABLE_LIVE is true, request swap payload and execute SOL->USDC (one-way) as demonstration.
      if (!ENABLE_LIVE) {
        scanResult.action = 'would_execute_but_live_disabled';
        return new Response(JSON.stringify(scanResult), { status: 200 });
      }

      // Load keypair
      const signer = loadKeypairFromEnv();
      const user = signer.publicKey.toBase58();

      // Get swap transaction payload from Jupiter for the first route (SOL->USDC)
      const swapPayload = await getSwapTransactionPayload(best1, user, true);

      if (!swapPayload || !swapPayload.swapTransaction || !swapPayload.swapTransaction.legacyTransaction) {
        // Jupiter may return 'swapTransaction' with 'transaction' as base64 string or 'legacyTransaction'. Try both.
      }

      // Jupiter v6 returns swapTransaction.transaction (base64) typically
      const base64Tx = swapPayload.swapTransaction?.transaction || swapPayload.swapTransaction?.transactionV1 || swapPayload.swapTransaction?.legacyTransaction?.transaction;

      if (!base64Tx) {
        // Try other fields
        // Return debug
        scanResult.swapPayload = swapPayload;
        scanResult.action = 'no_base64_tx_in_swap_payload';
        return new Response(JSON.stringify(scanResult), { status: 500 });
      }

      // Sign & send
      const sig = await signAndSendBase64Transaction(base64Tx, signer);
      scanResult.action = 'executed_swap_sol_to_usdc';
      scanResult.signature = sig;
      return new Response(JSON.stringify(scanResult), { status: 200 });
    }

    scanResult.action = 'no_profitable_opportunity';
    return new Response(JSON.stringify(scanResult), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}

// Export default handler for Deno Deploy and also run a local server when executed directly
export default handleRequest;

if (import.meta.main) {
  // Local dev: start server
  console.log('Starting local HTTP server on http://localhost:8000');
  serve(handleRequest, { port: 8000 });
}
