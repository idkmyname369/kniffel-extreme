# Kniffel Royale

Würfelspiel mit 6 Würfeln, Ereigniskarten und Online-Mehrspieler.

- `index.html` – die komplette App
- `firebase-config.js` – Zugangsdaten für den Online-Modus (Firebase)
- `firestore.rules` – Sicherheitsregeln für die Firestore-Datenbank
- `database.rules.json` – Sicherheitsregeln für die Realtime Database (Online-Spiele, Einladungen, Mitteilungen)
- `push-worker.js` – kleiner Cloudflare Worker, der Einladungen als Push-Mitteilung verschickt
