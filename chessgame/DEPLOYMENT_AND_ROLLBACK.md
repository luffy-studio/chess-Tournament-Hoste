# Production Deployment & Rollback Strategy

## 1. Overview & Architecture

The Royal Chess Championship platform is engineered as a hybrid standalone, local LAN, and cloud-ready platform.

```
                  ┌───────────────────────────────┐
                  │    Load Balancer / Ingress    │
                  │   (Nginx / Cloudflare / Traefik)
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        Traffic Switch (Blue/Green)     Health Probe Verification
                 │                               │
                 ▼                               ▼
       ┌──────────────────┐            ┌──────────────────┐
       │   BLUE (Live)    │            │  GREEN (Staging) │
       │  Port 5000 / v1  │            │  Port 5001 / v2  │
       └──────────────────┘            └──────────────────┘
```

---

## 2. Blue-Green Deployment Strategy

When deploying updates to cloud or multi-server venues, use Blue-Green deployment to ensure zero downtime and risk-free releases:

1. **Deploy Green Version**:
   - Spin up the new build on the alternate port/target (e.g., port 5001).
   - Green version initializes, runs database schema synchronization, and connects to the database.
2. **Automated Health Probe**:
   - Query `/api/health` and `/api/health/ready` on the Green target:
     ```bash
     node scripts/healthCheck.js
     ```
   - Ensure the database connectivity latency is $< 100$ms and response status is `200 OK`.
3. **Switch Traffic**:
   - Once Green passes health checks, switch the load balancer / reverse proxy upstream target from Blue (port 5000) to Green (port 5001).
   - Existing active WebSocket sessions receive a clean disconnect event and auto-reconnect to the new instance within 1 second.
4. **Decommission or Standby Blue**:
   - Keep Blue running in idle standby for 15 minutes to facilitate instantaneous 1-second rollback if critical anomalies occur.

---

## 3. Rollback Runbook (Under 30 Seconds)

If any critical regression, latency spike, or unexpected exception occurs post-deployment:

### Step 1: Immediate Reverse Proxy Traffic Switch
Revert reverse proxy upstream back to the Blue container/target:
```bash
# Example for Nginx
sed -i 's/localhost:5001/localhost:5000/g' /etc/nginx/conf.d/chess.conf
nginx -s reload
```

### Step 2: Database Rollback Compatibility
* All Prisma migrations are designed to be **backward-compatible** (additive columns, nullable fields, non-destructive indexes).
* Existing data is never deleted during deployment or rollback.
* In SQLite/PostgreSQL, previous database snapshots (`.db` backup files or PostgreSQL point-in-time snapshots) can be restored immediately:
  ```bash
  # SQLite disaster restore
  cp backend/prisma/dev.db.bak backend/prisma/dev.db
  ```

---

## 4. Containerized Production Deployment

### Using Docker & Docker Compose:
```bash
# Build and launch production container in detached mode
docker compose up --build -d

# Check live health status
docker compose ps

# View real-time structured logs
docker compose logs -f chess-app
```

---

## 5. Environment Variables Reference

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Enables production security controls, masks stack traces |
| `PORT` | `5000` | HTTP / WebSocket server port |
| `JWT_SECRET` | *(required in prod)* | 256-bit cryptographically secure secret for signing JWTs |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated allowlist of trusted browser domains |
| `ALLOW_LAN_CORS` | `true` | Permits private network RFC-1918 addresses in venue LAN mode |
| `DATABASE_URL` | `file:./dev.db` | SQLite database file path or PostgreSQL connection string |
