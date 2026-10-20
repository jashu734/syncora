# Syncora — Concurrency-Safe Workshop & Event Booking System

Syncora is a full-stack web platform built for university campuses to discover workshops, inspect real-time seat availability, and guarantee **100% race-condition-proof reservations**. It demonstrates PostgreSQL ACID transactions, atomic conditional updates, database row locking, centralized error handling, and TanStack Query state synchronization.

---

## 🌟 Key Features

- **Concurrency-Safe Seat Reservation:** Guarantees zero overselling when multiple students attempt to book the last remaining seats at the exact same millisecond.
- **Atomic Conditional Updates:** Employs `UPDATE "Workshop" SET "seatsLeft" = "seatsLeft" - 1 WHERE id = $1 AND "seatsLeft" > 0` to let PostgreSQL handle concurrency at the database row level.
- **ACID Transaction Boundaries:** Binds seat decrement and student booking creation within a single transaction; rollbacks automatically restore seats if duplicate or database errors occur.
- **Duplicate Booking Prevention:** PostgreSQL compound unique constraint `@@unique([workshopId, studentEmail])` prevents students from registering multiple times.
- **Transactional Cancellation:** Deletes booking and restores seat count in one atomic operation with double-cancellation guards.
- **Real-Time Client Synchronization:** TanStack Query invalidation updates available seat badges and attendee rosters immediately after mutations.
- **Automated Concurrency Load Testing:** Built-in test script dispatches 20 simultaneous booking requests using `Promise.all` to verify that a 5-seat workshop accepts exactly 5 bookings and rejects 15 with `409 SOLD_OUT`.

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js (v24 LTS / ES Modules)
- **Framework:** Express.js 4
- **ORM:** Prisma ORM 6
- **Database:** PostgreSQL 18
- **Validation:** Zod
- **Testing:** Node.js Native Test Runner (`node:test`, `node:assert`), Supertest

### Frontend
- **Framework:** React 19 with Vite 6
- **Routing:** React Router 7
- **Server State:** TanStack Query v5
- **HTTP Client:** Axios
- **Iconography:** Lucide React
- **Styling:** Custom Vanilla CSS Design System with accessible dark palette
- **Testing:** Vitest, React Testing Library, JSDOM

---

## 📁 Repository Structure

```
syncora/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── WorkshopCard.jsx
│   │   │   ├── BookingForm.jsx
│   │   │   ├── BookingList.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   └── ErrorMessage.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── WorkshopDetailsPage.jsx
│   │   │   ├── MyBookingsPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── features/
│   │   │   └── workshops/
│   │   │       ├── workshops.keys.js
│   │   │       ├── workshops.queries.js
│   │   │       └── workshops.mutations.js
│   │   ├── services/
│   │   │   ├── apiClient.js
│   │   │   └── workshops.service.js
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── test/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.development
│   ├── .env.example
│   └── package.json
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   ├── notFound.js
│   │   │   └── validateRequest.js
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── bookingsService.js
│   │   │   └── workshopsService.js
│   │   ├── utils/
│   │   │   ├── AppError.js
│   │   │   └── asyncHandler.js
│   │   ├── app.js
│   │   ├── prisma.js
│   │   └── server.js
│   ├── scripts/
│   │   └── loadTest.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── TESTING.md
│   └── DEMO_SCRIPT.md
├── BUILD_STATUS.md
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** >= 18 (Tested on Node.js v24)
- **PostgreSQL** 14+ (Tested on PostgreSQL 18)
- **Git**

### 2. Database Setup
Ensure PostgreSQL is running on port 5432 and create the `syncora` database:
```sql
CREATE DATABASE syncora;
```

### 3. Environment Configuration
Backend (`server/.env`):
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/syncora?schema=public"
```

Frontend (`client/.env.development`):
```env
VITE_API_URL=http://localhost:3001
```

### 4. Installation & Database Migration
From the repository root:
```bash
# Install dependencies for both server and client
cd server && npm install
cd ../client && npm install
cd ..

# Run Prisma database migrations and generate Prisma Client
npm run prisma:migrate

# Seed development workshops (includes 5-seat workshop for concurrency testing)
npm run prisma:seed
```

---

## 💻 Running the Application

### Start the Backend (Port 3001)
```bash
npm run dev:backend
# Or: cd server && npm run dev
```

### Start the Frontend (Port 5173)
```bash
npm run dev:frontend
# Or: cd client && npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🧪 Testing & Verification

### Automated Test Suites
Run all backend integration tests and frontend Vitest component tests:
```bash
npm run test
```

- **Backend tests:** 12 tests covering `/health`, workshop retrieval, validation, successful booking, duplicate booking prevention, sold out handling, and cancellation seat restoration.
- **Frontend tests:** 6 tests covering workshop cards, availability badges, booking form validation, and sold-out states.

### Concurrency Load Test
Execute the automated concurrency test against the 5-seat workshop:
```bash
npm run load-test
```
Dispatches 20 parallel booking requests via `Promise.all`:
- **5 requests succeed** (`201 Created`)
- **15 requests reject** (`409 SOLD_OUT`)
- **0 errors** (`500`)
- **Final seatsLeft = 0**, **Committed DB rows = 5**

---

## 📖 Detailed Documentation

- [API Specification (docs/API.md)](docs/API.md) — Complete endpoint reference, status codes, and JSON schemas.
- [Architecture & Concurrency Model (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md) — In-depth breakdown of row locks, transactions, and race-condition defenses.
- [Testing & Concurrency Demonstration Guide (docs/TESTING.md)](docs/TESTING.md) — How to reproduce and verify the load test results.
- [Faculty Presentation Script (docs/DEMO_SCRIPT.md)](docs/DEMO_SCRIPT.md) — 2–3 minute speaking script and presentation guide for evaluation committees.

---

## 🔒 Security Scope & Academic MVP Limitations

1. **Authentication:** This academic demonstration does not implement full student login/JWT sessions. Email lookup and cancellation are publicly accessible for evaluation and load testing purposes. In production, JWT authorization and student identity verification must guard all booking and cancellation endpoints.
2. **Distributed Architecture:** Single-database PostgreSQL row-locking handles high-concurrency requests safely on single-database clusters. For multi-datacenter horizontally partitioned architectures, a distributed lock manager (e.g. Redis Redlock) or message-queue ordering (e.g. Apache Kafka / RabbitMQ) should be layered in front.

---

## 📝 License
MIT License. Created for academic and demonstration purposes.
