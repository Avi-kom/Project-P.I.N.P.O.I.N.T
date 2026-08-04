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

## 3. (Important) Fix the email limit — use Gmail as the sender
Supabase's built-in email sender is **rate-limited to only a few emails per
hour** (you'll see "email rate limit reached"). To send to a whole class, point
Supabase at a Gmail account (≈500 emails/day, sends to anyone):

1. Pick/create a Gmail to send from (e.g. the project's Gmail).
2. Turn on **2-Step Verification** for that Google account
   (myaccount.google.com → Security).
3. Create an **App Password**: Google Account → Security → **App passwords** →
   app "Mail" → copy the 16-character password.
4. In Supabase: **Authentication → Emails → SMTP Settings** → enable **Custom SMTP**:
   - Host: `smtp.gmail.com`
   - Port: `465` (or `587`)
   - Username: your full Gmail address
   - Password: the 16-char **app password** (not your normal password)
   - Sender email: your Gmail address
   - Sender name: `P.I.N.P.O.I.N.T.`
5. Save. Keep **"Confirm email" ON** (step 1) and the URLs set (step 2).
6. Test with a **real** email address; check the spam folder the first time.

(Resend/SendGrid also work if you have a domain. Gmail is easiest without one.)

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
