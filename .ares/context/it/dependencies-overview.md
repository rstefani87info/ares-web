# Dipendenze aReS — `@ares/web`

## Dipendenze da altri moduli `@ares/*`

### `@ares/core` (dipendenza runtime obbligatoria)

Ragione: il modulo web è progettato per integrare un'istanza aReS creata da `@ares/core`. Ne utilizza l'infrastruttura di console (`asyncConsole` da `@ares/core/console.js`), i datasource (`export datasource -> REST`) e il contratto `aReS.include(...)` / `aReS.appSetup`. La presenza di `@ares/core` come dipendenza è essenziale: senza istanza core non c'è server da avviare.

### `@ares/files` (peer opzionale)

Ragione: richiesto solo dai percorsi opzionali, ad esempio la generazione Swagger/OpenAPI e codegen in `swagger.js`. Non è obbligatorio; si attiva solo se il modulo di files viene installato.

## Dipendenze NPM (non aReS)

- `express` — framework HTTP/servizio Express.
- `express-session` — gestione sessione.
- `jsonwebtoken` — JWT.
- `cors` — middleware CORS.
- (`accepts`, `unzipper`, `whois`) — peer opzionali per i percorsi i18n/swagger.

## Chi dipende da `@ares/web`

`@ares/web` è un modulo di base e viene consumato da numerosi altri moduli/package `@ares/*`:

- `@ares/ai-3rd-party-server` (e `ai/ai-3rd-party-server`)
- `@ares/ecosystem`
- `@ares/project-manager`
- `@ares/dev-test-server`
- `@ares/language-interpreter`
- `@ares/db-client/db-client-api`
- `w3schools-crawler`
- `P4P/api`

Questi moduli usano `@ares/web` per esporre le proprie API/resource via HTTP.
