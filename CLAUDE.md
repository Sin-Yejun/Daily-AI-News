# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Korean-language daily AI news viewer. A React frontend renders markdown files (AI papers, newsletters, products) served by an Express backend. Data is synced daily from the upstream repo [GENEXIS-AI/DailyNews](https://github.com/GENEXIS-AI/DailyNews) via a GitHub Actions cron job.

## Commands

### Install dependencies
```bash
npm install          # root (Express server)
cd client && npm install  # React client
```

### Build client
```bash
cd client && npm run build   # outputs to client/dist/
```

### Run server (serves both API and built client)
```bash
node server.js   # http://localhost:3000
```

### Client dev server (hot reload)
```bash
cd client && npm run dev
```

### Lint
```bash
cd client && npm run lint
```

### Sync upstream data
```bash
git remote add upstream https://github.com/GENEXIS-AI/DailyNews.git
git fetch upstream main
git checkout upstream/main -- "논문" "뉴스레터" "프로덕트"
```

## Architecture

**Two-part monorepo:** root-level Express server + `client/` React SPA (Vite + React 19).

### Server (`server.js`)
- Express 5, CommonJS. Single file.
- Dynamically discovers content folders at startup by scanning the repo root, excluding a hardcoded list (`EXCLUDED_FOLDERS`). Adding a new content folder requires a server restart.
- Three API endpoints:
  - `GET /api/folders` — lists content categories
  - `GET /api/files/:folder` — lists `.md` files in a folder, sorted newest-first
  - `GET /api/content/:folder/:filename` — returns markdown file content
- Uses Unicode NFC normalization when resolving Korean folder/file names from URL params to disk paths. This is critical for correct macOS behavior with Korean filenames.
- Serves the React build from `client/dist/`.

### Client (`client/src/`)
- Single-page app in one component (`App.jsx`) + styles (`index.css`).
- Uses `marked` for markdown→HTML and `DOMPurify` for sanitization.
- Dark theme with CSS custom properties (Zinc color palette). Fonts: Inter (sans), Crimson Pro (serif), JetBrains Mono (mono) loaded via Google Fonts.
- Icons from `lucide-react`. Folder icons are mapped by Korean name: 논문→GraduationCap, 뉴스레터→Newspaper, 프로덕트→Zap.
- Relative image paths in markdown are prefixed with the current folder name for correct resolution.
- Vite is aliased to `rolldown-vite` via npm overrides.

### Data folders
- `논문/` (papers), `뉴스레터/` (newsletters), `프로덕트/` (products) — markdown files named with timestamp pattern `YYYY-MM-DD-HH:MM:SS.md`.
- `오디오/` — media assets, gitignored due to size.

### CI/CD
- GitHub Actions workflow (`.github/workflows/sync-upstream-data.yml`) runs daily at 16:00 KST, pulls only the three data folders from upstream, commits, pushes, and triggers a Cloudflare Pages deploy webhook.

## Key Conventions

- Korean is used for content folder names and UI text. Always handle Unicode normalization (NFC) when working with these paths.
- No test framework is configured. The root `package.json` has no test script.
- ESLint config (`client/eslint.config.js`) uses flat config format with `varsIgnorePattern: '^[A-Z_]'` to allow unused capitalized imports (React components, icons).
