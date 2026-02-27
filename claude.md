# CLAUDE.md — CryptoScamReport

## Project Overview

CryptoScamReport is a free, community-powered cryptocurrency scam and hack incident reporting platform. Users can anonymously report scam/hack incidents and search known threat addresses. A Developer API (with Passkey registration + API Key) is available for third-party integrations.

- **Website frontend**: Fully public, no login required
- **Developer API (`/v1/*`)**: Requires API Key (register via Passkey)
- **Design reference**: See `CryptoScamReport-Design-v1.4.md` for full specs

## Tech Stack

| Layer            | Technology                                 |
| ---------------- | ------------------------------------------ |
| Frontend         | React 19 + Vite + TypeScript + TailwindCSS |
| Backend API      | Cloudflare Workers + Hono framework        |
| Database         | Cloudflare D1 (SQLite)                     |
| Cache / Sessions | Cloudflare KV                              |
| Bot protection   | Cloudflare Turnstile                       |
| Auth             | WebAuthn Passkey (`@simplewebauthn`)       |
| i18n             | react-i18next (zh-TW / en)                 |
| Charts           | Recharts                                   |
| Monorepo         | npm workspaces                             |

## Project Structure

```
cryptoscam-report/
├── frontend/          # Cloudflare Pages — React SPA
│   ├── src/
│   │   ├── components/    # UI components (layout, auth, report, search, dashboard, dev-portal, shared)
│   │   ├── pages/         # Route-level page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React contexts (AuthContext)
│   │   ├── i18n/          # Translation files (zh-TW.json, en.json)
│   │   ├── lib/           # Utilities (api client, validators, webauthn, constants)
│   │   └── types/         # TypeScript type definitions
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── tsconfig.json
├── worker/            # Cloudflare Workers — API backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── internal/  # Website frontend APIs (/api/*)
│   │   │   └── v1/        # Developer APIs (/v1/* — requires API Key)
│   │   ├── middleware/     # Auth, rate limit, CORS, turnstile, sanitize
│   │   ├── services/      # Business logic layer
│   │   ├── db/            # SQL schema + migrations
│   │   └── utils/         # Helpers (address validation, crypto, etc.)
│   ├── wrangler.toml
│   └── tsconfig.json
├── shared/            # Shared types, constants, validators
├── package.json       # Root — npm workspaces config
├── eslint.config.js   # ESLint v9 flat config
├── .prettierrc        # Prettier config
└── tsconfig.base.json # Shared TS config
```

## Architecture Rules

### Dual API Layer

The backend exposes two parallel API layers sharing the same business logic:

- **`/api/*`** — Internal APIs for the website frontend. Protected by Turnstile (POST) and IP-based rate limiting.
- **`/v1/*`** — Developer APIs. Protected by API Key (`X-API-Key` header). Higher rate limits. Includes batch endpoints.
- **`/api/auth/*`** and **`/api/keys/*`** — Developer portal auth (Passkey) and API Key management. Protected by session cookies.

### Authentication Model

- **Website users**: No auth needed. Turnstile for form submission.
- **Developers**: Register with Passkey → login with Passkey → manage API Keys in developer portal → use API Key for `/v1/*` calls.
- **Sessions**: Stored in Cloudflare KV with 7-day TTL. HttpOnly, Secure, SameSite=Lax cookies.
- **API Keys**: Format `csr_` + 64 hex chars. Only SHA-256 hash stored in D1. Shown once at creation.

### IP Recording

All report submissions record full IP address (`CF-Connecting-IP` header), User-Agent, and an IP hash (SHA-256 with daily salt) for duplicate detection. This must be disclosed in the UI.

## Code Conventions

### TypeScript

- **Strict mode**: All `tsconfig.json` files extend `tsconfig.base.json` with `"strict": true`
- **No `any`**: Use `unknown` and type guards instead. `@typescript-eslint/no-explicit-any: error`
- **Explicit return types**: Required for exported functions. `@typescript-eslint/explicit-function-return-type: warn`
- **No floating promises**: All async calls must be awaited or explicitly voided. `@typescript-eslint/no-floating-promises: error`
- **Prefer `const`**: `prefer-const: error`, `no-var: error`
- **Strict equality**: `eqeqeq: ['error', 'always']`
- **No console.log**: Use `console.warn` or `console.error` only. `no-console: ['warn', { allow: ['warn', 'error'] }]`

