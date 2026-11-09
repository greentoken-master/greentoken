# GreenToken API Reference

All endpoints are under `/api`. Authentication uses JWT in an HTTP-only cookie (`gt_session`).

## Authentication

| Header | Value |
|--------|-------|
| Cookie | `gt_session=<jwt>` (set by `/api/auth/verify` or `/api/auth/refresh`) |

### Auth Levels

| Level | Description | Middleware |
|-------|-------------|------------|
| None | Public endpoint | — |
| Auth | Any authenticated user | `requireAuth()` |
| Member | User must belong to the cooperative | `requireMember(coopId)` |
| Admin | User must be admin of the cooperative | `requireAdmin(coopId)` |
| Super Admin | Platform-level admin | `requireSuperAdmin()` |

---

## Auth Routes

### POST /api/auth/challenge

Request a challenge nonce for wallet signature verification.

- **Auth:** None
- **Rate limit:** 10/min per IP
- **Body:**
  ```json
  { "stellar_address": "G..." }
  ```
- **Response 200:**
  ```json
  { "challenge": "<64-char hex string>" }
  ```
- **Errors:** 400 (invalid address), 429 (rate limited)

### POST /api/auth/verify

Verify wallet signature and issue JWT session.

- **Auth:** None
- **Rate limit:** 5/min per IP, 5/min per wallet
- **Body:**
  ```json
  {
    "stellar_address": "G...",
    "challenge": "<64-char hex>",
    "signature": "<base64 signature>"
  }
  ```
- **Response 200:** Sets `gt_session` cookie, returns:
  ```json
  {
    "stellar_address": "G...",
    "cooperative_ids": ["uuid"],
    "admin_cooperative_ids": ["uuid"],
    "is_super_admin": false
  }
  ```
- **Errors:** 400 (missing fields), 401 (invalid/expired challenge, invalid signature), 429

### GET /api/auth/me

Get current session info.

- **Auth:** Auth
- **Response 200:** Same shape as verify response
- **Errors:** 401 (not authenticated)

### POST /api/auth/refresh

Refresh JWT with updated roles.

- **Auth:** Auth
- **Response 200:** New cookie + updated session body
- **Errors:** 401

### POST /api/auth/logout

Clear session cookie.

- **Auth:** None
- **Response 200:** `{ "success": true }`

### POST /api/auth/email/send

Send OTP code to email address (Supabase auth).

- **Auth:** None
- **Body:** `{ "email": "user@example.com" }`
- **Response 200:** `{ "success": true }`

### POST /api/auth/email/verify

Verify OTP code, issue JWT, auto-create Stellar wallet if needed.

- **Auth:** None
- **Body:** `{ "email": "user@example.com", "token": "123456" }`
- **Response 200:** Session body + cookie
- **Errors:** 400, 401

---

## Certificate Routes

### GET /api/certificates

List certificates, optionally filtered.

- **Auth:** Auth
- **Query params:** `?technology=solar&status=available`
- **Response 200:** Array of certificate objects:
  ```json
  [{
    "id": "uuid",
    "cooperative_id": "uuid",
    "generation_period_start": "2025-01-01",
    "generation_period_end": "2025-01-31",
    "total_kwh": 150,
    "technology": "solar",
    "status": "pending|available|retired",
    "mint_tx_hash": "...|null",
    "token_amount": 150|null,
    "created_at": "..."
  }]
  ```

### POST /api/certificates

Create a new certificate from verified readings.

- **Auth:** Admin
- **Body:**
  ```json
  {
    "cooperative_id": "uuid",
    "generation_period_start": "2025-01-01",
    "generation_period_end": "2025-01-31",
    "total_kwh": 150,
    "technology": "solar",
    "location": "Buenos Aires|null"
  }
  ```
- **Response 201:** Created certificate object
- **Errors:** 400 (validation, no verified readings), 403

### GET /api/certificates/:id

Get certificate detail by ID.

- **Auth:** Auth
- **Response 200:** Certificate with nested `cooperatives` and `retirement` data
- **Errors:** 404

### POST /api/certificates/retire

Retire a certificate (burns tokens on-chain).

- **Auth:** Auth
- **Body:**
  ```json
  {
    "certificate_id": "uuid",
    "buyer_address": "G...",
    "buyer_name": "Company Inc.|null",
    "buyer_purpose": "esg_reporting|carbon_offset|voluntary_commitment|regulatory_compliance|other"
  }
  ```
- **Response 200:** `{ "success": true, "burn_tx_hash": "...", "certificate_id": "uuid" }`
- **Errors:** 400, 403, 404, 409

### GET /api/certificates/stats

Get aggregate certificate statistics.

- **Auth:** Auth
- **Response 200:**
  ```json
  {
    "total_kwh_certified": 5000,
    "total_kwh_retired": 1200,
    "co2_avoided_kg": 2000,
    "certificates_pending": 3,
    "certificates_available": 5,
    "by_technology": { "solar": { ... }, "wind": { ... } },
    "by_cooperative": { "uuid": { "name": "...", ... } }
  }
  ```

---

## Cooperative Routes

### GET /api/cooperatives

