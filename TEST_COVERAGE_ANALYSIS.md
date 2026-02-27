# Test Coverage Analysis

## Current State

**96 tests passing** across 3 test files in 2 packages:

| Package | Test File            | Tests | What's Covered                                                                            |
| ------- | -------------------- | ----- | ----------------------------------------------------------------------------------------- |
| shared  | `validators.test.ts` | 72    | `validateAddress`, `detectChain`, `validateReportInput`, `sanitizeString`, `getRiskLevel` |
| worker  | `risk-score.test.ts` | 15    | `calculateRiskScore`                                                                      |
| worker  | `crypto.test.ts`     | 9     | `sha256`, `generateApiKey`                                                                |

**Estimated line coverage: ~10-15%** — only pure utility functions are tested today.

### What's well tested

- **Address validation** across all 7 chains (ETH, BTC, SOL, TRON, BSC, MATIC, OTHER) with boundary cases
- **Chain detection** from address format
- **Report input validation** with comprehensive error collection
- **String sanitization** (trimming, whitespace collapsing, length enforcement)
- **Risk level classification** at all score boundaries
- **Risk score calculation** with all bonus factors and capping
- **Crypto utilities** (SHA-256 hashing, API key generation format)

---

## Coverage Gaps & Recommendations

### Priority 1: Worker Services (High Impact, ~1,100 lines untested)

These contain the core business logic. Testing them would catch the most critical bugs.

#### 1a. `report-service.ts` — Report Creation & Duplicate Detection

| What to test                                                           | Why it matters                                               |
| ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| Duplicate detection (same IP hash + address within 24h)                | Prevents spam; logic involves date math and hashing          |
| New address creation vs. updating existing address                     | Two distinct DB code paths; wrong one = data corruption      |
| Report count & loss amount accumulation on address                     | Incrementing logic; off-by-one could skew risk scores        |
| Risk score recalculation after report (including threat intel count)   | Composite calculation feeding into public-facing risk badges |
| Cache invalidation after report submission                             | Stale stats shown to users if cache isn't cleared            |
| Null handling for optional fields (loss_amount, evidence_url, tx_hash) | Could cause DB insert failures                               |

**Approach:** Mock the D1 database and CacheService. Test each code path in `createReport()` independently.

#### 1b. `auth-service.ts` — WebAuthn Registration & Login

| What to test                                           | Why it matters                                 |
| ------------------------------------------------------ | ---------------------------------------------- |
| Challenge generation and KV storage with 60s TTL       | Expired/missing challenges must reject login   |
| Base64url encoding/decoding of public keys             | Encoding bugs silently break all future logins |
| Counter update after authentication                    | Prevents replay attacks                        |
| Registration flow (user creation + credential storage) | Core auth path                                 |
| Expired challenge rejection                            | Security-critical: stale challenges must fail  |

**Approach:** Mock `@simplewebauthn/server` verification functions and KV store. Focus on the orchestration logic around the library calls.

#### 1c. `threat-intel-service.ts` — OFAC Import & Address Linking

| What to test                                                 | Why it matters                                          |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| Batch processing in chunks of 50                             | Large imports could fail or skip records                |
| Duplicate prevention (OR IGNORE on external_id)              | Re-imports shouldn't create duplicates                  |
| Address linking (matching chain+address to existing records) | Unlinked intel is invisible to users                    |
| Risk score recalculation with threat intel data              | OFAC-flagged addresses must show elevated risk          |
| Sync state tracking (etag, import count, errors)             | Broken state = repeated full imports or skipped updates |

#### 1d. `api-key-service.ts` — Key Lifecycle

| What to test                                     | Why it matters                                      |
| ------------------------------------------------ | --------------------------------------------------- |
| Max keys per user enforcement                    | Without this, a single user could exhaust resources |
| Key hash storage (plain key never persisted)     | Security requirement                                |
| Ownership validation on delete/toggle/usage      | Cross-user key access = authorization bypass        |
| Plain key returned only on creation, never after | Lost key = must rotate, not retrieve                |

