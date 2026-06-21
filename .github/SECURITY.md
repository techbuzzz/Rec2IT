# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.9.x   | :white_check_mark: |
| 0.8.x   | :white_check_mark: |
| < 0.8   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, send an email to **security@rec2it.app** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

You should receive a response within **48 hours**. If the issue is confirmed, we will:

1. Acknowledge receipt within 48 hours
2. Provide an estimated timeline for a fix within 7 days
3. Release a patch as soon as possible
4. Publicly disclose the vulnerability after the fix is deployed (with credit to reporter, unless anonymous preferred)

## Security Measures

This project implements:

- **HMAC-SHA256** anti-cheat verification (server-side via Supabase Edge Function)
- **Rate limiting** on score submissions (1 run per 5 seconds per IP)
- **Content Security Policy** headers via Vercel
- **HSTS** with 2-year max-age
- **X-Frame-Options DENY** to prevent clickjacking
- **Permissions-Policy** minimal grant
- **RLS policies** in Supabase (anon read-only, service_role write)
- **No PII** collected — opt-in leaderboard without email

## Scope

In-scope vulnerabilities:

- Anti-cheat bypass (fake scores, replay attacks)
- XSS via QTE prompt injection (currently safe — no user input)
- SQL injection in Edge Function
- Secret leakage (HMAC secret exposed in client bundle)
- Authentication bypass for leaderboard submission

Out-of-scope:

- Denial of service on Plausible/Supabase free tier
- Client-side score manipulation (we trust client display only)
- Self-XSS (modifying localStorage in your own browser)

## Hall of Fame

Security researchers who have helped us improve:

_To be updated after first responsible disclosure._

## Acknowledgments

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure) best practices. Reporters who follow this policy will be credited (unless they prefer anonymity).