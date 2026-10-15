# Heltog SocialFlow Mobile

Android app (iOS later) for **Heltog SocialFlow**, a multi-tenant WhatsApp Business inbox and CRM. It talks to the same
Laravel API as the web app (`https://main.heltog.com/api/v1`) and uses the same JWT login, roles and plans.

Built with **Expo SDK 57**, **React Native 0.86**, **Expo Router** and plain **JavaScript** (no TypeScript).

## Features

**For companies (owners and agents)**

- **Inbox**: chat list with search, Open / Hot / Pinned filters, agent filter and unread badges. Chat screen with text,
  photos, videos, documents, voice notes, approved templates for chats outside the 24-hour window, delete message,
  message info (sent / delivered / read times), chat transfer to a teammate, pin chats, quick replies with `/`
  shortcuts, search inside a chat, chat status (Open / Pending / Resolved / Closed) and internal notes (these two need
  [`docs/backend-chat-status-notes.md`](docs/backend-chat-status-notes.md) on the server).
- **Contacts**: search, hot / blocked / opted-out filters, add and edit, import from the phone book or a CSV file,
  hot list with AI priority, black list.
- **Campaigns and bulk send**: create, schedule, start, pause and cancel campaigns, per-recipient status, send one
  template to a list of numbers, CSV reports.
- **Templates**: list, preview, create and submit to Meta, sync.
- **WhatsApp numbers**: connect with a System User token, sync, register, enable sending, update token, send a test.
- **Dashboard and analytics**: KPI cards, daily message chart, campaign performance.
- **Chatbot, automations, social posts, Ask AI**: keyword rules and AI replies, automation on/off and run history,
  Facebook / Instagram posting, assistant for questions about your own data.
- **Billing**: plans, GST breakdown, Razorpay checkout, wallet history, invoices with PDF download.
- **Team, agents, support**: add agents with feature access, workload per agent, support tickets.
- **Push notifications** for new messages (development or release build only, see below).
- Light / dark / follow-the-phone appearance, Privacy Policy and Terms links, in-app account deletion.

**For the platform super admin**

- Companies (create, suspend, delete, assign plan, view users, reset passwords), plans (create, edit, activate),
  invoice and tax settings, support tickets with replies, platform dashboard.

**Not in the app** (web only): the automation flow builder, one-click WhatsApp Embedded Signup, Google sign-in.

## Requirements

