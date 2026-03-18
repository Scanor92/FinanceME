# Architecture FinanceME

## Structure cible

```text
FinanceME/
├── docs/
│   ├── api/
│   │   └── requests.http
│   └── ...
├── mobile/
│   ├── assets/
│   │   └── images/
│   │       └── logo.png
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── context/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── theme/
│   │   └── utils/
│   ├── app.config.js
│   ├── App.js
│   ├── app.json
│   └── eas.json
├── scripts/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── test/
├── .env.example
├── package.json
└── render.yaml
```

## Regles simples

- La racine contient uniquement le backend, la config globale et la documentation.
- Les assets mobiles vivent dans `mobile/assets`, pas dans `mobile/public`.
- Les fichiers de requetes et d'aide API vivent dans `docs/api`.
- Le bruit technique local (`node_modules`, `.expo`, `build`) doit etre masque dans l'explorateur.
