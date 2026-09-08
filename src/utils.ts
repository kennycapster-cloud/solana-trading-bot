import bs58 from "https://esm.sh/bs58@5.0.0";

export function parseSecretKey(envValue: string): Uint8Array {
  // JSON array?
  try {
    const maybeArray = JSON.parse(envValue);
    if (Array.isArray(maybeArray)) {
      return new Uint8Array(maybeArray);
    }
  } catch (_e) {
    // not JSON
  }

  // try base58
  try {
    const decoded = bs58.decode(envValue);
    // If length is 64 or 32? Solana secret key is 64 (secret+pub) or 32
    if (decoded.length === 64 || decoded.length === 32) {
      return decoded;
    }
  } catch (_e) {
    // fallthrough
  }

  throw new Error('PRIVATE_KEY format unrecognized. Provide JSON array or base58 string');
}

export function base64ToUint8Array(b64: string): Uint8Array {
  // atob -> binary string -> Uint8Array
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
