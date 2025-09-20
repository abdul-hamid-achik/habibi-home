# Habibi Home - Floor Plan Designer

A modern SaaS application for designing and visualizing furniture layouts in floor plans. Built with Next.js, Drizzle ORM, NeonDB, and React Moveable.

## Features

- **Interactive Floor Plan Editor**: Drag, resize, and rotate furniture pieces with real-time feedback
- **Zone Management**: Edit and customize room zones/areas with precise measurements
- **Furniture Catalog**: Comprehensive catalog with real furniture dimensions
- **Snap-to-Grid**: Precise positioning with customizable grid snapping
- **Project Management**: Save and load projects (coming soon)
- **Authentication**: Secure user accounts with NextAuth (coming soon)
- **Responsive Design**: Works on desktop and tablet devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Library**: shadcn/ui components with Tailwind CSS
- **Database**: NeonDB (PostgreSQL) with Drizzle ORM
- **Authentication**: NextAuth.js
- **Deployment**: Vercel-ready
- **Editor**: React Moveable for interactive elements

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- NeonDB account (for production)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd habibi.home
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
# Database (NeonDB)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

4. Set up the database:
```bash
# Generate database migrations
npm run db:generate

# Push to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── editor/            # Floor plan editor page
│   └── ...
├── components/
│   ├── ui/                # shadcn/ui components
│   └── floor-plan/        # Floor plan editor components
├── lib/
│   ├── db/                # Database configuration and schema
│   ├── auth.ts            # NextAuth configuration
│   └── furniture-catalog.ts  # Furniture definitions
└── types/                 # TypeScript type definitions
```

## Database Schema

The application uses the following main tables:

- `users` - User accounts (NextAuth)
- `projects` - User floor plan projects
- `zones` - Room/area definitions within projects
- `furniture_items` - Furniture pieces placed in projects
- `furniture_catalog` - Available furniture templates
- `project_settings` - Project display settings

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema to database (development)
- `npm run db:migrate` - Run migrations (production)
- `npm run db:studio` - Open Drizzle Studio

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy!

The application is optimized for Vercel deployment with:
- Automatic builds with Next.js
- Edge-optimized API routes
- Database connection pooling

### Environment Variables for Production

Make sure to set these in your deployment environment:

- `DATABASE_URL` - Your NeonDB connection string
- `NEXTAUTH_URL` - Your production domain
- `NEXTAUTH_SECRET` - A secure random string
- OAuth provider credentials (if using)

## Features in Development

- [ ] User authentication and project ownership
- [ ] Project sharing and collaboration
- [ ] Custom furniture creation
- [ ] Export to PDF/image formats
- [ ] Template gallery
- [ ] Mobile app support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please [open an issue](https://github.com/your-username/habibi-home/issues) on GitHub.

---

**Built with ❤️ using modern web technologies**