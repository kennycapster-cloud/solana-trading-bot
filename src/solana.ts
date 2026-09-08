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
