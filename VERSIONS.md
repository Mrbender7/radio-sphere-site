# RadioSphere — Historique des versions

---

## v1.1.3 — 9 mars 2026 — *Fix double-clic pause, redémarrage auto, boutons navigation*

**Statut :** En préparation  
**Package :** `com.fhm.radiosphere`  
**Plateforme :** Android (Capacitor)

### Corrections

#### Double-clic nécessaire pour mettre en pause (écran de verrouillage / dynamic content)
- 🐛 Le bouton pause nécessitait 2 appuis depuis l'écran de verrouillage ou le dynamic content Android
- 🔧 Cause : `keepAlive` (visibilitychange) et les handlers `stalled`/`ended` relançaient la lecture avant que la pause ne soit prise en compte
- ✅ Fix : ajout d'un `pausedAtRef` (timestamp) enregistré à chaque pause intentionnelle ; `keepAlive`, `handleStalled` et `handleEnded` ignorent les relances si une pause a eu lieu dans les 2-3 dernières secondes

#### Station redémarre après mise en arrière-plan
- 🐛 Après une pause manuelle, réduire/ramener l'app provoquait un redémarrage automatique 2-3s plus tard
- 🔧 Cause : les timers de retry (`stalled`/`ended`) et `keepAlive` ne tenaient pas compte d'une pause récente
- ✅ Fix : garde `pausedAtRef` dans `keepAlive` (2s), `handleStalled` (3s) et `handleEnded` (3s) + double vérification dans les callbacks de retry

#### Boutons de navigation inutiles sur le lecteur de l'écran de verrouillage
- 🐛 Les boutons avant/arrière et précédent/suivant apparaissaient sur le dynamic content et l'écran de verrouillage
- 🔧 Cause : `seekbackward`/`seekforward` avaient un handler `noop` qui activait les boutons ; `previoustrack`/`nexttrack` n'étaient pas désactivés
- ✅ Fix : tous les handlers inutiles (`seekbackward`, `seekforward`, `previoustrack`, `nexttrack`) passés à `null` pour les masquer

### Fichiers modifiés
- `src/contexts/PlayerContext.tsx` — pausedAtRef, gardes keepAlive/stalled/ended, handlers MediaSession null

---

## v1.1.2 — 9 mars 2026 — *Correctif écran de verrouillage + nettoyage artwork*

**Statut :** En préparation  
**Package :** `com.fhm.radiosphere`  
**Plateforme :** Android (Capacitor)

### Corrections

#### Mini-player / contenu dynamique disparu sur écran de verrouillage
- 🐛 Les contrôles de l'écran de verrouillage disparaissaient après une interaction play/pause via la notification native
- 🔧 Cause : `handlePlay` et `handlePause` (callbacks MediaSession + notification native `mediaToggle`) ne mettaient pas à jour `navigator.mediaSession.playbackState` ni ne rafraîchissaient le `MediaMetadata` via `updateMediaSession()`
- ✅ Fix : ajout explicite de `navigator.mediaSession.playbackState` et appel à `updateMediaSession()` dans les deux handlers

### Nettoyage

#### Suppression complète du cache artwork
- 🗑️ Suppression du hook `useArtworkCache.ts` (scan artwork, remplacement basse qualité)
- 🗑️ Suppression de `updateFavorite` dans `useFavorites.ts` et `FavoritesContext.tsx`
- 🗑️ Suppression du toggle "Remplacer les artworks basse qualité" dans `SettingsPage.tsx`
- 🗑️ Suppression des clés i18n `settings.replaceLowQuality` et `settings.replaceLowQualityDesc` (5 langues)
- `SmartArtwork.tsx` simplifié : URL directe + fallback `onError` sur placeholder

#### Nettoyage i18n
- 🗑️ Suppression des clés i18n orphelines `favorites.purgeArtworkCache` (5 langues)

### Fichiers modifiés
- `src/contexts/PlayerContext.tsx` — correctif MediaSession
- `src/components/SmartArtwork.tsx` — simplification
- `src/pages/SettingsPage.tsx` — suppression toggle artwork
- `src/contexts/FavoritesContext.tsx` — suppression `updateFavorite`
- `src/hooks/useFavorites.ts` — suppression `updateFavorite`
- `src/i18n/translations.ts` — suppression clés obsolètes

### Fichiers supprimés
- `src/hooks/useArtworkCache.ts`

---

## v1.1.1 — 7 mars 2026 — *Fix pause & auto-restart*

**Statut :** En préparation  
**Package :** `com.fhm.radiosphere`  
**Plateforme :** Android (Capacitor)

### Corrections

#### Bouton pause non réactif sur contenu dynamique
- 🐛 Le bouton pause nécessitait 2 appuis lors de la bascule entre contenu dynamique et l'app
- 🔧 Cause : `isPlayingRef` était mis à jour de façon asynchrone via `useEffect`, créant une fenêtre de race condition où le handler `keepAlive` relançait la lecture
- ✅ Fix : mise à jour synchrone de `isPlayingRef.current` dans `handlePlay`, `handlePause`, `togglePlay` et `reloadStream`

