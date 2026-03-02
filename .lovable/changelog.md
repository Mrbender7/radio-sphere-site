# RadioSphere — Changelog / Historique du projet

> Ce fichier documente l'historique des modifications du projet RadioSphere depuis sa création.
> Mis à jour manuellement à chaque session de développement.

---

## v2.5.x — Session en cours (Mars 2026)

### Améliorations récentes (session active)
- **Tags cliquables dans le FullScreenPlayer** : Cliquer sur un tag d'une station lance automatiquement une recherche filtrée sur ce tag (sans autre filtre actif)
- **Vitesse de défilement constante du titre (MiniPlayer)** : Le marquee du titre utilise désormais une vitesse constante de 40px/s au lieu d'une durée fixe (les titres longs ne défilent plus trop vite)
- **Détection d'overflow améliorée (MiniPlayer)** : La zone de défilement du titre est correctement limitée à l'espace visible (entre le logo et les contrôles), le texte défile uniquement quand il dépasse réellement

---

## v2.4.8 — Stream fixes + Top Stations + Error feedback
- Correction de la résolution des flux audio (User-Agent, Content-Type detection)
- Ajout de la section "Top Stations" sur la page d'accueil
- Retour visuel amélioré en cas d'erreur de lecture
- Script de build Android : `radiosphere_v2_4_8.ps1`

## v2.4.0 — Chromecast fiabilisé + Android Auto
- Chromecast : correction de `requestSession`, bridge SDK, fallback UI
- Stabilisation de l'intégration Android Auto
- Script de build Android : `radiosphere_v2_4_0.ps1`

## v2.3.0 — Chromecast natif + Android Auto fixes
- Intégration du plugin Chromecast natif (Google Cast SDK)
- Corrections Android Auto : résolution de stream, artwork local
- Composant `CastButton.tsx` pour l'UI Chromecast
- Cast receiver HTML (`public/cast-receiver.html`)
- Script de build Android : `radiosphere_v2_3_0.ps1`

## v2.2.9 — MediaStyle Lock Screen Notification
- Notification MediaStyle pour contrôles sur écran de verrouillage
- Boutons play/pause/stop sur la notification Android
- Script de build Android : `radiosphere_v2_2_9.ps1`

## v2.2.8 — AudioFocus + Notification Buttons + Audit Fixes
- Gestion de l'AudioFocus Android (pause auto lors d'appels, etc.)
- Boutons de contrôle sur la notification
- Corrections suite à l'audit Google Play :
  - Lien politique de confidentialité sur WelcomePage
  - Chromecast ajouté aux features Premium visibles
  - Mise à jour du numéro de version affiché
- Ajout du mode d'emploi intégré (UserGuideModal)
- Script de build Android : `radiosphere_v2_2_8.ps1`

## v2.2.5 — Android Auto Integration
- Intégration complète Android Auto :
  - Browse tree (Favoris, Récents, Genres)
  - Recherche vocale
  - Lecture native ExoPlayer
  - Artwork plein écran
  - Navigation next/previous dans les favoris
- Plugin `RadioAutoPlugin.ts` + fichiers Java natifs (`android-auto/`)
- Script de build Android : `radiosphere_v2_2_5.ps1`

## v2.2.4 — Media Session + No Badge + No Buttons
- Intégration Media Session API pour contrôles système
- Suppression du badge de notification
- Nettoyage des boutons de notification
- Script de build Android : `radiosphere_v2_2_4.ps1`

## v2.2.3 — JS Notification Channel + Native Back Button
- Canal de notification JavaScript pour le foreground service
- Gestion native du bouton retour Android (`@capacitor/app`)
- Dialogue de confirmation de sortie (`ExitConfirmDialog`)
- Script de build Android : `radiosphere_v2_2_3.ps1`

## v2.2.2 — Android Only + Silent Notification Channel
- Première version Android avec Capacitor
- Canal de notification silencieux pour le service de lecture en arrière-plan
- Configuration Capacitor initiale (`com.radiosphere.app`)
- Foreground service (`@capawesome-team/capacitor-android-foreground-service`)
- Script de build Android : `radiosphere_v2_2_2.ps1`

---

## Fonctionnalités principales du projet

### Core
- 🎵 Lecteur radio en streaming (API Radio Browser)
- 🔍 Recherche avancée (par nom, genre, pays, langue)
- ❤️ Favoris avec stockage local
- 🕐 Historique des stations récentes
- 🌍 Multilingue (FR, EN, ES, DE, JA)
- 🎨 Thème sombre

### Player
- MiniPlayer avec marquee à vitesse constante
- FullScreenPlayer avec visualiseur audio, tags cliquables, partage, favoris
- Contrôle du volume
- Indicateur de buffering

### Premium
- 🚗 Android Auto (browse tree, recherche vocale, ExoPlayer)
- 📺 Chromecast (Google Cast SDK natif)
- 💤 Sleep Timer (15min à 2h, décompte temps réel)
- 📖 Mode d'emploi intégré

### Technique
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Capacitor pour le build Android natif
- React Query pour le cache API
- Contexts : Player, Favorites, Language, Premium, SleepTimer

---

## Structure des fichiers clés

| Fichier | Description |
|---------|-------------|
| `src/pages/Index.tsx` | Page principale, orchestration des onglets |
| `src/pages/HomePage.tsx` | Accueil (récents, favoris, découvertes) |
| `src/pages/SearchPage.tsx` | Recherche avancée multi-filtres |
| `src/pages/LibraryPage.tsx` | Bibliothèque de favoris |
| `src/pages/SettingsPage.tsx` | Réglages, premium, sleep timer |
| `src/components/MiniPlayer.tsx` | Lecteur réduit en bas d'écran |
| `src/components/FullScreenPlayer.tsx` | Lecteur plein écran |
| `src/components/AudioVisualizer.tsx` | Animation audio |
| `src/contexts/PlayerContext.tsx` | État global du lecteur |
| `src/contexts/FavoritesContext.tsx` | Gestion des favoris |
| `src/services/RadioService.ts` | Service API Radio Browser |
| `src/i18n/translations.ts` | Traductions multilingues |
| `docs/PREMIUM_ROADMAP.md` | Roadmap des fonctionnalités premium |
