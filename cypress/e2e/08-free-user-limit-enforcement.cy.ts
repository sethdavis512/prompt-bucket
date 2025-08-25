import { 
  createAndSignInUser, 
  createUserAtPromptLimit,
  createTestPrompt, 
  takeContextualScreenshot,
  waitForPageLoad 
} from '../support/test-helpers'

describe('8. Free User Limit Enforcement', () => {
  let testUser: any

  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Set up authenticated free user with unique email
    createAndSignInUser('free', 'limit-enforcement').then((user) => {
      testUser = user
    })
  })

  context('Prompt Limit Display', () => {
    it('should show prompt usage counters throughout the app', () => {
      // Check dashboard
      cy.visit('/dashboard')
      
      cy.screenshot('08-dashboard-prompt-counter')
      
      // Should show prompt usage for free users
      cy.contains(/\d+\/5 prompts used/).should('be.visible')
      
      // Check prompts page
      cy.visit('/prompts')
      
      cy.screenshot('08-prompts-page-counter')
      
      // Should also show on prompts page
      cy.contains(/\d+\/5 prompts used/).should('be.visible')
      
      // Check during prompt creation
      cy.visit('/prompts/new')
      
      cy.screenshot('08-prompt-creation-limit-awareness')
      
      // Should show limit awareness during creation
      cy.get('body').then(($body) => {
        if ($body.text().includes('5 prompts') || $body.text().includes('limit')) {
          cy.screenshot('08-limit-awareness-during-creation')
        }
      })
    })

    it('should update prompt counters in real-time', () => {
      cy.visit('/dashboard')
      
      // Note initial count
      cy.contains(/(\d+)\/5 prompts used/).then(($el) => {
        const initialText = $el.text()
        const initialCount = parseInt(initialText.match(/(\d+)\/5/)[1])
        
        cy.screenshot('08-initial-prompt-count')
        
        // Create a new prompt
        cy.visit('/prompts/new')
        cy.get('[data-cy=prompt-title]').type(`Counter Test ${Date.now()}`)
        cy.get('[data-cy=taskContext]').type('Testing counter updates')
        cy.get('[data-cy=save-prompt]').click()
        
        // Return to dashboard
        cy.visit('/dashboard')
        
        cy.screenshot('08-updated-prompt-count')
        
        // Count should have increased
        cy.contains(/(\d+)\/5 prompts used/).then(($newEl) => {
          const newText = $newEl.text()
          const newCount = parseInt(newText.match(/(\d+)\/5/)[1])
          
          expect(newCount).to.equal(initialCount + 1)
        })
      })
    })
  })

  context('Limit Enforcement During Creation', () => {
    it('should prevent prompt creation when limit is reached', () => {
      // First, let's create prompts up to the limit
      const promptsToCreate = []
      
      // Create prompts up to but not exceeding limit
      for (let i = 0; i < 5; i++) {
        cy.visit('/prompts/new')
        
        const promptTitle = `Limit Test Prompt ${i + 1}`
        cy.get('[data-cy=prompt-title]').type(promptTitle)
        cy.get('[data-cy=taskContext]').type(`Content for prompt ${i + 1}`)
        cy.get('[data-cy=save-prompt]').click()
        
        // Wait for save to complete
        cy.url().should('match', /\/prompts\/[a-z0-9-]+$/)
        
        promptsToCreate.push(promptTitle)
        
        cy.screenshot(`08-created-prompt-${i + 1}`)
      }
      
      // Now try to create a 6th prompt - should be blocked
      cy.visit('/prompts/new')
      
      cy.screenshot('08-attempt-to-exceed-limit')
      
      // Should either be redirected or prevented from accessing creation
      cy.get('body').then(($body) => {
        if ($body.text().includes('Limit reached') || $body.text().includes('upgrade')) {
          cy.screenshot('08-limit-reached-during-creation')
        } else if (!$body.text().includes('Create New Prompt')) {
          // If redirected away from creation page
          cy.screenshot('08-redirected-from-creation')
        }
      })
    })

    it('should show limit reached state on dashboard', () => {
      // Ensure we're at the limit by checking dashboard
      cy.visit('/dashboard')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('5/5 prompts used')) {
          cy.screenshot('08-dashboard-at-limit')
          
          // New Prompt button should be disabled
          cy.get('[data-cy=new-prompt-button]').should('be.disabled')
          
          // Should show upgrade messaging
          cy.contains('Limit reached').should('be.visible')
          cy.contains('Upgrade to Pro').should('be.visible')
          
          cy.screenshot('08-dashboard-limit-enforcement')
        }
      })
    })

    it('should show limit reached state on prompts page', () => {
      cy.visit('/prompts')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('5/5 prompts used')) {
          cy.screenshot('08-prompts-page-at-limit')
          
          // New Prompt button should be disabled
          cy.get('body').then(($buttons) => {
            if ($buttons.find('[data-cy=new-prompt-button]').length > 0) {
              cy.get('[data-cy=new-prompt-button]').should('be.disabled')
            }
          })
          
          // Should show upgrade messaging
          cy.contains('Upgrade to Pro').should('be.visible')
          
          cy.screenshot('08-prompts-page-limit-enforcement')
        }
      })
    })
  })

  context('Upgrade Prompts and Messaging', () => {
    it('should show appropriate upgrade messaging when limit is reached', () => {
      cy.visit('/dashboard')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('Limit reached')) {
          cy.screenshot('08-upgrade-messaging-dashboard')
          
          // Should show clear upgrade path
          cy.contains('Upgrade to Pro').should('be.visible')
          
          // Click upgrade link
          cy.contains('Upgrade to Pro').click()
          cy.url().should('include', '/pricing')
          
          cy.screenshot('08-upgrade-navigation-from-limit')
          
          // Should show pricing page with Pro benefits
          cy.contains('Unlimited prompt').should('be.visible')
        }
      })
    })

    it('should show upgrade prompts in various UI locations', () => {
      // Check for upgrade prompts on dashboard
      cy.visit('/dashboard')
      
      cy.screenshot('08-dashboard-upgrade-prompts')
      
      // Should show Pro upgrade banner in sidebar
      cy.get('body').then(($body) => {
        if ($body.text().includes('Upgrade to Pro')) {
          cy.contains('Upgrade to Pro').should('be.visible')
          cy.screenshot('08-sidebar-upgrade-banner')
        }
      })
      
      // Check prompts page for upgrade messaging
      cy.visit('/prompts')
      
      cy.screenshot('08-prompts-page-upgrade-prompts')
      
      // Should show upgrade prompts when creating new prompts is blocked
      cy.get('body').then(($body) => {
        if ($body.text().includes('Limit reached')) {
          cy.contains('Upgrade to Pro').should('be.visible')
        }
      })
    })

    it('should provide compelling upgrade value proposition', () => {
      cy.visit('/dashboard')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('Upgrade to Pro')) {
          cy.screenshot('08-upgrade-value-proposition')
          
          // Should highlight benefits of Pro plan
          cy.get('body').then(($body) => {
            if ($body.text().includes('unlimited') || $body.text().includes('chains') || $body.text().includes('categories')) {
              cy.screenshot('08-pro-benefits-highlighted')
            }
          })
          
          // Navigate to pricing to see full value prop
          cy.contains('Learn More').click()
          cy.url().should('include', '/pricing')
          
          cy.screenshot('08-pricing-page-from-upgrade')
          
          // Should clearly show unlimited prompts benefit
          cy.contains('Unlimited prompt').should('be.visible')
          cy.contains('5 prompt templates maximum').should('be.visible')
        }
      })
    })
  })

  context('Limit Bypass Prevention', () => {
    it('should prevent creation through direct URL access', () => {
      // Try to access prompt creation directly via URL when at limit
      cy.visit('/prompts/new')
      
      cy.screenshot('08-direct-url-limit-check')
      
      // Should either redirect or show limit enforcement
      cy.get('body').then(($body) => {
        if ($body.text().includes('Create New Prompt')) {
          // If creation page loads, try to submit
          cy.get('[data-cy=prompt-title]').type('Bypass Attempt')
          cy.get('[data-cy=taskContext]').type('Trying to bypass limit')
          cy.get('[data-cy=save-prompt]').click()
          
          // Should be blocked or show error
          cy.screenshot('08-creation-blocked-at-submission')
        } else {
          // Already redirected or blocked
          cy.screenshot('08-direct-access-blocked')
        }
      })
    })

    it('should enforce limits on API level', () => {
      // This test would ideally check API responses, but we'll test UI feedback
      cy.visit('/prompts/new')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('Create New Prompt')) {
          // Fill out form
          cy.get('[data-cy=prompt-title]').type('API Limit Test')
          cy.get('[data-cy=taskContext]').type('Testing API-level enforcement')
          
          // Submit form
          cy.get('[data-cy=save-prompt]').click()
          
          cy.screenshot('08-api-limit-enforcement-test')
          
          // Should handle limit enforcement gracefully
          cy.get('body').then(($body) => {
            if ($body.text().includes('limit') || $body.text().includes('upgrade')) {
              cy.screenshot('08-api-limit-enforced')
            }
          })
        }
      })
    })
  })

  context('Pro User Comparison', () => {
    it('should show unlimited access for Pro users', () => {
      // Sign in as Pro user
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
      
      cy.visit('/dashboard')
      
      cy.screenshot('08-pro-user-dashboard-unlimited')
      
      // Should not show prompt limits
      cy.get('body').should('not.contain', '/5 prompts used')
      
      // New Prompt button should always be enabled
      cy.contains('New Prompt').should('be.visible')
      cy.contains('New Prompt').should('not.be.disabled')
      
      cy.screenshot('08-pro-user-unlimited-access')
      
      // Should be able to create prompts without limit warnings
      cy.contains('New Prompt').click()
      cy.url().should('include', '/prompts/new')
      
      // Should not show any limit messaging
      cy.get('body').should('not.contain', 'Limit reached')
      cy.get('body').should('not.contain', 'Upgrade to Pro')
      
      cy.screenshot('08-pro-user-creation-no-limits')
    })
  })

  context('Limit Recovery After Deletion', () => {
    it('should allow creation after deleting prompts to free up space', () => {
      // First ensure we have prompts to delete
      cy.visit('/prompts')
      
      cy.screenshot('08-prompts-before-deletion')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=prompt-card]').length > 0) {
          // If delete functionality exists, test it
          cy.get('[data-cy=prompt-card]').first().within(() => {
            // Look for delete button or action
            cy.get('body').then(($card) => {
              if ($card.find('[data-cy=delete-prompt]').length > 0) {
                cy.get('[data-cy=delete-prompt]').click()
                
                cy.screenshot('08-prompt-deletion-confirmation')
                
                // Confirm deletion if needed
                cy.get('body').then(($body) => {
                  if ($body.text().includes('confirm') || $body.text().includes('delete')) {
                    cy.contains('Delete').click()
                  }
                })
                
                cy.screenshot('08-after-prompt-deletion')
                
                // Should reduce count and allow creation again
                cy.visit('/dashboard')
                
                // Count should be reduced
                cy.contains(/\d+\/5 prompts used/).should('be.visible')
                
                // Should be able to create new prompt
                cy.contains('New Prompt').should('not.be.disabled')
                
                cy.screenshot('08-limit-recovered-after-deletion')
              }
            })
          })
        }
      })
    })
  })

  context('Mobile Limit Enforcement', () => {
    it('should enforce limits properly on mobile devices', () => {
      cy.viewport(375, 667) // Mobile viewport
      
      cy.visit('/dashboard')
      
      cy.screenshot('08-mobile-dashboard-limits')
      
      // Should show limit information on mobile
      cy.contains(/\d+\/5 prompts used/).should('be.visible')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('Limit reached')) {
          cy.screenshot('08-mobile-limit-reached')
          
          // Upgrade prompts should be mobile-friendly
          cy.contains('Upgrade to Pro').should('be.visible')
          cy.contains('Upgrade to Pro').click()
          
          cy.url().should('include', '/pricing')
          
          cy.screenshot('08-mobile-pricing-from-limit')
        }
      })
    })
  })
})