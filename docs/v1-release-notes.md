# FinanceME V1 - Notes de livraison

## Perimetre couvre

- Authentification: inscription, connexion, reset de mot de passe securise
- Dashboard: vue rapide avec tresorerie, dettes et activite recente
- Transactions: creation, modification, suppression, filtrage
- Budgets: creation, ajustement, detail, suivi de depense
- Investissements: suivi adapte au Niger, statuts, rendement, echeance, sortie, filtres et tri
- Comptes: creation, ajustement, archivage, suppression, resume
- Dettes: creation, paiements, resume, alertes d'urgence
- Epargne: objectifs, contributions, filtres et progression

## Niveau de stabilite

- Tests backend passes: `77/77`
- Configuration mobile API externalisee dans `mobile/app.json`
- Design mobile harmonise sur les ecrans principaux

## Prerequis de mise en route

- MongoDB accessible
- Variables backend renseignees dans `.env`
- URL API mobile ajustee dans `mobile/app.json`
- Dependances backend et mobile installees

## Limites connues de la V1

- Pas encore de build APK/IPA automatise ici
- Pas encore de systeme complet de seed/demo data
- Certaines validations et scenarios UI restent a verifier sur appareil reel avant diffusion large

## Recommandation de livraison

- Utiliser cette V1 pour demo, validation produit et premiers retours terrain
- Prevoir ensuite une V1.1 pour seed de demo, packaging mobile et derniers raffinements UX
