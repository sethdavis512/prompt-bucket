# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with HMR at http://localhost:5173
- `npm run typecheck` - Generate React Router types and run TypeScript checking

### Build and Production
- `npm run build` - Build for production (creates client and server builds)
- `npm run start` - Start production server from build output

### Docker
- `docker build -t my-app .` - Build Docker image
- `docker run -p 3000:3000 my-app` - Run containerized app

## Architecture

This is a React Router v7 application with server-side rendering enabled by default.

### Project Structure
- `app/` - Main application code
  - `root.tsx` - Root layout component with HTML structure, error boundary, and font loading
  - `routes.ts` - Route configuration using React Router's file-based routing
  - `routes/` - Route components (currently just `home.tsx`)
  - `welcome/` - Welcome page component and assets
  - `app.css` - Global styles

### Key Configuration
- **TypeScript**: Strict mode enabled with path aliases (`~/*` maps to `./app/*`)
- **Styling**: TailwindCSS v4 with Vite plugin integration
- **Bundling**: Vite with React Router dev plugin and TypeScript paths support
- **SSR**: Server-side rendering enabled in `react-router.config.ts`

### Route System
Routes are configured in `app/routes.ts` using React Router's programmatic config. Currently has a single index route pointing to `routes/home.tsx`.

### Type Generation
React Router generates types automatically. The `typecheck` script runs type generation before TypeScript checking.

### Build Output Structure
```
build/
├── client/    # Static assets for browser
└── server/    # Server-side code
```