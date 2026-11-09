# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-01-15

### Added
- Cooperative factory contract for atomic multi-contract deployment
- DeFindex vault integration (deposit, withdraw, health, stats)
- Super admin dashboard with global stats and certificate pipeline
- Environmental impact calculations (CO2 avoided, trees equivalent)
- Cooperative admin page with generation charts, meter fleet health, and activity feed
- Member management page with allocation tracking
- Smart meter mock script for continuous reading simulation
- Bulk meter readings API endpoint
- Rate limiting (Supabase-backed, per-route configs)
- Audit logging for security-relevant actions
- CSP headers (strict, frame-ancestors none, HSTS)
- IBM Plex Sans brand typography
- Full i18n system (ES/EN) with 200+ translation keys
- Skip-to-content accessibility link
- Error boundary and 404 page
- Route-level loading skeletons (dashboard, certificates, activity, profile, consumption, admin)
- Reusable EmptyState and ConfirmDialog components
- Governance voting mechanism (vote, has_voted, double-vote prevention, events)
- prefers-reduced-motion CSS support
- CONTRIBUTING.md
- LICENSE (Apache-2.0)
- .prettierrc
- VS Code workspace settings and recommended extensions
- CI workflow (lint, type check, tests, build for web + contracts)
- Dependabot configuration

### Changed
- Removed `typescript.ignoreBuildErrors` — all type errors now fail builds
- Rate limiting fails closed (denies requests) instead of failing open when Supabase is unreachable
- Governance contract emits events on proposal creation and vote
- Retire flow now uses confirmation dialog before irreversible on-chain burn

### Fixed
- Fixed 18 TypeScript errors in test mocks and source code
- Fixed supabase proxy type assertion
- Fixed certificates stats route type cast

## [0.2.0] - 2025-12-01

### Added
- Energy distribution contract with multi-sig member registration
- Community governance contract for proposals
- Email + password authentication via Supabase
- Stellar wallet authentication (SEP-0053 challenge-response)
- JWT session management with role-based access control
- Certificate creation, minting, and retirement flow
- Horizon payments integration for activity tracking

## [0.1.0] - 2025-11-15

### Added
- Initial project scaffold (Turborepo + pnpm monorepo)
- Energy token contract (SEP-41 fungible token, 1 token = 1 kWh)
- Next.js 16 + React 19 web dashboard
- Supabase backend integration
- Stellar Testnet deployment
- Featured at Stellar Buenos Aires Hackathon 2025
