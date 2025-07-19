# Replit.md

## Overview

This is a full-stack bakery management system built with React and Express.js. The application provides comprehensive functionality for managing bakery operations including inventory, recipes, production, orders, and deliveries. It features role-based access control with different interfaces for administrators, preparers, managers, clients, and delivery personnel.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured via Neon serverless)
- **Session Management**: connect-pg-simple for PostgreSQL session storage

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

### Database Schema
The application uses a comprehensive schema with the following main entities:
- **Users**: User accounts with role-based permissions
- **Storage Locations**: Physical storage areas with temperature and capacity tracking
- **Ingredients**: Inventory items with stock levels and storage location references
- **Recipes**: Product recipes with ingredients, preparation time, and pricing
- **Production**: Production scheduling and tracking
- **Orders**: Customer orders with items and delivery information
- **Deliveries**: Delivery assignments and tracking

### UI Components
- Consistent design system using shadcn/ui components
- Responsive layout with sidebar navigation
- Role-specific navigation and features
- Modal dialogs for forms and detailed views
- Data tables with sorting and filtering capabilities

## Data Flow

### Client-Server Communication
- RESTful API endpoints under `/api/` prefix
- JSON request/response format
- TanStack Query for data fetching, caching, and synchronization
- Optimistic updates for better user experience

### Database Operations
- Drizzle ORM for type-safe database queries
- PostgreSQL as the primary database
- Database schema defined in `shared/schema.ts`
- Migration system using drizzle-kit

### State Management
- Server state managed by TanStack Query
- Local component state using React hooks
- Authentication state managed via React Context
- Form state handled locally or with react-hook-form

## External Dependencies

### Backend Dependencies
- **Express.js**: Web framework
- **Drizzle ORM**: Database toolkit
- **@neondatabase/serverless**: PostgreSQL driver for Neon
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

## Deployment Strategy

### Build Process
- Frontend: Vite builds React app to `dist/public/`
- Backend: ESBuild bundles server code to `dist/index.js`
- Single artifact deployment with static file serving

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Development mode with hot reloading
- Production mode with optimized builds

### Development Workflow
- `npm run dev`: Start development server with hot reloading
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes

The application is designed to be deployed as a single Node.js application that serves both the API and static frontend files, making it suitable for platforms like Replit, Heroku, or similar Node.js hosting environments.