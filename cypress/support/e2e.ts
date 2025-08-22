// Import commands.js using ES2015 syntax:
import './commands'
import '@testing-library/cypress/add-commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log for cleaner output
Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').as('consoleError')
  cy.stub(win.console, 'warn').as('consoleWarn')
})

// Handle uncaught exceptions from React hydration mismatches
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore hydration mismatch errors in development
  if (err.message.includes('Hydration failed') || 
      err.message.includes('hydration mismatch') ||
      err.message.includes('server rendered HTML')) {
    return false
  }
  // Let other errors fail the test
  return true
})

// Global before hook to ensure clean state
beforeEach(() => {
  // Clear any lingering data
  cy.clearCookies()
  cy.clearLocalStorage()
  cy.clearAllSessionStorage()
})

// Add custom assertion for better error messages
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as test user
       * @example cy.loginAsTestUser()
       */
      loginAsTestUser(): Chainable<void>
      
      /**
       * Custom command to login as Pro user
       * @example cy.loginAsProUser()
       */
      loginAsProUser(): Chainable<void>
      
      /**
       * Custom command to create a test prompt
       * @example cy.createTestPrompt('My Test Prompt', 'Description')
       */
      createTestPrompt(title: string, description?: string): Chainable<void>
      
      /**
       * Custom command to clean database
       * @example cy.cleanDatabase()
       */
      cleanDatabase(): Chainable<void>
    }
  }
}