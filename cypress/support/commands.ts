/// <reference types="cypress" />
import { TEST_USERS, createTestUser, signInTestUser } from './test-helpers'

// Custom command to login as test user (free plan)
Cypress.Commands.add('loginAsTestUser', () => {
  cy.session('testUser', () => {
    // First, ensure the test user exists by creating it
    createTestUser(TEST_USERS.free).then(() => {
      // Then sign in via API
      signInTestUser(TEST_USERS.free).then(() => {
        // Visit dashboard to verify login worked
        cy.visit('/dashboard')
        cy.url().should('include', '/dashboard')
        cy.contains('Welcome back').should('be.visible')
      })
    })
  })
})

// Custom command to login as Pro user
Cypress.Commands.add('loginAsProUser', () => {
  cy.session('proUser', () => {
    // First, ensure the pro test user exists by creating it
    createTestUser(TEST_USERS.pro).then(() => {
      // Sign in via API
      signInTestUser(TEST_USERS.pro).then(() => {
        // Visit dashboard to verify login worked
        cy.visit('/dashboard')
        cy.url().should('include', '/dashboard')
        cy.contains('Welcome back').should('be.visible')
        // Note: Pro status depends on subscriptionStatus in database
      })
    })
  })
})

// Custom command to create a test prompt
Cypress.Commands.add('createTestPrompt', (title: string, description?: string) => {
  cy.visit('/prompts/new')
  
  // Fill in the prompt form
  cy.get('[data-cy=prompt-title]').type(title)
  
  if (description) {
    cy.get('[data-cy=prompt-description]').type(description)
  }
  
  // Fill in at least one required field
  cy.get('[data-cy=task-context]').type('You are a helpful AI assistant.')
  cy.get('[data-cy=immediate-task]').type('Help the user with their request.')
  
  // Save the prompt
  cy.get('[data-cy=save-prompt]').click()
  
  // Wait for redirect to prompt detail page
  cy.url().should('include', '/prompts/')
  cy.contains(title).should('be.visible')
})

// Custom command to clean database (would need backend endpoint)
Cypress.Commands.add('cleanDatabase', () => {
  // This would require a backend endpoint to clean test data
  // For now, we'll implement basic cleanup through UI
  // cy.task('cleanDatabase', null, { failOnStatusCode: false })
  cy.log('Database cleanup not implemented yet')
})