# Syncora System Architecture & Concurrency Model

Syncora is designed to solve a classic distributed systems problem: **preventing race conditions and overselling when multiple concurrent users attempt to claim a limited inventory (event seats)**.

---

## 1. High-Level Architecture Overview

```
[ Client: React + Vite ]
       │
       │ HTTP / JSON (Axios + TanStack Query)
       ▼
[ Server: Node.js + Express (ES Modules) ]
  ├── Middleware: CORS, express.json(), Zod Validation, Centralized Error Handling
  ├── Controllers: workshopsController, bookingsController
  ├── Services: workshopsService, bookingsService (Business & Transaction Logic)
       │
       │ Prisma ORM (Connection Pool Singleton)
       ▼
[ Database: PostgreSQL 18 ]
  ├── Tables: "Workshop", "Booking"
  ├── Constraints:
  │     ├── CHECK ("capacity" > 0)
  │     ├── CHECK ("seatsLeft" >= 0)
  │     ├── CHECK ("seatsLeft" <= "capacity")
  │     └── UNIQUE ("workshopId", "studentEmail")
  └── Transaction Engine: Row-Level Exclusive Locks & Write Serialization
```

---

## 2. The Concurrency Problem: Why "Read-Then-Write" Fails

In naive web applications, seat booking is implemented in two non-atomic application steps:

```javascript
// ❌ NAIVE IMPLEMENTATION (VULNERABLE TO RACE CONDITIONS)
const workshop = await db.workshop.findUnique({ where: { id } });
if (workshop.seatsLeft > 0) {
  // TIME OF CHECK TO TIME OF USE (TOCTOU) VULNERABILITY:
  // Another thread executes between this check and the write!
  await db.workshop.update({
    where: { id },
    data: { seatsLeft: workshop.seatsLeft - 1 }
  });
  await db.booking.create({ data: { workshopId, studentName, studentEmail } });
}
```

### The TOCTOU Flaw
If 20 students request the final seat simultaneously:
1. All 20 threads read `workshop.seatsLeft === 1`.
2. All 20 conditions evaluate to `true`.
3. All 20 threads issue decrements.
4. `seatsLeft` drops to `-19` (negative inventory), and 20 tickets are issued for 1 seat!

---

## 3. Syncora's Defense: 4-Layer Concurrency Architecture

### Layer 1: Conditional Atomic Database Update
Instead of reading into Node.js memory and checking locally, Syncora issues an **atomic conditional update** that delegates state verification directly to the PostgreSQL database engine:

```sql
UPDATE "Workshop"
SET "seatsLeft" = "seatsLeft" - 1
WHERE "id" = $1 AND "seatsLeft" > 0;
```

In Prisma, this is executed as:
```javascript
const updateResult = await tx.workshop.updateMany({
  where: {
    id: workshopId,
    seatsLeft: { gt: 0 }
  },
  data: {
    seatsLeft: { decrement: 1 }
  }
});
```

#### Why This Works in PostgreSQL
- PostgreSQL acquires an **exclusive row lock** on the `Workshop` row when processing an `UPDATE`.
- When multiple transactions attempt to update the same row concurrently, PostgreSQL queues them sequentially.
- When each subsequent transaction acquires the lock, it re-evaluates the `WHERE` condition against the newly updated row state.
- Once `seatsLeft` reaches 0, any subsequent transactions evaluate `seatsLeft > 0` as `false`.
- The database returns `affected_rows = 0` (`count === 0`).
- Syncora checks `updateResult.count === 0` and immediately halts with `409 SOLD_OUT`.

---

### Layer 2: ACID Transaction Boundaries
Seat decrement and booking registration are bound together in a single atomic transaction (`prisma.$transaction`):

```javascript
return await prisma.$transaction(async (tx) => {
  // Step 1: Decrement seat atomically
  const result = await tx.workshop.updateMany({
    where: { id: workshopId, seatsLeft: { gt: 0 } },
    data: { seatsLeft: { decrement: 1 } }
  });

  if (result.count === 0) {
    throw new AppError(409, 'SOLD_OUT', 'No seats are available for this workshop.');
  }

  // Step 2: Insert booking record
  const booking = await tx.booking.create({
    data: { workshopId, studentName, studentEmail }
  });

  return booking;
});
```

**Guarantees:**
- **Atomicity:** It is impossible for a seat to be decremented without a corresponding booking record being created.
- **Automatic Rollback:** If any error occurs after the decrement (such as a database disconnection, validation check, or unique constraint violation), the transaction is completely rolled back, immediately restoring the seat.

---

### Layer 3: Compound Unique Constraint for Duplicate Booking Protection
To prevent a single student from booking the same workshop multiple times (or accidentally submitting twice under high network latency), PostgreSQL enforces:

```sql
CREATE UNIQUE INDEX "Booking_workshopId_studentEmail_key" 
ON "Booking"("workshopId", "studentEmail");
```

If a student fires 5 concurrent booking requests:
1. The first request decrements the seat and inserts the booking.
2. The remaining 4 concurrent requests attempt to insert the same `(workshopId, studentEmail)` pair.
3. PostgreSQL throws error `P2002` (Unique constraint violation).
4. The transaction wrapper catches the error and **aborts the transaction**.
5. The seat decrement from Step 1 is rolled back automatically.
6. The centralized error handler maps `P2002` to `409 ALREADY_BOOKED`.

---

### Layer 4: Transactional Cancellation Consistency
When a booking is cancelled:
```javascript
return await prisma.$transaction(async (tx) => {
  const booking = await tx.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found or already cancelled.');
  }

  // 1. Delete booking
  await tx.booking.delete({ where: { id: bookingId } });

  // 2. Increment seatsLeft by exactly 1
  await tx.workshop.update({
    where: { id: booking.workshopId },
    data: { seatsLeft: { increment: 1 } }
  });
});
```
- A seat is restored **only** if the booking record actually existed and was successfully deleted.
- If two cancel requests hit simultaneously for the same `bookingId`, only one can delete the record; the other fails with `404 BOOKING_NOT_FOUND`, preventing duplicate seat inflation.

---

## 4. Frontend Server-State Synchronization (TanStack Query)

Syncora uses TanStack Query v5 to manage server cache invalidation.

```
[ User Action: Click "Confirm Reservation" ]
       │
       ▼
[ useMutation: POST /api/workshops/:id/bookings ]
       │
       ├──> On Success:
       │     ├── Invalidate ['workshops', 'list'] (Updates home page seat counters)
       │     ├── Invalidate ['workshops', 'detail', id] (Updates detail page)
       │     ├── Invalidate ['workshops', 'detail', id, 'bookings'] (Updates attendee roster)
       │     └── Invalidate ['bookings', 'my', email] (Updates My Bookings list)
       │
       └──> On Error (409 SOLD_OUT / ALREADY_BOOKED):
             └── Render accessible alert banner with backend error message
```
No manual state synchronization or error-prone local array splicing is required.
