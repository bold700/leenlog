# LeenLog: accounts + database aanzetten (Firebase)

De app draait nu in **demo-modus** (localStorage, geen login) zolang er geen Firebase-config is.
Zodra de stappen hieronder klaar zijn en de app opnieuw gebouwd wordt, schakelt hij automatisch
over naar **accounts + Firestore** (email + Google login, data per gebruiker in de cloud).

## Wat jij doet (eenmalig, ~5 min)

1. Ga naar https://console.firebase.google.com en maak een nieuw project (bijv. `leenlog`).
2. **Authentication** > Get started > tab **Sign-in method**:
   - Zet **Email/Password** aan.
   - Zet **Google** aan.
3. **Authentication** > **Settings** > **Authorized domains**: voeg `bold700.github.io` toe
   (nodig voor Google-login op de live site).
4. **Firestore Database** > Create database > **production mode** > kies een regio (bijv. `europe-west`).
5. **Firestore** > tab **Rules**: plak de inhoud van [`firestore.rules`](./firestore.rules) en publiceer.
6. **Project settings** (tandwiel) > **Your apps** > **Web app** (`</>`) toevoegen.
   Kopieer de `firebaseConfig`-waarden.

## Config doorgeven

Maak in de projectmap een bestand `.env.local` (dit staat in `.gitignore`, komt dus niet op GitHub):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

(De waarden komen 1-op-1 uit `firebaseConfig`. Deze keys zijn niet geheim: ze worden
sowieso naar de browser gestuurd. De beveiliging zit in de Firestore-rules.)

## Daarna

`pnpm build` en de `out/` naar de `gh-pages`-branch pushen. De live site vraagt dan om inloggen
en slaat data per account op in Firestore.
