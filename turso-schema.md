# Registro delle tabelle e modifiche Turso

Questo file tiene traccia delle tabelle create e delle eventuali modifiche (migrazioni) sul database Turso.

---


## Tabelle iniziali

- **users**
  - id INTEGER PRIMARY KEY AUTOINCREMENT
  - uid TEXT UNIQUE
  - name TEXT
  - username TEXT UNIQUE
  - password TEXT

- **elencoprodotti**
  - id INTEGER PRIMARY KEY AUTOINCREMENT
  - uid TEXT (collega il prodotto all’utente)
  - nome TEXT (nome del prodotto)
  - checked INTEGER DEFAULT 0 (0=non fleggato, 1=fleggato)
  - created_at DATETIME (data inserimento)

---


## Modifiche

- [21/02/2026] Creazione tabella `users` per registrazione/login.
- [21/02/2026] Aggiunto campo `uid` per identificazione univoca utente.
- [21/02/2026] Creazione tabella `elencoprodotti` per la lista prodotti.

---

Aggiorna questo file ogni volta che crei o modifichi una tabella su Turso.