### Naming

- Files: `kebab-case.ts` / `PascalCase.tsx` (components)
- Types/Interfaces: `PascalCase` — prefix with `I` only if needed for disambiguation
- Constants: `UPPER_SNAKE_CASE`
- Functions/variables: `camelCase`
- API routes: `kebab-case`
- DB columns: `snake_case`
- CSS classes: Tailwind utilities only (no custom CSS classes in components)

### Frontend (React)

- Functional components only — no class components
- Hooks for all state and effects
- `React.lazy()` for route-level code splitting
- All text via `react-i18next` `useTranslation()` — never hardcode user-facing strings
- Use `IBM Plex Mono` for wallet addresses, `Barlow Condensed` for headings/stats, `Barlow` for body text
- Dark theme only — colors via CSS variables (see design doc 6.1)
- No `localStorage` / `sessionStorage` in artifacts — use React state

### Backend (Hono on Workers)

- All D1 queries must use parameterized bindings (`?`) — never string interpolation
- Input validation in middleware before hitting service layer
- Services return typed results, routes handle HTTP concerns (status codes, headers)
- All error responses follow the standard format: `{ success: false, error: { code, message, details? } }`
- Rate limiting via KV with key pattern: `ratelimit:{type}:{identifier}:{window}`

### Shared

- Shared types, constants, and validators live in `shared/` and are imported by both frontend and worker
- Chain definitions, scam types, and address validators are shared code
- Validation must run on both client and server side

## Database (D1)

### Tables

- `users` — Developer accounts (Passkey auth)
- `credentials` — WebAuthn credentials (multiple per user)
- `api_keys` — API Keys (hash stored, prefix for display)
- `addresses` — Aggregated per-address stats (report count, risk score)
- `reports` — Individual incident reports (with IP, source tracking)
- `daily_stats` — Daily snapshot for dashboard (JSON breakdown fields)

### Risk Score

```
risk_score = min(100, base + frequency + amount + recency)
  base      = report_count × 15 (cap 60)
  frequency = 3+ reports in 7 days → +20
  amount    = >$10K → +10, >$100K → +20
  recency   = last report within 24h → +10
```

Levels: 0-25 Low (green), 26-50 Medium (yellow), 51-75 High (orange), 76-100 Critical (red)

## Formatting (Prettier)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## Linting (ESLint v9)

- Flat config format (`eslint.config.js`)
- `--max-warnings=0` — zero tolerance for warnings
- Frontend: `react-hooks/recommended` + `react-refresh`
- Worker: `no-restricted-globals: ['window', 'document']`

## Git Workflow

### Branch Strategy

```
main       → Production deployment (Cloudflare)
develop    → Preview deployment
feature/*  → PR into develop
fix/*      → PR into develop
release/*  → PR into main
```

### Commit Convention (Conventional Commits)

```
feat:     New feature
fix:      Bug fix
refactor: Code refactoring
style:    Formatting (no logic change)
docs:     Documentation
test:     Tests
chore:    Maintenance
ci:       CI/CD changes
```

### Pre-commit

Husky + lint-staged runs `eslint --fix` and `prettier --write` on staged files.

## CI/CD (GitHub Actions)

### CI Pipeline (on PR / push to develop)

1. **Lint** — ESLint (frontend + worker) + Prettier check
2. **Type Check** — `tsc --noEmit` (frontend + worker)
3. **Unit Test** — Vitest (frontend + worker)
4. **Build** — Vite build + Wrangler dry-run

All 4 stages must pass. Any failure blocks merge.

### CD Pipeline (on push to main / develop)

- `main` → D1 migrations + Worker deploy (production) + Pages deploy (production)
- `develop` → Worker deploy (preview) + Pages deploy (preview branch)

### Required Secrets

- `CLOUDFLARE_API_TOKEN` — Workers + Pages + D1 permissions
- `CLOUDFLARE_ACCOUNT_ID`

## SEO Requirements

