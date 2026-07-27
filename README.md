# gChess Frontend

Angular 21 web chess client for the gChess platform.

## Prerequisites

- Node.js + npm

## Backend configuration

The app uses Angular environments to configure backend URLs:

| Environment | API | WebSocket |
|-------------|-----|-----------|
| Development | `http://localhost:8080` | `ws://localhost:8080` |
| Production | `https://gchess.sur-le-web.fr` | `wss://gchess.sur-le-web.fr` |

In production the front and the API are served by the same nginx, so both
share a single origin. Deployment is automated: any push to `master` builds
the image, publishes it to GHCR and restarts the container on the server
(see `.github/workflows/deploy.yml`). The stack itself — compose file, nginx
config, TLS — lives in the backend repository under `deploy/`.

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
