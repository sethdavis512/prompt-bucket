import { TEST_USERS, createTestUser, signInTestUser } from '../support/test-helpers'

describe('1. User Authentication Flow (Sign Up & Sign In)', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  context('User Sign Up', () => {
    it('should complete full signup process', () => {
      // Visit signup page
      cy.visit('/auth/signup')
      
      // Take screenshot of signup page
      cy.screenshot('01-signup-page-initial')
      
      // Fill out signup form
      cy.get('[data-cy=name-input]').type(TEST_USERS.free.name)
      cy.get('[data-cy=email-input]').type(`new-${Date.now()}@example.com`)
      cy.get('[data-cy=password-input]').type(TEST_USERS.free.password)
      
      // Take screenshot with form filled
      cy.screenshot('01-signup-form-filled')
      
      // Submit form
      cy.get('[data-cy=signup-button]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      
      // Take screenshot of successful signup redirect
      cy.screenshot('01-signup-success-dashboard')
      
      // Verify user is logged in by checking for logout option
      cy.get('[data-testid=user-dropdown]').click()
      cy.contains('Sign Out').should('be.visible')
      
      cy.screenshot('01-signup-user-menu-open')
    })
  })

  context('User Sign In', () => {
    it('should complete full signin process', () => {
      // Use a unique email to avoid conflicts
      const uniqueUser = {
        ...TEST_USERS.free,
        email: `signin-${Date.now()}@example.com`
      }
      
      // First create a test user and wait for completion
      createTestUser(uniqueUser).then(() => {
        // Visit signin page
        cy.visit('/auth/signin')
        
        // Take screenshot of signin page
        cy.screenshot('01-signin-page-initial')
        
        // Fill out signin form
        cy.get('[data-cy=email-input]').type(uniqueUser.email)
        cy.get('[data-cy=password-input]').type(uniqueUser.password)
        
        // Take screenshot with form filled
        cy.screenshot('01-signin-form-filled')
        
        // Submit form
        cy.get('[data-cy=signin-button]').click()
        
        // Should redirect to dashboard
        cy.url().should('include', '/dashboard')
        
        // Take screenshot of successful signin
        cy.screenshot('01-signin-success-dashboard')
        
        // Verify dashboard content is visible
        cy.contains('Dashboard').should('be.visible')
        cy.contains('Welcome back').should('be.visible')
      })
    })

    it('should handle invalid credentials', () => {
      cy.visit('/auth/signin')
      
      // Try invalid credentials
      cy.get('[data-cy=email-input]').type('invalid@example.com')
      cy.get('[data-cy=password-input]').type('wrongpassword')
      
      cy.screenshot('01-signin-invalid-credentials')
      
      cy.get('[data-cy=signin-button]').click()
      
      // Should stay on signin page
      cy.url().should('include', '/auth/signin')
      
      cy.screenshot('01-signin-error-state')
    })
  })

  context('Authentication Persistence', () => {
    it('should maintain session across page refreshes', () => {
      // Use a unique email to avoid conflicts
      const uniqueUser = {
        ...TEST_USERS.free,
        email: `persist-${Date.now()}@example.com`
      }
      
      // Sign in user
      createTestUser(uniqueUser).then(() => {
        signInTestUser(uniqueUser).then(() => {
          // Visit dashboard
          cy.visit('/dashboard')
          cy.contains('Dashboard').should('be.visible')
          
          // Refresh page
          cy.reload()
          
          // Should still be logged in
          cy.url().should('include', '/dashboard')
          cy.contains('Dashboard').should('be.visible')
          
          cy.screenshot('01-session-persistence-after-refresh')
        })
      })
    })
  })

  context('Sign Out Process', () => {
    it('should successfully sign out user', () => {
      // Use a unique email to avoid conflicts
      const uniqueUser = {
        ...TEST_USERS.free,
        email: `signout-${Date.now()}@example.com`
      }
      
      // Sign in user first
      createTestUser(uniqueUser).then(() => {
        signInTestUser(uniqueUser).then(() => {
          cy.visit('/dashboard')
          
          // Click user dropdown
          cy.get('[data-testid=user-dropdown]').click()
          
          cy.screenshot('01-signout-dropdown-open')
          
          // Click sign out
          cy.contains('Sign Out').click()
          
          // Should redirect to home page or signin
          cy.url().should('satisfy', (url) => url.includes('/') || url.includes('/auth/signin'))
          
          cy.screenshot('01-signout-success')
          
          // Verify user is logged out by trying to access dashboard
          cy.visit('/dashboard')
          cy.url().should('include', '/auth/signin')
        })
      })
    })
  })
})