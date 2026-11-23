/**
 * Comprehensive Full-Stack End-to-End Integration Test Suite for PageTurner (TD-TP 4)
 * Tests complete React Redux frontend services <-> Express REST API <-> MongoDB flow.
 */

import http from 'http';

const API_BASE = 'http://localhost:3000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function runIntegrationTests() {
  console.log('======================================================================');
  console.log('  PageTurner Full-Stack Integration Verification Suite (TD-TP 4)');
  console.log('  Frontend (React/Redux) <-> Backend (Express API) <-> MongoDB');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} -> ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('--- Phase 1: API Connectivity & Health Check ---');
    const health = await request('/health');
    assert(health.status === 200 && health.data.success === true, '1. Health endpoint returns 200 OK');

    // 2. Fetch Catalog
    console.log('\n--- Phase 2: MongoDB Live Product Retrieval ---');
    const productsRes = await request('/products');
    assert(
      productsRes.status === 200 &&
      productsRes.data.success === true &&
      Array.isArray(productsRes.data.products) &&
      productsRes.data.products.length >= 8,
      `2. Live MongoDB catalog retrieved (${productsRes.data.products?.length} books, expected >= 8)`
    );

    const firstProduct = productsRes.data.products[0];
    assert(
      Boolean(firstProduct._id && firstProduct.name && firstProduct.price && firstProduct.category),
      `3. Product structure contains required MongoDB schema fields (_id: ${firstProduct._id}, name: "${firstProduct.name}")`
    );

    // 3. User Registration
    console.log('\n--- Phase 3: User Registration Flow ---');
    const uniqueEmail = `fullstack.tester.${Date.now()}@pageturner.com`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Fullstack Test User',
        email: uniqueEmail,
        password: 'Password123!'
      })
    });
    assert(
      regRes.status === 201 && regRes.data.success === true && regRes.data.user.email === uniqueEmail,
      `4. User registration succeeds with 201 Created (Email: ${uniqueEmail})`
    );
    assert(
      regRes.data.user.passwordHash === undefined,
      '5. Security: passwordHash is not exposed in registration response'
    );

    // Duplicate registration should return 409
    const dupRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate User',
        email: uniqueEmail,
        password: 'Password123!'
      })
    });
    assert(
      dupRes.status === 409 && dupRes.data.success === false,
      '6. Duplicate registration returns 409 Conflict'
    );

    // 4. User Login & JWT Authentication
    console.log('\n--- Phase 4: User Authentication & JWT Issuance ---');
    // Wrong password
    const wrongLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: uniqueEmail, password: 'WrongPassword!' })
    });
    assert(wrongLogin.status === 401, '7. Login with invalid password returns 401 Unauthorized');

    // Valid credentials
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: uniqueEmail, password: 'Password123!' })
    });
    assert(
      loginRes.status === 200 &&
      loginRes.data.success === true &&
      typeof loginRes.data.token === 'string' &&
      loginRes.data.token.length > 20,
      '8. Login succeeds with 200 OK and valid JWT token issued'
    );

    const token = loginRes.data.token;

    // Verify GET /api/auth/me with Bearer token
    const meRes = await request('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(
      meRes.status === 200 &&
      meRes.data.success === true &&
      meRes.data.user.email === uniqueEmail,
      `9. GET /api/auth/me returns authenticated user identity (${meRes.data.user.name})`
    );

    // 5. Protected Product CRUD Operations
    console.log('\n--- Phase 5: Protected Product CRUD Operations ---');
    // Reject creation without JWT
    const unauthCreate = await request('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Unauthorized Book',
        description: 'Should fail',
        price: 2000,
        category: 'Fiction',
        stock: 5
      })
    });
    assert(unauthCreate.status === 401, '10. Product creation without JWT rejected with 401');

    // Valid product creation with JWT
    const newBookPayload = {
      name: 'Full-Stack JavaScript Architecture',
      description: 'An in-depth guide to modern React and Express development.',
      price: 3600,
      category: 'Computer Science',
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=500&q=80'
    };

    const createRes = await request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(newBookPayload)
    });
    assert(
      createRes.status === 201 &&
      createRes.data.success === true &&
      createRes.data.product.name === newBookPayload.name,
      `11. POST /api/products with JWT creates product in MongoDB (ID: ${createRes.data.product?._id})`
    );

    const createdId = createRes.data.product._id;

    // Retrieve created product by ID (GET /api/products/:id)
    const getByIdRes = await request(`/products/${createdId}`);
    assert(
      getByIdRes.status === 200 &&
      getByIdRes.data.success === true &&
      getByIdRes.data.product._id === createdId,
      '12. GET /api/products/:id retrieves the created product from MongoDB'
    );

    // Update product with JWT (PUT /api/products/:id)
    const updateRes = await request(`/products/${createdId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        price: 3900,
        stock: 25,
        name: 'Full-Stack JavaScript Architecture (2nd Edition)'
      })
    });
    assert(
      updateRes.status === 200 &&
      updateRes.data.success === true &&
      updateRes.data.product.price === 3900 &&
      updateRes.data.product.stock === 25,
      '13. PUT /api/products/:id with JWT updates price and stock in MongoDB'
    );

    // Delete product with JWT (DELETE /api/products/:id)
    const deleteRes = await request(`/products/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(
      deleteRes.status === 200 && deleteRes.data.success === true,
      '14. DELETE /api/products/:id with JWT deletes the product from MongoDB'
    );

    // Verify deletion returns 404
    const verifyDelete = await request(`/products/${createdId}`);
    assert(
      verifyDelete.status === 404 && verifyDelete.data.success === false,
      '15. GET /api/products/:id on deleted book returns 404 Not Found'
    );

    console.log('\n======================================================================');
    console.log(`  Integration Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Integration Test Failure:', err);
    process.exit(1);
  }
}

runIntegrationTests();
