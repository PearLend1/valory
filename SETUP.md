# Valory - Setup Guide

## Quick Start (Demo Mode)

Demo mode runs with realistic mock UK property data - no database or OAuth server needed.

### Prerequisites
- Node.js 18+ (recommended: Node.js 20)
- npm 9+

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

The app will start at **http://localhost:3000**

### Demo Mode Features
- 20 realistic UK properties across London, Manchester, Birmingham, Bristol, Edinburgh, Leeds, Liverpool, Bath, Oxford, Cambridge
- Pre-authenticated demo users (vendor, agent, buyer, admin)
- All pages and features functional with mock data
- Dark cinematic copper/bronze theme

### Switching Demo User Roles
Add `?role=` query parameter to any tRPC request to switch between user roles:
- Default: **vendor** (shows seller/vendor dashboard)
- `?role=agent` - Agent dashboard and tools
- `?role=buyer` - Buyer discovery and saved properties
- `?role=admin` - Admin access

## Full Production Setup

To connect a real MySQL database and OAuth:

1. Uncomment `DATABASE_URL` in `.env` and set your MySQL connection string
2. Uncomment `OAUTH_SERVER_URL` and `OWNER_OPEN_ID` in `.env`
3. Run database migrations: `npx drizzle-kit push`
4. Start: `npm run dev`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
