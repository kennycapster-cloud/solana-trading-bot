// Local development runner for Fresh framework
// Run with: deno run -A --watch=static/,routes/ dev.ts

import { start } from "fresh";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";

await start(manifest, config);
