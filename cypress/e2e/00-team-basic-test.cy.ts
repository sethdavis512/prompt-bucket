import { createProUserWithSubscription } from '../support/test-helpers'

describe('00. Basic Team Test', () => {
  it('should be able to create a Pro user and navigate to teams page', () => {
    createProUserWithSubscription('basic-test-user').then((user) => {
      cy.visit('/teams')
      
      // Should see teams page
      cy.contains('Teams').should('be.visible')
      cy.contains('Collaborate with your team members').should('be.visible')
      
      // Should show create team button for Pro user
      cy.get('[data-cy="create-team-btn"]').should('be.visible')
    })
  })
})