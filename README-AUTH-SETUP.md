# Authentication Setup with Stack Auth & NeonDB

This project has been updated to use Stack Auth (formerly Neon Auth) instead of NextAuth.js.

## Environment Variables

Set the following environment variables in your `.env.local` file:

```env
# Stack Auth Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=your-stack-project-id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your-stack-publishable-key
STACK_SECRET_SERVER_KEY=your-stack-secret-key

# NeonDB Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database?sslmode=require
NEON_API_KEY=your-neon-api-key-here
NEON_PROJECT_ID=your-neon-project-id
```

## Setup Steps

1. **Create a Stack Auth project:**
   - Go to [stack-auth.com](https://stack-auth.com)
   - Create a new project
   - Copy the project ID, publishable key, and secret key to your environment variables

2. **Set up NeonDB:**
   - Go to [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string and update your `DATABASE_URL`
   - Copy the API key and project ID

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run database migrations:**
   ```bash
   npm run db:push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Start NeonDB with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

## Features

- **Authentication pages:**
  - `/auth/signin` - User sign in
  - `/auth/signup` - User registration

- **User management:**
  - User profile with `UserButton` component
  - Automatic redirects after authentication
  - Session management via Stack Auth

- **API integration:**
  - Floor plan analysis API now uses Stack Auth for user identification
  - Projects are associated with authenticated users

## Database Schema

Stack Auth creates its own `neon_auth` schema in your database. The existing application schema remains unchanged and works alongside Stack Auth.

## Components

- `UserButton` - Displays user avatar and provides dropdown menu for user settings
- `SignIn` - Authentication form component
- `SignUp` - User registration form component
- `StackProvider` - Context provider for authentication state
- `StackTheme` - Applies Stack Auth styling

## Migration from NextAuth

The migration removed:
- NextAuth.js dependencies and configuration
- NextAuth API routes (`/api/auth/[...nextauth]`)
- SessionProvider wrapper
- NextAuth database tables (users, accounts, sessions, verificationTokens)

And added:
- Stack Auth SDK
- New authentication API routes (`/api/auth/[...stack]`)
- StackProvider and StackTheme providers
- UserButton component for user management
