# Contributing to GreenToken

Thanks for your interest in contributing. This guide covers the essentials.

## Quick Start

```bash
git clone https://github.com/BuenDia-Builders/green-token.git
cd green-token
pnpm install
pnpm dev
```

Frontend runs at `http://localhost:3000`.

## Prerequisites

- Node 22 (see `.nvmrc`)
- pnpm 9.15.0+
- Rust 1.89.0+ (for smart contracts, see `apps/contracts/rust-toolchain.toml`)
- Stellar CLI (for contract deployment)

## Project Structure

```
apps/
  contracts/    Soroban smart contracts (Rust)
  web/          Next.js 16 + React 19 dashboard
packages/
  stellar/      Shared Stellar wallet & config utilities
tooling/
  issues/       GitHub issue generation scripts
```

## Branching

- Branch off `develop` for all features and fixes
- `main` only accepts PRs from `develop` (enforced by CI)
- Use descriptive branch names: `feat/cert-filters`, `fix/mint-retry`, `docs/api-guide`

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add certificate retirement confirmation dialog
fix: prevent duplicate mint on testnet timeout
docs: add API documentation for certificates endpoints
refactor: extract mint logic into shared utility
test: add E2E tests for wallet auth flow
chore: update dependencies
```

## Code Style

- Formatting is enforced by Prettier (`.prettierrc`)
- Lint with `pnpm lint` before pushing
- TypeScript strict mode is enabled — fix all type errors
- Do not use `// @ts-ignore` or `// @ts-expect-error` without a comment explaining why

## Smart Contracts

```bash
cd apps/contracts
cargo test              # Run all contract tests
cargo build --release   # Build WASM
```

- All contracts use `#![no_std]` — no standard library
- Use OpenZeppelin Stellar contracts for access control, pausable, and upgradeable patterns
- Write tests for every new function and edge case
- Snapshot tests are in `test_snapshots/` — run `cargo test` to regenerate

## Web App

```bash
cd apps/web
pnpm dev          # Dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm test:api    # Run Vitest API tests
```

### UI Conventions

- Use shadcn/ui components from `components/ui/` — don't install new UI libraries
- Use Tailwind CSS v4 utilities — avoid inline styles
- Use Lucide icons (1.5px stroke)
- Follow the brand design system in `globals.css`
- Add `loading.tsx` skeletons for data-heavy pages
- Add `error.tsx` boundaries for route segments that fetch data

### API Routes

- Validate all request bodies with Zod schemas (`lib/validation/schemas.ts`)
- Use `requireAuth`, `requireAdmin`, `requireSuperAdmin` from `lib/auth/middleware`
- Apply rate limiting with `checkRateLimit`
- Log security-relevant actions with `auditLog`

### i18n

- All user-facing strings go through the i18n system (`lib/i18n-context.tsx`)
- Add keys to both `es` and `en` translation objects
- Use `t("key")` in components, never hardcoded strings

## Testing

- API routes: Vitest tests in `__tests__/api/`
- Smart contracts: `cargo test` with snapshot validation
- Run tests before pushing: `pnpm test:api` and `cargo test`

## Pull Requests

1. Create a branch from `develop`
2. Write clear commit messages (Conventional Commits)
3. Ensure `pnpm lint` and `pnpm build` pass
4. Ensure all tests pass
5. Reference any related issues in the PR description
6. Keep PRs focused — one feature or fix per PR

## Environment Variables

Copy `apps/web/.env.example` to `.env.local` and fill in your values. You need:

- Supabase project URL and service role key
- JWT secret (any random 32+ char string)
- Minter Stellar secret key (testnet)
- Contract addresses (from deployment)

## Questions

Open a GitHub issue or discussion. We're friendly.
