# Documentazione @ares/web

## Scopo

`@ares/web` è il modulo web dell'ecosistema aReS. Collega un server Express a un'istanza aReS e mette a disposizione:

- bootstrap HTTP e setup middleware
- helper per export di route REST (mapper datasource -> route Express)
- helper JWT e normalizzazione identità request
- filtro permessi sul contesto della richiesta

## Installazione

```bash
npm install @ares/web
```

Dipendenze opzionali (installale solo se usi i moduli relativi):

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

## API pubbliche (exports)

Entrypoint stabili (vedi `exports` del package):

- `@ares/web/server.js`
  - `aReSInitialize(aReS)` (async): crea `aReS.httpServer` e avvia `listen`
  - `exportRESTRoute(aReS, id, mapper, handler)`
  - `getRoutes(aReS)`
  - `createCorsMiddleware()`, `createSessionMiddleware()`, `createJsonBodyParserMiddleware()`, `createSessionIdentityMiddleware()`
- `@ares/web/jwt.js`: `generateJWT(aReS, userId, sessionId)`, `validateJWT(aReS, req, res)`, `extractToken(req)`
- `@ares/web/permissions.js`: `getPermission(aReS, host, userId, userAgent, method)`, `isResourceAllowed(aReS, id, req, stopMode)`
- `@ares/web/datasources.js`: helper per export datasource -> REST (e re-export da `@ares/core/datasources.js`)
- `@ares/web/http.js`: utilita' HTTP e risposte di errore

Entrypoint opzionali (possono richiedere dipendenze opzionali):

- `@ares/web/swagger.js`: generazione Swagger/OpenAPI e codegen SwaggerHub (`@ares/files`, `unzipper`)
- `@ares/web/i18n.js`: negoziazione lingua (`accepts`)

## appSetup (chiavi e comportamento)

Chiavi core (obbligatorie per `@ares/core`):

- `name` (obbligatorio)
- `environments` (obbligatorio; production = `type: "production"` + `selected: true`)

Chiavi del modulo web (consumate da `@ares/web/server.js`):

- `webServerPort` (default: `3000`)
- `webDatasources` (default: `[]`)
- `webDatasourcesAutoExport` (default: `true` se `webDatasources.length > 0`, altrimenti `false`)
- `permissions` (default: `[]`, legacy; preferibile: `policies.permissions`)
- `cors` (default: disabilitato; `true|string|string[]|object`)
- `session` (default: abilitata; `true|false|object` per `express-session`)
- `expressJson` / `json` (default: abilitato; `true|false|object` per `express.json`)
- `overrideResponse` (default: `false`; abilita wrapper diagnostico di `res`)
- `pages.index` (opzionale; se presente `GET /` fa redirect)

Risoluzione secret JWT:

- preferibile: `config.jwt.secret`
- legacy: `appSetup.jwtSecret`
- fallback: `process.env.JWT_SECRET`

## Test

Esecuzione test del modulo:

```bash
yarn workspace @ares/web test
```
