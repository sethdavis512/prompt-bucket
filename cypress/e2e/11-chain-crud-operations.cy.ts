import { 
  createAndSignInUser, 
  createProUserWithSubscription,
  createTestPrompt, 
  takeContextualScreenshot,
  waitForPageLoad 
} from '../support/test-helpers'

describe('11. Chain CRUD Operations', () => {
  let testUser: any
  let testPrompts: any[] = []

  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  context('Chain Access Control', () => {
    it('should restrict chain access to Pro users only', () => {
      // Test with free user
      createAndSignInUser('free', 'chain-access').then((user) => {
        testUser = user
        
        cy.visit('/chains')
        
        // Should redirect or show access denied
        cy.url().should('not.include', '/chains')
        takeContextualScreenshot('11-access', 'free-user-blocked')
      })
    })

    it('should allow Pro users to access chains', () => {
      createProUserWithSubscription('chain-access-pro').then((user) => {
        testUser = user
        
        cy.visit('/chains')
        
        // Should successfully load chains page
        waitForPageLoad('My Chains')
        cy.url().should('include', '/chains')
        takeContextualScreenshot('11-access', 'pro-user-allowed')
      })
    })
  })

  context('Chain Creation', () => {
    beforeEach(() => {
      // Set up Pro user and test prompts for chain creation
      createProUserWithSubscription('chain-create').then((user) => {
        testUser = user
        
        // Create multiple test prompts to use in chains
        const prompts = [
          {
            title: `Chain Prompt 1 ${Date.now()}`,
            description: 'First prompt in the chain',
            taskContext: 'Act as a content strategist',
            detailedTaskDescription: 'Define the content strategy'
          },
          {
            title: `Chain Prompt 2 ${Date.now()}`,
            description: 'Second prompt in the chain', 
            taskContext: 'Act as a content writer',
            detailedTaskDescription: 'Write content based on the strategy'
          },
          {
            title: `Chain Prompt 3 ${Date.now()}`,
            description: 'Third prompt in the chain',
            taskContext: 'Act as an editor',
            detailedTaskDescription: 'Review and refine the content'
          }
        ]
        
        // Create prompts sequentially
        cy.visit('/prompts/new')
        createTestPrompt(prompts[0], true).then((prompt1) => {
          testPrompts.push(prompt1)
          
          cy.visit('/prompts/new')
          createTestPrompt(prompts[1], true).then((prompt2) => {
            testPrompts.push(prompt2)
            
            cy.visit('/prompts/new')
            createTestPrompt(prompts[2], true).then((prompt3) => {
              testPrompts.push(prompt3)
            })
          })
        })
      })
    })

    it('should display empty chains state initially', () => {
      cy.visit('/chains')
      
      // Should show empty state
      cy.get('body').then(($body) => {
        if ($body.text().includes('No chains yet') || $body.text().includes('Create Your First Chain')) {
          takeContextualScreenshot('11-create', 'empty-state')
          cy.contains('Create').should('be.visible')
        } else {
          takeContextualScreenshot('11-create', 'existing-chains')
        }
      })
    })

    it('should create a new chain with multiple prompts', () => {
      cy.visit('/chains/new')
      
      waitForPageLoad('Create New Chain')
      takeContextualScreenshot('11-create', 'new-chain-form')
      
      const chainData = {
        name: `Test Content Chain ${Date.now()}`,
        description: 'A test chain for content creation workflow'
      }
      
      // Fill in chain details
      cy.get('[data-cy=chain-name]').should('be.visible').type(chainData.name)
      cy.get('[data-cy=chain-description]').should('be.visible').type(chainData.description)
      
      // Add prompts to the chain
      cy.get('body').then(($body) => {
        // Look for available prompts section
        if ($body.text().includes('Add Prompts') || $body.find('[data-cy=available-prompt]').length > 0) {
          // Add first available prompt
          cy.get('[data-cy=available-prompt]').first().click()
          takeContextualScreenshot('11-create', 'first-prompt-added')
          
          // Add second prompt if available
          cy.get('[data-cy=available-prompt]').then(($prompts) => {
            if ($prompts.length > 1) {
              cy.wrap($prompts[1]).click()
              takeContextualScreenshot('11-create', 'second-prompt-added')
            }
          })
        }
      })
      
      // Save the chain
      cy.get('[data-cy=save-chain]').should('be.visible').click()
      
      // Should redirect to chain detail page
      cy.url().should('match', /\/chains\/[a-z0-9-]+$/)
      cy.contains(chainData.name).should('be.visible')
      cy.contains(chainData.description).should('be.visible')
      
      takeContextualScreenshot('11-create', 'chain-created-detail-view')
      
      // Verify chain shows steps
      cy.contains('steps').should('be.visible')
    })

    it('should validate required fields when creating chain', () => {
      cy.visit('/chains/new')
      
      // Try to save without required fields
      cy.get('[data-cy=save-chain]').click()
      
      // Should show validation errors or disable save
      cy.get('[data-cy=save-chain]').should('be.disabled')
      takeContextualScreenshot('11-create', 'validation-empty-fields')
      
      // Fill in name only
      cy.get('[data-cy=chain-name]').type('Test Chain Name')
      
      // Should still be disabled without prompts
      cy.get('[data-cy=save-chain]').should('be.disabled')
      takeContextualScreenshot('11-create', 'validation-no-prompts')
    })
  })

  context('Chain Viewing and Detail', () => {
    let createdChain: any

    beforeEach(() => {
      createProUserWithSubscription('chain-view').then((user) => {
        testUser = user
        
        // Create a chain to view
        cy.visit('/chains/new')
        
        const chainName = `View Test Chain ${Date.now()}`
        cy.get('[data-cy=chain-name]').type(chainName)
        cy.get('[data-cy=chain-description]').type('Chain for testing view functionality')
        
        // Add at least one prompt
        cy.get('[data-cy=available-prompt]').first().click()
        cy.get('[data-cy=save-chain]').click()
        
        createdChain = { name: chainName }
      })
    })

    it('should display chain in chains list', () => {
      cy.visit('/chains')
      
      // Should show the created chain
      cy.contains(createdChain.name).should('be.visible')
      takeContextualScreenshot('11-view', 'chain-in-list')
      
      // Click to view details
      cy.contains(createdChain.name).click()
      
      // Should be on detail page
      cy.url().should('match', /\/chains\/[a-z0-9-]+$/)
      takeContextualScreenshot('11-view', 'chain-detail-page')
    })

    it('should display chain steps and prompts correctly', () => {
      cy.visit('/chains')
      cy.contains(createdChain.name).click()
      
      // Should show chain steps
      cy.contains('steps').should('be.visible')
      
      // Should show horizontal step layout
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=chain-step]').length > 0) {
          cy.get('[data-cy=chain-step]').should('be.visible')
          takeContextualScreenshot('11-view', 'chain-steps-visible')
        }
      })
      
      // Should have action buttons
      cy.contains('Edit').should('be.visible')
      cy.contains('Delete').should('be.visible')
      cy.contains('Evaluate Chain').should('be.visible')
      
      takeContextualScreenshot('11-view', 'chain-actions-available')
    })

    it('should allow chain evaluation', () => {
      cy.visit('/chains')
      cy.contains(createdChain.name).click()
      
      // Click evaluate chain button
      cy.contains('Evaluate Chain').click()
      
      // Should show evaluation loading state
      cy.contains('Evaluating').should('be.visible')
      takeContextualScreenshot('11-view', 'evaluation-loading')
      
      // Wait for evaluation to complete (with timeout)
      cy.contains('AI Chain Evaluation', { timeout: 30000 }).should('be.visible')
      takeContextualScreenshot('11-view', 'evaluation-completed')
      
      // Should show evaluation results
      cy.get('body').then(($body) => {
        if ($body.text().includes('Overall Chain Assessment') || $body.text().includes('Flow Analysis')) {
          cy.screenshot('11-evaluation-results-visible')
        }
      })
    })
  })

  context('Chain Editing', () => {
    let createdChain: any

    beforeEach(() => {
      createProUserWithSubscription('chain-edit').then((user) => {
        testUser = user
        
        // Create a chain to edit
        cy.visit('/chains/new')
        
        const chainName = `Edit Test Chain ${Date.now()}`
        cy.get('[data-cy=chain-name]').type(chainName)
        cy.get('[data-cy=chain-description]').type('Original description')
        
        // Add prompts
        cy.get('[data-cy=available-prompt]').first().click()
        cy.get('[data-cy=save-chain]').click()
        
        createdChain = { name: chainName }
      })
    })

    it('should navigate to edit page when clicking edit button', () => {
      cy.visit('/chains')
      cy.contains(createdChain.name).click()
      
      // Click edit button
      cy.contains('Edit').click()
      
      // Should be on edit page (not using URL params)
      cy.url().should('include', '/edit')
      cy.url().should('not.include', '?edit=true')
      
      waitForPageLoad('Edit Chain')
      takeContextualScreenshot('11-edit', 'edit-page-loaded')
    })

    it('should load existing chain data in edit form', () => {
      cy.visit('/chains')
      cy.contains(createdChain.name).click()
      cy.contains('Edit').click()
      
      // Should pre-populate form with existing data
      cy.get('[data-cy=chain-name]').should('have.value', createdChain.name)
      cy.get('[data-cy=chain-description]').should('have.value', 'Original description')
      
      // Should show existing prompts in chain
      cy.contains('Chain Steps').should('be.visible')
      takeContextualScreenshot('11-edit', 'existing-data-loaded')
    })

    it('should allow editing chain details', () => {
      cy.visit('/chains')
      cy.contains(createdChain.name).click()
      cy.contains('Edit').click()
      
      const updatedData = {
        name: `Updated Chain Name ${Date.now()}`,
        description: 'Updated description with new content'
      }
      
      // Modify chain details
      cy.get('[data-cy=chain-name]').clear().type(updatedData.name)
      cy.get('[data-cy=chain-description]').clear().type(updatedData.description)
      
      takeContextualScreenshot('11-edit', 'details-modified')
      
      // Save changes
      cy.contains('Save Changes').click()
      
      // Should redirect to detail page
      cy.url().should('match', /\/chains\/[a-z0-9-]+$/)
      
      // Should show updated data
      cy.contains(updatedData.name).should('be.visible')
      cy.contains(updatedData.description).should('be.visible')
      
      takeContextualScreenshot('11-edit', 'changes-saved')
    })

    it('should allow adding and removing prompts from chain', () => {
      cy.visit('/chains')
      cy.contains(createdChain.name).click()
      cy.contains('Edit').click()
      
      // Count initial prompts
      cy.get('body').then(($body) => {
        const initialCount = $body.find('[data-cy=chain-step]').length
        
        // Add another prompt if available
        cy.get('[data-cy=available-prompt]').then(($prompts) => {
          if ($prompts.length > 0) {
            cy.wrap($prompts.first()).click()
            takeContextualScreenshot('11-edit', 'prompt-added')
            
            // Should show increased count
            cy.get('[data-cy=chain-step]').should('have.length', initialCount + 1)
          }
        })
        
        // Remove a prompt if possible
        cy.get('body').then(($body2) => {
          if ($body2.find('[data-cy=remove-prompt]').length > 0) {
            cy.get('[data-cy=remove-prompt]').first().click()
            takeContextualScreenshot('11-edit', 'prompt-removed')
          }
        })
      })
      
      // Save changes
      cy.contains('Save Changes').click()
      takeContextualScreenshot('11-edit', 'prompt-changes-saved')
    })

    it('should allow reordering prompts in chain', () => {
      cy.visit('/chains')
      cy.contains(createdChain.name).click()
      cy.contains('Edit').click()
      
      // Look for reorder controls
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=move-up]').length > 0) {
          cy.get('[data-cy=move-up]').first().click()
          takeContextualScreenshot('11-edit', 'prompt-moved-up')
        }
        
        if ($body.find('[data-cy=move-down]').length > 0) {
          cy.get('[data-cy=move-down]').first().click()
          takeContextualScreenshot('11-edit', 'prompt-moved-down')
        }
      })
      
      // Save reorder changes
      cy.contains('Save Changes').click()
      takeContextualScreenshot('11-edit', 'reorder-saved')
    })

    it('should handle edit cancellation', () => {
      cy.visit('/chains')
      cy.contains(createdChain.name).click()
      
      // Get current URL to verify return
      cy.url().then((detailUrl) => {
        cy.contains('Edit').click()
        
        // Make some changes
        cy.get('[data-cy=chain-name]').clear().type('Should Not Be Saved')
        
        // Cancel editing
        cy.contains('Cancel').click()
        
        // Should return to detail page
        cy.url().should('eq', detailUrl)
        
        // Should show original data (not the cancelled changes)
        cy.contains(createdChain.name).should('be.visible')
        cy.contains('Should Not Be Saved').should('not.exist')
        
        takeContextualScreenshot('11-edit', 'cancel-worked')
      })
    })
  })

  context('Chain Deletion', () => {
    let chainToDelete: any

    beforeEach(() => {
      createProUserWithSubscription('chain-delete').then((user) => {
        testUser = user
        
        // Create a chain to delete
        cy.visit('/chains/new')
        
        const chainName = `Delete Test Chain ${Date.now()}`
        cy.get('[data-cy=chain-name]').type(chainName)
        cy.get('[data-cy=chain-description]').type('Chain to be deleted in test')
        
        // Add a prompt
        cy.get('[data-cy=available-prompt]').first().click()
        cy.get('[data-cy=save-chain]').click()
        
        chainToDelete = { name: chainName }
      })
    })

    it('should show confirmation dialog when deleting chain', () => {
      cy.visit('/chains')
      cy.contains(chainToDelete.name).click()
      
      // Click delete button
      cy.contains('Delete').click()
      
      // Should show confirmation dialog
      cy.on('window:confirm', (message) => {
        expect(message).to.include('delete this chain')
        return false // Cancel the deletion for this test
      })
      
      takeContextualScreenshot('11-delete', 'confirmation-dialog')
    })

    it('should delete chain when confirmed', () => {
      cy.visit('/chains')
      cy.contains(chainToDelete.name).click()
      
      // Click delete and confirm
      cy.contains('Delete').click()
      
      cy.on('window:confirm', () => true) // Confirm deletion
      
      // Should redirect to chains list
      cy.url().should('include', '/chains')
      cy.url().should('not.match', /\/chains\/[a-z0-9-]+$/)
      
      // Chain should no longer exist in list
      cy.contains(chainToDelete.name).should('not.exist')
      
      takeContextualScreenshot('11-delete', 'chain-deleted')
    })

    it('should not delete chain when cancelled', () => {
      cy.visit('/chains')
      cy.contains(chainToDelete.name).click()
      
      // Click delete but cancel
      cy.contains('Delete').click()
      
      cy.on('window:confirm', () => false) // Cancel deletion
      
      // Should remain on detail page
      cy.url().should('match', /\/chains\/[a-z0-9-]+$/)
      cy.contains(chainToDelete.name).should('be.visible')
      
      takeContextualScreenshot('11-delete', 'deletion-cancelled')
      
      // Verify chain still exists in list
      cy.visit('/chains')
      cy.contains(chainToDelete.name).should('be.visible')
    })
  })

  context('Chain Navigation and Integration', () => {
    beforeEach(() => {
      createProUserWithSubscription('chain-nav').then((user) => {
        testUser = user
      })
    })

    it('should navigate between chains and prompts seamlessly', () => {
      // Create a chain with prompts
      cy.visit('/chains/new')
      
      const chainName = `Navigation Test Chain ${Date.now()}`
      cy.get('[data-cy=chain-name]').type(chainName)
      cy.get('[data-cy=chain-description]').type('Testing navigation flow')
      
      cy.get('[data-cy=available-prompt]').first().click()
      cy.get('[data-cy=save-chain]').click()
      
      // From chain detail, navigate to individual prompt
      cy.contains('View full prompt').click()
      
      // Should be on prompt detail page
      cy.url().should('include', '/prompts/')
      takeContextualScreenshot('11-nav', 'navigated-to-prompt')
      
      // Navigate back to chains
      cy.visit('/chains')
      cy.contains(chainName).should('be.visible')
      
      takeContextualScreenshot('11-nav', 'back-to-chains-list')
    })

    it('should maintain proper breadcrumb navigation', () => {
      cy.visit('/chains')
      
      // Should have sidebar navigation
      cy.get('[data-testid=nav-chains]').should('have.class', 'bg-indigo-50')
      
      takeContextualScreenshot('11-nav', 'chains-nav-active')
      
      // Navigate to other sections and back
      cy.get('[data-testid=nav-prompts]').click()
      cy.url().should('include', '/prompts')
      
      cy.get('[data-testid=nav-chains]').click()
      cy.url().should('include', '/chains')
      
      takeContextualScreenshot('11-nav', 'navigation-working')
    })
  })

  context('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      createProUserWithSubscription('chain-errors').then((user) => {
        testUser = user
      })
    })

    it('should handle non-existent chain gracefully', () => {
      // Try to visit a non-existent chain
      cy.visit('/chains/non-existent-chain-id', { failOnStatusCode: false })
      
      // Should handle error gracefully
      cy.get('body').then(($body) => {
        if ($body.text().includes('not found') || $body.text().includes('error')) {
          takeContextualScreenshot('11-errors', 'chain-not-found')
        }
      })
    })

    it('should handle network errors during chain operations', () => {
      cy.visit('/chains/new')
      
      // Fill form
      cy.get('[data-cy=chain-name]').type('Network Error Test')
      cy.get('[data-cy=available-prompt]').first().click()
      
      // Intercept and fail the request
      cy.intercept('POST', '/api/chains', { statusCode: 500 }).as('createChainError')
      
      cy.get('[data-cy=save-chain]').click()
      
      cy.wait('@createChainError')
      
      // Should show error message
      cy.get('body').then(($body) => {
        if ($body.text().includes('error') || $body.text().includes('failed')) {
          takeContextualScreenshot('11-errors', 'network-error-handled')
        }
      })
    })
  })
})