- Static pages (home, report, search, dashboard, docs) must be prerendered at build time
- Dynamic pages (address detail) use Workers SSR for crawlers
- Every page needs unique `<title>`, `<meta description>`, canonical URL, hreflang tags
- JSON-LD structured data: `WebSite` + `SearchAction` on homepage, `Organization`, `Dataset` on dashboard
- `robots.txt` blocks `/developers` and `/api/` and `/v1/`
- `sitemap.xml` generated daily by Workers Cron (high-risk addresses only, risk_score >= 50)
- Dynamic OG images for address detail pages (Workers + Satori)
- Core Web Vitals targets: LCP < 1.5s, INP < 100ms, CLS < 0.05

## Design Style

**Theme: Law Enforcement × Cybersecurity Firm** (CrowdStrike / Chainalysis / Mandiant inspired)

### Colors (CSS Variables)

```
Background:   --navy-950: #0a0e1a  --navy-900: #0d1321  --navy-800: #131b2e
Borders:      --navy-700: #1a2540  --navy-600: #243052
Text:         --slate-400: #8892a8  --slate-300: #a8b2c8  --slate-200: #c8d0e0  --white: #f0f2f7
Accent:       --blue-accent: #3b82f6
Threat:       --red-500: #e63946   --amber-500: #f59e0b  --green-500: #10b981
API/Dev:      --gold: #c9a84c
```

### Fonts (Google Fonts)

- **Headings/Stats/Nav**: `Barlow Condensed` 500-800, uppercase, letter-spacing 1-2.5px
- **Addresses/Code**: `IBM Plex Mono` 400-600
- **Body**: `Barlow` 400-600 + `Noto Sans TC` (Chinese)

### Visual Elements

- Top red classification bar (mimics classified document marking)
- 60×60px grid background (surveillance/SOC aesthetic)
- Shield logo (SVG, dual-layer with center dot)
- Cards with 2px colored top accent bars
- Risk score: square badge (40×40px) with risk-colored glow
- Bottom operational status bar (green pulse animation)

### UI Terminology

| Chinese  | English (use in UI)    |
| -------- | ---------------------- |
| 首頁     | Threat Feed            |
| 搜尋     | Investigate            |
| 回報     | Submit Incident Report |
| 類型分佈 | Threat Classification  |
| 最新回報 | Latest Threat Reports  |
| 高危地址 | Highest Risk Addresses |
| 儀表板   | Threat Dashboard       |

## Supported Chains

ETH, BTC, SOL, TRON, BSC, MATIC, OTHER — each with specific address format validation.

## Scam Types

`phishing`, `rug_pull`, `fake_exchange`, `hack`, `ponzi`, `impersonation`, `fake_airdrop`, `romance`, `other`

## Common Commands

```bash
# ENV setting
nvm use --lts

# Development
npm run dev                    # Start frontend + worker dev servers
npm run dev --workspace=frontend   # Frontend only
npm run dev --workspace=worker     # Worker only (wrangler dev)

# Quality checks
npm run lint                   # ESLint all workspaces
npm run format:check           # Prettier check
npm run typecheck              # tsc --noEmit all workspaces
npm run ci                     # Full CI pipeline locally

# Build
npm run build --workspace=frontend  # Vite build
npm run build --workspace=worker    # Wrangler dry-run

# Database
cd worker && npx wrangler d1 migrations apply cryptoscam-db --local   # Local D1
cd worker && npx wrangler d1 migrations apply cryptoscam-db --remote  # Production D1

# Deploy
cd worker && npx wrangler deploy                      # Deploy worker
npx wrangler pages deploy frontend/dist --project-name=cryptoscamreport  # Deploy pages
```

## Key Dependencies

### Frontend

- `react` ^19, `react-router-dom` ^7, `react-i18next` ^15
- `recharts` ^2, `tailwindcss` ^4
- `@simplewebauthn/browser` ^11

### Worker

- `hono` ^4
- `@simplewebauthn/server` ^11
- `nanoid` ^5

### Dev

- `typescript` ^5.7, `eslint` ^9, `prettier` ^3
- `vitest` ^2, `husky` ^9, `lint-staged` ^15
