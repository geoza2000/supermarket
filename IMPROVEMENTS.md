# Firebase Boilerplate – Improvement List

Improvements derived from comparing the boilerplate with your other projects (uni-square, codify-chat, company-assistant, trade-master, smart-smile). Two items are required; the rest are recommended.

---

## Required (you specified)

### 1. Enforce App Check on all functions

- **Current:** No `enforceAppCheck` in any function; callables use inline `{ region, cors, invoker }`.
- **Target:**
  - Add a shared **function config** (e.g. `packages/functions/src/config/functionConfig.ts`) with:
    - `CALLABLE_CONFIG`: `region`, `cors`, `invoker: 'public'`, **`enforceAppCheck: true`**.
    - Optionally `AUTH_CALLABLE_CONFIG` with `consumeAppCheckToken: true` for auth-sensitive callables (e.g. login/token exchange).
  - Use this config in every **callable** (`getUserDetails`, `manageFcmToken`, `sendTestNotification`).
  - For **onRequest** (e.g. `healthCheck`): App Check is optional (often skipped for public health checks). If you want it, add an HTTP options type with `enforceAppCheck: true` and use it for any HTTP function that should be protected.
- **Reference:** `uni-square/packages/functions/src/config/functionConfig.ts` and its usage in `getUserDetails.ts`, `manageFcmToken.ts`, `sendTestNotification.ts`.

### 2. Split functions folder by trigger type

- **Current:** Single flat `packages/functions/src/fn/` with mixed trigger types (onCall, onRequest).
- **Target:** One subfolder per trigger type, one function per file inside:

  ```
  packages/functions/src/
  ├── callable/           # onCall
  │   ├── getUserDetails.ts
  │   ├── manageFcmToken.ts
  │   └── sendTestNotification.ts
  ├── https/              # onRequest (HTTP)
  │   └── healthCheck.ts
  ├── firestore/          # onDocumentCreated, onDocumentUpdated, etc. (when added)
  │   └── (e.g. onAgentMessageCreated.ts)
  ├── scheduler/          # onSchedule (when added)
  │   └── (e.g. renewGmailWatches.ts)
  ├── pubsub/             # onMessagePublished etc. (when added)
  │   └── (e.g. gmailPushHandler.ts)
  ├── config/             # function config (CALLABLE_CONFIG, etc.)
  ├── services/
  ├── utils/
  ├── admin.ts
  └── index.ts            # re-export from callable/*, https/*, firestore/*, etc.
  ```

- **Index:** `index.ts` should only import/export from these subfolders (e.g. `export { getUserDetails } from './callable/getUserDetails';`). No logic in `index.ts`, only re-exports.
- **AGENTS.md:** Update “Functions: One Per File” to describe this structure (e.g. “by trigger type: callable/, https/, firestore/, scheduler/, pubsub/”).

---

## Recommended (from other projects)

### 3. App Check on the client (dashboard + website)

- **Current:** Boilerplate dashboard/website do not initialize App Check.
- **Target:** In `packages/dashboard/src/lib/firebase.ts` (and website if it calls functions):
  - Initialize App Check with `ReCaptchaV3Provider` and `isTokenAutoRefreshEnabled: true`.
  - Use env var e.g. `VITE_RECAPTCHA_SITE_KEY` (optional in dev/emulator).
  - Export `appCheck` if needed elsewhere.
- **Reference:** `uni-square/packages/dashboard/src/lib/firebase.ts` (App Check block and export).
- **Setup:** Document in SETUP_CHECKLIST: register App Check app in Firebase Console and add reCAPTCHA v3 key to env.

### 4. Optional: Rate limiting for callables

- **Current:** No rate limiting.
- **Target:** Add a small `utils/rateLimit.ts` (or `utils/rateLimit.ts` + shared config) and use it in sensitive callables (e.g. `getUserDetails`, auth-related). Use Firestore `_rateLimits` (or similar) with a sliding window.
- **Reference:** `uni-square/packages/functions/src/utils/rateLimit.ts` and usage in `getUserDetails.ts` (`enforceRateLimit`, `RATE_LIMITS.STANDARD`).
- **Note:** Keep boilerplate minimal; this can be an optional “add when needed” step.

### 5. Shared HTTP options (for onRequest)

- **Current:** `healthCheck` uses inline `{ region, cors }`.
- **Target:** If you add more HTTP endpoints or want consistency, add e.g. `HTTPS_CONFIG` in `config/functionConfig.ts` with `region`, `cors`, and optionally `enforceAppCheck` so all onRequest functions use the same base config.

### 6. SETUP_CHECKLIST: App Check and ReCaptcha

- Add a step for enabling App Check in the Firebase project and configuring the reCAPTCHA v3 key.
- Add `VITE_RECAPTCHA_SITE_KEY` to the dashboard (and website) env tables and “Find Remaining Variables” section.

### 7. AGENTS.md: Function config and trigger layout

- State that callables must use the shared `CALLABLE_CONFIG` (or `AUTH_CALLABLE_CONFIG`) from `config/functionConfig.ts`.
- Replace the current “Functions: One Per File” path (`src/fn/`) with the new layout (`callable/`, `https/`, etc.) and one function per file.

---

## Summary checklist

| # | Item | Priority |
|---|------|----------|
| 1 | Add `enforceAppCheck` to all functions (via shared config) | Required |
| 2 | Split functions into subfolders by trigger (callable/, https/, …) | Required |
| 3 | Initialize App Check in dashboard (and website) with ReCaptchaV3 | Recommended |
| 4 | Optional rate limiting utility for callables | Optional |
| 5 | Shared HTTP config for onRequest functions | Recommended |
| 6 | Document App Check + ReCaptcha in SETUP_CHECKLIST | Recommended |
| 7 | Update AGENTS.md for config + trigger-based layout | Recommended |

After 1 and 2, the boilerplate will enforce App Check on all callables and scale cleanly as you add Firestore triggers, scheduled functions, and Pub/Sub.
