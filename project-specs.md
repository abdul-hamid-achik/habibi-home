# Habibi Home - Floor Plan Designer SaaS

A modern SaaS application for designing and visualizing furniture layouts in floor plans. Built with Next.js, Drizzle ORM, NeonDB, and React Moveable. This is a collaborative project between Abdul and his wife to create an intuitive floor planning tool.

## 🎯 Project Overview

**Habibi Home** is an interactive floor planner application that allows users to design room layouts by dragging, resizing, and rotating furniture pieces in real-time. The application features a comprehensive furniture catalog with realistic dimensions and supports multiple apartment types.

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Runtime**: React 19 with modern hooks and patterns
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Animations**: CSS animations with `tw-animate-css`
- **Interactive Elements**: React Moveable for drag, resize, and rotate functionality

### Backend & Database
- **API**: Next.js API routes with edge optimization
- **Database**: NeonDB (PostgreSQL) with connection pooling
- **ORM**: Drizzle ORM with Zod validation schemas
- **Authentication**: NextAuth.js with OAuth providers
- **File Storage**: Vercel Blob for asset management

### Development Tools
- **Linting**: ESLint with Next.js configuration
- **Package Manager**: npm with lockfile
- **Build Tool**: Turbopack for fast development builds
- **Database Tools**: Drizzle Kit for migrations and schema management

## 📁 Project Structure

```
habibi.home/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (auth, floorplan analysis)
│   │   ├── editor/            # Main floor plan editor page
│   │   ├── globals.css        # Global styles and animations
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # Reusable UI components (shadcn/ui)
│   │   └── floor-plan/        # Floor plan editor components
│   ├── lib/
│   │   ├── db/                # Database configuration & schema
│   │   ├── auth.ts            # NextAuth configuration
│   │   └── furniture-catalog.ts # Furniture definitions
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── .cursor/                   # Cursor IDE configuration
├── environment.json           # Cursor background agents config
└── project-specs.md          # This documentation
```

## 🗄️ Database Schema

### Core Tables
- **`users`** - User accounts with NextAuth integration
- **`projects`** - User floor plan projects with metadata
- **`zones`** - Room/area definitions within projects (living room, bedroom, etc.)
- **`furniture_items`** - Placed furniture pieces with position, rotation, and styling
- **`furniture_catalog`** - Available furniture templates with dimensions
- **`project_settings`** - Project-specific configuration (grid, scale, dimensions)

### Key Features
- **UUID Primary Keys** for all main entities
- **Decimal Precision** for accurate measurements (10,2 scale)
- **JSON Support** for flexible configuration storage
- **Automatic Timestamps** for audit trails
- **Referential Integrity** with cascading deletes

## 🪑 Furniture System

### Furniture Catalog
The application includes a comprehensive furniture catalog with realistic dimensions:

- **Sofas**: Various sofa sizes, chairs, and ottomans
- **Tables**: Dining tables, coffee tables, side tables, desks
- **Beds**: Single, double, queen, and king size beds
- **Storage**: Dressers, cabinets, shelves, buffets
- **Appliances**: Refrigerator, stove, washer, dishwasher
- **Electronics**: TV, monitors, and entertainment systems
- **Decor**: Plants, rugs, and decorative items

### Interactive Features
- **Drag & Drop**: Move furniture around the floor plan
- **Resize**: Adjust furniture dimensions in real-time
- **Rotate**: Rotate furniture pieces with precise angle control
- **Snap-to-Grid**: Optional grid snapping for precise positioning
- **Zone Management**: Organize furniture by room/area
- **Real-time Preview**: Instant visual feedback during editing

## 🎨 UI/UX Design

### Design System
- **Color Palette**: Carefully chosen colors for different furniture categories
- **Typography**: Modern, readable font stack
- **Spacing**: Consistent spacing system using Tailwind utilities
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Works on desktop and tablet devices

