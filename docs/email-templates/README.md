# Supabase email templates

Paste each file into Supabase → Authentication → Email Templates.

| File | Dashboard template | Subject | Required var |
|------|--------------------|---------|--------------|
| `confirm-signup.html` | Confirm signup | Your Kuja7 verification code | `{{ .Token }}` |
| `magic-link.html` | Magic Link | Your Kuja7 login code | `{{ .Token }}` |
| `reset-password.html` | Reset Password | Reset your Kuja7 password | `{{ .ConfirmationURL }}` |
| `change-email.html` | Change Email Address | Confirm your new Kuja7 email | `{{ .ConfirmationURL }}` |

Don't change the placeholder vars — the auth code depends on these exact flows
(`signInWithOtp` reads the code, `/reset-password` consumes the link).

## Branding

Hex values are copied from `apps/web/styles/tokens/color-tokens.css`; email has no
CSS variables, so they are inlined and drift silently when the palette changes.

| Token | Hex | Used for |
|-------|-----|----------|
| `--color-brand` | `#f5b800` | button fill, header rule |
| `--color-brand-hover` | `#d4970a` | the `7` in the wordmark |
| `--color-brand-light` | `#fffbea` | OTP code panel |
| `--color-brand-border` | `#fce588` | OTP panel border |
| `--color-brand-text` | `#a06c00` | fallback link text |
| `--color-brand-text-strong` | `#6b4500` | the OTP code itself |
| `--color-on-brand` | `#1a1a1a` | text on the yellow button |

Two deliberate deviations from the app:

- The wordmark's `7` uses `--color-brand-hover` (`#d4970a`), not `--color-brand`.
  `#f5b800` on white is ~1.9:1 — below the 3:1 floor even for large text, and email
  clients render on backgrounds ranging from white to off-grey.
- Buttons put `#1a1a1a` on yellow rather than white. White on `#f5b800` is ~1.9:1;
  this is what `--color-on-brand` exists for.

There is no logo image file — `components/layout/logo.tsx` is a text wordmark, and
these templates reproduce it in HTML for the same reason it works well in email:
most clients block images by default and none render SVG. If a raster logo is ever
added, it needs an absolute `https://kuja7.lk/...` URL, never an app-relative path.

Fonts fall back to `Georgia` (display) and `Arial` (body) — Gmail and Outlook strip
webfont loading, so Playfair Display and Nunito only appear where already installed.
