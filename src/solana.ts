import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmRawTransaction, LAMPORTS_PER_SOL } from "https://esm.sh/@solana/web3.js@1.95.0";
import bs58 from "https://esm.sh/bs58@5.0.0";
import { parseSecretKey, base64ToUint8Array } from "./utils.ts";
import { RPC_ENDPOINT } from "./config.ts";

export const connection = new Connection(RPC_ENDPOINT, { commitment: 'confirmed' });

export function loadKeypairFromEnv(): Keypair {
  const keyEnv = Deno.env.get('PRIVATE_KEY');
  if (!keyEnv) throw new Error('PRIVATE_KEY not set');
  const sk = parseSecretKey(keyEnv);
  return Keypair.fromSecretKey(sk);
}

export async function signAndSendBase64Transaction(base64Tx: string, signer: Keypair) {
  // convert base64 -> Uint8Array
  const txBytes = base64ToUint8Array(base64Tx);
  // Transaction.from accepts a BufferSource
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const tx = Transaction.from(txBytes);

  // Partially sign with our keypair
  tx.partialSign(signer);

  const raw = tx.serialize();
  const sig = await connection.sendRawTransaction(raw, { skipPreflight: false, preflightCommitment: 'confirmed' });
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

export async function combineAndSendBase64Transactions(base64Txs: string[], signer: Keypair) {
  if (!Array.isArray(base64Txs) || base64Txs.length === 0) throw new Error('No transactions to combine');

  // Deserialize each transaction and extract instructions
  const txs: Transaction[] = [];
  for (const b64 of base64Txs) {
    const bytes = base64ToUint8Array(b64);
    // @ts-ignore
    const t = Transaction.from(bytes);
    txs.push(t);
  }

  // Create a new transaction and append all instructions in order
  const combined = new Transaction();
  for (const t of txs) {
    for (const ix of t.instructions) {
      combined.add(ix);
    }
  }

  // Set fee payer and recent blockhash
  combined.feePayer = signer.publicKey;
  const { blockhash } = await connection.getRecentBlockhash('confirmed');
  combined.recentBlockhash = blockhash;

  // Partially sign with our keypair (this will be the only signer by default)
  combined.partialSign(signer);

  const raw = combined.serialize();
  const sig = await connection.sendRawTransaction(raw, { skipPreflight: false, preflightCommitment: 'confirmed' });
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}
