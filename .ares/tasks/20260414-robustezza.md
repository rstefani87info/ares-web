# Checklist Migliorie aReS Web

- [1] 19. Correggere `isProduction()` in `server.js`, che oggi ha una logica fragile e puo' restituire risultati errati.
- [2] 20. Correggere `normalizeMethodsArray()` in `http.js`, eliminando i riferimenti errati a `int` e la gestione non affidabile dei numeri.
- [3] 21. Rivedere `getPermission()` per usare condizioni booleane corrette, regex sicure e naming coerente tra allow-list e deny-list.
- [4] 22. Verificare che gli header custom come `X-aReS-Metadata` non eccedano dimensioni ragionevoli e che il payload resti stabile per i consumer.