#### Station se relance après mise en arrière-plan
- 🐛 Après une pause manuelle, réduire l'app provoquait un redémarrage automatique de la station quelques secondes plus tard
- 🔧 Cause : le listener `keepAlive` se déclenchait sur les événements `blur`/`visibilitychange` et relançait `audio.play()` car le ref était encore à `true`
- ✅ Fix : suppression des listeners `blur` et `focus`, `keepAlive` ne reprend la lecture que lors du retour au premier plan (`visibilityState === 'visible'`)

### Fichier modifié
- `src/contexts/PlayerContext.tsx`

---

## v1.1.0 — 7 mars 2026 — *Google Play Billing + Fin période de test*

**Statut :** En préparation  
**Package :** `com.fhm.radiosphere`  
**Plateforme :** Android (Capacitor)

### Changements

#### Google Play Billing
- 💳 Intégration Google Play Billing Library 6.1.0 (achat unique "Premium Lifetime" à 9,99€)
- 🔄 Bouton "Restaurer les achats" fonctionnel (page Premium + Réglages)
- 🔐 `PremiumContext` vérifie le statut d'achat réel au démarrage via `BillingPlugin`
- 🌐 Fallback web : mode mot de passe conservé pour le debug en preview Lovable
- ⏱️ Indicateur de chargement pendant la vérification du statut d'achat

#### Fin de la période de test
- `isPremium` n'est plus initialisé à `true` par défaut
- Les fonctionnalités Premium sont verrouillées jusqu'à achat réel ou restauration

#### Nouveau plugin natif
- `BillingPlugin.java` : `queryPurchases()`, `purchasePremium()`, `restorePurchases()`
- Acknowledge automatique des achats (requis Google Play)
- Produit in-app : `premium_lifetime` (type INAPP, achat unique)

#### Script de build
- Nouveau `radiosphere_v1_1_0.ps1` avec :
  - Dossier de destination `radiosphere-1.1.0` (remplace `remix-of-radio-sphere`)
  - Dépendance Gradle `com.android.billingclient:billing:6.1.0`
  - Génération de `BillingPlugin.java`
  - Enregistrement dans `MainActivity.java`

#### UI
- `PremiumPage` : bouton unique "Achat unique — 9,99€" (plus de monthly/yearly)
- `SettingsPage` : version affichée `v1.1`

### Configuration Play Console requise

1. **Produits internes** → Créer un produit géré :
   - ID : `premium_lifetime`
   - Type : Achat unique
   - Prix : 9,99€
   - Description : "Accès Premium à vie — toutes les fonctionnalités"

---

## v1.0.0 — 7 mars 2026 — *Première release Google Play*

**Statut :** En cours d'examen sur Google Play  
**Package :** `com.fhm.radiosphere`  
**Plateforme :** Android (Capacitor)

### Résumé

RadioSphere est une application de radio en streaming qui permet d'écouter des milliers de stations du monde entier via l'API Radio Browser. L'app propose une expérience immersive avec un lecteur plein écran, un visualiseur audio, la gestion des favoris, un historique d'écoute, et des fonctionnalités premium comme Android Auto, Chromecast et un Sleep Timer.

### Fonctionnalités

#### Core
- 🎵 Lecture radio en streaming (API Radio Browser — 30 000+ stations)
- 🔍 Recherche avancée multi-filtres (nom, genre, pays, langue)
- ❤️ Favoris avec stockage local persistant
- 🕐 Historique des stations récemment écoutées
- 🌍 Interface multilingue (FR, EN, ES, DE, JA)
- 🎨 Thème sombre natif
- 🏠 Page d'accueil avec Top Stations, découvertes hebdomadaires, récents et favoris

#### Lecteur
- MiniPlayer avec défilement marquee à vitesse constante (40px/s)
- FullScreenPlayer avec visualiseur audio animé
- Tags cliquables (lancement de recherche filtrée)
- Contrôle du volume
- Indicateur de buffering en temps réel
- Partage de station

#### Premium
- 🚗 Android Auto (browse tree, recherche vocale, ExoPlayer natif, navigation next/previous)
- 📺 Chromecast (Google Cast SDK natif, Default Media Receiver)
- 💤 Sleep Timer (15 min à 2h, décompte temps réel)
- 📖 Mode d'emploi intégré (UserGuideModal)

#### Android natif
- Notification MediaStyle (contrôles play/pause/stop sur écran de verrouillage)
- Gestion AudioFocus (pause automatique lors d'appels)
- Foreground Service pour lecture en arrière-plan
- Bouton retour natif avec dialogue de confirmation de sortie

### Technologies

| Catégorie | Technologie |
|-----------|-------------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| UI | Tailwind CSS 3 + shadcn/ui + Radix UI |
| État | React Context (Player, Favorites, Language, Premium, SleepTimer) |
| Cache API | TanStack React Query 5 |
| Routing | React Router DOM 6 |
| Natif | Capacitor 8 (Android) |
| Audio Android | ExoPlayer (Android Auto) |
| Cast | Google Cast SDK (Chromecast) |
| Billing | Google Play Billing Library 6.1.0 (v1.1.0+) |
| Icônes | Lucide React + Iconify |
| Animations | CSS Keyframes + Audio Visualizer canvas |

---

*Les versions suivantes seront documentées ici au fil des mises à jour.*
