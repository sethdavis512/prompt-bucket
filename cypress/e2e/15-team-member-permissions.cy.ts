import { 
  setupTeamScenario,
  signInTestUser,
  createTeamPrompt,
  inviteUserToTeam
} from '../support/test-helpers'

describe('15. Team Member Permissions', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Admin Permissions', () => {
    it('allows team admins to access all team settings', () => {
      setupTeamScenario('Admin Settings Team').then(({ owner, team }) => {
        signInTestUser(owner).then(() => {
          cy.visit(`/teams/${team.slug}/settings`)
          
          // Admin should see all settings sections
          cy.get('[data-cy=team-info-section]').should('be.visible')
          cy.get('[data-cy=team-members-section]').should('be.visible')
          cy.get('[data-cy=team-billing-section]').should('be.visible')
          cy.get('[data-cy=danger-zone-section]').should('be.visible')
          
          // Should have access to invite members
          cy.get('[data-cy=invite-member-btn]').should('be.visible')
          cy.get('[data-cy=invite-member-btn]').should('not.be.disabled')
        })
      })
    })

    it('allows team admins to manage team members', () => {
      setupTeamScenario('Member Management Team').then(({ owner, member, team }) => {
        signInTestUser(owner).then(() => {
          cy.visit(`/teams/${team.slug}/settings/members`)
          
          // Should show member management controls
          cy.get('[data-cy=team-members-list]').should('be.visible')
          cy.get('[data-cy=change-member-role]').should('be.visible')
          cy.get('[data-cy=remove-member-btn]').should('be.visible')
          
          // Should be able to change member roles
          cy.get(`[data-cy=member-role-${member.email.replace('@', '-').replace('.', '-')}]`).should('not.be.disabled')
        })
      })
    })

    it('allows team admins to edit team information', () => {
      setupTeamScenario('Team Edit Team').then(({ owner, team }) => {
        signInTestUser(owner).then(() => {
          cy.visit(`/teams/${team.slug}/settings`)
          
          const newTeamName = `${team.name} - Updated`
          
          // Edit team name
          cy.get('[data-cy=edit-team-info-btn]').click()
          cy.get('[data-cy=team-name-input]').clear().type(newTeamName)
          cy.get('[data-cy=save-team-info]').click()
          
          cy.contains('Team information updated').should('be.visible')
          cy.contains(newTeamName).should('be.visible')
        })
      })
    })

    it('allows team admins to delete team (danger zone)', () => {
      setupTeamScenario('Delete Team Test').then(({ owner, team }) => {
        signInTestUser(owner).then(() => {
          cy.visit(`/teams/${team.slug}/settings`)
          
          // Should show danger zone
          cy.get('[data-cy=danger-zone-section]').should('be.visible')
          cy.get('[data-cy=delete-team-btn]').should('be.visible')
          
          // Delete team with confirmation
          cy.get('[data-cy=delete-team-btn]').click()
          cy.get('[data-cy=confirm-team-name]').type(team.name)
          cy.get('[data-cy=confirm-delete-team]').click()
          
          // Should redirect to teams list
          cy.url().should('include', '/teams')
          cy.contains('Team deleted successfully').should('be.visible')
          cy.contains(team.name).should('not.exist')
        })
      })
    })
  })

  describe('Member Permissions', () => {
    it('restricts regular members from accessing team settings', () => {
      setupTeamScenario('Member Restriction Team').then(({ member, team }) => {
        cy.clearCookies()
        signInTestUser(member).then(() => {
          // Direct access to settings should be blocked
          cy.visit(`/teams/${team.slug}/settings`, { failOnStatusCode: false })
          
          // Should redirect to access denied or show limited view
          cy.url().should('match', /(access-denied|unauthorized)/)
          cy.contains('Access denied').should('be.visible')
        })
      })
    })

    it('allows members to view but not manage team members', () => {
      setupTeamScenario('Member View Team').then(({ member, team }) => {
        cy.clearCookies()
        signInTestUser(member).then(() => {
          cy.visit(`/teams/${team.slug}/members`)
          
          // Should see member list
          cy.get('[data-cy=team-members-list]').should('be.visible')
          
          // Should not see management controls
          cy.get('[data-cy=invite-member-btn]').should('not.exist')
          cy.get('[data-cy=remove-member-btn]').should('not.exist')
          cy.get('[data-cy=change-member-role]').should('not.exist')
        })
      })
    })

    it('allows members to create and edit team content', () => {
      setupTeamScenario('Content Creation Team').then(({ member, team }) => {
        const memberPrompt = `Member Created Prompt ${Date.now()}`
        
        cy.clearCookies()
        signInTestUser(member).then(() => {
          // Member should be able to create prompts
          createTeamPrompt(team.slug, { title: memberPrompt }).then(() => {
            cy.visit(`/teams/${team.slug}/prompts`)
            cy.contains(memberPrompt).should('be.visible')
            
            // Member should be able to edit their own content
            cy.contains(memberPrompt).click()
            cy.get('[data-cy=edit-prompt-btn]').should('be.visible')
            cy.get('[data-cy=edit-prompt-btn]').click()
            
            cy.get('[data-cy=prompt-description]').clear().type('Updated by member')
            cy.get('[data-cy=save-prompt]').click()
            
            cy.contains('Updated by member').should('be.visible')
          })
        })
      })
    })

    it('allows members to edit content created by other team members', () => {
      setupTeamScenario('Collaborative Edit Team').then(({ owner, member, team }) => {
        const sharedPrompt = `Shared Editable Prompt ${Date.now()}`
        
        // Owner creates prompt
        signInTestUser(owner).then(() => {
          createTeamPrompt(team.slug, { title: sharedPrompt }).then(() => {
            
            // Member edits owner's prompt
            cy.clearCookies()
            signInTestUser(member).then(() => {
              cy.visit(`/teams/${team.slug}/prompts`)
              cy.contains(sharedPrompt).click()
              
              cy.get('[data-cy=edit-prompt-btn]').should('be.visible')
              cy.get('[data-cy=edit-prompt-btn]').click()
              
              cy.get('[data-cy=prompt-description]').clear().type('Edited by team member')
              cy.get('[data-cy=save-prompt]').click()
              
              cy.contains('Edited by team member').should('be.visible')
              cy.get('[data-cy=last-edited-by]').should('contain', member.name)
            })
          })
        })
      })
    })
  })

  describe('Role-Based Navigation', () => {
    it('shows different navigation options based on role', () => {
      setupTeamScenario('Navigation Role Team').then(({ owner, member, team }) => {
        // Admin view
        signInTestUser(owner).then(() => {
          cy.visit(`/teams/${team.slug}/dashboard`)
          
          cy.get('[data-cy=team-settings-link]').should('be.visible')
          cy.get('[data-cy=team-billing-link]').should('be.visible')
          cy.get('[data-cy=invite-members-btn]').should('be.visible')
        })
        
        // Member view
        cy.clearCookies()
        signInTestUser(member).then(() => {
          cy.visit(`/teams/${team.slug}/dashboard`)
          
          cy.get('[data-cy=team-settings-link]').should('not.exist')
          cy.get('[data-cy=team-billing-link]').should('not.exist')
          cy.get('[data-cy=invite-members-btn]').should('not.exist')
        })
      })
    })

    it('shows appropriate context menus based on permissions', () => {
      setupTeamScenario('Context Menu Team').then(({ owner, member, team }) => {
        const testPrompt = `Context Menu Prompt ${Date.now()}`
        
        signInTestUser(owner).then(() => {
          createTeamPrompt(team.slug, { title: testPrompt }).then(() => {
            
            // Admin context menu
            cy.visit(`/teams/${team.slug}/prompts`)
            cy.get(`[data-cy=prompt-menu-${testPrompt.replace(/\s+/g, '-')}]`).click()
            
            cy.get('[data-cy=edit-prompt-option]').should('be.visible')
            cy.get('[data-cy=delete-prompt-option]').should('be.visible')
            cy.get('[data-cy=share-prompt-option]').should('be.visible')
            
            // Member context menu
            cy.clearCookies()
            signInTestUser(member).then(() => {
              cy.visit(`/teams/${team.slug}/prompts`)
              cy.get(`[data-cy=prompt-menu-${testPrompt.replace(/\s+/g, '-')}]`).click()
              
              cy.get('[data-cy=edit-prompt-option]').should('be.visible')
              cy.get('[data-cy=delete-prompt-option]').should('not.exist') // Members can't delete others' content
              cy.get('[data-cy=share-prompt-option]').should('be.visible')
            })
          })
        })
      })
    })
  })

  describe('Ownership and Creation Rights', () => {
    it('tracks content ownership correctly', () => {
      setupTeamScenario('Ownership Team').then(({ owner, member, team }) => {
        const ownerPrompt = `Owner Prompt ${Date.now()}`
        const memberPrompt = `Member Prompt ${Date.now()}`
        
        // Owner creates content
        signInTestUser(owner).then(() => {
          createTeamPrompt(team.slug, { title: ownerPrompt }).then(() => {
            
            // Member creates content
            cy.clearCookies()
            signInTestUser(member).then(() => {
              createTeamPrompt(team.slug, { title: memberPrompt }).then(() => {
                
                // Check ownership display
                cy.visit(`/teams/${team.slug}/prompts`)
                
                cy.get('[data-cy=prompt-list]').within(() => {
                  cy.contains(ownerPrompt).parents('[data-cy=prompt-card]')
                    .should('contain', owner.name)
                  
                  cy.contains(memberPrompt).parents('[data-cy=prompt-card]')
                    .should('contain', member.name)
                })
              })
            })
          })
        })
      })
    })

    it('allows content transfer between team members', () => {
      setupTeamScenario('Transfer Team').then(({ owner, member, team }) => {
        const transferPrompt = `Transfer Prompt ${Date.now()}`
        
        signInTestUser(owner).then(() => {
          createTeamPrompt(team.slug, { title: transferPrompt }).then(() => {
            
            // Transfer ownership to member
            cy.visit(`/teams/${team.slug}/prompts`)
            cy.contains(transferPrompt).click()
            
            cy.get('[data-cy=prompt-settings-btn]').click()
            cy.get('[data-cy=transfer-ownership-btn]').click()
            cy.get('[data-cy=transfer-to-member]').select(member.email)
            cy.get('[data-cy=confirm-transfer]').click()
            
            cy.contains('Ownership transferred').should('be.visible')
            cy.get('[data-cy=prompt-owner]').should('contain', member.name)
          })
        })
      })
    })
  })

  describe('Permission Enforcement', () => {
    it('enforces permissions on API endpoints', () => {
      setupTeamScenario('API Permission Team').then(({ member, team }) => {
        cy.clearCookies()
        signInTestUser(member).then(() => {
          
          // Member should not be able to access admin endpoints
          cy.request({
            method: 'DELETE',
            url: `/api/teams/${team.slug}`,
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.eq(403)
          })
          
          // Member should not be able to manage invitations
          cy.request({
            method: 'POST',
            url: `/api/teams/${team.slug}/invitations`,
            body: { email: 'test@example.com', role: 'MEMBER' },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.eq(403)
          })
        })
      })
    })

    it('prevents unauthorized team access', () => {
      setupTeamScenario('Unauthorized Access Team').then(({ team }) => {
        // Create different user not in team
        cy.clearCookies()
        cy.request('POST', '/api/auth/sign-up/email', {
          email: `outsider-${Date.now()}@test.com`,
          password: 'password123',
          name: 'Outsider User'
        }).then(() => {
          
          // Outsider should not access team workspace
          cy.visit(`/teams/${team.slug}/dashboard`, { failOnStatusCode: false })
          
          cy.url().should('match', /(access-denied|unauthorized|login)/)
          cy.contains('Access denied').should('be.visible')
        })
      })
    })

    it('handles permission changes correctly', () => {
      setupTeamScenario('Permission Change Team').then(({ owner, member, team }) => {
        // Member initially has member permissions
        cy.clearCookies()
        signInTestUser(member).then(() => {
          cy.visit(`/teams/${team.slug}/dashboard`)
          cy.get('[data-cy=team-settings-link]').should('not.exist')
        })
        
        // Owner promotes member to admin
        cy.clearCookies()
        signInTestUser(owner).then(() => {
          cy.visit(`/teams/${team.slug}/settings/members`)
          cy.get(`[data-cy=member-role-${member.email.replace('@', '-').replace('.', '-')}]`).select('ADMIN')
          cy.get('[data-cy=update-member-role]').click()
          
          // Member should now have admin permissions
          cy.clearCookies()
          signInTestUser(member).then(() => {
            cy.visit(`/teams/${team.slug}/dashboard`)
            cy.get('[data-cy=team-settings-link]').should('be.visible')
          })
        })
      })
    })
  })

  describe('Team Billing Permissions', () => {
    it('restricts billing access to admins only', () => {
      setupTeamScenario('Billing Permission Team').then(({ owner, member, team }) => {
        // Admin can access billing
        signInTestUser(owner).then(() => {
          cy.visit(`/teams/${team.slug}/billing`)
          cy.get('[data-cy=billing-info]').should('be.visible')
          cy.get('[data-cy=upgrade-team-btn]').should('be.visible')
        })
        
        // Member cannot access billing
        cy.clearCookies()
        signInTestUser(member).then(() => {
          cy.visit(`/teams/${team.slug}/billing`, { failOnStatusCode: false })
          cy.url().should('match', /(access-denied|unauthorized)/)
        })
      })
    })
  })
})