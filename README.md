# Invoicerr

Invoicerr is a simple, open-source invoicing application designed to help freelancers manage their quotes and invoices efficiently. It provides a clean interface for creating, sending, and tracking quotes and invoices — so you get paid faster, with less hassle.

![Dashboard Page](https://github.com/user-attachments/assets/18e8af88-cf02-4e35-975a-d57f58d062c6)

## ✨ Features

- Create and manage invoices  
- Create and manage quotes (convertible to invoices)  
- Manage clients and their contact details  
- Track status of quotes and invoices (signed, paid, unread, etc.)  
- Built-in quote signing system with secure tokens  
- Generate and send quote/invoice emails directly from the app
- Generate clean PDF documents (quotes and invoices)  
- Custom brand identity: logo, company name, VAT, and more  
- Authentication via JWT (stored in local storage)  
- International-friendly: Default English UI, customizable currencies  
- PostgreSQL database for production deployments
- Docker & Docker Bake ready for self-hosting with multi-platform support
- Built with modern stack: React 19, NestJS 11, Prisma, PostgreSQL, pnpm
- REST API backend, ready for future integrations
- Security-hardened containers with non-root execution

---

## 🐳 Docker Installation (Recommended)

The fastest way to run Invoicerr is using Docker Compose. A prebuilt image is available at [ghcr.io/impre-visible/invoicerr](https://ghcr.io/impre-visible/invoicerr).

### 🚀 Quick Start

1. Clone the repository:  
   ```bash
   git clone https://github.com/Impre-visible/invoicerr.git
   cd invoicerr
   ```

2. Edit the `docker-compose.yml` to set your environment variables.

3. Run the app:  
   ```bash
   docker compose up -d
   ```

4. Open your browser at:  
   ```
   http://localhost
   ```

### 🏗️ Building from Source

If you want to build the Docker image locally or need custom modifications:

#### Prerequisites
- Docker with Buildx support
- Docker Bake (included with Docker Desktop)

#### Build Commands

```bash
# Local development build
docker buildx bake image-local

# Multi-platform production build (AMD64 + ARM64)
docker buildx bake image-all

# Push to registry
docker buildx bake image-push

# Security scan build
docker buildx bake security-scan
```

#### Build Targets

- **`image-local`**: Local development image with caching
- **`image-all`**: Multi-platform production build (linux/amd64, linux/arm64)
- **`image-push`**: Build and push to container registry
- **`security-scan`**: Build for security scanning (cache-only output)

#### Container Testing

Validate your container build with Goss:

```bash
# Install Goss (if not already installed)
curl -fsSL https://goss.rocks/install | sh

# Run container validation tests
goss -g tests.yaml validate --format tap

# Or test against running container
docker run -d --name test-invoicerr invoicerr:local
goss -g tests.yaml validate --format documentation
docker stop test-invoicerr && docker rm test-invoicerr
```

---

### 🔧 Environment Variables

These environment variables are defined in `docker-compose.yml` under the `invoicerr` service:

- `DATABASE_URL`  
  PostgreSQL connection string. Example:  
  `postgresql://invoicerr:invoicerr@invoicerr_db:5432/invoicerr_db`

- `APP_URL`  
  Full public URL of the frontend (e.g., `https://invoicerr.example.com`).  
  This is required for email templates and links.

- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`  
  Credentials and server used for sending emails (quotes, invoices, etc.)

- `SMTP_FROM`  
  Optional — address used as the sender for emails. If omitted, defaults to `SMTP_USER`.

- `JWT_SECRET`  
  Optional but recommended for JWT authentication. Can be any random string.  
  If not set, a default secret will be used. But it can have issues with docker deployments.

Make sure port 80 is available on your host machine, or change the mapping.

## 🏗️ Architecture & Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript 5.8** - Type-safe development
- **Vite 7** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Modern, accessible components
- **React Router 7** - Client-side routing
- **React Hook Form** - Performance forms
- **Zod** - Schema validation

### Backend  
- **NestJS 11** - Progressive Node.js framework
- **Prisma 6** - Type-safe database toolkit
- **PostgreSQL** - Production database
- **JWT Authentication** - Secure token-based auth
- **Puppeteer** - PDF generation
- **Nodemailer** - Email functionality

### Infrastructure
- **Docker** - Containerization with multi-stage builds
- **Docker Bake** - Advanced build configurations
- **Nginx** - Reverse proxy and static file serving
- **pnpm** - Fast, efficient package management
- **Goss** - Container testing and validation

---

## 💻 Manual Installation (Local Development)

### Prerequisites

- Node.js v22+
- PostgreSQL database (or configure `DATABASE_URL` for other databases)
- pnpm (recommended) or npm

### Steps

1. Clone the project:  
   ```bash
   git clone https://github.com/Impre-visible/invoicerr.git
   cd invoicerr
   ```

2. Install pnpm (if not already installed):
   ```bash
   npm install -g corepack
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

3. Backend setup:  
   ```bash
   cd backend
   pnpm install
   npx prisma generate
   pnpm run start:dev
   ```

4. Frontend setup (in a new terminal):  
   ```bash
   cd frontend
   pnpm install
   pnpm run dev
   ```

5. Open in your browser:  
   - Frontend: `http://localhost:5173`  
   - API: `http://localhost:3000`

### 🛠️ Development Commands

#### Backend
```bash
# Development server with hot reload
pnpm run start:dev

# Production build
pnpm run build

# Run tests
pnpm run test

# Database operations
npx prisma generate    # Generate Prisma client
npx prisma migrate dev # Run database migrations
npx prisma studio     # Open Prisma Studio
```

#### Frontend
```bash
# Development server
pnpm run dev

# Production build
pnpm run build

# Preview production build
pnpm run preview

# Linting
pnpm run lint
```

---

## 📸 Screenshots

<details>
<summary>Dashboard</summary>
  
![Dashboard Page](https://github.com/user-attachments/assets/18e8af88-cf02-4e35-975a-d57f58d062c6)
  
</details>

<details>
<summary>Quotes</summary>

![Quotes Page](https://github.com/user-attachments/assets/588d5cd2-6af3-4cb9-81d3-8faa9f3d30f4)

</details>

<details>
<summary>Invoices</summary>
  
![Invoices Page](https://github.com/user-attachments/assets/8e5134b7-c401-4ff6-bdb9-cfe54b532b29)

</details>

<details>
<summary>Clients</summary>

![Clients Page](https://github.com/user-attachments/assets/1e9e42be-8c21-4c84-96dd-ce8dca17c32e)

</details>

<details>
<summary>Settings</summary>
  
![Settings Page](https://github.com/user-attachments/assets/b8913f41-109a-4e31-a1b8-3c46a1039414)

</details>
