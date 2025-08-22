import { TEST_USERS, createTestUser, signInTestUser } from '../support/test-helpers'

describe('2. Create New Prompt (Free User - Basic Flow)', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Set up authenticated free user
    createTestUser(TEST_USERS.free)
    signInTestUser(TEST_USERS.free)
  })

  context('Prompt Creation Navigation', () => {
    it('should navigate to prompt creation from dashboard', () => {
      cy.visit('/dashboard')
      
      cy.screenshot('02-dashboard-before-create')
      
      // Click New Prompt button from dashboard
      cy.contains('New Prompt').click()
      
      // Should navigate to prompt creation page
      cy.url().should('include', '/prompts/new')
      
      cy.screenshot('02-new-prompt-page-from-dashboard')
      
      // Verify prompt creation form is visible
      cy.contains('Create New Prompt').should('be.visible')
      cy.contains('10-section methodology').should('be.visible')
    })

    it('should navigate to prompt creation from prompts page', () => {
      cy.visit('/prompts')
      
      cy.screenshot('02-prompts-page-before-create')
      
      // Click New Prompt button from prompts page
      cy.contains('New Prompt').click()
      
      cy.url().should('include', '/prompts/new')
      
      cy.screenshot('02-new-prompt-page-from-prompts')
    })
  })

  context('Basic Prompt Creation', () => {
    it('should create a basic prompt with required fields', () => {
      cy.visit('/prompts/new')
      
      cy.screenshot('02-create-prompt-initial-form')
      
      // Fill in basic information
      const promptTitle = `Test Prompt ${Date.now()}`
      const promptDescription = 'This is a test prompt for Cypress e2e testing'
      
      cy.get('[data-cy=prompt-title]').type(promptTitle)
      cy.get('[data-cy=prompt-description]').type(promptDescription)
      
      cy.screenshot('02-create-prompt-basic-info-filled')
      
      // Fill in task context (core prompt section)
      cy.get('[data-cy=taskContext]').type('Act as a professional copywriter with expertise in marketing content. You have 10+ years of experience creating compelling, conversion-focused copy.')
      
      cy.screenshot('02-create-prompt-task-context-filled')
      
      // Fill in detailed task description
      cy.get('[data-cy=detailedTaskDescription]').type('Create a compelling product description that highlights benefits, addresses customer pain points, and includes a clear call-to-action.')
      
      cy.screenshot('02-create-prompt-detailed-task-filled')
      
      // Preview the prompt before saving
      cy.contains('Preview').click()
      
      cy.screenshot('02-create-prompt-preview-mode')
      
      // Go back to edit mode and save
      cy.contains('Edit').click()
      
      // Submit the form
      cy.get('[data-cy=save-prompt]').click()
      
      // Should redirect to prompt detail page
      cy.url().should('match', /\/prompts\/[a-z0-9-]+$/)
      
      cy.screenshot('02-create-prompt-success-detail-page')
      
      // Verify prompt was created with correct content
      cy.contains(promptTitle).should('be.visible')
      cy.contains(promptDescription).should('be.visible')
      cy.contains('professional copywriter').should('be.visible')
    })

    it('should enforce required field validation', () => {
      cy.visit('/prompts/new')
      
      // Try to submit without title
      cy.get('[data-cy=save-prompt]').click()
      
      cy.screenshot('02-create-prompt-validation-empty-title')
      
      // Should show validation error or prevent submission
      cy.url().should('include', '/prompts/new')
    })
  })

  context('Prompt Creation with Multiple Sections', () => {
    it('should create comprehensive prompt with multiple sections', () => {
      cy.visit('/prompts/new')
      
      const promptData = {
        title: `Comprehensive Test Prompt ${Date.now()}`,
        description: 'A comprehensive prompt testing all major sections',
        taskContext: 'Act as an expert business consultant specializing in strategic planning.',
        toneContext: 'Use a professional yet approachable tone. Be authoritative but not condescending.',
        backgroundData: 'The client is a mid-size SaaS company looking to expand into new markets.',
        detailedTaskDescription: 'Analyze the provided market data and create a strategic expansion plan.',
        examples: 'Example 1: Market Analysis for TechCorp\\nExample 2: Expansion Strategy for DataInc',
        immediateTask: 'Start by identifying the top 3 target markets based on the provided criteria.',
        outputFormatting: 'Format as: 1. Executive Summary 2. Market Analysis 3. Recommendations 4. Next Steps'
      }
      
      // Fill in all sections
      cy.get('[data-cy=prompt-title]').type(promptData.title)
      cy.get('[data-cy=prompt-description]').type(promptData.description)
      
      cy.screenshot('02-comprehensive-prompt-basic-info')
      
      // Fill prompt sections
      Object.entries(promptData).forEach(([key, value]) => {
        if (key !== 'title' && key !== 'description') {
          cy.get(`[data-cy=${key}]`).type(value)
        }
      })
      
      cy.screenshot('02-comprehensive-prompt-all-sections-filled')
      
      // Test preview functionality with comprehensive content
      cy.contains('Preview').click()
      
      cy.screenshot('02-comprehensive-prompt-preview')
      
      // Verify preview shows structured content
      cy.contains(promptData.taskContext).should('be.visible')
      cy.contains(promptData.toneContext).should('be.visible')
      
      // Return to edit and save
      cy.contains('Edit').click()
      cy.get('[data-cy=save-prompt]').click()
      
      cy.screenshot('02-comprehensive-prompt-saved')
      
      // Verify all content is preserved
      cy.contains(promptData.title).should('be.visible')
      cy.contains('business consultant').should('be.visible')
    })
  })

  context('Free User Limits', () => {
    it('should track prompt count for free users', () => {
      cy.visit('/dashboard')
      
      // Should show prompt usage for free users
      cy.contains(/\d+\/5 prompts used/).should('be.visible')
      
      cy.screenshot('02-free-user-prompt-count-dashboard')
      
      cy.visit('/prompts')
      
      // Should also show on prompts page
      cy.contains(/\d+\/5 prompts used/).should('be.visible')
      
      cy.screenshot('02-free-user-prompt-count-prompts-page')
    })
  })
})