#### 1e. `search-service.ts` — Dynamic Query Construction

| What to test                                             | Why it matters                                    |
| -------------------------------------------------------- | ------------------------------------------------- |
| Dynamic WHERE clause with proper parameter binding order | Wrong binding order = wrong results or SQL errors |
| Pagination (offset calculation, total pages)             | Off-by-one = missing or duplicate results         |
| All sort options (risk, reports, newest)                 | Untested sort = potential SQL error in production |
| Date range filtering (date_to gets T23:59:59 appended)   | Missing time suffix = excludes same-day results   |
| Empty result set handling                                | Could throw on undefined access                   |

#### 1f. `stats-service.ts` — Dashboard Aggregation

| What to test                                      | Why it matters                                           |
| ------------------------------------------------- | -------------------------------------------------------- |
| Cache hit returns cached data (no DB query)       | Performance-critical path                                |
| Trends date-filling algorithm (fills gaps with 0) | Missing dates would break chart rendering                |
| Parallel Promise.all for overview queries         | One failed query should not silently return partial data |

---

### Priority 2: Middleware (Security-Critical, ~300 lines untested)

Middleware guards every request. Bugs here affect the entire API surface.

#### 2a. `api-key-auth.ts` — API Key Authentication

| What to test                            | Why it matters                        |
| --------------------------------------- | ------------------------------------- |
| Missing X-API-Key header → 401          | Must reject unauthenticated requests  |
| Invalid format (no `csr_` prefix) → 401 | Early rejection before DB lookup      |
| Inactive key → 403                      | Disabled keys must be rejected        |
| Daily limit exceeded → 429              | Rate limiting enforcement             |
| Daily limit reset on new UTC day        | Counter must reset at midnight UTC    |
| Usage counter increment                 | Tracks consumption for billing/limits |

#### 2b. `rate-limit.ts` — IP-Based Rate Limiting

| What to test                                                                   | Why it matters                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------------- |
| Requests under limit pass through                                              | Normal operation                                  |
| Request at limit → 429 with Retry-After header                                 | Must not allow burst abuse                        |
| Window boundary behavior                                                       | Requests near window edge shouldn't double-count  |
| Different rate limits per route type (api: 60/60s, v1: 120/60s, report: 5/60s) | Wrong limit on wrong route = UX or security issue |

#### 2c. `sanitize.ts` — Input Sanitization

| What to test                                    | Why it matters                                           |
| ----------------------------------------------- | -------------------------------------------------------- |
| HTML tag removal from strings                   | XSS prevention for stored data                           |
| Recursive sanitization of nested objects/arrays | Deeply nested payloads could bypass shallow sanitization |
| Non-POST/PATCH methods skip sanitization        | GET/DELETE shouldn't be affected                         |
| Invalid JSON → 400                              | Must not crash on malformed input                        |

#### 2d. `session-auth.ts` — Session Validation

| What to test                                 | Why it matters                            |
| -------------------------------------------- | ----------------------------------------- |
| Missing cookie → 401                         | Unauthenticated requests must be rejected |
| Expired session deleted from KV and rejected | Stale sessions must not grant access      |
| Valid session sets userId in context         | Downstream handlers depend on this        |

#### 2e. `turnstile.ts` — CAPTCHA Verification

| What to test                                       | Why it matters                  |
| -------------------------------------------------- | ------------------------------- |
| Missing token → 403                                | Bots must be blocked            |
| Dev bypass only works when ENVIRONMENT=development | Must NEVER work in production   |
| Failed Turnstile verification → 403                | Invalid tokens must be rejected |

---

### Priority 3: Route Handlers (~800 lines untested)

Integration-level tests for the API endpoints.

#### 3a. Internal Routes (Website-Facing)

