# Email verification setup (Supabase Auth)

Student sign-in now uses **Supabase Auth**, which sends a real confirmation
email. Do this once in the Supabase dashboard, or verification won't work.

## 1. Turn on email confirmation
Dashboard → **Authentication → Providers → Email**
- Make sure **Email** is enabled.
- Turn **"Confirm email"** ON. (If it's OFF, sign-ups are auto-approved and no
  verification happens.)

## 2. Set the URLs the confirmation link returns to
Dashboard → **Authentication → URL Configuration**
- **Site URL:** your live site, e.g. `https://your-app.vercel.app`
- **Redirect URLs:** add both
  - `https://your-app.vercel.app`
  - `http://localhost:3000` (so it works in local dev)

## 3. (Important) Email sending limits
Supabase's built-in email sender is **rate-limited to only a few emails per
hour** and often lands in spam — fine for testing with one or two accounts, but
**not** for a whole class signing up at once. For real use, configure your own
SMTP under **Authentication → Emails → SMTP Settings** (e.g. Gmail SMTP, Resend,
SendGrid).

## How it behaves in the app
- **New student:** enters email + name + section + password → gets a
  "Confirm your email" screen → clicks the link in their inbox → returns and
  signs in.
- **Returning student:** email + password → straight to the map (only works
  after they've confirmed).
- **Staff/admin:** unchanged — email + the **PIN** as the password goes to the
  admin panel (no email confirmation needed for staff).

## Note
The old custom `students` table + `student_exists` / `register_student` /
`verify_student` functions from `students.sql` are **no longer used** (Supabase
Auth replaces them). You can leave them or drop them; they don't affect anything.
