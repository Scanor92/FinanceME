# FinanceME - Mise en ligne publique

## Objectif

Permettre a des utilisateurs externes de:

- creer un compte
- se connecter
- utiliser l'application depuis un APK installe sur leur appareil

## Ce qui est indispensable

### 1) Backend public

L'APK ne doit plus pointer vers une IP locale du type `192.168.x.x`.

Il faut deployer l'API Node.js sur une URL publique HTTPS, par exemple:

- `https://finaceme-api.onrender.com`

Le projet est prepare avec [render.yaml](/c:/Users/chibou/Desktop/FinaceME/render.yaml) pour un deploiement simple sur Render.

### 2) Base de donnees accessible

MongoDB Atlas convient deja tres bien pour cette etape, a condition:

- d'autoriser l'acces reseau depuis le service d'hebergement
- d'utiliser la bonne `MONGODB_URI`

### 3) Variables backend

A renseigner sur l'hebergeur:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ALLOWED_ORIGINS`
- `PASSWORD_RESET_URL_BASE`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`

Pour la prod, ne pas laisser `PASSWORD_RESET_DEBUG=true`.

## Deploiement backend sur Render

### Methode simple

1. pousser le repo sur GitHub
2. creer un compte Render
3. connecter le repo GitHub
4. laisser Render detecter [render.yaml](/c:/Users/chibou/Desktop/FinaceME/render.yaml)
5. renseigner les variables d'environnement
6. deployer

Une fois deploye, tester:

- `https://TON_URL/api/health`

Exemple de `CORS_ALLOWED_ORIGINS`:

- `https://ton-front.com,https://ton-site.com`

Pour l'application mobile Android/iPhone, les requetes API natives n'envoient pas forcement un header `Origin`, donc elles restent compatibles. Cette variable sert surtout a limiter les acces web.

## Brancher le mobile sur l'API publique

Le mobile est maintenant prepare pour lire une URL API depuis une variable Expo:

- `EXPO_PUBLIC_API_BASE_URL`

Tu peux aussi garder la valeur par defaut dans [app.json](/c:/Users/chibou/Desktop/FinaceME/mobile/app.json), mais pour la mise en ligne le mieux est de construire avec:

```powershell
set EXPO_PUBLIC_API_BASE_URL=https://TON_URL/api
eas.cmd build --platform android --profile preview
```

Le fichier [app.config.js](/c:/Users/chibou/Desktop/FinaceME/mobile/app.config.js) injecte cette valeur dans la config Expo au moment du build.

## Distribution

### Test externe

- generer un APK
- partager le fichier APK
- installer sur Android

### Diffusion plus large

Pour de vrais utilisateurs externes, la suite logique est:

- Android: Google Play Console
- iPhone: App Store Connect

## Risques a garder en tete

- si l'API reste sur une IP locale, les utilisateurs externes ne pourront jamais se connecter
- si MongoDB Atlas n'autorise pas correctement l'acces reseau, le backend echouera au demarrage
- si l'APK a ete construit avec la mauvaise URL API, login et inscription echoueront meme si le backend est en ligne
