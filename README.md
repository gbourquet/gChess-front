# gChess Frontend

Angular 21 web chess client for the gChess platform.

## Prerequisites

- Node.js + npm

## Backend configuration

The app uses Angular environments to configure backend URLs:

| Environment | File | API | WebSocket |
|-------------|------|-----|-----------|
| Development | `src/environments/environment.development.ts` | `http://localhost:8080` | `ws://localhost:8080` |
| Production | `src/environments/environment.ts` | your domain over `https` | your domain over `wss` |

**Forking?** The production URLs are compiled into the bundle, so set your own
domain in `src/environments/environment.ts` before building.

In production the front and the API are served by the same nginx, so both share
a single origin — no CORS preflight, and WebSockets need no extra config.

Deployment is automated: any push to `master` runs the tests, builds the image,
publishes it to GHCR and restarts the container over SSH (see
`.github/workflows/deploy.yml`). The stack itself — compose file, nginx config,
TLS — lives in the backend repository under `deploy/`, whose README documents
the full server setup.

## Development server

Against the **local backend** (default):

```bash
npm install
npm start
```

Against the **production backend**:

```bash
npm run build -- --configuration production
```

Or to serve locally while pointing to production:

```bash
npx ng serve --configuration production
```

Open your browser at `http://localhost:4200/`. The application reloads automatically on file changes.

## Building

```bash
# Production build (targets production backend)
npm run build

# Development build (targets local backend)
npm run build -- --configuration development
```

Artifacts are output to the `dist/` directory.

## Running unit tests

```bash
npm test
```

## Code scaffolding

Angular CLI is available via npx:

```bash
npx ng generate component component-name
npx ng generate --help
```
