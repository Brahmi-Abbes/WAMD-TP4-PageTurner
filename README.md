# PageTurner E-Commerce — Full-Stack Application

**Student Name:** Brahmi Abbes  
**Group:** AI Group 1 (AI1)  
**Institution:** Higher National School of Advanced Technologies (ENSTA)  
**Module:** Web Application and Mobile Development (WAMD) — TD-TP 4  
**Date:** November 2026  
**Application Concept:** Full-Stack Online Bookstore (React + Redux + Node.js/Express + MongoDB)

---

## 1. Project Overview

**PageTurner** is a full-stack e-commerce web application created by unifying and extending two previously developed projects:
1. **Frontend (TP2):** A React application styled with a literary theme, utilizing Redux Toolkit and React-Redux for state management.
2. **Backend (TP3):** A Node.js and Express RESTful API with Mongoose Object Data Modeling, JWT token authentication, and security middleware.

In this integration assignment (TD-TP 4), the static mock data has been replaced with live communication between the React frontend, Express REST API, and MongoDB database. Users can register, log in, browse live inventory, manage their shopping bag, and perform complete product CRUD (Create, Read, Update, Delete) operations with Bearer token authentication.

---

## 2. Full-Stack Architecture

The application implements a 3-tier client-server architecture:

```
┌────────────────────────────────────────────────────────┐
│               React 19 Frontend (Vite)                │
│  - Redux Toolkit (cartSlice, authSlice, productSlice)  │
│  - Centralized Axios Client (JWT Bearer Interceptor)   │
│  - UI: Header, BookList, BookCard, Cart, Modals        │
└───────────────────────────┬────────────────────────────┘
                            │
               HTTP / REST API (JSON)
           Port: 5173 ──► Port: 3000
                            │
┌───────────────────────────▼────────────────────────────┐
│              Express.js 5 Backend API                  │
│  - CORS (React Origin Whitelisting)                   │
│  - Security: Rate Limiting & Error Handlers           │
│  - JWT Middleware (authMiddleware)                     │
│  - Controllers: AuthController & ProductController     │
└───────────────────────────┬────────────────────────────┘
                            │
                     Mongoose ODM
                            │
┌───────────────────────────▼────────────────────────────┐
│                   MongoDB Database                     │
│  - Cloud: MongoDB Atlas Cluster                        │
│  - Fallback: In-Memory MongoDB Server (Zero-block dev) │
│  - Collections: users, products                        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Technologies Used

### Frontend (`/frontend`)
- **React:** 19.3.1 (Component architecture, Hooks, Portals)
- **Vite:** 8.3.4 (Build tooling and fast HMR dev server)
- **Redux Toolkit:** 2.13.0 (`configureStore`, `createSlice`, `createAsyncThunk`)
- **React-Redux:** 9.3.0 (`Provider`, `useSelector`, `useDispatch`)
- **Axios:** 1.13.x (Centralized HTTP client with request/response interceptors)
- **CSS:** Plain CSS using responsive design, CSS Grid, Flexbox, and CSS Variables

### Backend (`/backend`)
- **Node.js:** v18+ (Tested on v22.15.0 LTS)
- **Express.js:** 5.3.0 (REST routing, middleware pipeline)
- **Mongoose:** 9.12.3 (MongoDB object data modeling and validation)
- **bcryptjs:** 3.0.3 (Secure 10-round salted password hashing)
- **jsonwebtoken (JWT):** 9.0.3 (Stateless token issuance and verification)
- **express-rate-limit:** 8.7.5 (Brute-force protection on authentication and catalog routes)
- **cors:** 2.8.6 (Cross-Origin Resource Sharing with localhost whitelisting)
- **dotenv:** 18.0.10 (Environment variable management)
- **mongodb-memory-server:** 11.3.0 (In-memory fallback for local verification when Atlas IP is not whitelisted)
- **Supertest & Mockingoose:** Automated testing suite

---

## 4. Project Directory Structure

```text
TP4_Integration/
├── .gitignore                    # Root Git ignore rules (node_modules, .env, dist)
├── README.md                     # Complete project documentation
├── test_integration.mjs          # Automated end-to-end full-stack verification script
│
├── backend/                      # Reused & integrated Express REST API
│   ├── .env.example              # Template for server environment variables
│   ├── .env                      # Local server configuration (Git ignored)
│   ├── package.json              # Backend dependencies and scripts
│   ├── PageTurner_API.postman_collection.json # Postman / Thunder Client collection
│   ├── test/
│   │   └── api.test.js           # 27-point automated API unit test suite
│   └── src/
│       ├── app.js                # Express app setup, CORS, rate limiting, route mounting
│       ├── server.js             # HTTP listener, DB connection, auto-seeding
│       ├── config/
│       │   ├── db.js             # MongoDB connection with Atlas & in-memory fallback
│       │   └── passport.js       # Google OAuth strategy configuration
│       ├── controllers/
│       │   ├── authController.js # Register, login, me, and token verification
│       │   └── productController.js # Product CRUD business logic
│       ├── data/
│       │   └── seed.js           # Seed data with 8 realistic books
│       ├── middleware/
│       │   ├── authMiddleware.js # Bearer token verification middleware
│       │   ├── errorMiddleware.js# Centralized JSON error handling
│       │   └── rateLimitMiddleware.js # Brute-force rate limiting
│       ├── models/
│       │   ├── Product.js        # Mongoose Product schema
│       │   └── User.js           # Mongoose User schema with password hashing
│       └── routes/
│           ├── authRoutes.js     # /api/auth routes
│           └── productRoutes.js  # /api/products routes
│
└── frontend/                     # Reused & integrated React/Redux Bookstore
    ├── .env.example              # Template for frontend environment variables
    ├── .env                      # Local client environment (VITE_API_BASE_URL)
    ├── package.json              # Frontend dependencies and scripts
    ├── index.html                # HTML document entry
    ├── vite.config.js            # Vite configuration
    ├── test_verification.mjs     # 11-point Redux store verification suite
    └── src/
        ├── App.jsx               # Main application layout, state coordinator
        ├── index.css             # Unified styling with warm terracotta theme
        ├── main.jsx              # React entry point with Redux Provider
        ├── app/
        │   └── store.js          # Centralized store (cart, auth, products)
        ├── services/
        │   └── api.js            # Axios client with JWT request interceptor
        ├── features/
        │   ├── auth/
        │   │   └── authSlice.js  # Auth state, loginUser, registerUser, fetchCurrentUser
        │   ├── products/
        │   │   └── productSlice.js # Products state, fetchProducts, CRUD thunks
        │   └── cart/
        │       └── cartSlice.js  # Shopping bag state with localStorage sync
        ├── components/
        │   ├── Header.jsx        # Navigation, greeting, Auth button, Cart count
        │   ├── BookList.jsx      # Catalog section with search, category & sort
        │   ├── BookCard.jsx      # Book item with stock badge, Add, Edit, Delete
        │   ├── BookDetailModal.jsx# Complete book details modal
        │   ├── ProductFormModal.jsx# Create & Edit book modal dialog
        │   ├── AuthModal.jsx     # Tabbed Sign In / Register dialog
        │   ├── Cart.jsx          # Shopping bag sidebar with checkout
        │   └── CartItem.jsx      # Individual line item with stepper
        └── data/
            └── books.js          # Static seed reference & fallback definitions
