# Workout Tracker API Reference

**Base URL:** `http://localhost:3000/api`  
**API Documentation (Swagger):** `http://localhost:3000/api/docs`  
**Auth Scheme:** Bearer JWT Token

---

## Table of Contents

- [Authentication](#authentication)
  - [Authentication Header](#authentication-header)
  - [Error Response Format](#error-response-format)
- [Endpoints](#endpoints)
  - [1. POST /api/auth/register](#1-post-apiauthregister)
  - [2. POST /api/auth/login](#2-post-apiauthlogin)
  - [3. GET /api/auth/me](#3-get-apiauthme)
  - [4. GET /api/exercises](#4-get-apiexercises)
  - [5. GET /api/exercises/:id](#5-get-apiexercisesid)
  - [6. POST /api/exercises](#6-post-apiexercises)
  - [7. PATCH /api/exercises/:id](#7-patch-apiexercisesid)
  - [8. DELETE /api/exercises/:id](#8-delete-apiexercisesid)
  - [9. POST /api/workouts](#9-post-apiworkouts)
  - [10. GET /api/workouts](#10-get-apiworkouts)
  - [11. GET /api/workouts/:id](#11-get-apiworkoutsid)
  - [12. PATCH /api/workouts/:id](#12-patch-apiworkoutsid)
  - [13. DELETE /api/workouts/:id](#13-delete-apiworkoutsid)
  - [14. POST /api/progress](#14-post-apiprogress)
  - [15. GET /api/progress](#15-get-apiprogress)
  - [16. GET /api/progress/:id](#16-get-apiprogressid)
  - [17. PATCH /api/progress/:id](#17-patch-apiprogressid)
  - [18. DELETE /api/progress/:id](#18-delete-apiprogressid)

---

## Authentication

This API uses **JWT (JSON Web Token)** authentication. Tokens are issued on login/register and expire after **7 days**.

### Authentication Header

All protected endpoints require the following HTTP header:

```
Authorization: Bearer <token>
```

The token is a standard JWT containing:
```json
{
  "sub": 1,
  "email": "demo@example.com",
  "iat": 1719750000,
  "exp": 1720354800
}
```

### Error Response Format

All errors follow a consistent format:

```json
{
  "message": "Error description",
  "error": "Error type",
  "statusCode": 400
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request — validation error (missing/invalid fields) |
| 401 | Unauthorized — missing/invalid/expired token |
| 403 | Forbidden — resource doesn't belong to user |
| 404 | Not Found — resource doesn't exist |
| 409 | Conflict — email already in use (register) |

---

## Endpoints

---

### 1. POST /api/auth/register

Register a new user account. Returns a JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Validation Rules:**
| Field | Rule |
|-------|------|
| email | Valid email format, unique |
| password | Min 6 characters |
| name | Required, non-empty |

**Success Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsImlhdCI6MTcxOTc1MDAwMCwiZXhwIjoxNzIwMzU0ODAwfQ.example"
}
```

**Error Responses:**
```json
// 409 — Email already in use
{
  "message": "Email already in use",
  "error": "Conflict",
  "statusCode": 409
}

// 400 — Validation error
{
  "message": ["email must be an email", "password must be longer than or equal to 6 characters"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 2. POST /api/auth/login

Authenticate with email and password. Returns a JWT token.

**Request:**
```json
{
  "email": "demo@example.com",
  "password": "demo123"
}
```

**Success Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiZGVtb0BleGFtcGxlLmNvbSIsImlhdCI6MTcxOTc1MDAwMCwiZXhwIjoxNzIwMzU0ODAwfQ.example"
}
```

**Error Responses:**
```json
// 401 — Invalid credentials
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### 3. GET /api/auth/me

Get the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "id": 1,
  "email": "demo@example.com",
  "name": "Demo User",
  "createdAt": "2026-06-30T10:00:00.000Z"
}
```

Note: The `password` field is excluded from the response.

**Error Response:**
```json
// 401 — Missing/invalid token
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

### 4. GET /api/exercises

Get all exercises. No authentication required. Optionally filter by muscle group.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `muscleGroup` | enum | No | Filter by muscle group (see enum values below) |

**Valid MuscleGroup Values:** `chest`, `back`, `legs`, `shoulders`, `arms`, `core`, `cardio`, `full_body`

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Bench Press",
    "muscleGroup": "chest",
    "equipment": "barbell",
    "instructions": "Lie on flat bench, lower bar to mid-chest, press up.",
    "type": "strength"
  },
  {
    "id": 2,
    "name": "Incline Dumbbell Press",
    "muscleGroup": "chest",
    "equipment": "dumbbell",
    "instructions": "Sit on incline bench, press dumbbells up from chest.",
    "type": "strength"
  }
]
```

**Filtered Request:**
```
GET /api/exercises?muscleGroup=legs
```

**Filtered Response:**
```json
[
  {
    "id": 7,
    "name": "Squat",
    "muscleGroup": "legs",
    "equipment": "barbell",
    "instructions": "Keep chest up, squat to parallel, drive up.",
    "type": "strength"
  },
  {
    "id": 8,
    "name": "Leg Press",
    "muscleGroup": "legs",
    "equipment": "machine",
    "instructions": "Push platform away with legs, control on return.",
    "type": "strength"
  }
]
```

---

### 5. GET /api/exercises/:id

Get a single exercise by ID.

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Bench Press",
  "muscleGroup": "chest",
  "equipment": "barbell",
  "instructions": "Lie on flat bench, lower bar to mid-chest, press up.",
  "type": "strength"
}
```

**Error Response:**
```json
// 404
{
  "message": "Exercise #999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### 6. POST /api/exercises

Create a new exercise. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Romanian Deadlift",
  "muscleGroup": "back",
  "equipment": "barbell",
  "instructions": "Hinge at hips with slight bend in knees, lower barbell along legs.",
  "type": "strength"
}
```

**Success Response (201):**
```json
{
  "id": 21,
  "name": "Romanian Deadlift",
  "muscleGroup": "back",
  "equipment": "barbell",
  "instructions": "Hinge at hips with slight bend in knees, lower barbell along legs.",
  "type": "strength"
}
```

---

### 7. PATCH /api/exercises/:id

Update an existing exercise. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Request (partial update):**
```json
{
  "instructions": "Updated instructions for better form."
}
```

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Bench Press",
  "muscleGroup": "chest",
  "equipment": "barbell",
  "instructions": "Updated instructions for better form.",
  "type": "strength"
}
```

---

### 8. DELETE /api/exercises/:id

Delete an exercise. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):** (No content body)

---

### 9. POST /api/workouts

Create a new workout with exercises. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Upper Body Push",
  "date": "2026-06-30",
  "duration": 45,
  "notes": "Focused on chest and shoulders",
  "exercises": [
    {
      "exerciseId": 1,
      "sets": 4,
      "reps": 8,
      "weight": 80,
      "restSeconds": 90,
      "order": 1
    },
    {
      "exerciseId": 10,
      "sets": 3,
      "reps": 8,
      "weight": 40,
      "restSeconds": 90,
      "order": 2
    },
    {
      "exerciseId": 11,
      "sets": 3,
      "reps": 12,
      "weight": 12,
      "restSeconds": 60,
      "order": 3
    }
  ]
}
```

**Success Response (201):**
```json
{
  "id": 4,
  "name": "Upper Body Push",
  "date": "2026-06-30",
  "duration": 45,
  "notes": "Focused on chest and shoulders",
  "userId": 1,
  "exercises": [
    {
      "id": 9,
      "workoutId": 4,
      "exerciseId": 1,
      "sets": 4,
      "reps": 8,
      "weight": 80,
      "restSeconds": 90,
      "order": 1,
      "exercise": {
        "id": 1,
        "name": "Bench Press",
        "muscleGroup": "chest",
        "equipment": "barbell",
        "instructions": "Lie on flat bench, lower bar to mid-chest, press up.",
        "type": "strength"
      }
    },
    {
      "id": 10,
      "workoutId": 4,
      "exerciseId": 10,
      "sets": 3,
      "reps": 8,
      "weight": 40,
      "restSeconds": 90,
      "order": 2,
      "exercise": {
        "id": 10,
        "name": "Overhead Press",
        "muscleGroup": "shoulders",
        "equipment": "barbell",
        "instructions": "Press bar overhead from shoulders, keep core tight.",
        "type": "strength"
      }
    }
  ]
}
```

---

### 10. GET /api/workouts

Get all workouts for the authenticated user, with pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | int | No | 1 | Page number (1-indexed) |
| `limit` | int | No | 10 | Items per page |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 3,
      "name": "Pull Day",
      "date": "2026-06-30",
      "duration": 40,
      "notes": "Focused on back width",
      "userId": 1,
      "exercises": [
        {
          "id": 7,
          "workoutId": 3,
          "exerciseId": 5,
          "sets": 3,
          "reps": 8,
          "weight": 0,
          "restSeconds": 90,
          "order": 1,
          "exercise": {
            "id": 5,
            "name": "Pull Ups",
            "muscleGroup": "back",
            "equipment": "bodyweight",
            "instructions": "Pull chin over bar, lower with control.",
            "type": "strength"
          }
        }
      ]
    },
    {
      "id": 2,
      "name": "Leg Day",
      "date": "2026-06-29",
      "duration": 50,
      "notes": "New squat PR!",
      "userId": 1,
      "exercises": []
    },
    {
      "id": 1,
      "name": "Push Day",
      "date": "2026-06-28",
      "duration": 45,
      "notes": "Good session, increased bench weight",
      "userId": 1,
      "exercises": []
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10
}
```

Workouts are ordered by date descending (newest first). Each workout includes its exercises with the full exercise data eagerly loaded.

---

### 11. GET /api/workouts/:id

Get a single workout by ID. The workout must belong to the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Push Day",
  "date": "2026-06-28",
  "duration": 45,
  "notes": "Good session, increased bench weight",
  "userId": 1,
  "exercises": [
    {
      "id": 1,
      "workoutId": 1,
      "exerciseId": 1,
      "sets": 4,
      "reps": 8,
      "weight": 80,
      "restSeconds": 90,
      "order": 1,
      "exercise": {
        "id": 1,
        "name": "Bench Press",
        "muscleGroup": "chest",
        "equipment": "barbell",
        "instructions": "Lie on flat bench, lower bar to mid-chest, press up.",
        "type": "strength"
      }
    }
  ]
}
```

**Error Responses:**
```json
// 404 — Not found
{
  "message": "Workout #999 not found",
  "error": "Not Found",
  "statusCode": 404
}

// 403 — Belongs to another user
{
  "message": "Access denied",
  "error": "Forbidden",
  "statusCode": 403
}
```

---

### 12. PATCH /api/workouts/:id

Update a workout. Exercises can be replaced entirely by providing the `exercises` array.

**Headers:** `Authorization: Bearer <token>`

**Request (partial update — name only):**
```json
{
  "name": "Updated Push Day"
}
```

**Request (update with exercise replacement):**
```json
{
  "name": "Push Day V2",
  "duration": 50,
  "exercises": [
    {
      "exerciseId": 1,
      "sets": 5,
      "reps": 5,
      "weight": 85,
      "restSeconds": 120,
      "order": 1
    }
  ]
}
```

**Response (200):** Same format as GET /api/workouts/:id.

When exercises are provided in the update, **all existing exercises are deleted and replaced** with the new set.

---

### 13. DELETE /api/workouts/:id

Delete a workout. The cascade delete removes all associated WorkoutExercise records.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):** (No content body)

---

### 14. POST /api/progress

Create a new progress entry. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "date": "2026-07-06",
  "weight": 81.0,
  "bodyFat": 14.8,
  "notes": "New low in body fat!"
}
```

**Success Response (201):**
```json
{
  "id": 6,
  "userId": 1,
  "date": "2026-07-06",
  "weight": 81,
  "bodyFat": 14.8,
  "notes": "New low in body fat!"
}
```

---

### 15. GET /api/progress

Get all progress entries for the authenticated user, ordered by date descending (newest first).

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
[
  {
    "id": 5,
    "userId": 1,
    "date": "2026-06-29",
    "weight": 80.5,
    "bodyFat": 15.0,
    "notes": "End of month check"
  },
  {
    "id": 4,
    "userId": 1,
    "date": "2026-06-22",
    "weight": 80.0,
    "bodyFat": 15.3,
    "notes": "Strong progress"
  },
  {
    "id": 3,
    "userId": 1,
    "date": "2026-06-15",
    "weight": 79.2,
    "bodyFat": 15.5,
    "notes": "Gaining lean mass"
  },
  {
    "id": 2,
    "userId": 1,
    "date": "2026-06-08",
    "weight": 78.5,
    "bodyFat": 15.8,
    "notes": "Week 1"
  },
  {
    "id": 1,
    "userId": 1,
    "date": "2026-06-01",
    "weight": 78.0,
    "bodyFat": 16.0,
    "notes": "Start of month"
  }
]
```

---

### 16. GET /api/progress/:id

Get a single progress entry by ID.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "id": 1,
  "userId": 1,
  "date": "2026-06-01",
  "weight": 78.0,
  "bodyFat": 16.0,
  "notes": "Start of month"
}
```

**Error Response:**
```json
// 404
{
  "message": "Progress entry #999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### 17. PATCH /api/progress/:id

Update a progress entry. Requires authentication. Only the entry owner can update.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "weight": 81.5,
  "bodyFat": 14.5
}
```

**Success Response (200):**
```json
{
  "id": 6,
  "userId": 1,
  "date": "2026-07-06",
  "weight": 81.5,
  "bodyFat": 14.5,
  "notes": "New low in body fat!"
}
```

---

### 18. DELETE /api/progress/:id

Delete a progress entry. Requires authentication. Only the entry owner can delete.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):** (No content body)
