# GreenToken

> Renewable energy cooperatives deserve proof. GreenToken puts it on-chain.

[![Live Demo](https://img.shields.io/badge/Live_Demo-green--token.vercel.app-00537A?style=for-the-badge)](https://be-energy-six.vercel.app)
[![Network](https://img.shields.io/badge/Stellar-Testnet-FFD500?style=for-the-badge&logo=stellar)](https://stellar.org)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge)](LICENSE)

---

## The Problem

Renewable energy cooperatives generate clean energy every day — but they can't prove it.

- No standardized way to record generation
- No verifiable certificate that travels with the energy claim
- No access to ESG markets, carbon offsetting programs, or institutional buyers
- Manual, paper-based processes that nobody trusts

Meanwhile, companies and funds with ESG commitments are actively looking for verifiable renewable energy claims and can't find them.

**The gap between cooperatives and buyers is a trust gap. GreenToken closes it.**

---

## The Solution

GreenToken is a cooperative management dashboard and on-chain certification infrastructure built on **Stellar**.

Every kWh registered by a cooperative becomes a **proto-certificate**: a verifiable, on-chain claim tied to a real meter, a real cooperative, and a real time period.

```
Smart meter sends reading → POST /api/meters/readings
         ↓
GreenToken validates & mints token on Stellar (1 token = 1 kWh)
         ↓
Certificate is assigned to cooperative members
         ↓
External buyer (company / ESG fund) purchases certificate
         ↓
Buyer retires certificate on-chain (verifiable burn)
         ↓
Permanent, auditable proof on Stellar blockchain
```

No intermediaries. No PDFs. No trust required — the chain is the proof.

---

## How It Works

### For Cooperatives

```
1. Register cooperative on GreenToken
2. Add smart meters (physical IoT devices)
3. Meters send generation readings automatically via API
4. GreenToken mints proto-certificates on Stellar
5. Manage members, view generation stats, track certificates
```

### For Buyers

```
1. Browse available certificates by cooperative / technology / period
2. Purchase certificates (linked to specific on-chain tokens)
3. Retire certificate → recorded permanently on Stellar
4. Receive auditable proof of renewable energy support
```

### Authentication

GreenToken supports two access methods — no setup required to try:

**Email + Password** (for admins, buyers, internal team)
```
/login → Supabase auth → JWT issued → Stellar wallet auto-assigned → /dashboard
```
> Try it: `demo@greentoken.coop` / `Demo2026!`

**Stellar Wallet** (for cooperatives with Freighter / xBull / Lobstr)
```
Connect wallet → Server issues challenge → User signs with private key
→ Signature verified on-chain → JWT issued → /dashboard
```

Both methods issue the same JWT and give full platform access. Wallet users can additionally sign on-chain transactions.

---

## Stellar Integration

This is not a wrapper. Stellar is load-bearing infrastructure:

| What | How |
|------|-----|
| **Certificate issuance** | Mint SEP-41 tokens directly on Stellar Testnet |
| **Certificate retirement** | On-chain burn, permanently auditable |
| **Member allocation** | `energy_distribution` contract splits tokens by participation % |
| **Governance** | `community_governance` contract for cooperative proposals and voting |
| **Wallet auth** | Challenge-response signature verification (no gas, no tx) |
| **Token standard** | SEP-41 (fungible) with OpenZeppelin Stellar Pausable + Upgradeable |

### Smart Contracts

Four contracts built with **OpenZeppelin Stellar Contracts v0.5.1** + **Soroban SDK 23.1.0**:

| Contract | Purpose |
|----------|---------|
| `energy_token` | SEP-41 fungible token — 1 token = 1 kWh certified. Access control, pausable, upgradeable |
| `energy_distribution` | Member allocation with multi-sig registration, percentage-based token distribution |
| `community_governance` | DAO-style proposals with on-chain voting (for/against, double-vote prevention) |
| `cooperative_factory` | Atomic deployment of all contracts per cooperative in a single transaction |

### Deployed Contracts — Stellar Testnet

| Contract | Address | Purpose |
|----------|---------|---------|
| `energy_token` | [`CCYOVOFD...MRPBA6`](https://stellar.expert/explorer/testnet/contract/CCYOVOFDJ5BVBSI6HADLWETTUF3BU423MEAWBSBWV2X5UVNKSJMRPBA6) | SEP-41 token — 1 token = 1 kWh certified |
| `energy_distribution` | [`CBTDPLFN...NX2UDZ`](https://stellar.expert/explorer/testnet/contract/CBTDPLFNFGWVOD4HXDKW4EH5L3D2YGOY5CWTFCJM5TEWFL4VQTNX2UDZ) | Distributes certificates to members |
| `community_governance` | [`CCH2EXXN...BJD6YI`](https://stellar.expert/explorer/testnet/contract/CCH2EXXNSDW2BAKBIPFAG6CCZS6LV4VJFUP2CZZCW5LEY4JOAXBJD6YI) | Cooperative on-chain governance |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Stellar Testnet (Soroban smart contracts) |
| Smart Contracts | Rust + OpenZeppelin Stellar v0.5.1 |
| Token Standard | SEP-41 fungible token |
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (55+ components) |
| Auth | Supabase + JWT + Stellar wallet signature (SEP-0053) |
| Wallet Support | Freighter, xBull, Lobstr (via Stellar Wallets Kit) |
| Backend | Next.js API Routes (30+ endpoints) + Supabase |
| Deployment | Vercel |
| Monorepo | Turborepo + pnpm |
| i18n | Full ES/EN translation system (200+ keys) |
| Security | CSP headers, rate limiting (Supabase-backed), audit logging, role-based access control |

---

## Project Structure

```
green-token/
├── apps/
│   ├── contracts/               # Soroban smart contracts (Rust)
│   │   ├── energy_token/        # SEP-41 certificate token
│   │   ├── energy_distribution/ # Member allocation logic
│   │   ├── community_governance/# DAO-style proposals + voting
│   │   └── cooperative_factory/ # Atomic multi-contract deployment
│   └── web/                     # Next.js dashboard
│       ├── app/                 # App Router pages + API routes
│       ├── components/          # UI components (shadcn/ui, shared, modals)
│       ├── hooks/               # 16 custom React hooks
│       └── lib/                 # Auth, wallet, Stellar utils, i18n, validation
├── packages/
│   └── stellar/                 # Shared wallet & config utilities
├── scripts/                     # DB setup, testnet simulation, smart meter mock
└── tooling/
    └── issues/                  # GitHub issue templates
```

---

## Quick Start

```bash
git clone https://github.com/greentoken-master/greentoken.git
cd green-token
pnpm install
pnpm dev
```

Frontend runs at `http://localhost:3000`.

See [DEPLOYMENT.md](DEPLOYMENT.md) for full setup instructions including env vars, database, and contract deployment.

**Build and test contracts:**
```bash
cd apps/contracts
stellar contract build
cargo test
```

**Run web tests:**
```bash
pnpm test:api
```

---

## Roadmap

| Level | What | Status |
|-------|------|--------|
| 1 — Internal registry | Token = verifiable production record | ✅ Live on Testnet |
| 2 — Verified certification | IoT oracles + independent meter validation | 🔄 Next |
| 3 — Recognized standard | Integration with I-REC, Energy Web, TIGR | 🔮 Future |

---

## Planned Integrations

GreenToken is designed to plug into Stellar's growing DeFi and payments ecosystem:

| Integration | What it unlocks |
|-------------|-----------------|
| **[DeFindex](https://defindex.io)** | Cooperatives earn yield on certificate proceeds held in vaults |
| **[Blend Protocol](https://blend.capital)** | Use certificates as collateral for credit lines |
| **[Soroswap](https://soroswap.finance)** | AMM liquidity pool for certificate tokens — enables price discovery |
| **USDC (Circle)** | Stablecoin payments — buyers pay in USDC, cooperatives receive USDC |
| **[Aquarius](https://aquarius.network)** | Liquidity incentives for GRTKN/USDC pairs |
| **Fiat On/Off Ramp (SEP-24)** | Cooperatives receive payments in local fiat (ARS, COP, BRL) via Stellar anchors |
| **[Stellar Turrets](https://tss.stellar.org)** | Automated certificate minting triggered by verified IoT meter readings |

---

## Documentation

- [API Reference](API.md) — All 30+ API endpoints documented
- [Deployment Guide](DEPLOYMENT.md) — Local setup, contract deployment, production
- [Contributing Guide](CONTRIBUTING.md) — Coding standards, commit conventions, PR process
- [Changelog](CHANGELOG.md) — Version history

---

## Contributing

PRs welcome. Branch off `develop`, keep commits focused.

```bash
git checkout develop
git checkout -b feat/your-feature
pnpm install && pnpm dev
# Open PR to develop
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## License

Apache-2.0 — see [LICENSE](LICENSE)
