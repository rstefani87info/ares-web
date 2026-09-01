# @ares/web Documentation

## Purpose

`@ares/web` is the web runtime module of the aReS ecosystem. It wires an Express server into an aReS instance and provides:

- HTTP server bootstrap and middleware setup
- REST route export helpers (datasource mapper -> Express route)
- JWT helpers and request identity normalization
- Permission filtering for request contexts

## Installation

```bash
npm install @ares/web
```

Optional dependencies (install only if you use the related submodules):

```bash
npm install @ares/files unzipper accepts whois
```

## Quickstart

```js
import aReSInitialize from "@ares/core";
import * as webServerModule from "@ares/web/server.js";

const aReS = aReSInitialize({
  name: "my-app",
  environments: [{ selected: true, type: "development" }],
  webServerPort: 3000,
  permissions: [{ hosts: ["*"], userAgents: ["*"], allowedResource: ["*"], methods: ["ALL"] }],
  config: {
    jwt: { secret: process.env.JWT_SECRET },
  },
});

await aReS.include(webServerModule);
```

## Public API (exports)

Stable entrypoints (see package exports):

- `@ares/web/server.js`
  - `aReSInitialize(aReS)` (async): creates `aReS.httpServer` and starts listening
  - `exportRESTRoute(aReS, id, mapper, handler)`
  - `getRoutes(aReS)`
  - `createCorsMiddleware()`, `createSessionMiddleware()`, `createJsonBodyParserMiddleware()`, `createSessionIdentityMiddleware()`
- `@ares/web/jwt.js`: `generateJWT(aReS, userId, sessionId)`, `validateJWT(aReS, req, res)`, `extractToken(req)`
- `@ares/web/permissions.js`: `getPermission(aReS, host, userId, userAgent, method)`, `isResourceAllowed(aReS, id, req, stopMode)`
- `@ares/web/datasources.js`: helpers around datasource -> REST export (and re-exports from `@ares/core/datasources.js`)
- `@ares/web/http.js`: HTTP helpers and error responses

Optional entrypoints (may require optional dependencies):

- `@ares/web/swagger.js`: Swagger/OpenAPI generation and SwaggerHub codegen (`@ares/files`, `unzipper`)
- `@ares/web/i18n.js`: language negotiation (`accepts`)

## appSetup keys (behavior)

Core runtime keys (required by `@ares/core`):

- `name` (required)
- `environments` (required; production is `type: "production"` + `selected: true`)

Web module keys (consumed by `@ares/web/server.js`):

- `webServerPort` (default: `3000`)
- `webDatasources` (default: `[]`)
- `webDatasourcesAutoExport` (default: `true` if `webDatasources.length > 0`, else `false`)
- `permissions` (default: `[]`, legacy; preferred: `policies.permissions`)
- `cors` (default: disabled; `true|string|string[]|object`)
- `session` (default: enabled; `true|false|object` for `express-session`)
- `expressJson` / `json` (default: enabled; `true|false|object` for `express.json`)
- `overrideResponse` (default: `false`; enables response diagnostics wrapper)
- `pages.index` (optional; `GET /` redirects when set)

JWT secret resolution:

- preferred: `config.jwt.secret`
- legacy: `appSetup.jwtSecret`
- fallback: `process.env.JWT_SECRET`

## Testing

Run the module tests:

```bash
yarn workspace @ares/web test
```
