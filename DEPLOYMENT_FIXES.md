# Deployment Fixes for Intermittent Access Issues

## Problem
The website at https://tfffoods.com/ was intermittently accessible due to:
1. MongoDB connection pool exhaustion
2. No health checks or auto-restart configured
3. Insufficient timeout settings
4. No resource limits causing potential OOM crashes

## Changes Made

### 1. Docker Compose (`docker-compose.yml`)
- ✅ Added `restart: unless-stopped` for automatic container restart
- ✅ Added health check monitoring the `/api/health` endpoint
- ✅ Added resource limits (2GB memory max, 2 CPUs max)
- ✅ Added resource reservations (512MB memory, 0.5 CPU minimum)

### 2. Health Check API (`app/api/health/route.ts`)
- ✅ Created new endpoint at `/api/health`
- ✅ Checks MongoDB connection status
- ✅ Returns 200 OK when healthy, 503 when unhealthy
- ✅ Includes uptime and database status in response

### 3. Database Connection (`utils/database.ts`)
- ✅ Increased `maxPoolSize` from 10 to 50 connections
- ✅ Added `minPoolSize: 5` to keep minimum connections alive
- ✅ Increased `serverSelectionTimeoutMS` from 5s to 10s
- ✅ Added `connectTimeoutMS: 10000` (10 seconds)
- ✅ Added `retryWrites: true` and `retryReads: true`
- ✅ Added `maxIdleTimeMS: 60000` to close idle connections

### 4. Nginx Configuration (`nginx.conf`)
- ✅ Increased proxy timeouts from 60s to 120s
- ✅ Added dedicated `/api/health` location with shorter timeouts
- ✅ Disabled access logs for health check endpoint

## Deployment Steps

### On Your Production Server:

1. **Pull the latest changes:**
   ```bash
   git pull origin main
   ```

2. **Rebuild the Docker image:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   ```

3. **Start the container:**
   ```bash
   docker-compose up -d
   ```

4. **Verify health check:**
   ```bash
   # Check container health status
   docker ps
   
   # Test health endpoint
   curl http://localhost:3000/api/health
   ```

5. **Reload Nginx:**
   ```bash
   sudo nginx -t  # Test configuration
   sudo systemctl reload nginx
   ```

6. **Monitor logs:**
   ```bash
   # Watch container logs
   docker-compose logs -f app
   
   # Watch nginx logs
   sudo tail -f /var/log/nginx/error.log
   ```

## Monitoring

### Check Container Health:
```bash
docker inspect --format='{{.State.Health.Status}}' tfffoods_app_1
```

### Check Health Endpoint:
```bash
curl https://tfffoods.com/api/health
```

Expected response when healthy:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-18T...",
  "database": "connected",
  "uptime": 12345.67
}
```

### Monitor Resource Usage:
```bash
docker stats
```

## Additional Recommendations

### 1. Set Up Monitoring (Optional but Recommended)
Consider using:
- **Uptime monitoring**: UptimeRobot, Pingdom, or StatusCake
- **Application monitoring**: New Relic, DataDog, or PM2
- **Log aggregation**: LogTail, Papertrail, or ELK Stack

### 2. MongoDB Atlas Monitoring
If using MongoDB Atlas:
- Check connection metrics in Atlas dashboard
- Enable alerts for connection pool exhaustion
- Monitor query performance

### 3. Add Logging for Better Debugging
The health check and database improvements will log issues. Monitor with:
```bash
docker-compose logs -f app | grep -i "error\|health\|mongodb"
```

### 4. Consider Load Balancing (Future)
For high availability:
- Run multiple containers behind a load balancer
- Use Docker Swarm or Kubernetes
- Implement horizontal scaling

## Rollback Plan

If issues occur after deployment:
```bash
git checkout <previous-commit-hash>
docker-compose down
docker-compose build --no-cache
docker-compose up -d
sudo systemctl reload nginx
```

## Testing Checklist

- [ ] Health endpoint responds at `/api/health`
- [ ] Docker container shows "healthy" status after 40 seconds
- [ ] Website accessible from multiple locations
- [ ] No 502/503 errors in nginx logs
- [ ] MongoDB connection stable in docker logs
- [ ] Container restarts automatically if health check fails

## Troubleshooting: 502 Bad Gateway

A 502 means nginx is up but cannot reach the app. The app itself is usually fine —
verify before touching Docker:

```bash
docker ps                                 # container should be "Up (healthy)"
curl http://127.0.0.1:3001/api/health     # should return {"status":"healthy",...}
```

If the health check above returns 200, **the app is fine and the problem is nginx**.

### Cause #1 — nginx points at the wrong port (most common)

Docker publishes the app on host port **3001** (see `ports: "3001:3000"` in
`docker-compose.yml`): host `3001` -> container `3000`. nginx runs on the host, so
its `proxy_pass` MUST target the host port `3001`, not `3000`.

```bash
sudo grep -rl "localhost:3000" /etc/nginx/          # find stale configs
# fix every proxy_pass in the active site file:
sudo sed -i 's|http://localhost:3000|http://127.0.0.1:3001|g' /etc/nginx/sites-available/cpffonline
sudo nginx -t && sudo systemctl reload nginx
```

### Cause #2 — duplicate site configs ("conflicting server name")

If `nginx -t` warns `conflicting server name "cpffonline.com" ... ignored`, two files
define the same domain and nginx silently uses only one. Editing the ignored file
looks like a no-op. Keep ONE file enabled:

```bash
ls -l /etc/nginx/sites-enabled/                      # see what's enabled
sudo rm /etc/nginx/sites-enabled/cpffonline.com      # remove the duplicate (keep `cpffonline`)
sudo nginx -t && sudo systemctl reload nginx         # should now be warning-free
```

> The canonical host nginx config lives in this repo at `nginx.conf` (already uses
> `127.0.0.1:3001`). Keep the server's `/etc/nginx/sites-available/cpffonline` in sync
> with it, and keep only that single file enabled.

## Support

If issues persist:
1. Check MongoDB Atlas connection limits
2. Verify environment variables are set correctly
3. Check server resources: `htop`, `free -h`, `df -h`
4. Review nginx error logs: `/var/log/nginx/error.log`
5. Review application logs: `docker-compose logs app`

