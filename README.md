# gChess Frontend

Angular 21 web chess client for the gChess platform.

## Prerequisites

- Node.js + npm

## Backend configuration

The app uses Angular environments to configure backend URLs:

| Environment | API | WebSocket |
|-------------|-----|-----------|
| Development | `http://localhost:8080` | `ws://localhost:8080` |
| Production | `https://shimmering-spirit-production.up.railway.app` | `wss://shimmering-spirit-production.up.railway.app` |

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
