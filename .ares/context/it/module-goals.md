# Obiettivi del modulo `@ares/web`

## Introduzione

`@ares/web` è il **modulo web** del framework aReS. Collega un'istanza aReS (creata da `@ares/core`) a un server HTTP Express, fornendo bootstrap del server, routing REST, autenticazione JWT, filtro dei permessi, negoziazione lingua e (opzionalmente) generazione Swagger/OpenAPI.

Il modulo è scritto in ESM (`"type": "module"`) e non espone alcun binario eseguibile: è una libreria di integrazione consumata via `import`.

## Scopo principale

- Avviare e gestire un server HTTP Express a partire dalla configurazione di un'istanza aReS.
- Esportare i datasource aReS come route REST (`exportRESTRoute`, `getRoutes`).
- Autenticare le richieste tramite JWT e normalizzare l'identità nelle request.
- Applicare il filtro dei permessi sul contesto della richiesta (host, risorsa, metodo).

## Obiettivi

- Fornire API stabili e ben definite (`@ares/web/server.js`, `jwt.js`, `permissions.js`, `http.js`, `datasources.js`).
- Integrarsi in modo pulito con `@ares/core` tramite `aReS.include(webServerModule)`.
- Configurare il server attraverso le chiavi `webServerPort`, `webDatasources`, `cors`, `session`, `permissions`, ecc. in `appSetup`.
- Gestire opzioni legacy (es. `jwtSecret`, `pages.index`) evolvendo verso `config.jwt.secret` e `policies.permissions`.

## Responsabilità

- Bootstrap del server Express e avvio del `listen`.
- Creazione dei middleware: CORS, sessione (`express-session`), parser JSON, identità di sessione, diagnostica della risposta (`overrideResponse`).
- Generazione e validazione JWT (`generateJWT`, `validateJWT`, `extractToken`).
- Controllo permessi (`getPermission`, `isResourceAllowed`).
- Utility HTTP e normalizzazione delle risposte di errore (`http.js`).
- (Opzionale) Generazione Swagger/OpenAPI e codegen (`swagger.js`) e negoziazione lingua (`i18n.js`).

## Cosa il modulo NON fa

- Non contiene un'applicazione web pronta all'uso: è solo infrastruttura di integrazione.
- Non gestisce WebSocket (compito di `@ares/web-socket`).
- Non fornisce componenti UI (compito di `@ares/web-ui`) né crawler (compito di `@ares/web-crawler`).
- Non espone un'interfaccia a riga di comando (CLI): non è presente il campo `bin` nel `package.json`.
