import { 
  createAndSignInUser, 
  createTestPrompt, 
  takeContextualScreenshot,
  waitForPageLoad 
} from '../support/test-helpers'

describe('2. Create New Prompt (Free User - Basic Flow)', () => {
  let testUser: any

  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Set up authenticated free user with unique email
    createAndSignInUser('free', 'create-prompt').then((user) => {
      testUser = user
    })
  })

  context('Prompt Creation Navigation', () => {
    it('should navigate to prompt creation from dashboard', () => {
      cy.visit('/dashboard')
      
      takeContextualScreenshot('02-navigation', 'dashboard-before-create')
      
      // Click New Prompt button from dashboard
      cy.contains('New Prompt').click()
      
      // Should navigate to prompt creation page
      cy.url().should('include', '/prompts/new')
      
      takeContextualScreenshot('02-navigation', 'new-prompt-page-from-dashboard')
      
      // Verify prompt creation form is visible
      waitForPageLoad('Create New Prompt')
      cy.contains('10-section methodology').should('be.visible')
    })

    it('should navigate to prompt creation from prompts page', () => {
      cy.visit('/prompts')
      
      takeContextualScreenshot('02-navigation', 'prompts-page-before-create')
      
      // Click New Prompt button from prompts page
      cy.contains('New Prompt').click()
      
      cy.url().should('include', '/prompts/new')
      
      takeContextualScreenshot('02-navigation', 'new-prompt-page-from-prompts')
    })
  })

  context('Basic Prompt Creation', () => {
    it('should create a basic prompt with required fields', () => {
      cy.visit('/prompts/new')
      
      takeContextualScreenshot('02-creation', 'initial-form')
      
      // Wait for page to load completely
      cy.contains('Create New Prompt').should('be.visible')
      cy.contains('10-section methodology').should('be.visible')
      
      // Test data
      const promptTitle = `Basic Test Prompt ${Date.now()}`
      const promptDescription = 'This is a test prompt for Cypress e2e testing'
      const taskContext = 'Act as a professional copywriter with expertise in marketing content.'
      
      // Fill title - this should work since TextField supports data-cy
      cy.get('[data-cy=prompt-title]')
        .should('be.visible')
        .clear()
        .type(promptTitle)
      
      // Fill description - this should also work since TextField supports data-cy  
      cy.get('[data-cy=prompt-description]')
        .should('be.visible')
        .clear()
        .type(promptDescription)
      
      // Fill task context - this should now work since we fixed TextArea data-cy support
      cy.get('[data-cy=taskContext]')
        .should('be.visible')
        .scrollIntoView()
        .clear()
        .type(taskContext)
        
      takeContextualScreenshot('02-creation', 'form-filled')
      
      // Submit the form
      cy.get('[data-cy=save-prompt]')
        .should('be.visible')
        .click()
      
      // Wait for redirect to prompt detail page or dashboard
      cy.url({ timeout: 15000 }).should('satisfy', (url) => 
        url.includes('/prompts/') || url.includes('/dashboard')
      )
      
      takeContextualScreenshot('02-creation', 'success-page')
      
      // If we're on dashboard, verify success. If on prompt detail, verify content
      cy.get('body').then(($body) => {
        if ($body.text().includes(promptTitle)) {
          // On prompt detail page - verify content
          cy.contains(promptTitle).should('be.visible')
          cy.contains(promptDescription).should('be.visible')
        } else {
          // Likely on dashboard - just verify we're not on the creation form anymore
          cy.contains('Create New Prompt').should('not.exist')
        }
      })
    })

    it('should enforce required field validation', () => {
      cy.visit('/prompts/new')
      
      // Wait for form to load
      cy.contains('Create New Prompt').should('be.visible')
      
      // Try to submit without title (title is required)
      cy.get('[data-cy=save-prompt]').click()
      
      takeContextualScreenshot('02-validation', 'empty-title-submission')
      
      // Should either show validation error or stay on the same page
      // Check if we stayed on the form (didn't redirect)
      cy.url().should('include', '/prompts/new')
      
      // The form should still be visible (not redirected)
      cy.contains('Create New Prompt').should('be.visible')
    })
  })

  context('Prompt Creation with Multiple Sections', () => {
    it('should create comprehensive prompt with multiple sections', () => {
      const promptData = {
        title: `Comprehensive Test Prompt ${Date.now()}`,
        description: 'A comprehensive prompt testing all major sections',
        taskContext: 'Act as an expert business consultant specializing in strategic planning.',
        toneContext: 'Use a professional yet approachable tone. Be authoritative but not condescending.',
        detailedTaskDescription: 'Analyze the provided market data and create a strategic expansion plan.',
        examples: 'Example 1: Market Analysis for TechCorp\\nExample 2: Expansion Strategy for DataInc',
        immediateTask: 'Start by identifying the top 3 target markets based on the provided criteria.',
        outputFormatting: 'Format as: 1. Executive Summary 2. Market Analysis 3. Recommendations 4. Next Steps'
      }
      
      takeContextualScreenshot('02-comprehensive', 'basic-info')
      
      createTestPrompt(promptData).then((createdPrompt) => {
        takeContextualScreenshot('02-comprehensive', 'all-sections-filled')
        
        // Test preview functionality with comprehensive content
        cy.get('body').then(($body) => {
          if ($body.text().includes('Preview')) {
            cy.contains('Preview').click()
            
            takeContextualScreenshot('02-comprehensive', 'preview')
            
            // Verify preview shows structured content
            cy.contains(createdPrompt.taskContext!).should('be.visible')
            cy.contains(createdPrompt.toneContext!).should('be.visible')
            
            // Return to edit
            cy.contains('Edit').click()
          }
        })
        
        takeContextualScreenshot('02-comprehensive', 'saved')
        
        // Verify all content is preserved
        cy.contains(createdPrompt.title).should('be.visible')
        cy.contains('business consultant').should('be.visible')
      })
    })
  })

  context('Free User Limits', () => {
    it('should track prompt count for free users', () => {
      cy.visit('/dashboard')
      
      // Should show prompt usage for free users
      cy.contains(/\d+\/5 prompts used/).should('be.visible')
      
      takeContextualScreenshot('02-limits', 'prompt-count-dashboard')
      
      cy.visit('/prompts')
      
      // Should also show on prompts page
      cy.contains(/\d+\/5 prompts used/).should('be.visible')
      
      takeContextualScreenshot('02-limits', 'prompt-count-prompts-page')
    })
  })
})