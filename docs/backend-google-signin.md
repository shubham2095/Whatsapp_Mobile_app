# "Continue with Google" in the mobile app: backend files

The website already signs in with Google (`GoogleAuthController`), but it sends the finished login to the **website**
(`frontend/auth/callback?token=...`), which a phone app never receives. These 2 files add an app-only way back.
The website flow is unchanged: its URLs, parameters and redirects are exactly the same.

Copy each file from `docs/backend-files/` into the same path of the Laravel backend, then run `php artisan route:clear`.
No migration, no new package, **no change in the Google Cloud console**: the existing web client and its redirect URI
(`.../api/v1/auth/google/callback`) are reused.

| File | What changed |
| --- | --- |
| `app/Modules/Auth/Controllers/GoogleAuthController.php` | `redirect()` accepts `?app=1&challenge=...`; `callback()` sends the app back to `heltog://google-auth?code=...`; new `exchange()`; small `bounce()` / `appUrl()` helpers. The website path still stores `true` as its state and ends in the same `?token=` redirect. |
| `routes/modules/auth.php` | One new route: `POST /auth/google/exchange` (10 requests a minute, like `/login`). |

## How the app signs in

1. The app makes a random secret and opens `GET /auth/google/redirect?app=1&challenge=<sha256 of the secret>` in a browser tab.
2. Google asks which account to use; Google calls the existing `/auth/google/callback`.
3. For an app sign-in the server does **not** put the login token in a URL. It sends the tab to
   `heltog://google-auth?code=<one-time code>` (valid 2 minutes, works once).
4. The app calls `POST /auth/google/exchange` with the code and the secret. The server checks the secret against the
   hash from step 1 and answers like `/auth/login` (`user`, `token`, ...). Someone who intercepts the code cannot use it
   without the secret.

A brand-new Google email gets a workspace, as on the website. Errors come back as `heltog://google-auth?error=...`
(`cancelled`, `not_configured`, `account_disabled`, ...).

## Notes

- Google sign-in must already work on the website (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_REDIRECT_URI` set).
- It works in an installed build (preview / production APK) because the `heltog://` link needs the app's registered URL
  scheme. It does not return to Expo Go.
- Try it: sign out of the app, tap "Continue with Google", choose an account. With a wrong or reused code the app shows
  "Google sign-in expired. Please try again."
