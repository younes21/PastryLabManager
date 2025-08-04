# Replit.md

## Overview

This is a comprehensive bakery laboratory management system (ERP) built with React and Express.js, inspired by Odoo. The application provides full CRUD functionality for managing professional bakery operations including sales, purchasing, accounting, production, inventory, and administration. It features role-based access control with interfaces adapted for point-of-sale systems.

### Business Rules
- **Articles** can be: products, ingredients, or services
- **Default currency**: DA (Algerian Dinar)
- **Automatic codes** for main entities: `{prefix(5 chars max)}-{000000-999999}` (e.g., `frt-000021`)
- **Administrator** has all privileges by default
- **Event tracking table** for change monitoring (activatable/deactivatable)
- **Audit fields** required: `createdAt`, `creatorId`, etc.

### Core Modules
1. **Sales Management**: Clients, Products/Recipes, Quotes/Orders, Product/Ingredient Sales
2. **Purchase Management**: Suppliers, Ingredients, Ingredient Purchases
3. **Billing & Accounting**: Journals/Entries, Delivery/Invoicing, Supplier/Client Payments  
4. **Production (Laboratory)**: Technical Sheets (Recipes), Preparation Planning, Preparations
5. **Inventory (Stock)**: Operations (transfers, adjustments, provisioning), Product/Ingredient tracking
6. **Dashboard**: Overview and analytics
7. **User Management**: Users, Roles, Permissions
8. **Administration**: Users, Measurement Units, Product Categories, Price Lists, Delivery Methods, Taxes, Storage Zones, Currencies, Work Stations, Accounting Journals

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Database**: PostgreSQL with persistent storage (migrated from in-memory storage)
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Storage**: DatabaseStorage class implementing persistent data operations

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

### Recent Changes
- **Products CRUD Module Completed (January 2025)**:
  - Implemented comprehensive products management system with 16 detailed attributes
  - Added products database table with stock tracking, perishability, temperature conservation, and sales authorization
  - Created complete CRUD interface with tabbed form (General, Stock & Gestion, Vente & Prix, Conservation)  
  - Display columns: name, conservation, DLC, price, storage zone with visual icons
  - Automatic code generation (PRD-000001, etc.) and product-specific validation
  - Integration with storage zones and article categories for complete product management
  - Added products navigation to sidebar and routing for admin/manager access
- **Ingredients CRUD Module Completed According to Specifications (August 2025)**:
  - Implemented complete ingredients management using unified articles table with type="ingredient"
  - Added all required fields per specifications: code (auto-generated), designation, description, managed_in_stock, storage_location, category, unit, allow_sale, sale_category, sale_unit, sale_price, tax, photo
  - Created tabbed interface (General, Stock, Vente, Photo) optimized for POS systems
  - Display columns exactly as specified: Actif, Code, Catégorie, Désignation, PMP (Prix Moyen Pondéré)
  - Stock management handled by inventory operations as specified
  - Full CRUD operations with proper validation and error handling
- **Modules Legacy Removed (August 2025)**:
  - Completely removed recipes, productions, orders, deliveries modules (database tables, API routes, UI components)
  - System uses only articles table for products, ingredients, and services
  - Currency system with DA, EUR, USD symbols fully operational
  - System ready for new business rules implementation
- **Measurement Units Management System (January 2025)**:
  - Implemented comprehensive measurement units system with categories and conversion factors
  - Added measurement categories (Poids, Volume, Quantité, Température) with full CRUD operations
  - Created measurement units with type classification (reference, larger, smaller) and conversion factors
  - Built complete admin interface with tabbed navigation for categories and units management
  - Integrated measurement system into navigation with dedicated page accessible to admins/managers
  - Database schema extended with measurementCategories and measurementUnits tables
- **UI Improvements (January 2025)**:
  - Fixed Select.Item validation errors by replacing empty string values with undefined across all components
  - Updated admin panel logo with modern gradient SVG chef hat design
  - Restricted preparateur navigation to only Production and Commands sections
  - Enhanced production workflow with automatic storage completion modal
  - Improved error handling and logging throughout the application
- **Dual Stock Management System (July 2025)**: Implemented comprehensive product stock management alongside ingredient stock
  - New ProductStock and Labels schemas for finished product tracking
  - Stock page with dual view (ingredient stock + product stock) and expiration tracking
  - Production finalization workflow with automatic storage assignment and labeling
  - Barcode generation and label creation for full product traceability
- **Production Workflow Enhancement**: Added "Finaliser" button allowing preparers to complete productions with storage location selection, expiration date setting, and automatic label generation
- **Order Creation Bug Fix**: Resolved timestamp conversion issues in order creation by updating schema to use string mode for dates
- **Client & Delivery Admin Panels (January 2025)**: Created specialized dashboards for clients and delivery personnel
  - Client dashboard with catalog browsing, order management, debt tracking, and shopping cart
  - Delivery dashboard with route assignment, status tracking, and completion management
  - Role-based routing redirects users to appropriate dashboards
- **Enhanced API Routes**: Added specialized endpoints for client orders, delivery management, product stock, and labels
- **UI Components Expansion**: Added Tabs, Badge, and Textarea components for improved interface
- **Sample Users Created**: Test accounts for client (client1/client123) and delivery (livreur1/livreur123) roles
- **Clients CRUD Module Completed (August 2025)**:
  - Complete client management system with automatic code generation (CLI-000001, etc.)
  - Support for both particulier and société client types with specific fields
  - Comprehensive contact and address management with Algerian wilayas
  - Legal information fields (RC, NA, MF, NIS) for business compliance
  - Pricing configuration with special tariffs and price list linking
  - User account linking for client portal access
  - Four-tab interface (General, Contact, Legal, Configuration) optimized for POS
  - Full CRUD operations with detailed view, edit, and delete functionality
- **Legacy Modules Completely Removed (August 2025)**:
  - Ingredients table and all related components removed (using articles with type filtering)
  - All ingredient-specific routes, storage methods, and UI components cleaned up
  - System fully migrated to unified articles table architecture
- **Database Migration Completed (January 2025)**: Successfully migrated from in-memory MemStorage to PostgreSQL database with DatabaseStorage implementation
- **Visual Components Added**: IngredientImage and RecipeImage components with auto-generated SVG icons
- **Multi-role Authentication**: Complete role-based access control system

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