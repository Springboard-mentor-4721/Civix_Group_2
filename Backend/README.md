# Civix Backend — Module 1

Module 1 implements the backend foundation for:
- Citizen/official registration
- Secure password hashing
- JWT login
- Authentication middleware
- Role-based authorization
- User location
- Verification status field
- Protected `/me` endpoint

## Prerequisites
- Node.js LTS
- MongoDB local installation OR a MongoDB Atlas connection string
- Postman (recommended)

## Setup

1. Open this folder in VS Code.
2. Run:
   npm install
3. Copy `.env.example` to `.env`.
4. Set `MONGO_URI` and `JWT_SECRET`.
5. Start:
   npm run dev

Server:
http://localhost:5000

## Test endpoints

GET `/api/health`

POST `/api/auth/register`

Example:
{
  "name": "Test Citizen",
  "email": "citizen@example.com",
  "password": "test1234",
  "role": "citizen",
  "location": "Solapur"
}

POST `/api/auth/login`

Example:
{
  "email": "citizen@example.com",
  "password": "test1234"
}

GET `/api/auth/me`
Header:
Authorization: Bearer <JWT_TOKEN>

GET `/api/auth/official-test`
Use an official JWT. A citizen should receive 403.

## Important
Do not commit `.env` to Git. `.gitignore` already excludes it.

## Extending to later milestones

Keep future modules separated:
- `models/Petition.js`
- `models/Signature.js`
- `models/Poll.js`
- `models/Vote.js`
- `models/AdminLog.js`

and corresponding controllers/routes. This keeps Module 1 stable while adding later functionality.
