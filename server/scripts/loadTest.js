import 'dotenv/config';
import { prisma } from '../src/prisma.js';
import { createApp } from '../src/app.js';

// Configuration
const DEFAULT_PORT = process.env.PORT || 3001;
const WORKSHOP_ID = Number(process.env.TEST_WORKSHOP_ID || 1);
const TOTAL_CONCURRENT_REQUESTS = 20;

/**
 * Ensures an HTTP server is reachable. If not running, launches an in-process server.
 */
async function ensureServer() {
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${DEFAULT_PORT}`;
  try {
    const res = await fetch(`${baseUrl}/health`);
    if (res.ok) {
      return { baseUrl, serverInstance: null };
    }
  } catch {
    // Server is not running; start an in-process instance
  }

  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const localUrl = `http://localhost:${port}`;
      console.log(`[LoadTest] In-process test server running at ${localUrl}`);
      resolve({ baseUrl: localUrl, serverInstance: server });
    });
  });
}

/**
 * Resets the target workshop to a pristine 5-seat state with 0 bookings.
 */
async function resetTargetWorkshop(workshopId) {
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId }
  });

  if (!workshop) {
    throw new Error(`Target workshop with ID ${workshopId} does not exist. Run 'npm run prisma:seed' first.`);
  }

  if (workshop.capacity !== 5) {
    throw new Error(`Target workshop must have a capacity of exactly 5. Found capacity: ${workshop.capacity}`);
  }

  // Delete any existing bookings for this specific workshop
  await prisma.booking.deleteMany({
    where: { workshopId }
  });

  // Reset seatsLeft back to full capacity (5)
  await prisma.workshop.update({
    where: { id: workshopId },
    data: { seatsLeft: 5 }
  });

  console.log(`[LoadTest] Workshop #${workshopId} ("${workshop.title}") successfully reset to capacity 5, seatsLeft 5.`);
}

