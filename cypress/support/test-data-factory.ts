/**
 * Enterprise Test Data Factory
 * Generates consistent, predictable test data with proper cleanup
 */

export interface TestUser {
  email: string
  password: string
  name: string
  userType: 'free' | 'pro' | 'admin'
}

export interface PromptTestData {
  title: string
  description: string
  taskContext?: string
  toneContext?: string
  detailedTaskDescription?: string
  examples?: string
  immediateTask?: string
  outputFormatting?: string
  isPublic?: boolean
}

export interface CategoryTestData {
  name: string
  color: string
  description?: string
}

export class TestDataFactory {
  private static instance: TestDataFactory
  private userCounter = 0
  private promptCounter = 0
  private categoryCounter = 0

  static getInstance(): TestDataFactory {
    if (!TestDataFactory.instance) {
      TestDataFactory.instance = new TestDataFactory()
    }
    return TestDataFactory.instance
  }

  // User Factory Methods
  createUser(userType: 'free' | 'pro' | 'admin' = 'free', prefix = ''): TestUser {
    const timestamp = Date.now()
    this.userCounter++
    
    return {
      email: `${prefix}${userType}-${timestamp}-${this.userCounter}@test.example.com`,
      password: 'TestPassword123!',
      name: `Test ${userType} User ${this.userCounter}`,
      userType
    }
  }

  createFreeUser(prefix = ''): TestUser {
    return this.createUser('free', prefix)
  }

  createProUser(prefix = ''): TestUser {
    return this.createUser('pro', prefix)
  }

  createAdminUser(prefix = ''): TestUser {
    return this.createUser('admin', prefix)
  }

  // Prompt Factory Methods
  createPrompt(overrides: Partial<PromptTestData> = {}): PromptTestData {
    this.promptCounter++
    const timestamp = Date.now()
    
    const defaultPrompt: PromptTestData = {
      title: `Test Prompt ${this.promptCounter} - ${timestamp}`,
      description: `A test prompt created for automated testing purposes. Prompt #${this.promptCounter}`,
      taskContext: 'Act as a professional assistant with expertise in the given domain.',
      toneContext: 'Use a professional yet approachable tone that is informative and helpful.',
      detailedTaskDescription: 'Provide comprehensive assistance to help the user achieve their goals effectively.',
      examples: `Example 1: Professional assistance scenario\nExample 2: Problem-solving scenario`,
      immediateTask: 'Begin by understanding the user\'s specific needs and requirements.',
      outputFormatting: 'Format responses clearly with proper structure and bullet points where appropriate.',
      isPublic: false
    }

    return { ...defaultPrompt, ...overrides }
  }

  createMarketingPrompt(): PromptTestData {
    return this.createPrompt({
      title: `Marketing Campaign Prompt ${this.promptCounter + 1}`,
      description: 'Professional marketing campaign assistant for creating compelling content',
      taskContext: 'Act as a marketing expert with 10+ years of experience in digital campaigns.',
      toneContext: 'Use an energetic, persuasive tone that drives action while remaining professional.',
      detailedTaskDescription: 'Create compelling marketing content that resonates with target audiences and drives conversions.',
      examples: 'Example 1: Email marketing campaign\nExample 2: Social media content strategy',
      immediateTask: 'Identify the target audience and key messaging pillars for the campaign.',
      outputFormatting: '1. Campaign Overview\n2. Target Audience\n3. Key Messages\n4. Call-to-Action'
    })
  }

  createTechnicalPrompt(): PromptTestData {
    return this.createPrompt({
      title: `Technical Documentation Prompt ${this.promptCounter + 1}`,
      description: 'Technical writing assistant for creating clear documentation',
      taskContext: 'Act as a senior technical writer with expertise in software documentation.',
      toneContext: 'Use a clear, precise tone that makes complex topics accessible to developers.',
      detailedTaskDescription: 'Create comprehensive technical documentation that helps developers understand and implement solutions.',
      examples: 'Example 1: API documentation\nExample 2: Integration guide',
      immediateTask: 'Analyze the technical requirements and identify the key concepts to document.',
      outputFormatting: 'Use proper headings, code blocks, and step-by-step instructions.'
    })
  }

  createContentWritingPrompt(): PromptTestData {
    return this.createPrompt({
      title: `Content Writing Assistant ${this.promptCounter + 1}`,
      description: 'Creative content writing helper for engaging articles and posts',
      taskContext: 'Act as an experienced content writer specializing in engaging, SEO-optimized content.',
      toneContext: 'Use an engaging, conversational tone that connects with readers.',
      detailedTaskDescription: 'Create compelling content that informs, entertains, and engages the target audience.',
      examples: 'Example 1: Blog post introduction\nExample 2: Product description',
      immediateTask: 'Research the topic and identify key points that will resonate with readers.',
      outputFormatting: 'Structure content with compelling headlines, subheadings, and call-to-actions.'
    })
  }

