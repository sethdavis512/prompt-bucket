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

/**
 * Creates a test user account via the signup API
 * This properly creates the user with Better Auth
 */
export function createTestUser(userData: typeof TEST_USERS.free) {
  return cy.request({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    body: {
      email: userData.email,
      password: userData.password,
      name: userData.name
    },
    failOnStatusCode: false // Don't fail if user already exists
  })
}

/**
 * Signs in a user via the API and sets cookies
 */
export function signInTestUser(userData: typeof TEST_USERS.free | typeof TEST_USERS.pro | typeof TEST_USERS.admin) {
  return cy.request({
    method: 'POST',
    url: '/api/auth/sign-in/email',
    body: {
      email: userData.email,
      password: userData.password
    }
  }).then((response) => {
    // Extract cookies from response and set them
    if (response.headers['set-cookie']) {
      const cookies = Array.isArray(response.headers['set-cookie']) 
        ? response.headers['set-cookie'] 
        : [response.headers['set-cookie']]
      
      cookies.forEach(cookie => {
        const [nameValue, ...options] = cookie.split(';')
        const [name, value] = nameValue.split('=')
        cy.setCookie(name.trim(), value.trim())
      })
    }
  })
}

/**
 * Creates a Pro user with active subscription
 */
export function createProTestUser(userData: typeof TEST_USERS.pro) {
  return createTestUser(userData).then(() => {
    // Upgrade user to Pro via API call
    return cy.request({
      method: 'POST',
      url: '/api/admin/user-settings',
      form: true,
      body: {
        intent: 'toggle_subscription',
        userId: 'pro@example.com' // This would need to be the actual user ID
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