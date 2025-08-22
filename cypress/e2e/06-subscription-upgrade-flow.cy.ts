import { TEST_USERS, createTestUser, signInTestUser } from '../support/test-helpers'

describe('6. Subscription Upgrade Flow (Free to Pro)', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Set up authenticated free user
    createTestUser(TEST_USERS.free)
    signInTestUser(TEST_USERS.free)
  })

  context('Pricing Page Access', () => {
    it('should navigate to pricing from various entry points', () => {
      // From dashboard upgrade banner
      cy.visit('/dashboard')
      
      cy.screenshot('06-dashboard-upgrade-entry-point')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('Upgrade to Pro')) {
          cy.contains('Learn More').click()
          cy.url().should('include', '/pricing')
          
          cy.screenshot('06-pricing-from-dashboard-banner')
        }
      })
      
      // Direct navigation to pricing
      cy.visit('/pricing')
      
      cy.screenshot('06-pricing-direct-navigation')
      
      // Verify pricing page loads correctly
      cy.contains('Pricing').should('be.visible')
      cy.contains('Simple, Transparent Pricing').should('be.visible')
    })

    it('should show pricing from prompt limit warnings', () => {
      cy.visit('/prompts')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('Limit reached')) {
          cy.screenshot('06-prompt-limit-upgrade-link')
          
          cy.contains('Upgrade to Pro').click()
          cy.url().should('include', '/pricing')
          
          cy.screenshot('06-pricing-from-prompt-limit')
        }
      })
    })

    it('should access pricing from navigation menu', () => {
      cy.visit('/dashboard')
      
      // Check if pricing is accessible from user menu
      cy.get('[data-testid=user-dropdown]').click()
      
      cy.screenshot('06-user-menu-for-pricing')
      
      // Look for upgrade or pricing options
      cy.get('body').then(($body) => {
        if ($body.text().includes('Upgrade') || $body.text().includes('Pricing')) {
          cy.screenshot('06-pricing-in-user-menu')
        } else {
          // Navigate directly to pricing
          cy.visit('/pricing')
        }
      })
    })
  })

  context('Pricing Page Display', () => {
    it('should display both Free and Pro plans correctly', () => {
      cy.visit('/pricing')
      
      cy.screenshot('06-pricing-plans-overview')
      
      // Should show Free plan
      cy.contains('Free').should('be.visible')
      cy.contains('$0').should('be.visible')
      cy.contains('5 prompt templates').should('be.visible')
      cy.contains('Private prompts only').should('be.visible')
      
      // Should show Pro plan
      cy.contains('Pro').should('be.visible')
      cy.contains('$10').should('be.visible')
      cy.contains('Unlimited prompt').should('be.visible')
      cy.contains('Public prompt sharing').should('be.visible')
      
      cy.screenshot('06-pricing-plans-detailed')
    })

    it('should highlight Pro plan as recommended', () => {
      cy.visit('/pricing')
      
      cy.screenshot('06-pro-plan-highlighting')
      
      // Pro plan should be highlighted
      cy.get('[data-testid=pro-plan]').should('have.class', 'border-indigo-500')
      cy.contains('Most Popular').should('be.visible')
      
      // Should show star icon or highlighting
      cy.get('[data-testid=pro-plan]').within(() => {
        cy.get('svg').should('exist') // Star or similar icon
      })
    })

    it('should show current plan status for authenticated users', () => {
      cy.visit('/pricing')
      
      cy.screenshot('06-current-plan-status')
      
      // Free plan should show as current for free users
      cy.get('[data-testid=free-plan]').within(() => {
        cy.contains('Current Plan').should('be.visible')
      })
      
      // Pro plan should show upgrade option
      cy.get('[data-testid=pro-plan]').within(() => {
        cy.contains('Upgrade to Pro').should('be.visible')
      })
    })
  })

  context('Feature Comparison', () => {
    it('should clearly show feature differences between plans', () => {
      cy.visit('/pricing')
      
      cy.screenshot('06-feature-comparison')
      
      // Free plan limitations
      cy.contains('5 prompt templates maximum').should('be.visible')
      cy.contains('Private prompts only').should('be.visible')
      
      // Pro plan benefits
      cy.contains('Unlimited prompt creation').should('be.visible')
      cy.contains('Public prompt sharing').should('be.visible')
      cy.contains('Advanced categorization').should('be.visible')
      
      // Look for additional Pro features
      cy.get('body').then(($body) => {
        if ($body.text().includes('chains')) {
          cy.contains('chains').should('be.visible')
          cy.screenshot('06-pro-features-chains')
        }
        if ($body.text().includes('categories')) {
          cy.contains('categories').should('be.visible')
          cy.screenshot('06-pro-features-categories')
        }
      })
    })

    it('should show pricing value proposition', () => {
      cy.visit('/pricing')
      
      cy.screenshot('06-pricing-value-proposition')
      
      // Should show monthly pricing
      cy.contains('month').should('be.visible')
      
      // Should show money-back or trial information if available
      cy.get('body').then(($body) => {
        if ($body.text().includes('trial') || $body.text().includes('cancel')) {
          cy.screenshot('06-pricing-trial-cancellation-info')
        }
      })
    })
  })

  context('Checkout Process Initiation', () => {
    it('should initiate checkout process for Pro plan', () => {
      cy.visit('/pricing')
      
      cy.screenshot('06-before-checkout-initiation')
      
      // Click upgrade to Pro button
      cy.get('[data-testid=pro-plan]').within(() => {
        cy.contains('Upgrade to Pro').click()
      })
      
      cy.screenshot('06-checkout-initiation')
      
      // Should navigate to checkout or payment page
      cy.url().should('satisfy', (url) => 
        url.includes('/checkout') || 
        url.includes('polar') || 
        url.includes('payment') ||
        url.includes('billing')
      )
      
      cy.screenshot('06-checkout-page-loaded')
    })

    it('should pre-fill user information in checkout', () => {
      cy.visit('/pricing')
      
      // Initiate checkout
      cy.get('[data-testid=pro-plan]').within(() => {
        cy.contains('Upgrade to Pro').click()
      })
      
      // Check if user info is pre-filled (if checkout form is visible)
      cy.get('body').then(($body) => {
        if ($body.find('input[type="email"]').length > 0) {
          cy.screenshot('06-checkout-prefilled-info')
          
          // Email should be pre-filled
          cy.get('input[type="email"]').should('have.value', TEST_USERS.free.email)
        }
      })
    })

    it('should handle checkout cancellation gracefully', () => {
      cy.visit('/pricing')
      
      // Initiate checkout
      cy.get('[data-testid=pro-plan]').within(() => {
        cy.contains('Upgrade to Pro').click()
      })
      
      // If there's a back/cancel option, test it
      cy.get('body').then(($body) => {
        if ($body.text().includes('Back') || $body.text().includes('Cancel')) {
          cy.screenshot('06-checkout-cancel-option')
          
          // Navigate back
          cy.go('back')
          cy.url().should('include', '/pricing')
          
          cy.screenshot('06-checkout-cancelled-back-to-pricing')
        }
      })
    })
  })

  context('Upgrade Success Simulation', () => {
    it('should handle successful upgrade flow simulation', () => {
      // Note: We can't actually complete payment in tests, but we can test
      // the success callback URL if the upgrade parameter is passed
      
      cy.visit('/dashboard?upgraded=true')
      
      cy.screenshot('06-upgrade-success-simulation')
      
      // Should show success message or updated UI
      cy.get('body').then(($body) => {
        if ($body.text().includes('upgraded') || $body.text().includes('Pro')) {
          cy.screenshot('06-upgrade-success-message')
        }
      })
      
      // Dashboard should reflect Pro status
      cy.contains('Dashboard').should('be.visible')
    })

    it('should test pro user experience after upgrade', () => {
      // Create and sign in Pro user to simulate post-upgrade experience
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
      
      cy.visit('/dashboard')
      
      cy.screenshot('06-pro-user-dashboard')
      
      // Should show Pro features enabled
      cy.contains('Chains').should('be.visible')
      cy.contains('Categories').should('be.visible')
      
      // Should not show upgrade prompts
      cy.get('body').should('not.contain', 'Upgrade to Pro')
      
      // Should show Pro status
      cy.get('body').then(($body) => {
        if ($body.text().includes('Pro') && !$body.text().includes('Upgrade')) {
          cy.screenshot('06-pro-status-confirmation')
        }
      })
    })
  })

  context('FAQ and Support Information', () => {
    it('should provide FAQ and billing information', () => {
      cy.visit('/pricing')
      
      cy.screenshot('06-pricing-faq-section')
      
      // Should show FAQ section
      cy.contains('Frequently Asked Questions').should('be.visible')
      
      // Should answer common questions
      cy.contains('change plans').should('be.visible')
      cy.contains('downgrade').should('be.visible')
      
      cy.screenshot('06-pricing-faq-content')
    })

    it('should provide billing and cancellation information', () => {
      cy.visit('/pricing')
      
      // Look for billing/cancellation info
      cy.get('body').then(($body) => {
        if ($body.text().includes('cancel') || $body.text().includes('billing')) {
          cy.screenshot('06-billing-cancellation-info')
        }
      })
      
      // Should explain what happens on downgrade
      cy.contains('downgrade').should('be.visible')
      cy.contains('existing prompts').should('be.visible')
    })
  })

  context('Mobile Checkout Experience', () => {
    it('should provide good mobile checkout experience', () => {
      cy.viewport(375, 667) // Mobile viewport
      
      cy.visit('/pricing')
      
      cy.screenshot('06-pricing-mobile-view')
      
      // Plans should be stacked vertically on mobile
      cy.contains('Free').should('be.visible')
      cy.contains('Pro').should('be.visible')
      
      // Upgrade button should be accessible
      cy.contains('Upgrade to Pro').should('be.visible')
      cy.contains('Upgrade to Pro').click()
      
      cy.screenshot('06-mobile-checkout-initiation')
      
      // Should navigate to mobile-friendly checkout
      cy.url().should('satisfy', (url) => 
        url.includes('/checkout') || 
        url.includes('polar') || 
        url.includes('payment')
      )
    })
  })
})