```

---

## 5. Environment Variables Configuration

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Connection String
# Local MongoDB: mongodb://localhost:27017/pageturner
# MongoDB Atlas: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pageturner?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pageturner?retryWrites=true&w=majority

# JWT Secret & Expiration
JWT_SECRET=your_secure_random_jwt_secret_at_least_32_characters
JWT_EXPIRES_IN=1d

# Allowed React Development Origin
CLIENT_ORIGIN=http://localhost:5173

# Optional: Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```env
# Base URL for the Express REST API
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 6. MongoDB Atlas Configuration

1. Create a free tier (M0) cluster on [MongoDB Atlas](https://cloud.mongodb.com).
2. Under **Database Access**, create a database user with read/write privileges.
3. Under **Network Access**, ensure your current IP address is whitelisted (or add `0.0.0.0/0` to allow access from any IP during development).
4. In the Atlas dashboard, click **Connect** ➔ **Drivers** ➔ **Node.js** to copy your connection string and paste it as `MONGODB_URI` in `backend/.env`.

> **Built-in In-Memory Fallback:** If your Atlas IP address is not whitelisted or you are working offline, the backend automatically falls back to an in-memory MongoDB server via `mongodb-memory-server` and auto-seeds 8 books. This guarantees the entire application remains 100% testable and runnable without blocking.

---

## 7. Database Models

### User Schema (`backend/src/models/User.js`)

| Field | Type | Attributes | Description |
|---|---|---|---|
| `name` | String | Required, Trim, 2-100 chars | User's full name |
| `email` | String | Required, Unique, Lowercase, Regex validation | User's email address |
| `passwordHash` | String | Required for local auth | Salted bcrypt hash (excluded from JSON outputs) |
| `googleId` | String | Optional, Sparse | Google OAuth subject identifier |
| `avatar` | String | Optional | Profile picture URL |
| `timestamps` | Date | Auto (`createdAt`, `updatedAt`) | Audit timestamps |

### Product Schema (`backend/src/models/Product.js`)

| Field | Type | Attributes | Description |
|---|---|---|---|
| `name` | String | Required, Trim, 1-200 chars | Book title |
| `description` | String | Required, Trim, min 5 chars | Book synopsis, author, and details |
| `price` | Number | Required, Min 0 | Price in Algerian Dinars (DA) |
| `category` | String | Required, Trim | Genre (Fiction, Sci-Fi, Technology, etc.) |
| `imageUrl` | String | Default Unsplash cover | URL of book cover image |
| `stock` | Number | Required, Integer, Min 0, Default 0 | Available inventory |
| `timestamps` | Date | Auto (`createdAt`, `updatedAt`) | Audit timestamps |

---

## 8. REST API Endpoints & Access Control

| Method | Endpoint | Access | Required Header | Description |
|---|---|---|---|---|
| `GET` | `/api/health` | Public | None | Health check & uptime status |
| `POST` | `/api/auth/register` | Public | None | Register new user account |
| `POST` | `/api/auth/login` | Public | None | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Protected | `Authorization: Bearer <token>` | Get authenticated user profile |
| `GET` | `/api/products` | Public | None | Retrieve catalog (supports `?category=` & `?search=`) |
| `GET` | `/api/products/:id` | Public | None | Retrieve single product details by MongoDB ID |
| `POST` | `/api/products` | Protected | `Authorization: Bearer <token>` | Create new book in catalog |
| `PUT` | `/api/products/:id` | Protected | `Authorization: Bearer <token>` | Update existing book by MongoDB ID |
| `DELETE` | `/api/products/:id` | Protected | `Authorization: Bearer <token>` | Delete book from catalog by MongoDB ID |

---

## 9. JWT Authentication Flow

1. **Registration (`POST /api/auth/register`):** Validates input, hashes password with bcrypt (10 rounds), saves user in MongoDB, and returns safe user data (without password hash).
2. **Login (`POST /api/auth/login`):** Validates credentials, checks password hash with `bcrypt.compare`, and signs a JWT containing `{ id, email, name }` with a 1-day expiration.
3. **Storage in Frontend:** The React application stores the token in `localStorage.getItem('pageturner_token')` and dispatches `loginUser.fulfilled`.
4. **Automatic Request Attachment:** The centralized Axios client (`src/services/api.js`) uses a request interceptor to attach `Authorization: Bearer <token>` to all outgoing requests.
5. **Session Persistence:** When the user refreshes the page, `App.jsx` reads the stored token and dispatches `fetchCurrentUser()` to verify token validity and restore the user's name and authentication status.
6. **Sign Out:** Dispatches `logout()`, removing the token and user profile from state and `localStorage`.

---

## 10. Product CRUD Workflow

- **Create:** Click "+ Add Book" in the header (visible when logged in) ➔ Fill Title, Category, Price, Stock, Description, Image URL ➔ Submits `POST /api/products` with Bearer token ➔ Live catalog updates immediately.
- **Read:** The catalog automatically queries `GET /api/products` on page load and dynamically lists all MongoDB books with responsive cards, category badges, stock levels, and search filtering.
- **Update:** Click "✎ Edit" on any book card or detail modal ➔ Pre-populates `ProductFormModal` ➔ Submits `PUT /api/products/:id` with Bearer token ➔ Updated values reflect immediately across the app.
- **Delete:** Click "🗑 Delete" on any book card ➔ Opens confirmation dialog ➔ Submits `DELETE /api/products/:id` with Bearer token ➔ Book is removed from MongoDB and catalog state.

---

## 11. Installation & Startup Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Terminal / PowerShell

### Step 1: Backend Setup
```bash
# Navigate to backend directory
cd TP4_Integration/backend

# Install dependencies
npm install

# Start the Express server
npm start
# Alternatively for development with auto-restart:
npm run dev
```
The server will start listening at `http://localhost:3000`.

### Step 2: Frontend Setup
Open a second terminal window:
```bash
# Navigate to frontend directory
cd TP4_Integration/frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The React application will be available at `http://localhost:5173`.

---

## 12. Verification & Testing

### 1. Run Backend Unit Test Suite (27 Tests)
```bash
cd TP4_Integration/backend
npm test
```
*Tests: Health check, route 404, JWT middleware, token expiration, user registration validation, duplicate email rejection, bcrypt verification, login credentials, profile route, rate limiting, and complete product CRUD operations.*

### 2. Run Frontend Redux Test Suite (11 Tests)
```bash
cd TP4_Integration/frontend
npm test
```
*Tests: Redux Toolkit cart actions, empty state, quantity stepper increment/decrement, minimum quantity guard (>= 1), derived totals, item removal, and catalog size.*

### 3. Run Full-Stack Integration Verification Suite (15 Tests)
Ensure the backend server is running on `http://localhost:3000`, then in the root `TP4_Integration/` run:
```bash
node test_integration.mjs
```
*Tests: Live health check, live MongoDB catalog retrieval, registration, login & JWT generation, authenticated profile retrieval, protected product creation, product retrieval by ID, product update, product deletion, and 404 verification.*

---

## 13. Submission Checklist

- [x] **Reused existing React frontend (TP2):** Kept bookstore theme, Redux store, and components.
- [x] **Reused existing Express backend (TP3):** Kept models, controllers, middleware, and routes.
- [x] **Created dedicated integration folder:** `WAMD/TP4_Integration/` with `frontend/` and `backend/`.
- [x] **Excluded sensitive & generated files:** Ignored `.env`, `node_modules/`, and `dist/`.
- [x] **Centralized API client:** Configured Axios with `VITE_API_BASE_URL` and Bearer token interceptor.
- [x] **MongoDB connection:** Configured with MongoDB Atlas and auto-seeding fallback.
- [x] **User Authentication:** Complete registration, login, profile check, and JWT persistence.
- [x] **Product CRUD:** Live MongoDB Add, List, Edit, and Delete operations from the React UI.
- [x] **UX States:** Spinners for loading, alerts for network/validation errors, and success toasts.
- [x] **Postman / Thunder Client collection:** `PageTurner_API.postman_collection.json` included in `backend/`.
- [x] **Screenshots:** Postman/Thunder Client API operation screenshots ready for submission.