### Component Architecture
- **Modular Design**: Reusable components with clear separation of concerns
- **shadcn/ui Integration**: High-quality, accessible UI components
- **Custom Floor Plan Components**: Specialized components for the editor
- **State Management**: React hooks for local state, database for persistence

## 🚀 Development Workflow

### Getting Started
1. Install dependencies: `npm install`
2. Set up environment variables (`.env.local`)
3. Configure database: `npm run db:push`
4. Start development server: `npm run dev`

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema to database (development)
- `npm run db:migrate` - Run migrations (production)
- `npm run db:studio` - Open Drizzle Studio for database inspection

### Environment Variables
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

## 🔧 Cursor IDE Integration

### Background Agents
The project includes `environment.json` configuration for Cursor background agents:
- **Development Server**: Auto-starts Next.js dev server on port 3000
- **Database Studio**: Launches Drizzle Studio on port 4983
- **Environment Variables**: Pre-configured for development

### MCP Servers
The `.cursor/mcp.json` configures Model Context Protocol servers:
- **Filesystem Server**: Access to project files and directories
- **Git Server**: Git repository operations and history
- **Neon MCP Server**: Management of NeonDB resources and databases
- **PostgreSQL MCP Server**: Direct database schema inspection and read-only queries
- **Sequential Thinking**: Advanced reasoning and planning tools

### Environment Variables for MCP
```env
# NeonDB API Key (required for Neon MCP Server)
NEON_API_KEY="your-neon-api-key"

# Database URL (required for PostgreSQL MCP Server)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### Key Features for Cursor Users
- **Smart Code Completion**: Enhanced with project-specific types and schemas
- **Database Integration**: Direct access to NeonDB through Drizzle
- **Real-time Preview**: Live editing with hot reload
- **Component Library**: shadcn/ui components with full TypeScript support
- **Interactive Editor**: React Moveable integration for furniture manipulation

## 📋 Development Roadmap

### Current Features ✅
- Interactive floor plan editor with drag, resize, rotate
- Comprehensive furniture catalog with realistic dimensions
- Zone management for room organization
- Snap-to-grid functionality
- Real-time visual feedback
- Database schema with proper relationships
- NextAuth authentication setup
- Modern UI with shadcn/ui components

### Planned Features 🚧
- [ ] User authentication and project ownership
- [ ] Project sharing and collaboration
- [ ] Custom furniture creation
- [ ] Export to PDF/image formats
- [ ] Template gallery
- [ ] Mobile app support
- [ ] Advanced measurement tools
- [ ] 3D visualization mode
- [ ] Integration with furniture retailers
- [ ] Virtual reality support

## 🎯 Business Model

This SaaS application targets:
- **Homeowners** planning room layouts
- **Interior Designers** creating client proposals
- **Real Estate Agents** showcasing properties
- **Furniture Retailers** helping customers visualize purchases
- **Architects** designing space utilization

### Monetization Strategy
- **Freemium Model**: Basic features free, premium templates paid
- **Subscription Tiers**: Monthly/annual plans with advanced features
- **Export Features**: One-time fees for high-quality exports
- **API Access**: Enterprise plans for integrations

## 🤝 Contributing

This is a collaborative project built with ❤️ by Abdul and his wife. The codebase follows modern best practices:

- **Clear Commit Messages**: Descriptive, organized commit history
- **TypeScript First**: Full type safety throughout the application
- **Component Documentation**: Well-documented React components
- **Database Migrations**: Proper schema versioning with Drizzle
- **Testing Ready**: Structure prepared for unit and integration tests

## 📚 Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Drizzle ORM Guide**: https://orm.drizzle.team
- **React Moveable**: https://daybrush.com/moveable/
- **shadcn/ui**: https://ui.shadcn.com
- **NeonDB**: https://neon.tech/docs
- **NextAuth.js**: https://next-auth.js.org

---

**Built with modern web technologies for an exceptional user experience in floor planning and interior design.**
