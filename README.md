# Advertising Agency Platform

A full-stack advertising campaign management ecosystem consisting of 5 integrated services — 2 frontend applications and 3 backend microservices.

## Architecture

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  Task 1.1                   │     │  Task 1.2                   │
│  Campaign Dashboard (Next)  │     │  Creative Brief Builder     │
│  Port: 3003                 │     │  Port: 3004                 │
└──────────┬──────────────────┘     └──────────┬──────────────────┘
           │ REST API                          │ REST API
           ▼                                   ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  Task 2.1                   │     │  Task 2.2                   │
│  Campaign Management API    │     │  AI Content Generation      │
│  Port: 3000                 │     │  Port: 3001                 │
│  Express + SQLite + JWT     │     │  Express + Mock LLM         │
└──────────┬──────────────────┘     └─────────────────────────────┘
           │ Polling
           ▼
┌─────────────────────────────┐
│  Task 2.3                   │
│  Notification System        │
│  Port: 3002                 │
│  Socket.IO + SQLite         │
└─────────────────────────────┘
```

## Services

| Service | Folder | Port | Technology |
|---------|--------|------|------------|
| Campaign Management API | `src/` (root) | 3000 | Express, SQLite, JWT, Joi |
| AI Content Generation | `task-2.2-ai-content-service/` | 3001 | Express, Mock LLM, SSE |
| Notification System | `task-2.3-notification-system/` | 3002 | Express, Socket.IO, SQLite |
| Campaign Dashboard | `task-1.1-campaign-dashboard/` | 3003 | Next.js, React |
| Creative Brief Builder | `task-1.2-creative-brief-builder/` | 3004 | Next.js, React |

## Quick Start

### 1. Campaign Management API (Task 2.1)
```bash
# From project root
npm install
npm run db:init
npm run dev
# → http://localhost:3000
```

### 2. AI Content Generation Service (Task 2.2)
```bash
cd task-2.2-ai-content-service
npm install
npm run dev
# → http://localhost:3001
```

### 3. Notification System (Task 2.3)
```bash
cd task-2.3-notification-system
npm install
npm run dev
# → http://localhost:3002
# → Client UI: http://localhost:3002/client/index.html
```

### 4. Campaign Dashboard (Task 1.1)
```bash
cd task-1.1-campaign-dashboard
npm install
npm run dev
# → http://localhost:3003
```

### 5. Creative Brief Builder (Task 1.2)
```bash
cd task-1.2-creative-brief-builder
npm install
npm run dev
# → http://localhost:3004
```

## API Endpoints

### Task 2.1 — Campaign Management API (Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate and get JWT token |
| GET | `/api/campaigns` | List all campaigns (paginated, filterable) |
| POST | `/api/campaigns` | Create a new campaign |
| GET | `/api/campaigns/:id` | Get campaign details with metrics |
| PUT | `/api/campaigns/:id` | Update a campaign |
| DELETE | `/api/campaigns/:id` | Soft-delete a campaign |
| GET | `/api/health` | Health check |

### Task 2.2 — AI Content Generation (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate/copy` | Generate ad copy (headline, body, CTA) |
| POST | `/generate/copy/stream` | SSE streaming copy generation |
| POST | `/generate/social` | Generate social media captions |
| POST | `/generate/hashtags` | Generate relevant hashtags |
| GET | `/health` | Health check |

### Task 2.3 — Notification System (Port 3002)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/count` | Get unread count |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| GET | `/api/rules` | List alert rules |
| POST | `/api/rules` | Create alert rule |
| PUT | `/api/rules/:id` | Update alert rule |
| DELETE | `/api/rules/:id` | Delete alert rule |
| GET | `/health` | Health check |

**WebSocket Events (Socket.IO):**
- `new_notification` — Real-time alert broadcast
- `unread_count` — Updated unread badge count
- `mark_read` — Mark single notification read
- `mark_all_read` — Mark all notifications read

## Task Connections

1. **Dashboard → API**: Task 1.1 fetches campaign data from Task 2.1 (`localhost:3000/api`)
2. **Notifications → API**: Task 2.3 polls Task 2.1 for campaign metrics, triggers alerts on threshold breach
3. **Brief Builder → AI**: Task 1.2 sends creative briefs to Task 2.2 for AI-generated copy

## Environment Variables

Each service has its own `.env` file. See `.env.example` in each folder.

## Docker (Task 2.2)

```bash
cd task-2.2-ai-content-service
docker-compose up --build
```
