# PromptBucket E2E Test Suite

This comprehensive end-to-end test suite covers the top 10 most critical user workflows in the PromptBucket application. Each test includes detailed screenshots to document the user experience and verify functionality.

## Test Coverage Overview

### 1. User Authentication Flow (`01-authentication-flow.cy.ts`)
**Priority: Critical**
- User sign up with email/password
- User sign in with existing credentials  
- Authentication persistence across sessions
- Sign out functionality
- Invalid credential handling

**Screenshots captured:**
- `01-signup-page-initial` - Clean signup form
- `01-signup-form-filled` - Form with user data
- `01-signup-success-dashboard` - Post-signup redirect
- `01-signin-page-initial` - Login form
- `01-signin-success-dashboard` - Successful login
- `01-session-persistence-after-refresh` - Session maintenance

### 2. Create New Prompt - Free User (`02-create-prompt-free-user.cy.ts`)
**Priority: Critical**
- Navigation to prompt creation from dashboard/prompts page
- Basic prompt creation with required fields
- Comprehensive prompt creation with multiple sections
- Free user prompt limit tracking
- Form validation

**Screenshots captured:**
- `02-dashboard-before-create` - Entry points to creation
- `02-new-prompt-page-from-dashboard` - Creation form
- `02-create-prompt-task-context-filled` - Section completion
- `02-create-prompt-success-detail-page` - Successful creation
- `02-free-user-prompt-count-dashboard` - Limit tracking

### 3. View & Edit Existing Prompts (`03-view-edit-prompts.cy.ts`)
**Priority: Critical**
- Prompt library display and navigation
- Prompt detail view with all sections
- Edit mode navigation and functionality
- Content modification and saving
- Copy functionality for prompt sections

**Screenshots captured:**
- `03-prompts-library-overview` - Library layout
- `03-prompt-detail-comprehensive-view` - Full prompt display
- `03-prompt-edit-mode-initial` - Edit interface
- `03-prompt-edit-saved` - Updated content confirmation

### 4. Dashboard Overview & Navigation (`04-dashboard-navigation.cy.ts`)
**Priority: High**
- Dashboard initial load and layout
- Statistics display and grid responsiveness
- Primary navigation between sections
- Quick actions and account management
- User dropdown and profile access

**Screenshots captured:**
- `04-dashboard-initial-load` - Complete dashboard layout
- `04-dashboard-statistics-overview` - Stats cards display
- `04-navigation-to-prompts` - Section navigation
- `04-user-dropdown-opened` - Account management options
- `04-dashboard-mobile-responsive` - Mobile adaptation

### 5. Prompt Library Management (`05-prompt-library-management.cy.ts`)
**Priority: High**
- Search functionality by title and description
- Category filtering (Pro feature)
- Responsive grid layout
- Prompt metadata display
- No results handling

**Screenshots captured:**
- `05-library-initial-view` - Library overview
- `05-search-marketing-results` - Search functionality
- `05-filter-free-user-disabled` - Feature gating
- `05-prompt-card-metadata` - Information display
- `05-grid-mobile-view` - Mobile responsiveness

### 6. Subscription Upgrade Flow (`06-subscription-upgrade-flow.cy.ts`)
**Priority: High**
- Pricing page access from multiple entry points
- Plan comparison and feature highlighting
- Checkout process initiation
- Mobile checkout experience
- FAQ and billing information

**Screenshots captured:**
- `06-pricing-plans-overview` - Plan comparison
- `06-pro-plan-highlighting` - Recommended plan emphasis
- `06-checkout-initiation` - Payment flow start
- `06-pricing-mobile-view` - Mobile pricing display
- `06-billing-cancellation-info` - Support information

### 7. Public Prompt Sharing (`07-public-prompt-sharing.cy.ts`)
**Priority: High (Pro Feature)**
- Free user sharing limitations
- Pro user public prompt creation
- Shareable URL generation
- Unauthenticated access to public prompts
- Copy functionality on share pages

**Screenshots captured:**
- `07-free-user-public-option-disabled` - Feature limitation
- `07-prompt-marked-as-public` - Pro sharing option
- `07-public-share-page-loaded` - Public view interface
- `07-unauthenticated-share-page-access` - Public accessibility
- `07-mobile-share-page` - Mobile sharing experience