  // Category Factory Methods  
  createCategory(overrides: Partial<CategoryTestData> = {}): CategoryTestData {
    this.categoryCounter++
    const colors = ['blue', 'green', 'red', 'purple', 'yellow', 'orange', 'pink', 'gray']
    
    const defaultCategory: CategoryTestData = {
      name: `Test Category ${this.categoryCounter}`,
      color: colors[this.categoryCounter % colors.length],
      description: `A test category for organizing prompts. Category #${this.categoryCounter}`
    }

    return { ...defaultCategory, ...overrides }
  }

  // Bulk Data Generation
  createMultiplePrompts(count: number, type: 'mixed' | 'marketing' | 'technical' | 'content' = 'mixed'): PromptTestData[] {
    const prompts: PromptTestData[] = []
    
    for (let i = 0; i < count; i++) {
      let prompt: PromptTestData
      
      switch (type) {
        case 'marketing':
          prompt = this.createMarketingPrompt()
          break
        case 'technical':
          prompt = this.createTechnicalPrompt()
          break
        case 'content':
          prompt = this.createContentWritingPrompt()
          break
        default:
          // Mixed - cycle through different types
          const types = ['marketing', 'technical', 'content']
          const selectedType = types[i % types.length] as 'marketing' | 'technical' | 'content'
          prompt = this.createPrompt()
          if (selectedType === 'marketing') prompt = { ...prompt, ...this.createMarketingPrompt() }
          else if (selectedType === 'technical') prompt = { ...prompt, ...this.createTechnicalPrompt() }
          else if (selectedType === 'content') prompt = { ...prompt, ...this.createContentWritingPrompt() }
          break
      }
      
      prompts.push(prompt)
    }
    
    return prompts
  }

  createMultipleCategories(count: number): CategoryTestData[] {
    const categories: CategoryTestData[] = []
    const categoryTypes = [
      { name: 'Marketing', color: 'blue' },
      { name: 'Technical', color: 'green' },
      { name: 'Content', color: 'purple' },
      { name: 'Business', color: 'orange' },
      { name: 'Creative', color: 'pink' }
    ]
    
    for (let i = 0; i < count; i++) {
      const typeIndex = i % categoryTypes.length
      const category = this.createCategory({
        name: `${categoryTypes[typeIndex].name} Category ${Math.floor(i / categoryTypes.length) + 1}`,
        color: categoryTypes[typeIndex].color
      })
      categories.push(category)
    }
    
    return categories
  }

  // Search Test Data
  createSearchablePrompts(): PromptTestData[] {
    return [
      this.createPrompt({
        title: 'Email Marketing Campaign Generator',
        description: 'Create effective email marketing campaigns that drive engagement and conversions',
        taskContext: 'Act as an email marketing specialist'
      }),
      this.createPrompt({
        title: 'Blog Writing Assistant',
        description: 'Help write compelling blog posts that rank well in search engines',
        taskContext: 'Act as a content writer and SEO expert'
      }),
      this.createPrompt({
        title: 'Social Media Content Planner',
        description: 'Plan and create engaging social media content across platforms',
        taskContext: 'Act as a social media marketing expert'
      }),
      this.createPrompt({
        title: 'Code Review Helper',
        description: 'Provide constructive feedback on code quality and best practices',
        taskContext: 'Act as a senior software engineer'
      }),
      this.createPrompt({
        title: 'Product Description Writer',
        description: 'Write compelling product descriptions that convert browsers to buyers',
        taskContext: 'Act as a copywriter specializing in e-commerce'
      })
    ]
  }

  // Reset counters for clean test runs
  reset(): void {
    this.userCounter = 0
    this.promptCounter = 0
    this.categoryCounter = 0
  }
}

// Convenience exports
export const dataFactory = TestDataFactory.getInstance()

// Pre-configured data sets
export const TestDataSets = {
  // User sets
  freeUser: () => dataFactory.createFreeUser(),
  proUser: () => dataFactory.createProUser(),
  adminUser: () => dataFactory.createAdminUser(),
  
  // Prompt sets
  basicPrompt: () => dataFactory.createPrompt(),
  marketingPrompt: () => dataFactory.createMarketingPrompt(),
  technicalPrompt: () => dataFactory.createTechnicalPrompt(),
  contentPrompt: () => dataFactory.createContentWritingPrompt(),
  
  // Bulk data
  fivePrompts: () => dataFactory.createMultiplePrompts(5),
  searchablePrompts: () => dataFactory.createSearchablePrompts(),
  
  // Category sets
  basicCategory: () => dataFactory.createCategory(),
  multipleCategories: () => dataFactory.createMultipleCategories(3)
}