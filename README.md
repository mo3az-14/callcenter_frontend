# CallCenter Frontend

React + Vite + Tailwind CSS + React Router + LiveKit + Axios

## Quick Start

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Build for production

```bash
npm run build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values before running:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:8000/api/v1`) |
| `VITE_LIVEKIT_URL` | LiveKit server URL (e.g. `wss://your-livekit-host`) |
| `VITE_ESCALATION_POLL_MS` | How often to poll for escalation (ms) |
| `VITE_ESCALATION_CLEAR_MS` | Delay before clearing escalation overlay (ms) |
| `VITE_UPLOAD_ADMIN_ROLE_ID` | Minimum `role_id` allowed to access `/upload` |

## Task Progress

| # | Task | Status |
|---|---|---|
| 1 | Vite + Tailwind scaffold | ✅ Done |
| 2 | `src/config.js` + env vars | ✅ Done |
| 3 | React Router + placeholder pages | ✅ Done |
| 4 | AuthContext + localStorage rehydration | ✅ Done |
| 5 | ProtectedRoute + RoleRoute | ✅ Done |
| 6 | Axios client + interceptors | ✅ Done |
| 7 | API domain files | ✅ Done |
| 8 | LoginPage | ✅ Done |
| 9 | TextChat component | ✅ Done |
| 10 | Escalation poll | ✅ Done |
| 11 | VoiceCall component | ✅ Done |
| 12 | UploadPage + FileDropzone | ✅ Done |
| 13 | Duplicate call guard (400) | ✅ Done |
| 14 | Polish + empty states | ✅ Done |

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| React | ^18 | UI framework |
| Vite | ^5 | Dev server + build |
| React Router | v6 | Client-side routing |
| Tailwind CSS | ^3 | Utility-first styling |
| Axios | ^1 | HTTP client |
| @livekit/components-react | latest | LiveKit React hooks |
| livekit-client | latest | LiveKit core SDK |
