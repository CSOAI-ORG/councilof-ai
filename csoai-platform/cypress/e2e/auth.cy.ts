describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display login page', () => {
    cy.visit('/login');
    cy.contains('Sign In to CSOAI').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('should display signup page', () => {
    cy.visit('/signup');
    cy.contains('Create Your Free Account').should('be.visible');
    cy.get('input#name').should('be.visible');
    cy.get('input#email').should('be.visible');
    cy.get('input#password').should('be.visible');
    cy.get('input#confirmPassword').should('be.visible');
  });

  it('should login with demo credentials', () => {
    cy.visit('/login');
    cy.contains('Demo Login').click();
    cy.url().should('include', '/dashboard');
  });

  it('should show error for empty login fields', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    cy.contains('Please enter email and password').should('be.visible');
  });

  it('should navigate between login and signup', () => {
    cy.visit('/login');
    cy.contains('Create Free Account').click();
    cy.url().should('include', '/signup');

    cy.contains('Sign In Instead').click();
    cy.url().should('include', '/login');
  });
});
