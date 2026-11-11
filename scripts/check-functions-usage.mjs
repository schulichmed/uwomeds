/**
 * Purpose: warn before MedFriend's sign-in gate runs out of free Cloudflare requests (plan
 *          Task 26). Every MedFriend file now goes through a Pages Function, and the free plan
 *          allows 100,000 Function requests a day.
 * Usage:   CLOUDFLARE_ANALYTICS_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node scripts/check-functions-usage.mjs
 *          (the token needs Account Analytics: Read only). Run daily by functions-usage.yml.
 * Output:  yesterday's request count. Exits 3 when it is over the warning line (80,000), so
 *          the workflow opens an issue; exits 1 if Cloudflare can't be asked.
 */
const LIMIT = 100_000;
const WARN_AT = 80_000;

const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!token || !account) {
  console.error('Set CLOUDFLARE_ANALYTICS_TOKEN and CLOUDFLARE_ACCOUNT_ID.');
  process.exit(1);
}

const day = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const query = `query ($account: String!, $day: Date!) {
  viewer {
    accounts(filter: { accountTag: $account }) {
      pagesFunctionsInvocationsAdaptiveGroups(limit: 1000, filter: { date: $day }) {
        sum { requests }
      }
    }
  }
}`;

const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { account, day } }),
});
const body = await res.json();
if (!res.ok || body.errors?.length) {
  console.error(`Cloudflare analytics failed (${res.status}): ${JSON.stringify(body.errors ?? body).slice(0, 500)}`);
  process.exit(1);
}
const groups = body.data?.viewer?.accounts?.[0]?.pagesFunctionsInvocationsAdaptiveGroups ?? [];
const requests = groups.reduce((n, g) => n + (g.sum?.requests ?? 0), 0);
console.log(`${day}: ${requests.toLocaleString('en-CA')} Pages Function requests (free limit ${LIMIT.toLocaleString('en-CA')} a day).`);
process.exit(requests > WARN_AT ? 3 : 0);
