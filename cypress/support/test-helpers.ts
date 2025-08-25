// Test helper functions for setting up test data

export const TEST_USERS = {
  free: {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User'
  },
  pro: {
    email: 'pro@example.com', 
    password: 'testpassword123',
    name: 'Pro Test User'
  },
  admin: {
    email: 'admin@example.com',
    password: 'testpassword123', 
    name: 'Admin User'
  }
} as const

export type UserType = keyof typeof TEST_USERS

export interface TestUserOptions {
  subscriptionStatus?: string
  promptCount?: number
}

export interface TestUser {
  email: string
  password: string
  name: string
}

/**
 * Creates a test user account via the signup API
 * This properly creates the user with Better Auth
 */
export function createTestUser(userData: TestUser) {
  return cy.request({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    body: {
      email: userData.email,
      password: userData.password,
      name: userData.name
    },
    failOnStatusCode: false // Don't fail if user already exists
  }).then((response) => {
    // Wait a bit to ensure user creation is complete
    return cy.wait(500).then(() => response)
  })
}

/**
 * Signs in a user via the API and sets cookies
 */
export function signInTestUser(userData: TestUser) {
  return cy.request({
    method: 'POST',
    url: '/api/auth/sign-in/email',
    body: {
      email: userData.email,
      password: userData.password
    },
    failOnStatusCode: false // Don't fail if signin fails initially
  }).then((response) => {
    if (response.status === 401) {
      // If user doesn't exist, create them first
      return createTestUser(userData).then(() => {
        return cy.request({
          method: 'POST',
          url: '/api/auth/sign-in/email',
          body: {
            email: userData.email,
            password: userData.password
          }
        })
      })
    }
    return response
  }).then((response: any) => {
    // Extract cookies from response and set them
    if (response.headers && response.headers['set-cookie']) {
      const cookies = Array.isArray(response.headers['set-cookie']) 
        ? response.headers['set-cookie'] 
        : [response.headers['set-cookie']]
      
      cookies.forEach((cookie: string) => {
        const [nameValue] = cookie.split(';')
        const [name, value] = nameValue.split('=')
        cy.setCookie(name.trim(), value.trim())
      })
    }
  })
}

/**
 * Creates a Pro user with active subscription
 */
export function createProTestUser(userData: TestUser) {
  return createTestUser(userData).then(() => {
    // Upgrade user to Pro via API call
    return cy.request({
      method: 'POST',
      url: '/api/admin/user-settings',
      form: true,
      body: {
        intent: 'toggle_subscription',
        email: userData.email // Use email instead of userId
      },
      failOnStatusCode: false
    })
  })
}

/**
 * Takes a screenshot with a descriptive name including timestamp
 */
export function takeTimestampedScreenshot(name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  cy.screenshot(`${name}-${timestamp}`)
}

// =================== ENHANCED HELPERS ===================

/**
 * Creates a user with a unique email to avoid conflicts
 */
export function createUniqueUser(userType: UserType, prefix: string) {
  const baseUser = TEST_USERS[userType]
  const uniqueUser: TestUser = {
    email: `${prefix}-${Date.now()}@example.com`,
    password: baseUser.password,
    name: baseUser.name
  }
  
  return createTestUser(uniqueUser).then(() => uniqueUser)
}

/**
 * Creates a user and signs them in - one-stop user setup
 */
export function createAndSignInUser(userType: UserType, prefix: string) {
  return createUniqueUser(userType, prefix).then((user) => {
    return signInTestUser(user).then(() => user)
  })
}

/**
 * Creates a Pro user with active subscription
 */
export function createProUserWithSubscription(prefix: string) {
  return createUniqueUser('pro', prefix).then((user: TestUser) => {
    // Upgrade user to Pro via API call
    return cy.request({
      method: 'POST',
      url: '/api/admin/user-settings',
      form: true,
      body: {
        intent: 'toggle_subscription',
        email: user.email
      },
      failOnStatusCode: false
    }).then(() => {
      return signInTestUser(user).then(() => user)
    })
  })
}

/**
 * Setup test user with various options
 */
export function setupTestUser(userType: UserType, options: TestUserOptions = {}) {
  const prefix = `setup-${Date.now()}`
  
  if (options.subscriptionStatus === 'active') {
    return createProUserWithSubscription(prefix)
  } else {
    return createAndSignInUser(userType, prefix)
  }
}

// =================== PROMPT HELPERS ===================

export interface PromptData {
  title: string
  description: string
  taskContext?: string
  toneContext?: string
  detailedTaskDescription?: string
  examples?: string
  immediateTask?: string
  outputFormatting?: string
}

/**
 * Creates a test prompt with default data and customization
 */
