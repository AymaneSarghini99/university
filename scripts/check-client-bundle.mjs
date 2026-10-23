#!/usr/bin/env node
// Fails the build if browser-facing output contains server secrets.
// Usage: node scripts/check-client-bundle.mjs <dir> [<dir> ...]
// On Vercel (VERCEL=1) the static output in .vercel/output/static is scanned too.
import fs from "node:fs";
import path from "node:path";

const dirs = process.argv.slice(2);
if (process.env.VERCEL === "1") dirs.push(".vercel/output/static");

const TEXT_EXT = /\.(m?js|cjs|html|json|txt|map|css|xml|webmanifest)$/i;
const JWT = /eyJ[\w-]{10,}\.(eyJ[\w-]+)\.[\w-]{10,}/g;
const PATTERNS = [
  ["Supabase secret key", /\bsb_secret_[A-Za-z0-9_-]{16,}/],
  ["OpenAI API key", /\bsk-(?:proj-|svcacct-|admin-)[A-Za-z0-9_-]{20,}|\bsk-[A-Za-z0-9]{40,}/],
  ["Private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["Google OAuth client secret", /\bGOCSPX-[A-Za-z0-9_-]{10,}/],
  // A server env var serialized with its value, e.g. SUPABASE_SERVICE_ROLE_KEY:"eyJ..."
  ["Server env var with value", /\b[A-Z][A-Z0-9_]*(?:SECRET|SERVICE_ROLE|PRIVATE_KEY|ENCRYPTION)[A-Z0-9_]*["']?\s*:\s*["'][^"']{8,}["']/],
];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (TEXT_EXT.test(entry.name)) yield full;
  }
}

const problems = [];
let scanned = 0;
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    scanned += 1;
    const text = fs.readFileSync(file, "utf8");
    for (const [label, re] of PATTERNS) {
      if (re.test(text)) problems.push(`${file}: ${label}`);
    }
    for (const match of text.matchAll(JWT)) {
      try {
        const payload = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
        if (payload.role && payload.role !== "anon") {
          problems.push(`${file}: Supabase JWT with role "${payload.role}"`);
        }
      } catch {
        // not a JWT payload
      }
    }
  }
}

if (problems.length) {
  console.error("\n✖ Secrets found in client bundle (values not printed):");
  for (const p of [...new Set(problems)]) console.error(`  - ${p}`);
  console.error("\nServer secrets must only be read via process.env in server code. Build aborted.\n");
  process.exit(1);
}
console.log(`✓ Client bundle secret check passed (${scanned} files in ${dirs.join(", ") || "no dirs"})`);
