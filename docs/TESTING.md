# Syncora Automated Testing & Concurrency Load Test Guide

This guide details how to verify Syncora's automated tests and reproduce the 20-request concurrency demonstration.

---

## 1. Quick Test Execution Commands

From the workspace root directory:

```bash
# Run all unit and integration test suites (backend + frontend)
npm run test

# Run backend integration tests only
npm run test:backend

# Run frontend Vitest tests only
npm run test:frontend

# Execute the 20-request concurrency load test
npm run load-test
```

---

## 2. Reproducing the 20-Request Concurrency Demonstration

The concurrency test (`server/scripts/loadTest.js`) targets **Workshop #1** ("Advanced Concurrency & Race Condition Defense in Web Systems"), which has a maximum capacity of **5 seats**.

### Execution Command:
```bash
cd server
npm run load-test
```

### What the Script Does:
1. **Safety Reset:** Verifies Workshop #1 exists and resets `capacity = 5`, `seatsLeft = 5`, and purges old test bookings.
2. **20 Concurrent Payloads:** Generates 20 unique student identities:
   - `loadtest-<timestamp>-01@college.edu` through `loadtest-<timestamp>-20@college.edu`
3. **Parallel Dispatch:** Fires all 20 HTTP POST requests simultaneously using `Promise.all` with sub-millisecond dispatch timing.
4. **Result Aggregation:** Categorizes each response by HTTP status and error code.
5. **Independent PostgreSQL Audit:** Connects directly to PostgreSQL via Prisma to inspect the database row state.

### Expected Clean-Run Output:

```
================================================================
       SYNCORA CONCURRENCY & RACE CONDITION DEFENSE TEST        
================================================================

[LoadTest] In-process test server running at http://localhost:57640
[LoadTest] Workshop #1 ("Advanced Concurrency & Race Condition Defense in Web Systems") successfully reset to capacity 5, seatsLeft 5.

Dispatching 20 simultaneous booking requests via Promise.all...
Target: POST http://localhost:57640/api/workshops/1/bookings

----------------------------------------------------------------
                   CONCURRENCY TEST RESULTS                     
----------------------------------------------------------------
Total Requests Dispatched:   20
Execution Time:              368.80 ms
HTTP 201 (Booked):           5  (Expected: 5)
HTTP 409 (Sold Out):         15  (Expected: 15)
HTTP 500 (Internal Error):   0  (Expected: 0)
Other Status Codes:          0  (Expected: 0)
----------------------------------------------------------------
                 INDEPENDENT DATABASE AUDIT                     
----------------------------------------------------------------
Initial Capacity:            5
Final Database seatsLeft:    0  (Expected: 0)
Committed DB Bookings:       5  (Expected: 5)
API Reported seatsLeft:      0  (Expected: 0)
Mathematical Invariant:      Capacity (5) - seatsLeft (0) == Bookings (5) -> VALID (MATCH)

✅ SUCCESS: Concurrency test passed with 100% data integrity!
   - Exactly 5 seats were allocated.
   - Exactly 15 requests received clean 409 SOLD_OUT.
   - Zero overselling and zero negative seats detected.
```

---

## 3. Duplicate Booking Race Condition Test

Part B of `loadTest.js` tests race conditions on identical student emails:

### Execution:
- 5 concurrent booking requests are dispatched with the **same email address** to Workshop #3.

### Expected Output:
```
----------------------------------------------------------------
          TESTING CONCURRENT DUPLICATE BOOKING RACE             
----------------------------------------------------------------
Sending 5 simultaneous bookings with identical email (...) to Workshop #3...
HTTP 201 (First Booking):    1 (Expected: 1)
HTTP 409 (ALREADY_BOOKED):   4 (Expected: 4)
Committed DB Rows for Email: 1 (Expected: 1)
✅ SUCCESS: Duplicate booking race condition cleanly prevented by compound unique constraint & rollback!
```

---

## 4. Verifying Database Invariants Manually in PostgreSQL

You can verify the state in PostgreSQL directly using `psql`:

```sql
-- Connect to the database
\c syncora

-- 1. Check seat counts
SELECT id, title, capacity, "seatsLeft" FROM "Workshop" WHERE id = 1;
-- Result: seatsLeft must equal 0

-- 2. Count committed bookings
SELECT count(*) FROM "Booking" WHERE "workshopId" = 1;
-- Result: exactly 5 rows

-- 3. Check for any duplicate bookings
SELECT "workshopId", "studentEmail", COUNT(*)
FROM "Booking"
GROUP BY "workshopId", "studentEmail"
HAVING COUNT(*) > 1;
-- Result: 0 rows (no duplicates)
```
