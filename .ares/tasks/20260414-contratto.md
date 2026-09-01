# Checklist Migliorie aReS Web

- [1] 5. Definire API pubbliche chiare per `aReSInitialize`, `exportRESTRoute`, `validateJWT`, `getRoutes` e `isResourceAllowed`, distinguendo cosa e' supportato da cio' che e' solo dettaglio interno.
- [2] 6. Evitare dipendenze da struttura applicativa esterna, come l'import diretto di `../../../app.js` in `jwt.js`; una libreria framework dovrebbe ricevere secret e strategy via configurazione o dependency injection.
- [3] 7. Rivedere gli accessi a campi interni di Express come `aReS.httpServer._router.stack`, perche' non sono un contratto stabile e possono rompersi con upgrade futuri.
- [4] 8. Evitare override invasivi di `res.send`, `res.json` e `res.setHeader` come default di libreria; se servono, esporli come hook o middleware opzionale.
- [5] 6. Definire la superficie pubblica del pacchetto: entrypoint, moduli esportati e API supportate.
- [6] 7. Formalizzare il contratto di `aReSInitialize`, `exportRESTRoute`, `validateJWT`, `getRoutes` e `isResourceAllowed`.
- [7] 8. Ridurre o incapsulare gli accessi a dettagli interni di Express come `_router.stack`.
- [8] 9. Trasformare gli override di response e i comportamenti diagnostici in hook o middleware opzionali.

