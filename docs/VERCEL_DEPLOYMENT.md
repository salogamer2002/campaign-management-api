# Vercel Deployment Guide

This guide explains how to deploy the 5-service Advertising Campaign Ecosystem using Vercel for the frontends, without changing your original code architecture.

Because the system relies on persistent data systems (`better-sqlite3` and `Socket.IO`) which are **not supported on Vercel's Serverless environment**, you must host the backends on a persistent platform (like Render), while hosting the highly-optimized frontends (Next.js) on Vercel.

## 1. Deploy the Backends to Render.com
*Render provides a free tier with persistent disk access suitable for SQLite.*

1. Push your exact code to GitHub as-is.
2. Sign up/Log in to [Render.com](https://render.com).
3. Click **New** -> **Web Service**.
4. Connect your GitHub Repository.
5. Create a Web Service for each backend:
   - **Campaign API**: Root folder `.` (Build: `npm install`, Start: `npm start`)
   - **AI Content**: Root folder `task-2.2-ai-content-service`
   - **Notification**: Root folder `task-2.3-notification-system`
6. Take note of the live URLs (e.g. `https://campaign-api-xxxx.onrender.com`).

## 2. Deploy Frontends to Vercel
1. Sign up/Log in to [Vercel](https://vercel.com).
2. Click **Add New Project** and import your GitHub Repo.
3. **Deploy Campaign Dashboard**:
   - Set the Framework Preset to **Next.js**.
   - Set the Root Directory to `task-1.1-campaign-dashboard`.
   - Before hitting deploy, open the **Environment Variables** section and add:
     - `NEXT_PUBLIC_API_URL` = `https://campaign-api-xxx.onrender.com` (Your Render URL from step 1)
   - Click **Deploy**.
4. **Deploy Creative Brief Builder**:
   - Create a new project, select `task-1.2-creative-brief-builder` as root.
   - Expand Environment Variables and add:
     - `AI_SERVICE_URL` = `https://ai-content-xxx.onrender.com` (Your Render AI Service URL)
   - Click **Deploy**.

## 3. Allow CORS
Once you have the final Vercel URLs (e.g., `https://campaign-dashboard-xxx.vercel.app`):
- Go back to Render.
- Open the Environment Variables for the backend services.
- Add/Update the variable `CORS_ORIGIN` to match your Vercel URL.
- Render will automatically restart the service, and your Vercel apps will now be successfully talking to your backends.