### 8. Free User Limit Enforcement (`08-free-user-limit-enforcement.cy.ts`)
**Priority: Medium-High**
- Prompt usage counters throughout app
- Creation blocking at limit
- Upgrade messaging and navigation
- Limit bypass prevention
- Pro user unlimited access comparison

**Screenshots captured:**
- `08-dashboard-prompt-counter` - Usage tracking
- `08-limit-reached-during-creation` - Enforcement
- `08-upgrade-messaging-dashboard` - Conversion prompts
- `08-pro-user-unlimited-access` - Pro experience
- `08-mobile-limit-enforcement` - Mobile limits

### 9. Prompt Scoring & AI Features (`09-prompt-scoring-ai-features.cy.ts`)
**Priority: Medium-High (Pro Feature)**
- Free user scoring hints vs. Pro AI scoring
- Real-time AI scoring for Pro users
- Section-by-section scoring breakdown
- AI content generation suggestions
- Scoring performance and error handling

**Screenshots captured:**
- `09-free-user-scoring-hints` - Limited features
- `09-pro-user-scoring-interface` - Full AI features
- `09-ai-scoring-results` - Scoring display
- `09-comprehensive-prompt-for-scoring` - Multi-section analysis
- `09-mobile-ai-features` - Mobile AI experience

### 10. Category Management (`10-category-management.cy.ts`)
**Priority: Medium (Pro Feature)**
- Free user category limitations
- Pro user category creation and management
- Category assignment to prompts
- Category filtering and organization
- Color coding and usage statistics

**Screenshots captured:**
- `10-free-user-categories-disabled` - Feature gating
- `10-categories-page-structure` - Management interface
- `10-category-creation-form` - Category creation
- `10-categories-with-colors` - Visual organization
- `10-category-tags-in-library` - Integration display

## Running the Tests

### Prerequisites
1. Application running on `http://localhost:5173`
2. Database seeded with test data
3. Cypress installed (`npm install`)

### Run All Tests
```bash
# Headless mode (CI/CD)
npx cypress run

# Interactive mode (development)
npx cypress open
```

### Run Specific Test Suites
```bash
# Run only authentication tests
npx cypress run --spec "cypress/e2e/01-authentication-flow.cy.ts"

# Run all critical priority tests (1-3)
npx cypress run --spec "cypress/e2e/0[1-3]-*.cy.ts"

# Run Pro feature tests only
npx cypress run --spec "cypress/e2e/*{public-prompt-sharing,category-management,prompt-scoring}*.cy.ts"
```

### Screenshot Analysis
Screenshots are automatically captured at key interaction points and saved to `cypress/screenshots/`. Each test creates timestamped screenshots showing:

- **Before/After states** - UI changes from user actions
- **Feature demonstrations** - How features work in practice
- **Error states** - How the app handles edge cases
- **Responsive behavior** - Mobile/tablet adaptations
- **Feature gating** - Free vs Pro user experiences

### Test Data Management
Tests use helper functions from `cypress/support/test-helpers.ts`:

- `createTestUser()` - Creates authenticated users
- `signInTestUser()` - Handles authentication
- `TEST_USERS` - Predefined user accounts (free, pro, admin)

### CI/CD Integration
Tests are configured for CI environments with:
- 2 retry attempts for flaky tests
- Screenshot capture on failures
- Configurable timeouts for API calls
- Environment-specific base URLs

## Test Philosophy

These tests focus on **user journeys** rather than unit functionality:
- Complete workflows from start to finish
- Real user interaction patterns
- Business-critical paths that affect revenue
- Feature differentiation between user tiers
- Mobile-first responsive behavior

Each test includes comprehensive screenshots to serve as:
- **Visual regression testing** - Detect UI changes
- **Documentation** - Show how features work
- **QA verification** - Confirm expected behavior
- **User experience validation** - Verify interaction flows

## Maintenance

### Adding New Tests
1. Follow the naming convention: `##-descriptive-name.cy.ts`
2. Include comprehensive screenshot capture
3. Test both happy path and edge cases
4. Cover mobile responsiveness
5. Document test purpose and screenshots

### Updating Existing Tests
1. Update screenshots when UI changes
2. Maintain backward compatibility
3. Update test data as features evolve
4. Keep test descriptions current

### Debugging Failed Tests
1. Check screenshot artifacts for visual state
2. Review console logs for API errors
3. Verify test data setup and cleanup
4. Confirm application state before test runs