# Syncora REST API Specification

This document provides complete documentation for the Syncora REST API, including headers, parameters, response formats, and error codes.

---

## Base URL
- Development Default: `http://localhost:3001`
- Content-Type: `application/json`

---

## Global Response Formats

### Success Response Envelope
All successful requests return data wrapped in a `data` field:
```json
{
  "data": { ... }
}
```

### Error Response Envelope
All client and server errors return a standard error schema without leaking database internals:
```json
{
  "error": {
    "code": "SOLD_OUT",
    "message": "No seats are available for this workshop.",
    "details": [] 
  }
}
```

### Standard Error Codes
| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request payload, query, or parameters failed schema validation. |
| `404` | `NOT_FOUND` | Unmatched route or general missing resource. |
| `404` | `WORKSHOP_NOT_FOUND` | Workshop with the specified ID does not exist. |
| `404` | `BOOKING_NOT_FOUND` | Booking ID does not exist or has already been cancelled. |
| `409` | `SOLD_OUT` | Workshop has 0 available seats remaining. |
| `409` | `ALREADY_BOOKED` | Student has already reserved a seat for this workshop. |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error. |

---

## Endpoints

### 1. Health Check
Checks backend service availability.

- **Method:** `GET`
- **Path:** `/health`
- **Success Status:** `200 OK`
- **Response:**
```json
{
  "status": "ok"
}
```

---

### 2. List All Workshops
Retrieves all workshops sorted chronologically with live seat counts and total registrations.

- **Method:** `GET`
- **Path:** `/api/workshops`
- **Success Status:** `200 OK`
- **Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Advanced Concurrency & Race Condition Defense in Web Systems",
      "description": "Hands-on laboratory focusing on transaction isolation levels...",
      "instructor": "Dr. Evelyn Vance (Systems Architecture Lab)",
      "location": "Turing Hall - Computing Lab 304",
      "startsAt": "2026-10-27T09:58:25.000Z",
      "capacity": 5,
      "seatsLeft": 5,
      "createdAt": "2026-10-20T09:58:25.000Z",
      "updatedAt": "2026-10-20T09:58:25.000Z",
      "_count": {
        "bookings": 0
      }
    }
  ]
}
```

---

### 3. Get Workshop By ID
Retrieves details for a single workshop.

- **Method:** `GET`
- **Path:** `/api/workshops/:id`
- **Parameters:**
  - `id` (path, required): Positive integer.
- **Success Status:** `200 OK`
- **Error Responses:**
  - `400 VALIDATION_ERROR`: Invalid numeric ID format.
  - `404 WORKSHOP_NOT_FOUND`: Workshop does not exist.
- **Response:**
```json
{
  "data": {
    "id": 1,
    "title": "Advanced Concurrency & Race Condition Defense in Web Systems",
    "description": "Hands-on laboratory...",
    "instructor": "Dr. Evelyn Vance",
    "location": "Turing Hall",
    "startsAt": "2026-10-27T09:58:25.000Z",
    "capacity": 5,
    "seatsLeft": 5,
    "_count": {
      "bookings": 0
    }
  }
}
```

---

### 4. Create Booking (Concurrency-Safe)
Atomically decrements available seats and registers a student.

- **Method:** `POST`
- **Path:** `/api/workshops/:id/bookings`
- **Parameters:**
  - `id` (path, required): Positive integer workshop ID.
- **Request Body:**
```json
{
  "studentName": "Alex Morgan",
  "studentEmail": "alex.morgan@college.edu"
}
```
- **Validation Rules:**
  - `studentName`: String between 2 and 100 characters. Automatically trimmed.
  - `studentEmail`: Valid email format. Automatically trimmed and converted to lowercase.
- **Success Status:** `201 Created`
- **Response:**
```json
{
  "data": {
    "id": 14,
    "workshopId": 1,
    "studentName": "Alex Morgan",
    "studentEmail": "alex.morgan@college.edu",
    "createdAt": "2026-10-20T10:15:30.123Z",
    "workshop": {
      "id": 1,
      "title": "Advanced Concurrency & Race Condition Defense in Web Systems",
      "location": "Turing Hall - Computing Lab 304",
      "startsAt": "2026-10-27T09:58:25.000Z"
    }
  }
}
```
- **Error Responses:**
  - `400 VALIDATION_ERROR`: Missing or malformed fields.
  - `404 WORKSHOP_NOT_FOUND`: Target workshop does not exist.
  - `409 SOLD_OUT`: No seats remaining (`seatsLeft = 0`).
  - `409 ALREADY_BOOKED`: Student email has already booked a seat for this workshop.

---

### 5. List Workshop Bookings
Retrieves all confirmed registrations for a workshop.

- **Method:** `GET`
- **Path:** `/api/workshops/:id/bookings`
- **Parameters:**
  - `id` (path, required): Positive integer workshop ID.
- **Success Status:** `200 OK`
- **Response:**
```json
{
  "data": [
    {
      "id": 14,
      "workshopId": 1,
      "studentName": "Alex Morgan",
      "studentEmail": "alex.morgan@college.edu",
      "createdAt": "2026-10-20T10:15:30.123Z"
    }
  ]
}
```

---

### 6. Cancel Booking (Concurrency-Safe)
Atomically deletes a booking and increments available seats by exactly 1.

- **Method:** `DELETE`
- **Path:** `/api/bookings/:id`
- **Parameters:**
  - `id` (path, required): Positive integer booking ID.
- **Success Status:** `200 OK`
- **Response:**
```json
{
  "data": {
    "message": "Booking successfully cancelled and seat restored.",
    "cancelledBookingId": 14,
    "workshopId": 1
  }
}
```
- **Error Responses:**
  - `404 BOOKING_NOT_FOUND`: Booking record does not exist or was already cancelled.

---

### 7. Lookup Bookings by Student Email
Finds all workshop registrations associated with an email address.

- **Method:** `GET`
- **Path:** `/api/bookings/my?email=student@college.edu`
- **Query Parameters:**
  - `email` (string, required): Valid student email address.
- **Success Status:** `200 OK`
- **Response:**
```json
{
  "data": [
    {
      "id": 14,
      "workshopId": 1,
      "studentName": "Alex Morgan",
      "studentEmail": "alex.morgan@college.edu",
      "createdAt": "2026-10-20T10:15:30.123Z",
      "workshop": {
        "id": 1,
        "title": "Advanced Concurrency & Race Condition Defense in Web Systems",
        "instructor": "Dr. Evelyn Vance (Systems Architecture Lab)",
        "location": "Turing Hall - Computing Lab 304",
        "startsAt": "2026-10-27T09:58:25.000Z",
        "capacity": 5,
        "seatsLeft": 4
      }
    }
  ]
}
```
