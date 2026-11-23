# PageTurner — E-Commerce Bookstore Backend API

**Author / Student Name:** [Your Name Here]  
**Course:** Web Application & Mobile Development (WAMD) — TD/TP 3  
**Institution:** University Coursework  
**Date:** November 2026  
**Application Concept:** PageTurner — Independent Bookstore REST API  

---

## 1. Project Overview

PageTurner is a lightweight, secure RESTful API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**. It serves as the backend engine for the PageTurner online bookstore (extending the React + Redux bookstore application developed in TD/TP 2).

### Key Features
- **User Authentication:** Registration and login with password hashing via `bcryptjs` and stateless session management via **JSON Web Tokens (JWT)**.
- **Product Catalog Management (CRUD):** Full Create, Read, Update, and Delete operations for bookstore inventory.
- **OAuth 2.0 / OpenID Connect:** Google OAuth 2.0 integration allowing users to sign in with their Google accounts.
- **API Security & Rate Limiting:** Brute-force and DoS protection using `express-rate-limit` (strict limits on login, general limits on catalog endpoints).
- **Robust Error Handling:** Centralized JSON error handling for validation errors, duplicate keys, malformed IDs, and missing routes.

---

## 2. Technologies Used

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v5)
- **Database:** MongoDB (Local or MongoDB Atlas)
- **ODM (Object Data Modeling):** Mongoose (v9)
- **Security & Tokens:** `jsonwebtoken` (JWT), `bcryptjs`
- **OAuth 2.0 Authentication:** `passport`, `passport-google-oauth20`, `google-auth-library`
- **Rate Limiting:** `express-rate-limit`
- **CORS Support:** `cors`
- **Environment Management:** `dotenv`
- **API Testing:** Postman & Thunder Client

---

## 3. Project Directory Structure

```text
PageTurner-Backend/
├── src/
│   ├── config/
│   │   ├── db.js             # Mongoose connection configuration
│   │   └── passport.js       # Passport.js Google OAuth 2.0 strategy setup
│   ├── controllers/
│   │   ├── authController.js # Auth logic: register, login, profile, OAuth exchange
│   │   └── productController.js # Product CRUD business logic
│   ├── data/
│   │   └── seed.js           # Safe seeding script with 8 realistic books
│   ├── middleware/
│   │   ├── authMiddleware.js # JWT Bearer token verification middleware
│   │   ├── errorMiddleware.js# 404 handler and centralized JSON error responses
│   │   └── rateLimitMiddleware.js # General and strict login rate limiters
│   ├── models/
│   │   ├── Product.js        # Mongoose schema for bookstore products
│   │   └── User.js           # Mongoose schema for user accounts & credentials
│   ├── routes/
│   │   ├── authRoutes.js     # /api/auth routes (register, login, google OAuth)
│   │   └── productRoutes.js  # /api/products routes (CRUD operations)
│   ├── app.js                # Express application configuration & middleware stack
│   └── server.js             # Server startup and MongoDB connection entry point
├── test/
│   └── api.test.js           # Verification test suite
├── .env                      # Local environment configuration (ignored by git)
├── .env.example              # Example environment template
├── .gitignore                # Git ignore rules for node_modules and secrets
├── package.json              # Project dependencies and npm scripts
├── PageTurner_API.postman_collection.json # Ready-to-import Postman test collection
└── README.md                 # Complete documentation
```

---

## 4. Database Models

### User Model (`src/models/User.js`)
| Field | Type | Required | Description |
|---|---|---|---|
| `name` | String | Yes | User's full name (min 2, max 100 characters). |
| `email` | String | Yes | Unique, lowercase, validated email format. |
| `passwordHash` | String | Conditional | Bcrypt hash (salt rounds: 10). Required unless registered via Google OAuth. Never returned in JSON responses. |
| `googleId` | String | No | Unique Google profile identifier for OAuth users. |
| `avatar` | String | No | Profile picture URL from OAuth. |
| `createdAt` / `updatedAt` | Date | Auto | Timestamps handled automatically by Mongoose. |

### Product Model (`src/models/Product.js`)
| Field | Type | Required | Description |
|---|---|---|---|
| `name` | String | Yes | Title of the book (min 1, max 200 chars). |
| `description` | String | Yes | Book synopsis or overview (min 5 chars). |
| `price` | Number | Yes | Non-negative price in USD ($) (min: 0). |
| `category` | String | Yes | Genre (e.g., Fiction, Sci-Fi, Technology, Mystery, Biography). |
| `imageUrl` | String | No | Book cover image URL (sensible default provided). |
| `stock` | Number | Yes | Inventory count as a non-negative integer (min: 0). |
| `createdAt` / `updatedAt` | Date | Auto | Timestamps handled automatically by Mongoose. |

