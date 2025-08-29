import { 
  createTestPrompt,
  createTestChain,
  setupTeamScenario,
  createTeamPrompt,
  switchToTeam,
  signInTestUser
} from '../support/test-helpers'

describe('14. Team Workspace Collaboration', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Team Content Creation', () => {
    it('allows team members to create shared prompts', () => {
      setupTeamScenario('Prompt Collaboration Team').then(({ owner, team }) => {
        const promptTitle = `Team Prompt ${Date.now()}`
        
        createTeamPrompt(team.slug, { 
          title: promptTitle,
          description: 'Shared prompt for team collaboration',
          taskContext: 'Act as a team collaboration expert'
        }).then(() => {
          // Verify prompt appears in team prompts list
          cy.visit(`/teams/${team.slug}/prompts`)
          cy.contains(promptTitle).should('be.visible')
          cy.get('[data-cy=team-badge]').should('be.visible')
          cy.get('[data-cy=prompt-creator]').should('contain', owner.name)
        })
      })
    })

    it('allows team members to create shared chains', () => {
      setupTeamScenario('Chain Collaboration Team').then(({ team }) => {
        // First create some team prompts
        createTeamPrompt(team.slug, { title: 'Team Prompt 1' }).then(() => {
          createTeamPrompt(team.slug, { title: 'Team Prompt 2' }).then(() => {
            
            const chainName = `Team Chain ${Date.now()}`
            
            cy.visit(`/teams/${team.slug}/chains/new`)
            cy.get('[data-cy=chain-name]').type(chainName)
            cy.get('[data-cy=chain-description]').type('Shared chain for team')
            
            // Add team prompts to chain
            cy.get('[data-cy=available-prompt]').first().click()
            cy.get('[data-cy=available-prompt]').eq(1).click()
            
            cy.get('[data-cy=save-chain]').click()
            
            // Verify chain appears in team chains list
            cy.visit(`/teams/${team.slug}/chains`)
            cy.contains(chainName).should('be.visible')
            cy.get('[data-cy=team-badge]').should('be.visible')
          })
        })
      })
    })

    it('allows team members to create shared categories', () => {
      setupTeamScenario('Category Collaboration Team').then(({ team }) => {
        const categoryName = `Team Category ${Date.now()}`
        
        cy.visit(`/teams/${team.slug}/categories`)
        cy.get('[data-cy=new-category-btn]').click()
        
        cy.get('[data-cy=category-name]').type(categoryName)
        cy.get('[data-cy=category-color]').select('blue')
        cy.get('[data-cy=save-category]').click()
        
        // Verify category appears in team categories list
        cy.contains(categoryName).should('be.visible')
        cy.get('[data-cy=team-badge]').should('be.visible')
      })
    })
  })

  describe('Content Visibility & Access', () => {
    it('shows team content to all team members', () => {
      setupTeamScenario('Visibility Test Team').then(({ owner, member, team }) => {
        const sharedPromptTitle = `Shared Prompt ${Date.now()}`
        
        // Owner creates team prompt
        signInTestUser(owner).then(() => {
          createTeamPrompt(team.slug, { title: sharedPromptTitle })
        })
        
        // Member should see the shared prompt
        cy.clearCookies()
        signInTestUser(member).then(() => {
          switchToTeam(team.slug)
          
          cy.visit(`/teams/${team.slug}/prompts`)
          cy.contains(sharedPromptTitle).should('be.visible')
          
          // Member should be able to view prompt details
          cy.contains(sharedPromptTitle).click()
          cy.get('[data-cy=prompt-title]').should('contain', sharedPromptTitle)
          cy.get('[data-cy=created-by]').should('contain', owner.name)
        })
      })
    })

    it('separates personal and team content', () => {
      setupTeamScenario('Content Separation Team').then(({ owner, team }) => {
        const personalPrompt = `Personal Prompt ${Date.now()}`
        const teamPrompt = `Team Prompt ${Date.now()}`
        
        // Create personal prompt
        cy.visit('/prompts/new')
        createTestPrompt({ title: personalPrompt }, true)
        
        // Create team prompt
        createTeamPrompt(team.slug, { title: teamPrompt })
        
        // Personal workspace should only show personal content
        cy.visit('/prompts')
        cy.contains(personalPrompt).should('be.visible')
        cy.contains(teamPrompt).should('not.exist')
        
        // Team workspace should only show team content
        cy.visit(`/teams/${team.slug}/prompts`)
        cy.contains(teamPrompt).should('be.visible')
        cy.contains(personalPrompt).should('not.exist')
      })
    })

    it('shows content creator attribution', () => {
      setupTeamScenario('Attribution Team').then(({ owner, member, team }) => {
        const ownerPrompt = `Owner Prompt ${Date.now()}`
        const memberPrompt = `Member Prompt ${Date.now()}`
        
        // Owner creates prompt
        signInTestUser(owner).then(() => {
          createTeamPrompt(team.slug, { title: ownerPrompt })
        })
        
        // Member creates prompt
        cy.clearCookies()
        signInTestUser(member).then(() => {
          createTeamPrompt(team.slug, { title: memberPrompt })
          
          // Check attribution in team prompts list
          cy.visit(`/teams/${team.slug}/prompts`)
          cy.get('[data-cy=prompt-list]').should('contain', owner.name)
          cy.get('[data-cy=prompt-list]').should('contain', member.name)
        })
      })
    })
  })

  describe('Workspace Switching', () => {
    it('allows switching between personal and team workspaces', () => {
      setupTeamScenario('Workspace Switch Team').then(({ team }) => {
        // Should start in personal workspace
        cy.visit('/dashboard')
        cy.get('[data-cy=current-workspace]').should('contain', 'Personal')
        
        // Switch to team workspace
        switchToTeam(team.slug)
        cy.get('[data-cy=current-workspace]').should('contain', team.name)
        cy.url().should('include', `/teams/${team.slug}`)
        
        // Switch back to personal
        cy.get('[data-cy=team-switcher]').click()
        cy.get('[data-cy=switch-to-personal]').click()
        cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard`)
        cy.get('[data-cy=current-workspace]').should('contain', 'Personal')
      })
    })

    it('maintains context when navigating within team workspace', () => {
      setupTeamScenario('Context Team').then(({ team }) => {
        switchToTeam(team.slug)
        
        // Navigate through team sections
        cy.get('[data-cy=nav-prompts]').click()
        cy.url().should('include', `/teams/${team.slug}/prompts`)
        cy.get('[data-cy=current-workspace]').should('contain', team.name)
        
        cy.get('[data-cy=nav-chains]').click()
        cy.url().should('include', `/teams/${team.slug}/chains`)
        cy.get('[data-cy=current-workspace]').should('contain', team.name)
        
        cy.get('[data-cy=nav-categories]').click()
        cy.url().should('include', `/teams/${team.slug}/categories`)
        cy.get('[data-cy=current-workspace]').should('contain', team.name)
      })
    })
  })

  describe('Team Dashboard', () => {
    it('shows team statistics and activity', () => {
      setupTeamScenario('Dashboard Team').then(({ team }) => {
        // Create some team content
        createTeamPrompt(team.slug, { title: 'Dashboard Test Prompt' }).then(() => {
          cy.visit(`/teams/${team.slug}/dashboard`)
          
          // Should show team stats
          cy.get('[data-cy=team-stats]').should('be.visible')
          cy.get('[data-cy=prompt-count]').should('contain', '1')
          cy.get('[data-cy=member-count]').should('contain', '1')
          
          // Should show recent activity
          cy.get('[data-cy=recent-activity]').should('be.visible')
          cy.contains('Dashboard Test Prompt').should('be.visible')
        })
      })
    })

    it('provides quick access to team actions', () => {
      setupTeamScenario('Actions Team').then(({ team }) => {
        cy.visit(`/teams/${team.slug}/dashboard`)
        
        // Should have quick action buttons
        cy.get('[data-cy=new-team-prompt-btn]').should('be.visible')
        cy.get('[data-cy=new-team-chain-btn]').should('be.visible')
        cy.get('[data-cy=invite-members-btn]').should('be.visible')
        
        // Test quick prompt creation
        cy.get('[data-cy=new-team-prompt-btn]').click()
        cy.url().should('include', `/teams/${team.slug}/prompts/new`)
      })
    })
  })

  describe('Collaborative Editing', () => {
    it('allows multiple team members to edit shared content', () => {
      setupTeamScenario('Edit Collaboration Team').then(({ owner, member, team }) => {
        const originalTitle = `Editable Prompt ${Date.now()}`
        const editedTitle = `${originalTitle} - Edited`
        
        // Owner creates prompt
        signInTestUser(owner).then(() => {
          createTeamPrompt(team.slug, { title: originalTitle }).then(() => {
            
            // Member edits the prompt
            cy.clearCookies()
            signInTestUser(member).then(() => {
              cy.visit(`/teams/${team.slug}/prompts`)
              cy.contains(originalTitle).click()
              
              cy.get('[data-cy=edit-prompt-btn]').click()
              cy.get('[data-cy=prompt-title]').clear().type(editedTitle)
              cy.get('[data-cy=save-prompt]').click()
              
              // Verify edit was successful
              cy.contains(editedTitle).should('be.visible')
              cy.get('[data-cy=last-edited-by]').should('contain', member.name)
            })
          })
        })
      })
    })

    it('shows edit history and version information', () => {
      setupTeamScenario('Version Team').then(({ owner, member, team }) => {
        const promptTitle = `Versioned Prompt ${Date.now()}`
        
        signInTestUser(owner).then(() => {
          createTeamPrompt(team.slug, { title: promptTitle }).then(() => {
            
            cy.clearCookies()
            signInTestUser(member).then(() => {
              cy.visit(`/teams/${team.slug}/prompts`)
              cy.contains(promptTitle).click()
              
              // Should show creation info
              cy.get('[data-cy=created-by]').should('contain', owner.name)
              cy.get('[data-cy=created-date]').should('be.visible')
              
              // Edit prompt to create version history
              cy.get('[data-cy=edit-prompt-btn]').click()
              cy.get('[data-cy=prompt-description]').clear().type('Updated description')
              cy.get('[data-cy=save-prompt]').click()
              
              // Should show last edited info
              cy.get('[data-cy=last-edited-by]').should('contain', member.name)
              cy.get('[data-cy=last-edited-date]').should('be.visible')
            })
          })
        })
      })
    })
  })

  describe('Search and Filtering in Team Context', () => {
    it('allows searching within team content', () => {
      setupTeamScenario('Search Team').then(({ team }) => {
        const searchablePrompt = `Searchable Prompt ${Date.now()}`
        
        createTeamPrompt(team.slug, { 
          title: searchablePrompt,
          description: 'This prompt contains unique searchable content'
        }).then(() => {
          cy.visit(`/teams/${team.slug}/prompts`)
          
          // Search for team content
          cy.get('[data-cy=search-input]').type('searchable')
          cy.get('[data-cy=search-btn]').click()
          
          cy.contains(searchablePrompt).should('be.visible')
          cy.get('[data-cy=search-results]').should('contain', '1 result')
        })
      })
    })

    it('filters team content by categories', () => {
      setupTeamScenario('Filter Team').then(({ team }) => {
        // Create category and prompt with category
        cy.visit(`/teams/${team.slug}/categories`)
        cy.get('[data-cy=new-category-btn]').click()
        
        const categoryName = `Filter Category ${Date.now()}`
        cy.get('[data-cy=category-name]').type(categoryName)
        cy.get('[data-cy=save-category]').click()
        
        // Create prompt with this category
        const categorizedPrompt = `Categorized Prompt ${Date.now()}`
        createTeamPrompt(team.slug, { title: categorizedPrompt }).then(() => {
          
          // Apply category to prompt
          cy.visit(`/teams/${team.slug}/prompts`)
          cy.contains(categorizedPrompt).click()
          cy.get('[data-cy=edit-prompt-btn]').click()
          cy.get('[data-cy=prompt-categories]').select(categoryName)
          cy.get('[data-cy=save-prompt]').click()
          
          // Filter by category
          cy.visit(`/teams/${team.slug}/prompts`)
          cy.get('[data-cy=filter-by-category]').select(categoryName)
          
          cy.contains(categorizedPrompt).should('be.visible')
          cy.get('[data-cy=category-badge]').should('contain', categoryName)
        })
      })
    })
  })
})