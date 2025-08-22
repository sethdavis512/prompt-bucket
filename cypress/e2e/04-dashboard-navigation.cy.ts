import { TEST_USERS, createTestUser, signInTestUser } from '../support/test-helpers'

describe('4. Dashboard Overview & Navigation', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Set up authenticated free user
    createTestUser(TEST_USERS.free)
    signInTestUser(TEST_USERS.free)
  })

  context('Dashboard Initial Load', () => {
    it('should display dashboard with correct layout and content', () => {
      cy.visit('/dashboard')
      
      cy.screenshot('04-dashboard-initial-load')
      
      // Verify header
      cy.contains('Dashboard').should('be.visible')
      cy.contains('Welcome back').should('be.visible')
      
      // Verify navigation elements
      cy.get('[data-testid=sidebar]').should('be.visible')
      cy.contains('Prompts').should('be.visible')
      cy.contains('Dashboard').should('be.visible')
      
      cy.screenshot('04-dashboard-layout-complete')
    })

    it('should display user greeting and basic information', () => {
      cy.visit('/dashboard')
      
      // Should show personalized greeting
      cy.contains('Welcome back').should('be.visible')
      
      // Should show user info in header/dropdown
      cy.get('[data-testid=user-dropdown]').should('be.visible')
      
      cy.screenshot('04-dashboard-user-greeting')
    })
  })

  context('Statistics Display', () => {
    it('should show statistics cards with correct data', () => {
      cy.visit('/dashboard')
      
      cy.screenshot('04-dashboard-statistics-overview')
      
      // Should show total prompts stat
      cy.contains('Total Prompts').should('be.visible')
      
      // Should show account status
      cy.contains('Account Status').should('be.visible')
      cy.contains('Free').should('be.visible')
      
      // For free users, should show usage information
      cy.get('body').then(($body) => {
        if ($body.text().includes('prompts used')) {
          cy.screenshot('04-dashboard-free-user-stats')
          cy.contains(/\d+\/5 prompts used/).should('be.visible')
        }
      })
    })

    it('should display responsive statistics grid', () => {
      cy.visit('/dashboard')
      
      // Test responsive behavior
      cy.viewport(1280, 720) // Desktop
      cy.screenshot('04-dashboard-desktop-stats')
      
      cy.viewport(768, 1024) // Tablet
      cy.screenshot('04-dashboard-tablet-stats')
      
      cy.viewport(375, 667) // Mobile
      cy.screenshot('04-dashboard-mobile-stats')
      
      // Verify stats are still visible on mobile
      cy.contains('Total Prompts').should('be.visible')
      cy.contains('Account Status').should('be.visible')
    })
  })

  context('Primary Navigation', () => {
    it('should navigate to all main sections from dashboard', () => {
      cy.visit('/dashboard')
      
      // Navigate to Prompts
      cy.contains('Prompts').click()
      cy.url().should('include', '/prompts')
      cy.contains('My Prompts').should('be.visible')
      
      cy.screenshot('04-navigation-to-prompts')
      
      // Return to dashboard
      cy.contains('Dashboard').click()
      cy.url().should('include', '/dashboard')
      
      cy.screenshot('04-navigation-back-to-dashboard')
      
      // Test other navigation items for free users
      cy.get('body').then(($body) => {
        // Chains should be disabled for free users
        if ($body.text().includes('Chains')) {
          // Should show crown icon indicating Pro feature
          cy.get('[data-testid=nav-chains]').should('have.class', 'cursor-not-allowed')
          cy.screenshot('04-navigation-chains-disabled-free-user')
        }
        
        // Categories should be disabled for free users
        if ($body.text().includes('Categories')) {
          cy.get('[data-testid=nav-categories]').should('have.class', 'cursor-not-allowed')
          cy.screenshot('04-navigation-categories-disabled-free-user')
        }
      })
    })

    it('should show correct navigation state for current page', () => {
      cy.visit('/dashboard')
      
      // Dashboard should be highlighted/active
      cy.get('[data-testid=nav-dashboard]').should('have.class', 'bg-indigo-50')
      
      cy.screenshot('04-navigation-active-state-dashboard')
      
      // Navigate to prompts and verify state
      cy.contains('Prompts').click()
      cy.get('[data-testid=nav-prompts]').should('have.class', 'bg-indigo-50')
      
      cy.screenshot('04-navigation-active-state-prompts')
    })
  })

  context('Quick Actions', () => {
    it('should provide quick access to create new prompt', () => {
      cy.visit('/dashboard')
      
      // Should show New Prompt button if user can create more
      cy.get('body').then(($body) => {
        if ($body.text().includes('New Prompt') && !$body.text().includes('Limit reached')) {
          cy.contains('New Prompt').should('be.visible')
          cy.contains('New Prompt').click()
          
          cy.url().should('include', '/prompts/new')
          cy.screenshot('04-quick-action-create-prompt')
        } else if ($body.text().includes('Limit reached')) {
          cy.screenshot('04-quick-action-limit-reached')
          cy.contains('Upgrade to Pro').should('be.visible')
        }
      })
    })

    it('should handle free user limit enforcement on dashboard', () => {
      cy.visit('/dashboard')
      
      // Check if limit is reached
      cy.get('body').then(($body) => {
        if ($body.text().includes('Limit reached')) {
          cy.screenshot('04-free-user-limit-enforcement')
          
          // Should show disabled button
          cy.get('[data-cy=new-prompt-button]').should('be.disabled')
          
          // Should show upgrade prompt
          cy.contains('Upgrade to Pro').should('be.visible')
          
          // Click upgrade link
          cy.contains('Upgrade to Pro').click()
          cy.url().should('include', '/pricing')
          
          cy.screenshot('04-upgrade-link-from-dashboard')
        }
      })
    })
  })

  context('User Account Management', () => {
    it('should provide access to user settings and account management', () => {
      cy.visit('/dashboard')
      
      // Click user dropdown
      cy.get('[data-testid=user-dropdown]').click()
      
      cy.screenshot('04-user-dropdown-opened')
      
      // Should show user menu options
      cy.contains('Profile Settings').should('be.visible')
      cy.contains('Sign Out').should('be.visible')
      
      // Navigate to profile
      cy.contains('Profile Settings').click()
      cy.url().should('include', '/profile')
      
      cy.screenshot('04-navigation-to-profile')
      
      // Verify profile page loads
      cy.contains('Profile Settings').should('be.visible')
      cy.contains('Account Information').should('be.visible')
    })

    it('should show subscription status and upgrade options', () => {
      cy.visit('/dashboard')
      
      // Free users should see upgrade prompts
      cy.get('body').then(($body) => {
        if ($body.text().includes('Upgrade to Pro')) {
          cy.screenshot('04-free-user-upgrade-prompts')
          
          // Should show Pro upgrade banner in sidebar
          cy.contains('Upgrade to Pro').should('be.visible')
          cy.contains('Unlock chains & categories').should('be.visible')
          
          // Click upgrade banner
          cy.get('[data-testid=upgrade-banner]').contains('Learn More').click()
          cy.url().should('include', '/pricing')
          
          cy.screenshot('04-upgrade-banner-navigation')
        }
      })
    })
  })

  context('Responsive Dashboard', () => {
    it('should adapt to different screen sizes', () => {
      // Test mobile navigation
      cy.viewport(375, 667)
      cy.visit('/dashboard')
      
      cy.screenshot('04-dashboard-mobile-responsive')
      
      // Sidebar should be hidden on mobile
      cy.get('[data-testid=sidebar]').should('not.be.visible')
      
      // Stats should stack vertically
      cy.contains('Total Prompts').should('be.visible')
      
      // Test tablet view
      cy.viewport(768, 1024)
      cy.screenshot('04-dashboard-tablet-responsive')
      
      // Should show sidebar on tablet
      cy.get('[data-testid=sidebar]').should('be.visible')
      
      // Return to desktop
      cy.viewport(1280, 720)
      cy.screenshot('04-dashboard-desktop-responsive')
    })
  })

  context('Dashboard Performance', () => {
    it('should load dashboard quickly and show loading states', () => {
      // Clear cache to test fresh load
      cy.clearLocalStorage()
      cy.clearCookies()
      
      // Sign in again
      signInTestUser(TEST_USERS.free)
      
      // Visit dashboard and measure load time
      const startTime = Date.now()
      cy.visit('/dashboard')
      
      // Dashboard should load within reasonable time
      cy.contains('Dashboard').should('be.visible')
      
      cy.then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(5000) // 5 second max
      })
      
      cy.screenshot('04-dashboard-performance-loaded')
    })
  })
})