---

## 5. API Endpoints Specification

| Method | Endpoint | Access | Rate Limit | Description |
|---|---|---|---|---|
| `GET` | `/api/health` | Public | General | Health check and server diagnostic |
| `POST` | `/api/auth/register` | Public | General | Register a new user |
| `POST` | `/api/auth/login` | Public | **5 req / 15 min** | Log in with email and password to obtain JWT |
| `GET` | `/api/auth/me` | **JWT Required** | General | Get current authenticated user profile |
| `GET` | `/api/auth/google` | Public | General | Initiate Google OAuth 2.0 consent flow |
| `GET` | `/api/auth/google/callback` | Public | General | Google OAuth 2.0 callback and token issuance |
| `POST` | `/api/auth/google/verify-token` | Public | General | Verify Google ID token (for Postman / SPAs) |
| `GET` | `/api/products` | Public | General | Retrieve all products (supports category/search) |
| `GET` | `/api/products/:id` | Public | General | Retrieve a single product by MongoDB ObjectId |
| `POST` | `/api/products` | **JWT Required** | General | Create a new product in catalog |
| `PUT` | `/api/products/:id` | **JWT Required** | General | Update an existing product |
| `DELETE` | `/api/products/:id` | **JWT Required** | General | Delete a product from catalog |

---

## 6. Authentication Architecture

### JSON Web Tokens (JWT)
1. When a user logs in successfully via `/api/auth/login` (or completes Google OAuth), the server issues a signed JSON Web Token containing:
   ```json
   {
     "id": "<user_id>",
     "email": "user@example.com",
     "name": "User Name"
   }
   ```
2. The client must include this token in the HTTP `Authorization` header for protected endpoints:
   ```http
   Authorization: Bearer <your_jwt_token_here>
   ```
3. The `authMiddleware.js`:
   - Checks for the header and parses the `Bearer` token.
   - Verifies the signature using `process.env.JWT_SECRET`.
   - Checks expiration (`JWT_EXPIRES_IN`, default 1 day).
   - Rejects unauthorized requests with **HTTP 401 Unauthorized**.

### OAuth 2.0 & OpenID Connect (Google)
- **Why OAuth 2.0?** It delegates authentication to a trusted identity provider (Google) without asking the user to share their Google credentials with PageTurner.
- **Provider Token vs Application JWT:**
  - The Google ID token or authorization code proves the user's identity to *our server*.
  - Once verified, **our server issues our own PageTurner JWT**. This ensures that all downstream protected endpoints (`POST /api/products`, etc.) continue to use a uniform authorization mechanism without querying Google on every single request.
