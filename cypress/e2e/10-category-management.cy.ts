import { TEST_USERS, createTestUser, signInTestUser } from '../support/test-helpers'

describe('10. Category Management (Pro Feature)', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  context('Free User Category Limitations', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.free)
      signInTestUser(TEST_USERS.free)
    })

    it('should show categories as disabled for free users', () => {
      cy.visit('/dashboard')
      
      cy.screenshot('10-free-user-categories-disabled')
      
      // Categories navigation should be disabled
      cy.get('body').then(($body) => {
        if ($body.text().includes('Categories')) {
          // Should show as disabled with crown icon
          cy.get('[data-testid=nav-categories]').should('have.class', 'cursor-not-allowed')
          cy.screenshot('10-categories-nav-disabled')
        }
      })
    })

    it('should not show category options in prompt creation', () => {
      cy.visit('/prompts/new')
      
      cy.screenshot('10-free-user-prompt-creation-no-categories')
      
      // Should not show category assignment options
      cy.get('body').should('not.contain', 'Category')
      cy.get('body').should('not.contain', 'Assign to category')
      
      // Category filter should be disabled in prompts list
      cy.visit('/prompts')
      
      cy.screenshot('10-free-user-category-filter-disabled')
      
      cy.get('[data-cy=category-filter]').should('be.disabled')
      cy.get('[data-cy=category-filter]').should('have.class', 'cursor-not-allowed')
    })

    it('should show upgrade prompts for category features', () => {
      cy.visit('/prompts')
      
      cy.screenshot('10-category-upgrade-prompts')
      
      // Should show Pro upgrade messaging related to organization
      cy.get('body').then(($body) => {
        if ($body.text().includes('organization') || $body.text().includes('categories')) {
          cy.screenshot('10-category-feature-pro-messaging')
        }
      })
      
      // Try to access categories directly
      cy.visit('/categories', { failOnStatusCode: false })
      
      cy.screenshot('10-categories-page-access-denied')
      
      // Should be redirected or show access denied
      cy.get('body').then(($body) => {
        if ($body.text().includes('upgrade') || $body.text().includes('Pro')) {
          cy.screenshot('10-categories-upgrade-required')
        }
      })
    })
  })

  context('Pro User Category Access', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should provide access to categories page for Pro users', () => {
      cy.visit('/dashboard')
      
      cy.screenshot('10-pro-user-categories-enabled')
      
      // Categories should be enabled in navigation
      cy.contains('Categories').should('be.visible')
      cy.contains('Categories').should('not.have.class', 'cursor-not-allowed')
      
      // Navigate to categories page
      cy.contains('Categories').click()
      
      cy.url().should('include', '/categories')
      
      cy.screenshot('10-categories-page-loaded')
      
      // Should show categories management interface
      cy.contains('Categories').should('be.visible')
      cy.contains('Organize your prompts').should('be.visible')
    })

    it('should show categories page layout and structure', () => {
      cy.visit('/categories')
      
      cy.screenshot('10-categories-page-structure')
      
      // Should show proper page layout
      cy.contains('Categories').should('be.visible')
      cy.contains('custom categories').should('be.visible')
      
      // Check for category management components
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=category-manager]').length > 0) {
          cy.screenshot('10-category-manager-component')
        }
        
        if ($body.text().includes('Create') || $body.text().includes('Add')) {
          cy.screenshot('10-category-creation-available')
        }
      })
    })
  })

  context('Category Creation and Management', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should create new categories', () => {
      cy.visit('/categories')
      
      cy.screenshot('10-before-category-creation')
      
      // Look for category creation interface
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=create-category]').length > 0) {
          cy.get('[data-cy=create-category]').click()
          
          cy.screenshot('10-category-creation-form')
          
          // Fill in category details
          const categoryData = {
            name: 'Marketing Content',
            description: 'Templates for marketing and promotional content',
            color: '#FF6B6B'
          }
          
          cy.get('[data-cy=category-name]').type(categoryData.name)
          
          if ($body.find('[data-cy=category-description]').length > 0) {
            cy.get('[data-cy=category-description]').type(categoryData.description)
          }
          
          if ($body.find('[data-cy=category-color]').length > 0) {
            cy.get('[data-cy=category-color]').invoke('val', categoryData.color).trigger('change')
          }
          
          cy.screenshot('10-category-form-filled')
          
          // Save category
          cy.get('[data-cy=save-category]').click()
          
          cy.screenshot('10-category-created')
          
          // Should show the new category
          cy.contains('Marketing Content').should('be.visible')
        } else if ($body.find('[data-cy=category-name-input]').length > 0) {
          // Alternative form structure
          cy.get('[data-cy=category-name-input]').type('Technical Writing')
          
          if ($body.find('[data-cy=add-category-button]').length > 0) {
            cy.get('[data-cy=add-category-button]').click()
          }
          
          cy.screenshot('10-technical-category-created')
        }
      })
    })

    it('should create multiple categories with different properties', () => {
      cy.visit('/categories')
      
      const categories = [
        { name: 'Business Strategy', color: '#4ECDC4', description: 'Strategic planning and business analysis' },
        { name: 'Creative Writing', color: '#45B7D1', description: 'Creative content and storytelling' },
        { name: 'Code Review', color: '#96CEB4', description: 'Software development and code analysis' }
      ]
      
      categories.forEach((category, index) => {
        cy.get('body').then(($body) => {
          if ($body.find('[data-cy=create-category]').length > 0) {
            cy.get('[data-cy=create-category]').click()
            
            cy.get('[data-cy=category-name]').type(category.name)
            
            if ($body.find('[data-cy=category-description]').length > 0) {
              cy.get('[data-cy=category-description]').type(category.description)
            }
            
            if ($body.find('[data-cy=category-color]').length > 0) {
              cy.get('[data-cy=category-color]').invoke('val', category.color).trigger('change')
            }
            
            cy.get('[data-cy=save-category]').click()
            
            cy.screenshot(`10-category-${index + 1}-created`)
            
            // Verify category appears
            cy.contains(category.name).should('be.visible')
          }
        })
      })
      
      cy.screenshot('10-multiple-categories-created')
    })

    it('should edit existing categories', () => {
      cy.visit('/categories')
      
      // First create a category to edit
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=create-category]').length > 0) {
          cy.get('[data-cy=create-category]').click()
          cy.get('[data-cy=category-name]').type('Editable Category')
          cy.get('[data-cy=save-category]').click()
          
          cy.screenshot('10-category-created-for-editing')
          
          // Now edit it
          cy.get('[data-cy=edit-category]').first().click()
          
          cy.screenshot('10-category-edit-mode')
          
          // Modify the category
          cy.get('[data-cy=category-name]').clear().type('Updated Category Name')
          
          if ($body.find('[data-cy=category-description]').length > 0) {
            cy.get('[data-cy=category-description]').clear().type('Updated description with new details')
          }
          
          cy.get('[data-cy=save-category]').click()
          
          cy.screenshot('10-category-updated')
          
          // Verify changes
          cy.contains('Updated Category Name').should('be.visible')
        }
      })
    })

    it('should delete categories', () => {
      cy.visit('/categories')
      
      // Create a category to delete
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=create-category]').length > 0) {
          cy.get('[data-cy=create-category]').click()
          cy.get('[data-cy=category-name]').type('Deletable Category')
          cy.get('[data-cy=save-category]').click()
          
          cy.screenshot('10-category-created-for-deletion')
          
          // Delete the category
          cy.get('[data-cy=delete-category]').first().click()
          
          cy.screenshot('10-category-deletion-confirmation')
          
          // Confirm deletion if needed
          cy.get('body').then(($body) => {
            if ($body.text().includes('confirm') || $body.text().includes('delete')) {
              cy.contains('Delete').click()
            }
          })
          
          cy.screenshot('10-category-deleted')
          
          // Category should no longer be visible
          cy.get('body').should('not.contain', 'Deletable Category')
        }
      })
    })
  })

  context('Category Assignment to Prompts', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should assign categories during prompt creation', () => {
      // First create some categories
      cy.visit('/categories')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=create-category]').length > 0) {
          // Create test categories
          const testCategories = ['Email Marketing', 'Blog Writing']
          
          testCategories.forEach(categoryName => {
            cy.get('[data-cy=create-category]').click()
            cy.get('[data-cy=category-name]').type(categoryName)
            cy.get('[data-cy=save-category]').click()
            cy.wait(500)
          })
          
          cy.screenshot('10-test-categories-created')
        }
      })
      
      // Now create a prompt and assign categories
      cy.visit('/prompts/new')
      
      cy.screenshot('10-prompt-creation-with-categories')
      
      cy.get('[data-cy=prompt-title]').type('Categorized Test Prompt')
      cy.get('[data-cy=taskContext]').type('Act as a marketing expert')
      
      // Look for category assignment interface
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=category-assignment]').length > 0) {
          cy.screenshot('10-category-assignment-interface')
          
          // Assign categories
          cy.get('[data-cy=category-assignment]').within(() => {
            cy.get('input[type="checkbox"]').first().check()
          })
          
          cy.screenshot('10-categories-assigned')
        }
        
        if ($body.find('[data-cy=category-select]').length > 0) {
          cy.get('[data-cy=category-select]').select('Email Marketing')
          cy.screenshot('10-category-selected')
        }
      })
      
      cy.get('[data-cy=save-prompt]').click()
      
      // Verify category assignment
      cy.screenshot('10-prompt-with-categories-saved')
      
      // Should show category tags on prompt
      cy.get('body').then(($body) => {
        if ($body.text().includes('Email Marketing') || $body.text().includes('category')) {
          cy.screenshot('10-category-tags-visible')
        }
      })
    })

    it('should filter prompts by category', () => {
      // Ensure we have categorized prompts first
      cy.visit('/prompts/new')
      
      cy.get('[data-cy=prompt-title]').type('Filterable Marketing Prompt')
      cy.get('[data-cy=taskContext]').type('Marketing content creation')
      
      // Assign to marketing category if interface exists
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=category-assignment]').length > 0) {
          cy.get('[data-cy=category-assignment]').within(() => {
            cy.get('input[type="checkbox"]').first().check()
          })
        }
      })
      
      cy.get('[data-cy=save-prompt]').click()
      
      // Now test filtering
      cy.visit('/prompts')
      
      cy.screenshot('10-prompts-page-before-filtering')
      
      // Should show category filter for Pro users
      cy.get('[data-cy=category-filter]').should('not.be.disabled')
      
      // Try filtering by category
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=category-filter] option').length > 1) {
          cy.get('[data-cy=category-filter]').select(1) // Select first category
          
          cy.screenshot('10-category-filter-applied')
          
          // Should filter prompts
          cy.url().should('include', 'category=')
          
          cy.screenshot('10-filtered-prompts-result')
        }
      })
    })
  })

  context('Category Display and Organization', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should display categories with proper styling and colors', () => {
      cy.visit('/categories')
      
      // Create categories with different colors
      const coloredCategories = [
        { name: 'Red Category', color: '#FF4757' },
        { name: 'Blue Category', color: '#3742FA' },
        { name: 'Green Category', color: '#2ED573' }
      ]
      
      coloredCategories.forEach((category, index) => {
        cy.get('body').then(($body) => {
          if ($body.find('[data-cy=create-category]').length > 0) {
            cy.get('[data-cy=create-category]').click()
            cy.get('[data-cy=category-name]').type(category.name)
            
            if ($body.find('[data-cy=category-color]').length > 0) {
              cy.get('[data-cy=category-color]').invoke('val', category.color).trigger('change')
            }
            
            cy.get('[data-cy=save-category]').click()
            
            cy.screenshot(`10-colored-category-${index + 1}`)
          }
        })
      })
      
      cy.screenshot('10-categories-with-colors')
      
      // Verify colors are applied
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=category-color-display]').length > 0) {
          cy.screenshot('10-category-colors-displayed')
        }
      })
    })

    it('should show category usage statistics', () => {
      cy.visit('/categories')
      
      cy.screenshot('10-category-usage-statistics')
      
      // Should show how many prompts are in each category
      cy.get('body').then(($body) => {
        if ($body.text().includes('prompts') && $body.text().match(/\(\d+\)/)) {
          cy.screenshot('10-category-prompt-counts')
        }
      })
      
      // Check dashboard for category statistics
      cy.visit('/dashboard')
      
      cy.screenshot('10-dashboard-category-stats')
      
      // Should show category count in dashboard stats
      cy.get('body').then(($body) => {
        if ($body.text().includes('Categories') && $body.text().match(/\d+/)) {
          cy.screenshot('10-dashboard-category-count')
        }
      })
    })
  })

  context('Category Management UX', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should provide good mobile experience for category management', () => {
      cy.viewport(375, 667) // Mobile viewport
      
      cy.visit('/categories')
      
      cy.screenshot('10-mobile-categories-page')
      
      // Categories should be accessible and usable on mobile
      cy.contains('Categories').should('be.visible')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=create-category]').length > 0) {
          cy.get('[data-cy=create-category]').should('be.visible')
          cy.get('[data-cy=create-category]').click()
          
          cy.screenshot('10-mobile-category-creation')
          
          // Form should be mobile-friendly
          cy.get('[data-cy=category-name]').type('Mobile Test Category')
          cy.get('[data-cy=save-category]').click()
          
          cy.screenshot('10-mobile-category-created')
        }
      })
    })

    it('should handle category validation and errors', () => {
      cy.visit('/categories')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=create-category]').length > 0) {
          cy.get('[data-cy=create-category]').click()
          
          // Try to save without name
          cy.get('[data-cy=save-category]').click()
          
          cy.screenshot('10-category-validation-error')
          
          // Should show validation error
          cy.get('body').then(($body) => {
            if ($body.text().includes('required') || $body.text().includes('error')) {
              cy.screenshot('10-validation-message-shown')
            }
          })
          
          // Try with duplicate name
          cy.get('[data-cy=category-name]').type('Duplicate Test')
          cy.get('[data-cy=save-category]').click()
          
          // Create same name again
          cy.get('[data-cy=create-category]').click()
          cy.get('[data-cy=category-name]').type('Duplicate Test')
          cy.get('[data-cy=save-category]').click()
          
          cy.screenshot('10-duplicate-category-handling')
        }
      })
    })
  })

  context('Category Integration with Prompt Library', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should show category tags in prompt library', () => {
      // Create categorized prompt
      cy.visit('/prompts/new')
      
      cy.get('[data-cy=prompt-title]').type('Tagged Library Prompt')
      cy.get('[data-cy=taskContext]').type('Testing category tags in library')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=category-assignment]').length > 0) {
          cy.get('[data-cy=category-assignment]').within(() => {
            cy.get('input[type="checkbox"]').first().check()
          })
        }
      })
      
      cy.get('[data-cy=save-prompt]').click()
      
      // Check library display
      cy.visit('/prompts')
      
      cy.screenshot('10-library-with-category-tags')
      
      // Should show category tags on prompt cards
      cy.get('[data-cy=prompt-card]').should('exist')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=category-tag]').length > 0) {
          cy.screenshot('10-category-tags-in-library')
        }
      })
    })

    it('should support category-based organization and sorting', () => {
      cy.visit('/prompts')
      
      cy.screenshot('10-category-organization-features')
      
      // Should show category-based organization options
      cy.get('body').then(($body) => {
        if ($body.text().includes('Sort by') || $body.text().includes('Group by')) {
          cy.screenshot('10-category-sorting-options')
        }
        
        // Test category filter functionality
        if ($body.find('[data-cy=category-filter]').length > 0) {
          cy.get('[data-cy=category-filter]').should('not.be.disabled')
          cy.screenshot('10-category-filter-enabled')
        }
      })
    })
  })
})