- Node.js 20.19.4+, 22.13+ or 24.3+ (React Native 0.86 requirement; the EAS build is pinned to Node 24.17.0 in `eas.json`) and npm
- An Android phone or emulator
- An [Expo](https://expo.dev) account for cloud builds

## Getting started

```bash
npm install
npx expo start
```

Open the app with **Expo Go**, or press `a` to start an Android emulator.

Expo Go is fine for most screens. These need a **development build** (see below): push notifications (Expo Go on
Android no longer supports remote push) and anything that relies on native configuration in `app.json`.

### Configuration

Copy `.env.example` to `.env` if you want to change the defaults. Only `EXPO_PUBLIC_*` variables reach the app.

| Variable | Default | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `https://main.heltog.com/api/v1` | Backend API. From an Android emulator use `http://10.0.2.2:8000/api/v1`; from a real phone use your PC's LAN IP or a tunnel. |
| `EXPO_PUBLIC_WEB_URL` | `https://frontend.heltog.com` | Website that hosts the Privacy Policy, Terms and delete-account pages. |
| `EXPO_PUBLIC_SENTRY_DSN` | empty (off) | Crash reporting, see below. |

Other constants (default country code `91` for bare 10-digit numbers) are in `src/config.js`.

> Never commit `.env` files, keystores or Firebase service-account JSON files. `.gitignore` already covers them.
> `google-services.json` is safe to commit.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Metro dev server |
| `npm run android` | Start the dev server and open Android |
| `npm run lint` | ESLint (`expo lint`) |
| `npx expo-doctor` | Check dependencies and config |
| `npx expo install <package>` | Add a package with an SDK-compatible version (use this instead of `npm install <package>`) |

Run `npm run lint` and `npx expo-doctor` before committing.

## Project structure

```
src/
  app/                 Expo Router screens (file = route)
    (auth)/            login, register, forgot / reset password
    (app)/             everything behind the login
      (tabs)/          bottom tabs: Dashboard, Inbox, Contacts, Campaigns, More (+ Companies, Plans for super admin)
  api/                 one file per backend module, all built on api/client.js
  features/            feature code: hooks (React Query), components, helpers
  components/ui/       shared UI kit (Button, Input, Card, Sheet, ...)
  lib/                 permissions, formatting, phone and CSV helpers, secure storage
  theme/               colors, spacing, light / dark ThemeProvider
docs/                  setup notes for the backend and website
```

How it fits together:

- **API client** (`src/api/client.js`) adds the JWT, unwraps the `{ success, data }` response and throws an `ApiError`
  with `status`, `code` and field `errors`. Any 401 signs the user out.
- **Auth** (`src/features/auth`) keeps the token in `expo-secure-store`, refreshes it on launch and when the app
  returns to the foreground, and gates the screens with `Stack.Protected`.
- **Access control** follows the web app: the backend sends `permissions`, `plan_features` and `plan_limits` with the
  user, and `src/lib/permissions.js` turns them into `can()`, `hasFeature()` and `planAllows()` checks. The backend
  stays the source of truth; hiding a button is only a convenience.
- **Live data**: the backend has no realtime channel, so lists poll while a screen is focused (inbox 15 s, open chat
  8 s, running campaigns 5 s) and push notifications cover the background.
- **State**: TanStack Query for server data, React state for the rest.

## Building

The app is built in the cloud with [EAS Build](https://docs.expo.dev/build/introduction/). Profiles are in `eas.json`.

```bash
npx eas-cli@latest login
npx eas-cli@latest init           # links the project and writes extra.eas.projectId
```

| Goal | Command |
| --- | --- |
| Installable **APK** to test on phones | `npx eas-cli@latest build --platform android --profile preview` |
| **Development build** (push notifications, dev tools) | `npx eas-cli@latest build --platform android --profile development` |
| **AAB** for the Play Store | `npx eas-cli@latest build --platform android --profile production` |

Commit your changes first: EAS builds from git. The first build asks to generate an Android keystore (answer yes).
Keep the keystore safe (`npx eas-cli@latest credentials`); you need the same one for every update.

### Over-the-air updates (EAS Update)

JavaScript-only changes (screens, text, logic) can reach installed apps without a new build or a Play Store review.
Each build profile listens to a channel of the same name (`development`, `preview`, `production`).

```bash
npx eas-cli@latest update --channel preview --message "Fix chat retry" --environment preview
```

- Installed apps download the update in the background; a "New version ready. Tap to restart." pill appears, or
  the update applies on the next launch.
- Updates only reach builds with the **same `version`** in `app.json` (`runtimeVersion` policy `appVersion`).
  Anything that touches native code (a new Expo package, a new permission, plugin changes) needs a **new build**, and
  you should bump `version` so old builds do not receive JavaScript they cannot run.
- Publish to `preview` first, check it on a phone, then publish to `production`.

### Crash reporting (Sentry)

Off by default. To turn it on:

1. Create a project on [sentry.io](https://sentry.io) (platform React Native) and copy its DSN.
2. Add `EXPO_PUBLIC_SENTRY_DSN` as an EAS environment variable (plain text) for the profiles you want.
3. For readable stack traces also set `SENTRY_ORG` and `SENTRY_PROJECT` as EAS environment variables and
   `SENTRY_AUTH_TOKEN` as an EAS **secret**. `app.config.js` then adds the Sentry build plugin, which uploads source maps.
   Never commit the token.

Reports carry only the internal user id (no name, email or phone), and network breadcrumbs have their query strings
removed. Nothing is sent from development builds.

### Push notifications

1. Create a Firebase project, add an Android app with package `com.heltog.mobile`, download `google-services.json`
   and set `expo.android.googleServicesFile` in `app.json`.
2. Generate a service-account key in Firebase and upload it with `npx eas-cli@latest credentials`
   (Android, Google Service Account, FCM V1). Do not commit that key.
3. Build with the `development` or `preview` profile and install it on a real phone.

The backend already sends Expo push messages for new inbound WhatsApp messages and the app registers its token at
`POST /devices`.

### Release checklist

- Privacy policy URL: `https://frontend.heltog.com/privacy`
- Delete-account URL: `https://frontend.heltog.com/delete-account` and the backend endpoint, see
  [`docs/backend-account-deletion.md`](docs/backend-account-deletion.md)
- Replace the default Expo icon and splash image in `assets/`
- Confirm Google Play's payments policy for selling plans inside the app (checkout uses Razorpay in a WebView)

## Known limitations

- Campaigns send a template as-is: templates with variables or a media header should be sent with **Bulk send**.
  Paused campaigns cannot be resumed (the backend only starts draft or scheduled ones).
- Automations can be switched on and off and inspected, but not created or edited.
- Tags are plain text on contacts (`tag_list`); there is no tag-based audience for campaigns.
- Voice notes are recorded as AMR on Android, which the backend accepts. If WhatsApp ever rejects the format,
  change the recorder options in `src/features/inbox/useVoiceRecorder.js`.
- iOS has not been built or tested yet.

## Contributing

Use `npx expo install` for packages, keep new screens under `src/app/` and non-route code under `src/features/`,
`src/components/` or `src/lib/`, and run lint and `expo-doctor` before opening a pull request.

## License

This repository still contains the default MIT `LICENSE` from the Expo project template (copyright Expo).
Replace it with the license you want for Heltog's own code before making the repository public.
