# FinanceME V1 - Checklist de demo

## 1) Preparation avant demo

- Verifier que le backend a bien ses variables dans `.env`
- Verifier que `mobile/app.json` pointe vers la bonne API dans `expo.extra.apiBaseUrl`
- Lancer les tests backend
- Demarrer le backend
- Demarrer Expo sur le mobile

## 2) Commandes de lancement

### Backend

```powershell
cd c:\Users\chibou\Desktop\FinaceME
npm.cmd install
npm.cmd test
npm.cmd start
```

### Mobile

```powershell
cd c:\Users\chibou\Desktop\FinaceME\mobile
npm.cmd install
npm run start
```

## 3) URL API mobile

Dans `mobile/app.json`, regler `expo.extra.apiBaseUrl` selon le contexte:

- Android Emulator: `http://10.0.2.2:5000/api`
- iOS Simulator: `http://localhost:5000/api`
- Telephone physique: `http://IP_DU_PC:5000/api`

## 4) Parcours de demo conseille

### Ouverture

- Montrer l'ecran de connexion
- Se connecter avec un compte de demo
- Arriver sur le dashboard

### Dashboard

- Montrer le solde net
- Montrer la tresorerie disponible
- Montrer la position nette des dettes
- Montrer les acces rapides

### Transactions

- Ajouter un revenu
- Ajouter une depense
- Revenir sur le dashboard pour montrer la mise a jour

### Budgets

- Montrer un budget actif
- Montrer le suivi des depenses et le detail d'un budget

### Investissements

- Montrer un terrain
- Montrer un placement de type elevage ou commerce
- Montrer les filtres, le tri et le resume portefeuille

### Comptes

- Montrer les comptes actifs
- Ajuster un solde

### Dettes

- Montrer une dette ouverte
- Montrer le suivi de paiement

### Epargne

- Montrer un objectif
- Ajouter une contribution

## 5) Donnees de demo recommandees

- Au moins 2 comptes actifs
- 4 a 6 transactions recentes
- 1 budget actif
- 2 investissements de types differents
- 1 dette ouverte et 1 dette soldee
- 1 objectif d'epargne en cours

## 6) Verification rapide si quelque chose ne marche pas

- Tester `http://localhost:5000/api/health`
- Verifier que le mobile utilise la bonne IP
- Verifier que MongoDB est accessible
- Redemarrer Expo apres changement de `app.json`

## 7) Points a dire pendant la demo

- L'application est adaptee au contexte du Niger et a la devise XOF
- Les modules principaux sont deja connectes entre eux
- Le reset de mot de passe existe en mode securise
- Le suivi investissement couvre terrain, elevage, commerce, depot et autres actifs
- La V1 est orientee gestion pratique, lisible sur mobile et exploitable en demonstration
