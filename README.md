# aReS Web

Modulo web del framework aReS per server HTTP, routing, integrazione REST, autenticazione e permessi.

## Installazione

```bash
npm install @ares/web
```

Dipendenze opzionali (solo se usi i moduli relativi):

```bash
npm install @ares/files unzipper
```

## Quickstart (minimo)

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

## API stabili (entrypoint)

- `@ares/web/server.js`: bootstrap server Express + `exportRESTRoute()`, `getRoutes()`
- `@ares/web/jwt.js`: `generateJWT()`, `validateJWT()`, `extractToken()`
- `@ares/web/permissions.js`: `getPermission()`, `isResourceAllowed()`
- `@ares/web/http.js`: utilita' HTTP e risposta errori
- `@ares/web/datasources.js`: export datasource -> REST

## appSetup (opzioni principali)

- `name` (obbligatorio, core): nome istanza.
- `environments` (obbligatorio, core): lista ambienti; `type: "production"` + `selected: true` rende `aReS.isProduction === true`.
- `webServerPort` (fallback: `3000`): porta di ascolto.
- `webDatasources` (fallback: `[]`): datasources da caricare all'avvio web.
- `webDatasourcesAutoExport` (fallback: `true` se `webDatasources.length > 0`, altrimenti `false`): auto-export REST dei mapper.
- `permissions` (fallback: `[]`): regole permessi (legacy). Alternativa: `policies.permissions`.
- `jwtSecret` (fallback: nessuno): secret legacy per JWT. Alternativa consigliata: `config.jwt.secret` oppure `JWT_SECRET` env var.
- `cors` (fallback: disabilitato): `true` (default cors), string/array origin, o oggetto opzioni.
- `session` (fallback: abilitata con secret generato): `true|false|object` come opzioni `express-session`.
- `expressJson` / `json` (fallback: abilitato): configurazione parser JSON di Express.
- `overrideResponse` (fallback: `false`): abilita middleware diagnostico che wrappa `res.send/json/setHeader`.
- `pages.index` (fallback: nessuno): se presente, `GET /` fa redirect.

## Documentazione

### English

- [Web Module](./docs/en/web.md)

### Italiano

- [Modulo Web](./docs/it/web.md)
