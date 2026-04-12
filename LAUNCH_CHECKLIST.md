# Club Leadly — Launch Checklist (Web App)

## Backend (Render)

- [ ] Push repo to GitHub
- [ ] Create Render account and connect GitHub repo
- [ ] Use **render.yaml** Blueprint or manually create a Web Service
  - Runtime: Docker · Dockerfile path: `./backend/Dockerfile` · Context: `./backend`
- [ ] Set environment variables on Render:
  - `DATABASE_URL` — Supabase connection string (`postgresql+asyncpg://…`)
  - `JWT_SECRET` — long random string (Render can auto-generate)
  - `JWT_EXPIRE_MINUTES` — `10080` (7 days)
  - `FRONTEND_ORIGIN` — deployed web app URL (e.g. `https://clubleadly.vercel.app`)
- [ ] Deploy and verify `https://<service>.onrender.com/health` returns `{"status":"ok","db":"connected"}`
- [ ] Set up UptimeRobot (free) or Render health-check alerts on `/health`

## Frontend / PWA (Vercel, Netlify, or Render Static)

- [ ] Build the web bundle:
  ```bash
  cd mobile
  EXPO_PUBLIC_API_URL=https://<your-render-service>.onrender.com npx expo export --platform web
  ```
- [ ] The `dist/` folder is the deployable artifact
- [ ] Deploy to a static host:
  - **Vercel**: `npx vercel --prod` from `mobile/` (set output dir to `dist`)
  - **Netlify**: drag-and-drop `dist/` or connect repo
  - **Render Static Site**: set build command and publish dir
- [ ] Add a `_redirects` or rewrite rule for SPA routing:
  - Netlify: `mobile/dist/_redirects` → `/* /index.html 200`
  - Vercel: `mobile/vercel.json` → `{"rewrites":[{"source":"/(.*)", "destination":"/index.html"}]}`
- [ ] Verify the deployed URL loads and login works
- [ ] Update `FRONTEND_ORIGIN` on Render to match the deployed URL

## PWA / Mobile

- [ ] Open the deployed URL on iOS Safari → tap Share → "Add to Home Screen"
- [ ] Open the deployed URL on Android Chrome → banner or Menu → "Install app"
- [ ] Verify app opens in standalone mode (no browser chrome)

## Final Checks

- [ ] Create a club, invite a member, assign a task, complete it, verify leaderboard
- [ ] Confirm CORS works (no errors in browser console)
- [ ] Confirm all API calls use HTTPS in production
- [ ] Review Render service logs for any errors
