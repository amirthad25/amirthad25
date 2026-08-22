/**
 * AMIRTHA AI — profile statistics
 *
 * Every number rendered in the analytics panel originates here, and every one
 * of them comes from the GitHub API:
 *
 *   public repositories  REST  /users/{login}
 *   language bytes       REST  /repos/{login}/{repo}/languages
 *   commits (last year)  GraphQL contributionsCollection   [token only]
 *   contributions/streak derived from the real contribution calendar
 *
 * A metric that cannot be sourced is returned as null and the renderer OMITS
 * its tile. Nothing is estimated, back-filled, or rounded up to look better.
 *
 * LOCAL BUILDS AND THE RATE LIMIT
 * One analytics build costs roughly 2 + <public repo count> REST requests (16
 * for this account). Unauthenticated access allows 60/hour, so three or four
 * local builds in an hour exhaust it and every later call returns 403.
 *
 * Supply a token through the environment for the current shell only — never in
 * a file, and never committed:
 *
 *   PowerShell   $env:GITHUB_TOKEN = "ghp_xxx"        (or: (gh auth token))
 *   bash / zsh   export GITHUB_TOKEN=ghp_xxx
 *
 * The token needs NO scopes: everything read here is public. CI supplies the
 * automatic secrets.GITHUB_TOKEN, so the workflow never hits this limit.
 */

const API = 'https://api.github.com';
const UA = 'amirtha-ai-profile';

