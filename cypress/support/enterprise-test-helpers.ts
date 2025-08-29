/**
 * Enterprise Test Helpers
 * Replaces the existing test-helpers.ts with enterprise-grade patterns
 * Combines best practices from the analysis and Cypress documentation
 */

import { TestDataFactory, dataFactory, TestDataSets } from './test-data-factory'
import { TestUtilities } from './test-utilities'

// Re-export page objects for easy access
export * from './page-objects'
export * from './test-data-factory'
export * from './test-utilities'

// Enterprise User Management
export class UserManager {
  /**
   * Creates and authenticates a user via API with session caching
   * Follows Cypress best practice of programmatic authentication
   */
  static createAndLoginUser(
    userType: 'free' | 'pro' | 'admin' = 'free',
    prefix = ''
  ): Cypress.Chainable<any> {
    return cy.loginViaApi(userType, prefix)
  }

  /**
   * Creates a Pro user with active subscription
   */
  static createProUserWithSubscription(prefix = ''): Cypress.Chainable<any> {
    return cy.loginViaApi('pro', prefix)
  }

  /**
   * Creates multiple test users for complex scenarios
   */
  static createMultipleUsers(count: number, userType: 'free' | 'pro' = 'free'): Cypress.Chainable<any[]> {
    const users: any[] = []
    
    for (let i = 0; i < count; i++) {
      const user = dataFactory.createUser(userType, `bulk-${i}-`)
      users.push(user)
    }
    
    return cy.wrap(users)
  }
}

// Enterprise Data Management
export class DataManager {
  /**
   * Sets up test data in a consistent, predictable manner
   */
  static setupTestScenario(scenario: 'empty' | 'basic' | 'populated' | 'limit-reached') {
    switch (scenario) {
      case 'empty':
        return this.setupEmptyUser()
      case 'basic':
        return this.setupUserWithBasicData()
      case 'populated':
        return this.setupUserWithFullData()
      case 'limit-reached':
        return this.setupUserAtLimit()
    }
  }

  private static setupEmptyUser() {
    return cy.loginViaApi('free', 'empty-').then((user) => {
      return cy.wrap({ user, promptCount: 0 })
    })
  }

  private static setupUserWithBasicData() {
    return cy.loginViaApi('free', 'basic-').then((user) => {
      const prompts = dataFactory.createMultiplePrompts(2)
      // Create prompts via UI or API
      prompts.forEach(prompt => {
        cy.createPromptViaUI(prompt, false)
      })
      return cy.wrap({ user, prompts })
    })
  }

  private static setupUserWithFullData() {
    return cy.loginViaApi('free', 'full-').then((user) => {
      const prompts = dataFactory.createMultiplePrompts(4, 'mixed')
      prompts.forEach(prompt => {
        cy.createPromptViaUI(prompt, false)
      })
      return cy.wrap({ user, prompts })
    })
  }

  private static setupUserAtLimit() {
    return cy.loginViaApi('free', 'limit-').then((user) => {
      const prompts = dataFactory.createMultiplePrompts(5)
      prompts.forEach(prompt => {
        cy.createPromptViaUI(prompt, false)
      })
      return cy.wrap({ user, prompts, isAtLimit: true })
    })
  }

  /**
   * Creates searchable test data for search functionality tests
   */
  static setupSearchTestData() {
    return cy.loginViaApi('free', 'search-').then((user) => {
      const searchablePrompts = dataFactory.createSearchablePrompts()
      searchablePrompts.forEach(prompt => {
        cy.createPromptViaUI(prompt, false)
      })
      return cy.wrap({ user, searchablePrompts })
    })
  }

  /**
   * Cleans up test data after test completion
   */
  static cleanup(userEmail: string) {
    return cy.cleanupTestData(userEmail)
  }
}

