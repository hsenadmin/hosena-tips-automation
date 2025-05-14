// publish-tips.js
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

// CONFIGURE THESE:
const FD_KEY = process.env.FD_KEY || 'b8de3310475840bf87f56e3a224bbaf4';
const WP_USER = process.env.WP_USER || 'admin';
const WP_APP_PASS = process.env.WP_APP_PASS || '(D9O#)EXi6ha*5bOj9W1g0uJ';
const CACHE_FILE = path.resolve('./seen-fixtures.json');

// List of league codes to fetch from Football-Data.org
const LEAGUES = [
  'ANG1', // Girabola
  'FIFA_WC', // FIFA World Cup (use correct code if available)
  'CL',   // UEFA Champions League
  'BL1',  // Bundesliga
  'DED',  // Eredivisie
  'BSA',  // Campeonato Brasileiro Série A
  'PD',   // Primera Division
  'FL1',  // Ligue 1
  'ELC',  // Championship
  'PPL',  // Primeira Liga
  'EC',   // European Championship
  'SA',   // Serie A
  'PL'    // Premier League
];

// 1. Load or init cache
let seen = {};
try {
  seen = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'));
} catch {
  seen = {};
}

// Helper to fetch fixtures for a league
async function fetchFixtures(league) {
  const url = `https://api.football-data.org/v4/competitions/${league}/matches?status=SCHEDULED`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': FD_KEY } });
  const json = await res.json();
  console.log(`Fetched ${json.matches?.length || 0} fixtures for ${league}`);
  return Array.isArray(json.matches) ? json.matches : [];
}

// 2. Iterate leagues and process fixtures
for (const league of LEAGUES) {
  const fixtures = await fetchFixtures(league);
  for (const f of fixtures) {
    const id = `${league}_${f.id}`; // namespaced ID
    if (seen[id]) continue;
    seen[id] = true;

    // build title & content
    const matchDate = new Date(f.utcDate).toLocaleString();
    const title = `Tip (${league}): ${f.homeTeam.name} vs ${f.awayTeam.name} on ${matchDate}`;
    const over25 = 'N/A'; // no odds
    const content = `
Our tip: **Over 2.5 goals** @ ${over25}

👉 [Bet Now](https://hosena.ao/blog/go/premierbet-bet-angola)

*(Play responsibly – 18+ only.)*
    `;

    // publish to WordPress via REST API
    const auth = Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString('base64');
    await fetch('https://hosena.ao/blog/wp-json/wp/v2/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content, status: 'publish' })
    });
  }
}

// 3. Save updated cache
await fs.writeFile(CACHE_FILE, JSON.stringify(seen, null, 2));
console.log('Done at', new Date().toISOString());