export function createTestPrompt(promptData: Partial<PromptData> = {}, skipNavigation: boolean = false) {
  const defaultData: PromptData = {
    title: `Test Prompt ${Date.now()}`,
    description: 'A test prompt created by Cypress',
    taskContext: 'Act as a professional assistant with expertise in the given domain.',
    detailedTaskDescription: 'Complete the requested task with high quality and attention to detail.',
    ...promptData
  }

  if (!skipNavigation) {
    cy.visit('/prompts/new')
  }
  
  // Wait for the form to be visible and stable
  cy.get('[data-cy=prompt-title]').should('be.visible')
  cy.wait(1000) // Longer wait for React to fully stabilize
  
  // Fill in the form using a more robust approach that handles DOM re-renders
  // Use force: true and separate each field interaction
  
  cy.get('[data-cy=prompt-title]').should('be.visible').then(($el) => {
    cy.wrap($el).clear({ force: true }).type(defaultData.title, { force: true })
  })
  
  cy.wait(200) // Small wait between fields
  
  cy.get('[data-cy=prompt-description]').should('be.visible').then(($el) => {
    cy.wrap($el).clear({ force: true }).type(defaultData.description, { force: true })
  })
  
  if (defaultData.taskContext) {
    cy.wait(200)
    cy.get('[data-cy=taskContext]').should('be.visible').then(($el) => {
      cy.wrap($el).clear({ force: true }).type(defaultData.taskContext!, { force: true, delay: 30 })
    })
  }
  
  if (defaultData.toneContext) {
    cy.wait(200)
    cy.get('[data-cy=toneContext]').should('be.visible').then(($el) => {
      cy.wrap($el).clear({ force: true }).type(defaultData.toneContext!, { force: true, delay: 30 })
    })
  }
  
  if (defaultData.detailedTaskDescription) {
    cy.wait(200)
    cy.get('[data-cy=detailedTaskDescription]').should('be.visible').then(($el) => {
      cy.wrap($el).clear({ force: true }).type(defaultData.detailedTaskDescription!, { force: true, delay: 30 })
    })
  }
  
  if (defaultData.examples) {
    cy.wait(200)
    cy.get('[data-cy=examples]').should('be.visible').then(($el) => {
      cy.wrap($el).clear({ force: true }).type(defaultData.examples!, { force: true, delay: 30 })
    })
  }
  
  if (defaultData.immediateTask) {
    cy.wait(200)
    cy.get('[data-cy=immediateTask]').should('be.visible').then(($el) => {
      cy.wrap($el).clear({ force: true }).type(defaultData.immediateTask!, { force: true, delay: 30 })
    })
  }
  
  if (defaultData.outputFormatting) {
    cy.wait(200)
    cy.get('[data-cy=outputFormatting]').should('be.visible').then(($el) => {
      cy.wrap($el).clear({ force: true }).type(defaultData.outputFormatting!, { force: true, delay: 30 })
    })
  }
  
  // Wait for all form interactions to complete before saving
  cy.wait(1000)
  cy.get('[data-cy=save-prompt]').should('be.visible').click({ force: true })
  
  // Return the prompt data for verification
  return cy.wrap(defaultData)
}

/**
 * Creates multiple test prompts for list/pagination testing
 */
export function createMultipleTestPrompts(count: number) {
  const prompts: PromptData[] = []
  
  for (let i = 0; i < count; i++) {
    const promptData: Partial<PromptData> = {
      title: `Test Prompt ${i + 1} - ${Date.now()}`,
      description: `Test prompt number ${i + 1} for testing lists and pagination`,
      taskContext: `Act as a professional in scenario ${i + 1}.`,
    }
    
    createTestPrompt(promptData).then((data) => {
      prompts.push(data as PromptData)
    })
    
    // Navigate back to new prompt page for next iteration
    if (i < count - 1) {
      cy.visit('/prompts/new')
    }
  }
  
  return cy.wrap(prompts)
}

/**
 * Creates a user with exactly 5 prompts (at the free limit)
 */
export function createUserAtPromptLimit(prefix: string) {
  return createAndSignInUser('free', prefix).then((user) => {
    // Create exactly 5 prompts
    createMultipleTestPrompts(5).then(() => user)
  })
}

// =================== NAVIGATION HELPERS ===================

/**
 * Navigate via sidebar with error handling
 */
export function navigateViaSidebar(section: string) {
  cy.get('[data-testid=sidebar]').should('be.visible')
  cy.get(`[data-testid=nav-${section.toLowerCase()}]`).click()
  cy.url().should('include', `/${section.toLowerCase()}`)
}

/**
 * Wait for page load with expected content
 */
export function waitForPageLoad(expectedContent: string, timeout: number = 10000) {
  cy.contains(expectedContent, { timeout }).should('be.visible')
}

/**
 * Better screenshot naming with context
 */
export function takeContextualScreenshot(context: string, description: string) {
  const timestamp = Date.now()
  cy.screenshot(`${context}-${description}-${timestamp}`)
}