| Route                              | Key test scenarios                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `POST /api/reports`                | Valid submission, validation errors, duplicate detection, turnstile + sanitize middleware chain |
| `GET /api/reports/recent`          | Default limit (10), limit clamping to [1, 50]                                                   |
| `GET /api/search`                  | Query param parsing, type coercion, pagination defaults                                         |
| `GET /api/address/:chain/:address` | Found → 200, not found → 404                                                                    |
| `POST /api/auth/register/begin`    | displayName validation (1-64 chars)                                                             |
| `POST /api/auth/login/finish`      | Session cookie attributes (HttpOnly, Secure, SameSite)                                          |
| `POST /api/auth/logout`            | Session deleted, cookie cleared                                                                 |
| `GET /api/stats/trends`            | Days param clamped to [1, 365]                                                                  |

#### 3b. V1 Routes (Developer API)

| Route                    | Key test scenarios                                                 |
| ------------------------ | ------------------------------------------------------------------ |
| `POST /v1/reports/batch` | Max 50 items, per-item validation, partial success reporting       |
| `POST /v1/address/batch` | Max 50 items, missing fields → found:false, rate limit in response |
| All v1 endpoints         | API key required, rate limit headers present                       |

#### 3c. Scheduled Handler

| What to test                                                     | Why it matters             |
| ---------------------------------------------------------------- | -------------------------- |
| Feature gate (THREAT_INTEL_ENABLED check)                        | Must not run when disabled |
| Successful import flow (fetch → import → update sync state)      | Core cron job correctness  |
| Error handling (captures error, updates sync state without etag) | Allows retry on next run   |

---

### Priority 4: Frontend (0% coverage, ~2,500 lines)

No test infrastructure exists for the frontend yet. Setup would require adding `vitest` + `@testing-library/react` to the frontend package.

#### 4a. Hooks (Highest value, pure logic)

| Hook          | What to test                                                                  |
| ------------- | ----------------------------------------------------------------------------- |
| `useApi`      | Loading states, success/error handling, refetch, null path skips fetch        |
| `useDebounce` | Timer behavior with fake timers, cleanup on unmount, rapid value changes      |
| `usePageMeta` | Meta tag creation/update, OG/Twitter property attributes, hreflang generation |

#### 4b. Context

| Context       | What to test                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `AuthContext` | Initial loading state, checkAuth success/failure, logout clears state, useAuth throws outside provider |

#### 4c. API Client (`lib/api.ts`)

| What to test                                 | Why it matters                          |
| -------------------------------------------- | --------------------------------------- |
| URL construction (v1 paths vs regular paths) | Wrong URL = all API calls fail          |
| Credentials inclusion                        | Missing credentials = auth doesn't work |
| Error response handling                      | Must not throw on non-2xx responses     |

#### 4d. Components (Interaction-heavy)

| Component    | What to test                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `ReportForm` | 3-step navigation, field validation per step, submission payload construction, optional fields → null conversion |
| `SearchBar`  | Empty query rejection, URL encoding, onSearch callback vs. navigation mode                                       |

---

## Suggested Implementation Order

1. **Set up mocking infrastructure** for D1 database and KV store in the worker package (enables all service/middleware tests)
2. **Worker services** — start with `report-service` and `search-service` (most complex logic, highest bug risk)
3. **Middleware** — `api-key-auth` and `sanitize` (security-critical, relatively small surface area)
4. **Frontend test setup** — add vitest + testing-library to frontend package
5. **Frontend hooks** — `useApi` and `useDebounce` (pure logic, high reuse)
6. **Route handler integration tests** — batch endpoints and auth flows
7. **Frontend components** — `ReportForm` multi-step flow

## Configuration Recommendations

- **Add coverage reporting** to vitest configs (`coverage: { provider: 'v8' }`)
- **Set coverage thresholds** to prevent regression (start at current levels, ratchet up)
- **Add coverage to CI** so PRs show impact on coverage
- **Add a frontend test script** to `frontend/package.json`
