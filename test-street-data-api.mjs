/**
 * Street Data API – Integration Test
 * Run from the valory/ directory:
 *   node test-street-data-api.mjs
 *
 * Requires STREET_DATA_API_KEY in .env (or set it inline):
 *   STREET_DATA_API_KEY=your-key node test-street-data-api.mjs
 *
 * API shape (v2.11+):
 *   - Query:    ?postcode=<NOSPACEPOSTCODE>&tier=basic|core|premium
 *   - Response: data[n].attributes.{estimated_values[], transactions[], ...}
 *   - Pattern:  ^[A-Z]{1,2}\d[A-Z\d]??\d[A-Z]{2}$  (no space, full postcode)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env manually (no dotenv dep needed) ─────────────────────────────
try {
  const env = readFileSync(join(__dirname, '.env'), 'utf8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length && !process.env[key]) {
      process.env[key] = rest.join('=');
    }
  }
} catch { /* .env optional */ }

const API_KEY = process.env.STREET_DATA_API_KEY;
const BASE    = 'https://api.data.street.co.uk/street-data-api/v2';

if (!API_KEY) {
  console.error('❌  STREET_DATA_API_KEY is not set in .env');
  process.exit(1);
}

const HEADERS = {
  'x-api-key': API_KEY,
  'Accept': 'application/json',
};

// Known real postcodes — one per coverage sector (used to verify API connectivity)
// The API requires a full postcode; sector strings like "TA19 0" are rejected with 422.
const COVERAGE_POSTCODES = [
  { sector: 'TA19 0', postcode: 'TA190PL' },
  { sector: 'TA20 1', postcode: 'TA201BE' },
  { sector: 'TA20 2', postcode: 'TA202AY' },
  { sector: 'TA20 4', postcode: 'TA204LF' },
  { sector: 'TA18 8', postcode: 'TA188PH' },
  { sector: 'TA16 5', postcode: 'TA165LT' },
  { sector: 'TA17 8', postcode: 'TA178TA' },
  { sector: 'TA19 9', postcode: 'TA199PU' },
  { sector: 'TA10 0', postcode: 'TA100AZ' },
  { sector: 'TA13 5', postcode: 'TA135AH' },
];

// Representative real postcode with known data for detailed tests
const SAMPLE_POSTCODE = 'TA199PU';

async function get(path) {
  const url = `${BASE}${path}`;
  const res  = await fetch(url, { headers: HEADERS });
  const body = await res.text();
  let json;
  try { json = JSON.parse(body); } catch { json = body; }
  return { status: res.status, ok: res.ok, json };
}

function ok(label)  { console.log(`  ✅  ${label}`); }
function fail(label, detail) { console.log(`  ❌  ${label}${detail ? ': ' + detail : ''}`); }
function section(title) { console.log(`\n── ${title} ${'─'.repeat(50 - title.length)}`); }

// ── 1. Version / availability ──────────────────────────────────────────────
section('1. API reachability');
try {
  const { status, json } = await get('/version');
  if (status === 200) {
    ok(`Reachable  (version: ${json?.version ?? 'n/a'})`);
  } else if (status === 401 || status === 403) {
    fail('Authentication failed', `HTTP ${status} – check your API key`);
    process.exit(1);
  } else {
    fail(`Unexpected status ${status}`, JSON.stringify(json).slice(0, 120));
  }
} catch (e) {
  fail('Network error', e.message);
  process.exit(1);
}

// ── 2. Property lookup for each coverage sector ───────────────────────────
section('2. Property lookup by coverage sector');
for (const { sector, postcode } of COVERAGE_POSTCODES) {
  try {
    const { status, json } = await get(
      `/properties/areas/postcodes?postcode=${postcode}&tier=basic`
    );
    const count = json?.data?.length ?? 0;
    if (status === 200) {
      ok(`${sector} (${postcode})  → ${count} propert${count === 1 ? 'y' : 'ies'}`);
    } else {
      fail(`${sector} (${postcode})  → HTTP ${status}`, JSON.stringify(json).slice(0, 120));
    }
  } catch (e) {
    fail(`${sector}  → network error`, e.message);
  }
}

// ── 3. AVM (estimated values) for sample postcode ─────────────────────────
section(`3. Estimated values (AVM) for ${SAMPLE_POSTCODE}`);
try {
  const { status, json } = await get(
    `/properties/areas/postcodes?postcode=${SAMPLE_POSTCODE}&tier=premium`
  );
  const props = json?.data ?? [];
  const withAvm = props.filter(p => p.attributes?.estimated_values?.[0]?.estimated_market_value > 0).length;
  const sample = props.find(p => p.attributes?.estimated_values?.[0]?.estimated_market_value > 0);
  if (status === 200) {
    ok(`${withAvm}/${props.length} properties have AVM estimates`);
    if (sample) {
      const avm = sample.attributes.estimated_values[0];
      const addr = sample.attributes.address?.royal_mail_format;
      ok(`Sample: ${addr?.postcode ?? SAMPLE_POSTCODE} → £${avm.estimated_market_value.toLocaleString('en-GB')} (${avm.month}/${avm.year})`);
    }
  } else {
    fail(`HTTP ${status}`, JSON.stringify(json).slice(0, 120));
  }
} catch (e) {
  fail('Network error', e.message);
}

// ── 4. Transaction history for sample postcode ────────────────────────────
section(`4. Transaction history for ${SAMPLE_POSTCODE}`);
try {
  const { status, json } = await get(
    `/properties/areas/postcodes?postcode=${SAMPLE_POSTCODE}&tier=premium`
  );
  const attrs = json?.data?.[0]?.attributes;
  if (status === 200 && attrs) {
    const txs = attrs.transactions ?? [];
    ok(`${txs.length} transaction(s) found`);
    if (txs[0]) {
      ok(`Latest: ${txs[0].date}  →  £${txs[0].price?.toLocaleString('en-GB') ?? 'n/a'}`);
    }
    // Derive 12m price trend from AVM history
    const avm = attrs.estimated_values ?? [];
    const current = avm[0]?.estimated_market_value;
    const year_ago = avm[12]?.estimated_market_value;
    if (current && year_ago) {
      const change = ((current - year_ago) / year_ago * 100).toFixed(1);
      ok(`12m AVM trend: ${change}%  (${year_ago.toLocaleString('en-GB')} → ${current.toLocaleString('en-GB')})`);
    } else {
      ok('12m AVM trend: insufficient history');
    }
  } else if (status === 200) {
    ok('Request succeeded but no property data returned for this postcode');
  } else {
    fail(`HTTP ${status}`, JSON.stringify(json).slice(0, 120));
  }
} catch (e) {
  fail('Network error', e.message);
}

console.log('\n── Done ──────────────────────────────────────────────────────────────\n');
