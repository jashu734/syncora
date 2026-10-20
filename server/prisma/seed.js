import 'dotenv/config';
import { prisma } from '../src/prisma.js';

/**
 * Idempotent database seed script for development and testing.
 * Seeds 3 realistic college technical workshops:
 * 1. Concurrency & Distributed Systems (Capacity 5, exactly 5 seats left for load testing)
 * 2. Full-Stack Production Architecture (Capacity 30, 28 seats left, 2 seeded bookings)
 * 3. Cloud-Native Microservices (Capacity 20, 20 seats left)
 */
async function main() {
  console.log('--- Starting Syncora Database Seed ---');

  // Workshop 1: Concurrency Masterclass (5 seats total, exactly 5 seats available for concurrency demonstration)
  const workshop1 = await prisma.workshop.upsert({
    where: { id: 1 },
    update: {
      title: 'Advanced Concurrency & Race Condition Defense in Web Systems',
      description: 'Hands-on laboratory focusing on transaction isolation levels, atomic updates, database row locking, and high-concurrency booking architectures.',
      instructor: 'Dr. Evelyn Vance (Systems Architecture Lab)',
      location: 'Turing Hall - Computing Lab 304',
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      capacity: 5,
      seatsLeft: 5
    },
    create: {
      id: 1,
      title: 'Advanced Concurrency & Race Condition Defense in Web Systems',
      description: 'Hands-on laboratory focusing on transaction isolation levels, atomic updates, database row locking, and high-concurrency booking architectures.',
      instructor: 'Dr. Evelyn Vance (Systems Architecture Lab)',
      location: 'Turing Hall - Computing Lab 304',
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      capacity: 5,
      seatsLeft: 5
    }
  });

  // Clear any existing bookings for workshop 1 to guarantee fresh 5 seats for concurrency tests
  await prisma.booking.deleteMany({
    where: { workshopId: workshop1.id }
  });
  // Reset seatsLeft to 5
  await prisma.workshop.update({
    where: { id: workshop1.id },
    data: { seatsLeft: 5 }
  });

  // Workshop 2: Full-Stack React & Node.js Production Architecture
  const workshop2 = await prisma.workshop.upsert({
    where: { id: 2 },
    update: {
      title: 'Modern Full-Stack Engineering with React 19 & Express',
      description: 'Explore production-grade frontend architecture with TanStack Query, resilient REST APIs, caching patterns, and Zod runtime schema validation.',
      instructor: 'Prof. Marcus Chen (Software Engineering Dept)',
      location: 'Auditorium B - Innovation Center',
      startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      capacity: 30,
      seatsLeft: 28
    },
    create: {
      id: 2,
      title: 'Modern Full-Stack Engineering with React 19 & Express',
      description: 'Explore production-grade frontend architecture with TanStack Query, resilient REST APIs, caching patterns, and Zod runtime schema validation.',
      instructor: 'Prof. Marcus Chen (Software Engineering Dept)',
      location: 'Auditorium B - Innovation Center',
      startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      capacity: 30,
      seatsLeft: 28
    }
  });

  // Seed 2 bookings for workshop 2
  await prisma.booking.deleteMany({
    where: { workshopId: workshop2.id }
  });
  await prisma.booking.createMany({
    data: [
      {
        workshopId: workshop2.id,
        studentName: 'Aarav Patel',
        studentEmail: 'aarav.patel@college.edu'
      },
      {
        workshopId: workshop2.id,
        studentName: 'Sophia Rodriguez',
        studentEmail: 'sophia.r@college.edu'
      }
    ]
  });
  await prisma.workshop.update({
    where: { id: workshop2.id },
    data: { seatsLeft: 28 }
  });

  // Workshop 3: Cloud-Native Microservices
  const workshop3 = await prisma.workshop.upsert({
    where: { id: 3 },
    update: {
      title: 'Container Orchestration & Cloud Microservices with Docker',
      description: 'Deep dive into zero-downtime deployments, horizontal pod scaling, container security, and observability in cloud platforms.',
      instructor: 'Sarah Jenkins (Senior DevOps Architect)',
      location: 'Online - Virtual Engineering Hub',
      startsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      capacity: 20,
      seatsLeft: 20
    },
    create: {
      id: 3,
      title: 'Container Orchestration & Cloud Microservices with Docker',
      description: 'Deep dive into zero-downtime deployments, horizontal pod scaling, container security, and observability in cloud platforms.',
      instructor: 'Sarah Jenkins (Senior DevOps Architect)',
      location: 'Online - Virtual Engineering Hub',
      startsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      capacity: 20,
      seatsLeft: 20
    }
  });

  await prisma.booking.deleteMany({
    where: { workshopId: workshop3.id }
  });
  await prisma.workshop.update({
    where: { id: workshop3.id },
    data: { seatsLeft: 20 }
  });

  console.log('Seeded workshops successfully:');
  const allWorkshops = await prisma.workshop.findMany({
    include: { _count: { select: { bookings: true } } }
  });
  for (const w of allWorkshops) {
    console.log(`- [#${w.id}] "${w.title}" | Capacity: ${w.capacity} | Seats Left: ${w.seatsLeft} | Bookings: ${w._count.bookings}`);
  }

  // Ensure PostgreSQL serial sequences match the maximum inserted IDs
  await prisma.$executeRawUnsafe('SELECT setval(pg_get_serial_sequence(\'"Workshop"\', \'id\'), COALESCE((SELECT MAX(id) FROM "Workshop"), 1));');
  await prisma.$executeRawUnsafe('SELECT setval(pg_get_serial_sequence(\'"Booking"\', \'id\'), COALESCE((SELECT MAX(id) FROM "Booking"), 1));');

  console.log('--- Syncora Database Seed Completed ---');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
