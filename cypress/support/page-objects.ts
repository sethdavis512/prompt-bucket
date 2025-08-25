/**
 * Enterprise Page Object Model
 * Encapsulates page interactions following Cypress best practices
 * Uses method chaining and proper element selection patterns
 */

export class BasePage {
  protected url = ''

  visit(url?: string) {
    cy.visit(url || this.url)
    return this
  }

  verifyUrl(pattern?: string | RegExp) {
    const expectedPattern = pattern || this.url
    cy.url().should('match', typeof expectedPattern === 'string' ? new RegExp(expectedPattern) : expectedPattern)
    return this
  }

  waitForPageReady(timeout = 10000) {
    // Base implementation - override in specific pages
    cy.get('[data-testid="loading"]', { timeout: 2000 }).should('not.exist')
    return this
  }
}

export class DashboardPage extends BasePage {
  protected url = '/dashboard'

  waitForPageReady() {
    cy.contains('Dashboard').should('be.visible')
    cy.contains('Welcome back').should('be.visible')
    return this
  }

  verifyUserGreeting(name?: string) {
    if (name) {
      cy.contains(`Welcome back, ${name}`).should('be.visible')
    } else {
      cy.contains('Welcome back').should('be.visible')
    }
    return this
  }

  verifyStatisticsCards() {
    cy.contains('Total Prompts').should('be.visible')
    cy.contains('Account Status').should('be.visible')
    return this
  }

  verifyFreeUserLimits() {
    cy.contains(/\d+\/5 prompts used/).should('be.visible')
    return this
  }

  navigateToPrompts() {
    cy.get('[data-testid="nav-prompts"]').click()
    cy.url().should('include', '/prompts')
    return new PromptsPage()
  }

  openUserDropdown() {
    cy.get('[data-testid="user-dropdown"]').click()
    return this
  }

  clickNewPrompt() {
    cy.contains('New Prompt').click()
    return new PromptCreatePage()
  }

  verifyUpgradeBanner() {
    cy.contains('Upgrade to Pro').should('be.visible')
    return this
  }
}

export class PromptsPage extends BasePage {
  protected url = '/prompts'

  waitForPageReady() {
    cy.contains('My Prompts').should('be.visible')
    cy.contains('Manage and organize your prompt templates').should('be.visible')
    return this
  }

  verifySearchControls() {
    cy.get('[data-cy="search-prompts"]').should('be.visible')
    cy.get('[data-cy="category-filter"]').should('be.visible')
    return this
  }

  search(query: string) {
    cy.get('[data-cy="search-prompts"]').clear().type(query).type('{enter}')
    cy.url().should('include', `search=${encodeURIComponent(query)}`)
    return this
  }

  clearSearch() {
    cy.get('[data-cy="search-prompts"]').clear().type('{enter}')
    return this
  }

  verifyPromptExists(title: string) {
    cy.get('[data-cy="prompt-card"]').contains(title).should('be.visible')
    return this
  }

  verifyPromptCount(count: number) {
    cy.get('[data-cy="prompt-card"]').should('have.length', count)
    return this
  }

  verifyEmptyState() {
    cy.contains('No prompts yet').should('be.visible')
    cy.contains('Get started by creating your first prompt template').should('be.visible')
    cy.contains('Create Your First Prompt').should('be.visible')
    return this
  }

  clickCreateFirstPrompt() {
    cy.contains('Create Your First Prompt').click()
    return new PromptCreatePage()
  }

  clickNewPrompt() {
    cy.contains('New Prompt').click()
    return new PromptCreatePage()
  }

  viewPrompt(title: string) {
    cy.get('[data-cy="prompt-card"]').contains(title).parents('[data-cy="prompt-card"]').within(() => {
      cy.contains('View').click()
    })
    return new PromptDetailPage()
  }

  editPrompt(title: string) {
    cy.get('[data-cy="prompt-card"]').contains(title).parents('[data-cy="prompt-card"]').within(() => {
      cy.contains('Edit').click()
    })
    return new PromptEditPage()
  }

  verifyFreeUserLimits() {
    cy.contains(/\d+\/5 prompts used/).should('be.visible')
    return this
  }
}

export class PromptCreatePage extends BasePage {
  protected url = '/prompts/new'

  waitForPageReady() {
    cy.contains('Create New Prompt').should('be.visible')
    cy.contains('10-section methodology').should('be.visible')
    return this
  }

  fillBasicInfo(title: string, description: string) {
    cy.get('[data-cy="prompt-title"]').clear().type(title)
    cy.get('[data-cy="prompt-description"]').clear().type(description)
    return this
  }

  fillTaskContext(context: string) {
    cy.get('[data-cy="taskContext"]').clear().type(context)
    return this
  }

