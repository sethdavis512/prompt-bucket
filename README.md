# Prompt Bucket

Professional AI prompt management platform with structured 10-section methodology for creating, organizing, and collaborating on high-quality AI prompts.

## Features

- **10-Section Methodology**: Structure prompts using proven framework for comprehensive AI instructions
- **AI Scoring System**: Real-time prompt evaluation with field-specific scoring and improvement suggestions (Pro)
- **Team Collaboration**: Share prompts and categories across team workspaces with role-based permissions
- **Subscription Management**: Freemium model with Polar integration for Pro features
- **Prompt Chains**: Link related prompts in sequences with AI evaluation (Pro)
- **Public Sharing**: Share individual prompts publicly while maintaining privacy controls
- **Category Organization**: Color-coded categorization system for prompt management
- **Advanced Authentication**: Better Auth integration with email verification and session management

## Technology Stack

- **Framework**: React Router v7 with Server-Side Rendering
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with Prisma adapter
- **Styling**: TailwindCSS v4 with Vite plugin
- **AI Integration**: Vercel AI SDK with OpenAI for prompt scoring and generation
- **Payments**: Polar for subscription management
- **Testing**: Cypress for comprehensive E2E testing
- **Deployment**: Docker-ready with multi-platform support

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key (for AI features)

### Installation

```bash
git clone https://github.com/your-username/prompt-bucket.git
cd prompt-bucket
npm install
```

### Environment Setup

Create a `.env` file with required environment variables:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/prompt_bucket"
BETTER_AUTH_SECRET="your-32-character-secret-key"
OPENAI_API_KEY="your-openai-api-key"
POLAR_ACCESS_TOKEN="your-polar-token"
```

### Database Setup

```bash
# Reset database and seed with sample data
npm run db:reset
```

### Development

```bash
# Start development server with HMR
npm run dev
```

Visit `http://localhost:5173` to access the application.

## Core Architecture

### Prompt Structure

Each prompt follows a 10-section methodology:

1. **Task Context** - High-level objective and purpose
2. **Tone Context** - Voice, style, and communication approach
3. **Background Data** - Relevant context and information
4. **Detailed Task Description** - Specific requirements and constraints
5. **Examples** - Sample inputs, outputs, or scenarios
6. **Conversation History** - Previous interaction context
7. **Immediate Task** - Current specific request
8. **Thinking Steps** - Problem-solving methodology
9. **Output Formatting** - Structure and presentation requirements
10. **Prefilled Response** - Starting point or template for AI response

### User Tiers

- **Free Users**: 5 prompt limit, private prompts only, visual scoring hints
- **Pro Users**: Unlimited prompts, public sharing, AI scoring, content generation, chains, categories
- **Admin Users**: Additional admin tools and user management capabilities

### Team Features

- **Team Workspaces**: Dedicated spaces for collaboration
- **Role-based Access**: Admin and Member roles with appropriate permissions
- **Invitation System**: Email-based team member invitations with expiration
- **Shared Resources**: Prompts, categories, and chains accessible to all team members

## API Endpoints

### Authentication
- `POST /api/auth/*` - Better Auth endpoints for login/signup/verification

### Prompts
- `GET /api/prompts` - List user prompts
- `POST /api/prompts` - Create new prompt
- `PUT /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt
- `POST /api/score-prompt` - AI scoring for Pro users

### Teams
- `GET /api/teams` - List user teams
- `POST /api/teams` - Create new team
- `GET /api/teams/:id` - Get team details
- `POST /api/teams/:id/members` - Add team member
- `POST /api/teams/:id/invitations` - Create team invitation

### Webhooks
- `POST /api/webhooks/polar` - Handle Polar subscription events

## Scripts

### Development
- `npm run dev` - Start development server with HMR
- `npm run typecheck` - Generate React Router types and run TypeScript checking

### Build and Production
- `npm run build` - Build for production
- `npm run start` - Start production server

### Database
- `npm run db:reset` - Reset database and run seeds
- `npm run db:seed` - Seed database only

### Testing
- `npm run test:e2e` - Run end-to-end tests with Cypress
- `npm run test:e2e:open` - Open Cypress test runner

## Deployment

### Docker

```bash
# Build image
docker build -t prompt-bucket .

# Run container
docker run -p 3000:3000 prompt-bucket
```

### Supported Platforms

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

## Development Guidelines

### Route Protection

Uses layout-based authentication pattern:
- Public routes: `/`, `/pricing`, `/auth/*`, `/share/:id`
- Protected routes: `/dashboard`, `/prompts/*`, `/chains/*`, `/categories`

### Database Patterns

- User-scoped queries: Always filter by `userId`
- Cascade deletes for data cleanup
- Global Prisma client singleton prevents connection exhaustion

### Component Architecture

```typescript
// Typed route components
export default function Component({ loaderData }: Route.ComponentProps) {
    const { user } = useOutletContext<{ user: User }>();
    // Component logic
}
```

### AI Integration

- Pro subscription validation required for scoring features
- Streaming responses for real-time feedback
- Field-specific prompts optimize for quality and consistency
- Content generation with character limits for token efficiency

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/your-username/prompt-bucket/issues) page.