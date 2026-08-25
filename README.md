# FractionalRWA Backend

Production-grade Node.js/Express backend for **TrueFraction** — a fractional real-world asset (RWA) tokenisation platform built on the Sonic testnet using the ERC-3643 compliance standard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose |
| Blockchain | ethers.js v6 · Sonic testnet |
| IPFS | Pinata |
| KYC | Blockpass webhook |

---

## Project Structure

```
src/
├── index.js              Entry point + graceful shutdown
├── app.js                App class: DB + middleware + route bootstrap
├── config/
│   ├── env.js            Validated env vars (envalid)
│   └── database.js       Mongoose connect / disconnect
├── core/
│   ├── BaseController.js Shared HTTP response helpers
│   └── RouteLoader.js    Auto-discovers modules/*/routes.js
├── entities/             Mongoose Models / Schemas
│   ├── Property.js
│   └── User.js
├── middleware/
│   └── errorHandler.js   Global Express error handler
├── modules/
│   ├── properties/       Property CRUD + IPFS upload domain
│   │   ├── Controller.js
│   │   ├── Service.js
│   │   ├── Validator.js
│   │   └── routes.js
│   └── users/            User management + Blockpass KYC domain
│       ├── Controller.js
│       ├── Service.js
│       ├── Validator.js
│       └── routes.js
└── utils/
    ├── AppError.js       Custom error class with HTTP status
    ├── ipfs.util.js      Pinata file / JSON uploader
    └── ethers.util.js    Provider + deployer wallet singleton
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.example .env

# 3. Start in development (auto-reloads)
npm run dev

# 4. Start in production
npm start
```

---

## API Routes

All routes are prefixed `/api/{module}` and auto-loaded from `src/modules/`.

### Properties — `/api/properties`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/nftUpload` | Upload NFT image to IPFS |
| POST | `/metadataUpload` | Upload JSON metadata to IPFS |
| POST | `/addProperty` | Add a new property |
| GET | `/getOwnerProperty?ownerAddress=0x...` | Fetch owner's properties |
| GET | `/marketPlace/getAllPropertiesSummary` | Marketplace listing |
| GET | `/marketPlace/getPropertyById/:id` | Property detail |

### Users — `/api/users`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/addnewUser` | Create a user |
| GET | `/fetchUser/:refId` | Fetch user by Blockpass refId |
| POST | `/blockpass-webhook` | Blockpass KYC webhook |
