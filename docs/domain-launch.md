# Domain Launch

This repo is now set up to deploy the launch site for `fetchtype.com` on Vercel from the repository root.

## What You Need To Do

You only need to do two manual things:

1. Import this repo into Vercel and let it use the checked-in `vercel.json`.
2. Add the required DNS records in Porkbun after Vercel shows you the domain settings.

## Vercel Setup

If this repo is not on GitHub, GitLab, or Bitbucket yet, push it to one of those first. Vercel's import flow needs a connected git repository unless you plan to deploy with the Vercel CLI instead.

1. Create a new Vercel project from this repo.
2. Leave the root directory as the repository root.
3. Vercel will use:
   - `installCommand`: `pnpm install`
   - `buildCommand`: `pnpm --filter @fetchtype/web build`
   - `outputDirectory`: `apps/web/dist`
4. Add both domains in Vercel:
   - `fetchtype.com`
   - `www.fetchtype.com`
5. Make `www.fetchtype.com` the primary domain and redirect the apex domain to `www`.

## Porkbun DNS Records

After the project exists in Vercel, set the records in Porkbun.

Recommended setup:

- `www` `CNAME` -> the Vercel CNAME shown for your project
- `@` `A` -> the exact apex IP shown in your Vercel project domain settings

In many cases Vercel will show a project-specific `www` target such as `something.vercel-dns-017.com`. Use the exact hostname Vercel gives you if it differs from the generic value.

Historically, Vercel often used `76.76.21.21` for apex A records. Their current guidance is to use the exact IP recommended in your project settings because it can be selected from an optimized Anycast pool.

## Why This Setup

- Vercel recommends using `www` as the primary domain with a CNAME record.
- The apex domain cannot use a standards-compliant CNAME, so it typically uses an A record instead.
- Keeping `www` primary gives the host more routing flexibility while still letting `fetchtype.com` redirect cleanly.

## Repo State

- Launch site source: `apps/web`
- Root deploy config: `vercel.json`
- Build output: `apps/web/dist`

## After DNS

Once DNS is live:

1. Confirm both domains are verified in Vercel.
2. Check that `fetchtype.com` redirects to `www.fetchtype.com`.
3. Add analytics, email capture, and product waitlist tooling only after the base site is reachable.
