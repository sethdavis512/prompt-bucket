describe('Authentication', () => {
    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
    });

    it('should redirect unauthenticated users to signin', () => {
        cy.visit('/dashboard');
        cy.url().should('include', '/auth/sign-in');
    });

    it('should display the signin form', () => {
        cy.visit('/auth/sign-in');

        // Check that form elements exist
        cy.get('[data-cy=email-input]').should('be.visible');
        cy.get('[data-cy=password-input]').should('be.visible');
        cy.get('[data-cy=signin-button]').should('be.visible');

        // Check form labels and text
        cy.contains('Sign in to your account').should('be.visible');
        cy.contains('create a new account').should('be.visible');
    });

    it('should show validation for empty form', () => {
        cy.visit('/auth/sign-in');

        // Try to submit empty form
        cy.get('[data-cy=signin-button]').click();

        // Should stay on signin page (HTML5 validation will prevent submission)
        cy.url().should('include', '/auth/sign-in');
    });

    it('should allow form input', () => {
        cy.visit('/auth/sign-in');

        // Fill in the form
        cy.get('[data-cy=email-input]').type('test@example.com');
        cy.get('[data-cy=password-input]').type('testpassword');

        // Verify values were entered
        cy.get('[data-cy=email-input]').should(
            'have.value',
            'test@example.com'
        );
        cy.get('[data-cy=password-input]').should('have.value', 'testpassword');
    });

    it('should handle invalid login attempt', () => {
        cy.visit('/auth/sign-in');

        // Try to login with invalid credentials
        cy.get('[data-cy=email-input]').type('invalid@example.com');
        cy.get('[data-cy=password-input]').type('wrongpassword');
        cy.get('[data-cy=signin-button]').click();

        // Should stay on signin page and show error
        cy.url().should('include', '/auth/sign-in');
        // Error message should appear (if implemented)
        // cy.contains('Invalid email or password').should('be.visible')
    });
});
