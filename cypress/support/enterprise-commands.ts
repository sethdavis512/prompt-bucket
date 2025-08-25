/**
 * Enterprise-Level Custom Commands
 * Following Cypress best practices for scalable, maintainable test automation
 */

declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication Commands
      loginViaApi(userType: 'free' | 'pro' | 'admin', userPrefix?: string): Chainable<TestUser>
      logoutViaApi(): Chainable<null>
      
      // Data Management Commands
      seedTestData(dataType: 'prompts' | 'categories' | 'users', options?: any): Chainable<any>
      cleanupTestData(userEmail: string): Chainable<null>
      
      // UI Interaction Commands
      getBySel(selector: string, options?: any): Chainable<JQuery<HTMLElement>>
      getBySelLike(selector: string, options?: any): Chainable<JQuery<HTMLElement>>
      typeWithDelay(text: string, delay?: number): Chainable<JQuery<HTMLElement>>
      clickAndWait(waitForSelector?: string, timeout?: number): Chainable<JQuery<HTMLElement>>
      
      // Form Handling Commands
      fillForm(formData: Record<string, any>, formSelector?: string): Chainable<JQuery<HTMLElement>>
      submitFormAndVerify(expectedUrl: string | RegExp, timeout?: number): Chainable<null>
      
      // Navigation Commands
      navigateToSection(section: string): Chainable<null>
      waitForPageReady(expectedElement: string, timeout?: number): Chainable<null>
      
      // Assertion Commands  
      verifyUrl(pattern: string | RegExp): Chainable<null>
      verifyElementState(selector: string, state: 'visible' | 'hidden' | 'enabled' | 'disabled'): Chainable<null>
      verifyPromptExists(title: string): Chainable<null>
      
      // Business Logic Commands
      createPromptViaUI(promptData: PromptData, verifyCreation?: boolean): Chainable<PromptData>
      createPromptViaApi(promptData: PromptData): Chainable<PromptData>
      searchPrompts(query: string, expectedCount?: number): Chainable<null>
      
      // Debug Commands
      logState(message?: string): Chainable<null>
      captureTestEvidence(testName: string, step: string): Chainable<null>
    }
  }
}

// Types
interface TestUser {
  email: string
  password: string
  name: string
  id?: string
}

interface PromptData {
  title: string
  description: string
  taskContext?: string
  toneContext?: string
  detailedTaskDescription?: string
  examples?: string
  immediateTask?: string
  outputFormatting?: string
}

// Authentication Commands
Cypress.Commands.add('loginViaApi', (userType: 'free' | 'pro' | 'admin', userPrefix = '') => {
  const timestamp = Date.now()
  const user: TestUser = {
    email: `${userPrefix}${userType}-${timestamp}@test.example.com`,
    password: 'TestPassword123!',
    name: `Test ${userType} User`
  }

  return cy.session(
    `${userType}-${userPrefix}-${timestamp}`,
    () => {
      cy.log(`🔐 Logging in ${userType} user: ${user.email}`)
      
      // Create user first
      cy.request({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        body: user,
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 409) {
          cy.log('User already exists, proceeding to sign in')
        }
      })

      // Sign in user
      cy.request({
        method: 'POST', 
        url: '/api/auth/sign-in/email',
        body: {
          email: user.email,
          password: user.password
        }
      }).then((response) => {
        expect(response.status).to.eq(200)
      })

      // Upgrade to Pro if needed
      if (userType === 'pro') {
        cy.request({
          method: 'POST',
          url: '/api/admin/user-settings',
          form: true,
          body: {
            intent: 'toggle_subscription',
            email: user.email
          },
          failOnStatusCode: false
        })
      }
    },
    {
      validate: () => {
        cy.visit('/dashboard')
        cy.get('[data-testid="user-dropdown"]', { timeout: 10000 }).should('exist')
      }
    }
  ).then(() => user)
})

Cypress.Commands.add('logoutViaApi', () => {
  cy.request({
    method: 'POST',
    url: '/api/auth/sign-out',
    failOnStatusCode: false
  })
  cy.clearCookies()
  cy.clearLocalStorage()
  return cy.wrap(null)
})

// Element Selection Commands
Cypress.Commands.add('getBySel', (selector: string, ...args) => {
  return cy.get(`[data-cy=${selector}]`, ...args)
})

Cypress.Commands.add('getBySelLike', (selector: string, ...args) => {
  return cy.get(`[data-cy*=${selector}]`, ...args)
})

// Enhanced Interaction Commands
Cypress.Commands.add('typeWithDelay', { prevSubject: 'element' }, (subject, text: string, delay = 50) => {
  return cy.wrap(subject).type(text, { delay, force: true })
})

