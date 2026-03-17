# FinanceME - Preparation APK

## Etat actuel

- Le backend est stable
- Les tests backend passent
- Le mobile Expo est configure pour une URL API externe dans `mobile/app.json`
- Le projet mobile est prepare pour EAS avec `mobile/eas.json`

## Configuration Android ajoutee

Dans `mobile/app.json`:

- `scheme`: `finaceme`
- `android.package`: `com.finaceme.mobile`
- `android.versionCode`: `1`

## Methode recommandee pour sortir un APK

La voie la plus simple est EAS Build.

Depuis `mobile`:

```powershell
npm.cmd install
npm.cmd install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

Le profil `preview` est configure pour produire un `apk`.

## Si tu veux tester sur un autre appareil

Avant le build, verifie `expo.extra.apiBaseUrl` dans `mobile/app.json`.

- Telephone physique sur le meme Wi-Fi: `http://IP_DU_PC:5000/api`
- Si le backend change de machine, adapte cette URL avant de construire

## Limite de l'environnement actuel

Dans l'environnement de travail actuel:

- `eas` n'est pas installe
- `adb` n'est pas installe
- `gradle` n'est pas installe
- aucun dossier natif `android/` n'est present

Donc le projet est maintenant prepare pour generer un APK, mais la construction effective devra se faire dans un environnement avec EAS ou une toolchain Android complete.
