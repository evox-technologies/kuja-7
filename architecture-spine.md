# Matrimony Platform — Architecture Spine

**Evox Technologies (Pvt) Ltd** · Client: Mr. Abeywickrana · v1.1 · May 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Database Schema](#4-database-schema)
5. [API Design](#5-api-design)
6. [Real-Time (Chat)](#6-real-time-chat)
7. [Authentication Flow](#7-authentication-flow)
8. [File Storage](#8-file-storage)
9. [Payment & Subscriptions](#9-payment--subscriptions)
10. [Background Jobs](#10-background-jobs)
11. [Infrastructure](#11-infrastructure)
12. [Environment Variables](#12-environment-variables)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [Security Checklist](#14-security-checklist)
15. [Scaling Path](#15-scaling-path)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│              Next.js 14 (SSR + CSR hybrid)                  │
│         Deployed on Vercel (free) → DO App Platform         │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│                      CLOUDFLARE                             │
│            DNS · SSL · DDoS · CDN Proxy                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   DigitalOcean Droplet  │  $12/mo · 2vCPU · 2GB RAM
          │  ┌───────────────────┐  │
          │  │  Fastify REST API │  │  Port 3001
          │  ├───────────────────┤  │
          │  │  Socket.IO Server │  │  Port 3002
          │  ├───────────────────┤  │
          │  │   BullMQ Workers  │  │  Background jobs
          │  └───────────────────┘  │
          └────────────┬────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼──────────┐
│  Supabase    │ │   Redis    │ │  DO Spaces    │
│  Auth + PG   │ │  1GB free  │ │  + CDN Edge   │
│  (free tier) │ │  add-on    │ │    $5/mo      │
└──────────────┘ └────────────┘ └───────────────┘
```

**Request Flow**

```
Browser → Cloudflare (SSL/Cache) → Fastify API → Redis Cache
                                              ↓ (cache miss)
                                       Supabase PostgreSQL
                                              ↓
                                   Response → Redis → Browser
```

**Auth Flow** *(direct — bypasses Fastify)*

```
Browser → Supabase Auth SDK → Supabase (login / OTP / 2FA / session refresh)
```

---

## 2. Tech Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Frontend Framework | Next.js | 14 (App Router) | SSR for SEO on profile pages |
| UI Library | React | 18 | Server + client components |
| Styling | Tailwind CSS + shadcn/ui | latest | No runtime CSS overhead |
| Global State | Zustand | 4.x | Lightweight, no boilerplate |
| API Client | Axios + React Query | latest | Request caching, retries |
| Supabase Client | @supabase/ssr | latest | Auth + session management in Next.js |
| Backend Framework | Fastify | 4.x | 2–3× throughput over Express |
| Real-Time | Socket.IO | 4.x | Chat, presence, notifications |
| ORM | Prisma | 5.x | Type-safe queries, migrations |
| Database | Supabase PostgreSQL | 15 | Managed, free tier, same PG interface |
| Cache / Pub-Sub | Redis | 7.x | Response cache, WS adapter |
| Job Queue | BullMQ | 4.x | Email, match jobs, renewals |
| Auth | Supabase Auth | — | Email OTP, phone OTP, TOTP 2FA, sessions |
| File Storage | DO Spaces (S3-compat) | — | Built-in CDN, cheap egress |
| Email | Brevo SMTP | — | 300 emails/day free tier |
| Payments | PayHere | — | LKR-native, no monthly fee |
| DNS / Security | Cloudflare | Free | DDoS, SSL, CDN proxy |
| Hosting | DigitalOcean | — | Predictable pricing |

---

## 3. Directory Structure

```
matrimony/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/               # Login, register, OTP — thin UI only
│   │   │   ├── (dashboard)/          # Protected routes
│   │   │   │   ├── profile/
│   │   │   │   ├── search/
│   │   │   │   ├── matches/
│   │   │   │   ├── chat/
│   │   │   │   └── subscription/
│   │   │   ├── admin/                # Admin panel
│   │   │   └── (public)/             # Landing, about, pricing
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui primitives
│   │   │   ├── profile/
│   │   │   ├── chat/
│   │   │   └── search/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios instance (attaches Supabase JWT)
│   │   │   ├── socket.ts             # Socket.IO client
│   │   │   └── supabase/
│   │   │       ├── client.ts         # Browser client (@supabase/ssr)
│   │   │       └── server.ts         # Server Component client
│   │   ├── middleware.ts             # Session refresh (Supabase)
│   │   └── store/                    # Zustand stores
│   │
│   └── api/                          # Fastify backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── profiles.ts
│       │   │   ├── search.ts
│       │   │   ├── matches.ts
│       │   │   ├── chat.ts
│       │   │   ├── subscriptions.ts
│       │   │   ├── payments.ts
│       │   │   └── admin.ts
│       │   ├── plugins/
│       │   │   ├── auth.ts           # Verifies Supabase JWT (SUPABASE_JWT_SECRET)
│       │   │   ├── redis.ts
│       │   │   ├── prisma.ts
│       │   │   └── s3.ts             # DO Spaces client
│       │   ├── services/
│       │   │   ├── match.service.ts
│       │   │   ├── email.service.ts
│       │   │   └── payment.service.ts
│       │   ├── workers/              # BullMQ workers
│       │   │   ├── email.worker.ts
│       │   │   ├── match.worker.ts
│       │   │   └── subscription.worker.ts
│       │   ├── socket/               # Socket.IO handlers
│       │   │   ├── chat.handler.ts
│       │   │   └── presence.handler.ts
│       │   └── index.ts
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
│
├── packages/
│   └── shared/                       # Shared types (frontend + backend)
│       └── types/
│           ├── user.ts
│           ├── profile.ts
│           └── api.ts
│
├── docker-compose.yml                # Local dev (Redis only)
├── .env.example
└── package.json                      # pnpm workspace root
```

---

## 4. Database Schema

> `auth.users` is owned by Supabase — it is not defined in this schema. `User.id` references the Supabase auth UUID directly.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── USERS ────────────────────────────────────────────────────
// Created automatically on first authenticated API call (upsert).

model User {
  id            String    @id          // Supabase auth.users UUID
  email         String    @unique
  phone         String?   @unique
  role          Role      @default(USER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile           Profile?
  subscription      Subscription?
  sentMessages      Message[]      @relation("SentMessages")
  receivedMessages  Message[]      @relation("ReceivedMessages")
}

enum Role {
  USER
  ADMIN
}

// ── PROFILES ─────────────────────────────────────────────────

model Profile {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  firstName    String
  lastName     String
  dateOfBirth  DateTime
  gender       Gender
  religion     Religion
  caste        String?
  motherTongue String?

  country      String
  province     String
  city         String

  education    String?
  occupation   String?
  annualIncome Int?

  heightCm     Int?
  complexion   String?
  aboutMe      String?

  prefAgeMin   Int?
  prefAgeMax   Int?
  prefReligion Religion?
  prefCountry  String?

  photos       ProfilePhoto[]

  isVisible    Boolean  @default(true)
  completionPct Int     @default(0)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([gender, isVisible])
  @@index([dateOfBirth, gender])
  @@index([religion, country])
}

enum Gender {
  MALE
  FEMALE
}

enum Religion {
  BUDDHIST
  CHRISTIAN
  CATHOLIC
  HINDU
  ISLAM
  OTHER
}

model ProfilePhoto {
  id        String   @id @default(cuid())
  profileId String
  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  url       String
  key       String
  isPrimary Boolean  @default(false)
  createdAt DateTime @default(now())
}

// ── MATCHES ──────────────────────────────────────────────────

model Match {
  id         String      @id @default(cuid())
  senderId   String
  sender     User        @relation("SentMatches", fields: [senderId], references: [id])
  receiverId String
  receiver   User        @relation("ReceivedMatches", fields: [receiverId], references: [id])
  status     MatchStatus @default(PENDING)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  @@unique([senderId, receiverId])
}

enum MatchStatus {
  PENDING
  ACCEPTED
  REJECTED
  BLOCKED
}

// ── CHAT ─────────────────────────────────────────────────────

model Conversation {
  id             String    @id @default(cuid())
  participant1Id String
  participant2Id String
  participant1   User      @relation("ConvParticipant1", fields: [participant1Id], references: [id])
  participant2   User      @relation("ConvParticipant2", fields: [participant2Id], references: [id])
  createdAt      DateTime  @default(now())
  messages       Message[]

  @@unique([participant1Id, participant2Id])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  senderId       String
  sender         User         @relation("SentMessages", fields: [senderId], references: [id])
  receiverId     String
  receiver       User         @relation("ReceivedMessages", fields: [receiverId], references: [id])
  content        String
  isRead         Boolean      @default(false)
  createdAt      DateTime     @default(now())
}

// ── SUBSCRIPTIONS ────────────────────────────────────────────

model Subscription {
  id        String             @id @default(cuid())
  userId    String             @unique
  user      User               @relation(fields: [userId], references: [id])
  plan      SubscriptionPlan
  status    SubscriptionStatus @default(ACTIVE)
  startDate DateTime
  endDate   DateTime
  payments  Payment[]
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
}

enum SubscriptionPlan {
  FREE
  BASIC
  PREMIUM
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
}

model Payment {
  id             String        @id @default(cuid())
  subscriptionId String
  subscription   Subscription  @relation(fields: [subscriptionId], references: [id])
  amount         Decimal       @db.Decimal(10, 2)
  currency       String        @default("LKR")
  status         PaymentStatus
  payhereOrderId String?       @unique
  createdAt      DateTime      @default(now())
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}
```

---

## 5. API Design

**Base URL:** `https://api.yourdomain.com/v1`

> All authentication (register, login, OTP, 2FA, password reset, session refresh) is handled directly by the Supabase Auth SDK on the frontend. No `/auth/*` routes exist on the Fastify API.

### User Sync

On every authenticated request, Fastify upserts the `User` row from the Supabase JWT — no separate registration webhook needed.

```typescript
// plugins/auth.ts — runs before every protected route
const { sub, email } = req.user; // decoded from Supabase JWT
await prisma.user.upsert({
  where:  { id: sub },
  create: { id: sub, email },
  update: {},
});
```

### Profile Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/profiles/me` | Get own profile |
| `PUT` | `/profiles/me` | Update own profile |
| `POST` | `/profiles/me/photos` | Upload photo to DO Spaces (multipart) |
| `DELETE` | `/profiles/me/photos/:id` | Delete photo |
| `GET` | `/profiles/:id` | View another profile (auth required) |

### Search & Matching

| Method | Path | Description |
|---|---|---|
| `GET` | `/search` | Search with filters: `?gender=FEMALE&ageMin=22&ageMax=30&religion=BUDDHIST&country=LK&page=1&limit=20` |
| `POST` | `/matches` | Send interest to a profile |
| `GET` | `/matches` | List own matches (sent + received) |
| `PUT` | `/matches/:id` | Accept / reject / block |

### Chat

| Method | Path | Description |
|---|---|---|
| `GET` | `/conversations` | List conversations |
| `GET` | `/conversations/:id/messages` | Paginated message history |

> Real-time messaging is handled via Socket.IO — REST is only for history load.

### Subscriptions & Payments

| Method | Path | Description |
|---|---|---|
| `GET` | `/subscriptions/plans` | List available plans + pricing |
| `POST` | `/subscriptions` | Initiate subscription (returns PayHere payload) |
| `GET` | `/subscriptions/me` | Get current subscription |
| `POST` | `/payments/webhook` | PayHere webhook (server-to-server, verify hash) |

### Admin

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/users` | List users (paginated, filterable) |
| `PUT` | `/admin/users/:id` | Activate / deactivate / change role |
| `GET` | `/admin/reports` | Platform stats (registrations, revenue) |
| `DELETE` | `/admin/profiles/:id` | Remove violating profile |

### Response Format

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 240
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "Profile does not exist or is not visible."
  }
}
```

---

## 6. Real-Time (Chat)

### Events — Client → Server

| Event | Payload |
|---|---|
| `connection` | Authenticate via Supabase JWT query param |
| `chat:send` | `{ conversationId, receiverId, content }` |
| `chat:typing` | `{ conversationId }` |
| `chat:read` | `{ messageId }` |
| `presence:ping` | Heartbeat every 30s |

### Events — Server → Client

| Event | Description |
|---|---|
| `chat:message` | New message received |
| `chat:typing` | Remote user is typing |
| `chat:read_receipt` | Message marked as read |
| `presence:online` | User came online |
| `presence:offline` | User went offline |
| `notification:match` | New match interest received |

### Connection Auth

```typescript
// Client — pass Supabase session token
const { data: { session } } = await supabase.auth.getSession();
const socket = io(WS_URL, {
  auth: { token: session.access_token }
});

// Server middleware — verify Supabase JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const payload = verifySupabaseToken(token); // uses SUPABASE_JWT_SECRET
  if (!payload) return next(new Error("Unauthorized"));
  socket.data.userId = payload.sub;
  next();
});
```

---

## 7. Authentication Flow

All auth is handled by the Supabase Auth SDK on the frontend. Fastify is never involved in the auth handshake.

### Registration

```
Client (Supabase SDK)              Supabase Auth
  │                                    │
  ├─ supabase.auth.signUp() ──────────►│
  │                                    ├── Create auth.users record
  │                                    ├── Send verification email (built-in)
  │◄── { user, session: null } ────────┤
  │                                    │
  ├─ supabase.auth.verifyOtp() ───────►│
  │                                    ├── Verify email OTP
  │◄── { user, session } ──────────────┤
  │                                    │
  ├─ POST /profiles/me ───────────────────────────────────────►
  │   Authorization: Bearer <access_token>                     │
  │                                       Fastify upserts User │
  │◄───────────────────────────────────────────────────────────┘
```

### Login with 2FA (TOTP)

```
Client (Supabase SDK)              Supabase Auth
  │                                    │
  ├─ supabase.auth.signInWithPassword()►│
  │◄── { nextStep: 'MFA_REQUIRED' } ───┤
  │                                    │
  ├─ supabase.auth.mfa                 │
  │     .challengeAndVerify() ────────►│
  │◄── { session } ────────────────────┤
```

### Phone OTP Login

```
├─ supabase.auth.signInWithOtp({ phone }) ─────────────────►
├─ supabase.auth.verifyOtp({ phone, token, type: 'sms' }) ─►
│◄── { session } ───────────────────────────────────────────
```

### 2FA Enrollment (from user settings)

```typescript
// Generate QR code for authenticator app
const { data } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
// data.totp.qr_code → display to user

// Confirm first code to activate 2FA
await supabase.auth.mfa.challengeAndVerify({ factorId, code });
```

### Token Strategy

| Token | TTL | Managed by |
|---|---|---|
| Access Token | 1 hour | Supabase (verified in Fastify via `SUPABASE_JWT_SECRET`) |
| Refresh Token | 7 days | Supabase (`httpOnly` cookie via `@supabase/ssr`) |
| Session Refresh | Automatic | Next.js middleware calls `supabase.auth.getUser()` on every request |

---

## 8. File Storage

### Upload Flow

```
Client → POST /profiles/me/photos (multipart)
           │
           ▼
       Fastify validates (type: jpg/png/webp, max 5MB)
           │
           ▼
       Sharp: resize → 800×800 max, convert to webp
           │
           ▼
       Upload to DO Spaces
       Key: profiles/{userId}/{uuid}.webp
       ACL: private
           │
           ▼
       Save URL + key in ProfilePhoto table
           │
           ▼
       Return signed URL (24h expiry) to client
```

### Photo URL Strategy

- Stored with **private ACL** in DO Spaces
- Served via **signed URLs** (24h expiry) — prevents hotlinking
- On deletion, BullMQ `storage.delete-photo` job removes from Spaces and invalidates CDN cache
- CDN edge caches public assets (landing page images, avatars after first request)

---

## 9. Payment & Subscriptions

### Plans

| Plan | Price (LKR) | Duration | Features |
|---|---|---|---|
| Free | 0 | — | 5 interests/month, basic search |
| Basic | 990 | 1 month | Unlimited interests, chat unlocked |
| Premium | 2,490 | 3 months | All features + profile boost + read receipts |

### PayHere Integration Flow

```
1. Client clicks Subscribe → POST /subscriptions { plan }
2. API generates PayHere payload + MD5 hash
3. Client redirects to PayHere checkout page
4. User completes payment on PayHere
5. PayHere hits POST /payments/webhook (server-to-server)
6. API verifies webhook hash + payhereOrderId uniqueness (idempotency)
7. API updates Subscription status
8. BullMQ queues confirmation email to user
```

### Webhook Verification

```typescript
const hash = md5(
  merchant_id +
  order_id +
  amount +
  currency +
  status_code +
  md5(merchant_secret).toUpperCase()
).toUpperCase();

if (hash !== received_hash) throw new Error("Invalid webhook");

// Idempotency guard
const existing = await prisma.payment.findUnique({
  where: { payhereOrderId: order_id }
});
if (existing) return; // already processed
```

---

## 10. Background Jobs

Managed by **BullMQ** backed by Redis.

| Queue | Job | Trigger | Action |
|---|---|---|---|
| `email` | `match-notification` | New match interest | Email + push notify |
| `email` | `subscription-receipt` | Payment success | Send receipt email |
| `email` | `subscription-expiry` | 3 days before expiry | Renewal reminder |
| `matches` | `suggest-matches` | Daily cron 08:00 | Run match algorithm |
| `subscriptions` | `expire-subscriptions` | Hourly cron | Mark expired plans |
| `storage` | `delete-photo` | Profile photo removed | Delete from DO Spaces + invalidate CDN |

> OTP and auth emails are handled by Supabase — no auth-related email jobs needed.

### Match Algorithm (scoring)

```
score = 0
if preferredReligion matches → +30
if preferredAgeRange matches → +25
if sameCountry              → +20
if sameProvince             → +15
if educationLevel compatible → +10
```

---

## 11. Infrastructure

### DigitalOcean Resources

| Resource | Spec | Cost/mo |
|---|---|---|
| Droplet | 2 vCPU · 2 GB RAM · 60 GB SSD | $12 |
| Spaces + CDN | 250 GB storage · 1 TB transfer | $5 |
| Redis | 1 GB free add-on (with Droplet) | $0 |
| **Total** | | **$17** |

### Supabase (Free Tier)

| Resource | Limit | Notes |
|---|---|---|
| Database | 500 MB | Prisma connects via `DATABASE_URL` |
| Auth | 50,000 MAU | Email OTP, phone OTP, TOTP 2FA included |
| Edge Functions | 500K invocations/mo | Not used — Fastify handles all logic |
| **Total** | | **$0** |

### Client-Borne Third-Party Costs

| Service | Provider | Estimated Cost |
|---|---|---|
| Domain | Cloudflare Registrar | ~$12/yr |
| SMS OTP | Supabase (via Twilio) | Pay-per-use after free tier |
| PayHere fees | PayHere | ~2.5% per transaction |
| Email (scale) | Brevo Starter | $25/mo if >300 emails/day |

### Docker Compose (Local Dev)

Local auth and database are provided by the Supabase CLI. Docker Compose only manages Redis.

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### Local Supabase Setup

```bash
# Start local Supabase stack (PostgreSQL + Auth + Studio dashboard)
npx supabase start

# Apply Prisma migrations against local Supabase PostgreSQL
npx prisma migrate dev

# Stop local Supabase
npx supabase stop
```

---

## 12. Environment Variables

```bash
# .env.example

# App
NODE_ENV=production
PORT=3001
WS_PORT=3002
FRONTEND_URL=https://yourdomain.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # safe to expose to browser
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # server-side only — never expose to client
SUPABASE_JWT_SECRET=                          # Supabase dashboard → Settings → API

# Database (Supabase PostgreSQL — used by Prisma)
DATABASE_URL=postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres

# Redis
REDIS_URL=redis://localhost:6379

# DO Spaces
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com
DO_SPACES_BUCKET=matrimony-assets
DO_SPACES_CDN_URL=https://matrimony-assets.sgp1.cdn.digitaloceanspaces.com

# Email — Brevo (non-auth emails: match notifications, receipts)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=
BREVO_SMTP_PASS=
EMAIL_FROM=noreply@yourdomain.com

# PayHere
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
PAYHERE_MODE=sandbox    # → live in production
```

---

## 13. CI/CD Pipeline

```
Developer pushes to feature branch
        │
        ▼
GitHub Actions — PR checks
  ├── ESLint + TypeScript typecheck
  ├── Unit tests (Vitest)
  └── Prisma schema validation

Merge to main
        │
        ▼
GitHub Actions — Deploy
  ├── Build Next.js → deploy to Vercel (auto)
  ├── Build API Docker image
  ├── SSH into DO Droplet
  ├── docker pull + docker-compose up -d
  └── prisma migrate deploy
```

### Recommended Branches

| Branch | Purpose |
|---|---|
| `main` | Production |
| `staging` | Staging environment (optional) |
| `feature/*` | Feature work |
| `fix/*` | Bug fixes |

---

## 14. Security Checklist

- [x] HTTPS enforced everywhere via Cloudflare (HSTS enabled)
- [x] Passwords and sessions fully managed by Supabase Auth (bcrypt + secure token rotation internally)
- [x] JWT access tokens verified in Fastify using `SUPABASE_JWT_SECRET`
- [x] Session cookies (`httpOnly` + `Secure` + `SameSite=Strict`) managed by `@supabase/ssr` middleware
- [x] `SUPABASE_SERVICE_ROLE_KEY` never sent to the browser — server-side only
- [x] CSRF protection on all state-mutating endpoints
- [x] Rate limiting on Supabase Auth configurable via Supabase dashboard
- [x] Rate limiting on Fastify routes (100 req/min general, 10 req/min for sensitive routes)
- [x] Input validation with JSON Schema on every Fastify route
- [x] DO Spaces buckets private by default — files served via signed URLs
- [x] CDN cache invalidated on photo deletion
- [x] PayHere webhook hash verified server-side before processing
- [x] PayHere webhook idempotency enforced via `payhereOrderId` uniqueness
- [x] Admin routes guarded by `role: ADMIN` middleware
- [x] Prisma parameterised queries — no raw SQL injection risk
- [x] Privacy Policy + Terms of Service pages live before launch
- [x] User data deletion flow implemented (deletes Supabase auth user + cascades to all app data)

---

## 15. Scaling Path

Scale in this order — no re-architecture needed at each step.

### Stage 1 · Launch (0–500 users) — $17/mo
- Current setup as-is
- Single Droplet
- Supabase free tier comfortably handles this range

### Stage 2 · Growth (500–5,000 users)
- Upgrade Droplet: 4 vCPU / 8 GB RAM ($48/mo)
- Upgrade to Supabase Pro ($25/mo) for higher DB limits and daily backups
- Upgrade Brevo plan for higher email volume

### Stage 3 · Scale (5,000–20,000 users)
- Separate Socket.IO to dedicated Droplet
- Redis Cluster for Socket.IO pub/sub adapter
- Add Cloudflare R2 or CDN rules for static assets
- Enable Supavisor connection pooling (built into Supabase Pro)
- Optionally self-host Supabase on a dedicated Droplet for data sovereignty

### Stage 4 · High Scale (20,000+ users)
- Migrate to DO Kubernetes (DOKS)
- Horizontal pod scaling for API + WebSocket servers
- Elasticsearch for advanced profile search
- Separate match engine as a microservice

---

*Document owned by Evox Technologies (Pvt) Ltd. Internal use only. Last updated: May 2026*
