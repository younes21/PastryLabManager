
## Overview

This is a comprehensive bakery laboratory management system (ERP) built with React and Express.js, inspired by Odoo. The application provides full CRUD functionality for managing professional bakery operations including sales, purchasing, accounting, production, inventory, and administration. It features role-based access control with interfaces adapted for point-of-sale systems.

### Business Rules
- **Articles** can be: products, ingredients, or services
- **Default currency**: DA (Algerian Dinar)
- **Automatic codes** for main entities: `{prefix(5 chars max)}-{000000-999999}` (e.g., `frt-000021`)
- **Administrator** has all privileges by default
- **Event tracking table** for change monitoring (activatable/deactivatable)
- **Audit fields** required: `createdAt`, `creatorId`, etc.
- **Measurement Units**: L'unité de mesure d'une recette doit être dans la même catégorie que l'unité de mesure de l'article associé

### Core Modules
1. **Sales Management**: Clients, Products/Recipes, Quotes/Orders, Product/Ingredient Sales
2. **Purchase Management**: Suppliers, Ingredients, Ingredient Purchases
3. **Billing & Accounting**: Journals/Entries, Delivery/Invoicing, Supplier/Client Payments  
4. **Production (Laboratory)**: Technical Sheets (Recipes), Preparation Planning, Preparations
5. **Inventory (Stock)**: Operations (transfers, adjustments, provisioning), Product/Ingredient tracking
6. **Dashboard**: Overview and analytics
7. **User Management**: Users, Roles, Permissions
8. **Administration**: Users, Measurement Units, Product Categories, Price Lists, Delivery Methods, Taxes, Storage Zones, Currencies, Work Stations, Accounting Journals


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
4. **Test execution of every CRUD function from frontend interface**:
   - Test creation, modification, and deletion functions from the UI
   - Add detailed logs to track function execution and results
   - Launch functions from frontend and verify proper execution
   - Verify results before providing final implementation to eliminate manual fixes
5. **Interfaces must be adapted for POS (Point of Sale)** systems with:
   - Large, touch-friendly buttons and inputs
   - Clear typography and high contrast
   - Efficient workflows for commercial use
   - Quick search and filtering capabilities
   - Visual feedback and status indicators