# Checklist Migliorie aReS Web

- [1] 15. Allineare `package.json` all'uso reale della libreria: l'entrypoint dichiarato deve esistere e rappresentare la superficie pubblica del pacchetto.
- [2] 16. Dichiarare in `dependencies` o `peerDependencies` tutti i moduli realmente necessari a runtime, distinguendo quelli opzionali o usati solo da feature secondarie.
- [3] 17. Valutare se moduli come Swagger code generation, `whois` o utilita' non core debbano stare in entrypoint separati, per non appesantire il pacchetto base.
- [4] 18. Verificare gli import tra pacchetti monorepo, come `@ares/web/http.js`, per assicurare che funzionino sia in workspace sia dopo publish.
- [5] 14. Allineare `package.json` all'entrypoint reale della libreria.
- [6] 15. Separare `dependencies`, `peerDependencies` e moduli opzionali in base al loro uso effettivo.
- [7] 16. Valutare entrypoint secondari per feature non core come Swagger code generation.
- [8] 17. Verificare che gli import monorepo funzionino anche dopo publish del pacchetto.

