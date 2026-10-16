Yes. For the team, the README can be much shorter while still covering everything needed to **run Milestone 1 backend and connect the frontend**.

Replace your root `README.md` with this:

````markdown
# Civix – Milestone 1

Backend for user registration and authentication.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT
- bcrypt

## Features

- Citizen registration
- Official registration
- Login
- JWT authentication
- Role-based authorization
- User location
- Protected `/me` API
- Input validation

## Project Structure

```text
Civix_Group_2/
├── Backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── README.md
````

## Setup

### 1. Clone

```bash
git clone https://github.com/Springboard-mentor-4721/Civix_Group_2.git
cd Civix_Group_2
git checkout milestone_1
```

### 2. Backend

```bash
cd Backend
npm install
```

### 3. MongoDB

Install MongoDB Community Server and MongoDB Compass.

Connect Compass to:

```text
mongodb://127.0.0.1:27017
```

Database used:

```text
civix
```

Collection:

```text
users
```

The database/collection will be created automatically when data is inserted.

### 4. Environment Variables

Create `.env` inside `Backend`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/civix
JWT_SECRET=your_private_secret
JWT_EXPIRES_IN=1d
```

**Do not upload `.env` to GitHub.**

### 5. Run Backend

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

## APIs

| Method | Endpoint             | Purpose                   |
| ------ | -------------------- | ------------------------- |
| POST   | `/api/auth/register` | Register citizen/official |
| POST   | `/api/auth/login`    | Login                     |
| GET    | `/api/auth/me`       | Get logged-in user        |

Protected APIs require:

```text
Authorization: Bearer <JWT>
```

## Frontend Connection

Frontend connects to:

```text
http://localhost:5000
```

Architecture:

```text
Frontend → Express Backend → MongoDB
```

The frontend **does not connect directly to MongoDB**.

## Git

For Milestone 1:

```bash
git checkout milestone_1
git pull origin milestone_1
```

After changes:

```bash
git add .
git commit -m "Update Milestone 1 backend"
git push origin milestone_1
```

Never push directly to `main`.

## Milestone 1 Status

* ✅ Registration
* ✅ Login
* ✅ JWT authentication
* ✅ Password hashing
* ✅ Role authorization
* ✅ MongoDB
* ✅ Location
* ⏳ GPS/actual geolocation
* ⏳ Optional ID verification
* ⏳ Frontend integration


