# Panoramica CLI — `@ares/web`

## Stato: nessuna CLI

Il modulo `@ares/web` **non espone alcuna interfaccia a riga di comando**:

- Il campo `bin` non è presente in `package.json`.
- Non esistono cartelle `bin/` o file eseguibili dedicati.

Il modulo è unicamente una **libreria importabile** via `import` (ESM).

## Script npm disponibili

L'unico script dichiarato in `package.json` è per i test:

```bash
yarn workspace @ares/web test
```

- `test` — esegue la suite basata su `node --test`: `node --test ./test/*.test.js`.

## Entrypoint programmatici (non CLI)

Pur non essendo una CLI, il modulo espone entrypoint stabili consumabili via import:

- `@ares/web` — barrel export dell'API pubblica.
- `@ares/web/server.js` — `aReSInitialize`, `exportRESTRoute`, `getRoutes`, middleware CORS/sessione/JSON/identità.
- `@ares/web/jwt.js` — `generateJWT`, `validateJWT`, `extractToken`.
- `@ares/web/permissions.js` — `getPermission`, `isResourceAllowed`.
- `@ares/web/http.js`, `@ares/web/datasources.js`, `@ares/web/i18n.js`, `@ares/web/swagger.js`.

Questi non vengono invocati da terminale, ma inclusi nel runtime dell'applicazione (tipicamente via `aReS.include(...)`).
