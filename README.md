<p align="center">
  <img src="packages/website/public/logo.svg" alt="Supermarket List Logo" width="120" />
</p>

<h1 align="center">Supermarket List</h1>

<p align="center">
  <strong>Never forget a grocery item again.</strong><br/>
  The smart shopping list your whole household shares. Scan barcodes, group by store, and shop in aisle order — so every trip is faster and nothing gets left behind.
</p>

<p align="center">
  <a href="https://supermarket-list-app-33d.web.app">Open App</a> ·
  <a href="https://supermarket-list-33314.web.app">Website</a>
</p>

---

## Why Supermarket List?

Grocery shopping is a chore everyone shares but nobody coordinates well. Supermarket List turns that chaos into a streamlined flow: one shared list, real-time sync, barcode scanning, and items automatically grouped by store so you never backtrack down the aisle.

## Features

| | Feature | Description |
|---|---|---|
| 🛒 | **Shared Shopping Lists** | Real-time sync across your entire household — everyone sees updates instantly |
| 📷 | **Barcode Scanner** | Point your camera at a product and it's on the list |
| 🏪 | **Grouped by Store** | Items are organized by shop so you can tackle one store at a time |
| 👨‍👩‍👧‍👦 | **Household Collaboration** | Create a household, invite family via link, and shop together |
| ⏰ | **Smart Reminders** | Set visit periods for each store and get notified when it's time to go |
| 📴 | **Works Offline** | Installable PWA — works without internet and syncs when you're back online |

## Tech Stack

<table>
  <tr>
    <td><b>Frontend</b></td>
    <td>React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui</td>
  </tr>
  <tr>
    <td><b>State</b></td>
    <td>TanStack React Query (server) · Zustand (client)</td>
  </tr>
  <tr>
    <td><b>Backend</b></td>
    <td>Firebase Cloud Functions (Node 20) · Firestore</td>
  </tr>
  <tr>
    <td><b>Auth</b></td>
    <td>Firebase Auth (Google Sign-In)</td>
  </tr>
  <tr>
    <td><b>PWA</b></td>
    <td>vite-plugin-pwa · Service Worker · Push Notifications (FCM)</td>
  </tr>
  <tr>
    <td><b>Validation</b></td>
    <td>Zod</td>
  </tr>
</table>

## Architecture

```
supermarket-list/
├── packages/
│   ├── shared/        # Types, Zod schemas, constants (frontend + backend)
│   ├── functions/     # Firebase Cloud Functions
│   ├── dashboard/     # React PWA — the main app
│   └── website/       # Marketing / landing page
├── firebase.json
├── firestore.rules
└── firestore.indexes.json
```

This is a **monorepo** with four packages. The `shared` package provides types and validation schemas consumed by both the `dashboard` (frontend) and `functions` (backend). Security is enforced at the Firestore rules level — only household members can access their data.

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 9
- A [Firebase](https://firebase.google.com/) project with Firestore, Auth, and Cloud Functions enabled

### Installation

```bash
git clone https://github.com/<your-username>/supermarket-list.git
cd supermarket-list
npm install
```

### Development

```bash
# Build the shared package first (required by other packages)
npm run build:shared

# Start the dashboard dev server
npm run dev

# Or start the marketing website
npm run dev:website

# Run with Firebase emulators (Firestore + Functions)
npm run emulate
```

### Build & Deploy

```bash
# Build everything
npm run build

# Deploy to Firebase (hosting + functions)
npm run deploy

# Or deploy individually
npm run deploy:functions
npm run deploy:hosting
```

## How It Works

1. **Create a household** — Sign in with Google, create your household, and invite your family with a shareable link.
2. **Build your list** — Add items by typing, scanning a barcode, or picking from your product catalog. Items auto-sort by store.
3. **Shop and check off** — Head to the store and check items off as you go. Your household sees updates in real time.

## Project Commands

| Command | Description |
|---|---|
| `npm run dev` | Dashboard dev server |
| `npm run dev:website` | Website dev server |
| `npm run emulate` | Run with Firebase emulators |
| `npm run build` | Build all packages |
| `npm run build:shared` | Build shared package |
| `npm run deploy` | Deploy everything to Firebase |
| `npm run lint` | Lint all packages |
| `npm run typecheck` | Type-check all packages |

## License

This project is private and not licensed for redistribution.

---

<p align="center">
  Built with ☕ and too many grocery store trips.
</p>
