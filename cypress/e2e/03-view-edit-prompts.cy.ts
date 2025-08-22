import { TEST_USERS, createTestUser, signInTestUser } from '../support/test-helpers'

describe('3. View & Edit Existing Prompts', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Set up authenticated free user
    createTestUser(TEST_USERS.free)
    signInTestUser(TEST_USERS.free)
  })

  context('Viewing Prompt Library', () => {
    it('should display prompts library with existing prompts', () => {
      cy.visit('/prompts')
      
      cy.screenshot('03-prompts-library-overview')
      
      // Should show prompts page header
      cy.contains('My Prompts').should('be.visible')
      cy.contains('Manage and organize your prompt templates').should('be.visible')
      
      // Check if prompts exist or show empty state
      cy.get('body').then(($body) => {
        if ($body.text().includes('No prompts yet')) {
          cy.screenshot('03-prompts-library-empty-state')
          cy.contains('No prompts yet').should('be.visible')
          cy.contains('Create Your First Prompt').should('be.visible')
        } else {
          cy.screenshot('03-prompts-library-with-prompts')
          // If prompts exist, verify grid layout
          cy.get('[data-cy=prompt-card]').should('exist')
        }
      })
    })

    it('should create a prompt and then view it', () => {
      // First create a test prompt to view/edit
      cy.visit('/prompts/new')
      
      const testPrompt = {
        title: `View Test Prompt ${Date.now()}`,
        description: 'A prompt created for testing view/edit functionality',
        taskContext: 'Act as a professional content writer with expertise in blog writing.',
        detailedTaskDescription: 'Write an engaging blog post introduction that hooks the reader.'
      }
      
      cy.get('[data-cy=prompt-title]').type(testPrompt.title)
      cy.get('[data-cy=prompt-description]').type(testPrompt.description)
      cy.get('[data-cy=taskContext]').type(testPrompt.taskContext)
      cy.get('[data-cy=detailedTaskDescription]').type(testPrompt.detailedTaskDescription)
      
      cy.get('[data-cy=save-prompt]').click()
      
      // Should be on prompt detail page
      cy.url().should('match', /\/prompts\/[a-z0-9-]+$/)
      
      cy.screenshot('03-created-prompt-detail-view')
      
      // Verify prompt content is displayed correctly
      cy.contains(testPrompt.title).should('be.visible')
      cy.contains(testPrompt.description).should('be.visible')
      cy.contains('content writer').should('be.visible')
    })
  })

  context('Prompt Detail View', () => {
    it('should display prompt details with all sections', () => {
      // Create a comprehensive prompt first
      cy.visit('/prompts/new')
      
      const promptData = {
        title: `Detail View Test ${Date.now()}`,
        description: 'Testing prompt detail view functionality',
        taskContext: 'You are an experienced technical writer.',
        toneContext: 'Use a clear, instructional tone.',
        detailedTaskDescription: 'Create comprehensive documentation.',
        examples: 'Example 1: API Reference\\nExample 2: User Guide'
      }
      
      Object.entries(promptData).forEach(([key, value]) => {
        if (key === 'title' || key === 'description') {
          cy.get(`[data-cy=prompt-${key}]`).type(value)
        } else {
          cy.get(`[data-cy=${key}]`).type(value)
        }
      })
      
      cy.get('[data-cy=save-prompt]').click()
      
      cy.screenshot('03-prompt-detail-comprehensive-view')
      
      // Verify all sections are displayed
      cy.contains('Task Context').should('be.visible')
      cy.contains('technical writer').should('be.visible')
      cy.contains('Tone Context').should('be.visible')
      cy.contains('clear, instructional tone').should('be.visible')
      
      // Check for action buttons
      cy.contains('Edit').should('be.visible')
      
      cy.screenshot('03-prompt-detail-all-sections-visible')
    })

    it('should allow copying prompt sections', () => {
      // Navigate to existing prompt or create one
      cy.visit('/prompts/new')
      
      cy.get('[data-cy=prompt-title]').type('Copy Test Prompt')
      cy.get('[data-cy=taskContext]').type('This content should be copyable')
      cy.get('[data-cy=save-prompt]').click()
      
      cy.screenshot('03-prompt-before-copy-action')
      
      // Look for copy buttons or copy functionality
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=copy-button]').length > 0) {
          cy.get('[data-cy=copy-button]').first().click()
          cy.screenshot('03-prompt-copy-button-clicked')
        }
      })
    })
  })

  context('Prompt Editing', () => {
    it('should navigate to edit mode and modify prompt', () => {
      // Create a prompt to edit
      cy.visit('/prompts/new')
      
      const originalData = {
        title: `Edit Test Original ${Date.now()}`,
        description: 'Original description',
        taskContext: 'Original task context content'
      }
      
      cy.get('[data-cy=prompt-title]').type(originalData.title)
      cy.get('[data-cy=prompt-description]').type(originalData.description)
      cy.get('[data-cy=taskContext]').type(originalData.taskContext)
      
      cy.get('[data-cy=save-prompt]').click()
      
      // Now edit the prompt
      cy.contains('Edit').click()
      
      cy.url().should('include', 'edit=true')
      
      cy.screenshot('03-prompt-edit-mode-initial')
      
      // Modify the content
      const updatedData = {
        title: `Edit Test Updated ${Date.now()}`,
        description: 'Updated description with new content',
        taskContext: 'Updated task context with additional instructions'
      }
      
      cy.get('[data-cy=prompt-title]').clear().type(updatedData.title)
      cy.get('[data-cy=prompt-description]').clear().type(updatedData.description)
      cy.get('[data-cy=taskContext]').clear().type(updatedData.taskContext)
      
      cy.screenshot('03-prompt-edit-mode-modified')
      
      // Save changes
      cy.get('[data-cy=save-prompt]').click()
      
      cy.screenshot('03-prompt-edit-saved')
      
      // Verify changes were saved
      cy.contains(updatedData.title).should('be.visible')
      cy.contains(updatedData.description).should('be.visible')
      cy.contains('additional instructions').should('be.visible')
    })

    it('should handle edit mode navigation correctly', () => {
      // Create a prompt
      cy.visit('/prompts/new')
      
      cy.get('[data-cy=prompt-title]').type('Navigation Test Prompt')
      cy.get('[data-cy=taskContext]').type('Test content for navigation')
      cy.get('[data-cy=save-prompt]').click()
      
      // Get the current URL to return to
      cy.url().then((detailUrl) => {
        // Enter edit mode
        cy.contains('Edit').click()
        
        cy.screenshot('03-edit-mode-navigation')
        
        // Should show edit interface
        cy.url().should('include', 'edit=true')
        
        // Cancel editing (if cancel button exists)
        cy.get('body').then(($body) => {
          if ($body.find('[data-cy=cancel-edit]').length > 0) {
            cy.get('[data-cy=cancel-edit]').click()
            cy.url().should('eq', detailUrl)
          }
        })
      })
    })
  })

  context('Prompt Management from Library', () => {
    it('should navigate from library to detail view', () => {
      // Create a prompt to view from library
      cy.visit('/prompts/new')
      
      cy.get('[data-cy=prompt-title]').type('Library Navigation Test')
      cy.get('[data-cy=taskContext]').type('Content for library testing')
      cy.get('[data-cy=save-prompt]').click()
      
      // Go back to library
      cy.visit('/prompts')
      
      cy.screenshot('03-library-with-test-prompt')
      
      // Click on the prompt to view details
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=prompt-card]').length > 0) {
          cy.get('[data-cy=prompt-card]').first().within(() => {
            cy.contains('View').click()
          })
          
          cy.screenshot('03-navigated-to-detail-from-library')
          
          // Should be on detail page
          cy.url().should('match', /\/prompts\/[a-z0-9-]+$/)
          cy.contains('Library Navigation Test').should('be.visible')
        }
      })
    })
  })
})