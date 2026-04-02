# Deployment Guide — Advertising Campaign Ecosystem

This guide covers deploying the full 5-service ecosystem:
- **Backends** (3 services) → **Render** (free tier, persistent storage)
- **Frontends** (2 apps) → **Vercel** (Next.js optimized)

---

## Step 1: Push to GitHub

Ensure your entire project is in a single GitHub repo:

```bash
git init
git add .
git commit -m "Prepare for deployment"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 2: Deploy Backends to Render

### Option A: Blueprint (Automatic)

1. Go to [https://render.com](https://render.com) and sign in
2. Click **New → Blueprint**
3. Connect your GitHub repo
4. Render will detect `render.yaml` and configure all 3 services
5. Click **Apply** to deploy

### Option B: Manual Setup

#### 2a. Campaign Management API (Task 2.1)

1. Render Dashboard → **New → Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `campaign-management-api`
   - **Root Directory**: `.` (leave empty / root)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add a **Disk**:
   - Mount Path: `/opt/render/project/src/data`
   - Size: 1 GB
5. Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=<generate a strong random string>
   JWT_EXPIRES_IN=24h
   DB_PATH=/opt/render/project/src/data/campaigns.db
   CORS_ORIGIN=*  (update after deploying frontends)
   ```
6. Click **Create Web Service**
7. Note the URL: `https://campaign-management-api-xxxx.onrender.com`

#### 2b. AI Content Service (Task 2.2)

1. Render → **New → Web Service**
2. Connect same repo
3. Settings:
   - **Name**: `ai-content-service`
   - **Root Directory**: `task-2.2-ai-content-service`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Environment Variables:
   ```
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=*  (update after deploying frontends)
   ```
5. Note the URL: `https://ai-content-service-xxxx.onrender.com`

#### 2c. Notification System (Task 2.3)

1. Render → **New → Web Service**
2. Connect same repo
3. Settings:
   - **Name**: `notification-system`
   - **Root Directory**: `task-2.3-notification-system`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add a **Disk**:
   - Mount Path: `/opt/render/project/src/data`
   - Size: 1 GB
5. Environment Variables:
   ```
   NODE_ENV=production
   PORT=3002
   CAMPAIGN_API_URL=https://campaign-management-api-xxxx.onrender.com/api
   DB_PATH=/opt/render/project/src/data/notifications.db
   CORS_ORIGIN=*  (update after deploying frontends)
   ```
6. Note the URL: `https://notification-system-xxxx.onrender.com`

---

## Step 3: Verify Backend Deployments

Test each service health endpoint:

```bash
curl https://campaign-management-api-xxxx.onrender.com/api/health
curl https://ai-content-service-xxxx.onrender.com/health
curl https://notification-system-xxxx.onrender.com/health
```

> **Note:** Render free tier services spin down after 15 minutes of inactivity.
> The first request after spin-down takes ~30 seconds to cold-start.

---

## Step 4: Deploy Frontends to Vercel

### 4a. Campaign Dashboard (Task 1.1)

1. Go to [https://vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `task-1.1-campaign-dashboard`
4. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://campaign-management-api-xxxx.onrender.com
   ```
5. Click **Deploy**
6. Note the URL: `https://campaign-dashboard-xxxx.vercel.app`

### 4b. Creative Brief Builder (Task 1.2)

1. Vercel → **Add New Project**
2. Import same GitHub repo
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `task-1.2-creative-brief-builder`
4. Environment Variables:
   ```
   AI_SERVICE_URL=https://ai-content-service-xxxx.onrender.com
   ```
5. Click **Deploy**
6. Note the URL: `https://creative-brief-xxxx.vercel.app`

---

## Step 5: Update CORS Origins (Critical!)

Now that you have the Vercel URLs, go back to Render and update `CORS_ORIGIN` on each backend:

### Campaign Management API:
```
CORS_ORIGIN=https://campaign-dashboard-xxxx.vercel.app,https://creative-brief-xxxx.vercel.app
```

### AI Content Service:
```
CORS_ORIGIN=https://creative-brief-xxxx.vercel.app
```

### Notification System:
```
CORS_ORIGIN=https://campaign-dashboard-xxxx.vercel.app
```

Each service will auto-redeploy when you save the environment variables.

---

## Step 6: Final Verification

1. **Campaign Dashboard**: Open `https://campaign-dashboard-xxxx.vercel.app`
   - Should display campaign list with charts
   - Click on a campaign to see details

2. **Creative Brief Builder**: Open `https://creative-brief-xxxx.vercel.app`
   - Fill out a creative brief form
   - Click Generate — should return AI-generated creative direction
   - The PDF export should work

3. **Notification System**: Open `https://notification-system-xxxx.onrender.com/client/index.html`
   - Should show real-time notifications
   - WebSocket connection indicator should be green

---

## Architecture (Deployed)

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│  Vercel                         │     │  Vercel                         │
│  Campaign Dashboard (Next.js)   │     │  Creative Brief Builder         │
│  campaign-dashboard.vercel.app  │     │  creative-brief.vercel.app      │
└──────────┬──────────────────────┘     └──────────┬──────────────────────┘
           │ HTTPS                                 │ HTTPS
           ▼                                       ▼
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│  Render                         │     │  Render                         │
│  Campaign Management API        │     │  AI Content Generation          │
│  Express + SQLite + JWT         │     │  Express + Mock LLM             │
│  + Persistent Disk              │     │                                 │
└──────────┬──────────────────────┘     └─────────────────────────────────┘
           │ Polling
           ▼
┌─────────────────────────────────┐
│  Render                         │
│  Notification System            │
│  Socket.IO + SQLite             │
│  + Persistent Disk              │
└─────────────────────────────────┘
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Dashboard shows no data | Check `NEXT_PUBLIC_API_URL` env var in Vercel. Verify Campaign API health endpoint. |
| CORS errors in browser console | Update `CORS_ORIGIN` on the target backend service in Render. |
| Brief Builder AI generation fails | Check `AI_SERVICE_URL` env var in Vercel. AI service may need to cold-start. |
| Render service sleeping | Free tier spins down after 15 min inactivity. First request takes ~30s. |
| Database errors on Render | Ensure persistent disk is mounted at correct path. Check `DB_PATH` env var. |
| Build fails on Vercel | Ensure Root Directory is set correctly (`task-1.1-*` or `task-1.2-*`). |
