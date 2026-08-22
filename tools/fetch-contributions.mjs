/**
 * AMIRTHA AI — contribution data
 *
 * Returns the real contribution calendar for a GitHub user. Two sources:
 *
 *   GITHUB_TOKEN set  -> GraphQL contributionsCollection (authoritative)
 *   no token          -> https://github.com/users/<login>/contributions
 *                        the public calendar fragment, no auth required
 *
 * The second path exists so the asset can be built and reviewed locally
 * without anyone minting a token. CI takes the first.
 *
 * THIS MODULE NEVER SYNTHESISES DATA. If both sources fail it throws, and the
 * build stops with the previous asset left in place. A contribution graph that
 * invents cells is worse than no contribution graph.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** GitHub's calendar buckets counts into 4 non-zero levels by quartile. */
function levelsFromCounts(days) {
  const nonZero = days.filter((d) => d.count > 0).map((d) => d.count).sort((a, b) => a - b);
  if (nonZero.length === 0) return days.map((d) => ({ ...d, level: 0 }));

  const q = (p) => nonZero[Math.min(nonZero.length - 1, Math.floor(nonZero.length * p))];
  const q1 = q(0.25);
  const q2 = q(0.5);
  const q3 = q(0.75);

  return days.map((d) => {
    if (d.count === 0) return { ...d, level: 0 };
    if (d.count <= q1) return { ...d, level: 1 };
    if (d.count <= q2) return { ...d, level: 2 };
    if (d.count <= q3) return { ...d, level: 3 };
    return { ...d, level: 4 };
  });
}

async function fromGraphQL(login, token) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays { date contributionCount weekday }
            }
          }
        }
      }
    }`;

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'amirtha-ai-profile',
    },
    body: JSON.stringify({ query, variables: { login } }),
  });

  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL: ${json.errors.map((e) => e.message).join('; ')}`);

  const cal = json.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error(`no calendar returned for ${login}`);

  const days = [];
  cal.weeks.forEach((week, col) => {
    for (const d of week.contributionDays) {
      days.push({ date: d.date, count: d.contributionCount, col, row: d.weekday });
    }
  });

  return {
    source: 'graphql',
    total: cal.totalContributions,
    weeks: cal.weeks.length,
    days: levelsFromCounts(days),
  };
}

async function fromPublicCalendar(login) {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(login)}/contributions`, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`public calendar HTTP ${res.status}`);
  const html = await res.text();

  // Each day is a <td> carrying its date, its grid position in the element id,
  // and the level GitHub itself assigned — so no bucketing is needed here.
  const days = [];
  for (const tag of html.match(/<td[^>]*class="ContributionCalendar-day"[^>]*>/g) ?? []) {
    const date = tag.match(/data-date="([^"]+)"/)?.[1];
    const level = tag.match(/data-level="(\d)"/)?.[1];
    const pos = tag.match(/id="contribution-day-component-(\d+)-(\d+)"/);
    if (!date || level === undefined || !pos) continue;
    days.push({ date, level: Number(level), row: Number(pos[1]), col: Number(pos[2]) });
  }

  if (days.length === 0) throw new Error(`no contribution cells parsed for ${login}`);

  const total = Number(
    html.match(/([\d,]+)\s*\n?\s*contribution/i)?.[1]?.replace(/,/g, '') ?? NaN
  );

  return {
    source: 'public-calendar',
    total: Number.isFinite(total) ? total : null,
    weeks: Math.max(...days.map((d) => d.col)) + 1,
    days,
  };
}

/** Real contribution calendar for `login`. Throws rather than inventing data. */
export async function fetchContributions(login) {
  const token = process.env.GITHUB_TOKEN;
  const errors = [];

  if (token) {
    try {
      return await fromGraphQL(login, token);
    } catch (err) {
      errors.push(`graphql: ${err.message}`);
    }
  }

  try {
    return await fromPublicCalendar(login);
  } catch (err) {
    errors.push(`public: ${err.message}`);
  }

  throw new Error(`could not fetch contributions for ${login} — ${errors.join(' | ')}`);
}
