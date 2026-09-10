// Prints the PRIVATE_CONTACTS_JSON value for hosted deploys, built from
// every data/private/<slug>.contacts.json on this machine. Paste the output
// into the host's environment variable settings. Never commit it.
import fs from "node:fs";
import path from "node:path";
const dir = path.join(process.cwd(), "data", "private");
const out = {};
for (const f of fs.readdirSync(dir)) {
  const m = f.match(/^(.+)\.contacts\.json$/);
  if (m && !f.endsWith(".example.json")) out[m[1]] = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
}
if (!Object.keys(out).length) { console.error("No data/private/*.contacts.json files found."); process.exit(1); }
process.stdout.write(JSON.stringify(out));