List cooperatives (scoped to caller's memberships).

- **Auth:** Auth
- **Response 200:** Array of cooperative objects

### POST /api/cooperatives

Create a new cooperative.

- **Auth:** Auth
- **Body:**
  ```json
  {
    "name": "Coop Solar",
    "technology": "solar|wind|hydro|mixed",
    "admin_stellar_address": "G...",
    "country": "AR|null",
    "province": "Buenos Aires|null",
    "city": "CABA|null"
  }
  ```
- **Response 201:** Created cooperative with generated UUID

### GET /api/cooperatives/:id

Get cooperative detail (stats, meters, certificates).

- **Auth:** Member
- **Response 200:** `{ "cooperative": {...}, "stats": {...}, "certificates": [...], "meters": [...] }`
- **Errors:** 403

### GET /api/cooperatives/:id/readings

Get readings for a cooperative.

- **Auth:** Member
- **Query params:** `?limit=50&offset=0`
- **Response 200:** Array of reading objects

---

## Member Routes

### GET /api/members

List members, scoped to caller's cooperatives.

- **Auth:** Auth
- **Query params:** `?cooperative_id=uuid`
- **Response 200:** Array of member objects

### POST /api/members

Add a member to a cooperative.

- **Auth:** Admin
- **Body:**
  ```json
  {
    "stellar_address": "G...",
    "cooperative_id": "uuid",
    "name": "Alice|null",
    "panel_capacity_kw": 5.0|null,
    "role": "prosumer|copropietario|mixed"
  }
  ```
- **Response 201:** Created member object

---

## Prosumer Routes

### GET /api/prosumers

List prosumers (alias for members, unscoped if admin).

- **Auth:** Auth
- **Response 200:** Array of prosumer objects

### POST /api/prosumers

Create a prosumer (admin only).

- **Auth:** Admin
- **Body:** Similar to members POST
- **Response 201:** Created prosumer object

---

## Meter Routes

### GET /api/meters

List meters, scoped to caller's cooperatives.

- **Auth:** Auth
- **Query params:** `?cooperative_id=uuid`
- **Response 200:** Array of meter objects

### POST /api/meters

Register a new smart meter.

- **Auth:** Admin
- **Body:**
  ```json
  {
    "cooperative_id": "uuid",
    "member_stellar_address": "G...",
    "device_type": "inverter|bidirectional_meter|smart_meter",
    "technology": "solar|wind|hydro|biomass",
    "capacity_kw": 10.0,
    "manufacturer": "...|null",
    "model": "...|null",
    "serial_number": "...|null",
    "location_lat": -34.6|null,
    "location_lng": -58.4|null,
    "installed_at": "2025-01-01|null"
  }
  ```
- **Response 201:** Created meter object

---

## Meter Readings Routes

### POST /api/meters/readings

Submit bulk readings for a meter.

- **Auth:** Auth
- **Body:**
  ```json
  {
    "meter_id": "uuid",
    "readings": [
      {
        "kwh_injected": 1.5,
        "kwh_generated": 2.0,
        "kwh_self_consumed": 0.5,
        "reading_timestamp": "2025-01-01T12:00:00Z",
        "power_watts": 500,
        "interval_minutes": 15
      }
    ]
  }
  ```
- **Response 201:** `{ "inserted": 2 }`
- **Errors:** 400 (validation), 404 (meter not found), 403

---

## Readings Routes

### GET /api/readings

List readings (scoped to caller).

- **Auth:** Auth
- **Response 200:** Array of reading objects

### PATCH /api/readings

Update reading status.

- **Auth:** Admin
- **Body:**
  ```json
  {
    "reading_id": "uuid",
    "status": "pending|verified|rejected"
  }
  ```
- **Response 200:** Updated reading object

---

## Mint Routes

### POST /api/mint

Mint energy tokens on Stellar (1 token = 1 kWh).

- **Auth:** Auth (admin of the cooperative)
- **Body:**
  ```json
  { "reading_id": "uuid" }
  ```
  or
  ```json
  { "certificate_id": "uuid" }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "tx_hash": "...",
    "certificate_id": "uuid|null",
    "amount_kwh": 150,
    "mint_to": "G..."
  }
  ```
- **Errors:** 400 (validation, status), 403, 404, 409 (duplicate mint), 500

---

## Profile Routes

### PATCH /api/profile

Update user profile (name).

- **Auth:** Auth
- **Body:** `{ "name": "Alice" }`
- **Response 200:** Updated profile object

---

## Admin Routes

### GET /api/admin/stats

Get platform-wide statistics (all cooperatives, certificates, mints, retirements).

- **Auth:** Super Admin
- **Response 200:**
  ```json
  {
    "totals": {
      "cooperatives": 5,
      "members": 120,
      "total_kwh_certified": 50000,
      "certificates_total": 45,
      "certificates_pending": 3,
      "certificates_available": 20,
      "certificates_retired": 22
    },
    "cooperatives": [...],
    "recent_mints": [...],
    "recent_retirements": [...]
  }
  ```
- **Errors:** 403

---

## DeFindex Routes

### GET /api/defindex/health

Check DeFindex service health.

- **Auth:** None
- **Response 200:** `{ "healthy": true }`

### GET /api/defindex/vault/:address

Get vault info by address.

- **Auth:** None
- **Response 200:** Vault object with metadata and balances

### POST /api/defindex/deposit

Generate unsigned deposit transaction for client-side signing.

- **Auth:** None
- **Body:** `{ "vault_address": "...", "amount": 100, "user_address": "G..." }`
- **Response 200:** Unsigned transaction XDR

### POST /api/defindex/withdraw

Generate unsigned withdrawal transaction.

- **Auth:** None
- **Body:** `{ "vault_address": "...", "shares": 50, "user_address": "G..." }`
- **Response 200:** Unsigned transaction XDR

---

## Error Responses

All errors follow this format:

```json
{ "error": "Human-readable error message" }
```

Common status codes:
- `400` — Validation error or bad request
- `401` — Authentication required
- `403` — Access denied (insufficient role)
- `404` — Resource not found
- `409` — Conflict (e.g., duplicate mint)
- `429` — Rate limit exceeded (includes `Retry-After` header)
- `500` — Server error
- `503` — Rate limiting temporarily unavailable
