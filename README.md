# Garden City Worship Scheduler

Private, balanced worship scheduling backed by Planning Center Services. Astro deploys statically to GitHub Pages; Supabase provides authentication, cross-device storage, and a tightly restricted Planning Center proxy.

## Local setup

```sh
cp .env.example .env
npm install
npm run dev
```

Create a Supabase project, copy its URL and publishable key into `.env`, and run the migration in `supabase/migrations`.

Configure these Edge Function secrets directly in Supabase; never commit them:

```text
APP_ORIGIN
ALLOWED_EMAIL
PLANNING_CENTER_APP_ID
PLANNING_CENTER_SECRET
```

Deploy the function with `supabase functions deploy planning-center`. Add the GitHub Pages URL to Supabase Auth's allowed redirect URLs.

## Safety

The Planning Center Edge Function allowlists read operations and the single PlanPerson creation endpoint. It overwrites `prepare_notification` to `false` server-side and rejects other writes.