async function runConcurrencyTest() {
  console.log('================================================================');
  console.log('       SYNCORA CONCURRENCY & RACE CONDITION DEFENSE TEST        ');
  console.log('================================================================\n');

  const { baseUrl, serverInstance } = await ensureServer();

  try {
    // 1. Reset target workshop
    await resetTargetWorkshop(WORKSHOP_ID);

    // 2. Prepare 20 unique student payloads
    const testRunTimestamp = Date.now();
    const students = Array.from({ length: TOTAL_CONCURRENT_REQUESTS }, (_, i) => {
      const padIndex = String(i + 1).padStart(2, '0');
      return {
        studentName: `LoadTest Student ${padIndex}`,
        studentEmail: `loadtest-${testRunTimestamp}-${padIndex}@college.edu`
      };
    });

    console.log(`\nDispatching ${TOTAL_CONCURRENT_REQUESTS} simultaneous booking requests via Promise.all...`);
    console.log(`Target: POST ${baseUrl}/api/workshops/${WORKSHOP_ID}/bookings\n`);

    const startTime = performance.now();

    // 3. Fire all 20 requests concurrently
    const responses = await Promise.all(
      students.map(async (student) => {
        const res = await fetch(`${baseUrl}/api/workshops/${WORKSHOP_ID}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(student)
        });
        const body = await res.json().catch(() => null);
        return {
          status: res.status,
          body,
          studentEmail: student.studentEmail
        };
      })
    );

    const durationMs = (performance.now() - startTime).toFixed(2);

    // 4. Aggregate results
    const statusCounts = {};
    const successList = [];
    const soldOutList = [];
    const unexpectedErrors = [];

    responses.forEach((r) => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      if (r.status === 201) {
        successList.push(r);
      } else if (r.status === 409 && r.body?.error?.code === 'SOLD_OUT') {
        soldOutList.push(r);
      } else {
        unexpectedErrors.push(r);
      }
    });

    // 5. Fetch workshop via API
    const apiWorkshopRes = await fetch(`${baseUrl}/api/workshops/${WORKSHOP_ID}`);
    const apiWorkshop = (await apiWorkshopRes.json()).data;

    // 6. Independent Database Verification directly via Prisma
    const dbWorkshop = await prisma.workshop.findUnique({
      where: { id: WORKSHOP_ID }
    });
    const dbBookingsCount = await prisma.booking.count({
      where: { workshopId: WORKSHOP_ID }
    });

    // 7. Print Comprehensive Academic Demonstration Report
    console.log('----------------------------------------------------------------');
    console.log('                   CONCURRENCY TEST RESULTS                     ');
    console.log('----------------------------------------------------------------');
    console.log(`Total Requests Dispatched:   ${TOTAL_CONCURRENT_REQUESTS}`);
    console.log(`Execution Time:              ${durationMs} ms`);
    console.log(`HTTP 201 (Booked):           ${statusCounts[201] || 0}  (Expected: 5)`);
    console.log(`HTTP 409 (Sold Out):         ${statusCounts[409] || 0}  (Expected: 15)`);
    console.log(`HTTP 500 (Internal Error):   ${statusCounts[500] || 0}  (Expected: 0)`);
    console.log(`Other Status Codes:          ${unexpectedErrors.length}  (Expected: 0)`);
    console.log('----------------------------------------------------------------');
    console.log('                 INDEPENDENT DATABASE AUDIT                     ');
    console.log('----------------------------------------------------------------');
    console.log(`Initial Capacity:            5`);
    console.log(`Final Database seatsLeft:    ${dbWorkshop.seatsLeft}  (Expected: 0)`);
    console.log(`Committed DB Bookings:       ${dbBookingsCount}  (Expected: 5)`);
    console.log(`API Reported seatsLeft:      ${apiWorkshop.seatsLeft}  (Expected: 0)`);
    console.log(`Mathematical Invariant:      Capacity (5) - seatsLeft (${dbWorkshop.seatsLeft}) == Bookings (${dbBookingsCount}) -> ${5 - dbWorkshop.seatsLeft === dbBookingsCount ? 'VALID (MATCH)' : 'CORRUPTED'}`);

    // Verification Assertions
    const passed =
      (statusCounts[201] || 0) === 5 &&
      (statusCounts[409] || 0) === 15 &&
      unexpectedErrors.length === 0 &&
      dbWorkshop.seatsLeft === 0 &&
      dbBookingsCount === 5;

    if (!passed) {
      console.error('\n❌ FAILURE: Concurrency invariants violated!');
      process.exit(1);
    }

    console.log('\n✅ SUCCESS: Concurrency test passed with 100% data integrity!');
    console.log('   - Exactly 5 seats were allocated.');
    console.log('   - Exactly 15 requests received clean 409 SOLD_OUT.');
    console.log('   - Zero overselling and zero negative seats detected.');

    // 8. Part B: Test Concurrent Duplicate Submissions (Race on Same Email)
    console.log('\n----------------------------------------------------------------');
    console.log('          TESTING CONCURRENT DUPLICATE BOOKING RACE             ');
    console.log('----------------------------------------------------------------');
    // Free up 2 seats on workshop 2 for duplicate test
    const DUP_WORKSHOP_ID = 3; // capacity 20, 20 seats
    const duplicateEmail = `race-duplicate-${Date.now()}@college.edu`;
    console.log(`Sending 5 simultaneous bookings with identical email (${duplicateEmail}) to Workshop #${DUP_WORKSHOP_ID}...`);

    const dupResponses = await Promise.all(
      Array.from({ length: 5 }, () =>
        fetch(`${baseUrl}/api/workshops/${DUP_WORKSHOP_ID}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: 'Duplicate Race Student',
            studentEmail: duplicateEmail
          })
        }).then(async (r) => ({ status: r.status, body: await r.json() }))
      )
    );

    const dup201 = dupResponses.filter((r) => r.status === 201).length;
    const dup409 = dupResponses.filter((r) => r.status === 409 && r.body?.error?.code === 'ALREADY_BOOKED').length;

    console.log(`HTTP 201 (First Booking):    ${dup201} (Expected: 1)`);
    console.log(`HTTP 409 (ALREADY_BOOKED):   ${dup409} (Expected: 4)`);

    const dupCount = await prisma.booking.count({
      where: {
        workshopId: DUP_WORKSHOP_ID,
        studentEmail: duplicateEmail
      }
    });
    console.log(`Committed DB Rows for Email: ${dupCount} (Expected: 1)`);

    if (dup201 === 1 && dup409 === 4 && dupCount === 1) {
      console.log('✅ SUCCESS: Duplicate booking race condition cleanly prevented by compound unique constraint & rollback!\n');
    } else {
      console.error('❌ FAILURE: Duplicate booking race failed assertions!\n');
      process.exit(1);
    }
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await prisma.$disconnect();
  }
}

runConcurrencyTest().catch((err) => {
  console.error('[LoadTest Error]:', err);
  process.exit(1);
});
