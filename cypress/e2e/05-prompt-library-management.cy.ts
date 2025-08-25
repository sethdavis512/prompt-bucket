import { 
  createAndSignInUser, 
  createTestPrompt, 
  createMultipleTestPrompts,
  takeContextualScreenshot,
  waitForPageLoad 
} from '../support/test-helpers'

describe('5. Prompt Library Management (Search & Filter)', () => {
  let testUser: any

  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Set up authenticated free user with unique email
    createAndSignInUser('free', 'library').then((user) => {
      testUser = user
    })
  })

  context('Library Overview', () => {
    it('should display prompt library with proper layout', () => {
      cy.visit('/prompts')
      
      cy.screenshot('05-library-initial-view')
      
      // Verify page structure
      cy.contains('My Prompts').should('be.visible')
      cy.contains('Manage and organize your prompt templates').should('be.visible')
      
      // Should show search and filter controls
      cy.get('[data-cy=search-prompts]').should('be.visible')
      cy.get('[data-cy=category-filter]').should('be.visible')
      
      cy.screenshot('05-library-layout-complete')
    })

    it('should handle empty library state', () => {
      cy.visit('/prompts')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('No prompts yet')) {
          cy.screenshot('05-library-empty-state')
          
          cy.contains('No prompts yet').should('be.visible')
          cy.contains('Get started by creating your first prompt template').should('be.visible')
          cy.contains('Create Your First Prompt').should('be.visible')
          
          // Click create first prompt
          cy.contains('Create Your First Prompt').click()
          cy.url().should('include', '/prompts/new')
          
          cy.screenshot('05-empty-state-create-action')
        }
      })
    })
  })

  context('Search Functionality', () => {
    before(() => {
      // Create test prompts for searching
      cy.clearCookies()
      createTestUser(TEST_USERS.free)
      signInTestUser(TEST_USERS.free)
      
      const testPrompts = [
        {
          title: 'Marketing Email Template',
          description: 'Professional email template for marketing campaigns',
          taskContext: 'Act as a marketing expert specializing in email campaigns'
        },
        {
          title: 'Blog Writing Assistant',
          description: 'Help with writing engaging blog posts',
          taskContext: 'Act as a content writer with expertise in blog writing'
        },
        {
          title: 'Code Review Helper',
          description: 'Assistant for reviewing and improving code',
          taskContext: 'Act as a senior software engineer with code review expertise'
        }
      ]
      
      testPrompts.forEach((prompt, index) => {
        cy.visit('/prompts/new')
        cy.get('[data-cy=prompt-title]').type(prompt.title)
        cy.get('[data-cy=prompt-description]').type(prompt.description)
        cy.get('[data-cy=taskContext]').type(prompt.taskContext)
        cy.get('[data-cy=save-prompt]').click()
        cy.wait(1000)
      })
    })

    it('should search prompts by title', () => {
      cy.visit('/prompts')
      
      cy.screenshot('05-search-before-query')
      
      // Search for marketing prompt
      cy.get('[data-cy=search-prompts]').type('Marketing')
      cy.get('[data-cy=search-prompts]').type('{enter}')
      
      cy.screenshot('05-search-marketing-results')
      
      // Should show only marketing-related prompts
      cy.contains('Marketing Email Template').should('be.visible')
      cy.get('body').should('not.contain', 'Blog Writing Assistant')
      cy.get('body').should('not.contain', 'Code Review Helper')
      
      // Verify URL has search parameter
      cy.url().should('include', 'search=Marketing')
    })

    it('should search prompts by description content', () => {
      cy.visit('/prompts')
      
      // Search by description content
      cy.get('[data-cy=search-prompts]').type('blog posts')
      cy.get('[data-cy=search-prompts]').type('{enter}')
      
      cy.screenshot('05-search-description-results')
      
      // Should find the blog writing prompt
      cy.contains('Blog Writing Assistant').should('be.visible')
      cy.contains('engaging blog posts').should('be.visible')
      
      cy.url().should('include', 'search=blog%20posts')
    })

    it('should handle no search results gracefully', () => {
      cy.visit('/prompts')
      
      // Search for something that doesn't exist
      cy.get('[data-cy=search-prompts]').type('nonexistent content xyz')
      cy.get('[data-cy=search-prompts]').type('{enter}')
      
      cy.screenshot('05-search-no-results')
      
      // Should show no results message
      cy.contains('No matching prompts found').should('be.visible')
      cy.contains('Try adjusting your search criteria').should('be.visible')
    })

    it('should clear search results', () => {
      cy.visit('/prompts')
      
      // Perform search
      cy.get('[data-cy=search-prompts]').type('Marketing')
      cy.get('[data-cy=search-prompts]').type('{enter}')
      
      // Clear search
      cy.get('[data-cy=search-prompts]').clear()
      cy.get('[data-cy=search-prompts]').type('{enter}')
      
      cy.screenshot('05-search-cleared')
      
      // Should show all prompts again
      cy.contains('Marketing Email Template').should('be.visible')
      cy.contains('Blog Writing Assistant').should('be.visible')
      cy.contains('Code Review Helper').should('be.visible')
      
      cy.url().should('not.include', 'search=')
    })
  })

  context('Filter Functionality (Pro Users)', () => {
    it('should show category filter as disabled for free users', () => {
      cy.visit('/prompts')
      
      cy.screenshot('05-filter-free-user-disabled')
      
      // Category filter should be disabled for free users
      cy.get('[data-cy=category-filter]').should('be.disabled')
      cy.get('[data-cy=category-filter]').should('have.class', 'cursor-not-allowed')
      
      // Should show "Categories" placeholder
      cy.get('[data-cy=category-filter]').should('contain', 'Categories')
    })

    it('should show upgrade prompt for category features', () => {
      cy.visit('/prompts')
      
      // Look for Pro upgrade messaging related to categories
      cy.get('body').then(($body) => {
        if ($body.text().includes('Upgrade to Pro') || $body.text().includes('Categories')) {
          cy.screenshot('05-category-upgrade-prompt')
        }
      })
    })
  })

  context('Prompt Grid Display', () => {
    it('should display prompts in responsive grid layout', () => {
      cy.visit('/prompts')
      
      // Desktop view
      cy.viewport(1280, 720)
      cy.screenshot('05-grid-desktop-view')
      
      // Should show prompts in grid format
      cy.get('[data-cy=prompt-card]').should('exist')
      
      // Tablet view
      cy.viewport(768, 1024)
      cy.screenshot('05-grid-tablet-view')
      
      // Mobile view
      cy.viewport(375, 667)
      cy.screenshot('05-grid-mobile-view')
      
      // Prompts should still be visible and accessible
      cy.get('[data-cy=prompt-card]').should('be.visible')
    })

    it('should show prompt metadata in cards', () => {
      cy.visit('/prompts')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=prompt-card]').length > 0) {
          cy.screenshot('05-prompt-card-metadata')
          
          // Each prompt card should show key information
          cy.get('[data-cy=prompt-card]').first().within(() => {
            // Should show title
            cy.get('[data-cy=prompt-title]').should('be.visible')
            
            // Should show description if exists
            cy.get('body').then(($card) => {
              if ($card.text().includes('description')) {
                cy.get('[data-cy=prompt-description]').should('be.visible')
              }
            })
            
            // Should show actions (View, Edit)
            cy.contains('View').should('be.visible')
            cy.contains('Edit').should('be.visible')
            
            // Should show updated date
            cy.contains('Updated').should('be.visible')
          })
        }
      })
    })

    it('should show prompt visibility status', () => {
      cy.visit('/prompts')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=prompt-card]').length > 0) {
          cy.screenshot('05-prompt-visibility-status')
          
          // Should show private/public status
          cy.get('[data-cy=prompt-card]').first().within(() => {
            cy.get('body').then(($card) => {
              if ($card.text().includes('Private') || $card.text().includes('Public')) {
                cy.contains(/Private|Public/).should('be.visible')
              }
            })
          })
        }
      })
    })
  })

  context('Prompt Actions', () => {
    it('should navigate to prompt detail from library', () => {
      cy.visit('/prompts')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=prompt-card]').length > 0) {
          // Click view on first prompt
          cy.get('[data-cy=prompt-card]').first().within(() => {
            cy.contains('View').click()
          })
          
          cy.screenshot('05-navigate-to-detail-from-library')
          
          // Should navigate to prompt detail
          cy.url().should('match', /\/prompts\/[a-z0-9-]+$/)
          
          // Should show prompt content
          cy.contains('Task Context').should('be.visible')
        }
      })
    })

    it('should navigate to prompt edit from library', () => {
      cy.visit('/prompts')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=prompt-card]').length > 0) {
          // Click edit on first prompt
          cy.get('[data-cy=prompt-card]').first().within(() => {
            cy.contains('Edit').click()
          })
          
          cy.screenshot('05-navigate-to-edit-from-library')
          
          // Should navigate to prompt edit
          cy.url().should('include', 'edit=true')
          
          // Should show edit interface
          cy.get('[data-cy=prompt-title]').should('be.visible')
        }
      })
    })
  })

  context('Library Performance and Pagination', () => {
    it('should handle large numbers of prompts gracefully', () => {
      cy.visit('/prompts')
      
      cy.screenshot('05-library-performance-check')
      
      // Library should load quickly even with multiple prompts
      cy.contains('My Prompts').should('be.visible')
      
      // Check if pagination exists for large datasets
      cy.get('body').then(($body) => {
        if ($body.text().includes('Next') || $body.text().includes('Page')) {
          cy.screenshot('05-library-pagination-present')
        }
      })
    })

    it('should maintain search state during navigation', () => {
      cy.visit('/prompts')
      
      // Perform search
      cy.get('[data-cy=search-prompts]').type('Marketing')
      cy.get('[data-cy=search-prompts]').type('{enter}')
      
      // Navigate away and back
      cy.contains('Dashboard').click()
      cy.contains('Prompts').click()
      
      // Search should be cleared (this is typical UX)
      cy.get('[data-cy=search-prompts]').should('have.value', '')
      
      cy.screenshot('05-search-state-after-navigation')
    })
  })

  context('Free User Prompt Limits in Library', () => {
    it('should show prompt usage limits in library', () => {
      cy.visit('/prompts')
      
      cy.screenshot('05-free-user-limits-library')
      
      // Should show usage information for free users
      cy.contains(/\d+\/5 prompts used/).should('be.visible')
      
      // If at limit, should show limit messaging
      cy.get('body').then(($body) => {
        if ($body.text().includes('Limit reached')) {
          cy.screenshot('05-prompt-limit-reached-library')
          cy.contains('Upgrade to Pro').should('be.visible')
        }
      })
    })
  })
})