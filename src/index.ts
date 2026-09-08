import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { getQuote, getSwapTransactionPayload } from './jupiter.ts';
import { loadKeypairFromEnv, signAndSendBase64Transaction, combineAndSendBase64Transactions, connection } from './solana.ts';
import { TRADE_SIZE_SOL, USDC_MINT, SOL_MINT, ENABLE_LIVE, MIN_PROFIT_USD } from './config.ts';
import { LAMPORTS_PER_SOL, PublicKey } from 'https://esm.sh/@solana/web3.js@1.95.0';

async function handleRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    // Accept GET for testing and POST for explicit control
    const mode = url.searchParams.get('mode') || 'scan';

    // Warmup safety: many platforms (including Deno Deploy) call handlers during warmup.
    // Avoid doing network-heavy work during warmup. Recognize common warmup signals and return quickly.
    const warmupHeader = request.headers.get('x-warmup') || request.headers.get('x-deno-warmup') || request.headers.get('x-vercel-warmup');
    if (mode === 'warmup' || warmupHeader) {
      return new Response(JSON.stringify({ success: true, info: 'warmup_ack' }), { status: 200 });
    }

    const amountLamports = Math.round(TRADE_SIZE_SOL * LAMPORTS_PER_SOL);

    // 1) Quote SOL -> USDC
    const quote1 = await getQuote(SOL_MINT, USDC_MINT, amountLamports);
    if (!quote1 || !quote1.data || quote1.data.length === 0) {
      // Return a non-fatal response so warmups or transient network errors don't fail the whole deployment.
      return new Response(JSON.stringify({ success: false, reason: 'no_quote_sol_to_usdc_or_network_issue', quote: quote1 }), { status: 200 });
    }
    const best1 = quote1.data[0];
    const outUsdc = Number(best1.outAmount); // in USDC base units (6 decimals)

    // 2) Quote USDC -> SOL using outUsdc as amount
    const quote2 = await getQuote(USDC_MINT, SOL_MINT, outUsdc);
    if (!quote2 || !quote2.data || quote2.data.length === 0) {
      return new Response(JSON.stringify({ success: false, reason: 'no_quote_usdc_to_sol_or_network_issue', quote: quote2 }), { status: 200 });
    }
    const best2 = quote2.data[0];
    const roundtripSol = Number(best2.outAmount) / 1e9; // SOL has 9 decimals

    const startingSol = TRADE_SIZE_SOL;
    const profitSol = roundtripSol - startingSol;

    // Convert profit to USD roughly using outUsdc
    const outUsdcFloat = outUsdc / 1e6;
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
      // Candidate to execute. If ENABLE_LIVE is true, request swap payloads for both legs and execute them atomically.
      if (!ENABLE_LIVE) {
        scanResult.action = 'would_execute_but_live_disabled';
        return new Response(JSON.stringify(scanResult), { status: 200 });
      }

      // Load keypair
      let signer;
      try {
        signer = loadKeypairFromEnv();
      } catch (err) {
        scanResult.action = 'missing_keypair';
        scanResult.execError = String(err);
        return new Response(JSON.stringify(scanResult), { status: 200 });
      }
      const user = signer.publicKey.toBase58();

      // Get swap transaction payloads from Jupiter for both routes (SOL->USDC and USDC->SOL)
      let swapPayload1: any;
      let swapPayload2: any;
      try {
        swapPayload1 = await getSwapTransactionPayload(best1, user, true);
        swapPayload2 = await getSwapTransactionPayload(best2, user, true);
      } catch (err) {
        scanResult.action = 'swap_payload_fetch_failed';
        scanResult.execError = String(err);
        return new Response(JSON.stringify(scanResult), { status: 500 });
      }

      // Extract base64 transaction strings
      const base64Tx1 = swapPayload1?.swapTransaction?.transaction || swapPayload1?.swapTransaction?.transactionV1 || swapPayload1?.swapTransaction?.legacyTransaction?.transaction;
      const base64Tx2 = swapPayload2?.swapTransaction?.transaction || swapPayload2?.swapTransaction?.transactionV1 || swapPayload2?.swapTransaction?.legacyTransaction?.transaction;

      if (!base64Tx1 || !base64Tx2) {
        scanResult.swapPayload1 = swapPayload1;
        scanResult.swapPayload2 = swapPayload2;
        scanResult.action = 'no_base64_tx_in_swap_payloads';
        return new Response(JSON.stringify(scanResult), { status: 500 });
      }

      // Combine both transactions into one atomic transaction and send
      try {
        const sig = await combineAndSendBase64Transactions([base64Tx1, base64Tx2], signer);
        scanResult.action = 'executed_atomic_roundtrip';
        scanResult.signature = sig;
        return new Response(JSON.stringify(scanResult), { status: 200 });
      } catch (execErr) {
        scanResult.action = 'execution_failed';
        scanResult.execError = String(execErr);
        return new Response(JSON.stringify(scanResult), { status: 500 });
      }
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
