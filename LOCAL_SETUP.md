# Docker Full-Stack Setup (Recommended)

Run the entire platform (MySQL, Redis, Backend, Frontend, and automatic database migrations + seeds) inside Docker with a single command:

```bash
docker compose up -d --build
```

That's it! Once built, everything runs automatically:
- **Frontend App**: [http://localhost](http://localhost) (and [http://localhost:5173](http://localhost:5173))
- **Backend API**: [http://localhost:3000](http://localhost:3000)
- **Swagger Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Database**: Automatically migrated and seeded on startup.

---

# Manual Host Setup (Alternative)

---

## 1. System Requirements

- **Operating System**: macOS, Linux, or Windows (WSL2 recommended)
- **Node.js**: v20.x, v22.x, or v24.x
- **Package Manager**: npm >= 10.x
- **Database**: MySQL 8.0+ (or via Docker)
- **Cache / Queue**: Redis 7+ (or via Docker)
- **Optional**: `ffmpeg` for local video audio processing

---

## 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example backend/.env
```

Review and configure the variables in `backend/.env`:

```env
PORT=3000
NODE_ENV=development
BACKEND_PUBLIC_URL=http://localhost:3000

# Google Gemini API Key
GOOGLE_GEMINI_API_KEY=AIzaSy...

# Database Connection String
DATABASE_URL="mysql://studio_user:studio_password@localhost:3306/unsensored_ai"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets
JWT_SECRET=studio-super-secret-jwt-key-32chars
JWT_REFRESH_SECRET=studio-super-secret-refresh-key-32

# Storage
UPLOAD_DIR=./uploads
```

*(Note: When `GOOGLE_GEMINI_API_KEY` is omitted, the backend automatically runs in procedural test fallback mode, generating valid visual mock outputs so you can test all UI flows and database operations without API quota).*

---

## 3. Starting Supporting Services via Docker

To start MySQL and Redis:

```bash
docker compose up -d mysql redis
```
*(Media uploads are stored locally in `./uploads` and served directly through the backend)*

Check that the containers are healthy:
```bash
docker compose ps
```

---

## 4. Backend Setup & Database Migration

Navigate to `backend/`:

```bash
cd backend
npm install

# Generate Prisma Client
npx prisma generate

# Push database schema to MySQL
npx prisma db push

# Seed default administrator, creator, prompt library, and model configurations
npx ts-node prisma/seed.ts
```

Start the backend in watch mode:

```bash
npm run start:dev
```

The NestJS backend will start on:
- API Server: `http://localhost:3000`
- Swagger OpenAPI Documentation: `http://localhost:3000/api/docs`
- Health check: `http://localhost:3000/api/health`

---

## 5. Frontend Setup

Navigate to `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

The React + Vite application will open at `http://localhost:5173`.

---

## 6. Running Tests

Run backend unit tests:
```bash
cd backend
npm test
```

Run frontend unit tests:
```bash
cd frontend
npm test
```

Build production bundles:
```bash
npm run build
```