function headers() {
  const h = { Accept: 'application/vnd.github+json', 'User-Agent': UA };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

/** Seconds until a rate-limit window resets, formatted for a human. */
function untilReset(resetEpoch) {
  const secs = Math.max(0, Number(resetEpoch) * 1000 - Date.now()) / 1000;
  const m = Math.floor(secs / 60);
  return m >= 1 ? `${m} min ${Math.round(secs % 60)} sec` : `${Math.round(secs)} sec`;
}

/**
 * Current REST budget. GitHub does not charge this endpoint against the limit,
 * so it is safe to call as a preflight.
 */
export async function rateLimit() {
  const res = await fetch(`${API}/rate_limit`, { headers: headers() });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.resources?.core ?? null;
}

/**
 * A GET with an error message that actually says what went wrong.
 *
 * A bare "-> 403" is ambiguous: it could be an exhausted rate limit, a revoked
 * token, or a blocked resource. GitHub distinguishes them in the response
 * headers, so read them and say which one it was — and, for the rate limit,
 * when it clears and how to avoid it.
 */
async function rest(path) {
  const res = await fetch(`${API}${path}`, { headers: headers() });
  if (res.ok) return res.json();

  const remaining = res.headers.get('x-ratelimit-remaining');
  const limit = res.headers.get('x-ratelimit-limit');
  const reset = res.headers.get('x-ratelimit-reset');
  const authed = Boolean(process.env.GITHUB_TOKEN);

  if ((res.status === 403 || res.status === 429) && remaining === '0') {
    throw new Error(
      `GitHub REST rate limit exhausted (${limit} requests/hour, ` +
      `${authed ? 'authenticated' : 'UNAUTHENTICATED'}). ` +
      `Resets in ${untilReset(reset)}. ` +
      (authed
        ? 'Wait for the window to reset.'
        : 'Set GITHUB_TOKEN to raise the limit from 60 to 5000 requests/hour ' +
          '— see the "Local builds" note in tools/fetch-github-stats.mjs.') +
      `  [GET ${path}]`
    );
  }

  if (res.status === 401) {
    throw new Error(
      `GitHub rejected the credentials (401) on GET ${path}. GITHUB_TOKEN is set ` +
      `but invalid, expired, or revoked. Unset it to fall back to unauthenticated ` +
      `access, or issue a new token.`
    );
  }

  if (res.status === 404) {
    throw new Error(
      `GitHub returned 404 for GET ${path}. Check GITHUB_LOGIN — the account must ` +
      `exist and be public.`
    );
  }

  throw new Error(`GET ${path} -> ${res.status} ${res.statusText}`);
}

/** Run tasks with a small concurrency cap so we stay polite to the API. */
async function mapLimit(items, limit, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

/* ---------------------------------------------------------------- streaks */

/**
 * Streaks from the real calendar.
 *
 * The current streak tolerates an inactive final day: a day that is still in
 * progress shouldn't read as a broken streak. Any earlier gap ends it.
 */
export function computeStreaks(days) {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1));

  let longest = 0;
  let run = 0;
  for (const d of sorted) {
    run = d.level > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  let i = sorted.length - 1;
  if (i >= 0 && sorted[i].level === 0) i -= 1;   // today may not be over yet
  let current = 0;
  for (; i >= 0 && sorted[i].level > 0; i--) current += 1;

  return { current, longest };
}

/* ------------------------------------------------------------- languages */

/**
 * Language bytes per repository.
 *
 * Failures are COLLECTED, not swallowed. Silently treating an unreachable
 * repository as "no languages" would quietly shrink the denominator and render
 * a partial split as confident percentages — an invented statistic wearing the
 * costume of a real one. The caller refuses to render if anything failed.
 */
async function fetchLanguages(login, repos) {
  const failures = [];

  const perRepo = await mapLimit(repos, 4, async (repo) => {
    try {
      return await rest(`/repos/${login}/${repo.name}/languages`);
    } catch (err) {
      failures.push(`${repo.name} (${err.message})`);
      return {};
    }
  });

  const totals = new Map();
  for (const langs of perRepo) {
    for (const [name, bytes] of Object.entries(langs)) {
      totals.set(name, (totals.get(name) ?? 0) + bytes);
    }
  }

  const grand = [...totals.values()].reduce((a, b) => a + b, 0);
  const languages = grand === 0 ? [] : [...totals.entries()]
    .map(([name, bytes]) => ({ name, bytes, share: bytes / grand }))
    .sort((a, b) => b.bytes - a.bytes);

  return { languages, failures };
}

/* --------------------------------------------------------------- commits */

async function fetchCommitCount(login) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          restrictedContributionsCount
        }
      }
    }`;

  try {
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({ query, variables: { login } }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const c = json.data?.user?.contributionsCollection;
    return c ? c.totalCommitContributions : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ main */

/**
 * @param {string} login
 * @param {{days: Array, total: number|null}} contributions from fetch-contributions
 */
export async function fetchStats(login, contributions) {
  // Preflight. /rate_limit is not charged against the limit, so this is free
  // and turns a confusing mid-run 403 into one clear message before any work.
  const budget = await rateLimit();
  if (budget && budget.remaining === 0) {
    throw new Error(
      `GitHub REST rate limit exhausted before starting ` +
      `(0 of ${budget.limit} remaining, ` +
      `${process.env.GITHUB_TOKEN ? 'authenticated' : 'UNAUTHENTICATED'}). ` +
      `Resets in ${untilReset(budget.reset)}. ` +
      (process.env.GITHUB_TOKEN
        ? 'Wait for the window to reset.'
        : 'Set GITHUB_TOKEN to raise the limit from 60 to 5000 requests/hour.')
    );
  }

  const profile = await rest(`/users/${login}`);

  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await rest(`/users/${login}/repos?per_page=100&type=owner&page=${page}`);
    repos.push(...batch);
    if (batch.length < 100) break;
  }

  const owned = repos.filter((r) => !r.fork);

  // One request per repository follows. If the budget cannot cover all of them
  // the run would end with a partial distribution, so stop before starting.
  const before = await rateLimit();
  if (before && before.remaining < owned.length) {
    throw new Error(
      `Not enough GitHub REST budget for a complete language read: ` +
      `${before.remaining} requests remaining, ${owned.length} repositories to ` +
      `query. Resets in ${untilReset(before.reset)}. ` +
      (process.env.GITHUB_TOKEN
        ? 'Wait for the window to reset.'
        : 'Set GITHUB_TOKEN to raise the limit from 60 to 5000 requests/hour.')
    );
  }

  const { languages, failures } = await fetchLanguages(login, owned);

  // Better no panel than a plausible-looking wrong one.
  if (failures.length) {
    throw new Error(
      `language data incomplete: ${failures.length} of ${owned.length} repositories ` +
      `could not be read (first: ${failures[0]}). Refusing to render a partial ` +
      `distribution as complete percentages. Set GITHUB_TOKEN to raise the ` +
      `unauthenticated rate limit of 60 requests/hour.`
    );
  }
  const commits = await fetchCommitCount(login);
  const { current, longest } = computeStreaks(contributions.days);

  return {
    login,
    publicRepos: profile.public_repos ?? owned.length,
    followers: profile.followers ?? null,
    stars: owned.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0),
    totalContributions: contributions.total,
    commits,
    currentStreak: current,
    longestStreak: longest,
    languages,
    repoCountFetched: owned.length,
  };
}
