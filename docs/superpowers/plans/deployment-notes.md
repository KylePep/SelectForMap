<!-- docs/superpowers/plans/deployment-notes.md -->
# Deploying SFM to the EC2 instance

1. SSH into the instance, install Docker + Docker Compose if not already present.
2. Clone the repo, `cd` into it.
3. Copy `backend/.env.example` to `backend/.env`, set `APP_ENV=production`, `APP_DEBUG=false`,
   a real `APP_KEY` (`php artisan key:generate --show` locally, paste the value), production
   DB credentials matching `docker-compose.prod.yml`, and `FRONTEND_URL` to the public domain/IP.
4. Set `frontend/.env` `VITE_API_BASE_URL=/api` (relative, since nginx now serves both under one origin)
   and `VITE_MAPBOX_TOKEN` to the production Mapbox token, before building the image (Vite bakes
   env vars in at build time).
5. Run `docker compose -f docker-compose.prod.yml up -d --build`.
6. Run `docker compose -f docker-compose.prod.yml exec app php artisan migrate --force`.
7. Visit the instance's public IP/domain and confirm the map loads and login works.

## Notes

- `docker-compose.prod.yml` builds `web` from `docker/nginx/Dockerfile.prod`, a multi-stage image
  that builds the Vue frontend with Node and copies the resulting `dist/` into an `nginx:alpine`
  image alongside `docker/nginx/prod.conf`. This avoids relying on a separate build container's
  volume being populated before `docker compose up` starts the `web` container — the frontend
  build output is baked into the `web` image itself at build time.
- `web` reverse-proxies `/api` to the `app` (PHP-FPM) container and serves everything else from the
  built static SPA (`try_files ... /index.html`), matching the spec's single-origin production
  architecture.
- The `db` service in `docker-compose.prod.yml` does not publish a host port (unlike the dev
  compose file's `3307:3306`), since production DB access should go through the app container only.
- Because `docker-compose.yml` (dev) and `docker-compose.prod.yml` live in the same directory and
  share service names (`app`, `web`, `db`), running both from the default project name would clash.
  On the EC2 instance this isn't a concern (only the prod stack runs there), but if verifying the
  prod stack locally alongside an already-running dev stack, use a distinct project name, e.g.
  `docker compose -p sfm-prod -f docker-compose.prod.yml up -d --build`, to avoid Compose trying to
  recreate the dev stack's containers under the prod definitions.
