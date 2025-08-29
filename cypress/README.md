# Cypress E2E Testing

This directory contains end-to-end tests for the Prompt Bucket application using Cypress.

## Setup

The testing setup includes:

- **Cypress**: Modern e2e testing framework
- **@testing-library/cypress**: Additional commands for better testing
- **start-server-and-test**: Automatically starts dev server for testing

## Running Tests

### Interactive Mode (Recommended for Development)
```bash
# Start dev server and open Cypress UI
npm run test:e2e:open

# Or manually:
npm run dev  # In one terminal
npm run cypress:open  # In another terminal
```

### Headless Mode (CI/Automated)
```bash
# Run all tests headlessly
npm run test:e2e

# Or manually:
npm run dev  # In one terminal
npm run cypress:run  # In another terminal
```

### Individual Commands
```bash
npm run cypress:open   # Open Cypress UI (requires dev server)
npm run cypress:run    # Run tests headlessly (requires dev server)
```

## Test Structure

```
cypress/
├── e2e/                    # Test files
│   ├── authentication.cy.ts
│   ├── dashboard.cy.ts
│   └── prompt-editing.cy.ts
├── fixtures/               # Test data
│   └── test-prompts.json
└── support/                # Helper files
    ├── commands.ts         # Custom commands
    └── e2e.ts             # Global setup
```

## Custom Commands

### Authentication
- `cy.loginAsTestUser()` - Login as free user
- `cy.loginAsProUser()` - Login as Pro user

### Prompt Management
- `cy.createTestPrompt(title, description?)` - Create a test prompt
- `cy.cleanDatabase()` - Clean test data (requires backend endpoint)

## Test Environment

### Environment Variables
Set these in `cypress.config.ts` or via environment:

```typescript
env: {
  TEST_EMAIL: 'test@example.com',
  TEST_PASSWORD: 'testpassword123',
}
```

### Test Users
Tests expect these users to exist in your database:
- `test@example.com` - Free plan user
- `pro@example.com` - Pro plan user (with active subscription)

## Data Attributes for Testing

Add these `data-cy` attributes to your components for reliable testing:

### Authentication
- `data-cy="email-input"` - Email input field
- `data-cy="password-input"` - Password input field  
- `data-cy="signin-button"` - Sign in button
- `data-cy="signout-button"` - Sign out button
- `data-cy="user-menu"` - User menu toggle

### Dashboard
- `data-cy="search-input"` - Search prompts input
- `data-cy="category-filter"` - Category filter dropdown
- `data-cy="new-prompt"` - New prompt button
- `data-cy="view-prompt"` - View prompt link
- `data-cy="edit-prompt"` - Edit prompt link

### Prompt Editing
- `data-cy="prompt-title"` - Title input/display
- `data-cy="prompt-description"` - Description input/display
- `data-cy="task-context"` - Task context textarea
- `data-cy="immediate-task"` - Immediate task textarea
- `data-cy="visibility-private"` - Private radio button
- `data-cy="visibility-public"` - Public radio button
- `data-cy="save-changes"` - Save changes button
- `data-cy="cancel-edit"` - Cancel edit button
- `data-cy="save-prompt"` - Save new prompt button
- `data-cy="share-button"` - Share prompt button

## Test Categories

### Critical Path Tests
- User authentication flow
- Prompt creation and editing
- Save functionality (prevents regressions like the recent save button bug)

### Feature Tests
- Search and filtering
- Pro vs Free user limitations
- Visibility settings

### Error Handling Tests
- Network errors
- Validation errors
- Loading states

## Best Practices

### 1. Use Data Attributes
Always use `data-cy` attributes instead of classes or IDs:
```typescript
// Good
cy.get('[data-cy=save-button]')

// Bad
cy.get('.btn-save')
cy.get('#saveBtn')
```

### 2. Create Reusable Commands
For repeated actions, create custom commands:
```typescript
// Custom command in commands.ts
Cypress.Commands.add('createTestPrompt', (title: string) => {
  // Implementation
})

// Usage in tests
cy.createTestPrompt('My Test Prompt')
```

### 3. Use Fixtures for Test Data
Store test data in fixtures for reusability:
```typescript
cy.fixture('test-prompts').then((prompts) => {
  cy.createTestPrompt(prompts.marketing.title)
})
```

### 4. Test Real User Flows
Focus on complete user journeys rather than individual components:
```typescript
// Good - Complete flow
it('should allow creating and editing a prompt', () => {
  cy.loginAsTestUser()
  cy.createTestPrompt('Test')
  cy.get('[data-cy=edit-prompt]').click()
  cy.get('[data-cy=save-changes]').click()
  // Assert final state
})
```

### 5. Handle Async Operations
Wait for network requests and state changes:
```typescript
cy.intercept('POST', '/prompts/*').as('savePrompt')
cy.get('[data-cy=save-changes]').click()
cy.wait('@savePrompt')
```

## Debugging Tips

### 1. Use Cypress UI
Run tests in interactive mode to debug step by step:
```bash
npm run test:e2e:open
```

### 2. Add Debug Commands
```typescript
cy.pause()        // Pause execution
cy.debug()        // Open DevTools debugger
cy.screenshot()   // Take screenshot
```

### 3. Check Network Tab
Monitor API calls in Cypress UI Network tab

### 4. Console Logs
Check browser console for errors during test execution

## CI Integration

For GitHub Actions or other CI systems:

```yaml
- name: Run E2E Tests
  run: |
    npm ci
    npm run build
    npm run test:e2e
```

## Database Considerations

### Test Data Isolation
- Tests should create their own data
- Clean up after tests when possible
- Use unique identifiers to avoid conflicts

### Seeding Test Users
Ensure test users exist in your database:
```sql
INSERT INTO User (email, name, subscriptionStatus) 
VALUES 
  ('test@example.com', 'Test User', 'inactive'),
  ('pro@example.com', 'Pro User', 'active');
```

## Preventing Regressions

This test suite is designed to catch bugs like:
- ✅ Save button not working in edit mode
- ✅ Navigation issues with query parameters  
- ✅ Pro feature access control
- ✅ Form state preservation
- ✅ Loading states and error handling

Run tests frequently during development and always before deploying to catch issues early!