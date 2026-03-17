# FinaceME Mobile (React Native + Expo)

## 1) Installer

```powershell
cd mobile
npm.cmd install
```

## 2) Configurer l'URL API dans `app.json`

Modifie `expo.extra.apiBaseUrl` dans `app.json` selon ton environnement:

- Android Emulator: `http://10.0.2.2:5000/api`
- iOS Simulator: `http://localhost:5000/api`
- Telephone physique: `http://<IP_LOCALE_PC>:5000/api`

## 3) Lancer

```powershell
npm run start
```

Puis ouvre avec Expo Go (QR code) ou un simulateur.

## Fonctionnalites incluses

- Auth: login, register, reset password
- Navigation auth / app
- Dashboard, transactions, budgets, comptes, dettes, epargne, investissements
- Stockage du token utilisateur
