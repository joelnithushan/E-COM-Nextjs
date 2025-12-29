# Backend Testing Guide

This directory contains automated tests for the e-commerce backend.

## Test Structure

```
tests/
├── setup.js                 # Jest setup and teardown
├── helpers/                 # Test utilities
│   ├── testHelpers.js      # Helper functions for creating test data
│   └── appHelper.js        # App instance for testing
├── mocks/                   # External service mocks
│   ├── stripe.mock.js      # Stripe API mock
│   └── cloudinary.mock.js  # Cloudinary API mock
├── unit/                    # Unit tests
│   └── services/           # Service layer tests
│       ├── product.service.test.js
│       ├── auth.service.test.js
│       └── payment.service.test.js
└── api/                     # API integration tests
    ├── products.api.test.js
    └── auth.api.test.js
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run only unit tests
```bash
npm run test:unit
```

### Run only API tests
```bash
npm run test:api
```

## Test Types

### Unit Tests
Test individual services and functions in isolation.

**Location:** `tests/unit/`

**Example:**
```javascript
describe('ProductService', () => {
  it('should return paginated products', async () => {
    const result = await productService.getProducts({ page: 1, limit: 10 });
    expect(result).toHaveProperty('products');
  });
});
```

### API Tests
Test HTTP endpoints and request/response flow.

**Location:** `tests/api/`

**Example:**
```javascript
describe('Product API', () => {
  it('should get all products', async () => {
    const response = await request(app)
      .get('/api/v1/products')
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
  });
});
```

## Test Helpers

### Creating Test Data

```javascript
import { createTestUser, createTestProduct, createTestCategory } from '../helpers/testHelpers.js';

// Create a test user
const user = await createTestUser();

// Create a test admin
const admin = await createTestAdmin();

// Create a test category
const category = await createTestCategory();

// Create a test product
const product = await createTestProduct(category._id);
```

### Authentication Helpers

```javascript
import { generateAuthToken, getAuthHeaders } from '../helpers/testHelpers.js';

// Generate auth token
const token = generateAuthToken(user);

// Get auth headers for requests
const headers = getAuthHeaders(token);
```

## Mocking External Services

### Stripe Mock

```javascript
import { mockStripe } from '../mocks/stripe.mock.js';

// Mock payment intent creation
mockStripe.paymentIntents.create.mockResolvedValue({
  id: 'pi_test_123',
  client_secret: 'pi_test_123_secret',
  status: 'requires_payment_method',
});
```

### Cloudinary Mock

```javascript
import { mockCloudinary } from '../mocks/cloudinary.mock.js';

// Mock image upload
mockCloudinary.uploader.upload.mockResolvedValue({
  public_id: 'test_public_id',
  secure_url: 'https://res.cloudinary.com/test/image.jpg',
});
```

## Test Database

Tests use MongoDB Memory Server for an in-memory database:
- Automatically created before tests
- Automatically cleaned between tests
- Automatically destroyed after tests

No need to configure a separate test database.

## Writing Tests

### Test Structure

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('ServiceName', () => {
  beforeEach(async () => {
    // Setup before each test
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await service.method(input);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should handle errors', async () => {
      await expect(
        service.method('invalid')
      ).rejects.toThrow('Error message');
    });
  });
});
```

### Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clean Up**: Use `beforeEach` and `afterEach` for setup/teardown
3. **Mock External Services**: Don't make real API calls
4. **Test Edge Cases**: Include error scenarios
5. **Use Descriptive Names**: Test names should describe what they test
6. **Arrange-Act-Assert**: Structure tests clearly

## Coverage Goals

- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

## Continuous Integration

Tests run automatically on:
- Pull requests
- Before merging to main
- On every commit (optional)

## Troubleshooting

### Tests failing with timeout
- Increase timeout in `jest.config.js`
- Check for hanging database connections
- Verify mocks are properly set up

### Database connection errors
- Ensure MongoDB Memory Server is installed
- Check `tests/setup.js` configuration
- Verify test environment variables

### Mock not working
- Ensure mock is imported before the module
- Check mock implementation matches actual API
- Verify jest.mock() is called correctly

## Examples

See existing test files for complete examples:
- `tests/unit/services/product.service.test.js`
- `tests/api/products.api.test.js`
- `tests/api/auth.api.test.js`