Cypress.Commands.add('clickAndWait', { prevSubject: 'element' }, (subject, waitForSelector?: string, timeout = 5000) => {
  cy.wrap(subject).click({ force: true })
  if (waitForSelector) {
    cy.get(waitForSelector, { timeout }).should('be.visible')
  }
  return cy.wrap(subject)
})

// Form Handling Commands
Cypress.Commands.add('fillForm', (formData: Record<string, any>, formSelector = 'form') => {
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      cy.getBySel(key).clear({ force: true }).typeWithDelay(String(value))
    }
  })
  return cy.get(formSelector)
})

Cypress.Commands.add('submitFormAndVerify', (expectedUrl: string | RegExp, timeout = 15000) => {
  cy.getBySel('save-prompt').click({ force: true })
  cy.url({ timeout }).should('match', typeof expectedUrl === 'string' ? new RegExp(expectedUrl) : expectedUrl)
  return cy.wrap(null)
})

// Navigation Commands
Cypress.Commands.add('navigateToSection', (section: string) => {
  cy.get(`[data-testid="nav-${section.toLowerCase()}"]`).click()
  cy.url().should('include', `/${section.toLowerCase()}`)
  return cy.wrap(null)
})

Cypress.Commands.add('waitForPageReady', (expectedElement: string, timeout = 10000) => {
  cy.contains(expectedElement, { timeout }).should('be.visible')
  // Wait for any loading states to complete
  cy.get('[data-testid="loading"]', { timeout: 2000 }).should('not.exist')
  cy.get('.animate-pulse', { timeout: 2000 }).should('not.exist')
  return cy.wrap(null)
})

// Verification Commands
Cypress.Commands.add('verifyUrl', (pattern: string | RegExp) => {
  cy.url().should('match', typeof pattern === 'string' ? new RegExp(pattern) : pattern)
  return cy.wrap(null)
})

Cypress.Commands.add('verifyElementState', (selector: string, state: 'visible' | 'hidden' | 'enabled' | 'disabled') => {
  const element = cy.getBySel(selector)
  switch (state) {
    case 'visible':
      element.should('be.visible')
      break
    case 'hidden':
      element.should('not.be.visible')
      break
    case 'enabled':
      element.should('not.be.disabled')
      break
    case 'disabled':
      element.should('be.disabled')
      break
  }
  return cy.wrap(null)
})

Cypress.Commands.add('verifyPromptExists', (title: string) => {
  cy.get('[data-cy="prompt-card"]').contains(title).should('be.visible')
  return cy.wrap(null)
})

// Business Logic Commands
Cypress.Commands.add('createPromptViaUI', (promptData: PromptData, verifyCreation = true) => {
  cy.visit('/prompts/new')
  cy.waitForPageReady('Create New Prompt')
  
  const formData = {
    'prompt-title': promptData.title,
    'prompt-description': promptData.description,
    'taskContext': promptData.taskContext,
    'toneContext': promptData.toneContext,
    'detailedTaskDescription': promptData.detailedTaskDescription,
    'examples': promptData.examples,
    'immediateTask': promptData.immediateTask,
    'outputFormatting': promptData.outputFormatting
  }
  
  cy.fillForm(formData)
  cy.submitFormAndVerify(/\/prompts\/|\/dashboard/)
  
  if (verifyCreation) {
    cy.get('body').should('contain', promptData.title)
  }
  
  return cy.wrap(promptData)
})

Cypress.Commands.add('createPromptViaApi', (promptData: PromptData) => {
  return cy.request({
    method: 'POST',
    url: '/api/prompts',
    body: promptData,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    return cy.wrap({ ...promptData, id: response.body.id })
  })
})

Cypress.Commands.add('searchPrompts', (query: string, expectedCount?: number) => {
  cy.getBySel('search-prompts').clear().typeWithDelay(query).type('{enter}')
  cy.verifyUrl(`search=${encodeURIComponent(query)}`)
  
  if (expectedCount !== undefined) {
    cy.get('[data-cy="prompt-card"]').should('have.length', expectedCount)
  }
  
  return cy.wrap(null)
})

// Debug Commands
Cypress.Commands.add('logState', (message = '') => {
  cy.url().then((url) => {
    cy.log(`🔍 ${message} | URL: ${url}`)
  })
  return cy.wrap(null)
})

Cypress.Commands.add('captureTestEvidence', (testName: string, step: string) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  cy.screenshot(`${testName}--${step}--${timestamp}`, { capture: 'viewport' })
  return cy.wrap(null)
})

// Data Management Commands
Cypress.Commands.add('seedTestData', (dataType: 'prompts' | 'categories' | 'users', options = {}) => {
  return cy.task('db:seed', { type: dataType, options })
})

Cypress.Commands.add('cleanupTestData', (userEmail: string) => {
  return cy.task('db:cleanup', { userEmail })
})