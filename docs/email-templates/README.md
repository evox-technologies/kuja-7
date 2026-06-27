# Supabase email templates

Paste each file into Supabase → Authentication → Email Templates. Brand color `#E53856`.

| File | Dashboard template | Subject | Required var |
|------|--------------------|---------|--------------|
| `confirm-signup.html` | Confirm signup | Your Kuja7 verification code | `{{ .Token }}` |
| `magic-link.html` | Magic Link | Your Kuja7 login code | `{{ .Token }}` |
| `reset-password.html` | Reset Password | Reset your Kuja7 password | `{{ .ConfirmationURL }}` |
| `change-email.html` | Change Email Address | Confirm your new Kuja7 email | `{{ .ConfirmationURL }}` |

Don't change the placeholder vars — the auth code depends on these exact flows
(`signInWithOtp` reads the code, `/reset-password` consumes the link). Swap the
`KUJA7` text for a hosted `<img>` logo once available; email clients won't load
app-relative or SVG logos.
