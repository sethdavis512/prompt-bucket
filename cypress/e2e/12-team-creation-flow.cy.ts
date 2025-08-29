import { 
  createProUserWithSubscription, 
  createAndSignInUser,
  createTestTeam,
  signInTestUser
} from '../support/test-helpers'

describe('12. Team Creation Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Pro User Team Creation', () => {
    it('allows Pro user to create a team', () => {
      createProUserWithSubscription('team-creator').then((user) => {
        cy.visit('/teams/new')
        
        const teamName = `Test Team ${Date.now()}`
        const teamSlug = teamName.toLowerCase().replace(/\s+/g, '-')
        
        cy.get('[data-cy=team-name]').type(teamName)
        cy.get('[data-cy=team-slug]').type(teamSlug)
        cy.get('[data-cy=create-team-btn]').click()
        
        // Should redirect to team dashboard
        cy.url().should('include', `/teams/${teamSlug}/dashboard`)
        cy.contains(teamName).should('be.visible')
        
        // Should show team stats
        cy.contains('0 Members').should('be.visible')
        cy.contains('0 Prompts').should('be.visible')
      })
    })

    it('validates team creation form', () => {
      createProUserWithSubscription('team-validator').then(() => {
        cy.visit('/teams/new')
        
        // Try to create without name
        cy.get('[data-cy=create-team-btn]').click()
        cy.contains('Team name is required').should('be.visible')
        
        // Add name but invalid slug
        cy.get('[data-cy=team-name]').type('Valid Team Name')
        cy.get('[data-cy=team-slug]').type('invalid slug with spaces')
        cy.get('[data-cy=create-team-btn]').click()
        cy.contains('Team slug must be lowercase').should('be.visible')
        
        // Fix slug
        cy.get('[data-cy=team-slug]').clear().type('valid-team-slug')
        cy.get('[data-cy=create-team-btn]').click()
        
        // Should succeed
        cy.url().should('include', '/teams/valid-team-slug/dashboard')
      })
    })

    it('prevents duplicate team slug creation', () => {
      const teamSlug = `duplicate-test-${Date.now()}`
      
      createProUserWithSubscription('team-duplicate-1').then(() => {
        createTestTeam({ name: 'First Team', slug: teamSlug }).then(() => {
          // Create second user and try same slug
          createProUserWithSubscription('team-duplicate-2').then(() => {
            cy.visit('/teams/new')
            
            cy.get('[data-cy=team-name]').type('Second Team')
            cy.get('[data-cy=team-slug]').type(teamSlug)
            cy.get('[data-cy=create-team-btn]').click()
            
            cy.contains('Team slug already exists').should('be.visible')
          })
        })
      })
    })
  })

  describe('Free User Restrictions', () => {
    it('prevents free users from creating teams', () => {
      createAndSignInUser('free', 'free-team-creator').then(() => {
        cy.visit('/teams/new')
        
        // Should show upgrade prompt
        cy.contains('Upgrade to Pro').should('be.visible')
        cy.get('[data-cy=create-team-btn]').should('be.disabled')
        
        // Should have upgrade link
        cy.get('[data-cy=upgrade-link]').should('have.attr', 'href', '/pricing')
      })
    })

    it('shows feature gate on teams index page', () => {
      createAndSignInUser('free', 'free-teams-viewer').then(() => {
        cy.visit('/teams')
        
        // Should show empty state with upgrade prompt
        cy.contains('No teams yet').should('be.visible')
        cy.contains('Upgrade to Pro to create teams').should('be.visible')
        cy.get('[data-cy=upgrade-to-pro-btn]').should('be.visible')
      })
    })
  })

  describe('Team Navigation', () => {
    it('shows created team in teams list', () => {
      createProUserWithSubscription('team-lister').then(() => {
        const teamName = `Listed Team ${Date.now()}`
        
        createTestTeam({ name: teamName }).then((team) => {
          cy.visit('/teams')
          
          // Should show team in list
          cy.contains(teamName).should('be.visible')
          cy.contains(`/${team.slug}`).should('be.visible')
          
          // Should have Open Team button
          cy.get('[data-cy=open-team-btn]').should('be.visible')
          cy.get('[data-cy=open-team-btn]').click()
          
          cy.url().should('include', `/teams/${team.slug}/dashboard`)
        })
      })
    })

    it('allows navigation between personal and team workspaces', () => {
      createProUserWithSubscription('workspace-switcher').then(() => {
        const teamName = `Workspace Team ${Date.now()}`
        
        createTestTeam({ name: teamName }).then((team) => {
          // Should be on team dashboard
          cy.url().should('include', `/teams/${team.slug}/dashboard`)
          
          // Switch to personal workspace
          cy.get('[data-cy=team-switcher]').click()
          cy.get('[data-cy=switch-to-personal]').click()
          cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard`)
          
          // Switch back to team
          cy.get('[data-cy=team-switcher]').click()
          cy.get(`[data-cy=switch-to-${team.slug}]`).click()
          cy.url().should('include', `/teams/${team.slug}/dashboard`)
        })
      })
    })
  })

  describe('Team Settings Access', () => {
    it('allows team creator to access settings', () => {
      createProUserWithSubscription('team-settings-owner').then(() => {
        const teamName = `Settings Team ${Date.now()}`
        
        createTestTeam({ name: teamName }).then((team) => {
          // Navigate to team settings
          cy.visit(`/teams/${team.slug}/settings`)
          
          // Should show team settings
          cy.contains('Team Settings').should('be.visible')
          cy.contains(teamName).should('be.visible')
          
          // Should show member management
          cy.get('[data-cy=team-members-section]').should('be.visible')
          cy.get('[data-cy=invite-member-btn]').should('be.visible')
        })
      })
    })
  })
})