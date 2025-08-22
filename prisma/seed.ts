import { PrismaClient } from '@prisma/client'
import { auth } from '../app/lib/auth'

const prisma = new PrismaClient()

async function createUserWithAuth(email: string, name: string, password: string = 'password123') {
  try {
    // Use Better Auth to create the user
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name
      }
    })

    if (result && result.user) {
      console.log(`✅ Created user: ${email}`)
      return result.user
    } else {
      // User might already exist, try to find them
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      if (existingUser) {
        console.log(`ℹ️  User already exists: ${email}`)
        return existingUser
      } else {
        console.error(`❌ Failed to create user: ${email}`)
        return null
      }
    }
  } catch (error) {
    console.error(`❌ Error creating user ${email}:`, error)
    // Try to find existing user as fallback
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    if (existingUser) {
      console.log(`ℹ️  User already exists: ${email}`)
      return existingUser
    }
    return null
  }
}

async function main() {
  // No default categories - categories are Pro-only and user-created

  // Create demo and test users using Better Auth
  console.log('Creating demo user...')
  const user = await createUserWithAuth('demo@example.com', 'Demo User')

  console.log('Creating test users for e2e testing...')
  const testUser = await createUserWithAuth('test@example.com', 'Test User')
  const proTestUser = await createUserWithAuth('pro@example.com', 'Pro Test User')
  const adminUser = await createUserWithAuth('admin@example.com', 'Admin User')

  // Update user properties that can't be set during creation
  if (testUser) {
    await prisma.user.update({
      where: { id: testUser.id },
      data: { 
        subscriptionStatus: 'inactive', // Free user
        emailVerified: true
      }
    })
  }

  if (proTestUser) {
    await prisma.user.update({
      where: { id: proTestUser.id },
      data: { 
        subscriptionStatus: 'active', // Pro user
        emailVerified: true
      }
    })
  }

  if (adminUser) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { 
        role: 'ADMIN',
        subscriptionStatus: 'active', // Admin user with Pro features
        emailVerified: true
      }
    })
  }

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true }
    })
  }

  // No categories to link since we don't create default categories

  // Create sample prompts if demo user was created
  if (user) {
    console.log('Creating sample prompts...')
    
    await prisma.prompt.create({
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

    await prisma.prompt.create({
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
    
    console.log('✅ Sample prompts created!')
  } else {
    console.log('⚠️  No demo user available, skipping sample prompts')
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