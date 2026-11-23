/**
 * Automated Verification Test Suite for PageTurner Backend
 * Tests:
 * 1. Health check & Diagnostics (200)
 * 2. Unmatched routes 404 handler (404)
 * 3. JWT Authentication Middleware (missing token, invalid format, tampered token, expired token, valid token)
 * 4. User Registration (missing fields, invalid email format, short password, duplicate 409, passwordHash excluded)
 * 5. User Login & Profile (wrong password 401, valid credentials 200 + valid JWT, GET /api/auth/me)
 * 6. Rate Limiting (Strict login limit triggers 429 after 5 requests)
 * 7. Product CRUD Operations (getAll, getById, create, update, delete)
 * 8. Product Input Validation (non-negative price, non-negative integer stock, missing fields, malformed ID)
 * 9. OAuth token verification endpoint validation
 */

const request = require('supertest');
const mockingoose = require('mockingoose').default || require('mockingoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Configure test environment variables before importing app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_super_secret_jwt_key_pageturner_tp3';
process.env.JWT_EXPIRES_IN = '1d';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const authMiddleware = require('../src/middleware/authMiddleware');

async function runTestSuite() {
  console.log('=================================================================');
  console.log('  PageTurner Backend Verification & Quality Assurance Suite');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} -> ${details}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // GROUP 1: HEALTH CHECK & ROUTING
    // -------------------------------------------------------------
    console.log('--- Group 1: Health Check & Unknown Route Handling ---');

    // Test 1: Health Check
    {
      const res = await request(app).get('/api/health');
      assert(res.status === 200 && res.body.success === true, 'Test 1: GET /api/health returns 200 OK');
    }

    // Test 2: Unknown route returns structured 404
    {
      const res = await request(app).get('/api/unregistered-path-xyz');
      assert(
        res.status === 404 && res.body.success === false && res.body.error.includes('Route not found'),
        'Test 2: Unknown route returns 404 with structured JSON'
      );
    }

    // -------------------------------------------------------------
    // GROUP 2: JWT AUTHENTICATION MIDDLEWARE
    // -------------------------------------------------------------
    console.log('\n--- Group 2: JWT Authentication Middleware Verification ---');

    // Test 3: Missing Authorization header
    {
      const req = { headers: {} };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status: (s) => {
          statusCalled = s;
          return {
            json: (j) => {
              jsonCalled = j;
            }
          };
        }
      };
      authMiddleware(req, res, () => {});
      assert(
        statusCalled === 401 && jsonCalled.success === false,
        'Test 3: Request without Authorization header rejected with 401'
      );
    }

    // Test 4: Malformed Authorization header (missing 'Bearer')
    {
      const req = { headers: { authorization: 'Basic someCredentials123' } };
      let statusCalled = null;
      const res = {
        status: (s) => {
          statusCalled = s;
          return { json: () => {} };
        }
      };
      authMiddleware(req, res, () => {});
      assert(
        statusCalled === 401,
        'Test 4: Request with non-Bearer Authorization header rejected with 401'
      );
    }

    // Test 5: Invalid/tampered JWT token
    {
      const req = { headers: { authorization: 'Bearer invalid_tampered_token' } };
      let statusCalled = null;
      const res = {
        status: (s) => {
          statusCalled = s;
          return { json: () => {} };
        }
      };
      authMiddleware(req, res, () => {});
      assert(
        statusCalled === 401,
        'Test 5: Request with tampered JWT token rejected with 401'
      );
    }

    // Test 6: Expired JWT token
    {
      const expiredToken = jwt.sign(
        { id: '123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );
      const req = { headers: { authorization: `Bearer ${expiredToken}` } };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status: (s) => {
          statusCalled = s;
          return {
            json: (j) => {
              jsonCalled = j;
            }
          };
        }
      };
      authMiddleware(req, res, () => {});
      assert(
        statusCalled === 401 && jsonCalled.error.includes('expired'),
        'Test 6: Expired JWT token rejected with 401 and expiration message'
      );
    }

    // Test 7: Valid JWT token attaches user to request
    {
      const validToken = jwt.sign(
        { id: '507f1f77bcf86cd799439011', email: 'alice@example.com', name: 'Alice' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      const req = { headers: { authorization: `Bearer ${validToken}` } };
      let nextCalled = false;
      const res = {};
      authMiddleware(req, res, () => {
        nextCalled = true;
      });
      assert(
        nextCalled && req.user && req.user.email === 'alice@example.com',
        'Test 7: Valid JWT token successfully decoded and attached to req.user'
      );
    }

    // -------------------------------------------------------------
    // GROUP 3: USER REGISTRATION & AUTHENTICATION CONTROLLER
    // -------------------------------------------------------------
    console.log('\n--- Group 3: User Registration & Login Validation ---');

    // Test 8: Register validation - missing fields
    {
      const res = await request(app).post('/api/auth/register').send({ name: 'Incomplete' });
      assert(
        res.status === 400 && res.body.success === false,
        'Test 8: POST /api/auth/register with missing fields returns 400'
      );
    }

    // Test 9: Register validation - invalid email format
    {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'not-an-email', password: 'Password123!' });
      assert(
        res.status === 400 && res.body.error.includes('valid email'),
        'Test 9: POST /api/auth/register with invalid email format returns 400'
      );
    }

    // Test 10: Register validation - password too short (< 6 chars)
    {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: '123' });
      assert(
        res.status === 400 && res.body.error.includes('at least 6 characters'),
        'Test 10: POST /api/auth/register with short password returns 400'
      );
    }

    // Test 11: Duplicate email rejection (409 Conflict)
    {
      mockingoose(User).toReturn(
        { _id: '507f1f77bcf86cd799439011', email: 'duplicate@example.com' },
        'findOne'
      );
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Duplicate User', email: 'duplicate@example.com', password: 'Password123!' });
      assert(
        res.status === 409 && res.body.success === false,
        'Test 11: POST /api/auth/register with duplicate email returns 409 Conflict'
      );
      mockingoose(User).reset();
    }

    // Test 12: Successful Registration (excludes passwordHash)
    {
      mockingoose(User).toReturn(null, 'findOne');
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New Bookworm', email: 'bookworm@example.com', password: 'Password123!' });
      assert(
        res.status === 201 &&
          res.body.success === true &&
          res.body.user.email === 'bookworm@example.com' &&
          res.body.user.passwordHash === undefined,
        'Test 12: POST /api/auth/register creates user and excludes passwordHash'
      );
      mockingoose(User).reset();
    }

    // Test 13: User Model password comparison
    {
      const plainPassword = 'SecretPassword123!';
      const hash = await bcrypt.hash(plainPassword, 10);
      const userDoc = new User({
        name: 'Test Hash',
        email: 'hash@example.com',
        passwordHash: hash
      });
      const match = await userDoc.comparePassword(plainPassword);
      const mismatch = await userDoc.comparePassword('WrongPassword');
      assert(match === true && mismatch === false, 'Test 13: User.comparePassword correctly validates bcrypt hash');
    }

    // Test 14: Login with non-existent user (401 Unauthorized)
    {
      mockingoose(User).toReturn(null, 'findOne');
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'AnyPassword123' });
      assert(
        res.status === 401 && res.body.error === 'Invalid email or password',
        'Test 14: POST /api/auth/login with unknown email returns 401 Unauthorized'
      );
      mockingoose(User).reset();
    }

    // Test 15: Login with valid credentials returns 200 and valid JWT
    let generatedToken = '';
    {
      const validPassword = 'CorrectPassword123';
      const passwordHash = await bcrypt.hash(validPassword, 10);
      const fakeUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Bob Reader',
        email: 'bob@example.com',
        passwordHash,
        comparePassword: async (candidate) => bcrypt.compare(candidate, passwordHash)
      };
      mockingoose(User).toReturn(fakeUser, 'findOne');
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bob@example.com', password: validPassword });
      generatedToken = res.body.token;
      assert(
        res.status === 200 &&
          res.body.success === true &&
          typeof generatedToken === 'string' &&
          generatedToken.length > 20,
        'Test 15: POST /api/auth/login with valid credentials returns 200 and JWT token'
      );
      mockingoose(User).reset();
    }

    // Test 16: Access protected profile route with generated JWT
    {
      mockingoose(User).toReturn(
        { _id: '507f1f77bcf86cd799439011', name: 'Bob Reader', email: 'bob@example.com' },
        'findOne'
      );
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${generatedToken}`);
      assert(
        res.status === 200 && res.body.success === true && res.body.user.email === 'bob@example.com',
        'Test 16: GET /api/auth/me returns authenticated user details using JWT'
      );
      mockingoose(User).reset();
    }

    // -------------------------------------------------------------
    // GROUP 4: RATE LIMITING VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- Group 4: Rate Limiting (5 Attempts / 15 Mins) ---');

    // Test 17: Strict login rate limit (5 attempts max, 6th returns 429)
    {
      let received429 = false;
      for (let i = 1; i <= 6; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: 'rate.limit@test.com', password: 'randomPassword' });
        if (res.status === 429) {
          received429 = true;
          break;
        }
      }
      assert(received429, 'Test 17: POST /api/auth/login triggers HTTP 429 Too Many Requests after limit');
    }

    // -------------------------------------------------------------
    // GROUP 5: PRODUCT CRUD & VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- Group 5: Product CRUD Operations & Data Validation ---');

    const validAuthToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011', email: 'admin@pageturner.com', name: 'Admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Test 18: Retrieve all products (Public - GET /api/products)
    {
      const fakeProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'The Great Gatsby',
          description: 'A classic novel.',
          price: 14.99,
          category: 'Fiction',
          stock: 25
        }
      ];
      mockingoose(Product).toReturn(fakeProducts, 'find');
      const res = await request(app).get('/api/products');
      assert(
        res.status === 200 && res.body.success === true && res.body.products.length === 1,
        'Test 18: GET /api/products returns public catalog list'
      );
      mockingoose(Product).reset();
    }

    // Test 19: Invalid MongoDB ObjectId format (400 Bad Request)
    {
      const res = await request(app).get('/api/products/invalid-mongodb-id-123');
      assert(
        res.status === 400 && res.body.error.includes('Invalid product ID format'),
        'Test 19: GET /api/products/:id with invalid ID format returns 400'
      );
    }

    // Test 20: Non-existent product ID (404 Not Found)
    {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      mockingoose(Product).toReturn(null, 'findOne');
      const res = await request(app).get(`/api/products/${validObjectId}`);
      assert(
        res.status === 404 && res.body.error.includes('Product not found'),
        'Test 20: GET /api/products/:id with non-existent ID returns 404'
      );
      mockingoose(Product).reset();
    }

    // Test 21: Create product without JWT (401 Unauthorized)
    {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: 'Protected Book',
          description: 'Should fail without token',
          price: 20,
          category: 'Fiction',
          stock: 10
        });
      assert(
        res.status === 401,
        'Test 21: POST /api/products without JWT token returns 401 Unauthorized'
      );
    }

    // Test 22: Create product with negative price (400 Bad Request)
    {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 'Negative Book',
          description: 'Invalid price book',
          price: -5,
          category: 'Fiction',
          stock: 10
        });
      assert(
        res.status === 400 && res.body.error.includes('Price must be a valid non-negative number'),
        'Test 22: POST /api/products with negative price returns 400'
      );
    }

    // Test 23: Create product with non-integer stock (400 Bad Request)
    {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 'Fractional Stock Book',
          description: 'Invalid stock',
          price: 15,
          category: 'Fiction',
          stock: 3.5
        });
      assert(
        res.status === 400 && res.body.error.includes('Stock must be a valid non-negative integer'),
        'Test 23: POST /api/products with fractional stock returns 400'
      );
    }

    // Test 24: Successful Product Creation with valid JWT (201 Created)
    {
      const newBook = {
        _id: '507f1f77bcf86cd799439022',
        name: 'Clean Architecture',
        description: 'A craftsman’s guide to software structure and design.',
        price: 35.0,
        category: 'Technology',
        stock: 12
      };
      mockingoose(Product).toReturn(newBook, 'save');
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send(newBook);
      assert(
        res.status === 201 && res.body.success === true && res.body.product.name === newBook.name,
        'Test 24: POST /api/products with valid JWT returns 201 and creates product'
      );
      mockingoose(Product).reset();
    }

    // Test 25: Update product with valid JWT (200 OK)
    {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const updatedData = {
        _id: validObjectId,
        name: 'Clean Architecture 2nd Edition',
        price: 39.99,
        stock: 15
      };
      mockingoose(Product).toReturn(updatedData, 'findOneAndUpdate');
      const res = await request(app)
        .put(`/api/products/${validObjectId}`)
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({ price: 39.99, stock: 15 });
      assert(
        res.status === 200 && res.body.success === true && res.body.product.price === 39.99,
        'Test 25: PUT /api/products/:id updates product details and returns 200'
      );
      mockingoose(Product).reset();
    }

    // Test 26: Delete product with valid JWT (200 OK)
    {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      mockingoose(Product).toReturn({ _id: validObjectId }, 'findOneAndDelete');
      const res = await request(app)
        .delete(`/api/products/${validObjectId}`)
        .set('Authorization', `Bearer ${validAuthToken}`);
      assert(
        res.status === 200 && res.body.success === true && res.body.message.includes('deleted'),
        'Test 26: DELETE /api/products/:id removes product and returns 200'
      );
      mockingoose(Product).reset();
    }

    // -------------------------------------------------------------
    // GROUP 6: OAUTH 2.0 INTEGRATION STRUCTURE
    // -------------------------------------------------------------
    console.log('\n--- Group 6: OAuth 2.0 Endpoints & Validation ---');

    // Test 27: Google token verification requires idToken
    {
      const res = await request(app).post('/api/auth/google/verify-token').send({});
      assert(
        res.status === 400 && res.body.error.includes('idToken'),
        'Test 27: POST /api/auth/google/verify-token without token returns 400'
      );
    }

    console.log('\n=================================================================');
    console.log(`  Verification Summary: ${passed} Passed, ${failed} Failed`);
    console.log('=================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal testing error:', err);
    process.exit(1);
  }
}

runTestSuite();