  fillToneContext(context: string) {
    cy.get('[data-cy="toneContext"]').clear().type(context)
    return this
  }

  fillDetailedTask(task: string) {
    cy.get('[data-cy="detailedTaskDescription"]').clear().type(task)
    return this
  }

  fillExamples(examples: string) {
    cy.get('[data-cy="examples"]').clear().type(examples)
    return this
  }

  fillImmediateTask(task: string) {
    cy.get('[data-cy="immediateTask"]').clear().type(task)
    return this
  }

  fillOutputFormatting(formatting: string) {
    cy.get('[data-cy="outputFormatting"]').clear().type(formatting)
    return this
  }

  fillCompleteForm(promptData: {
    title: string
    description: string
    taskContext?: string
    toneContext?: string
    detailedTaskDescription?: string
    examples?: string
    immediateTask?: string
    outputFormatting?: string
  }) {
    this.fillBasicInfo(promptData.title, promptData.description)
    
    if (promptData.taskContext) this.fillTaskContext(promptData.taskContext)
    if (promptData.toneContext) this.fillToneContext(promptData.toneContext)
    if (promptData.detailedTaskDescription) this.fillDetailedTask(promptData.detailedTaskDescription)
    if (promptData.examples) this.fillExamples(promptData.examples)
    if (promptData.immediateTask) this.fillImmediateTask(promptData.immediateTask)
    if (promptData.outputFormatting) this.fillOutputFormatting(promptData.outputFormatting)
    
    return this
  }

  savePrompt() {
    cy.get('[data-cy="save-prompt"]').click()
    // Will redirect to either prompt detail or dashboard
    return this
  }

  verifyValidationError() {
    // Stay on the same page if validation fails
    cy.url().should('include', '/prompts/new')
    cy.contains('Create New Prompt').should('be.visible')
    return this
  }

  submitAndVerifySuccess() {
    this.savePrompt()
    cy.url().should('satisfy', (url) => url.includes('/prompts/') || url.includes('/dashboard'))
    return new PromptDetailPage()
  }
}

export class PromptDetailPage extends BasePage {
  protected url = '/prompts/'

  waitForPageReady(title?: string) {
    if (title) {
      cy.contains(title).should('be.visible')
    }
    cy.contains('Task Context').should('be.visible')
    return this
  }

  verifyContent(promptData: {
    title: string
    description?: string
    taskContext?: string
    toneContext?: string
  }) {
    cy.contains(promptData.title).should('be.visible')
    if (promptData.description) {
      cy.contains(promptData.description).should('be.visible')
    }
    if (promptData.taskContext) {
      cy.get('body').should('contain', promptData.taskContext)
    }
    if (promptData.toneContext) {
      cy.get('body').should('contain', promptData.toneContext)
    }
    return this
  }

  clickEdit() {
    cy.contains('Edit').click()
    return new PromptEditPage()
  }

  verifyAllSections() {
    cy.contains('Task Context').should('be.visible')
    return this
  }

  copySection(sectionName: string) {
    cy.get(`[data-cy="copy-${sectionName}"]`).click()
    return this
  }
}

export class PromptEditPage extends BasePage {
  waitForPageReady() {
    cy.url().should('include', 'edit=true')
    cy.get('[data-cy="prompt-title"]').should('be.visible')
    return this
  }

  updateTitle(title: string) {
    cy.get('[data-cy="prompt-title"]').clear().type(title)
    return this
  }

  updateDescription(description: string) {
    cy.get('[data-cy="prompt-description"]').clear().type(description)
    return this
  }

  updateTaskContext(context: string) {
    cy.get('[data-cy="taskContext"]').clear().type(context)
    return this
  }

  saveChanges() {
    cy.get('[data-cy="save-prompt"]').click()
    return new PromptDetailPage()
  }

  cancelEdit() {
    cy.get('[data-cy="cancel-edit"]').click()
    return new PromptDetailPage()
  }
}

export class AuthPage extends BasePage {
  signIn(email: string, password: string) {
    cy.visit('/auth/signin')
    cy.get('[data-cy="email-input"]').type(email)
    cy.get('[data-cy="password-input"]').type(password)
    cy.get('[data-cy="signin-button"]').click()
    return new DashboardPage()
  }

  signUp(name: string, email: string, password: string) {
    cy.visit('/auth/signup')
    cy.get('[data-cy="name-input"]').type(name)
    cy.get('[data-cy="email-input"]').type(email)
    cy.get('[data-cy="password-input"]').type(password)
    cy.get('[data-cy="signup-button"]').click()
    return new DashboardPage()
  }

  verifyInvalidCredentials() {
    cy.url().should('include', '/auth/signin')
    // Could add error message verification here
    return this
  }
}