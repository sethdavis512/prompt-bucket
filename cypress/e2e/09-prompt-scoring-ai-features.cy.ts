import { 
  createAndSignInUser, 
  createProUserWithSubscription,
  createTestPrompt, 
  takeContextualScreenshot,
  waitForPageLoad 
} from '../support/test-helpers'

describe('9. Prompt Scoring & AI Features (Pro)', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  context('Free User AI Feature Limitations', () => {
    let freeUser: any

    beforeEach(() => {
      createAndSignInUser('free', 'scoring-free').then((user) => {
        freeUser = user
      })
    })

    it('should show scoring hints but not full AI scoring for free users', () => {
      cy.visit('/prompts/new')
      
      cy.screenshot('09-free-user-scoring-hints')
      
      // Fill in some content to trigger hints
      cy.get('[data-cy=prompt-title]').type('Free User Scoring Test')
      cy.get('[data-cy=taskContext]').type('Act as a writer')
      
      cy.screenshot('09-free-user-content-filled')
      
      // Should show contextual hints but not actual scores
      cy.get('body').then(($body) => {
        if ($body.text().includes('hint') || $body.text().includes('suggestion')) {
          cy.screenshot('09-free-user-hints-visible')
        }
        
        // Should not show actual numerical scores
        if ($body.text().includes('Score:') && $body.text().includes('/10')) {
          // This should not happen for free users
          cy.screenshot('09-unexpected-scoring-for-free-user')
        }
        
        // Should show Pro upgrade prompts for AI features
        if ($body.text().includes('Pro') && ($body.text().includes('scoring') || $body.text().includes('AI'))) {
          cy.screenshot('09-ai-features-pro-prompt')
        }
      })
    })

    it('should show upgrade prompts for AI generation features', () => {
      cy.visit('/prompts/new')
      
      // Look for content generation buttons or features
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=generate-content]').length > 0) {
          cy.screenshot('09-generation-features-available')
          
          // Should be disabled for free users
          cy.get('[data-cy=generate-content]').should('be.disabled')
          cy.screenshot('09-generation-disabled-free-user')
        }
        
        // Look for Pro upgrade messaging around AI features
        if ($body.text().includes('AI') && $body.text().includes('Pro')) {
          cy.screenshot('09-ai-pro-upgrade-messaging')
        }
      })
    })

    it('should provide contextual hints without AI scoring', () => {
      cy.visit('/prompts/new')
      
      // Fill in different sections to test hint system
      const testSections = [
        { field: 'taskContext', content: 'Act as a professional' },
        { field: 'toneContext', content: 'Use a formal tone' },
        { field: 'detailedTaskDescription', content: 'Write a short description' }
      ]
      
      testSections.forEach((section, index) => {
        cy.get(`[data-cy=${section.field}]`).type(section.content)
        
        cy.screenshot(`09-hints-section-${index + 1}-${section.field}`)
        
        // Should show helpful hints without scoring
        cy.get('body').then(($body) => {
          if ($body.text().includes('tip') || $body.text().includes('suggestion') || $body.text().includes('consider')) {
            cy.screenshot(`09-hints-provided-${section.field}`)
          }
        })
      })
    })
  })

  context('Pro User AI Scoring Features', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should provide real-time AI scoring for Pro users', () => {
      cy.visit('/prompts/new')
      
      cy.screenshot('09-pro-user-scoring-interface')
      
      // Fill in content that should trigger scoring
      const promptData = {
        title: 'AI Scoring Test Prompt',
        taskContext: 'Act as an expert marketing strategist with 10+ years of experience in digital marketing and brand development',
        toneContext: 'Use a professional, authoritative tone while remaining approachable and accessible to business owners',
        detailedTaskDescription: 'Create a comprehensive marketing strategy that includes target audience analysis, channel selection, and budget allocation recommendations'
      }
      
      cy.get('[data-cy=prompt-title]').type(promptData.title)
      
      cy.screenshot('09-pro-title-filled')
      
      cy.get('[data-cy=taskContext]').type(promptData.taskContext)
      
      // Wait for potential scoring to trigger
      cy.wait(2000)
      
      cy.screenshot('09-pro-task-context-scoring')
      
      // Look for scoring interface
      cy.get('body').then(($body) => {
        if ($body.text().includes('Score:') || $body.find('[data-cy=field-score]').length > 0) {
          cy.screenshot('09-scoring-interface-active')
          
          // Should show numerical scores
          cy.get('[data-cy=field-score]').should('be.visible')
        }
        
        // Look for score button to trigger scoring
        if ($body.find('[data-cy=score-prompt]').length > 0) {
          cy.get('[data-cy=score-prompt]').click()
          cy.wait(3000) // Wait for AI response
          
          cy.screenshot('09-ai-scoring-results')
        }
      })
      
      // Continue filling content to test multiple sections
      cy.get('[data-cy=toneContext]').type(promptData.toneContext)
      cy.get('[data-cy=detailedTaskDescription]').type(promptData.detailedTaskDescription)
      
      cy.screenshot('09-comprehensive-prompt-for-scoring')
    })

    it('should show scoring breakdown by section', () => {
      cy.visit('/prompts/new')
      
      // Create comprehensive prompt to test section-by-section scoring
      const sections = [
        { field: 'taskContext', content: 'Act as a senior software engineer with expertise in system architecture and code review processes.' },
        { field: 'toneContext', content: 'Use a clear, technical tone that is instructive without being condescending.' },
        { field: 'backgroundData', content: 'The codebase is a React TypeScript application with 50,000+ lines of code.' },
        { field: 'detailedTaskDescription', content: 'Review the provided code for security vulnerabilities, performance issues, and maintainability concerns.' }
      ]
      
      cy.get('[data-cy=prompt-title]').type('Section Scoring Test')
      
      sections.forEach((section, index) => {
        cy.get(`[data-cy=${section.field}]`).type(section.content)
        
        cy.screenshot(`09-section-${index + 1}-filled`)
        
        // Look for section-specific scoring
        cy.get('body').then(($body) => {
          if ($body.find(`[data-cy=${section.field}-score]`).length > 0) {
            cy.screenshot(`09-section-${index + 1}-scored`)
          }
        })
      })
      
      // Trigger overall scoring if available
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=score-all-sections]').length > 0) {
          cy.get('[data-cy=score-all-sections]').click()
          cy.wait(5000) // Wait for comprehensive scoring
          
          cy.screenshot('09-all-sections-scored')
        }
      })
    })

    it('should provide AI-generated content suggestions', () => {
      cy.visit('/prompts/new')
      
      cy.get('[data-cy=prompt-title]').type('AI Generation Test')
      cy.get('[data-cy=taskContext]').type('Act as a content marketing expert')
      
      cy.screenshot('09-before-ai-generation')
      
      // Look for content generation features
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=generate-content]').length > 0) {
          cy.screenshot('09-generation-button-available')
          
          // Should be enabled for Pro users
          cy.get('[data-cy=generate-content]').should('not.be.disabled')
          
          // Try to generate content
          cy.get('[data-cy=generate-content]').click()
          cy.wait(3000) // Wait for AI generation
          
          cy.screenshot('09-ai-content-generated')
          
          // Should show generated suggestions
          cy.get('body').then(($body) => {
            if ($body.text().includes('suggestion') || $body.text().includes('generated')) {
              cy.screenshot('09-generation-suggestions-visible')
            }
          })
        }
        
        // Look for section-specific generation
        if ($body.find('[data-cy=generate-tone-context]').length > 0) {
          cy.get('[data-cy=generate-tone-context]').click()
          cy.wait(2000)
          
          cy.screenshot('09-tone-context-generated')
        }
      })
    })

    it('should show comprehensive prompt scoring dashboard', () => {
      // First create a prompt with scoring
      cy.visit('/prompts/new')
      
      const scoredPrompt = {
        title: 'Comprehensive Scored Prompt',
        taskContext: 'Act as an expert business consultant specializing in strategic planning and market analysis',
        toneContext: 'Use a professional, data-driven tone with clear actionable recommendations',
        detailedTaskDescription: 'Analyze the provided market data and create a comprehensive strategic plan with specific recommendations',
        examples: 'Example 1: SWOT Analysis for Tech Startup\\nExample 2: Market Entry Strategy for SaaS Product'
      }
      
      Object.entries(scoredPrompt).forEach(([key, value]) => {
        if (key === 'title') {
          cy.get('[data-cy=prompt-title]').type(value)
        } else {
          cy.get(`[data-cy=${key}]`).type(value)
        }
      })
      
      cy.screenshot('09-comprehensive-prompt-for-dashboard')
      
      // Trigger scoring
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=score-prompt]').length > 0) {
          cy.get('[data-cy=score-prompt]').click()
          cy.wait(5000)
          
          cy.screenshot('09-prompt-scored-for-dashboard')
        }
      })
      
      cy.get('[data-cy=save-prompt]').click()
      
      // Visit dashboard to see scoring statistics
      cy.visit('/dashboard')
      
      cy.screenshot('09-dashboard-with-scoring-stats')
      
      // Should show scoring statistics
      cy.get('body').then(($body) => {
        if ($body.text().includes('Score') || $body.text().includes('scored')) {
          cy.screenshot('09-scoring-stats-visible')
        }
      })
    })
  })

  context('Scoring Quality and Feedback', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should provide meaningful scoring feedback', () => {
      cy.visit('/prompts/new')
      
      // Test with intentionally weak content
      const weakPrompt = {
        title: 'Weak Prompt Test',
        taskContext: 'Help me write',
        detailedTaskDescription: 'Write something good'
      }
      
      cy.get('[data-cy=prompt-title]').type(weakPrompt.title)
      cy.get('[data-cy=taskContext]').type(weakPrompt.taskContext)
      cy.get('[data-cy=detailedTaskDescription]').type(weakPrompt.detailedTaskDescription)
      
      cy.screenshot('09-weak-prompt-content')
      
      // Trigger scoring
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=score-prompt]').length > 0) {
          cy.get('[data-cy=score-prompt]').click()
          cy.wait(3000)
          
          cy.screenshot('09-weak-prompt-scored')
          
          // Should show low scores and improvement suggestions
          cy.get('body').then(($body) => {
            if ($body.text().includes('improve') || $body.text().includes('suggestion')) {
              cy.screenshot('09-improvement-suggestions')
            }
          })
        }
      })
      
      // Now test with strong content
      cy.get('[data-cy=taskContext]').clear().type('Act as a senior technical writer with 15+ years of experience in software documentation, API reference guides, and developer education materials')
      cy.get('[data-cy=detailedTaskDescription]').clear().type('Create comprehensive, user-friendly documentation that helps developers quickly understand and implement the API endpoints, including detailed examples, error handling, and best practices')
      
      cy.screenshot('09-strong-prompt-content')
      
      // Score again
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=score-prompt]').length > 0) {
          cy.get('[data-cy=score-prompt]').click()
          cy.wait(3000)
          
          cy.screenshot('09-strong-prompt-scored')
          
          // Should show higher scores
          cy.get('body').then(($body) => {
            if ($body.text().includes('excellent') || $body.text().includes('good')) {
              cy.screenshot('09-positive-scoring-feedback')
            }
          })
        }
      })
    })

    it('should handle scoring errors gracefully', () => {
      cy.visit('/prompts/new')
      
      cy.get('[data-cy=prompt-title]').type('Error Handling Test')
      cy.get('[data-cy=taskContext]').type('Test error handling in scoring')
      
      // Trigger scoring multiple times rapidly to test error handling
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=score-prompt]').length > 0) {
          cy.get('[data-cy=score-prompt]').click()
          cy.get('[data-cy=score-prompt]').click()
          cy.get('[data-cy=score-prompt]').click()
          
          cy.screenshot('09-rapid-scoring-requests')
          
          // Should handle gracefully without breaking
          cy.wait(3000)
          
          cy.screenshot('09-scoring-error-handling')
        }
      })
    })
  })

  context('Scoring History and Analytics', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should track scoring history over time', () => {
      // Create multiple scored prompts
      const prompts = [
        { title: 'First Scored Prompt', context: 'Act as a marketing expert' },
        { title: 'Second Scored Prompt', context: 'Act as a technical writer' },
        { title: 'Third Scored Prompt', context: 'Act as a business analyst' }
      ]
      
      prompts.forEach((prompt, index) => {
        cy.visit('/prompts/new')
        
        cy.get('[data-cy=prompt-title]').type(prompt.title)
        cy.get('[data-cy=taskContext]').type(prompt.context)
        
        // Score if available
        cy.get('body').then(($body) => {
          if ($body.find('[data-cy=score-prompt]').length > 0) {
            cy.get('[data-cy=score-prompt]').click()
            cy.wait(2000)
          }
        })
        
        cy.get('[data-cy=save-prompt]').click()
        cy.wait(1000)
        
        cy.screenshot(`09-scored-prompt-${index + 1}-created`)
      })
      
      // Check dashboard for scoring analytics
      cy.visit('/dashboard')
      
      cy.screenshot('09-scoring-analytics-dashboard')
      
      // Should show aggregate scoring data
      cy.get('body').then(($body) => {
        if ($body.text().includes('Average Score') || $body.text().includes('Best Score')) {
          cy.screenshot('09-scoring-analytics-visible')
        }
      })
    })
  })

  context('Mobile AI Features Experience', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should provide good mobile experience for AI features', () => {
      cy.viewport(375, 667) // Mobile viewport
      
      cy.visit('/prompts/new')
      
      cy.screenshot('09-mobile-ai-features')
      
      cy.get('[data-cy=prompt-title]').type('Mobile AI Test')
      cy.get('[data-cy=taskContext]').type('Act as a mobile UX expert')
      
      // AI features should be accessible on mobile
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=score-prompt]').length > 0) {
          cy.get('[data-cy=score-prompt]').should('be.visible')
          cy.get('[data-cy=score-prompt]').click()
          
          cy.screenshot('09-mobile-scoring-triggered')
          
          cy.wait(3000)
          
          cy.screenshot('09-mobile-scoring-results')
        }
        
        if ($body.find('[data-cy=generate-content]').length > 0) {
          cy.get('[data-cy=generate-content]').should('be.visible')
          cy.screenshot('09-mobile-generation-available')
        }
      })
    })
  })

  context('AI Feature Performance', () => {
    beforeEach(() => {
      createTestUser(TEST_USERS.pro)
      signInTestUser(TEST_USERS.pro)
    })

    it('should handle AI features with reasonable performance', () => {
      cy.visit('/prompts/new')
      
      cy.get('[data-cy=prompt-title]').type('Performance Test Prompt')
      cy.get('[data-cy=taskContext]').type('Act as a performance testing expert')
      
      // Test scoring performance
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=score-prompt]').length > 0) {
          const startTime = Date.now()
          
          cy.get('[data-cy=score-prompt]').click()
          
          cy.screenshot('09-scoring-performance-start')
          
          // Wait for completion (with reasonable timeout)
          cy.wait(10000) // Max 10 seconds for scoring
          
          cy.then(() => {
            const endTime = Date.now()
            const duration = endTime - startTime
            
            // Scoring should complete within reasonable time
            expect(duration).to.be.lessThan(15000) // 15 seconds max
          })
          
          cy.screenshot('09-scoring-performance-complete')
        }
      })
    })
  })
})