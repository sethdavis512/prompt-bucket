/**
 * Enterprise Test Utilities
 * Common utility functions for robust test automation
 */

export class TestUtilities {
  /**
   * Generates unique identifiers for test isolation
   */
  static generateUniqueId(prefix = ''): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}${timestamp}_${random}`
  }

  /**
   * Creates consistent test timestamps for reproducible tests
   */
  static getTestTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-')
  }

  /**
   * Validates email format for user testing
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Waits for network idle state to ensure page is fully loaded
   */
  static waitForNetworkIdle(timeout = 5000): void {
    cy.window().then((win) => {
      let requestCount = 0
      
      // Intercept all requests
      cy.intercept('**', (req) => {
        requestCount++
        req.continue((res) => {
          requestCount--
        })
      })
      
      // Wait for all requests to complete
      cy.wrap(null).should(() => {
        expect(requestCount).to.equal(0)
      })
    })
  }

  /**
   * Retry mechanism for flaky operations
   */
  static retryOperation(
    operation: () => void,
    maxAttempts = 3,
    delay = 1000
  ): void {
    let attempts = 0
    
    const tryOperation = () => {
      attempts++
      try {
        operation()
      } catch (error) {
        if (attempts < maxAttempts) {
          cy.wait(delay)
          tryOperation()
        } else {
          throw error
        }
      }
    }
    
    tryOperation()
  }

  /**
   * Cleans up test data to prevent test pollution
   */
  static cleanupTestEnvironment(): void {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
  }

  /**
   * Sets up consistent viewport for responsive testing
   */
  static setViewport(device: 'mobile' | 'tablet' | 'desktop'): void {
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 720 }
    }
    
    const viewport = viewports[device]
    cy.viewport(viewport.width, viewport.height)
  }

  /**
   * Manages test evidence collection
   */
  static captureEvidence(testName: string, step: string, includeFullPage = false): void {
    const timestamp = TestUtilities.getTestTimestamp()
    const screenshotName = `${testName}__${step}__${timestamp}`
    
    if (includeFullPage) {
      cy.screenshot(screenshotName, { capture: 'fullPage' })
    } else {
      cy.screenshot(screenshotName, { capture: 'viewport' })
    }
    
    // Optional: Log current URL and viewport for debugging
    cy.url().then((url) => {
      cy.log(`📸 Evidence captured: ${screenshotName} at ${url}`)
    })
  }

  /**
   * Handles file upload testing
   */
  static uploadFile(selector: string, fileName: string, fileType = 'application/json'): void {
    cy.get(selector).selectFile({
      contents: Cypress.Buffer.from('Test file content'),
      fileName: fileName,
      mimeType: fileType
    })
  }

  /**
   * Validates form submission with error handling
   */
  static submitFormWithValidation(
    formSelector: string,
    expectedSuccessUrl?: string,
    expectedErrorMessage?: string
  ): void {
    cy.get(formSelector).submit()
    
    if (expectedSuccessUrl) {
      cy.url().should('include', expectedSuccessUrl)
    }
    
    if (expectedErrorMessage) {
      cy.contains(expectedErrorMessage).should('be.visible')
    }
  }

  /**
   * Handles accessibility testing integration
   */
  static checkAccessibility(context?: string): void {
    // Integration point for cypress-axe or similar a11y testing
    cy.log(`♿ Accessibility check${context ? ` for ${context}` : ''}`)
    // cy.checkA11y() // Uncomment when cypress-axe is installed
  }

  /**
   * Manages API response mocking for consistent testing
   */
  static mockApiResponse(endpoint: string, response: any, statusCode = 200): void {
    cy.intercept('GET', endpoint, {
      statusCode,
      body: response
    }).as(`api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`)
  }

  /**
   * Validates API responses in tests
   */
  static validateApiResponse(alias: string, expectedStatus = 200): void {
    cy.wait(`@${alias}`).then((interception) => {
      expect(interception.response?.statusCode).to.equal(expectedStatus)
    })
  }

  /**
   * Handles performance timing assertions
   */
  static measurePageLoadTime(maxLoadTime = 3000): void {
    cy.window().then((win) => {
      cy.wrap(win.performance.timing.loadEventEnd - win.performance.timing.navigationStart)
        .should('be.lessThan', maxLoadTime)
    })
  }

  /**
   * Validates console errors during test execution
   */
  static checkConsoleErrors(): void {
    cy.window().then((win) => {
      const consoleSpy = cy.spy(win.console, 'error')
      cy.wrap(consoleSpy).should('not.have.been.called')
    })
  }

  /**
   * Handles test data seeding consistently
   */
  static seedDatabase(seedType: 'minimal' | 'full' | 'custom', options = {}): void {
    cy.task('db:seed', { type: seedType, options })
  }

  /**
   * Validates responsive behavior across viewports
   */
  static testResponsiveLayout(testFn: () => void): void {
    const devices = ['mobile', 'tablet', 'desktop'] as const
    
    devices.forEach((device) => {
      TestUtilities.setViewport(device)
      TestUtilities.captureEvidence('responsive', device)
      testFn()
    })
  }

  /**
   * Handles authentication state management
   */
  static preserveAuthenticationState(): void {
    cy.window().then((win) => {
      const authToken = win.localStorage.getItem('authToken')
      if (authToken) {
        cy.setLocalStorage('authToken', authToken)
      }
    })
  }

  /**
   * Validates form field states and interactions
   */
  static validateFormField(
    fieldSelector: string,
    expectedState: 'enabled' | 'disabled' | 'required' | 'optional'
  ): void {
    const field = cy.get(fieldSelector)
    
    switch (expectedState) {
      case 'enabled':
        field.should('not.be.disabled')
        break
      case 'disabled':
        field.should('be.disabled')
        break
      case 'required':
        field.should('have.attr', 'required')
        break
      case 'optional':
        field.should('not.have.attr', 'required')
        break
    }
  }

  /**
   * Handles search functionality testing
   */
  static performSearch(
    searchSelector: string,
    query: string,
    expectedResultCount?: number
  ): void {
    cy.get(searchSelector).clear().type(query).type('{enter}')
    
    if (expectedResultCount !== undefined) {
      cy.get('[data-cy="search-result"]').should('have.length', expectedResultCount)
    }
  }

  /**
   * Validates pagination functionality
   */
  static testPagination(
    itemsPerPage: number,
    totalItems: number,
    containerSelector = '[data-cy="paginated-content"]'
  ): void {
    const expectedPages = Math.ceil(totalItems / itemsPerPage)
    
    // Verify items on first page
    cy.get(`${containerSelector} [data-cy="list-item"]`).should('have.length', itemsPerPage)
    
    // Test navigation to last page
    if (expectedPages > 1) {
      cy.get('[data-cy="pagination-next"]').click()
      cy.url().should('include', 'page=2')
    }
  }
}

// Export utility functions for direct use
export const {
  generateUniqueId,
  getTestTimestamp,
  isValidEmail,
  waitForNetworkIdle,
  cleanupTestEnvironment,
  setViewport,
  captureEvidence,
  checkAccessibility,
  measurePageLoadTime,
  testResponsiveLayout
} = TestUtilities