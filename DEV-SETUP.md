# Development Setup

Get Invoicerr running locally with hot reload and all the good stuff.

## What You Need

- Node.js 22+
- pnpm
- Docker & Docker Compose
- Git

## Quick Start

```bash
# Install everything
pnpm setup

# Copy backend config
cd backend && cp .env.development .env && cd ..

# Start database
pnpm dev:db

# Setup database schema
cd backend && pnpm prisma generate && pnpm prisma db push && cd ..

# Start everything
pnpm dev
```

That's it! Open http://localhost:5173 for the frontend and http://localhost:3000/api for the backend.

## Commands

### Main ones you'll use:
- `pnpm dev` - Start everything (database + backend + frontend)
- `pnpm dev:stop` - Stop everything
- `pnpm dev:clean` - Nuclear option (stops everything and cleans up)

### Individual services:
- `pnpm dev:db` - Just the database
- `pnpm dev:backend` - Just the backend (needs database running)
- `pnpm dev:frontend` - Just the frontend
- `pnpm dev:logs` - Check database logs

## What's Running

- **Frontend**: React with Vite at http://localhost:5173
- **Backend**: NestJS at http://localhost:3000/api
- **Database**: PostgreSQL in Docker (port 5432)

Both frontend and backend have hot reload, so changes show up immediately.

## Configuration

The backend needs a `.env` file (that's why we copy `.env.development`). Key settings:

```bash
DATABASE_URL="postgresql://invoicerr:invoicerr_dev_password@localhost:5432/invoicerr_dev"
APP_URL="http://localhost:5173"
JWT_SECRET="your-local-dev-jwt-secret-change-this-in-production"
```

## Common Issues

### "Environment variable not found: DATABASE_URL"
```bash
cd backend && cp .env.development .env && cd ..
```

### Database won't connect
```bash
# Check if it's running
docker ps | grep invoicerr_db_dev

# Check logs
pnpm dev:logs

# Start fresh
pnpm dev:clean && pnpm dev:db
```

### Port conflicts (3000 or 5173 in use)
```bash
npx kill-port 3000 5173
```

### Prisma acting up
```bash
cd backend
pnpm prisma generate
pnpm prisma db push
cd ..
```

### Nuclear option (start completely fresh)
```bash
pnpm dev:clean
pnpm setup
cd backend && cp .env.development .env && cd ..
pnpm dev:db
cd backend && pnpm prisma generate && pnpm prisma db push && cd ..
pnpm dev
```

## Email Testing (Optional)

Want to test email features? Uncomment these in your backend `.env`:

```bash
SMTP_HOST="smtp.mailtrap.io"
SMTP_USER="your-mailtrap-user"
SMTP_FROM="test@invoicerr.local"
SMTP_PASSWORD="your-mailtrap-password"
```

## Database Details

- PostgreSQL 16 in Docker
- Data persists between restarts
- Connection: `postgresql://invoicerr:invoicerr_dev_password@localhost:5432/invoicerr_dev`