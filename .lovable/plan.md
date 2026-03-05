

## Diagnostic et plan de correction

### 3 problemes identifies

**1. Toasts (sonner) apparaissent en bas, sous la barre de navigation Android**
Le composant `Sonner` utilise la position par defaut (`bottom-right`). Sur APK, les toasts sont caches derriere la barre de navigation native.

**Correction** : Ajouter `position="top-center"` au composant `<Sonner>` dans `src/components/ui/sonner.tsx`.

**2. Permissions jamais demandees au premier lancement**
`requestAllPermissions()` est appelee dans le `useEffect` de `WelcomePage` avec un `setTimeout(800ms)`. Le probleme : sur Android, les demandes de permissions declenchees sans geste utilisateur direct sont souvent ignorees ou bloquees par le systeme. De plus, `window.hasOwnProperty("Capacitor")` peut etre `false` si Capacitor n'est pas encore initialise a 800ms.

**Correction** : Supprimer l'appel automatique dans `useEffect` de `WelcomePage`. A la place, declencher `requestAllPermissions()` sur le clic du bouton "Continuer" (`onComplete`), **avant** de naviguer. Cela garantit un geste utilisateur direct, requis par Android 13+ pour les notifications.

**3. Sauvegarde et partage d'enregistrement echouent silencieusement**

- **Save** : `Directory.ExternalStorage` + path `Download/...` est bloque sur Android 10+ (scoped storage). L'erreur est attrapee par le catch exterieur mais le fallback browser (`<a>` download) ne fonctionne pas dans un WebView Capacitor.
- **Share** : Le path `Cache/${fileName}` cree un dossier `Cache` dans le cache (double imbrication). De plus, les erreurs dans `reader.onload` (async callback) ne sont pas attrapees par le try/catch externe, donc le partage echoue silencieusement.

**Corrections** :
- Save : utiliser `Directory.Documents` sans prefixe de sous-dossier
- Save : wrapper le contenu de `reader.onload` dans un try/catch avec `toast.error` en fallback
- Share : changer le path de `Cache/${fileName}` a juste `${fileName}` (le Directory.Cache suffit)
- Share : wrapper le contenu de `reader.onload` dans un try/catch

### Fichiers a modifier

| Fichier | Modification |
|---|---|
| `src/components/ui/sonner.tsx` | Ajouter `position="top-center"` au composant Sonner |
| `src/pages/WelcomePage.tsx` | Supprimer le useEffect de permissions, appeler `requestAllPermissions()` dans le handler du bouton Continuer |
| `src/components/FullScreenPlayer.tsx` | Fix save (Documents, try/catch dans onload), fix share (path + try/catch dans onload), augmenter padding bas a `+6rem` |

