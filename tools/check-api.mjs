/**
 * AMIRTHA AI — GitHub API preflight
 *
 *   npm run check:api
 *
 * Reports whether a data build can succeed right now: credentials in use,
 * remaining REST budget, what the build will cost, and whether the account
 * resolves. Run this first when `npm run build:data` fails.
 *
 * The token is read from the environment and NEVER printed — only its presence
 * and length are reported.
 */
import { rateLimit } from './fetch-github-stats.mjs';

const LOGIN = process.env.GITHUB_LOGIN || 'amirthad25';
const token = process.env.GITHUB_TOKEN;

console.log('AMIRTHA AI — GitHub API preflight\n');

console.log('  login          :', LOGIN);
console.log('  GITHUB_TOKEN   :', token ? `set (${token.length} chars, value not shown)` : 'NOT SET');
console.log('  mode           :', token ? 'authenticated (5000 req/hour)' : 'unauthenticated (60 req/hour)');

const core = await rateLimit();
if (!core) {
  console.log('\n  could not read /rate_limit — check network access.');
  process.exit(1);
}

const secs = Math.max(0, core.reset * 1000 - Date.now()) / 1000;
console.log('\n  rate limit     :', `${core.remaining} of ${core.limit} remaining`);
console.log('  resets in      :', `${Math.floor(secs / 60)} min ${Math.round(secs % 60)} sec`);

// Cost: /users + /repos + one /languages per public repository.
let repoCount = null;
if (core.remaining > 0) {
  const res = await fetch(`https://api.github.com/users/${LOGIN}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'amirtha-ai-profile',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.ok) {
    const profile = await res.json();
    repoCount = profile.public_repos;
    console.log('  account        :', `resolves (${repoCount} public repositories)`);
  } else {
    console.log('  account        :', `HTTP ${res.status}`);
  }
}

const cost = repoCount === null ? null : 2 + repoCount;
if (cost !== null) console.log('  build cost     :', `~${cost} requests`);

const ok = core.remaining > 0 && (cost === null || core.remaining >= cost);
console.log(`\n  build:data would ${ok ? 'SUCCEED' : 'FAIL'} right now.`);

if (!ok) {
  console.log(
    token
      ? '\n  Wait for the window to reset.'
      : '\n  Set a token for this shell (no scopes needed — all data is public):\n' +
        '    PowerShell   $env:GITHUB_TOKEN = "ghp_xxx"\n' +
        '    with gh CLI  $env:GITHUB_TOKEN = (gh auth token)\n' +
        '    bash / zsh   export GITHUB_TOKEN=ghp_xxx\n' +
        '  Never place the token in a file that gets committed.'
  );
  process.exit(1);
}
