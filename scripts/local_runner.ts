// Local runner to call the HTTP handler as a cron-like loop for developer testing.
// Uses std/dotenv to load .env for local development

import "https://deno.land/std@0.201.0/dotenv/load.ts";
import handler from '../src/index.ts';

async function ping() {
  try {
    const res = await fetch('http://localhost:8000/');
    const txt = await res.text();
    console.log(new Date().toISOString(), res.status, txt);
  } catch (e) {
    console.error('local runner error', e);
  }
}

// If running locally, start the server in a separate process or run `deno run --allow-net --allow-env src/index.ts`
console.log('Local runner expects src/index.ts to be running as a server on http://localhost:8000');
