# GreenToken Deployment Guide

This guide covers local development setup, contract deployment, and production deployment.

## Prerequisites

- Node.js 22 (see `.nvmrc`)
- pnpm 9.15+
- Rust 1.89+ (with `wasm32v1-none` target)
- Stellar CLI (`cargo install stellar-cli`)
- A Supabase project (free tier works)
- A Stellar testnet account with XLM (use [Stellar Laboratory](https://laboratory.stellar.org/) to create one)

## 1. Local Development

```bash
git clone https://github.com/BuenDia-Builders/green-token.git
cd green-token
pnpm install
```

Copy the env file and fill in your values:

```bash
cp apps/web/.env.example apps/web/.env.local
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `JWT_SECRET` | Yes | Random string 32+ chars for JWT signing |
| `MINTER_SECRET_KEY` | Yes | Stellar secret key for the minter account |
| `NEXT_PUBLIC_STELLAR_NETWORK` | No | `TESTNET` (default), `PUBLIC`, `FUTURENET`, `LOCAL` |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | No | Soroban RPC URL |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | No | Horizon URL |
| `NEXT_PUBLIC_ENERGY_TOKEN_CONTRACT` | Yes | Deployed energy_token contract address |
| `NEXT_PUBLIC_ENERGY_DISTRIBUTION_CONTRACT` | Yes | Deployed energy_distribution contract address |
| `NEXT_PUBLIC_COMMUNITY_GOVERNANCE_CONTRACT` | Yes | Deployed community_governance contract address |
| `NEXT_PUBLIC_ADMIN_ADDRESS` | Yes | Admin's Stellar public key |
| `SUPER_ADMIN_ADDRESSES` | No | Comma-separated super admin Stellar addresses |

Generate a JWT secret:

```bash
openssl rand -base64 32
```

### Database Setup

Run the setup scripts to create tables and RLS policies:

```bash
pnpm tsx scripts/setup-db.ts
pnpm tsx scripts/setup-rls.ts
```

### Start the dev server

```bash
pnpm dev
```

Frontend runs at `http://localhost:3000`.

## 2. Smart Contract Deployment

### Build the contracts

```bash
cd apps/contracts
stellar contract build
```

This produces WASM files in `target/wasm32v1-none/release/`.

### Install WASM on Stellar

Install each contract's WASM to get its hash:

```bash
# For each contract:
stellar contract install --source <admin-secret-key> --network testnet \
    --wasm target/wasm32v1-none/release/energy_token.wasm
# → <token_wasm_hash>

stellar contract install --source <admin-secret-key> --network testnet \
    --wasm target/wasm32v1-none/release/energy_distribution.wasm
# → <distribution_wasm_hash>

stellar contract install --source <admin-secret-key> --network testnet \
    --wasm target/wasm32v1-none/release/community_governance.wasm
# → <governance_wasm_hash>
```

### Deploy contracts

Deploy each contract using its WASM hash:

```bash
# Energy Token
stellar contract deploy --source <admin-secret-key> --network testnet \
    --wasm-hash <token_wasm_hash> \
    -- \
    --admin <admin-public-key> \
    --distribution_contract <distribution_address> \
    --initial_supply 0 \
    --name "GreenToken Energy" \
    --symbol "GREN" \
    --cooperative_id "default"

# Energy Distribution
stellar contract deploy --source <admin-secret-key> --network testnet \
    --wasm-hash <distribution_wasm_hash> \
    -- \
    --admin <admin-public-key> \
    --token_contract <energy_token_address>

# Community Governance
stellar contract deploy --source <admin-secret-key> --network testnet \
    --wasm-hash <governance_wasm_hash> \
    -- \
    --admin <admin-public-key>
```

### Update .env with contract addresses

After deployment, update `.env.local` with the deployed contract addresses.

### Grant minter role

The energy_token constructor grants the minter role to the distribution contract automatically. If you deploy them separately, you may need to call `grant_role` manually.

## 3. Production Deployment (Vercel)

### Vercel Setup

1. Push your code to GitHub (branch off `develop`)
2. Import the repository in Vercel
3. Set the root directory to `apps/web`
4. Configure environment variables in Vercel project settings (same as `.env.local`)
5. Vercel auto-detects Next.js and runs `pnpm build`

### Build Settings

- **Framework preset:** Next.js
- **Build command:** `pnpm build` (from monorepo root, Turborepo handles the rest)
- **Output directory:** `.next`
- **Install command:** `pnpm install --frozen-lockfile`
- **Node version:** 22

### Domain Configuration

1. Add your custom domain in Vercel project settings
2. The `next.config.mjs` already sets strict security headers (CSP, HSTS, X-Frame-Options DENY)
3. Update CSP `connect-src` if using a different Supabase URL or Stellar network

## 4. Post-Deployment Checklist

- [ ] Supabase tables created (`setup-db.ts`)
- [ ] RLS policies enabled (`setup-rls.ts`)
- [ ] Rate limits table exists
- [ ] Audit log table exists
- [ ] Contract addresses in env vars match deployed contracts
- [ ] MINTER_SECRET_KEY funded with XLM on the target network
- [ ] Admin address set in `NEXT_PUBLIC_ADMIN_ADDRESS`
- [ ] Super admin addresses configured in `SUPER_ADMIN_ADDRESSES`
- [ ] CSP headers verified (check with [securityheaders.com](https://securityheaders.com))
- [ ] Test wallet auth flow (connect → challenge → verify → dashboard)
- [ ] Test email auth flow (send OTP → verify → dashboard)
- [ ] Test certificate creation and minting flow
- [ ] Verify Stellar Expert links work for transaction hashes

## 5. Simulation Scripts

For testing on testnet without real meters:

```bash
# Simulate cooperatives and readings
pnpm simulate

# Run smart meter mock (continuous)
pnpm meter:mock

# Backfill historical readings
pnpm meter:mock:backfill

# Simulate a purchase
pnpm tsx scripts/simulate-purchase.ts
```

## 6. CI/CD Pipeline

The CI workflow (`.github/workflows/ci.yml`) runs on every PR to `main` and `develop`:

- **Web:** lint, type check, API tests, build
- **Contracts:** build, cargo test

The Scout audit (`.github/workflows/scout-audit.yml`) runs on Rust contract changes and blocks PRs on security findings.

Branch policy: only `develop` can PR into `main`.
