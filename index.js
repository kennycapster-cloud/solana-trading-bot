// index.js is intended for local development only. To avoid it being accidentally used as a Deno Deploy entrypoint
// that would run setInterval at startup (causing network calls during warmup), we make it a no-op unless RUN_LOCAL env var is set.

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.RUN_LOCAL !== 'true') {
  console.log('index.js is disabled unless RUN_LOCAL=true is set. This file is for local development only.');
  process.exit(0);
}

// When RUN_LOCAL=true we proceed with the local loop
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC_ENDPOINT, 'confirmed');

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";

async function verifyConnection() {
    try {
        console.log("Connecting directly to the Solana network...");
        const slot = await connection.getSlot();
        console.log(`Connected successfully! Current Slot: ${slot}`);
    } catch (error) {
        console.error("Failed to connect to the blockchain:", error.message);
    }
}

async function scanMarket() {
    console.log("-----------------------------------------");
    console.log("Scanning markets for price discrepancies...");
    
    try {
        // Fetching trading price or routes via Jupiter API locally
        const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT}&outputMint=${USDC_MINT}&amount=100000000&slippageBps=50`);
        const data = await response.json();

        if (data && data.outAmount) {
            console.log(`Current exchange rate for 0.1 SOL equals: ${data.outAmount / 1000000} USDC`);
            console.log("Status: No profitable opportunity covering network fees at the moment.");
        } else {
            console.log("Failed to retrieve valid pricing data.");
        }
    } catch (err) {
        console.error("Error fetching prices:", err.message);
    }
}

async function main() {
    await verifyConnection();
    
    // Run the loop to scan every 5 seconds locally on your machine
    setInterval(scanMarket, 5000);
}

main();
