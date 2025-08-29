import { 
  createProUserWithSubscription,
  createAndSignInUser, 
  createTestTeam,
  inviteUserToTeam,
  signInTestUser,
  setupTeamScenario
} from '../support/test-helpers'

describe('13. Team Invitation Management', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Sending Invitations', () => {
    it('allows team admin to send member invitation', () => {
      createProUserWithSubscription('team-inviter').then((owner) => {
        createTestTeam({ name: 'Invitation Test Team' }).then((team) => {
          cy.visit(`/teams/${team.slug}/settings/members`)
          
          const inviteEmail = `member-${Date.now()}@test.com`
          
          cy.get('[data-cy=invite-member-btn]').click()
          cy.get('[data-cy=invite-email]').type(inviteEmail)
          cy.get('[data-cy=invite-role]').select('MEMBER')
          cy.get('[data-cy=send-invitation]').click()
          
          // Should show success message
          cy.contains('Invitation sent').should('be.visible')
          
          // Should show pending invitation in list
          cy.get('[data-cy=pending-invitations]').should('contain', inviteEmail)
          cy.get('[data-cy=pending-invitations]').should('contain', 'MEMBER')
        })
      })
    })

    it('allows team admin to send admin invitation', () => {
      createProUserWithSubscription('admin-inviter').then(() => {
        createTestTeam({ name: 'Admin Invitation Team' }).then((team) => {
          cy.visit(`/teams/${team.slug}/settings/members`)
          
          const inviteEmail = `admin-${Date.now()}@test.com`
          
          cy.get('[data-cy=invite-member-btn]').click()
          cy.get('[data-cy=invite-email]').type(inviteEmail)
          cy.get('[data-cy=invite-role]').select('ADMIN')
          cy.get('[data-cy=send-invitation]').click()
          
          cy.contains('Invitation sent').should('be.visible')
          cy.get('[data-cy=pending-invitations]').should('contain', 'ADMIN')
        })
      })
    })

    it('prevents duplicate invitations to same email', () => {
      createProUserWithSubscription('duplicate-inviter').then(() => {
        createTestTeam({ name: 'Duplicate Invitation Team' }).then((team) => {
          const inviteEmail = `duplicate-${Date.now()}@test.com`
          
          // Send first invitation
          inviteUserToTeam(team.slug, inviteEmail).then(() => {
            // Try to send second invitation to same email
            cy.visit(`/teams/${team.slug}/settings/members`)
            
            cy.get('[data-cy=invite-member-btn]').click()
            cy.get('[data-cy=invite-email]').type(inviteEmail)
            cy.get('[data-cy=send-invitation]').click()
            
            cy.contains('User already invited').should('be.visible')
          })
        })
      })
    })

    it('validates email format in invitation form', () => {
      createProUserWithSubscription('email-validator').then(() => {
        createTestTeam({ name: 'Email Validation Team' }).then((team) => {
          cy.visit(`/teams/${team.slug}/settings/members`)
          
          cy.get('[data-cy=invite-member-btn]').click()
          
          // Try invalid email
          cy.get('[data-cy=invite-email]').type('invalid-email')
          cy.get('[data-cy=send-invitation]').click()
          cy.contains('Please enter a valid email address').should('be.visible')
          
          // Try empty email
          cy.get('[data-cy=invite-email]').clear()
          cy.get('[data-cy=send-invitation]').click()
          cy.contains('Email is required').should('be.visible')
        })
      })
    })
  })

  describe('Managing Invitations', () => {
    it('allows canceling pending invitations', () => {
      setupTeamScenario('Cancellation Test Team').then(({ team }) => {
        const inviteEmail = `cancel-${Date.now()}@test.com`
        
        inviteUserToTeam(team.slug, inviteEmail).then(() => {
          cy.visit(`/teams/${team.slug}/settings/members`)
          
          // Should show cancel button for pending invitation
          cy.get('[data-cy=pending-invitations]').should('contain', inviteEmail)
          cy.get(`[data-cy=cancel-invitation-${inviteEmail.replace('@', '-').replace('.', '-')}]`).click()
          
          // Confirm cancellation
          cy.get('[data-cy=confirm-cancel]').click()
          
          // Should no longer show invitation
          cy.get('[data-cy=pending-invitations]').should('not.contain', inviteEmail)
          cy.contains('Invitation cancelled').should('be.visible')
        })
      })
    })

    it('allows resending pending invitations', () => {
      setupTeamScenario('Resend Test Team').then(({ team }) => {
        const inviteEmail = `resend-${Date.now()}@test.com`
        
        inviteUserToTeam(team.slug, inviteEmail).then(() => {
          cy.visit(`/teams/${team.slug}/settings/members`)
          
          cy.get(`[data-cy=resend-invitation-${inviteEmail.replace('@', '-').replace('.', '-')}]`).click()
          
          cy.contains('Invitation resent').should('be.visible')
        })
      })
    })

    it('shows invitation expiry status', () => {
      // This would require backend modification to create expired invitations
      // For now, test that expiry time is displayed
      setupTeamScenario('Expiry Test Team').then(({ team }) => {
        const inviteEmail = `expiry-${Date.now()}@test.com`
        
        inviteUserToTeam(team.slug, inviteEmail).then(() => {
          cy.visit(`/teams/${team.slug}/settings/members`)
          
          cy.get('[data-cy=pending-invitations]').should('contain', 'Expires in')
        })
      })
    })
  })

  describe('Accepting Invitations', () => {
    it('allows invited user to accept invitation', () => {
      setupTeamScenario('Acceptance Test Team').then(({ owner, member, team }) => {
        // Create invitation token (this would normally come from email)
        const invitationToken = `test-invite-${Date.now()}`
        
        // Sign out as owner and sign in as member
        cy.clearCookies()
        signInTestUser(member).then(() => {
          // Visit invitation acceptance page
          cy.visit(`/invitations/${invitationToken}/accept`)
          
          cy.get('[data-cy=accept-invitation-btn]').click()
          
          // Should redirect to team dashboard
          cy.url().should('include', `/teams/${team.slug}/dashboard`)
          cy.contains(`Welcome to ${team.name}`).should('be.visible')
        })
      })
    })

    it('allows invited user to decline invitation', () => {
      setupTeamScenario('Decline Test Team').then(({ member }) => {
        const invitationToken = `decline-invite-${Date.now()}`
        
        cy.clearCookies()
        signInTestUser(member).then(() => {
          cy.visit(`/invitations/${invitationToken}/accept`)
          
          cy.get('[data-cy=decline-invitation-btn]').click()
          
          // Should redirect to personal dashboard with message
          cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard`)
          cy.contains('Invitation declined').should('be.visible')
        })
      })
    })

    it('handles expired invitation links', () => {
      createAndSignInUser('free', 'expired-invite-user').then(() => {
        const expiredToken = 'expired-invitation-token'
        
        cy.visit(`/invitations/${expiredToken}/accept`)
        
        cy.contains('Invitation expired').should('be.visible')
        cy.contains('Please request a new invitation').should('be.visible')
      })
    })

    it('handles invalid invitation tokens', () => {
      createAndSignInUser('free', 'invalid-token-user').then(() => {
        cy.visit('/invitations/invalid-token/accept')
        
        cy.contains('Invalid invitation').should('be.visible')
      })
    })
  })

  describe('Team Member List', () => {
    it('shows current team members with roles', () => {
      setupTeamScenario('Member List Team').then(({ team }) => {
        cy.visit(`/teams/${team.slug}/settings/members`)
        
        // Should show team owner
        cy.get('[data-cy=team-members]').should('contain', 'ADMIN')
        cy.get('[data-cy=team-members]').should('contain', 'Owner')
        
        // Should show member count
        cy.get('[data-cy=member-count]').should('contain', '1 member')
      })
    })

    it('allows changing member roles', () => {
      setupTeamScenario('Role Change Team').then(({ owner, member, team }) => {
        // First, accept the invitation as member
        cy.clearCookies()
        signInTestUser(member).then(() => {
          // Accept invitation logic would go here
          
          // Switch back to owner to change role
          cy.clearCookies()
          signInTestUser(owner).then(() => {
            cy.visit(`/teams/${team.slug}/settings/members`)
            
            // Change member role to admin
            cy.get(`[data-cy=member-role-${member.email.replace('@', '-').replace('.', '-')}]`).select('ADMIN')
            cy.get('[data-cy=update-member-role]').click()
            
            cy.contains('Role updated').should('be.visible')
            cy.get('[data-cy=team-members]').should('contain', 'ADMIN')
          })
        })
      })
    })

    it('allows removing team members', () => {
      setupTeamScenario('Member Removal Team').then(({ owner, member, team }) => {
        // Simulate member acceptance and then removal
        signInTestUser(owner).then(() => {
          cy.visit(`/teams/${team.slug}/settings/members`)
          
          // Remove member
          cy.get(`[data-cy=remove-member-${member.email.replace('@', '-').replace('.', '-')}]`).click()
          cy.get('[data-cy=confirm-remove-member]').click()
          
          cy.contains('Member removed').should('be.visible')
          cy.get('[data-cy=team-members]').should('not.contain', member.email)
        })
      })
    })
  })

  describe('Permission Checks', () => {
    it('prevents regular members from managing invitations', () => {
      setupTeamScenario('Permission Test Team').then(({ member, team }) => {
        cy.clearCookies()
        signInTestUser(member).then(() => {
          cy.visit(`/teams/${team.slug}/settings/members`)
          
          // Member should see member list but not invitation controls
          cy.get('[data-cy=team-members]').should('be.visible')
          cy.get('[data-cy=invite-member-btn]').should('not.exist')
          cy.get('[data-cy=remove-member]').should('not.exist')
        })
      })
    })
  })
})