import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/prisma.js';

describe('Syncora Backend REST API Integration Tests', () => {
  let app;
  let testWorkshopId;

  before(async () => {
    app = createApp();

    // Ensure an isolated test workshop exists
    const testWorkshop = await prisma.workshop.create({
      data: {
        title: 'Automated Test Systems Workshop',
        description: 'Temporary workshop for automated test suites.',
        instructor: 'Test Suite Runner',
        location: 'Virtual Lab Suite',
        startsAt: new Date(Date.now() + 86400000),
        capacity: 2,
        seatsLeft: 2
      }
    });
    testWorkshopId = testWorkshop.id;
  });

  after(async () => {
    // Clean up test workshop and any bookings
    await prisma.booking.deleteMany({
      where: { workshopId: testWorkshopId }
    });
    await prisma.workshop.delete({
      where: { id: testWorkshopId }
    });
    await prisma.$disconnect();
  });

  it('GET /health returns HTTP 200 with status ok', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });

  it('GET /api/workshops returns array of workshops', async () => {
    const res = await request(app).get('/api/workshops');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
  });

  it('GET /api/workshops/:id returns workshop with valid ID', async () => {
    const res = await request(app).get(`/api/workshops/${testWorkshopId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, testWorkshopId);
    assert.equal(res.body.data.capacity, 2);
  });

  it('GET /api/workshops/999999 returns 404 WORKSHOP_NOT_FOUND', async () => {
    const res = await request(app).get('/api/workshops/999999');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'WORKSHOP_NOT_FOUND');
  });

  it('POST /api/workshops/:id/bookings with invalid body returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post(`/api/workshops/${testWorkshopId}/bookings`)
      .send({ studentName: '', studentEmail: 'not-an-email' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('POST /api/workshops/:id/bookings successfully creates booking (seat 1 of 2)', async () => {
    const res = await request(app)
      .post(`/api/workshops/${testWorkshopId}/bookings`)
      .send({
        studentName: 'Test Student One',
        studentEmail: 'student1@college.edu'
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.workshopId, testWorkshopId);
    assert.equal(res.body.data.studentEmail, 'student1@college.edu');

    // Verify seat decrement
    const ws = await prisma.workshop.findUnique({ where: { id: testWorkshopId } });
    assert.equal(ws.seatsLeft, 1);
  });

  it('POST /api/workshops/:id/bookings rejects duplicate booking with 409 ALREADY_BOOKED', async () => {
    const res = await request(app)
      .post(`/api/workshops/${testWorkshopId}/bookings`)
      .send({
        studentName: 'Test Student One Duplicate',
        studentEmail: 'STUDENT1@college.edu' // Test case insensitivity
      });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'ALREADY_BOOKED');

    // Seat count should not have changed
    const ws = await prisma.workshop.findUnique({ where: { id: testWorkshopId } });
    assert.equal(ws.seatsLeft, 1);
  });

  it('POST /api/workshops/:id/bookings books the final seat (seat 2 of 2)', async () => {
    const res = await request(app)
      .post(`/api/workshops/${testWorkshopId}/bookings`)
      .send({
        studentName: 'Test Student Two',
        studentEmail: 'student2@college.edu'
      });
    assert.equal(res.status, 201);

    const ws = await prisma.workshop.findUnique({ where: { id: testWorkshopId } });
    assert.equal(ws.seatsLeft, 0);
  });

  it('POST /api/workshops/:id/bookings rejects booking when sold out with 409 SOLD_OUT', async () => {
    const res = await request(app)
      .post(`/api/workshops/${testWorkshopId}/bookings`)
      .send({
        studentName: 'Test Student Three',
        studentEmail: 'student3@college.edu'
      });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'SOLD_OUT');

    const ws = await prisma.workshop.findUnique({ where: { id: testWorkshopId } });
    assert.equal(ws.seatsLeft, 0);
  });

  it('DELETE /api/bookings/:id successfully cancels booking and restores seat', async () => {
    const booking = await prisma.booking.findFirst({
      where: { workshopId: testWorkshopId, studentEmail: 'student2@college.edu' }
    });
    assert.ok(booking);

    const res = await request(app).delete(`/api/bookings/${booking.id}`);
    assert.equal(res.status, 200);

    // Verify seat is restored
    const ws = await prisma.workshop.findUnique({ where: { id: testWorkshopId } });
    assert.equal(ws.seatsLeft, 1);
  });

  it('DELETE /api/bookings/:id on already cancelled booking returns 404 BOOKING_NOT_FOUND', async () => {
    const nonExistentBookingId = 888888;
    const res = await request(app).delete(`/api/bookings/${nonExistentBookingId}`);
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'BOOKING_NOT_FOUND');

    // Verify seat was NOT restored again
    const ws = await prisma.workshop.findUnique({ where: { id: testWorkshopId } });
    assert.equal(ws.seatsLeft, 1);
  });

  it('GET /api/bookings/my returns student bookings by email', async () => {
    const res = await request(app)
      .get('/api/bookings/my')
      .query({ email: 'student1@college.edu' });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].studentEmail, 'student1@college.edu');
  });
});
