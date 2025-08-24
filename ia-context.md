
## Overview
This is a comprehensive bakery laboratory management system (ERP) built with React and Express.js, inspired by Odoo. The application provides full CRUD functionality for managing professional bakery operations including sales, purchasing, accounting, production, inventory, and administration. It features role-based access control with interfaces adapted for point-of-sale systems.

### Backend Dependencies
- **Express.js**: Web framework
- **Drizzle ORM**: Database toolkit
- **connect-pg-simple**: PostgreSQL session store
- **zod**: Runtime type validation

### Frontend Dependencies
- **React**: UI framework
- **TanStack Query**: Server state management
- **Wouter**: Lightweight routing
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **React Hook Form**: Form handling
- **date-fns**: Date manipulation

### Development Tools
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **ESBuild**: Production bundling
- **drizzle-kit**: Database migrations and introspection


### Development Workflow
- `npm run dev`: Start development server with hot reloading
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes

The application is designed to be deployed as a single Node.js application that serves both the API and static frontend files, making it suitable for platforms like Replit, Heroku, or similar Node.js hosting environments.

### Project Structure
- `client/` - React frontend application
- `server/` - Express.js backend
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files

## Key Components

### Authentication & Authorization
- Role-based access control with 5 user types: admin, preparateur, gerant, client, livreur
- Username/password authentication with user sessions
- Frontend auth context for managing user state
- Protected routes based on user roles


### UI Components
- Consistent design system using shadcn/ui components
- Responsive layout with sidebar navigation
- Role-specific navigation and features
- Modal dialogs for forms and detailed views
- Data tables with sorting and filtering capabilities

## Client-Server Communication
- RESTful API endpoints under `/api/` prefix
- JSON request/response format
- TanStack Query for data fetching, caching, and synchronization
- Optimistic updates for better user experience

### Database Operations
- Drizzle ORM for type-safe database queries
- PostgreSQL as the primary database with persistent storage
- Database schema defined in `shared/schema.ts`
- Migration system using drizzle-kit (`npm run db:push`)
- DatabaseStorage class provides complete CRUD operations for all entities

### State Management
- Server state managed by TanStack Query
- Local component state using React hooks
- Authentication state managed via React Context
- Form state handled locally or with react-hook-form

### Development Rules (Critical)
1. **Always test generated code with minimal test data and fix errors** to avoid manual fixes after generation
   - Use only essential test data (2-3 records maximum per entity)
   - Avoid saturating database with excessive test data over time
2. **Always test all API calls (CRUD) through the graphical interface** to ensure complete functionality
3. **Navigation must be through lateral menu** - all pages should be accessible via sidebar navigation
