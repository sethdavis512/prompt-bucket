describe('Dashboard', () => {
    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
    });

    it('should redirect to signin when not authenticated', () => {
        cy.visit('/dashboard');
        cy.url().should('include', '/auth/sign-in');
        cy.contains('Sign in to your account').should('be.visible');
    });
});

// TODO: Add authenticated dashboard tests
// These would include:
// - Displaying user prompts
// - Search functionality
// - Navigation to edit mode
// - Pro vs Free user features
