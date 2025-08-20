import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default categories
  const categories = [
    {
      name: 'Writing & Content',
      description: 'Prompts for writing articles, blogs, and creative content',
      color: '#3B82F6'
    },
    {
      name: 'Code & Development',
      description: 'Programming and software development prompts',
      color: '#10B981'
    },
    {
      name: 'Business & Strategy',
      description: 'Business analysis, strategy, and planning prompts',
      color: '#F59E0B'
    },
    {
      name: 'Education & Learning',
      description: 'Educational content and learning prompts',
      color: '#8B5CF6'
    },
    {
      name: 'Creative & Design',
      description: 'Creative projects and design thinking prompts',
      color: '#EC4899'
    }
  ]

  console.log('Creating categories...')
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    })
  }

  // Create a demo user
  console.log('Creating demo user...')
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      emailVerified: true
    }
  })

  // Get categories for relating to prompts
  const writingCategory = await prisma.category.findUnique({ where: { name: 'Writing & Content' } })
  const codeCategory = await prisma.category.findUnique({ where: { name: 'Code & Development' } })

  // Create sample prompts
  console.log('Creating sample prompts...')
  
  const articlePrompt = await prisma.prompt.create({
    data: {
      title: 'Blog Article Writer',
      description: 'A comprehensive prompt for writing engaging blog articles',
      userId: user.id,
      taskContext: 'You are an expert content writer and blogger with years of experience creating engaging, informative articles.',
      toneContext: 'Use a conversational, friendly, and professional tone. Write in a way that\'s accessible to a general audience while maintaining expertise.',
      backgroundData: 'Consider current industry trends, SEO best practices, and reader engagement techniques.',
      detailedTaskDescription: 'Write a comprehensive blog article that:\n- Has a compelling headline\n- Includes an engaging introduction\n- Uses subheadings to break up content\n- Incorporates relevant examples\n- Ends with a strong conclusion and call-to-action',
      examples: 'Example structure:\nH1: Main Title\nIntroduction (hook + preview)\nH2: Key Point 1\nH2: Key Point 2\nH2: Key Point 3\nConclusion + CTA',
      immediateTask: 'Write a blog article about [TOPIC] targeting [AUDIENCE].',
      thinkingSteps: 'Take a deep breath and think step by step:\n1. Analyze the topic and audience\n2. Create an outline\n3. Write engaging content\n4. Review and optimize',
      outputFormatting: 'Format as a complete blog post with:\n- Compelling headline\n- Proper heading structure (H1, H2, H3)\n- Short paragraphs (2-3 sentences)\n- Bullet points where appropriate\n- Strong conclusion with CTA'
    }
  })

  const codeReviewPrompt = await prisma.prompt.create({
    data: {
      title: 'Code Review Assistant',
      description: 'A detailed prompt for conducting thorough code reviews',
      userId: user.id,
      taskContext: 'You are a senior software engineer with expertise in code quality, best practices, and security.',
      toneContext: 'Be constructive, specific, and educational. Point out both strengths and areas for improvement.',
      backgroundData: 'Consider coding standards, security implications, performance, maintainability, and readability.',
      detailedTaskDescription: 'Conduct a comprehensive code review that covers:\n- Code quality and style\n- Security vulnerabilities\n- Performance optimizations\n- Best practices adherence\n- Potential bugs or edge cases',
      examples: 'Review format:\n✅ Strengths: [list good practices]\n⚠️ Issues: [list problems with explanations]\n💡 Suggestions: [improvement recommendations]\n🔒 Security: [security considerations]',
      immediateTask: 'Review the following code and provide detailed feedback: [CODE]',
      thinkingSteps: 'Analyze systematically:\n1. Read through the entire code\n2. Check for security issues\n3. Evaluate performance\n4. Review style and structure\n5. Suggest improvements',
      outputFormatting: 'Organize feedback into clear sections:\n- Summary\n- Detailed Issues (with line numbers)\n- Suggestions for Improvement\n- Security Considerations\n- Overall Rating'
    }
  })

  // Link prompts to categories
  if (writingCategory) {
    await prisma.promptCategory.create({
      data: {
        promptId: articlePrompt.id,
        categoryId: writingCategory.id
      }
    })
  }

  if (codeCategory) {
    await prisma.promptCategory.create({
      data: {
        promptId: codeReviewPrompt.id,
        categoryId: codeCategory.id
      }
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })