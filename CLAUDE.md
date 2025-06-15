# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Server

- `pnpm dev` - Start development server
- `pnpm dev -- --open` - Start development server and open in browser

### Building and Testing

- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm test` - Run all unit tests
- `pnpm test:unit` - Run unit tests in watch mode
- `pnpm check` - Type check with svelte-check
- `pnpm check:watch` - Type check in watch mode

### Code Quality

- `pnpm lint` - Check code formatting and linting
- `pnpm lint:fix` - Fix formatting and linting issues
- `pnpm format` - Format code with Prettier
- `pnpm pre-push` - Run all checks (format, lint, type check, tests)

### Database Operations

- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio database viewer
- `pnpm db:seed` - Seed database with test data

## Project Architecture

### Technology Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Custom session-based auth with Argon2 password hashing
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Forms**: Superforms with Zod validation
- **Testing**: Vitest with Testing Library

### Database Schema

The application uses SQLite with these main entities:

- `user` - User accounts with apartment numbers (format: [A-D]1[0-3]0[1-2])
- `session` - Authentication sessions
- `booking` - Laundry and BBQ bookings
- `userPreferences` - Notification preferences
- `emailVerificationRequest` - Email verification codes
- `passwordResetSession` - Password reset sessions

### Authentication System

- Session-based authentication with secure cookies
- Rate limiting per IP address (100 requests, refill 1/second)
- Email verification required for new accounts
- Password reset via email verification codes
- Apartment validation regex: `/^[A-D]1[0-3]0[1-2]$/` (e.g., A1001, B1302)

### Application Structure

- `src/lib/server/auth/` - Authentication utilities (sessions, passwords, email verification)
- `src/lib/server/db/` - Database schema and connection
- `src/lib/components/ui/` - Reusable UI components (shadcn/ui)
- `src/routes/` - SvelteKit routes with form actions
- `src/lib/routes.ts` - Auto-generated type-safe route definitions

### Key Features

- **Booking System**: Residents can book laundry and BBQ facilities
- **User Management**: Account creation, email verification, password reset
- **Notification Preferences**: Configurable timing for booking reminders
- **Multi-language**: Swedish UI text (use "email" not "e-post")

### Form Handling Pattern

The app uses a consistent pattern for forms:

1. Zod schemas in `schema.ts` files for validation
2. Superforms for form state management
3. Flash messages for user feedback
4. Server-side validation and error handling

### Apartment Number Validation

Apartment numbers must match the exact format enforced by `verifyApartmentInput()`:

- Building: A, B, C, or D
- Floor: 1, 2, or 3 (represented as 10, 11, 12, 13)
- Unit: 01 or 02
- Examples: A1001, B1302, D1101

### Environment Setup

- Requires `DATABASE_URL` environment variable pointing to SQLite database
- Uses `@sveltejs/adapter-node` for deployment
- Configured for production deployment with Node.js

### Code Conventions

- Swedish language for user-facing text
- Use "email" instead of "e-post" in Swedish text
- Prefer emailadress over e-postadress
- TypeScript strict mode enabled
- ESLint with Prettier for code formatting

## Best Practices

- Run `pnpm lint:fix` and `pnpm pre-push` as the final step of a given task

## Commit Guidelines

- When committing changes, use a one-line commit message without any author attribution
- Again, remember to run `pnpm pre-push` before committing to ensure code quality
