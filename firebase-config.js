// Firebase-Zugangsdaten für den Online-Modus (öffentlich, geschützt durch firestore.rules)
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDwg3DW-tiaodidYrZaAl5R2Ns2OMLw4KI",
  authDomain: "kn1ffel-extreme.firebaseapp.com",
  projectId: "kn1ffel-extreme",
  storageBucket: "kn1ffel-extreme.firebasestorage.app",
  messagingSenderId: "529517204282",
  appId: "1:529517204282:web:dd5f52f58e85910cc3f603",
  databaseURL: "https://kn1ffel-extreme-default-rtdb.europe-west1.firebasedatabase.app"
};

// Adresse des Push-Dienstes (Cloudflare Worker) für Einladungen als Mitteilung
window.PUSH_URL = 'https://kn1ffel-push.joshbeatzz.workers.dev';

// Anmeldung mit Apple (braucht ein kostenpflichtiges Apple-Entwicklerkonto). Auf true setzen, sobald eingerichtet.
window.APPLE_SIGNIN = false;

// OAuth-Client-ID für „Mit Google anmelden“ (Weiterleitung statt Popup, nötig für die Home-Bildschirm-App)
window.GOOGLE_CLIENT_ID = '529517204282-js9ri766m6fks9uer62ado9tjoho7j0b.apps.googleusercontent.com';
