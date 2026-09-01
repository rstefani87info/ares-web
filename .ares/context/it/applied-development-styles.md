# Stili di sviluppo applicati — `@ares/web`

## Standard di programmazione

- JavaScript ESM (`"type": "module"`); package `main: index.js` con `exports` espliciti per ogni entrypoint stabile.
- Moduli "flat" nella root del package; nessuna cartella `src/` separata.
- Configurazione guidata dalle chiavi `appSetup` (lette dalla funzione di inizializzazione del server).
- Documentazione di modulo in `README.md` e in `.ares/docs/{it,en}/`.
- Package context in `.ares/context/` (vedi `.ares/context/README.md`).
- Test con `node --test` (script `test`: `node --test ./test/*.test.js`).

## Albero del repository

```text
web/
├── index.js            # barrel export dell'API pubblica
├── server.js           # bootstrap Express + exportRESTRoute/getRoutes + middleware
├── jwt.js              # JWT: generate/validate/extract
├── permissions.js      # getPermission/isResourceAllowed
├── http.js             # utility HTTP e risposte di errore
├── datasources.js      # export datasource -> REST
├── i18n.js             # negoziazione lingua
├── swagger.js          # generazione Swagger/OpenAPI
├── package.json        # manifest, scripts, exports
├── README.md           # documentazione utente
├── LICENSE             # MIT
├── .gitignore          # regole di esclusione
├── .ares/
│   ├── context/        # documenti di contesto (questo file)
│   └── docs/
│       ├── it/
│       └── en/
└── test/               # suite (smoke.test.js, swagger.test.js)
```

## Generato automaticamente vs scritto a mano

### GENERATO / NON versionabile (non riscrivere a mano)

- `.git/` — metadati Git, generati e ricreabili.
- `node_modules/` — dipendenze installate da Yarn.
- (non presente in questo modulo: `dist/`, `build/`, `.cache/`, `current-schemas.json`).

### MANUALE / autoriale (da NON rigenerare né sovrascrivere)

- `index.js`, `server.js`, `jwt.js`, `permissions.js`, `http.js`, `datasources.js`, `i18n.js`, `swagger.js` — codice sorgente scritto a mano.
- `package.json`, `README.md`, `LICENSE`, `.gitignore` — configurazione e documentazione autoriale.
- `.ares/docs/` e `.ares/context/` — documentazione redatta manualmente (in lingua `it`/`en`).

> Vincolo: i file in `.ares/context/` (inclusi quelli in `it/`) sono documenti scritti a mano; non devono essere rigenerati o sovrascritti da strumenti automatici.
