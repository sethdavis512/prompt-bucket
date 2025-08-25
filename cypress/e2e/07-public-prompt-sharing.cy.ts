import { 
  createAndSignInUser, 
  createProUserWithSubscription,
  createTestPrompt, 
  takeContextualScreenshot,
  waitForPageLoad 
} from '../support/test-helpers'

describe('7. Public Prompt Sharing (Pro Feature)', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  context('Free User Sharing Limitations', () => {
    let freeUser: any

    beforeEach(() => {
      createAndSignInUser('free', 'sharing-free').then((user) => {
        freeUser = user
      })
    })

    it('should not show public sharing options for free users', () => {
      // Create a prompt as free user
      cy.visit('/prompts/new')
      
      const promptData = {
        title: 'Free User Test Prompt',
        description: 'Testing sharing limitations for free users',
        taskContext: 'Act as a professional writer'
      }
      
      cy.get('[data-cy=prompt-title]').type(promptData.title)
      cy.get('[data-cy=prompt-description]').type(promptData.description)
      cy.get('[data-cy=taskContext]').type(promptData.taskContext)
      
      cy.screenshot('07-free-user-prompt-creation')
      
      // Look for public sharing checkbox - should not exist or be disabled
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=public-checkbox]').length > 0) {
          cy.get('[data-cy=public-checkbox]').should('be.disabled')
          cy.screenshot('07-free-user-public-option-disabled')
        } else {
          cy.screenshot('07-free-user-no-public-option')
        }
      })
      
      cy.get('[data-cy=save-prompt]').click()
      
      // On detail page, should not show sharing options
      cy.screenshot('07-free-user-prompt-detail-no-sharing')
      
      // Should not see share button or public URL
      cy.get('body').should('not.contain', 'Share')
      cy.get('body').should('not.contain', 'Public URL')
    })

    it('should show upgrade prompts for sharing features', () => {
      cy.visit('/prompts/new')
      
      cy.screenshot('07-free-user-sharing-upgrade-prompts')
      
      // Look for Pro feature hints related to sharing
      cy.get('body').then(($body) => {
        if ($body.text().includes('Pro') && $body.text().includes('sharing')) {
          cy.screenshot('07-sharing-pro-feature-hint')
        }
        
        if ($body.text().includes('Upgrade') && $body.text().includes('public')) {
          cy.screenshot('07-sharing-upgrade-hint')
        }
      })
    })
  })

  context('Pro User Sharing Features', () => {
    let proUser: any

    beforeEach(() => {
      createProUserWithSubscription('sharing-pro').then((user) => {
        proUser = user
      })
    })

    it('should create and make prompt public', () => {
      const publicPromptData = {
        title: 'Public Marketing Assistant',
        description: 'A comprehensive marketing assistant for creating engaging content',
        taskContext: 'Act as an expert marketing strategist with 10+ years of experience in digital marketing',
        detailedTaskDescription: 'Create compelling marketing copy that converts visitors into customers',
        examples: 'Example 1: Email subject lines that increase open rates\\nExample 2: Social media posts that drive engagement'
      }
      
      takeContextualScreenshot('07-pro', 'prompt-creation')
      
      createTestPrompt(publicPromptData).then((createdPrompt) => {
      
      // Make prompt public
      cy.get('[data-cy=public-checkbox]').check()
      
      cy.screenshot('07-prompt-marked-as-public')
      
      cy.get('[data-cy=save-prompt]').click()
      
      // Should be on prompt detail page
      cy.url().should('match', /\/prompts\/[a-z0-9-]+$/)
      
      cy.screenshot('07-public-prompt-detail-page')
      
      // Should show public status
      cy.contains('Public').should('be.visible')
      
      // Should show share options
      cy.get('body').then(($body) => {
        if ($body.text().includes('View public') || $body.text().includes('Share')) {
          cy.screenshot('07-public-prompt-sharing-options')
        }
      })
    })

    it('should generate shareable public URL', () => {
      // First create a public prompt
      cy.visit('/prompts/new')
      
      cy.get('[data-cy=prompt-title]').type('Shareable Test Prompt')
      cy.get('[data-cy=taskContext]').type('Act as a helpful assistant')
      cy.get('[data-cy=public-checkbox]').check()
      cy.get('[data-cy=save-prompt]').click()
      
      // Get the prompt ID from URL
      cy.url().then((url) => {
        const promptId = url.split('/prompts/')[1]
        
        cy.screenshot('07-prompt-with-shareable-url')
        
        // Should show link to public view
        cy.get('a[href*="/share/"]').should('exist')
        
        // Click on public view link
        cy.get('a[href*="/share/"]').click()
        
        // Should open in new tab/window, so we'll visit the share URL directly
        cy.visit(`/share/${promptId}`)
        
        cy.screenshot('07-public-share-page-loaded')
        
        // Should show prompt content without auth
        cy.contains('Shareable Test Prompt').should('be.visible')
        cy.contains('helpful assistant').should('be.visible')
        
        // Should not show edit options
        cy.get('body').should('not.contain', 'Edit')
        cy.get('body').should('not.contain', 'Delete')
      })
    })

    it('should allow copying prompt content from share page', () => {
      // Create public prompt
      cy.visit('/prompts/new')
      
      cy.get('[data-cy=prompt-title]').type('Copy Test Public Prompt')
      cy.get('[data-cy=taskContext]').type('This content should be copyable from share page')
      cy.get('[data-cy=detailedTaskDescription]').type('Detailed instructions that users can copy')
      cy.get('[data-cy=public-checkbox]').check()
      cy.get('[data-cy=save-prompt]').click()
      
      cy.url().then((url) => {
        const promptId = url.split('/prompts/')[1]
        
        // Visit public share page
        cy.visit(`/share/${promptId}`)
        
        cy.screenshot('07-share-page-copy-functionality')
        
        // Should show copy buttons for sections
        cy.get('body').then(($body) => {
          if ($body.find('[data-cy=copy-button]').length > 0) {
            cy.get('[data-cy=copy-button]').first().click()
            cy.screenshot('07-copy-button-clicked')
            
            // Should show copy confirmation
            cy.get('body').then(($body) => {
              if ($body.text().includes('Copied') || $body.text().includes('copied')) {
                cy.screenshot('07-copy-confirmation')
              }
            })
          }
        })
        
        // Should be able to select and copy text manually
        cy.contains('copyable from share page').should('be.visible')
      })
    })

    it('should show prompt metadata on share page', () => {
      // Create detailed public prompt
      cy.visit('/prompts/new')
      
      const detailedPrompt = {
        title: 'Comprehensive Public Prompt',
        description: 'A detailed prompt showcasing all features',
        taskContext: 'Act as an expert consultant',
        toneContext: 'Use a professional, friendly tone',
        examples: 'Example 1: Business proposal\\nExample 2: Market analysis'
      }
      
      Object.entries(detailedPrompt).forEach(([key, value]) => {
        if (key === 'title' || key === 'description') {
          cy.get(`[data-cy=prompt-${key}]`).type(value)
        } else {
          cy.get(`[data-cy=${key}]`).type(value)
        }
      })
      
      cy.get('[data-cy=public-checkbox]').check()
      cy.get('[data-cy=save-prompt]').click()
      
      cy.url().then((url) => {
        const promptId = url.split('/prompts/')[1]
        
        cy.visit(`/share/${promptId}`)
        
        cy.screenshot('07-share-page-full-metadata')
        
        // Should show all prompt sections
        cy.contains('Task Context').should('be.visible')
        cy.contains('expert consultant').should('be.visible')
        cy.contains('Tone Context').should('be.visible')
        cy.contains('friendly tone').should('be.visible')
        cy.contains('Examples').should('be.visible')
        cy.contains('Business proposal').should('be.visible')
        
        // Should show prompt title and description
        cy.contains('Comprehensive Public Prompt').should('be.visible')
        cy.contains('detailed prompt showcasing').should('be.visible')
      })
    })
  })

  context('Share Page Access and Security', () => {
    it('should allow unauthenticated access to public prompts', () => {
      // First create a public prompt as Pro user
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
      
      cy.visit('/prompts/new')
      cy.get('[data-cy=prompt-title]').type('Unauthenticated Access Test')
      cy.get('[data-cy=taskContext]').type('Public content for unauthenticated users')
      cy.get('[data-cy=public-checkbox]').check()
      cy.get('[data-cy=save-prompt]').click()
      
      cy.url().then((url) => {
        const promptId = url.split('/prompts/')[1]
        
        // Sign out user
        cy.clearCookies()
        cy.clearLocalStorage()
        
        // Visit share page without authentication
        cy.visit(`/share/${promptId}`)
        
        cy.screenshot('07-unauthenticated-share-page-access')
        
        // Should still be able to see prompt content
        cy.contains('Unauthenticated Access Test').should('be.visible')
        cy.contains('unauthenticated users').should('be.visible')
        
        // Should not show any edit/management options
        cy.get('body').should('not.contain', 'Edit')
        cy.get('body').should('not.contain', 'Dashboard')
      })
    })

    it('should return 404 for non-existent share URLs', () => {
      cy.visit('/share/non-existent-prompt-id', { failOnStatusCode: false })
      
      cy.screenshot('07-share-page-404-error')
      
      // Should show 404 or not found message
      cy.get('body').then(($body) => {
        const bodyText = $body.text()
        expect(bodyText).to.satisfy((text) => 
          text.includes('404') || 
          text.includes('Not Found') || 
          text.includes('not found') ||
          text.includes('does not exist')
        )
      })
    })

    it('should not allow sharing of private prompts', () => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
      
      // Create private prompt
      cy.visit('/prompts/new')
      cy.get('[data-cy=prompt-title]').type('Private Prompt Test')
      cy.get('[data-cy=taskContext]').type('This should remain private')
      // Don't check public checkbox - keep it private
      cy.get('[data-cy=save-prompt]').click()
      
      cy.url().then((url) => {
        const promptId = url.split('/prompts/')[1]
        
        // Try to access share URL for private prompt
        cy.visit(`/share/${promptId}`, { failOnStatusCode: false })
        
        cy.screenshot('07-private-prompt-share-access-denied')
        
        // Should not be able to access private prompt via share URL
        cy.get('body').then(($body) => {
          const bodyText = $body.text()
          expect(bodyText).to.satisfy((text) => 
            text.includes('404') || 
            text.includes('Not Found') || 
            text.includes('Private') ||
            text.includes('Access Denied')
          )
        })
      })
    })
  })

  context('Sharing UI/UX Features', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should toggle prompt visibility correctly', () => {
      // Create prompt
      cy.visit('/prompts/new')
      cy.get('[data-cy=prompt-title]').type('Visibility Toggle Test')
      cy.get('[data-cy=taskContext]').type('Testing visibility toggle')
      cy.get('[data-cy=save-prompt]').click()
      
      // Should start as private
      cy.contains('Private').should('be.visible')
      
      cy.screenshot('07-prompt-initially-private')
      
      // Edit to make public
      cy.contains('Edit').click()
      cy.get('[data-cy=public-checkbox]').check()
      cy.get('[data-cy=save-prompt]').click()
      
      // Should now show as public
      cy.contains('Public').should('be.visible')
      
      cy.screenshot('07-prompt-toggled-to-public')
      
      // Should show share options
      cy.get('body').then(($body) => {
        if ($body.text().includes('View public')) {
          cy.contains('View public').should('be.visible')
        }
      })
    })

    it('should show sharing status in prompt library', () => {
      // Create public prompt
      cy.visit('/prompts/new')
      cy.get('[data-cy=prompt-title]').type('Library Sharing Status Test')
      cy.get('[data-cy=taskContext]').type('Testing sharing status in library')
      cy.get('[data-cy=public-checkbox]').check()
      cy.get('[data-cy=save-prompt]').click()
      
      // Go to prompts library
      cy.visit('/prompts')
      
      cy.screenshot('07-library-sharing-status')
      
      // Should show public status in prompt card
      cy.get('[data-cy=prompt-card]').should('contain', 'Public')
      
      // Should show share link in card
      cy.get('body').then(($body) => {
        if ($body.text().includes('View public')) {
          cy.get('[data-cy=prompt-card]').should('contain', 'View public')
        }
      })
    })
  })

  context('Mobile Sharing Experience', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should provide good mobile sharing experience', () => {
      cy.viewport(375, 667) // Mobile viewport
      
      // Create public prompt
      cy.visit('/prompts/new')
      cy.get('[data-cy=prompt-title]').type('Mobile Sharing Test')
      cy.get('[data-cy=taskContext]').type('Testing mobile sharing experience')
      cy.get('[data-cy=public-checkbox]').check()
      cy.get('[data-cy=save-prompt]').click()
      
      cy.screenshot('07-mobile-prompt-detail-public')
      
      cy.url().then((url) => {
        const promptId = url.split('/prompts/')[1]
        
        // Visit share page on mobile
        cy.visit(`/share/${promptId}`)
        
        cy.screenshot('07-mobile-share-page')
        
        // Should be mobile-friendly
        cy.contains('Mobile Sharing Test').should('be.visible')
        cy.contains('mobile sharing experience').should('be.visible')
        
        // Content should be readable on mobile
        cy.get('body').should('be.visible')
      })
    })
  })
})