- **Configuring Google OAuth:**
  1. Open [Google Cloud Console](https://console.cloud.google.com/).
  2. Create a project and navigate to **APIs & Services > Credentials**.
  3. Create an **OAuth 2.0 Client ID** with Application Type: **Web Application**.
  4. Under **Authorized redirect URIs**, add:
     `http://localhost:3000/api/auth/google/callback`
  5. Copy your **Client ID** and **Client Secret** into your `.env` file.

---

## 7. Rate Limiting Configuration

Implemented using `express-rate-limit`:
1. **General API Limiter:**
   - Applied to all routes under `/api/*`.
   - Maximum **100 requests per 15 minutes** per client IP.
   - Headers returned: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.
2. **Strict Login Limiter:**
   - Applied specifically to `POST /api/auth/login`.
   - Maximum **5 requests per 15 minutes** per client IP.
   - Prevents credential-stuffing and brute-force password guessing.
   - Returns **HTTP 429 Too Many Requests** with clear JSON explanation.
   - Configured with `skip` on the general limiter so that login attempts are not unfairly double-counted.

---

## 8. Installation & Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or newer)
- [MongoDB](https://www.mongodb.com/) (Local Community Edition or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- [Git](https://git-scm.com/)
- [Postman](https://www.postman.com/) or Thunder Client for API testing

### Step 1: Install Dependencies
Open your terminal in the project directory:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and verify the settings:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pageturner
JWT_SECRET=pageturner_super_secure_jwt_secret_key_2026_wamd_tp3
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```
*(If you are using MongoDB Atlas, replace `MONGODB_URI` with your connection string: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/pageturner?retryWrites=true&w=majority`)*

### Step 3: Seed the Database
Populate the database with 8 realistic bookstore products (Fiction, Sci-Fi, Technology, Mystery, Biography):
```bash
npm run seed
```
*(The seed script is safe and idempotent: running it multiple times updates existing entries and avoids duplicates).*

### Step 4: Start the Server
Start the development server:
```bash
npm run dev
# or for production mode:
npm start
```
The server will connect to MongoDB first, then start listening on `http://localhost:3000`.

---

## 9. API Testing Guide (Postman & Thunder Client)

A pre-configured Postman collection is included: `PageTurner_API.postman_collection.json`.

### How to Import and Run the Postman Collection:
1. Open Postman.
2. Click **Import** (top left) and select `PageTurner_API.postman_collection.json`.
3. The collection includes pre-request scripts and test assertions that automatically save the returned JWT token to `{{token}}` and created product ID to `{{productId}}`.

### Sequential Test Walkthrough:

#### Authentication Tests
1. **Register New User:**
   - `POST /api/auth/register` with body `{"name":"Jane Doe","email":"jane@example.com","password":"Password123!"}`
   - Status: `201 Created`. Verify `passwordHash` is **not** present in response.
2. **Duplicate Email Rejection:**
   - `POST /api/auth/register` with the same email.
   - Status: `409 Conflict`.
3. **Invalid Credentials Login:**
   - `POST /api/auth/login` with wrong password.
   - Status: `401 Unauthorized`.
4. **Valid Credentials Login:**
   - `POST /api/auth/login` with correct password.
   - Status: `200 OK`. Token is returned and automatically saved to `{{token}}`.
5. **Get Profile (Verify Token):**
   - `GET /api/auth/me` with header `Authorization: Bearer {{token}}`.
   - Status: `200 OK`.

#### Product CRUD Tests
6. **Retrieve All Products (Public):**
   - `GET /api/products` (no token needed).
   - Status: `200 OK`. Returns the 8 books seeded in the catalog.
7. **Create Product (Protected):**
   - `POST /api/products` with `Authorization: Bearer {{token}}` and book JSON.
   - Status: `201 Created`. Product ID is saved to `{{productId}}`.
8. **Retrieve Single Product (Public):**
   - `GET /api/products/{{productId}}`.
   - Status: `200 OK`.
9. **Update Product (Protected):**
   - `PUT /api/products/{{productId}}` with updated price/stock.
   - Status: `200 OK`.
10. **Delete Product (Protected):**
    - `DELETE /api/products/{{productId}}`.
    - Status: `200 OK`. Re-fetching returns `404 Not Found`.

#### Security & Edge-Case Tests
11. **Create Without Token:**
    - `POST /api/products` with no `Authorization` header.
    - Status: `401 Unauthorized`.
12. **Create With Tampered Token:**
    - `POST /api/products` with `Authorization: Bearer invalidtoken123`.
    - Status: `401 Unauthorized`.
13. **Malformed MongoDB ID:**
    - `GET /api/products/123-bad-id`.
    - Status: `400 Bad Request`.
14. **Invalid Product Data:**
    - `POST /api/products` with `price: -10`.
    - Status: `400 Bad Request`.

#### Rate Limiting Tests
15. **Login Brute-Force Protection:**
    - Send 6 rapid login attempts to `POST /api/auth/login`.
    - On the 6th attempt, response is `429 Too Many Requests`.

---

## 10. Expected HTTP Status Codes Summary

- `200 OK`: Successful data retrieval, product update, product deletion, or login.
- `201 Created`: Successful user registration or product creation.
- `400 Bad Request`: Validation failure, missing required fields, or malformed MongoDB ObjectId.
- `401 Unauthorized`: Missing, invalid, or expired JWT token, or incorrect login credentials.
- `404 Not Found`: Route does not exist or requested product ID is not found.
- `409 Conflict`: Attempted registration with an already registered email address.
- `429 Too Many Requests`: Rate limit exceeded (more than 5 login attempts or 100 API requests within 15 minutes).
- `500 Internal Server Error`: Unexpected database or runtime error.

---

## 11. Security Best Practices Implemented

- Passwords are salted and hashed with **bcryptjs** (10 salt rounds).
- Password hashes and internal Mongoose fields (`__v`) are stripped from JSON serialization.
- JWT tokens expire in 1 day; secrets are loaded strictly from environment variables.
- Environment secrets are excluded from Git via `.gitignore`.
- Rate limiting prevents brute-force login attacks.
- Strict input validation prevents database pollution.
- CORS restricted to allowed client origin.
