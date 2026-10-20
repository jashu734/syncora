# Syncora Faculty Presentation & Defense Script (2–3 Minutes)

This script provides a structured presentation guide to explain and defend Syncora's architecture, concurrency safety, and transaction integrity before an academic evaluation committee or faculty panel.

---

## Slide 1 / Minute 0:00 – 0:45: The Problem & The TOCTOU Flaw

> "Good morning, professors. Today I am presenting **Syncora**, a concurrency-safe workshop and event reservation platform.
>
> In high-demand event ticketing or workshop registrations, the biggest failure point in web architecture is **overselling seats due to race conditions**.
>
> The naive implementation reads `seatsLeft` from the database, checks if `seatsLeft > 0` in application code, and then issues an update. This introduces a classic **Time-of-Check to Time-of-Use (TOCTOU)** vulnerability. If 20 students click 'Book' at the exact same millisecond when only 5 seats remain, all 20 threads read `seatsLeft = 5`, all 20 pass the check, and the server issues 20 tickets while dropping available seats into negative numbers."

---

## Slide 2 / Minute 0:45 – 1:30: The Engineering Solution

> "To eliminate this vulnerability, Syncora enforces a **4-layer concurrency defense model**:
>
> 1. **Conditional Atomic Decrement:** Rather than checking in Node.js memory, we execute:
>    `UPDATE "Workshop" SET "seatsLeft" = "seatsLeft" - 1 WHERE id = $1 AND "seatsLeft" > 0;`
>    In PostgreSQL, this takes an exclusive row lock. Each concurrent transaction evaluates the `WHERE` condition on the committed row. When `seatsLeft` reaches zero, PostgreSQL updates 0 rows.
> 2. **ACID Transaction Boundaries:** The atomic decrement and the booking record insertion occur inside a single `prisma.$transaction`. If anything fails, the entire transaction rolls back automatically—preventing orphan decrements.
> 3. **Compound Unique Constraints:** To prevent double-booking, PostgreSQL enforces `@@unique([workshopId, studentEmail])`. If a student submits multiple simultaneous requests, duplicate attempts trigger a constraint failure and automatic rollback.
> 4. **Cancellation Consistency:** Cancelling a booking deletes the row and increments `seatsLeft` in the same transaction, with 404 guards preventing double cancellation."

---

## Slide 3 / Minute 1:30 – 2:15: Live Automated Demonstration

> "Let me demonstrate this live by running our automated load testing script:
>
> *(Run: `npm run load-test`)*
>
> As you can see on screen:
> - **20 simultaneous HTTP POST requests** were fired using `Promise.all` against Workshop #1, which has a capacity of **exactly 5 seats**.
> - **Results:**
>   - Exactly **5 requests succeeded** with `HTTP 201 Created`.
>   - Exactly **15 requests were cleanly rejected** with `HTTP 409 SOLD_OUT`.
>   - **0 internal server errors (HTTP 500)** occurred.
> - **Independent PostgreSQL Audit:**
>   - `seatsLeft` is verified at exactly **0**.
>   - Total committed database rows equal exactly **5**.
>   - The invariant `Capacity (5) - seatsLeft (0) == Bookings (5)` is 100% verified.
>
> We also verified concurrent duplicate bookings with the same email: exactly 1 succeeded and 4 were rejected by database constraint rollback."

---

## Slide 4 / Minute 2:15 – 3:00: Frontend Architecture & Summary

> "On the client side:
> - Built with **React and Vite**.
> - Uses **TanStack Query** for server-state synchronization. When a booking or cancellation mutation completes, TanStack Query invalidates `['workshops', 'list']` and `['workshops', 'detail', id]`, automatically updating live seat counts and attendee rosters without page reloads.
> - Fully tested: 12 backend integration tests and 6 frontend Vitest tests pass with 100% success.
>
> Thank you, and I welcome any questions regarding our transaction boundaries, PostgreSQL locking mechanisms, or REST API architecture."

---

## Recommended Demonstration Evidence to Show Faculty

1. **Terminal 1 (Load Test Output):** Show the clean table from `npm run load-test`.
2. **Terminal 2 (Test Suites):** Show `npm run test` with 12 backend tests and 6 frontend tests passing.
3. **Browser Window (Frontend UI):**
   - Workshop listing with live badges.
   - Workshop Details page showing 0 seats remaining on Workshop #1 after the load test.
   - Successful reservation on an available workshop.
   - Cancellation of a booking restoring the seat count.
4. **Browser Network Tab:** Inspect a `POST /api/workshops/:id/bookings` returning `201 Created` or `409 SOLD_OUT`, followed by automated TanStack Query `GET` refetches.
5. **PostgreSQL / Prisma Studio (`npx prisma studio`):** Show the `Workshop` and `Booking` table records in the database.
