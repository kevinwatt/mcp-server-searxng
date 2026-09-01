// Keeps the version the MCP server reports in its handshake in step with
// package.json. Run automatically by `npm version` (see the "version" script)
// so the two cannot drift apart again — they were six releases apart before.
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const file = 'src/index.ts';
const source = readFileSync(file, 'utf8');
const updated = source.replace(/(\n\s*version: ")[^"]*(")/, `$1${version}$2`);

if (updated === source) {
  console.error(`sync-version: no version literal to update in ${file}`);
  process.exit(1);
}

writeFileSync(file, updated);
console.log(`sync-version: ${file} -> ${version}`);