// Enterprise Test Orchestration
export class TestOrchestrator {
  /**
   * Runs a test suite with proper setup and teardown
   */
  static runTestSuite(suiteName: string, testFn: () => void) {
    describe(suiteName, () => {
      beforeEach(() => {
        TestUtilities.cleanupTestEnvironment()
        dataFactory.reset()
      })

      testFn()

      afterEach(() => {
        TestUtilities.checkConsoleErrors()
      })
    })
  }

  /**
   * Runs responsive tests across multiple viewports
   */
  static runResponsiveTest(testName: string, testFn: () => void) {
    const devices = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ]

    devices.forEach(device => {
      it(`${testName} - ${device.name}`, () => {
        cy.viewport(device.width, device.height)
        testFn()
      })
    })
  }
}

// Enterprise Assertion Helpers
export class AssertionHelpers {
  /**
   * Verifies user authentication state
   */
  static verifyAuthenticated(userType?: 'free' | 'pro' | 'admin') {
    cy.get('[data-testid="user-dropdown"]').should('be.visible')
    cy.url().should('not.include', '/auth/')
    
    if (userType === 'free') {
      cy.contains(/\d+\/5 prompts used/).should('be.visible')
    }
  }

  /**
   * Verifies page load performance
   */
  static verifyPagePerformance(maxLoadTime = 3000) {
    TestUtilities.measurePageLoadTime(maxLoadTime)
  }

  /**
   * Verifies accessibility compliance
   */
  static verifyAccessibility(context?: string) {
    TestUtilities.checkAccessibility(context)
  }

  /**
   * Verifies responsive layout
   */
  static verifyResponsiveLayout() {
    TestUtilities.testResponsiveLayout(() => {
      cy.get('[data-testid="sidebar"]').should('exist')
      cy.get('main').should('be.visible')
    })
  }

  /**
   * Verifies form validation
   */
  static verifyFormValidation(formSelector: string, requiredFields: string[]) {
    requiredFields.forEach(field => {
      TestUtilities.validateFormField(field, 'required')
    })
  }

  /**
   * Verifies search functionality
   */
  static verifySearchResults(query: string, expectedCount?: number) {
    cy.url().should('include', `search=${encodeURIComponent(query)}`)
    if (expectedCount !== undefined) {
      cy.get('[data-cy="prompt-card"]').should('have.length', expectedCount)
    }
  }

  /**
   * Verifies error handling
   */
  static verifyErrorHandling(errorMessage: string) {
    cy.contains(errorMessage).should('be.visible')
    cy.get('[role="alert"]').should('be.visible')
  }
}

// Legacy compatibility - maintain existing function signatures
// but implement with enterprise patterns

export const createAndSignInUser = UserManager.createAndLoginUser
export const setupTestUser = DataManager.setupTestScenario

// Enhanced screenshot and evidence functions
export function takeContextualScreenshot(context: string, description: string) {
  TestUtilities.captureEvidence(context, description)
}

export function waitForPageLoad(expectedContent: string, timeout = 10000) {
  cy.contains(expectedContent, { timeout }).should('be.visible')
  TestUtilities.waitForNetworkIdle(2000)
}

// Enhanced prompt creation
export function createTestPrompt(promptData: any, skipNavigation = false) {
  if (!skipNavigation) {
    cy.visit('/prompts/new')
  }
  
  return cy.createPromptViaUI(promptData, true)
}

// Navigation helper
export function navigateViaSidebar(section: string) {
  return cy.navigateToSection(section)
}

// Enhanced user creation functions
export const TEST_USERS = {
  free: TestDataSets.freeUser(),
  pro: TestDataSets.proUser(),
  admin: TestDataSets.adminUser()
}

export function createTestUser(userData: any) {
  return cy.request({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    body: userData,
    failOnStatusCode: false
  })
}

export function signInTestUser(userData: any) {
  return cy.request({
    method: 'POST',
    url: '/api/auth/sign-in/email',
    body: {
      email: userData.email,
      password: userData.password
    }
  })
}

// Export enterprise classes for advanced usage
export {
  UserManager,
  DataManager, 
  TestOrchestrator,
  AssertionHelpers
}